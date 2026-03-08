import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Brain,
  Building2,
  CircleCheckBig,
  CloudCog,
  Copy,
  ImagePlus,
  LayoutTemplate,
  Link2,
  Loader2,
  MessageSquare,
  MemoryStick,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Users,
  Volume2,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { useOpenClaw } from '../../contexts/OpenClawContext';
import { useAIInsightsRouting } from '../../contexts/AIInsightsRoutingContext';
import { getEnterpriseFeatureFlags } from '../../utils/enterprise-feature-flags';
import { NEXUS_TAB_AGENTS } from '../../utils/nexus-tab-agents';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { EnterpriseMissionCalendar } from '../enterprise/EnterpriseMissionCalendar';
import { markOpAcked, markOpFailed, markOpSent, queueOpLog } from '../../pwa/offline-oplog';
import { EnterpriseAgentModal } from '../enterprise/EnterpriseAgentModal';
import { EnterpriseOfficeSimulation } from '../enterprise/EnterpriseOfficeSimulation';
import { EnterpriseTeamModal } from '../enterprise/EnterpriseTeamModal';
import { EnterpriseChatTab } from '../enterprise/EnterpriseChatTab';

type EnterpriseTab = 'mission-control' | 'tasks' | 'agents' | 'enterprise' | 'office' | 'memory';
type TaskSubTab = 'tasks' | 'goals' | 'status';
type PolicyMode = 'suggest' | 'confirm' | 'auto';
type SmartItemType = 'task' | 'goal';
type TabAgentParent = 'dashboard' | 'tasks' | 'goals' | 'calendar' | 'financials' | 'email';

interface DiscordTabSubagent {
  id: string;
  name: string;
  tab: TabAgentParent;
}

interface DiscordProvisionedRoute {
  threadId?: string;
  threadName?: string;
  parentChannelId?: string;
  guildId?: string;
  updatedAt?: string;
  resourceType?: 'channel' | 'thread';
}

interface AgentIdentityProfile {
  avatarDataUrl?: string;
  avatarPath?: string;
  avatarUrl?: string;
  voiceBadge?: string;
}

interface MissionData {
  policy: { mode: PolicyMode; requireExternalConfirmation: boolean; maxAutoActionsPerHour: number };
  agents: { total: number; active: number; coordination: string; activeAgentIds?: string[] };
  queue: { pending: number; requiresConfirmation: number; lastUpdated: string };
  recentActions: Array<{ provider: string; action: string; success: boolean; timestamp: string }>;
}

interface EnterpriseTelemetryEvent {
  id: string;
  eventType: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

const FEATURE_FLAGS = getEnterpriseFeatureFlags();
const TEAM_ORDER = ['Leadership', 'Advisory', 'Research', 'Creative', 'Development', 'Product', 'Content', 'Sales'];
const DEFAULT_ENTERPRISE_TEMPLATE = {
  name: 'General Operating Company',
  prompt: 'Create a balanced enterprise with leadership, research, creative, development, product, content, and sales teams focused on weekly execution.',
};
const ENTERPRISE_TEMPLATES = [
  DEFAULT_ENTERPRISE_TEMPLATE,
  {
    name: 'E-commerce Growth',
    prompt: 'Create an enterprise optimized for e-commerce growth with heavy content, product iteration, and conversion-focused sales operations.',
  },
  {
    name: 'Agency Operations',
    prompt: 'Create an agency enterprise with strong client delivery, creative production, and account management workflows.',
  },
  {
    name: 'SaaS Product Team',
    prompt: 'Create a SaaS enterprise centered on roadmap execution, development velocity, QA quality, and retention growth.',
  },
];
const VOICE_BADGE_OPTIONS = [
  'Strategist',
  'Operator',
  'Analyst',
  'Coach',
  'Closer',
  'Creator',
  'Researcher',
];

const DEFAULT_AGENT_ORG = [
  { id: 'ceo', name: 'CEO', role: 'Chief Executive Agent', team: 'Leadership', row: 1, reportsTo: null, status: 'idle' },
  { id: 'coo', name: 'COO', role: 'Chief Operating Agent', team: 'Operations', row: 1, reportsTo: 'ceo', status: 'idle' },
  { id: 'cfo', name: 'CFO', role: 'Chief Financial Agent', team: 'Finance', row: 1, reportsTo: 'ceo', status: 'idle' },
  { id: 'cro', name: 'CRO', role: 'Chief Revenue Agent', team: 'Revenue', row: 1, reportsTo: 'ceo', status: 'idle' },
  { id: 'cmo', name: 'CMO', role: 'Chief Marketing Agent', team: 'Marketing', row: 1, reportsTo: 'ceo', status: 'idle' },
  { id: 'cto', name: 'CTO', role: 'Chief Technology Agent', team: 'Technology', row: 1, reportsTo: 'ceo', status: 'idle' },
  { id: 'ciso', name: 'CISO', role: 'Chief Security Agent', team: 'Security', row: 1, reportsTo: 'ceo', status: 'idle' },
  { id: 'chief_strategy_officer', name: 'Chief Strategy Officer', role: 'Advisory Strategy Lead', team: 'Advisory', row: 2, reportsTo: 'ceo', status: 'idle' },
  { id: 'chief_counsel', name: 'Chief Counsel', role: 'Advisory Risk and Compliance', team: 'Advisory', row: 2, reportsTo: 'ceo', status: 'idle' },
  { id: 'counsel', name: 'Counsel', role: 'Policy and Governance Counsel', team: 'Advisory', row: 3, reportsTo: 'chief_counsel', status: 'idle' },
  { id: 'atlas', name: 'Atlas', role: 'Senior Research Analyst', team: 'Research', row: 4, reportsTo: 'chief_strategy_officer', status: 'idle' },
  { id: 'trendy', name: 'Trendy', role: 'Viral Scout', team: 'Research', row: 4, reportsTo: 'atlas', status: 'idle' },
  { id: 'pixel', name: 'Pixel', role: 'Lead Designer', team: 'Creative', row: 5, reportsTo: 'atlas', status: 'idle' },
  { id: 'nova', name: 'Nova', role: 'Video Production Lead', team: 'Creative', row: 5, reportsTo: 'pixel', status: 'idle' },
  { id: 'vibe', name: 'Vibe', role: 'Senior Motion Designer', team: 'Creative', row: 5, reportsTo: 'pixel', status: 'idle' },
  { id: 'clawd', name: 'Clawd', role: 'Senior Developer', team: 'Development', row: 4, reportsTo: 'chief_strategy_officer', status: 'idle' },
  { id: 'sentinel', name: 'Sentinel', role: 'QA Monitor', team: 'Development', row: 4, reportsTo: 'clawd', status: 'idle' },
  { id: 'clip', name: 'Clip', role: 'Clipping Agent', team: 'Product', row: 5, reportsTo: 'clawd', status: 'idle' },
  { id: 'scribe', name: 'Scribe', role: 'Content Director', team: 'Content', row: 4, reportsTo: 'chief_strategy_officer', status: 'idle' },
  { id: 'sage', name: 'Sage', role: 'Sales Manager', team: 'Sales', row: 5, reportsTo: 'scribe', status: 'idle' },
  { id: 'closer', name: 'Closer', role: 'Account Executive', team: 'Sales', row: 5, reportsTo: 'sage', status: 'idle' },
];

export function EnterpriseToolsPage() {
  const { user, accessToken } = useAuth();
  const { setRouteContext, requestOpen } = useAIInsightsRouting();
  const {
    getEnterpriseMissionControl,
    getEnterpriseMemory,
    updateEnterprisePolicy: updateEnterprisePolicyInContext,
    runEnterpriseOperation: runEnterpriseOperationInContext,
    getEnterpriseRuntimeStatus,
    createEnterpriseRuntimePairingCode,
    dispatchEnterpriseRuntimeAction,
    getEnterpriseTelemetry,
    getEnterpriseWorkspaces,
    createEnterpriseWorkspace,
    getEnterpriseTasks,
    getEnterpriseScheduler,
    getEnterpriseOrg,
    updateEnterpriseTaskStatus,
    createEnterpriseTask,
    createEnterpriseGoal,
    createEnterpriseSmartItem,
    generateEnterpriseOrg,
    addEnterpriseTeamMember,
    getEnterpriseRuns,
    createEnterpriseRun,
    controlEnterpriseRun,
  } = useOpenClaw();

  const [activeTab, setActiveTab] = useState<EnterpriseTab>('mission-control');
  const [taskSubTab, setTaskSubTab] = useState<TaskSubTab>('tasks');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [memorySnapshot, setMemorySnapshot] = useState<any>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<any>(null);
  const [enterpriseTasks, setEnterpriseTasks] = useState<any[]>([]);
  const [taskBoard, setTaskBoard] = useState<{ do: any[]; doing: any[]; done: any[] }>({ do: [], doing: [], done: [] });
  const [goals, setGoals] = useState<any[]>([]);
  const [doneRetentionHours, setDoneRetentionHours] = useState<number>(72);
  const [schedulerTimeline, setSchedulerTimeline] = useState<any[]>([]);
  const [orgAgents, setOrgAgents] = useState<any[]>([]);
  const [projectRuns, setProjectRuns] = useState<any[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<EnterpriseTelemetryEvent[]>([]);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [workspaceId, setWorkspaceId] = useState<string>('default');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showEnterpriseTemplates, setShowEnterpriseTemplates] = useState(false);
  const [enterpriseTemplatePrompt, setEnterpriseTemplatePrompt] = useState(DEFAULT_ENTERPRISE_TEMPLATE.prompt);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [enterprisePrompt, setEnterprisePrompt] = useState('');
  const [note, setNote] = useState('');
  const [connectorName, setConnectorName] = useState('SyncScript Local Connector');
  const [pairingCode, setPairingCode] = useState('');
  const [runTitle, setRunTitle] = useState('');
  const [runObjective, setRunObjective] = useState('');
  const [runCheckpoints, setRunCheckpoints] = useState('');
  const [runRiskBudget, setRunRiskBudget] = useState(3);
  const [runRequireConfirmation, setRunRequireConfirmation] = useState(true);
  const [runMaxActionsPerHour, setRunMaxActionsPerHour] = useState(6);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskMilestones, setNewTaskMilestones] = useState('');
  const [newTaskSteps, setNewTaskSteps] = useState('');
  const [newTaskTeam, setNewTaskTeam] = useState('Development');

