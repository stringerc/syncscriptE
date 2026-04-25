/**
 * Reactive boolean: does the current user have an agent run that's actively
 * occupying the screen? Used by AppAIPage to dock the voice portal to a small
 * top-left card while the agent works in the background.
 *
 * Returns the most-recent active run (status in queued/running/waiting_user/paused),
 * or null. The voice docking logic depends on this — when the run finishes
 * (or there are no active runs), the voice portal automatically expands back
 * to fullscreen.
 */
import { useMemo } from 'react';
import { useAgentRuns, type AgentRun } from './useAgentRuns';

const ACTIVE_STATUSES = new Set(['queued', 'running', 'waiting_user', 'paused']);

export function useActiveAgentRun(): AgentRun | null {
  const runsQ = useAgentRuns();
  return useMemo(() => {
    const runs = runsQ.data ?? [];
    return runs.find((r) => ACTIVE_STATUSES.has(r.status)) ?? null;
  }, [runsQ.data]);
}
