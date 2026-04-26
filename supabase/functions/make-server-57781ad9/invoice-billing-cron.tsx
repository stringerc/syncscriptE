/**
 * Internal cron: overdue invoices, payment reminders, recurring invoice dispatch,
 * optional collection-call queue (KV phone queue — same shape as Vercel nexus_scheduled_phone_calls).
 */
import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const INVOICES_PREFIX = "invoices:v1:";
const RECURRING_PREFIX = "recurring_invoices:v1:";
const PHONE_QUEUE_KEY = "nexus_scheduled_phone_calls";

export type InvoiceRecordCron = {
  id: string;
  status: "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  to_email: string;
  to_name?: string;
  items: { description: string; quantity: number; unit_price: number }[];
  subtotal: number;
  tax_percent?: number;
  tax_amount: number;
  total: number;
  notes?: string;
  due_date?: string;
  created_at: string;
  paid_at?: string;
  viewed_at?: string;
  stripe_payment_link?: string;
  stripe_session_id?: string;
  resend_email_id?: string;
  _userId?: string;
  reminder_count?: number;
  last_reminder_at?: string;
  to_phone?: string;
  collection_call_consent?: boolean;
  last_collection_call_at?: string;
};

export type RecurringInvoiceSchedule = {
  id: string;
  enabled: boolean;
  cadence: "weekly" | "monthly" | "quarterly";
  next_run_at: string;
  template: {
    to_email: string;
    to_name?: string;
    items: { description: string; quantity: number; unit_price: number }[];
    tax_percent?: number;
    notes?: string;
    due_days_offset?: number;
  };
  last_run_at?: string;
};

type ScheduledPhoneCallJob = {
  id: string;
  phoneNumber: string;
  scheduledAt: string;
  briefingType: string;
  userEmail?: string;
  userId?: string;
  invoiceId?: string;
  amountDisplay?: string;
};

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function daysBetweenUtc(a: Date, b: Date): number {
  const ms = startOfUtcDay(a).getTime() - startOfUtcDay(b).getTime();
  return Math.floor(ms / 86400000);
}

function reminderTierDays(reminderCount: number): number {
  const tiers = [3, 7, 14];
  return tiers[Math.min(reminderCount, tiers.length - 1)] ?? 14;
}

