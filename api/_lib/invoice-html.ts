/**
 * Premium HTML invoice email generator — Stripe/Square-quality formatting.
 * Inline CSS only (email client safe). Responsive for mobile.
 */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  fromName: string;
  fromEmail?: string;
  toName?: string;
  toEmail: string;
  items: InvoiceItem[];
  taxPercent?: number;
  notes?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentUrl?: string;
  trackingPixelUrl?: string;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;line-height:1.5;">
        ${esc(item.description)}
      </td>
      <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:right;">
        ${fmt(item.unit_price)}
      </td>
      <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;text-align:right;font-weight:600;">
        ${fmt(item.quantity * item.unit_price)}
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">INVOICE</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${esc(data.invoiceNumber)}</div>
          </td>
          <td align="right">
            <div style="font-size:13px;color:#94a3b8;">Date</div>
            <div style="font-size:14px;color:#e2e8f0;font-weight:500;">${esc(data.date)}</div>
            ${data.dueDate ? `<div style="font-size:13px;color:#94a3b8;margin-top:8px;">Due Date</div><div style="font-size:14px;color:#e2e8f0;font-weight:500;">${esc(data.dueDate)}</div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- From / To -->
  <tr>
    <td style="padding:28px 40px;border-bottom:1px solid #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" valign="top">
            <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">From</div>
            <div style="font-size:15px;font-weight:600;color:#0f172a;">${esc(data.fromName)}</div>
            ${data.fromEmail ? `<div style="font-size:13px;color:#64748b;margin-top:2px;">${esc(data.fromEmail)}</div>` : ''}
          </td>
          <td width="50%" valign="top">
            <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Bill To</div>
            <div style="font-size:15px;font-weight:600;color:#0f172a;">${esc(data.toName || data.toEmail)}</div>
            ${data.toName ? `<div style="font-size:13px;color:#64748b;margin-top:2px;">${esc(data.toEmail)}</div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Line Items Table -->
  <tr>
    <td style="padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <thead>
          <tr>
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #e2e8f0;">Description</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #e2e8f0;">Qty</th>
            <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #e2e8f0;">Unit Price</th>
            <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #e2e8f0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </td>
  </tr>

  <!-- Totals -->
  <tr>
    <td style="padding:24px 40px 0;">
      <table width="280" cellpadding="0" cellspacing="0" align="right">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">Subtotal</td>
          <td style="padding:8px 0;font-size:14px;color:#334155;text-align:right;font-weight:500;">${fmt(data.subtotal)}</td>
        </tr>
        ${data.taxPercent ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">Tax (${data.taxPercent}%)</td>
          <td style="padding:8px 0;font-size:14px;color:#334155;text-align:right;font-weight:500;">${fmt(data.taxAmount)}</td>
        </tr>` : ''}
        <tr>
          <td colspan="2" style="border-top:2px solid #0f172a;padding:0;"></td>
        </tr>
        <tr>
          <td style="padding:14px 0;font-size:18px;font-weight:700;color:#0f172a;">Total Due</td>
          <td style="padding:14px 0;font-size:18px;font-weight:700;color:#0f172a;text-align:right;">${fmt(data.total)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Notes -->
  ${data.notes ? `
  <tr>
    <td style="padding:24px 40px 0;">
      <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;border-left:3px solid #6366f1;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Notes</div>
        <div style="font-size:13px;color:#475569;line-height:1.6;">${esc(data.notes)}</div>
      </div>
    </td>
  </tr>` : ''}

  ${data.paymentUrl ? `
  <!-- Pay Now Button -->
  <tr>
    <td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${esc(data.paymentUrl)}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 48px;border-radius:8px;letter-spacing:0.01em;box-shadow:0 2px 8px rgba(99,102,241,0.3);">
              Pay ${fmt(data.total)} Now
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:10px;">
            <div style="font-size:12px;color:#94a3b8;">Secure payment via Stripe</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- Footer -->
  <tr>
    <td style="padding:32px 40px;margin-top:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-top:1px solid #f1f5f9;padding-top:20px;">
            <div style="font-size:12px;color:#94a3b8;line-height:1.6;">
              This invoice was generated and sent via <span style="color:#6366f1;font-weight:500;">SyncScript</span>.
              If you have questions about this invoice, reply to this email.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
${data.trackingPixelUrl ? `<img src="${esc(data.trackingPixelUrl)}" width="1" height="1" style="display:none;" alt="" />` : ''}
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
