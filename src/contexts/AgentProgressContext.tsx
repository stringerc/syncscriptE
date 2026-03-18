import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';
import { useGamification } from './GamificationContext';
import type {
  AgentAnimationTier,
  AgentAssignmentSignal,
  AgentProgressActivity,
  AgentProgressProfile,
  AgentProgressUnlock,
  AgentTaskCompletionSignal,
} from '../types/agent-progress';

type AgentRef = {
  id: string;
  name: string;
  role?: string;
  team?: string;
};

type AgentProgressContextValue = {
  getProfilesForWorkspace: (workspaceId: string, agents: AgentRef[]) => AgentProgressProfile[];
  getProfileForAgent: (workspaceId: string, agent: AgentRef) => AgentProgressProfile;
};

const AgentProgressContext = createContext<AgentProgressContextValue | null>(null);

const AGENT_PROGRESS_STORAGE_KEY = 'syncscript_agent_progress_v1';
const AUTH_USER_ID_STORAGE_KEY = 'syncscript_auth_user_id';

const XP_BY_PRIORITY: Record<string, number> = {
  urgent: 90,
  high: 60,
  medium: 35,
  low: 18,
};

function userScope(): string {
  const scopedUserId = localStorage.getItem(AUTH_USER_ID_STORAGE_KEY);
  return scopedUserId && scopedUserId.trim().length > 0 ? scopedUserId : 'anonymous-user';
}