function buildReminderHtml(inv: InvoiceRecordCron, daysOverdue: number): string {
  const pay =
    inv.stripe_payment_link ?
      `<p style="margin:16px 0"><a href="${inv.stripe_payment_link}" style="background:#6366f1;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Pay now</a></p>`
    : "";
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 8px">Payment reminder — Invoice ${inv.id}</h2>
  <p style="color:#444">This invoice is <strong>${daysOverdue} day(s)</strong> past due.</p>
  <p>Amount due: <strong>$${inv.total.toFixed(2)}</strong></p>
  ${pay}
  <p style="font-size:13px;color:#666">If you already paid, thank you — you can ignore this message.</p>
  </body></html>`;
}

async function sendResendReminder(to: string, subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "SyncScript Invoicing <invoices@syncscript.app>",
      to: [to],
      subject,
      html,
    }),
  });
  return r.ok;
}

function supabaseFunctionsOrigin(): string {
  const u = Deno.env.get("SUPABASE_URL") || "";
  return u.replace(/\/$/, "") + "/functions/v1/make-server-57781ad9";
}

async function createStripeInvoiceSession(params: {
  invoice_id: string;
  amount_cents: number;
  customer_email: string;
  user_id: string;
  description: string;
}): Promise<{ url?: string; session_id?: string }> {
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const url = `${supabaseFunctionsOrigin()}/stripe/create-invoice-payment`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(anon ? { Authorization: `Bearer ${anon}`, apikey: anon } : {}),
    },
    body: JSON.stringify({
      invoice_id: params.invoice_id,
      amount_cents: params.amount_cents,
      customer_email: params.customer_email,
      user_id: params.user_id,
      description: params.description,
    }),
  });
  if (!r.ok) return {};
  return (await r.json()) as { url?: string; session_id?: string };
}

async function appendPhoneQueue(job: ScheduledPhoneCallJob): Promise<void> {
  const raw = await kv.get(PHONE_QUEUE_KEY);
  const list: ScheduledPhoneCallJob[] = Array.isArray(raw) ? raw : [];
  list.push(job);
  await kv.set(PHONE_QUEUE_KEY, list);
}

function nextRecurringDate(from: Date, cadence: RecurringInvoiceSchedule["cadence"]): Date {
  const d = new Date(from.getTime());
  if (cadence === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else if (cadence === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 3);
  return d;
}

export function registerInvoiceBillingCron(app: Hono): void {
  app.post("/internal/cron/billing-tick", async (c) => {
    const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
    const hdr = c.req.header("x-nexus-internal-secret");
    if (!secret || hdr !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const now = new Date();
    let markedOverdue = 0;
    let remindersSent = 0;
    let collectionQueued = 0;
    let recurringDispatched = 0;

    const rows = await kv.getKeyValueByPrefix(INVOICES_PREFIX);

    for (const row of rows) {
      const userId = row.key.replace(INVOICES_PREFIX, "");
      if (!userId || !Array.isArray(row.value)) continue;

      const invoices = row.value as InvoiceRecordCron[];
      let changed = false;

      for (let i = 0; i < invoices.length; i++) {
        const inv = invoices[i];
        if (inv.status === "paid" || inv.status === "cancelled") continue;

        if (!inv._userId) {
          inv._userId = userId;
          changed = true;
        }

        const due = inv.due_date ? new Date(inv.due_date) : null;
        const todayStart = startOfUtcDay(now);

        if (
          due &&
          startOfUtcDay(due).getTime() < todayStart.getTime() &&
          (inv.status === "sent" || inv.status === "viewed")
        ) {
          inv.status = "overdue";
          markedOverdue++;
          changed = true;
        }

        if (inv.status !== "overdue" || !due) continue;

        const daysOverdue = Math.max(0, daysBetweenUtc(now, startOfUtcDay(due)));
        const rc = inv.reminder_count ?? 0;

        if (rc < 3) {
          const tierThreshold = reminderTierDays(rc);
          if (daysOverdue >= tierThreshold) {
            const last = inv.last_reminder_at ? new Date(inv.last_reminder_at) : null;
            const sameDay =
              last &&
              last.getUTCFullYear() === now.getUTCFullYear() &&
              last.getUTCMonth() === now.getUTCMonth() &&
              last.getUTCDate() === now.getUTCDate();
            if (!sameDay) {
              const html = buildReminderHtml(inv, daysOverdue);
              const ok = await sendResendReminder(
                inv.to_email,
                `Reminder: Invoice ${inv.id} is overdue`,
                html,
              );
              if (ok) {
                inv.reminder_count = rc + 1;
                inv.last_reminder_at = now.toISOString();
                remindersSent++;
                changed = true;
              }
            }
          }
        }

        if (
          inv.collection_call_consent &&
          inv.to_phone &&
          /^\+[1-9]\d{8,14}$/.test(inv.to_phone.trim()) &&
          (inv.reminder_count ?? 0) >= 2
        ) {
          const lastCol = inv.last_collection_call_at ? new Date(inv.last_collection_call_at) : null;
          const daysSinceCol = lastCol ? daysBetweenUtc(now, lastCol) : 999;
          if (daysSinceCol >= 7) {
            await appendPhoneQueue({
              id: `coll_${inv.id}_${now.getTime()}`,
              phoneNumber: inv.to_phone.trim(),
              scheduledAt: new Date(now.getTime() + 60000).toISOString(),
              briefingType: "invoice-collection",
              userId: inv._userId || userId,
              invoiceId: inv.id,
              amountDisplay: `$${inv.total.toFixed(2)}`,
            });
            inv.last_collection_call_at = now.toISOString();
            collectionQueued++;
            changed = true;
          }
        }
      }

      if (changed) {
        await kv.set(row.key, invoices);
      }
    }

    const recRows = await kv.getKeyValueByPrefix(RECURRING_PREFIX);
    for (const row of recRows) {
      const uid = row.key.replace(RECURRING_PREFIX, "");
      if (!uid || !Array.isArray(row.value)) continue;
      const schedules = row.value as RecurringInvoiceSchedule[];
      let recChanged = false;

      for (let j = 0; j < schedules.length; j++) {
        const sch = schedules[j];
        if (!sch.enabled) continue;
        const next = new Date(sch.next_run_at);
        if (Number.isNaN(next.getTime()) || next.getTime() > now.getTime()) continue;

        const t = sch.template;
        const subtotal = t.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
        const taxAmount =
          t.tax_percent && t.tax_percent > 0 ?
            Math.round(subtotal * (t.tax_percent / 100) * 100) / 100
          : 0;
        const total = Math.round((subtotal + taxAmount) * 100) / 100;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const due = new Date(now);
        due.setUTCDate(due.getUTCDate() + (t.due_days_offset ?? 14));

        const stripe = await createStripeInvoiceSession({
          invoice_id: invoiceNumber,
          amount_cents: Math.round(total * 100),
          customer_email: t.to_email,
          user_id: uid,
          description: t.items.map((i) => i.description).join(", "),
        });

        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:24px"><h2>Invoice ${invoiceNumber}</h2><p>Total: $${total.toFixed(2)}</p>${
            stripe.url ? `<p><a href="${stripe.url}">Pay now</a></p>` : ""
          }</body></html>`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "SyncScript Invoicing <invoices@syncscript.app>",
              to: [t.to_email],
              subject: `Invoice ${invoiceNumber} — recurring`,
              html,
            }),
          });
        }

        const invKey = `${INVOICES_PREFIX}${uid}`;
        const existing = (await kv.get(invKey)) as InvoiceRecordCron[] | null;
        const list: InvoiceRecordCron[] = Array.isArray(existing) ? [...existing] : [];
        list.push({
          id: invoiceNumber,
          status: "sent",
          to_email: t.to_email,
          to_name: t.to_name,
          items: t.items,
          subtotal,
          tax_percent: t.tax_percent,
          tax_amount: taxAmount,
          total,
          notes: t.notes,
          due_date: due.toISOString(),
          created_at: now.toISOString(),
          stripe_payment_link: stripe.url,
          stripe_session_id: stripe.session_id,
          _userId: uid,
          reminder_count: 0,
        });
        await kv.set(invKey, list);

        sch.last_run_at = now.toISOString();
        sch.next_run_at = nextRecurringDate(now, sch.cadence).toISOString();
        recurringDispatched++;
        recChanged = true;
      }

      if (recChanged) {
        await kv.set(row.key, schedules);
      }
    }

    return c.json({
      ok: true,
      at: now.toISOString(),
      markedOverdue,
      remindersSent,
      collectionQueued,
      recurringDispatched,
    });
  });
}
