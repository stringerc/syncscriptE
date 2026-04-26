/**
 * Past-due / payment-failed banner.
 *
 * Tier 0 B audit fix: previously a Stripe `invoice.payment_failed` webhook
 * fired but no in-app surface ever changed; users kept using the app while
 * their card was rejected. This is the standard pattern Stripe / Linear /
 * Notion all use — a sticky non-blocking banner with a one-click path to
 * the Customer Portal where they can fix the card.
 *
 * Renders only when subscription.status is 'past_due', 'unpaid', or
 * 'incomplete' (matches the Stripe states that mean "we tried to charge
 * and failed"). Hidden in all other states so it doesn't appear during
 * happy-path / trial / cancelled.
 *
 * Mount near the App root or in DashboardLayout so authenticated users
 * always see it. Component is render-prop / lifecycle-only — zero CLS,
 * zero layout cost when subscription is healthy.
 */
import { useState } from 'react';
import { AlertCircle, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';

const PAST_DUE_STATES = new Set(['past_due', 'unpaid', 'incomplete', 'incomplete_expired']);

export function PastDueBanner(): JSX.Element | null {
  const { user } = useAuth();
  const { subscription, openCustomerPortal } = useStripe(user?.id);
  const [dismissed, setDismissed] = useState(false);

  if (!user?.id || dismissed) return null;
  const status = subscription?.status;
  if (!status || !PAST_DUE_STATES.has(status)) return null;

  const headline =
    status === 'past_due' || status === 'unpaid'
      ? 'Your last payment failed.'
      : status === 'incomplete'
      ? 'Payment is awaiting confirmation.'
      : 'Your subscription needs attention.';

  return (
    <div
      role="status"
      className="sticky top-0 z-[450] w-full border-b border-rose-500/30 bg-rose-950/80 backdrop-blur supports-[backdrop-filter]:bg-rose-950/60"
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-2 text-[12.5px] text-rose-100 sm:px-6">
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <span className="font-medium">{headline}</span>{' '}
          <span className="text-rose-200/85">
            Update your payment method to keep using paid features.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            openCustomerPortal().catch(() => {
              /* hook surfaces the error toast; we don't need to */
            });
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[11.5px] font-medium text-rose-50 hover:bg-rose-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          Update payment
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-rose-200/70 hover:bg-rose-500/15 hover:text-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
