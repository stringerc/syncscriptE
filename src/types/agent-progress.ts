export type AgentAnimationTier = 'base' | 'pulse' | 'glow' | 'orbit' | 'legendary';

export type AgentUnlockType = 'animation' | 'badge' | 'title';

export interface AgentProgressUnlock {
  id: string;
  type: AgentUnlockType;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface AgentProgressStats {
  assignments: number;
  tasksCompleted: number;
  goalsTouched: number;
  highPriorityCompletions: number;
  avgResonance: number | null;
  streakDays: number;
  lastActiveAt: string | null;
}

export interface AgentProgressActivity {
  id: string;
  type: 'assignment' | 'task_completed' | 'goal_linked' | 'level_up' | 'unlock';
  timestamp: string;
  description: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface AgentProgressProfile {
  agentId: string;
  agentName: string;
  workspaceId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;
  animationTier: AgentAnimationTier;
  status: 'online' | 'working' | 'idle';
  unlocks: AgentProgressUnlock[];
  stats: AgentProgressStats;
  activity: AgentProgressActivity[];
  updatedAt: string;
}

export interface AgentTaskCompletionSignal {
  taskId?: string;
  taskTitle?: string;
  priority?: string;
  resonance?: number;
  completedAt?: string;
  dueDate?: string;
  assignees?: Array<Record<string, any>>;
  collaborators?: Array<Record<string, any>>;
}

export interface AgentAssignmentSignal {
  taskId?: string;
  taskTitle?: string;
  assignedAt?: string;
  assignees?: Array<Record<string, any>>;
  collaborators?: Array<Record<string, any>>;
}
