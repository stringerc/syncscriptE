import { useEffect, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { telemetryService as telemetry } from "@/services/telemetryService";
import { useToast } from "@/hooks/use-toast";

type Props = {
  eventId: string;
  eventVersion?: number;         // optional if you don't track versions
  enabled: boolean;              // feature flag: make_it_real
};

export function AplActionButton({ eventId, eventVersion = 1, enabled }: Props) {
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const checked = useRef(false);

  // Ghost "ready" probe (fast, non-blocking)
  useEffect(() => {
    if (!enabled || !eventId) return;
    if (checked.current) return;
    checked.current = true;

    const t0 = performance.now();
    const ctl = new AbortController();

    fetch(`/api/apl/ready?eventId=${encodeURIComponent(eventId)}`, {
      signal: ctl.signal,
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
        setReady(true);
        telemetry.recordEvent("ui.apl.ready_checked", {
          eventId,
          dt: Math.round(performance.now() - t0),
        });
      })
      .catch(() => {
        setReady(false);
        telemetry.recordEvent("ui.apl.ready_failed", {
          eventId,
          dt: Math.round(performance.now() - t0),
        });
      });

    return () => ctl.abort();
  }, [enabled, eventId]);

  async function onClick() {
    if (!eventId) return;
    setBusy(true);
    telemetry.recordEvent("ui.apl.suggest_clicked", { eventId });

    const idem = `evt:${eventId}:v${eventVersion}:ghost`;

    try {
      const res = await fetch(`/api/apl/suggest?eventId=${encodeURIComponent(eventId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idem,
        },
        credentials: "include",
        body: JSON.stringify({ max: 3, source: "ghost-ui" }),
      });

      if (res.ok) {
        toast({ title: "3 suggested holds ready", description: "Review them in your calendar." });
        telemetry.recordEvent("ui.apl.suggest_ok", { eventId });
      } else {
        toast({ title: "Could not suggest holds", variant: "destructive" });
        telemetry.recordEvent("ui.apl.suggest_fail", { eventId, status: res.status });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
      telemetry.recordEvent("ui.apl.suggest_err", { eventId });
    } finally {
      setBusy(false);
    }
  }

  if (!enabled || !eventId) return null;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl px-3 h-9
                 bg-neutral-100/60 border border-neutral-400/20
                 hover:border-neutral-400/30 focus:outline-none focus:shadow-glow
                 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Place tentative holds"
      onClick={onClick}
      disabled={busy || !ready}
      data-testid="apl-place-holds"
      title={ready ? "Place 3 holds" : "Checking availability…"}
    >
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      <span>{busy ? "Placing…" : "Place 3 holds"}</span>
    </button>
  );
}
