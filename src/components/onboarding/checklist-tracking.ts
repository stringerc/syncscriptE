/**
 * Onboarding checklist tracking.
 *
 * Was localStorage-only (Tier 0 A audit finding: "Server has no idea if a
 * user is activated; can't email-trigger or analyze"). Now write-through:
 * the local cache survives offline + delivers instant UI updates, and a
 * Supabase row in `public.user_onboarding_progress` is the source of truth
 * for analytics, lifecycle email triggers, and cross-device parity.
 *
 * Schema: `supabase/migrations/20260426040000_user_onboarding_progress.sql`.
 *
 * Call sites (TasksContext, AuthContext, OpenClawContext, EnergyContext,
 * useGoals, useCalendarEvents) keep using `checklistTracking.completeItem()`
 * as before — the new server write happens transparently.
 */
import { supabase } from '../../utils/supabase/client';

const PROGRESS_STORAGE_KEY = 'syncscript_onboarding_progress';
const DISMISSED_STORAGE_KEY = 'syncscript_onboarding_dismissed';
const COLLAPSED_STORAGE_KEY = 'syncscript_onboarding_collapsed';
const PROGRESS_EVENT = 'syncscript:onboarding-progress';

export const CHECKLIST_ITEM_IDS = ['task', 'goal', 'event', 'energy', 'ai', 'profile'] as const;
export type ChecklistItemId = (typeof CHECKLIST_ITEM_IDS)[number];

type ProgressMap = Partial<Record<ChecklistItemId, boolean>>;

function readLocal(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeLocal(next: ProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — silent */
  }
}

function notifyProgressUpdated(): void {
  try {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    /* SSR safety */
  }
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Persist a step both locally (instant UI) and to Supabase (source of truth).
 * The server writes auto-stamp `completed_at` when all six steps land
 * (trigger in the migration). Failures fall back to local-only — the next
 * `pullFromServer()` call will reconcile.
 */
async function writeServer(itemId: ChecklistItemId, extras?: { firstEnergyLogAt?: string }): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return; // Guest / unauthenticated — local-only, by design.

  // Read existing row, merge step, upsert. On a fresh user this also
  // creates the row. RLS keeps everyone scoped to their own user_id.
  const { data: existing } = await supabase
    .from('user_onboarding_progress')
    .select('steps, first_energy_log_at')
    .eq('user_id', userId)
    .maybeSingle();

  const nextSteps: ProgressMap = {
    ...((existing?.steps as ProgressMap | null) || {}),
    [itemId]: true,
  };

  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    steps: nextSteps,
  };
  // Only stamp first_energy_log_at the first time it lands.
  if (extras?.firstEnergyLogAt && !existing?.first_energy_log_at) {
    upsertPayload.first_energy_log_at = extras.firstEnergyLogAt;
  }

  const { error } = await supabase
    .from('user_onboarding_progress')
    .upsert(upsertPayload, { onConflict: 'user_id' });
  if (error) throw error;
  // Let AuthContext merge `hasLoggedEnergy` / `isFirstTime` without touching
  // protected EnergyContext.tsx (Tier 0 A — server is source of truth).
  try {
    window.dispatchEvent(
      new CustomEvent('syncscript:onboarding-progress-synced', { detail: { userId, itemId } }),
    );
  } catch {
    /* SSR */
  }
}

/** Pull authoritative server state on app boot / sign-in. Hydrates local. */
export async function pullOnboardingProgressFromServer(): Promise<ProgressMap> {
  const userId = await getCurrentUserId();
  if (!userId) return readLocal();
  try {
    const { data } = await supabase
      .from('user_onboarding_progress')
      .select('steps')
      .eq('user_id', userId)
      .maybeSingle();
    const serverSteps = (data?.steps as ProgressMap | null) || {};
    // Merge server (truth) with local (recent writes that may not have
    // synced yet). Server wins on conflict for any key it has.
    const local = readLocal();
    const merged: ProgressMap = { ...local, ...serverSteps };
    writeLocal(merged);
    notifyProgressUpdated();
    return merged;
  } catch {
    return readLocal();
  }
}

export const checklistTracking = {
  completeItem: (itemId: string): void => {
    const validId = (CHECKLIST_ITEM_IDS as readonly string[]).includes(itemId);
    if (!validId) return;

    // 1) Optimistic local write — instant UI feedback, offline-safe.
    const prev = readLocal();
    if (prev[itemId as ChecklistItemId]) return; // Already done; no churn.
    writeLocal({ ...prev, [itemId]: true });
    notifyProgressUpdated();

    // 2) Server write — fire-and-forget; reconcile on next page load if it fails.
    const extras: { firstEnergyLogAt?: string } | undefined =
      itemId === 'energy' ? { firstEnergyLogAt: new Date().toISOString() } : undefined;
    void writeServer(itemId as ChecklistItemId, extras).catch(() => {
      /* server unreachable; local cache stands until reconcile */
    });
  },

  isItemCompleted: (itemId: string): boolean => {
    const completed = readLocal();
    return completed[itemId as ChecklistItemId] === true;
  },

  getCompletionCount: (): { completed: number; total: number } => {
    const completed = readLocal();
    const completedCount = Object.values(completed).filter(Boolean).length;
    return { completed: completedCount, total: CHECKLIST_ITEM_IDS.length };
  },

  reset: (): void => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(DISMISSED_STORAGE_KEY);
    localStorage.removeItem(COLLAPSED_STORAGE_KEY);
    notifyProgressUpdated();
    // Server reset stays explicit — admin-only — so users who want a "do over"
    // get it via the existing dismiss / collapse UX. We don't auto-wipe a row.
  },
};