  const [smartType, setSmartType] = useState<SmartItemType>('task');
  const [smartTitle, setSmartTitle] = useState('');
  const [smartDescription, setSmartDescription] = useState('');
  const [smartMilestones, setSmartMilestones] = useState('');
  const [smartSteps, setSmartSteps] = useState('');
  const [taskTemplates, setTaskTemplates] = useState<Array<{ id: string; title: string; description?: string; milestones?: string[]; steps?: string[]; team?: string }>>([]);
  const [goalTemplates, setGoalTemplates] = useState<Array<{ id: string; title: string; description?: string; milestones?: string[]; steps?: string[] }>>([]);
  const [isTaskComposerOpen, setIsTaskComposerOpen] = useState(false);
  const [isSmartTaskComposerOpen, setIsSmartTaskComposerOpen] = useState(false);
  const [isSmartGoalComposerOpen, setIsSmartGoalComposerOpen] = useState(false);
  const [isSmartEventComposerOpen, setIsSmartEventComposerOpen] = useState(false);
  const [isTaskTemplatesOpen, setIsTaskTemplatesOpen] = useState(false);
  const [isGoalTemplatesOpen, setIsGoalTemplatesOpen] = useState(false);
  const [customTemplateTitle, setCustomTemplateTitle] = useState('');
  const [customTemplateDescription, setCustomTemplateDescription] = useState('');
  const [customTemplateMilestones, setCustomTemplateMilestones] = useState('');
  const [customTemplateSteps, setCustomTemplateSteps] = useState('');
  const [smartEventObjective, setSmartEventObjective] = useState('');
  const [smartEventStartAt, setSmartEventStartAt] = useState('');
  const [smartEventStepCount, setSmartEventStepCount] = useState(4);

  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [discordTabSubagents, setDiscordTabSubagents] = useState<DiscordTabSubagent[]>([]);
  const [discordUserId, setDiscordUserId] = useState('');
  const [discordRoutes, setDiscordRoutes] = useState<Record<string, DiscordProvisionedRoute>>({});
  const [discordEnabledRoutes, setDiscordEnabledRoutes] = useState<Set<string>>(new Set());
  const [discordProvisionLoading, setDiscordProvisionLoading] = useState(false);
  const [agentIdentityProfiles, setAgentIdentityProfiles] = useState<Record<string, AgentIdentityProfile>>({});
  const [agentIdentityLoading, setAgentIdentityLoading] = useState(false);
  const [identityEditorKey, setIdentityEditorKey] = useState<string | null>(null);
  const [identityVoiceBadge, setIdentityVoiceBadge] = useState('Strategist');
  const [identityAvatarPreview, setIdentityAvatarPreview] = useState('');
  const [syncIdentityToDiscordLabels, setSyncIdentityToDiscordLabels] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('discord_identity_label_sync') !== '0';
    } catch {
      return true;
    }
  });
  const [newSubagentId, setNewSubagentId] = useState('');
  const [newSubagentName, setNewSubagentName] = useState('');
  const [newSubagentTab, setNewSubagentTab] = useState<TabAgentParent>('tasks');
  const [enterpriseApiUnavailable, setEnterpriseApiUnavailable] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('enterprise_api_unavailable') === '1';
    } catch {
      return false;
    }
  });

  const withFallback = useCallback(async <T,>(request: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await request;
    } catch (error: any) {
      const message = String(error?.message || '');
      if (message.includes('404') || message.includes('Not Found')) {
        return fallback;
      }
      throw error;
    }
  }, []);

  const loadMissionControl = useCallback(async () => {
    if (!user?.id || !FEATURE_FLAGS.enterpriseMissionControlEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (enterpriseApiUnavailable) {
        setWorkspaces([{ id: 'default', name: 'Enterprise Mission Control' }]);
        setMission({
          agents: { total: DEFAULT_AGENT_ORG.length, active: 0, coordination: 'cloud' },
          queue: { pending: 0, requiresConfirmation: 0, lastUpdated: new Date().toISOString() },
          recentActions: [],
          policy: { mode: 'confirm', requireExternalConfirmation: true, maxAutoActionsPerHour: 4 },
        });
        setMemorySnapshot({ memories: [], counts: { memories: 0 } });
        setRuntimeStatus({ mode: 'cloud-only', queue: { pending: 0 } });
        setEnterpriseTasks([]);
        setTaskBoard({ do: [], doing: [], done: [] });
        setGoals([]);
        setDoneRetentionHours(72);
        setSchedulerTimeline([]);
        setOrgAgents(DEFAULT_AGENT_ORG);
        setProjectRuns([]);
        return;
      }

      try {
        await getEnterpriseMissionControl(user.id, workspaceId);
      } catch (error: any) {
        const message = String(error?.message || '');
        if (message.includes('404') || message.includes('Not Found')) {
          setEnterpriseApiUnavailable(true);
          try {
            window.localStorage.setItem('enterprise_api_unavailable', '1');
          } catch {
            // ignore persistence failure
          }
          setWorkspaces([{ id: 'default', name: 'Enterprise Mission Control' }]);
          setMission({
            agents: { total: DEFAULT_AGENT_ORG.length, active: 0, coordination: 'cloud' },
            queue: { pending: 0, requiresConfirmation: 0, lastUpdated: new Date().toISOString() },
            recentActions: [],
            policy: { mode: 'confirm', requireExternalConfirmation: true, maxAutoActionsPerHour: 4 },
          });
          setMemorySnapshot({ memories: [], counts: { memories: 0 } });
          setRuntimeStatus({ mode: 'cloud-only', queue: { pending: 0 } });
          setEnterpriseTasks([]);
          setTaskBoard({ do: [], doing: [], done: [] });
          setGoals([]);
          setDoneRetentionHours(72);
          setSchedulerTimeline([]);
          setOrgAgents(DEFAULT_AGENT_ORG);
          setProjectRuns([]);
          toast.warning('Enterprise API endpoints are unavailable; using local mission-control mode.');
          return;
        }
        throw error;
      }

      const [workspaceRes, missionRes, memoryRes, runtimeRes, taskRes, schedulerRes, orgRes, runsRes, telemetryRes] = await Promise.all([
        withFallback(getEnterpriseWorkspaces(user.id, workspaceId), { workspaces: [{ id: 'default', name: 'Enterprise Mission Control' }] } as any),
        withFallback(getEnterpriseMissionControl(user.id, workspaceId), {
          agents: { total: 0, active: 0, coordination: 'cloud' },
          queue: { pending: 0, requiresConfirmation: 0, lastUpdated: new Date().toISOString() },
          recentActions: [],
          policy: { mode: 'confirm', requireExternalConfirmation: true, maxAutoActionsPerHour: 4 },
        } as any),
        withFallback(getEnterpriseMemory(user.id, 60, workspaceId), { memories: [], counts: { memories: 0 } } as any),
        withFallback(getEnterpriseRuntimeStatus(user.id, workspaceId), { mode: 'cloud-only', queue: { pending: 0 } } as any),
        withFallback(getEnterpriseTasks(user.id, workspaceId), { tasks: [], goals: [], board: { do: [], doing: [], done: [] }, doneRetentionHours: 72 } as any),
        withFallback(getEnterpriseScheduler(user.id, workspaceId), { timeline: [] } as any),
        withFallback(getEnterpriseOrg(user.id, workspaceId), { agents: DEFAULT_AGENT_ORG } as any),
        withFallback(getEnterpriseRuns(user.id, workspaceId), { runs: [] } as any),
        withFallback(getEnterpriseTelemetry(user.id, 80, workspaceId), { events: [] } as any),
      ]);
      setWorkspaces(Array.isArray(workspaceRes?.workspaces) ? workspaceRes.workspaces : []);
      setMission(missionRes);
      setMemorySnapshot(memoryRes);
      setRuntimeStatus(runtimeRes);
      setEnterpriseTasks(Array.isArray(taskRes?.tasks) ? taskRes.tasks : []);
      setTaskBoard(taskRes?.board || { do: [], doing: [], done: [] });
      setGoals(Array.isArray(taskRes?.goals) ? taskRes.goals : []);
      setDoneRetentionHours(Number(taskRes?.doneRetentionHours) || 72);
      setSchedulerTimeline(Array.isArray(schedulerRes?.timeline) ? schedulerRes.timeline : []);
      setOrgAgents(Array.isArray(orgRes?.agents) ? orgRes.agents : []);
      setProjectRuns(Array.isArray(runsRes?.runs) ? runsRes.runs : []);
      setTelemetryEvents(Array.isArray(telemetryRes?.events) ? telemetryRes.events : []);
    } catch (error) {
      toast.error('Mission Control load degraded (using fallback data)');
      console.error('[EnterpriseMissionControl] load failed', error);
    } finally {
      setLoading(false);
    }
  }, [
    getEnterpriseMemory,
    getEnterpriseMissionControl,
    getEnterpriseOrg,
    getEnterpriseRuntimeStatus,
    getEnterpriseRuns,
    getEnterpriseScheduler,
    getEnterpriseTasks,
    getEnterpriseTelemetry,
    getEnterpriseWorkspaces,
    enterpriseApiUnavailable,
    withFallback,
    user?.id,
    workspaceId,
  ]);

  useEffect(() => {
    void loadMissionControl();
  }, [loadMissionControl]);

  useEffect(() => {
    const taskKey = `enterprise_task_templates:${workspaceId}`;
    const goalKey = `enterprise_goal_templates:${workspaceId}`;
    try {
      const storedTasks = window.localStorage.getItem(taskKey);
      const storedGoals = window.localStorage.getItem(goalKey);
      setTaskTemplates(
        storedTasks
          ? JSON.parse(storedTasks)
          : getDefaultEnterpriseTaskTemplates()
      );
      setGoalTemplates(
        storedGoals
          ? JSON.parse(storedGoals)
          : getDefaultEnterpriseGoalTemplates()
      );
    } catch {
      setTaskTemplates(getDefaultEnterpriseTaskTemplates());
      setGoalTemplates(getDefaultEnterpriseGoalTemplates());
    }
  }, [workspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`enterprise_task_templates:${workspaceId}`, JSON.stringify(taskTemplates));
    } catch {
      // best-effort persistence
    }
  }, [taskTemplates, workspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`enterprise_goal_templates:${workspaceId}`, JSON.stringify(goalTemplates));
    } catch {
      // best-effort persistence
    }
  }, [goalTemplates, workspaceId]);

  useEffect(() => {
    const key = `discord_tab_subagents:${workspaceId}`;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setDiscordTabSubagents(
          parsed
            .map((item: any) => ({
              id: String(item?.id || '').toLowerCase(),
              name: String(item?.name || ''),
              tab: String(item?.tab || 'tasks') as TabAgentParent,
            }))
            .filter((item: DiscordTabSubagent) => item.id && item.name)
        );
      } else {
        setDiscordTabSubagents([]);
      }
    } catch {
      setDiscordTabSubagents([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`discord_tab_subagents:${workspaceId}`, JSON.stringify(discordTabSubagents));
    } catch {
      // best-effort persistence
    }
  }, [discordTabSubagents, workspaceId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`agent_identity_profiles:${workspaceId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object') {
        setAgentIdentityProfiles(parsed as Record<string, AgentIdentityProfile>);
      } else {
        setAgentIdentityProfiles({});
      }
    } catch {
      setAgentIdentityProfiles({});
    }
  }, [workspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`agent_identity_profiles:${workspaceId}`, JSON.stringify(agentIdentityProfiles));
    } catch {
      // best-effort persistence
    }
  }, [agentIdentityProfiles, workspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem('discord_identity_label_sync', syncIdentityToDiscordLabels ? '1' : '0');
    } catch {
      // best-effort persistence
    }
  }, [syncIdentityToDiscordLabels]);

  useEffect(() => {
    try {
      setDiscordUserId(window.localStorage.getItem('discord_user_id') || '');
    } catch {
      setDiscordUserId('');
    }
  }, []);

  useEffect(() => {
    try {
      if (discordUserId.trim()) {
        window.localStorage.setItem('discord_user_id', discordUserId.trim());
      }
    } catch {
      // best-effort persistence
    }
  }, [discordUserId]);

  const fetchAgentIdentityProfiles = useCallback(async () => {
    if (!user?.id || !accessToken) return;
    setAgentIdentityLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/discord/agent-identities?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error(`Agent identities failed: ${response.status}`);
      const data = await response.json();
      const profiles = (data?.profiles && typeof data.profiles === 'object')
        ? (data.profiles as Record<string, AgentIdentityProfile>)
        : {};
      setAgentIdentityProfiles(profiles);
      try {
        window.localStorage.setItem(`agent_identity_profiles:${workspaceId}`, JSON.stringify(profiles));
      } catch {
        // best-effort cache
      }
    } catch (error) {
      console.warn('[Enterprise] Agent identities fetch failed', error);
    } finally {
      setAgentIdentityLoading(false);
    }
  }, [accessToken, user?.id, workspaceId]);

  const persistAgentIdentityProfiles = useCallback(async (profiles: Record<string, AgentIdentityProfile>) => {
    setAgentIdentityProfiles(profiles);
    try {
      window.localStorage.setItem(`agent_identity_profiles:${workspaceId}`, JSON.stringify(profiles));
    } catch {
      // best-effort cache
    }
    if (!user?.id || !accessToken) return;
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/discord/agent-identities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId,
        profiles,
      }),
    });
    if (!response.ok) {
      throw new Error(`Identity persistence failed: ${response.status}`);
    }
  }, [accessToken, user?.id, workspaceId]);

  const syncDiscordAgentRegistry = useCallback(async () => {
    if (!user?.id) return;
    const formatName = (cardKey: string, baseName: string) => {
      if (!syncIdentityToDiscordLabels) return baseName;
      const voice = (agentIdentityProfiles[cardKey]?.voiceBadge || '').trim();
      if (!voice) return baseName;
      return `${baseName} - ${voice}`.slice(0, 80);
    };
    const sourceAgents = (orgAgents.length > 0 ? orgAgents : DEFAULT_AGENT_ORG);
    const enterpriseAgents = sourceAgents.map((agent) => ({
      id: String(agent?.id || '').toLowerCase(),
      name: formatName(
        `enterprise:${String(agent?.id || '').toLowerCase()}`,
        String(agent?.name || agent?.id || 'Agent')
      ),
      parentType: 'enterprise',
      parentId: 'enterprise',
    }));
    const tabSubagents = discordTabSubagents.map((agent) => ({
      id: agent.id,
      name: formatName(`tab:${agent.tab}:${agent.id}`, agent.name),
      parentType: 'tab',
      parentId: agent.tab,
    }));
    const nexusRegistryAgents = NEXUS_TAB_AGENTS.map((agent) => {
      const scope = agent.discordScope || 'tab';
      const parentType = scope === 'enterprise' ? 'enterprise' : 'tab';
      const parentId = agent.discordParentId || (scope === 'enterprise' ? 'enterprise' : 'dashboard');
      const key = parentType === 'enterprise'
        ? `enterprise:${agent.id}`
        : `tab:${parentId}:${agent.id}`;
      return {
        id: agent.id,
        name: formatName(key, agent.name),
        parentType,
        parentId,
      };
    });

    const token = accessToken || publicAnonKey;
    await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/discord/sync-agent-registry`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId,
        agents: [...enterpriseAgents, ...tabSubagents, ...nexusRegistryAgents],
      }),
    });
  }, [accessToken, agentIdentityProfiles, discordTabSubagents, orgAgents, syncIdentityToDiscordLabels, user?.id, workspaceId]);

  const fetchDiscordProvisioningState = useCallback(async () => {
    const userId = discordUserId.trim();
    if (!userId) {
      setDiscordRoutes({});
      setDiscordEnabledRoutes(new Set());
      return;
    }
    setDiscordProvisionLoading(true);
    try {
      const token = accessToken || publicAnonKey;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/discord/provisioning-state?discordUserId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error(`Provisioning state failed: ${response.status}`);
      const data = await response.json();
      const routes = (data?.routes && typeof data.routes === 'object') ? data.routes : {};
      const enabled = Array.isArray(data?.enabledRoutes) ? data.enabledRoutes.map((r: unknown) => String(r)) : [];
      setDiscordRoutes(routes as Record<string, DiscordProvisionedRoute>);
      setDiscordEnabledRoutes(new Set(enabled));
    } catch (error) {
      console.warn('[Enterprise] Discord provisioning state fetch failed', error);
    } finally {
      setDiscordProvisionLoading(false);
    }
  }, [accessToken, discordUserId, workspaceId]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setTimeout(() => {
      void syncDiscordAgentRegistry().catch((error) => {
        console.warn('[Enterprise] Discord agent registry sync failed', error);
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [syncDiscordAgentRegistry, user?.id]);

  useEffect(() => {
    if (!user?.id || !discordUserId.trim()) return;
    void fetchDiscordProvisioningState();
  }, [fetchDiscordProvisioningState, user?.id, workspaceId, discordUserId]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchAgentIdentityProfiles();
  }, [fetchAgentIdentityProfiles, user?.id, workspaceId]);

  const addDiscordTabSubagent = useCallback(() => {
    const id = newSubagentId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const name = newSubagentName.trim();
    if (!id || !name) return;
    setDiscordTabSubagents((prev) => {
      const filtered = prev.filter((agent) => !(agent.id === id && agent.tab === newSubagentTab));
      return [{ id, name, tab: newSubagentTab }, ...filtered].slice(0, 100);
    });
    setNewSubagentId('');
    setNewSubagentName('');
  }, [newSubagentId, newSubagentName, newSubagentTab]);

  const removeDiscordTabSubagent = useCallback((id: string, tab: TabAgentParent) => {
    setDiscordTabSubagents((prev) => prev.filter((agent) => !(agent.id === id && agent.tab === tab)));
  }, []);

  const openIdentityEditor = useCallback((cardKey: string) => {
    const profile = agentIdentityProfiles[cardKey] || {};
    setIdentityEditorKey(cardKey);
    setIdentityVoiceBadge(profile.voiceBadge || 'Strategist');
    setIdentityAvatarPreview(profile.avatarUrl || profile.avatarDataUrl || '');
  }, [agentIdentityProfiles]);

  const uploadAgentAvatarToCloud = useCallback(async (cardKey: string, avatarDataUrl: string, previousPath?: string) => {
    if (!accessToken) throw new Error('Missing access token');
    const blob = dataUrlToBlob(avatarDataUrl);
    const formData = new FormData();
    formData.append('workspaceId', workspaceId);
    formData.append('cardKey', cardKey);
    if (previousPath) formData.append('previousPath', previousPath);
    formData.append('file', blob, `${sanitizeDiscordSlug(cardKey)}.webp`);
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/discord/agent-avatar/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Avatar upload failed: ${response.status}`);
    }
    const data = await response.json();
    return {
      avatarPath: String(data?.avatarPath || ''),
      avatarUrl: String(data?.avatarUrl || ''),
    };
  }, [accessToken, workspaceId]);

  const saveIdentityEditor = useCallback(async () => {
    if (!identityEditorKey) return;
    const currentProfile = agentIdentityProfiles[identityEditorKey] || {};
    let nextProfile: AgentIdentityProfile = {
      voiceBadge: identityVoiceBadge || 'Strategist',
      avatarDataUrl: undefined,
      avatarPath: currentProfile.avatarPath,
      avatarUrl: currentProfile.avatarUrl,
    };
    if (identityAvatarPreview.startsWith('data:image/')) {
      try {
        const uploaded = await uploadAgentAvatarToCloud(identityEditorKey, identityAvatarPreview, currentProfile.avatarPath);
        nextProfile = {
          ...nextProfile,
          avatarPath: uploaded.avatarPath || undefined,
          avatarUrl: uploaded.avatarUrl || undefined,
          avatarDataUrl: undefined,
        };
      } catch {
        // Fallback to local-only preview when cloud upload fails.
        nextProfile = {
          ...nextProfile,
          avatarDataUrl: identityAvatarPreview,
          avatarPath: undefined,
          avatarUrl: undefined,
        };
      }
    } else if (!identityAvatarPreview) {
      nextProfile = {
        ...nextProfile,
        avatarDataUrl: undefined,
        avatarPath: undefined,
        avatarUrl: undefined,
      };
    } else {
      nextProfile = {
        ...nextProfile,
        avatarDataUrl: undefined,
        avatarUrl: identityAvatarPreview,
      };
    }

    const nextProfiles = {
      ...agentIdentityProfiles,
      [identityEditorKey]: nextProfile,
    };
    setIdentityEditorKey(null);
    try {
      await persistAgentIdentityProfiles(nextProfiles);
      toast.success('Agent identity saved');
    } catch {
      toast.error('Identity saved locally but cloud sync failed');
    }
  }, [agentIdentityProfiles, identityAvatarPreview, identityEditorKey, identityVoiceBadge, persistAgentIdentityProfiles, uploadAgentAvatarToCloud]);

  const clearIdentityAvatar = useCallback(() => {
    setIdentityAvatarPreview('');
  }, []);

  const handleIdentityAvatarUpload = useCallback(async (file: File) => {
    const resizedDataUrl = await resizeAvatarToDataUrl(file, 160);
    setIdentityAvatarPreview(resizedDataUrl);
  }, []);

  const runOperation = useCallback(async (operation: string, payload: Record<string, unknown>) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      await runEnterpriseOperationInContext(user.id, operation, payload, workspaceId);
      await loadMissionControl();
      toast.success('Operation completed');
    } catch {
      toast.error(`Operation failed: ${operation}`);
    } finally {
      setBusy(false);
    }
  }, [loadMissionControl, runEnterpriseOperationInContext, user?.id, workspaceId]);

  const updatePolicy = useCallback(async (partial: Record<string, unknown>) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const result = await updateEnterprisePolicyInContext(user.id, partial, workspaceId);
      setMission((prev) => (prev ? { ...prev, policy: result } : prev));
      toast.success('Mission policy updated');
    } catch {
      toast.error('Failed to update mission policy');
    } finally {
      setBusy(false);
    }
  }, [updateEnterprisePolicyInContext, user?.id, workspaceId]);

  const openAgentModal = useCallback((agent: any) => {
    setSelectedAgent(agent);
    setIsAgentModalOpen(true);
    setRouteContext({
      type: 'enterprise-agent',
      domainTab: 'enterprise',
      workspaceId,
      agentId: agent.id,
      agentName: agent.name,
      teamName: agent.team,
      source: 'in-app',
    });
    requestOpen();
  }, [requestOpen, setRouteContext, workspaceId]);

  const createWorkspace = useCallback(async () => {
    const trimmed = workspaceName.trim();
    if (!trimmed || !user?.id) return;
    setBusy(true);
    try {
      const workspace = await createEnterpriseWorkspace(user.id, trimmed);
      const nextWorkspaceId = String(workspace?.id || 'default');
      setWorkspaceId(nextWorkspaceId);
      const generationPrompt = enterpriseTemplatePrompt.trim() || DEFAULT_ENTERPRISE_TEMPLATE.prompt;
      await generateEnterpriseOrg(user.id, generationPrompt, nextWorkspaceId);
      setWorkspaceName('');
      setShowCreateWorkspace(false);
      setShowEnterpriseTemplates(false);
      toast.success('Enterprise created with starter hierarchy');
      await loadMissionControl();
    } catch {
      toast.error('Could not create enterprise');
    } finally {
      setBusy(false);
    }
  }, [createEnterpriseWorkspace, enterpriseTemplatePrompt, generateEnterpriseOrg, loadMissionControl, user?.id, workspaceName]);

  const createPairingCode = useCallback(async () => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const result = await createEnterpriseRuntimePairingCode(
        user.id,
        connectorName.trim() || 'SyncScript Local Connector',
        ['filesystem', 'automation', 'memory-sync'],
        workspaceId
      );
      setPairingCode(String(result?.pairingCode || ''));
      toast.success('Pairing code generated');
      await loadMissionControl();
    } catch {
      toast.error('Unable to generate pairing code');
    } finally {
      setBusy(false);
    }
  }, [connectorName, createEnterpriseRuntimePairingCode, loadMissionControl, user?.id, workspaceId]);

  const queueRuntimeAction = useCallback(async (actionType: string) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      await dispatchEnterpriseRuntimeAction(
        user.id,
        { type: actionType, source: 'mission-control', createdAt: new Date().toISOString() },
        undefined,
        workspaceId
      );
      toast.success('Action queued');
      await loadMissionControl();
    } catch {
      toast.error('Unable to queue action');
    } finally {
      setBusy(false);
    }
  }, [dispatchEnterpriseRuntimeAction, loadMissionControl, user?.id, workspaceId]);

  const saveMemoryNote = useCallback(async (content: string, tags: string[] = ['enterprise']) => {
    if (!content.trim() || !user?.id) return;
    await runOperation('save-memory-note', {
      content: content.trim(),
      type: 'context',
      tags,
      importance: 0.76,
    });
  }, [runOperation, user?.id]);

  const createManualTask = useCallback(async () => {
    if (!user?.id || !newTaskTitle.trim()) return;
    const queued = await queueOpLog({
      entity: 'task',
      routeKey: `enterprise:${workspaceId}`,
      idempotencyKey: crypto.randomUUID(),
      payload: {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
      },
    });
    setBusy(true);
    try {
      await markOpSent(queued.id);
      const result = await createEnterpriseTask(
        user.id,
        {
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          milestones: splitLines(newTaskMilestones),
          steps: splitLines(newTaskSteps),
          smart: false,
          team: newTaskTeam,
          source: 'manual-task',
        },
        workspaceId
      );
      setEnterpriseTasks(Array.isArray(result?.tasks) ? result.tasks : []);
      setTaskBoard(result?.board || { do: [], doing: [], done: [] });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskMilestones('');
      setNewTaskSteps('');
      await markOpAcked(queued.id);
      toast.success('Enterprise task created');
    } catch {
      await markOpFailed(queued.id, 'create task failed');
      toast.error('Failed to create enterprise task');
    } finally {
      setBusy(false);
    }
  }, [createEnterpriseTask, newTaskDescription, newTaskMilestones, newTaskSteps, newTaskTeam, newTaskTitle, user?.id, workspaceId]);

  const createSmartItem = useCallback(async () => {
    if (!user?.id || !smartTitle.trim()) return;
    const queued = await queueOpLog({
      entity: smartType === 'goal' ? 'goal' : 'task',
      routeKey: `enterprise:${workspaceId}`,
      idempotencyKey: crypto.randomUUID(),
      payload: {
        type: smartType,
        title: smartTitle.trim(),
        description: smartDescription.trim(),
      },
    });
    setBusy(true);
    try {
      await markOpSent(queued.id);
      const result = await createEnterpriseSmartItem(
        user.id,
        {
          type: smartType,
          title: smartTitle.trim(),
          description: smartDescription.trim(),
          milestones: splitLines(smartMilestones),
          steps: splitLines(smartSteps),
        },
        workspaceId
      );
      setEnterpriseTasks(Array.isArray(result?.tasks) ? result.tasks : []);
      setTaskBoard(result?.board || { do: [], doing: [], done: [] });
      if (smartType === 'goal' && Array.isArray(result?.goals)) {
        setGoals(result.goals);
      }
      setSmartTitle('');
      setSmartDescription('');
      setSmartMilestones('');
      setSmartSteps('');
      await markOpAcked(queued.id);
      toast.success(`Smart ${smartType} created and assigned`);
    } catch {
      await markOpFailed(queued.id, `create smart ${smartType} failed`);
      toast.error(`Failed to create smart ${smartType}`);
    } finally {
      setBusy(false);
    }
  }, [createEnterpriseSmartItem, smartDescription, smartMilestones, smartSteps, smartTitle, smartType, user?.id, workspaceId]);

  const createSmartEventPlan = useCallback(async () => {
    if (!user?.id || !smartTitle.trim()) return;
    const queued = await queueOpLog({
      entity: 'smart-event',
      routeKey: `enterprise:${workspaceId}`,
      idempotencyKey: crypto.randomUUID(),
      payload: {
        title: smartTitle.trim(),
        objective: smartEventObjective.trim(),
      },
    });
    setBusy(true);
    try {
      await markOpSent(queued.id);
      const token = accessToken || publicAnonKey;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/smart-events/compose`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          workspaceId,
          title: smartTitle.trim(),
          objective: smartEventObjective.trim(),
          startAt: smartEventStartAt || new Date().toISOString(),
          stepCount: smartEventStepCount,
          daySpacing: 2,
          durationMinutes: 45,
          minGapMinutes: 30,
          busyWindows: schedulerTimeline
            .map((item: any) => {
              const start = item?.start || item?.startAt || item?.dueAt;
              const durationMinutes = Number(item?.durationMinutes || 45);
              const startMs = Date.parse(String(start || ''));
              if (!Number.isFinite(startMs)) return null;
              return {
                start: new Date(startMs).toISOString(),
                end: new Date(startMs + durationMinutes * 60 * 1000).toISOString(),
              };
            })
            .filter(Boolean),
        }),
      });
      if (!response.ok) throw new Error(`smart event failed: ${response.status}`);
      const json = await response.json();
      const plan = json?.data || {};
      const generatedTasks = Array.isArray(plan.tasks) ? plan.tasks : [];
      const generatedMilestones = Array.isArray(plan.milestones) ? plan.milestones : [];
      setEnterpriseTasks((prev) => [...generatedTasks, ...prev].slice(0, 120));
      setSchedulerTimeline((prev) => [...(Array.isArray(plan.calendar) ? plan.calendar : []), ...prev].slice(0, 120));
      setGoals((prev) => [
        {
          id: `goal_${plan.id || crypto.randomUUID()}`,
          title: plan.title || smartTitle,
          status: 'in_progress',
          progress: 0,
          milestones: generatedMilestones,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSmartTitle('');
      setSmartEventObjective('');
      setSmartEventStartAt('');
      setSmartEventStepCount(4);
      setIsSmartEventComposerOpen(false);
      await markOpAcked(queued.id);
      toast.success('Smart event plan created with goals, tasks, milestones, and schedule');
    } catch {
      await markOpFailed(queued.id, 'smart event plan failed');
      toast.error('Failed to create smart event plan');
    } finally {
      setBusy(false);
    }
  }, [accessToken, schedulerTimeline, smartEventObjective, smartEventStartAt, smartEventStepCount, smartTitle, user?.id, workspaceId]);

  const createGoal = useCallback(async () => {
    const title = newGoalTitle.trim();
    if (!title || !user?.id) return;
    setBusy(true);
    try {
      const result = await createEnterpriseGoal(user.id, title, workspaceId, 0);
      setGoals(Array.isArray(result?.goals) ? result.goals : []);
      setNewGoalTitle('');
      toast.success('Goal created');
    } catch {
      toast.error('Failed to create goal');
    } finally {
      setBusy(false);
    }
  }, [createEnterpriseGoal, newGoalTitle, user?.id, workspaceId]);

  const createProjectRun = useCallback(async () => {
    if (!user?.id || !runObjective.trim()) return;
    setBusy(true);
    try {
      const result = await createEnterpriseRun(
        user.id,
        {
          title: runTitle.trim(),
          objective: runObjective.trim(),
          checkpoints: runCheckpoints,
          riskBudget: runRiskBudget,
          requireConfirmation: runRequireConfirmation,
          maxActionsPerHour: runMaxActionsPerHour,
        },
        workspaceId
      );
      setProjectRuns(Array.isArray(result?.runs) ? result.runs : []);
      setRunTitle('');
      setRunObjective('');
      setRunCheckpoints('');
      toast.success('Autonomous run created');
      await loadMissionControl();
    } catch {
      toast.error('Failed to create autonomous run');
    } finally {
      setBusy(false);
    }
  }, [
    createEnterpriseRun,
    loadMissionControl,
    runCheckpoints,
    runMaxActionsPerHour,
    runObjective,
    runRequireConfirmation,
    runRiskBudget,
    runTitle,
    user?.id,
    workspaceId,
  ]);

  const controlRun = useCallback(async (runId: string, command: 'pause' | 'resume' | 'complete') => {
    if (!user?.id || !runId) return;
    setBusy(true);
    try {
      const result = await controlEnterpriseRun(user.id, { runId, command }, workspaceId);
      setProjectRuns(Array.isArray(result?.runs) ? result.runs : []);
      toast.success(`Run ${command}d`);
      await loadMissionControl();
    } catch {
      toast.error(`Failed to ${command} run`);
    } finally {
      setBusy(false);
    }
  }, [controlEnterpriseRun, loadMissionControl, user?.id, workspaceId]);

  const createCustomTaskTemplate = useCallback(() => {
    const title = customTemplateTitle.trim();
    if (!title) return;
    const template = {
      id: `task_tpl_${Date.now()}`,
      title,
      description: customTemplateDescription.trim(),
      milestones: splitLines(customTemplateMilestones),
      steps: splitLines(customTemplateSteps),
      team: newTaskTeam,
    };
    setTaskTemplates((prev) => [template, ...prev].slice(0, 80));
    setCustomTemplateTitle('');
    setCustomTemplateDescription('');
    setCustomTemplateMilestones('');
    setCustomTemplateSteps('');
    toast.success('Task template created');
  }, [customTemplateDescription, customTemplateMilestones, customTemplateSteps, customTemplateTitle, newTaskTeam]);

  const createCustomGoalTemplate = useCallback(() => {
    const title = customTemplateTitle.trim();
    if (!title) return;
    const template = {
      id: `goal_tpl_${Date.now()}`,
      title,
      description: customTemplateDescription.trim(),
      milestones: splitLines(customTemplateMilestones),
      steps: splitLines(customTemplateSteps),
    };
    setGoalTemplates((prev) => [template, ...prev].slice(0, 80));
    setCustomTemplateTitle('');
    setCustomTemplateDescription('');
    setCustomTemplateMilestones('');
    setCustomTemplateSteps('');
    toast.success('Goal template created');
  }, [customTemplateDescription, customTemplateMilestones, customTemplateSteps, customTemplateTitle]);

  const runTaskTemplate = useCallback(async (template: { title: string; description?: string; milestones?: string[]; steps?: string[]; team?: string }) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const result = await createEnterpriseTask(
        user.id,
        {
          title: template.title,
          description: template.description || '',
          milestones: template.milestones || [],
          steps: template.steps || [],
          team: template.team || 'Development',
          smart: false,
          source: 'template-task',
        },
        workspaceId
      );
      setEnterpriseTasks(Array.isArray(result?.tasks) ? result.tasks : []);
      setTaskBoard(result?.board || { do: [], doing: [], done: [] });
      toast.success('Template task created');
    } catch {
      toast.error('Failed to create task from template');
    } finally {
      setBusy(false);
    }
  }, [createEnterpriseTask, user?.id, workspaceId]);

  const runGoalTemplate = useCallback(async (template: { title: string; description?: string; milestones?: string[]; steps?: string[] }) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const result = await createEnterpriseSmartItem(
        user.id,
        {
          type: 'goal',
          title: template.title,
          description: template.description || '',
          milestones: template.milestones || [],
          steps: template.steps || [],
        },
        workspaceId
      );
      if (Array.isArray(result?.goals)) setGoals(result.goals);
      setEnterpriseTasks(Array.isArray(result?.tasks) ? result.tasks : []);
      setTaskBoard(result?.board || { do: [], doing: [], done: [] });
      toast.success('Goal template applied');
    } catch {
      toast.error('Failed to apply goal template');
    } finally {
      setBusy(false);
    }
  }, [createEnterpriseSmartItem, user?.id, workspaceId]);

  const updateTaskStatus = useCallback(async (taskId: string, status: 'do' | 'doing' | 'done') => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const result = await updateEnterpriseTaskStatus(user.id, taskId, status, workspaceId, doneRetentionHours);
      setEnterpriseTasks(Array.isArray(result?.tasks) ? result.tasks : []);
      setTaskBoard(result?.board || { do: [], doing: [], done: [] });
    } catch {
      toast.error('Failed to update task status');
    } finally {
      setBusy(false);
    }
  }, [doneRetentionHours, updateEnterpriseTaskStatus, user?.id, workspaceId]);

  const generateEnterpriseFromPrompt = useCallback(async () => {
    if (!user?.id || !enterprisePrompt.trim()) return;
    setBusy(true);
    try {
      const result = await generateEnterpriseOrg(user.id, enterprisePrompt.trim(), workspaceId);
      setOrgAgents(Array.isArray(result?.agents) ? result.agents : []);
      setEnterprisePrompt('');
      toast.success(`Enterprise generated with ${Array.isArray(result?.agents) ? result.agents.length : 0} agents`);
      await loadMissionControl();
    } catch {
      toast.error('Failed to generate enterprise');
    } finally {
      setBusy(false);
    }
  }, [enterprisePrompt, generateEnterpriseOrg, loadMissionControl, user?.id, workspaceId]);

  const addTeamMember = useCallback(async (
    team: string,
    payload: { prompt: string; name: string; role: string; capabilities: string[] }
  ) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const result = await addEnterpriseTeamMember(user.id, { team, ...payload }, workspaceId);
      setOrgAgents(Array.isArray(result?.agents) ? result.agents : []);
      toast.success(`${team} member added`);
      await loadMissionControl();
    } catch {
      toast.error('Failed to add team member');
    } finally {
      setBusy(false);
    }
  }, [addEnterpriseTeamMember, loadMissionControl, user?.id, workspaceId]);

  const displayAgents = useMemo(() => (orgAgents.length > 0 ? orgAgents : DEFAULT_AGENT_ORG), [orgAgents]);
  const workspaceSlug = useMemo(() => sanitizeDiscordSlug(workspaceId), [workspaceId]);

  const visualAgentCards = useMemo(() => {
    const activeSet = new Set(taskBoard.doing.map((task) => String(task.agentId)));
    const enterpriseCards = displayAgents.map((agent) => {
      const routeKey = `enterprise:${workspaceSlug}:${String(agent.id).toLowerCase()}`;
      const discordRoute = discordRoutes[routeKey];
      const isActive = activeSet.has(String(agent.id));
      const cardKey = `enterprise:${String(agent.id).toLowerCase()}`;
      const identity = agentIdentityProfiles[cardKey] || {};
      return {
        kind: 'enterprise' as const,
        cardKey,
        id: String(agent.id),
        name: String(agent.name || agent.id),
        subtitle: String(agent.role || agent.team || 'Enterprise Agent'),
        domainTab: 'enterprise' as const,
        routeKey,
        isActive,
        discordRoute,
        avatarDataUrl: identity.avatarDataUrl || '',
        avatarPath: identity.avatarPath || '',
        avatarUrl: identity.avatarUrl || '',
        voiceBadge: identity.voiceBadge || 'Strategist',
      };
    });

    const tabCards = discordTabSubagents.map((agent) => {
      const routeKey = `tab:${agent.tab}:${agent.id}`;
      const discordRoute = discordRoutes[routeKey];
      const cardKey = `tab:${agent.tab}:${agent.id}`;
      const identity = agentIdentityProfiles[cardKey] || {};
      return {
        kind: 'tab-subagent' as const,
        cardKey,
        id: agent.id,
        name: agent.name,
        subtitle: `${agent.tab} subagent`,
        domainTab: agent.tab,
        routeKey,
        isActive: discordEnabledRoutes.has(routeKey),
        discordRoute,
        avatarDataUrl: identity.avatarDataUrl || '',
        avatarPath: identity.avatarPath || '',
        avatarUrl: identity.avatarUrl || '',
        voiceBadge: identity.voiceBadge || 'Operator',
      };
    });

    return [...enterpriseCards, ...tabCards];
  }, [agentIdentityProfiles, discordEnabledRoutes, discordRoutes, discordTabSubagents, displayAgents, taskBoard.doing, workspaceSlug]);

  const selectedIdentityCard = useMemo(() => {
    if (!identityEditorKey) return null;
    return visualAgentCards.find((card) => card.cardKey === identityEditorKey) || null;
  }, [identityEditorKey, visualAgentCards]);

  const activeAgents = useMemo(() => {
    const activeIds = new Set(taskBoard.doing.map((task) => task.agentId));
    return displayAgents.filter((agent) => activeIds.has(agent.id)).slice(0, 12);
  }, [displayAgents, taskBoard.doing]);
  const activeAgentIdSet = useMemo(() => new Set(activeAgents.map((agent) => String(agent.id))), [activeAgents]);

  const approvalQueue = useMemo(
    () =>
      projectRuns.filter((run) => run.requireConfirmation && ['queued', 'running'].includes(String(run.status))),
    [projectRuns]
  );

  const actionLedger = useMemo(
    () => telemetryEvents.slice(0, 20),
    [telemetryEvents]
  );
  const commandMetrics = useMemo(() => {
    const running = projectRuns.filter((run) => run.status === 'running').length;
    const paused = projectRuns.filter((run) => run.status === 'paused').length;
    const completed = projectRuns.filter((run) => run.status === 'completed').length;
    const checkpointStats = projectRuns.reduce(
      (acc, run) => {
        const checkpoints = Array.isArray(run.checkpoints) ? run.checkpoints : [];
        acc.total += checkpoints.length;
        acc.done += checkpoints.filter((checkpoint: any) => checkpoint.status === 'done').length;
        return acc;
      },
      { total: 0, done: 0 }
    );
    const completionRate = checkpointStats.total > 0
      ? Math.round((checkpointStats.done / checkpointStats.total) * 100)
      : 0;
    return {
      running,
      paused,
      completed,
      completionRate,
    };
  }, [projectRuns]);

  const desktopExpansionReadiness = useMemo(() => {
    const recent = telemetryEvents.slice(0, 60);
    const failureCount = recent.filter((event) => {
      if (String(event.eventType).includes('failed')) return true;
      const status = event.payload && typeof event.payload.status === 'string' ? event.payload.status : '';
      return status === 'failed';
    }).length;
    const readinessScore = recent.length === 0 ? 0 : Math.max(0, Math.round(((recent.length - failureCount) / recent.length) * 100));
    const hasSufficientVolume = recent.length >= 10;
    const passesSafetyGate = hasSufficientVolume && failureCount <= 1 && readinessScore >= 90;
    return {
      readinessScore,
      hasSufficientVolume,
      passesSafetyGate,
      canEnableDesktopActions: FEATURE_FLAGS.enterpriseDesktopExpansionEnabled && passesSafetyGate,
    };
  }, [telemetryEvents]);

  const teams = useMemo(() => {
    const grouped = groupAgentsByTeam(displayAgents);
    const ordered = TEAM_ORDER.map((name) => ({ name, agents: grouped.get(name) || [] })).filter((entry) => entry.agents.length > 0);
    const custom = Array.from(grouped.entries())
      .filter(([name]) => !TEAM_ORDER.includes(name))
      .map(([name, agents]) => ({ name, agents }));
    return [...ordered, ...custom];
  }, [displayAgents]);

  const teamAgents = useMemo(
    () => teams.find((team) => team.name === selectedTeam)?.agents || [],
    [selectedTeam, teams]
  );

  const teamActions = useMemo(() => {
    const ids = new Set(teamAgents.map((agent) => agent.id));
    return enterpriseTasks
      .filter((task) => ids.has(task.agentId))
      .slice(0, 20)
      .map((task) => ({
        id: task.id,
        title: task.title,
        timestamp: new Date(task.updatedAt || task.createdAt).toLocaleString(),
      }));
  }, [enterpriseTasks, teamAgents]);

  if (!FEATURE_FLAGS.enterpriseMissionControlEnabled) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-6 text-gray-300">
        Enterprise Mission Control is behind a feature flag. Set
        `VITE_FEATURE_ENTERPRISE_MISSION_CONTROL=true` to enable.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-800 bg-[#1e2128] p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl">Enterprise Mission Control</h1>
              <p className="text-gray-400 mt-1">
                Agent-powered command center for running one or many enterprises from SyncScript.
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => void loadMissionControl()} disabled={loading || busy}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">Mission Control</Badge>
            <Badge variant="outline" className="border-purple-500/40 text-purple-300">Multi-enterprise</Badge>
            <Badge variant="outline" className="border-blue-500/40 text-blue-300">Autonomous agent operations</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-gray-400 mr-1">Enterprise:</p>
            {workspaces.map((workspace) => (
              <Button key={workspace.id} size="sm" variant={workspaceId === workspace.id ? 'default' : 'outline'} onClick={() => setWorkspaceId(workspace.id)}>
                {workspace.name}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-8 text-gray-300 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading mission control...
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              window.requestAnimationFrame(() => setActiveTab(value as EnterpriseTab));
            }}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-5xl grid-cols-6 bg-[#202430] border border-gray-700">
              <TabsTrigger value="mission-control" className="text-gray-300 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-white data-[state=active]:border-cyan-400/40">Mission Control</TabsTrigger>
              <TabsTrigger value="tasks" className="text-gray-300 data-[state=active]:bg-purple-500/20 data-[state=active]:text-white data-[state=active]:border-purple-400/40">Tasks</TabsTrigger>
              <TabsTrigger value="agents" className="text-gray-300 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-white data-[state=active]:border-indigo-400/40">Agents</TabsTrigger>
              <TabsTrigger value="enterprise" className="text-gray-300 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white data-[state=active]:border-emerald-400/40">Enterprise</TabsTrigger>
              <TabsTrigger value="office" className="text-gray-300 data-[state=active]:bg-blue-500/20 data-[state=active]:text-white data-[state=active]:border-blue-400/40">Office</TabsTrigger>
              <TabsTrigger value="memory" className="text-gray-300 data-[state=active]:bg-fuchsia-500/20 data-[state=active]:text-white data-[state=active]:border-fuchsia-400/40">Memory</TabsTrigger>
            </TabsList>

            <TabsContent value="mission-control" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard icon={Bot} label="Active Agents" value={`${activeAgents.length}/${mission?.agents.total || displayAgents.length || 0}`} tone="teal" />
                <MetricCard icon={Workflow} label="Queue Pending" value={`${mission?.queue.pending || 0}`} tone="blue" />
                <MetricCard icon={MemoryStick} label="Memories" value={`${memorySnapshot?.counts?.memories || 0}`} tone="purple" />
                <MetricCard icon={CircleCheckBig} label="Completed Tasks" value={`${taskBoard.done.length || 0}`} tone="emerald" />
                <MetricCard icon={CloudCog} label="Runtime" value={`${runtimeStatus?.mode || 'cloud-only'}`} tone="blue" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-300" />
                    Active Agents
                  </h3>
                  <div className="space-y-2">
                    {activeAgents.length === 0 && <p className="text-sm text-gray-400">No agents are actively running right now.</p>}
                    {activeAgents.map((agent) => (
                      <button key={agent.id} onClick={() => openAgentModal(agent)} className="w-full rounded-lg border border-gray-700 bg-[#252830] px-3 py-2 flex items-center justify-between gap-2 text-left hover:border-cyan-500/50">
                        <div>
                          <p className="text-sm text-white">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.team || agent.role || 'Mission Agent'}</p>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">active</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5">
                  <h3 className="text-white font-semibold mb-3">Latest Actions</h3>
                  <div className="space-y-2">
                    {(mission?.recentActions || []).length === 0 && <p className="text-gray-400 text-sm">No executed actions yet.</p>}
                    {(mission?.recentActions || []).map((action, index) => (
                      <div key={`${action.timestamp}-${index}`} className="rounded-lg border border-gray-700 bg-[#252830] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-white">{action.provider} - {action.action}</p>
                          <Badge variant="outline" className={action.success ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'}>
                            {action.success ? 'success' : 'failed'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{new Date(action.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <EnterpriseMissionCalendar items={schedulerTimeline} />

              {user?.id ? (
                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4">
                  <EnterpriseChatTab
                    userId={user.id}
                    workspaceId={workspaceId}
                    agents={displayAgents}
                    onCreateRunFromMessage={async (message) => {
                      const objective = String(message || '').trim();
                      if (!objective) return;
                      setBusy(true);
                      try {
                        await createEnterpriseRun(
                          user.id,
                          {
                            title: objective.slice(0, 72),
                            objective,
                            riskBudget: runRiskBudget,
                            requireConfirmation: runRequireConfirmation,
                            maxActionsPerHour: runMaxActionsPerHour,
                          },
                          workspaceId
                        );
                        toast.success('Chat prompt converted to autonomous run');
                        await loadMissionControl();
                      } catch {
                        toast.error('Failed to convert chat prompt into run');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </div>
              ) : null}

              {FEATURE_FLAGS.enterpriseCloudRunsEnabled ? (
              <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-300" />
                    Cloud Computer Mode Runs
                  </h3>
                  <Badge variant="outline" className="border-violet-500/40 text-violet-300">
                    Chat-to-Execution
                  </Badge>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <input
                      value={runTitle}
                      onChange={(event) => setRunTitle(event.target.value)}
                      className="w-full bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                      placeholder="Run title (optional)"
                    />
                    <Textarea
                      value={runObjective}
                      onChange={(event) => setRunObjective(event.target.value)}
                      className="bg-[#12151b] border-gray-700 min-h-24"
                      placeholder="Objective (example: Plan a full wedding timeline with milestones, vendor outreach, and reminders)"
                    />
                    <Textarea
                      value={runCheckpoints}
                      onChange={(event) => setRunCheckpoints(event.target.value)}
                      className="bg-[#12151b] border-gray-700 min-h-20"
                      placeholder={'Checkpoints (one per line)\nVenue shortlist\nInvite draft\nVendor contracts'}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={runRiskBudget}
                        onChange={(event) => setRunRiskBudget(Math.max(1, Math.min(10, Number(event.target.value) || 3)))}
                        className="w-24 bg-[#12151b] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={runMaxActionsPerHour}
                        onChange={(event) => setRunMaxActionsPerHour(Math.max(1, Math.min(60, Number(event.target.value) || 6)))}
                        className="w-28 bg-[#12151b] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white"
                      />
                      <div className="flex items-center gap-2 rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5">
                        <Switch checked={runRequireConfirmation} onCheckedChange={setRunRequireConfirmation} />
                        <span className="text-xs text-gray-300">require confirmations</span>
                      </div>
                      <Button size="sm" onClick={() => void createProjectRun()} disabled={busy || !runObjective.trim()}>
                        Create Run
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {projectRuns.length === 0 ? (
                      <p className="text-sm text-gray-400">No autonomous runs yet. Create one from a brief to generate a controlled execution timeline.</p>
                    ) : (
                      projectRuns.slice(0, 8).map((run) => (
                        <div key={run.id} className="rounded-lg border border-gray-700 bg-[#252830] p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white">{run.title}</p>
                            <Badge variant="outline" className="border-gray-600 text-gray-200">{run.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-400">{run.objective}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => void controlRun(run.id, 'pause')} disabled={busy || run.status === 'paused'}>Pause</Button>
                            <Button size="sm" variant="outline" onClick={() => void controlRun(run.id, 'resume')} disabled={busy || run.status === 'running'}>Resume</Button>
                            <Button size="sm" variant="outline" onClick={() => void controlRun(run.id, 'complete')} disabled={busy || run.status === 'completed'}>Complete</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              ) : null}

              <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-semibold">Command Center</h3>
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                    timeline + approvals + ledger
                  </Badge>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                  <CommandMetric label="Running" value={String(commandMetrics.running)} tone="cyan" />
                  <CommandMetric label="Paused" value={String(commandMetrics.paused)} tone="amber" />
                  <CommandMetric label="Completed" value={String(commandMetrics.completed)} tone="emerald" />
                  <CommandMetric label="Checkpoint Completion" value={`${commandMetrics.completionRate}%`} tone="violet" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-700 bg-[#252830] p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Run Timeline</p>
                    {projectRuns.length === 0 ? (
                      <p className="text-sm text-gray-400">No runs yet.</p>
                    ) : (
                      projectRuns.slice(0, 5).map((run) => {
                        const checkpoints = Array.isArray(run.checkpoints) ? run.checkpoints : [];
                        const doneCount = checkpoints.filter((checkpoint: any) => checkpoint.status === 'done').length;
                        const progress = checkpoints.length > 0 ? Math.round((doneCount / checkpoints.length) * 100) : 0;
                        return (
                          <div key={run.id} className="rounded-md border border-gray-700 bg-[#1b1f2a] p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm text-white">{run.title}</p>
                              <Badge variant="outline" className="border-gray-600 text-gray-200">{run.status}</Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500">{String(run.objective || '').slice(0, 110)}</p>
                            <p className="mt-1 text-xs text-gray-400">checkpoints: {doneCount}/{checkpoints.length}</p>
                            <p className="text-[11px] text-gray-500">updated {new Date(run.updatedAt || run.createdAt).toLocaleString()}</p>
                            <div className="mt-2 h-1.5 rounded-full bg-gray-700">
                              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-700 bg-[#252830] p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Approval Queue</p>
                    {approvalQueue.length === 0 ? (
                      <p className="text-sm text-gray-400">No pending confirmations.</p>
                    ) : (
                      approvalQueue.slice(0, 8).map((run) => (
                        <div key={`approval-${run.id}`} className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2">
                          <p className="text-sm text-amber-100">{run.title}</p>
                          <p className="text-xs text-amber-200/80 mt-0.5">requires confirmation • risk budget {run.riskBudget}</p>
                            <p className="text-[11px] text-amber-100/70 mt-0.5">max actions/hour {run.maxActionsPerHour}</p>
                          <div className="mt-2 flex gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => void controlRun(run.id, 'resume')} disabled={busy}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void controlRun(run.id, 'pause')} disabled={busy}>
                              Hold
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-700 bg-[#252830] p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Action Ledger</p>
                    {actionLedger.length === 0 ? (
                      <p className="text-sm text-gray-400">No telemetry events yet.</p>
                    ) : (
                      actionLedger.map((event) => (
                        <div key={event.id} className="rounded-md border border-gray-700 bg-[#1b1f2a] p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-white">{event.eventType}</p>
                            <span className="text-[10px] text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {String((event.payload && (event.payload.runId as string)) || (event.payload && (event.payload.title as string)) || 'event')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">Mission Governance</p>
                    <Badge variant="outline" className="border-gray-700 text-gray-300">mode: {mission?.policy.mode || 'confirm'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['suggest', 'confirm', 'auto'] as PolicyMode[]).map((mode) => (
                      <Button key={mode} variant={mission?.policy.mode === mode ? 'default' : 'outline'} onClick={() => void updatePolicy({ mode })} disabled={busy}>
                        {mode.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#252830] px-3 py-3">
                    <div>
                      <div className="text-white text-sm">Require external confirmation</div>
                      <div className="text-gray-400 text-xs">Keep human approval before connected-system actions.</div>
                    </div>
                    <Switch checked={mission?.policy.requireExternalConfirmation ?? true} onCheckedChange={(checked) => void updatePolicy({ requireExternalConfirmation: checked })} disabled={busy} />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <CloudCog className="w-4 h-4 text-blue-300" />
                    Local Runtime Pairing
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Pair a local runtime to unlock deeper computer-level execution while keeping mission continuity in SyncScript.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <input
                      value={connectorName}
                      onChange={(event) => setConnectorName(event.target.value)}
                      className="min-w-[240px] flex-1 bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                      placeholder="Connector name"
                    />
                    <Button onClick={() => void createPairingCode()} disabled={busy} className="gap-1.5">
                      <Rocket className="w-4 h-4" />
                      Create Pairing Code
                    </Button>
                  </div>
                  {pairingCode && <div className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-indigo-200 font-mono text-sm">{pairingCode}</div>}
                  {!FEATURE_FLAGS.enterpriseDesktopExpansionEnabled ? (
                    <p className="mt-3 text-xs text-amber-300">
                      Desktop-capable runtime actions are gated behind `VITE_FEATURE_ENTERPRISE_DESKTOP_EXPANSION`.
                    </p>
                  ) : null}
                  {FEATURE_FLAGS.enterpriseDesktopExpansionEnabled && !desktopExpansionReadiness.passesSafetyGate ? (
                    <p className="mt-2 text-xs text-amber-300">
                      Desktop actions are waiting on safety gate: need {'>='}10 recent events and {'>='}90% non-failure readiness (current {desktopExpansionReadiness.readinessScore}%).
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void queueRuntimeAction('send-email-followups')}
                      disabled={busy || !desktopExpansionReadiness.canEnableDesktopActions}
                    >
                      Queue Email Followups
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void queueRuntimeAction('create-calendar-blocks')}
                      disabled={busy || !desktopExpansionReadiness.canEnableDesktopActions}
                    >
                      Queue Calendar Blocks
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6 space-y-4">
              <Tabs value={taskSubTab} onValueChange={(value) => setTaskSubTab(value as TaskSubTab)}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList className="grid w-full max-w-md grid-cols-3 bg-[#202430] border border-gray-700">
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="status">Status</TabsTrigger>
                  </TabsList>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {taskSubTab === 'goals' ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setSmartType('goal'); setIsSmartGoalComposerOpen(true); }}>Smart Goal</Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsGoalTemplatesOpen(true)}>
                          <LayoutTemplate className="w-3.5 h-3.5" />
                          Templates
                        </Button>
                      </>
                    ) : taskSubTab === 'tasks' ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsTaskComposerOpen(true)}>New Task</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsSmartTaskComposerOpen(true)}>Smart Task</Button>
                        <Button size="sm" variant="outline" className="tap-feedback" onClick={() => setIsSmartEventComposerOpen(true)}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Smart Event
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsTaskTemplatesOpen(true)}>
                          <LayoutTemplate className="w-3.5 h-3.5" />
                          Templates
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsTaskComposerOpen(true)}>New Task</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsSmartTaskComposerOpen(true)}>Smart Task</Button>
                      </>
                    )}
                  </div>
                </div>

                <TabsContent value="tasks" className="space-y-4 mt-4">
                  <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5">
                    <h3 className="text-white font-semibold mb-3">Enterprise Tasks</h3>
                    <div className="space-y-2">
                      {enterpriseTasks.length === 0 && <p className="text-sm text-gray-400">No mission tasks yet.</p>}
                      {enterpriseTasks.slice(0, 30).map((task) => (
                        <div key={task.id} className="rounded-lg border border-gray-700 bg-[#252830] px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white">{task.title}</p>
                            <Badge variant="outline" className="border-blue-500/40 text-blue-300">{task.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{task.agentId} - {new Date(task.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="goals" className="space-y-4 mt-4">
                  <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-3">
                    <div className="flex gap-2">
                      <input value={newGoalTitle} onChange={(event) => setNewGoalTitle(event.target.value)} placeholder="Create a new enterprise goal..." className="flex-1 rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white" />
                      <Button onClick={() => void createGoal()} disabled={busy || !newGoalTitle.trim()}>Create Goal</Button>
                    </div>
                    <div className="space-y-2">
                      {goals.length === 0 && <p className="text-sm text-gray-400">No goals yet. Add your first business objective.</p>}
                      {goals.map((goal) => (
                        <div key={goal.id} className="rounded-md border border-gray-700 bg-[#252830] px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white">{goal.title}</p>
                            <Badge variant="outline" className={goal.status === 'completed' ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/40 text-amber-300'}>
                              {goal.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Progress: {goal.progress || 0}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="status" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-300">Done retention (hours)</p>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={doneRetentionHours}
                      onChange={(event) => setDoneRetentionHours(Math.max(1, Math.min(720, Number(event.target.value) || 72)))}
                      className="w-24 rounded-md border border-gray-700 bg-[#12151b] px-2 py-1 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <StatusColumn title="Do" items={taskBoard.do} onMove={(taskId) => void updateTaskStatus(taskId, 'doing')} moveLabel="Move to Doing" />
                    <StatusColumn title="Doing" items={taskBoard.doing} onMove={(taskId) => void updateTaskStatus(taskId, 'done')} moveLabel="Move to Done" />
                    <StatusColumn title="Done" items={taskBoard.done} onMove={(taskId) => void updateTaskStatus(taskId, 'do')} moveLabel="Reopen" />
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="agents" className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Agent Visual Directory</h3>
                  <div className="flex items-center gap-2">
                    <input
                      value={discordUserId}
                      onChange={(event) => setDiscordUserId(event.target.value)}
                      placeholder="Discord user id for route linkage"
                      className="w-64 rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-xs text-white"
                    />
                    <Button size="sm" variant="outline" onClick={() => void fetchDiscordProvisioningState()} disabled={discordProvisionLoading || !discordUserId.trim()}>
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${discordProvisionLoading ? 'animate-spin' : ''}`} />
                      Sync Discord Routes
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Each card maps SyncScript agents to their Discord route key and provisioned channel/thread.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-700 bg-[#1a1e27] px-3 py-2">
                  <div>
                    <p className="text-xs text-gray-200">Identity cloud sync</p>
                    <p className="text-[11px] text-gray-500">
                      {agentIdentityLoading ? 'Loading profiles from cloud...' : 'Profiles sync across devices for this workspace.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">Mirror voice badges to Discord agent labels</span>
                    <Switch checked={syncIdentityToDiscordLabels} onCheckedChange={setSyncIdentityToDiscordLabels} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {visualAgentCards.map((card) => {
                    const avatar = card.name.trim().slice(0, 2).toUpperCase();
                    const avatarUrl = card.avatarUrl || card.avatarDataUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(card.name)}&backgroundType=gradientLinear`;
                    const discordId = card.discordRoute?.threadId || '';
                    const discordGuildId = card.discordRoute?.guildId || '';
                    const discordUrl = discordGuildId && discordId
                      ? `https://discord.com/channels/${discordGuildId}/${discordId}`
                      : '';
                    const capabilityBadges = inferAgentCapabilities(card.domainTab, card.id);
                    return (
                      <div key={`${card.kind}:${card.id}`} className="rounded-lg border border-gray-700 bg-gradient-to-br from-[#252830] to-[#1f2430] p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="relative h-10 w-10">
                              <img src={avatarUrl} alt={card.name} className="h-10 w-10 rounded-full border border-cyan-400/40 bg-[#141821]" />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1f2430] ${
                                  card.isActive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.95)] animate-pulse' : 'bg-gray-500'
                                }`}
                              />
                              <span className="sr-only">{avatar}</span>
                            </div>
                            <div>
                              <p className="text-sm text-white">{card.name}</p>
                              <p className="text-xs text-gray-400">{card.subtitle}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={card.isActive ? 'border-emerald-500/40 text-emerald-300' : 'border-gray-600 text-gray-300'}>
                            {card.isActive ? 'active' : 'idle'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500">route: {card.routeKey}</p>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-200">
                            <Volume2 className="w-3 h-3 mr-1" />
                            {card.voiceBadge || 'Strategist'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {capabilityBadges.map((capability) => (
                            <span
                              key={`${card.id}-${capability}`}
                              className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200"
                            >
                              {capability}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRouteContext({
                                type: card.kind === 'enterprise' ? 'enterprise-agent' : 'tab',
                                domainTab: card.domainTab,
                                workspaceId,
                                agentId: card.id,
                                agentName: card.name,
                                source: 'in-app',
                              });
                              requestOpen();
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Talk
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openIdentityEditor(card.cardKey)}
                          >
                            <ImagePlus className="w-3.5 h-3.5 mr-1" />
                            Identity
                          </Button>
                          {discordId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(`<#${discordId}>`);
                                  toast.success('Discord route mention copied');
                                } catch {
                                  toast.error('Could not copy mention');
                                }
                              }}
                            >
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy Route
                            </Button>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                              Discord unlinked
                            </Badge>
                          )}
                          {discordUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(discordUrl, '_blank', 'noopener,noreferrer')}
                            >
                              <Link2 className="w-3.5 h-3.5 mr-1" />
                              Open Discord
                            </Button>
                          ) : null}
                          {discordId ? (
                            <span className="inline-flex items-center rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-200">
                              <Link2 className="w-3 h-3 mr-1" />
                              {discordGuildId ? `#${discordId}` : `#${discordId} (guild pending)`}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Discord Tab Subagents</h3>
                  <Badge variant="outline" className="border-indigo-500/40 text-indigo-300">
                    Auto-synced to Discord provisioning
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">
                  Create specialized subagents under any tab agent (for example `email-followups` under Email). They are synced from SyncScript and provisioned in Discord automatically.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <select
                    value={newSubagentTab}
                    onChange={(event) => setNewSubagentTab(event.target.value as TabAgentParent)}
                    className="rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
                  >
                    <option value="dashboard">dashboard</option>
                    <option value="tasks">tasks</option>
                    <option value="goals">goals</option>
                    <option value="calendar">calendar</option>
                    <option value="financials">financials</option>
                    <option value="email">email</option>
                  </select>
                  <input
                    value={newSubagentId}
                    onChange={(event) => setNewSubagentId(event.target.value)}
                    placeholder="subagent-id (e.g. email-followups)"
                    className="rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={newSubagentName}
                    onChange={(event) => setNewSubagentName(event.target.value)}
                    placeholder="Display name"
                    className="rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
                  />
                  <Button onClick={addDiscordTabSubagent} disabled={!newSubagentId.trim() || !newSubagentName.trim()}>
                    Add Subagent
                  </Button>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {discordTabSubagents.length === 0 ? (
                    <p className="text-xs text-gray-500">No custom tab subagents yet.</p>
                  ) : (
                    discordTabSubagents.map((agent) => (
                      <div key={`${agent.tab}:${agent.id}`} className="rounded-md border border-gray-700 bg-[#252830] px-3 py-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm text-white">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.tab}{' -> '}{agent.id}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => removeDiscordTabSubagent(agent.id, agent.tab)}>
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <EnterpriseHierarchyMap
                agents={displayAgents}
                onSelectAgent={openAgentModal}
                onSelectTeam={(teamName) => {
                  setSelectedTeam(teamName);
                  setIsTeamModalOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="enterprise" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-4">
                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-2">
                  <h3 className="text-white font-semibold text-sm">Enterprises</h3>
                  {workspaces.map((workspace) => (
                    <button key={workspace.id} onClick={() => setWorkspaceId(workspace.id)} className={`w-full rounded-md border px-3 py-2 text-left ${workspace.id === workspaceId ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200' : 'border-gray-700 bg-[#252830] text-gray-300'}`}>
                      {workspace.name}
                    </button>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => setShowCreateWorkspace((prev) => !prev)}>
                    Create Enterprise
                  </Button>
                  {showCreateWorkspace && (
                    <div className="rounded-md border border-gray-700 bg-[#252830] p-3 space-y-2 mt-2">
                      <input
                        value={workspaceName}
                        onChange={(event) => setWorkspaceName(event.target.value)}
                        placeholder="Enterprise name"
                        className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
                      />
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowEnterpriseTemplates((prev) => !prev)}
                      >
                        <LayoutTemplate className="w-4 h-4" />
                        Choose Template
                      </Button>
                      {showEnterpriseTemplates && (
                        <div className="space-y-1.5">
                          {ENTERPRISE_TEMPLATES.map((template) => (
                            <button
                              key={template.name}
                              onClick={() => setEnterpriseTemplatePrompt(template.prompt)}
                              className={`w-full rounded-md border px-2 py-2 text-left text-xs ${
                                enterpriseTemplatePrompt === template.prompt
                                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                                  : 'border-gray-700 bg-[#1c2230] text-gray-300'
                              }`}
                            >
                              <p className="font-medium">{template.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{template.prompt}</p>
                            </button>
                          ))}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => void createWorkspace()}
                        disabled={busy || !workspaceName.trim()}
                      >
                        {busy ? 'Creating...' : 'Create Enterprise + Hierarchy'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-300" />
                    Enterprise Hierarchy
                  </h3>
                  <p className="text-xs text-gray-400">
                    Agents execute SyncScript actions now. With local runtime pairing, they can run deeper computer actions similar to desktop-grade autonomy.
                  </p>
                  <div className="rounded-lg border border-gray-700 bg-[#252830] p-3">
                    <p className="text-xs text-gray-300 mb-2">Describe the enterprise and Nexus will generate the team blueprint.</p>
                    <Textarea
                      value={enterprisePrompt}
                      onChange={(event) => setEnterprisePrompt(event.target.value)}
                      className="min-h-24 border-gray-700 bg-[#12151b]"
                      placeholder="Example: Create an e-commerce growth enterprise with strong content + sales execution."
                    />
                    <div className="flex justify-end mt-2">
                      <Button onClick={() => void generateEnterpriseFromPrompt()} disabled={busy || !enterprisePrompt.trim()}>
                        {busy ? 'Generating...' : 'Generate Enterprise'}
                      </Button>
                    </div>
                  </div>

                  <EnterpriseHierarchyMap
                    agents={displayAgents}
                    onSelectAgent={openAgentModal}
                    onSelectTeam={(teamName) => {
                      setSelectedTeam(teamName);
                      setIsTeamModalOpen(true);
                    }}
                    showAddMember
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="office" className="mt-6">
              <EnterpriseOfficeSimulation
                agents={displayAgents.map((agent) => ({
                  id: agent.id,
                  name: agent.name,
                  team: agent.team,
                  status: activeAgentIdSet.has(String(agent.id)) ? 'active' : 'idle',
                }))}
              />
            </TabsContent>

            <TabsContent value="memory" className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5 space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-300" />
                  Mission Memory
                </h3>
                <p className="text-sm text-gray-400">Canonical memory for this workspace. Save key context to keep enterprise runs consistent.</p>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Store a high-signal mission note..." className="min-h-24 bg-[#252830] border-gray-700" />
                <div className="flex justify-end">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white" onClick={() => void saveMemoryNote(note, ['enterprise', 'mission-control'])} disabled={busy || !note.trim()}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save Note
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-5">
                <h4 className="text-white font-medium mb-3">Recent Memory Entries</h4>
                <div className="space-y-2">
                  {(memorySnapshot?.memories || []).slice(0, 10).map((memory: any) => (
                    <div key={memory.id} className="rounded-lg border border-gray-700 bg-[#252830] p-3">
                      <div className="text-sm text-white">{memory.content}</div>
                      <div className="text-xs text-gray-400 mt-1">{memory.type} - importance {Math.round((memory.importance || 0) * 100)}%</div>
                    </div>
                  ))}
                  {(memorySnapshot?.memories || []).length === 0 && <p className="text-gray-400 text-sm">No memory entries yet.</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <EnterpriseAgentModal
        open={isAgentModalOpen}
        onOpenChange={setIsAgentModalOpen}
        agent={selectedAgent}
        recentActions={enterpriseTasks.filter((task) => task.agentId === selectedAgent?.id).slice(0, 8).map((task) => ({
          id: task.id,
          title: task.title,
          timestamp: new Date(task.updatedAt || task.createdAt).toLocaleString(),
          status: task.status,
        }))}
        onSaveMemory={async (modalNote) => {
          await saveMemoryNote(`[${selectedAgent?.name || 'agent'}] ${modalNote}`, ['enterprise', `agent:${selectedAgent?.id || 'unknown'}`]);
        }}
      />

      <EnterpriseTeamModal
        open={isTeamModalOpen}
        onOpenChange={setIsTeamModalOpen}
        teamName={selectedTeam || 'Team'}
        agents={teamAgents}
        actions={teamActions}
        onSelectAgent={(agent) => {
          setIsTeamModalOpen(false);
          openAgentModal(agent);
        }}
        onAddMember={async (payload) => {
          if (!selectedTeam) return;
          await addTeamMember(selectedTeam, payload);
        }}
        onSaveTeamMemory={async (memoryText) => {
          if (!selectedTeam) return;
          await saveMemoryNote(`[team:${selectedTeam}] ${memoryText}`, ['enterprise', `team:${selectedTeam.toLowerCase()}`]);
        }}
      />

      <Dialog open={Boolean(identityEditorKey)} onOpenChange={(open) => {
        if (!open) setIdentityEditorKey(null);
      }}>
        <DialogContent className="max-w-xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
          <DialogHeader><DialogTitle>Agent Identity Studio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Customize avatar and voice badge for {selectedIdentityCard?.name || 'this agent'}.
            </p>
            <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-[#1f2430] p-3">
              <img
                src={identityAvatarPreview || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(selectedIdentityCard?.name || 'agent')}&backgroundType=gradientLinear`}
                alt={selectedIdentityCard?.name || 'Agent'}
                className="h-14 w-14 rounded-full border border-cyan-400/40 bg-[#141821]"
              />
              <div className="space-y-1">
                <p className="text-sm text-white">{selectedIdentityCard?.name || 'Agent'}</p>
                <span className="inline-flex items-center rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-200">
                  <Volume2 className="w-3 h-3 mr-1" />
                  {identityVoiceBadge}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-300">Upload custom avatar</p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void handleIdentityAvatarUpload(file).catch(() => toast.error('Could not process avatar image'));
                }}
                className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-xs text-white file:mr-3 file:rounded file:border-0 file:bg-cyan-600/25 file:px-2 file:py-1 file:text-cyan-200"
              />
              <p className="text-[11px] text-gray-500">Images are auto-resized for fast loading.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-300">Agent voice badge</p>
              <select
                value={identityVoiceBadge}
                onChange={(event) => setIdentityVoiceBadge(event.target.value)}
                className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
              >
                {VOICE_BADGE_OPTIONS.map((voice) => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={clearIdentityAvatar}>Reset avatar</Button>
              <Button className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white" onClick={saveIdentityEditor}>
                Save Identity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskComposerOpen} onOpenChange={setIsTaskComposerOpen}>
        <DialogContent className="max-w-2xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
          <DialogHeader><DialogTitle>Create Enterprise Task</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Task title" className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white" />
            <Textarea value={newTaskDescription} onChange={(event) => setNewTaskDescription(event.target.value)} placeholder="Task description" className="min-h-20 border-gray-700 bg-[#12151b]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Textarea value={newTaskMilestones} onChange={(event) => setNewTaskMilestones(event.target.value)} placeholder="Milestones (one per line)" className="min-h-20 border-gray-700 bg-[#12151b]" />
              <Textarea value={newTaskSteps} onChange={(event) => setNewTaskSteps(event.target.value)} placeholder="Steps (one per line)" className="min-h-20 border-gray-700 bg-[#12151b]" />
            </div>
            <select value={newTaskTeam} onChange={(event) => setNewTaskTeam(event.target.value)} className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white">
              {TEAM_ORDER.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <Button onClick={() => void createManualTask()} disabled={busy || !newTaskTitle.trim()}>Create Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSmartTaskComposerOpen || isSmartGoalComposerOpen} onOpenChange={(open) => {
        if (!open) {
          setIsSmartTaskComposerOpen(false);
          setIsSmartGoalComposerOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
          <DialogHeader><DialogTitle>Create Smart {smartType === 'goal' ? 'Goal' : 'Task'}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input value={smartTitle} onChange={(event) => setSmartTitle(event.target.value)} placeholder={`Smart ${smartType} title`} className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white" />
            <Textarea value={smartDescription} onChange={(event) => setSmartDescription(event.target.value)} placeholder="Objective / context for automatic assignment" className="min-h-20 border-gray-700 bg-[#12151b]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Textarea value={smartMilestones} onChange={(event) => setSmartMilestones(event.target.value)} placeholder="Milestones (one per line)" className="min-h-20 border-gray-700 bg-[#12151b]" />
              <Textarea value={smartSteps} onChange={(event) => setSmartSteps(event.target.value)} placeholder="Steps (one per line)" className="min-h-20 border-gray-700 bg-[#12151b]" />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void createSmartItem()} disabled={busy || !smartTitle.trim()}>
                Create Smart {smartType === 'goal' ? 'Goal' : 'Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSmartEventComposerOpen} onOpenChange={setIsSmartEventComposerOpen}>
        <DialogContent className="max-w-2xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
          <DialogHeader><DialogTitle>Smart Event Orchestrator</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input
              value={smartTitle}
              onChange={(event) => setSmartTitle(event.target.value)}
              placeholder="Outcome title (goal)"
              className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
            />
            <Textarea
              value={smartEventObjective}
              onChange={(event) => setSmartEventObjective(event.target.value)}
              placeholder="Outcome objective and constraints"
              className="min-h-20 border-gray-700 bg-[#12151b]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={smartEventStartAt}
                onChange={(event) => setSmartEventStartAt(event.target.value)}
                placeholder="Start date/time (ISO optional)"
                className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
              />
              <input
                type="number"
                value={smartEventStepCount}
                min={2}
                max={8}
                onChange={(event) => setSmartEventStepCount(Math.max(2, Math.min(8, Number(event.target.value) || 4)))}
                placeholder="Step count"
                className="w-full rounded-md border border-gray-700 bg-[#12151b] px-3 py-2 text-sm text-white"
              />
            </div>
            <p className="text-xs text-cyan-200/80">
              Generates goal + milestones + tasks + calendar schedule in one deterministic operation set.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => void createSmartEventPlan()} disabled={busy || !smartTitle.trim()}>
                Create Smart Event Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskTemplatesOpen} onOpenChange={setIsTaskTemplatesOpen}>
        <DialogContent className="max-w-3xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
          <DialogHeader><DialogTitle>Task Templates</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {taskTemplates.map((template) => (
                <div key={template.id} className="rounded-md border border-gray-700 bg-[#1f2430] p-3">
                  <p className="text-sm text-white">{template.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{template.description || 'No description'}</p>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="outline" onClick={() => void runTaskTemplate(template)} disabled={busy}>Use Template</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-gray-700 bg-[#1f2430] p-3 space-y-2">
              <p className="text-sm text-gray-200">Create Custom Template</p>
              <input value={customTemplateTitle} onChange={(event) => setCustomTemplateTitle(event.target.value)} placeholder="Template title" className="w-full rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5 text-sm text-white" />
              <Textarea value={customTemplateDescription} onChange={(event) => setCustomTemplateDescription(event.target.value)} placeholder="Template description" className="min-h-16 border-gray-700 bg-[#12151b]" />
              <Textarea value={customTemplateMilestones} onChange={(event) => setCustomTemplateMilestones(event.target.value)} placeholder="Milestones (one per line)" className="min-h-16 border-gray-700 bg-[#12151b]" />
              <Textarea value={customTemplateSteps} onChange={(event) => setCustomTemplateSteps(event.target.value)} placeholder="Steps (one per line)" className="min-h-16 border-gray-700 bg-[#12151b]" />
              <div className="flex justify-end">
                <Button onClick={createCustomTaskTemplate} disabled={!customTemplateTitle.trim()}>Save Template</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGoalTemplatesOpen} onOpenChange={setIsGoalTemplatesOpen}>
        <DialogContent className="max-w-3xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
          <DialogHeader><DialogTitle>Goal Templates</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {goalTemplates.map((template) => (
                <div key={template.id} className="rounded-md border border-gray-700 bg-[#1f2430] p-3">
                  <p className="text-sm text-white">{template.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{template.description || 'No description'}</p>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="outline" onClick={() => void runGoalTemplate(template)} disabled={busy}>Use Template</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-gray-700 bg-[#1f2430] p-3 space-y-2">
              <p className="text-sm text-gray-200">Create Custom Goal Template</p>
              <input value={customTemplateTitle} onChange={(event) => setCustomTemplateTitle(event.target.value)} placeholder="Template title" className="w-full rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5 text-sm text-white" />
              <Textarea value={customTemplateDescription} onChange={(event) => setCustomTemplateDescription(event.target.value)} placeholder="Template description" className="min-h-16 border-gray-700 bg-[#12151b]" />
              <Textarea value={customTemplateMilestones} onChange={(event) => setCustomTemplateMilestones(event.target.value)} placeholder="Milestones (one per line)" className="min-h-16 border-gray-700 bg-[#12151b]" />
              <Textarea value={customTemplateSteps} onChange={(event) => setCustomTemplateSteps(event.target.value)} placeholder="Steps (one per line)" className="min-h-16 border-gray-700 bg-[#12151b]" />
              <div className="flex justify-end">
                <Button onClick={createCustomGoalTemplate} disabled={!customTemplateTitle.trim()}>Save Template</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: 'teal' | 'blue' | 'purple' | 'emerald';
}) {
  const toneMap: Record<string, string> = {
    teal: 'text-teal-300 bg-teal-500/10 border-teal-500/30',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  };
  return (
    <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4">
      <div className={`inline-flex rounded-md border px-2 py-2 ${toneMap[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs text-gray-400 mt-3">{label}</div>
      <div className="text-white text-2xl mt-1">{value}</div>
    </div>
  );
}

function StatusColumn({
  title,
  items,
  onMove,
  moveLabel,
}: {
  title: string;
  items: any[];
  onMove: (taskId: string) => void;
  moveLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-white text-sm font-medium">{title}</p>
        <Badge variant="outline" className="border-gray-700 text-gray-300">{items.length}</Badge>
      </div>
      {items.length === 0 && <p className="text-xs text-gray-500">No tasks.</p>}
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-gray-700 bg-[#252830] p-2">
          <p className="text-sm text-white">{item.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.agentId || 'agent'} - {new Date(item.updatedAt || item.createdAt).toLocaleString()}</p>
          <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs text-cyan-300 hover:text-cyan-200" onClick={() => onMove(item.id)}>
            {moveLabel}
          </Button>
        </div>
      ))}
    </div>
  );
}

function CommandMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'emerald' | 'violet';
}) {
  const toneClass = {
    cyan: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
    amber: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    violet: 'border-violet-500/40 text-violet-300 bg-violet-500/10',
  }[tone];
  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function sanitizeDiscordSlug(raw: string): string {
  return String(raw || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32) || 'default';
}

async function resizeAvatarToDataUrl(file: File, maxSize: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.85);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload] = dataUrl.split(',');
  if (!meta || !payload) throw new Error('Invalid data URL');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || 'image/webp';
  const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function inferAgentCapabilities(domainTab: string, agentId: string): string[] {
  const tab = String(domainTab || '').toLowerCase();
  const id = String(agentId || '').toLowerCase();
  if (tab === 'email' || id.includes('email')) return ['inbox triage', 'followups', 'campaign drafts'];
  if (tab === 'calendar' || id.includes('calendar')) return ['schedule planning', 'conflict detection', 'timeline prep'];
  if (tab === 'tasks' || id.includes('task')) return ['task breakdown', 'prioritization', 'milestone sync'];
  if (tab === 'goals' || id.includes('goal')) return ['goal planning', 'weekly checkpoints', 'progress coaching'];
  if (tab === 'financials' || id.includes('financial')) return ['cashflow insights', 'budget planning', 'risk flagging'];
  if (tab === 'enterprise') return ['team orchestration', 'cross-agent handoffs', 'approval routing'];
  return ['context routing', 'memory-backed chat', 'agent coordination'];
}

function groupAgentsByTeam(agents: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  for (const agent of agents) {
    const team = String(agent?.team || inferTeamFromRow(Number(agent?.row) || 0));
    if (!grouped.has(team)) grouped.set(team, []);
    grouped.get(team)!.push(agent);
  }
  return grouped;
}

function inferTeamFromRow(row: number): string {
  if (row <= 1) return 'Leadership';
  if (row <= 3) return 'Advisory';
  return 'Operations';
}

function getDefaultEnterpriseTaskTemplates() {
  return [
    {
      id: 'tpl_task_weekly_exec',
      title: 'Weekly Execution Sprint',
      description: 'Create and dispatch this week`s highest-impact actions across all core teams.',
      milestones: ['Define weekly outcomes', 'Assign owners', 'Run mid-week check', 'Ship Friday review'],
      steps: ['Collect priorities from each team', 'Rank by impact and urgency', 'Assign agents', 'Track status'],
      team: 'Leadership',
    },
    {
      id: 'tpl_task_launch_campaign',
      title: 'Campaign Launch Runbook',
      description: 'Cross-team launch checklist covering research, creative, engineering, and sales.',
      milestones: ['Research complete', 'Creative assets ready', 'Landing page shipped', 'Sales handoff'],
      steps: ['Gather market insights', 'Produce launch assets', 'Publish updates', 'Run outreach sequence'],
      team: 'Content',
    },
    {
      id: 'tpl_task_quality_guard',
      title: 'Quality Guardrail Sweep',
      description: 'QA and risk pass before major releases.',
      milestones: ['Test plan built', 'Critical checks done', 'Final approval'],
      steps: ['Run regression checks', 'Verify analytics and alerts', 'Confirm rollback plan'],
      team: 'Development',
    },
  ];
}

function getDefaultEnterpriseGoalTemplates() {
  return [
    {
      id: 'tpl_goal_growth',
      title: 'Quarterly Growth Goal',
      description: 'Drive measurable growth through coordinated product, content, and sales execution.',
      milestones: ['Baseline metrics captured', 'Growth experiments launched', 'Pipeline scaled'],
      steps: ['Set KPI targets', 'Assign experiments', 'Review weekly progress'],
    },
    {
      id: 'tpl_goal_operational_excellence',
      title: 'Operational Excellence Goal',
      description: 'Improve execution quality, cycle time, and release confidence.',
      milestones: ['Process bottlenecks identified', 'Automation implemented', 'Cycle time reduced'],
      steps: ['Audit current workflow', 'Standardize operating rhythm', 'Monitor quality KPIs'],
    },
    {
      id: 'tpl_goal_customer_delight',
      title: 'Customer Delight Goal',
      description: 'Improve onboarding and customer outcomes with proactive agent support.',
      milestones: ['Top pain points mapped', 'Experience fixes launched', 'Retention trend improves'],
      steps: ['Review feedback', 'Prioritize fixes', 'Deploy and measure'],
    },
  ];
}

function EnterpriseHierarchyMap({
  agents,
  onSelectAgent,
  onSelectTeam,
  showAddMember = false,
}: {
  agents: any[];
  onSelectAgent: (agent: any) => void;
  onSelectTeam?: (teamName: string) => void;
  showAddMember?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const teamNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<Array<{ key: string; d: string }>>([]);

  const rows = useMemo(() => {
    const teamMap = new Map<string, { name: string; row: number; agents: any[] }>();
    for (const agent of agents) {
      const teamName = String(agent?.team || 'Unassigned');
      const row = Number(agent?.row) || 0;
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, { name: teamName, row, agents: [] });
      }
      const team = teamMap.get(teamName)!;
      team.agents.push(agent);
      team.row = Math.min(team.row, row || team.row);
    }
    const rowMap = new Map<number, Array<{ name: string; row: number; agents: any[] }>>();
    for (const team of teamMap.values()) {
      if (!rowMap.has(team.row)) rowMap.set(team.row, []);
      rowMap.get(team.row)!.push(team);
    }
    return Array.from(rowMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([row, teams]) => [row, teams.sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [agents]);

  const teamEdges = useMemo(() => {
    const byId = new Map<string, any>();
    const teamByAgentId = new Map<string, string>();
    const edges = new Set<string>();
    agents.forEach((agent) => {
      byId.set(agent.id, agent);
      teamByAgentId.set(agent.id, String(agent.team || 'Unassigned'));
    });

    agents.forEach((agent) => {
      if (!agent.reportsTo) return;
      const parentTeam = teamByAgentId.get(String(agent.reportsTo));
      const childTeam = teamByAgentId.get(String(agent.id));
      if (parentTeam && childTeam && parentTeam !== childTeam) {
        edges.add(`${parentTeam}::${childTeam}`);
      }
    });

    if (edges.size === 0) {
      [
        ['Leadership', 'Advisory'],
        ['Advisory', 'Research'],
        ['Advisory', 'Development'],
        ['Advisory', 'Content'],
        ['Research', 'Creative'],
        ['Development', 'Product'],
        ['Content', 'Sales'],
      ].forEach(([from, to]) => edges.add(`${from}::${to}`));
    }

    return Array.from(edges).map((edge) => {
      const [fromTeam, toTeam] = edge.split('::');
      return { fromTeam, toTeam };
    });
  }, [agents]);

  useEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const nextPaths: Array<{ key: string; d: string }> = [];
      teamEdges.forEach(({ fromTeam, toTeam }) => {
        const fromNode = teamNodeRefs.current[fromTeam];
        const toNode = teamNodeRefs.current[toTeam];
        if (!fromNode || !toNode) return;
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
        const y1 = fromRect.top + fromRect.height - containerRect.top;
        const x2 = toRect.left + toRect.width / 2 - containerRect.left;
        const y2 = toRect.top - containerRect.top;
        const midY = y1 + Math.max(18, (y2 - y1) * 0.52);
        const d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        nextPaths.push({ key: `${fromTeam}->${toTeam}`, d });
      });
      setPaths(nextPaths);
    };

    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [rows, teamEdges]);

  return (
    <div ref={containerRef} className="relative rounded-xl border border-gray-700 bg-[#131722] p-4 space-y-3">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {paths.map((path) => (
          <path key={path.key} d={path.d} fill="none" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" strokeLinecap="round" />
        ))}
      </svg>
      {rows.map(([row, rowTeams], rowIndex) => (
        <div key={row} className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Tier {row}</p>
          </div>
          <div className="pointer-events-none absolute left-0 right-0 top-7 h-px bg-cyan-500/20" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rowTeams.map((team) => (
              <div
                key={`${row}-${team.name}`}
                ref={(node) => {
                  teamNodeRefs.current[team.name] = node;
                }}
                className="rounded-xl border border-gray-700 bg-[#161c28] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectTeam?.(team.name)}
                    className="text-xs font-semibold uppercase tracking-wide text-cyan-200 hover:text-cyan-100"
                  >
                    {team.name}
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-600 text-gray-300">{team.agents.length}</Badge>
                    {showAddMember ? (
                      <button
                        onClick={() => onSelectTeam?.(team.name)}
                        className="rounded-md border border-gray-600 p-1 text-gray-300 hover:border-cyan-500/60 hover:text-cyan-200"
                        aria-label={`Add member to ${team.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  {team.agents.map((agent: any) => (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent)}
                      className="w-full rounded-lg border border-gray-700 bg-[#1d2330] px-3 py-2 text-left hover:border-cyan-500/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-white">{agent.name}</p>
                        <span className={`h-2.5 w-2.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.85)]' : 'bg-gray-500'}`} />
                      </div>
                      <p className="text-xs text-gray-400">{agent.role || team.name}</p>
                      {agent.reportsTo ? <p className="text-[11px] text-gray-500 mt-1">reports to {agent.reportsTo}</p> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {rowIndex < rows.length - 1 && (
            <div className="mx-auto mt-2 h-4 w-px bg-gradient-to-b from-cyan-400/70 to-transparent" />
          )}
        </div>
      ))}
    </div>
  );
}