function scopeKey(workspaceId: string): string {
  return `${userScope()}:${workspaceId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function computeXpToNextLevel(level: number): number {
  return Math.round(120 * Math.pow(1.16, Math.max(0, level - 1)));
}

function tierForLevel(level: number): AgentAnimationTier {
  if (level >= 12) return 'legendary';
  if (level >= 9) return 'orbit';
  if (level >= 6) return 'glow';
  if (level >= 4) return 'pulse';
  return 'base';
}

function defaultProfile(workspaceId: string, agent: AgentRef): AgentProgressProfile {
  return {
    agentId: agent.id,
    agentName: agent.name,
    workspaceId,
    level: 1,
    xp: 0,
    xpToNextLevel: computeXpToNextLevel(1),
    totalXpEarned: 0,
    animationTier: 'base',
    status: 'online',
    unlocks: [],
    stats: {
      assignments: 0,
      tasksCompleted: 0,
      goalsTouched: 0,
      highPriorityCompletions: 0,
      avgResonance: null,
      streakDays: 0,
      lastActiveAt: null,
    },
    activity: [],
    updatedAt: nowIso(),
  };
}

function parseAgentCandidates(values?: Array<Record<string, any>>): Array<{ id: string; name: string }> {
  if (!Array.isArray(values)) return [];
  const map = new Map<string, { id: string; name: string }>();

  values.forEach((candidate: any) => {
    const name = String(candidate?.name || '').trim();
    const id = String(candidate?.id || name || '').trim();
    const type = String(candidate?.collaboratorType || candidate?.role || '').toLowerCase();
    const looksLikeAgent =
      type === 'agent'
      || Boolean(candidate?.isExternalAgent)
      || id.toLowerCase().includes('agent')
      || name.toLowerCase().includes('agent');
    if (!looksLikeAgent || !id || !name) return;
    if (!map.has(id)) {
      map.set(id, { id, name });
    }
  });

  return Array.from(map.values());
}

function appendActivity(profile: AgentProgressProfile, event: AgentProgressActivity): AgentProgressProfile {
  return {
    ...profile,
    activity: [event, ...profile.activity].slice(0, 60),
  };
}

function ensureUnlock(
  profile: AgentProgressProfile,
  unlock: Omit<AgentProgressUnlock, 'unlockedAt'>,
): AgentProgressProfile {
  if (profile.unlocks.some((item) => item.id === unlock.id)) return profile;
  return {
    ...profile,
    unlocks: [
      {
        ...unlock,
        unlockedAt: nowIso(),
      },
      ...profile.unlocks,
    ],
  };
}

function reduceWithXp(
  profile: AgentProgressProfile,
  xpGain: number,
): { next: AgentProgressProfile; leveledUp: boolean } {
  let level = profile.level;
  let xp = profile.xp + Math.max(0, Math.round(xpGain));
  let xpToNextLevel = profile.xpToNextLevel || computeXpToNextLevel(level);
  let leveledUp = false;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = computeXpToNextLevel(level);
    leveledUp = true;
  }

  const next: AgentProgressProfile = {
    ...profile,
    level,
    xp,
    xpToNextLevel,
    totalXpEarned: profile.totalXpEarned + Math.max(0, Math.round(xpGain)),
    animationTier: tierForLevel(level),
  };

  return { next, leveledUp };
}

export function AgentProgressProvider({ children }: { children: ReactNode }) {
  const gamification = useGamification();
  const [profilesByScope, setProfilesByScope] = useState<Record<string, AgentProgressProfile[]>>(() => {
    try {
      const stored = localStorage.getItem(AGENT_PROGRESS_STORAGE_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored) as Record<string, AgentProgressProfile[]>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(AGENT_PROGRESS_STORAGE_KEY, JSON.stringify(profilesByScope));
  }, [profilesByScope]);

  const upsertProfiles = useCallback(
    (workspaceId: string, agents: AgentRef[]) => {
      const key = scopeKey(workspaceId);
      setProfilesByScope((prev) => {
        const current = prev[key] || [];
        const map = new Map(current.map((entry) => [entry.agentId, entry]));
        let changed = false;

        agents.forEach((agent) => {
          const existing = map.get(agent.id);
          if (!existing) {
            map.set(agent.id, defaultProfile(workspaceId, agent));
            changed = true;
            return;
          }
          if (existing.agentName !== agent.name) {
            map.set(agent.id, { ...existing, agentName: agent.name, updatedAt: nowIso() });
            changed = true;
          }
        });

        if (!changed) return prev;
        return {
          ...prev,
          [key]: Array.from(map.values()),
        };
      });
    },
    [],
  );

  const applyAssignmentSignal = useCallback((signal: AgentAssignmentSignal) => {
    const workspaceId = 'default';
    const key = scopeKey(workspaceId);
    const agents = [
      ...parseAgentCandidates(signal.assignees),
      ...parseAgentCandidates(signal.collaborators),
    ];
    if (agents.length === 0) return;

    setProfilesByScope((prev) => {
      const map = new Map((prev[key] || []).map((entry) => [entry.agentId, entry]));
      let touched = false;

      agents.forEach((agent) => {
        const existing = map.get(agent.id) || defaultProfile(workspaceId, agent);
        const next = appendActivity(
          {
            ...existing,
            status: 'working',
            stats: {
              ...existing.stats,
              assignments: existing.stats.assignments + 1,
              lastActiveAt: signal.assignedAt || nowIso(),
            },
            updatedAt: nowIso(),
          },
          {
            id: `assign_${Date.now()}_${agent.id}`,
            type: 'assignment',
            timestamp: signal.assignedAt || nowIso(),
            description: `Assigned to ${signal.taskTitle || 'task'}`,
            meta: {
              taskId: signal.taskId || null,
            },
          },
        );
        map.set(agent.id, next);
        touched = true;
      });

      if (!touched) return prev;
      return {
        ...prev,
        [key]: Array.from(map.values()),
      };
    });
  }, []);

  const applyCompletionSignal = useCallback(
    (signal: AgentTaskCompletionSignal) => {
      const workspaceId = 'default';
      const key = scopeKey(workspaceId);
      const agents = [
        ...parseAgentCandidates(signal.assignees),
        ...parseAgentCandidates(signal.collaborators),
      ];
      if (agents.length === 0) return;

      const priorityKey = String(signal.priority || 'medium').toLowerCase();
      const baseXp = XP_BY_PRIORITY[priorityKey] ?? XP_BY_PRIORITY.medium;
      const resonance = typeof signal.resonance === 'number' ? signal.resonance : null;
      const resonanceMultiplier = resonance === null ? 1 : resonance >= 90 ? 1.45 : resonance >= 80 ? 1.3 : resonance >= 60 ? 1.1 : 0.9;
      const xpGain = Math.max(8, Math.round(baseXp * resonanceMultiplier));

      setProfilesByScope((prev) => {
        const map = new Map((prev[key] || []).map((entry) => [entry.agentId, entry]));
        let touched = false;
        let unlockToAnnounce: { agentName: string; tier: AgentAnimationTier } | null = null;

        agents.forEach((agent) => {
          const existing = map.get(agent.id) || defaultProfile(workspaceId, agent);
          const weightedResonance =
            resonance === null
              ? existing.stats.avgResonance
              : existing.stats.avgResonance === null
                ? resonance
                : Math.round(((existing.stats.avgResonance * existing.stats.tasksCompleted) + resonance) / (existing.stats.tasksCompleted + 1));

          const withStats: AgentProgressProfile = {
            ...existing,
            status: 'working',
            stats: {
              ...existing.stats,
              tasksCompleted: existing.stats.tasksCompleted + 1,
              highPriorityCompletions: existing.stats.highPriorityCompletions + (priorityKey === 'high' || priorityKey === 'urgent' ? 1 : 0),
              avgResonance: weightedResonance,
              streakDays: Math.max(1, existing.stats.streakDays + 1),
              lastActiveAt: signal.completedAt || nowIso(),
            },
            updatedAt: nowIso(),
          };

          const { next: leveled, leveledUp } = reduceWithXp(withStats, xpGain);
          const previousTier = existing.animationTier;
          const nextTier = leveled.animationTier;

          let withUnlocks = leveled;
          if (leveledUp) {
            withUnlocks = appendActivity(withUnlocks, {
              id: `level_${Date.now()}_${agent.id}`,
              type: 'level_up',
              timestamp: nowIso(),
              description: `Reached level ${leveled.level}`,
            });
            gamification.earnSeasonXP(3, `Agent level up: ${agent.name}`);
          }

          if (previousTier !== nextTier) {
            withUnlocks = ensureUnlock(withUnlocks, {
              id: `animation_${nextTier}`,
              type: 'animation',
              name: `${nextTier[0].toUpperCase()}${nextTier.slice(1)} Aura`,
              description: `${agent.name} unlocked ${nextTier} visual tier`,
            });
            withUnlocks = appendActivity(withUnlocks, {
              id: `unlock_${Date.now()}_${agent.id}`,
              type: 'unlock',
              timestamp: nowIso(),
              description: `Unlocked ${nextTier} animation tier`,
            });
            unlockToAnnounce = { agentName: agent.name, tier: nextTier };
          }

          withUnlocks = appendActivity(withUnlocks, {
            id: `complete_${Date.now()}_${agent.id}`,
            type: 'task_completed',
            timestamp: signal.completedAt || nowIso(),
            description: `Completed ${signal.taskTitle || 'task'} (+${xpGain} XP)`,
            meta: {
              taskId: signal.taskId || null,
              priority: priorityKey,
              resonance: resonance ?? null,
            },
          });

          map.set(agent.id, {
            ...withUnlocks,
            updatedAt: nowIso(),
          });
          touched = true;
        });

        if (unlockToAnnounce) {
          toast.success(`${unlockToAnnounce.agentName} unlocked ${unlockToAnnounce.tier}`, {
            description: 'Agent animation tier advanced',
          });
          gamification.triggerCelebration('achievement', {
            title: 'Agent Unlock',
            description: `${unlockToAnnounce.agentName} reached ${unlockToAnnounce.tier}`,
          });
        }

        if (!touched) return prev;
        return {
          ...prev,
          [key]: Array.from(map.values()),
        };
      });
    },
    [gamification],
  );

  useEffect(() => {
    const onTaskAssigned = (evt: Event) => {
      const event = evt as CustomEvent<AgentAssignmentSignal>;
      applyAssignmentSignal(event.detail || {});
    };
    const onTaskCompleted = (evt: Event) => {
      const event = evt as CustomEvent<AgentTaskCompletionSignal>;
      applyCompletionSignal(event.detail || {});
    };
    window.addEventListener('syncscript:task-assignees-updated', onTaskAssigned);
    window.addEventListener('syncscript:task-completed', onTaskCompleted);
    return () => {
      window.removeEventListener('syncscript:task-assignees-updated', onTaskAssigned);
      window.removeEventListener('syncscript:task-completed', onTaskCompleted);
    };
  }, [applyAssignmentSignal, applyCompletionSignal]);

  const getProfilesForWorkspace = useCallback(
    (workspaceId: string, agents: AgentRef[]) => {
      upsertProfiles(workspaceId, agents);
      const key = scopeKey(workspaceId);
      const existing = profilesByScope[key] || [];
      const merged = agents.map((agent) => {
        const found = existing.find((profile) => profile.agentId === agent.id);
        return found || defaultProfile(workspaceId, agent);
      });
      return merged.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.totalXpEarned - a.totalXpEarned;
      });
    },
    [profilesByScope, upsertProfiles],
  );

  const getProfileForAgent = useCallback(
    (workspaceId: string, agent: AgentRef) => {
      const profiles = getProfilesForWorkspace(workspaceId, [agent]);
      return profiles[0] || defaultProfile(workspaceId, agent);
    },
    [getProfilesForWorkspace],
  );

  const value = useMemo<AgentProgressContextValue>(() => ({
    getProfilesForWorkspace,
    getProfileForAgent,
  }), [getProfileForAgent, getProfilesForWorkspace]);

  return <AgentProgressContext.Provider value={value}>{children}</AgentProgressContext.Provider>;
}

export function useAgentProgress() {
  const context = useContext(AgentProgressContext);
  if (!context) {
    throw new Error('useAgentProgress must be used within AgentProgressProvider');
  }
  return context;
}
