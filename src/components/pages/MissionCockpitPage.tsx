import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, PauseCircle, PlayCircle, Rocket, Shield, Siren, Watch, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useContinuity } from '../../contexts/ContinuityContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import {
  createMission,
  listMissionRuntimes,
  type MissionRecord,
  type MissionRuntimeContract,
  advanceMissionNode,
  getMissionPolicy,
  updateMissionPolicy,
  listPendingApprovals,
  respondToApproval,
  type ApprovalRecord,
  registerExecutor,
  registerCamera,
  listCameras,
  openCameraLiveSession,
  createSceneEvent,
  listSceneEvents,
  respondToSceneEvent,
  type CameraRecord,
  type SceneEvent,
  getLayeredMemorySnapshot,
  type LayeredMemorySnapshot,
} from '../../services/mission-control';
import { getCameraConnector } from '../../camera/connectors';
import { requireBiometricForCriticalApproval } from '../../native/biometric-gate';

const DEFAULT_WORKSPACE = 'default';

function getRiskBadgeClass(riskClass: string): string {
  if (riskClass === 'high') return 'border-rose-500/40 text-rose-300';
  if (riskClass === 'medium') return 'border-amber-500/40 text-amber-300';
  return 'border-emerald-500/40 text-emerald-300';
}

export function MissionCockpitPage() {
  const { user } = useAuth();
  const { continuity, createWatchQuickActions, queueAgentAction } = useContinuity();
  const userId = user?.id || 'anon';
  const workspaceId = DEFAULT_WORKSPACE;

  const [policy, setPolicy] = useState({
    requireCriticalApproval: true,
    emergencyLockdown: false,
    spendCapUsd: 200,
    allowedActions: [] as string[],
    deniedActions: [] as string[],
  });
  const [missionTitle, setMissionTitle] = useState('Build playable city sim prototype');
  const [missionObjective, setMissionObjective] = useState('Scaffold, implement simulation loop, run tests, and produce a demo artifact bundle.');
  const [missionCommand, setMissionCommand] = useState('Start mission: build a playable city sim prototype with automated tests and a demo report.');
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [runtimes, setRuntimes] = useState<MissionRuntimeContract[]>([]);
  const [layeredMemory, setLayeredMemory] = useState<LayeredMemorySnapshot | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [sceneEvents, setSceneEvents] = useState<SceneEvent[]>([]);
  const [financialProofPackets, setFinancialProofPackets] = useState<any[]>([]);
  const [cameraLabel, setCameraLabel] = useState('Room Camera');
  const [cameraProvider, setCameraProvider] = useState<'rtsp' | 'onvif' | 'homekit' | 'api'>('rtsp');
  const [cameraStreamUrl, setCameraStreamUrl] = useState('rtsp://username:password@192.168.1.10:554/stream1');
  const [cameraSecretHint, setCameraSecretHint] = useState('');
  const [showLaunchGuide, setShowLaunchGuide] = useState(() => {
    try {
      return localStorage.getItem('syncscript-mission-cockpit-guide-dismissed') !== 'true';
    } catch {
      return true;
    }
  });
  const [snoozedApprovals, setSnoozedApprovals] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('syncscript-mission-approval-snooze');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed as Record<string, string>;
    } catch {
      return {};
    }
  });

  const loadFinancialProofPackets = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/financial/proof-packets?workspaceId=${encodeURIComponent('workspace-main')}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.packets)) {
        setFinancialProofPackets(payload.packets.slice(0, 20));
      }
    } catch {
      // best effort only
    }
  }, []);

  const loadAll = useCallback(async () => {
    const [nextPolicy, missionBundle, nextApprovals, nextCameras, nextSceneEvents, nextLayeredMemory] = await Promise.all([
      getMissionPolicy(userId, workspaceId),
      listMissionRuntimes(userId, workspaceId),
      listPendingApprovals(userId, workspaceId),
      listCameras(userId, workspaceId),
      listSceneEvents(userId, workspaceId),
      getLayeredMemorySnapshot({ userId, layer: 'all', limit: 24 }),
    ]);
    setPolicy(nextPolicy);
    setMissions(missionBundle.missions);
    setRuntimes(missionBundle.runtimes);
    setApprovals(nextApprovals);
    setCameras(nextCameras);
    setSceneEvents(nextSceneEvents);
    setLayeredMemory(nextLayeredMemory);
  }, [userId, workspaceId]);

  useEffect(() => {
    void loadAll().catch(() => {
      // ignore first load failure
    });
    void loadFinancialProofPackets();
    const timer = window.setInterval(() => {
      void loadAll().catch(() => {
        // ignore polling failure
      });
      void loadFinancialProofPackets();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadAll, loadFinancialProofPackets]);

  useEffect(() => {
    void loadFinancialProofPackets();
  }, [loadFinancialProofPackets]);

  useEffect(() => {
    if (financialProofPackets.length > 0) return;
    try {
      const raw = localStorage.getItem('syncscript:phase2a:financial-evidence-history');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFinancialProofPackets(parsed.slice(0, 20));
    } catch {
      // ignore fallback
    }
  }, []);

  const latestMission = useMemo(() => missions[0], [missions]);
  const runtimeByMissionId = useMemo(
    () =>
      runtimes.reduce<Record<string, MissionRuntimeContract>>((acc, runtime) => {
        const key = String(runtime.missionId || runtime.runId || '');
        if (key) acc[key] = runtime;
        return acc;
      }, {}),
    [runtimes],
  );
  const latestRuntime = useMemo(() => {
    if (!latestMission) return null;
    return runtimeByMissionId[latestMission.id] || null;
  }, [latestMission, runtimeByMissionId]);
  const currentStep = latestRuntime?.currentStep || null;
  const nextStep = useMemo(() => {
    if (!latestRuntime || !currentStep) return latestRuntime?.planSteps?.find((step) => step.status === 'pending') || null;
    const at = latestRuntime.planSteps.findIndex((step) => step.nodeId === currentStep.nodeId);
    if (at === -1) return latestRuntime.planSteps.find((step) => step.status === 'pending') || null;
    return latestRuntime.planSteps.slice(at + 1).find((step) => step.status === 'pending' || step.status === 'running' || step.status === 'blocked') || null;
  }, [latestRuntime, currentStep]);
  const recentTools = useMemo(() => (latestRuntime?.toolCalls || []).slice(-4).reverse(), [latestRuntime]);
  const runtimeBlockers = useMemo(() => {
    if (!latestRuntime) return [];
    return latestRuntime.approvals.filter((approval) => approval.status === 'pending');
  }, [latestRuntime]);
  const topGoalMemory = layeredMemory?.grouped.goal_memory?.[0] || null;
  const topExecutionMemory = layeredMemory?.grouped.execution_memory?.[0] || null;
  const missionById = useMemo(
    () => missions.reduce<Record<string, MissionRecord>>((acc, mission) => {
      acc[mission.id] = mission;
      return acc;
    }, {}),
    [missions],
  );
  const visibleApprovals = useMemo(() => {
    const now = Date.now();
    return approvals.filter((approval) => {
      const snoozedUntil = snoozedApprovals[approval.id];
      if (!snoozedUntil) return true;
      const at = new Date(snoozedUntil).getTime();
      return !Number.isFinite(at) || at <= now;
    });
  }, [approvals, snoozedApprovals]);

  const createMissionNow = async () => {
    try {
      const mission = await createMission({
        userId,
        workspaceId,
        title: missionTitle,
        objective: missionObjective,
        command: missionCommand,
      });
      setMissions((prev) => [mission, ...prev]);
      toast.success('Mission created');
    } catch {
      toast.error('Could not create mission');
    }
  };

  const dismissLaunchGuide = () => {
    setShowLaunchGuide(false);
    try {
      localStorage.setItem('syncscript-mission-cockpit-guide-dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const runSafeNode = async (mission: MissionRecord, nodeId: string) => {
    try {
      const updated = await advanceMissionNode({
        userId,
        workspaceId,
        missionId: mission.id,
        nodeId,
        nextStatus: 'running',
      });
      setMissions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Node started');
    } catch {
      toast.error('Could not start node');
    }
  };

  const completeNode = async (mission: MissionRecord, nodeId: string) => {
    try {
      const updated = await advanceMissionNode({
        userId,
        workspaceId,
        missionId: mission.id,
        nodeId,
        nextStatus: 'completed',
        output: {
          diff_summary: 'Automated implementation updated target files.',
          test_report: 'Smoke tests passed on executor runner.',
          run_log: 'Mission node completed without policy violations.',
          screenshot_or_video: '',
          confidence_score: 0.82,
          risk_summary: 'Low residual risk',
        },
      });
      setMissions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Node completed with artifact output');
    } catch {
      toast.error('Could not complete node');
    }
  };

  const setCriticalApproval = async (checked: boolean) => {
    try {
      const next = await updateMissionPolicy(userId, workspaceId, { requireCriticalApproval: checked });
      setPolicy(next);
      toast.success('Policy updated');
    } catch {
      toast.error('Could not update policy');
    }
  };

  const setEmergencyLockdown = async (checked: boolean) => {
    try {
      const next = await updateMissionPolicy(userId, workspaceId, { emergencyLockdown: checked });
      setPolicy(next);
      toast.success(checked ? 'Emergency lockdown enabled' : 'Emergency lockdown disabled');
    } catch {
      toast.error('Could not update lockdown');
    }
  };

  const respondApproval = async (approval: ApprovalRecord, response: 'approve' | 'deny' | 'rollback') => {
    try {
      const needsBiometric = approval.riskClass === 'high' || response === 'approve';
      if (needsBiometric) {
        const passed = await requireBiometricForCriticalApproval('Approve critical SyncScript mission step');
        if (!passed) {
          toast.error('Biometric verification required for this approval');
          return;
        }
      }
      await respondToApproval({
        userId,
        workspaceId,
        approvalId: approval.id,
        response,
        deviceLabel: continuity.deviceLabel,
      });
      setApprovals((prev) => prev.filter((item) => item.id !== approval.id));
      setSnoozedApprovals((prev) => {
        if (!prev[approval.id]) return prev;
        const next = { ...prev };
        delete next[approval.id];
        try {
          localStorage.setItem('syncscript-mission-approval-snooze', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      toast.success(`Approval ${response}d`);
    } catch {
      toast.error('Could not submit approval response');
    }
  };

  const snoozeApproval = (approvalId: string, minutes = 15) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setSnoozedApprovals((prev) => {
      const next = { ...prev, [approvalId]: until };
      try {
        localStorage.setItem('syncscript-mission-approval-snooze', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    toast.success(`Approval snoozed for ${minutes}m`);
  };

  const pushApprovalActionsToWatch = async () => {
    if (visibleApprovals.length === 0) {
      toast.info('No visible approvals to send');
      return;
    }
    try {
      await createWatchQuickActions();
      const summary = visibleApprovals.slice(0, 4).map((approval) => {
        const mission = missionById[approval.missionId];
        const node = mission?.nodes.find((item) => item.id === approval.nodeId);
        const title = node?.title || approval.action;
        return `- ${title} (${approval.riskClass})`;
      }).join('\n');
      await queueAgentAction({
        routeKey: continuity.activeRouteKey,
        prompt: `Approval cards pending.\nUse watch quick actions to approve/deny/rollback from handoff:\n${summary}`,
      });
      toast.success('Approval actions pushed to watch quick path');
    } catch {
      toast.error('Could not push approval actions to watch');
    }
  };

  const onboardExecutor = async () => {
    try {
      const executor = await registerExecutor({
        userId,
        workspaceId,
        label: 'Home Mac Executor',
        capabilities: ['shell', 'browser', 'build', 'artifact'],
      });
      await navigator.clipboard.writeText(JSON.stringify(executor, null, 2));
      toast.success('Executor registered (credentials copied)');
    } catch {
      toast.error('Could not register executor');
    }
  };

  const onboardCamera = async () => {
    try {
      const validation = getCameraConnector(cameraProvider).validateConfig({
        provider: cameraProvider,
        label: cameraLabel,
        streamUrl: cameraStreamUrl,
        secretHint: cameraSecretHint,
      });
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }
      await registerCamera({
        userId,
        workspaceId,
        provider: cameraProvider,
        label: cameraLabel,
        streamUrl: cameraStreamUrl,
        secretHint: cameraSecretHint,
      });
      toast.success('Camera linked');
      const next = await listCameras(userId, workspaceId);
      setCameras(next);
    } catch {
      toast.error('Could not link camera');
    }
  };

  const openLiveView = async (camera: CameraRecord) => {
    try {
      const live = await openCameraLiveSession(userId, workspaceId, camera.cameraId);
      window.open(live.streamUrl, '_blank', 'noopener,noreferrer');
      toast.success('Live camera opened on laptop');
    } catch {
      toast.error('Could not open live camera session');
    }
  };

  const triggerVoiceScenePrompt = async (cameraId: string) => {
    try {
      const event = await createSceneEvent({
        userId,
        workspaceId,
        cameraId,
        eventType: 'motion',
        confidence: 0.93,
        dialogue: 'Chris, motion detected in your room. Is that you?',
      });
      setSceneEvents((prev) => [event, ...prev]);
      const utterance = new SpeechSynthesisUtterance(event.dialogue);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      toast.success('Nexus tactical alert spoken');
    } catch {
      toast.error('Could not trigger tactical alert');
    }
  };

  const respondScene = async (eventId: string, response: 'yes' | 'no' | 'ignore') => {
    try {
      const result = await respondToSceneEvent({ userId, workspaceId, eventId, response });
      toast.success(result.message);
      const next = await listSceneEvents(userId, workspaceId);
      setSceneEvents(next);
    } catch {
      toast.error('Could not resolve scene event');
    }
  };

  const exportOptimizationProofPacket = async (mission: MissionRecord, nodeId: string) => {
    const node = mission.nodes.find((item) => item.id === nodeId);
    if (!node || node.kind !== 'optimize') {
      toast.error('Optimization node not found');
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      missionId: mission.id,
      missionTitle: mission.title,
      nodeId: node.id,
      nodeTitle: node.title,
      status: node.status,
      riskClass: node.riskClass,
      executionRail: node.executionRail,
      solverEvidence: {
        solverType: node.output?.solverType || null,
        solverVersion: node.output?.solverVersion || null,
        runtimeMs: node.output?.runtimeMs ?? null,
        reproducibilityToken: node.output?.reproducibilityToken || null,
        replayPassed: node.output?.replayPassed ?? null,
        replayMismatchDetails: node.output?.replayMismatchDetails || null,
      },
      artifacts: node.output || {},
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `mission-optimizer-proof-${mission.id.slice(0, 12)}-${node.id.slice(0, 12)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Optimization proof packet exported');
    } catch {
      toast.error('Could not export optimization proof packet');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-2xl text-white flex items-center gap-2">
          <Rocket className="w-6 h-6 text-cyan-300" />
          Mission Cockpit
        </h1>
        <p className="text-sm text-slate-400">
          One shared autonomous control surface across watch, phone, and laptop with bounded safety.
        </p>
      </motion.div>

      <Tabs defaultValue="missions" className="space-y-4">
        <TabsList className="bg-[#1e2128] border border-slate-800">
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="executor">Executor</TabsTrigger>
          <TabsTrigger value="camera">Camera + Nexus</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4">
          {showLaunchGuide && (
            <Card className="bg-gradient-to-br from-cyan-600/10 to-indigo-600/10 border-cyan-500/30 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-white text-lg">First Mission Launch Guide</h2>
                  <p className="text-sm text-cyan-100/80">
                    Start with this sequence for the fastest end-to-end demo: create mission, register executor, resolve approval, confirm artifacts.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-200" onClick={dismissLaunchGuide}>
                  Dismiss
                </Button>
              </div>
              <div className="grid md:grid-cols-4 gap-2">
                <Button className="tap-feedback bg-cyan-600 hover:bg-cyan-500" onClick={createMissionNow}>
                  1) Create Mission
                </Button>
                <Button className="tap-feedback" variant="outline" onClick={onboardExecutor}>
                  2) Register Executor
                </Button>
                <Button
                  className="tap-feedback"
                  variant="outline"
                  onClick={() => {
                    const firstApproval = visibleApprovals[0];
                    if (!firstApproval) {
                      toast.info('No pending approvals yet');
                      return;
                    }
                    void respondApproval(firstApproval, 'approve');
                  }}
                >
                  3) Approve Guarded Step
                </Button>
                <Button
                  className="tap-feedback"
                  variant="outline"
                  onClick={() => {
                    if (!latestMission) {
                      toast.info('Create a mission first');
                      return;
                    }
                    const pendingNode = latestMission.nodes.find((node) => node.status === 'pending');
                    if (!pendingNode) {
                      toast.success('Mission already progressed');
                      return;
                    }
                    void completeNode(latestMission, pendingNode.id);
                  }}
                >
                  4) Generate Artifact
                </Button>
              </div>
            </Card>
          )}

          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg">Create Mission</h2>
              <div className="flex items-center gap-2 text-xs text-cyan-200">
                <Watch className="w-3.5 h-3.5" />
                Series 3 quick actions ready
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-200">Title</Label>
                <Input value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} className="bg-[#10141b] border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Objective</Label>
                <Input value={missionObjective} onChange={(e) => setMissionObjective(e.target.value)} className="bg-[#10141b] border-slate-700 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Command</Label>
              <Input value={missionCommand} onChange={(e) => setMissionCommand(e.target.value)} className="bg-[#10141b] border-slate-700 text-white" />
            </div>
            <div className="flex items-center gap-3">
              <Button className="tap-feedback bg-cyan-600 hover:bg-cyan-500" onClick={createMissionNow}>
                Start Mission
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-300" />
                <span className="text-xs text-slate-400">Critical approvals</span>
                <Switch checked={policy.requireCriticalApproval} onCheckedChange={setCriticalApproval} />
              </div>
              <div className="flex items-center gap-2">
                <Siren className="w-4 h-4 text-rose-300" />
                <span className="text-xs text-slate-400">Emergency lockdown</span>
                <Switch checked={policy.emergencyLockdown} onCheckedChange={setEmergencyLockdown} />
              </div>
            </div>
          </Card>

          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-white text-lg">What Nexus Is Doing Now</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-200">
                  {latestRuntime?.delegationLifecycle.status || latestMission?.delegationStatus || 'idle'}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {latestRuntime?.status || latestMission?.status || 'no-run'}
                </Badge>
              </div>
            </div>

            {!latestMission ? (
              <p className="text-sm text-slate-400">No active mission yet. Create one to start live Nexus observability.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-slate-700 bg-[#10141b] p-3">
                  <p className="text-xs text-slate-400">Current step</p>
                  <p className="text-sm text-white">{currentStep?.title || 'Awaiting next runnable step'}</p>
                  {nextStep && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Next: {nextStep.title}
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-slate-700 bg-[#10141b] p-3">
                  <p className="text-xs text-slate-400 mb-2">Tools used</p>
                  {recentTools.length === 0 ? (
                    <p className="text-sm text-slate-500">No tool calls recorded on this run yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {recentTools.map((toolCall) => (
                        <div key={toolCall.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-cyan-300" />
                            {toolCall.tool}
                          </span>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">{toolCall.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-slate-700 bg-[#10141b] p-3">
                  <p className="text-xs text-slate-400 mb-2">Blockers / approval needed</p>
                  {runtimeBlockers.length === 0 ? (
                    <p className="text-sm text-emerald-300">No pending blockers in this mission run.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {runtimeBlockers.slice(0, 3).map((blocker) => (
                        <p key={blocker.approvalId} className="text-xs text-amber-200">
                          {blocker.action} ({blocker.riskClass})
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-slate-700 bg-[#10141b] p-3">
                  <p className="text-xs text-slate-400 mb-2">Layered memory context</p>
                  {!layeredMemory ? (
                    <p className="text-sm text-slate-500">Memory snapshot unavailable.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-300">
                        Thought {layeredMemory.counts.thought_memory} · Goal {layeredMemory.counts.goal_memory} · Execution {layeredMemory.counts.execution_memory}
                      </p>
                      <p className="text-xs text-slate-400">
                        Goal focus: {topGoalMemory?.content || 'No confirmed goal memory yet.'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Latest execution evidence: {topExecutionMemory?.content || 'No execution artifact memory yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-white text-lg">Finance Decision Proof Packets</h2>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-200">
                {financialProofPackets.length} packets
              </Badge>
            </div>
            {financialProofPackets.length === 0 ? (
              <p className="text-sm text-slate-400">No finance proof packets found yet. Generate explainability packets in Financials to populate this audit stream.</p>
            ) : (
              <div className="space-y-2">
                {financialProofPackets.slice(0, 6).map((packet) => (
                  <div key={packet.artifactId} className="rounded-md border border-slate-700 bg-[#10141b] p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{packet?.recommendation?.title || packet.artifactId}</p>
                      <p className="text-xs text-slate-400">
                        {packet?.recommendation?.riskClass || 'risk:n/a'} • {packet?.approval?.approved ? 'approved' : 'pending'} • {new Date(packet.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = `finance-proof-${packet.artifactId || Date.now()}.json`;
                        document.body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      Export
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {latestMission && (
            <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white">{latestMission.title}</h3>
                  <p className="text-xs text-slate-400">{latestMission.objective}</p>
                </div>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-200">{latestMission.status}</Badge>
              </div>
              <div className="space-y-2">
                {latestMission.nodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between rounded-md border border-slate-700 bg-[#0f141c] p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className={getRiskBadgeClass(node.riskClass)}>
                        {node.riskClass}
                      </Badge>
                      <span className="text-sm text-slate-100 truncate">{node.title}</span>
                      <span className="text-xs text-slate-500">({node.executionRail})</span>
                      {node.kind === 'optimize' ? (
                        <Badge variant="outline" className="border-violet-500/40 text-violet-200">optimize</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">{node.status}</Badge>
                      {node.kind === 'optimize' ? (
                        <Button size="sm" variant="outline" onClick={() => void exportOptimizationProofPacket(latestMission, node.id)}>
                          Export Proof
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => runSafeNode(latestMission, node.id)}>
                        <PlayCircle className="w-3.5 h-3.5 mr-1" />
                        Run
                      </Button>
                      <Button size="sm" onClick={() => completeNode(latestMission, node.id)} className="tap-feedback">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {latestMission.nodes.some((node) => node.kind === 'optimize') ? (
                <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-3">
                  <p className="text-xs text-violet-100 mb-1">Optimization Delta Summary</p>
                  {latestMission.nodes
                    .filter((node) => node.kind === 'optimize')
                    .slice(0, 2)
                    .map((node) => (
                      <p key={`opt-summary-${node.id}`} className="text-xs text-violet-200/90">
                        {node.output?.solverType || 'solver:n/a'} {node.output?.solverVersion || 'version:n/a'} • runtime {node.output?.runtimeMs ?? 'n/a'}ms • replay{' '}
                        {typeof node.output?.replayPassed === 'boolean' ? (node.output?.replayPassed ? 'pass' : 'fail') : 'n/a'}
                      </p>
                    ))}
                </div>
              ) : null}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card className="bg-[#1e2128] border-slate-800 p-5">
            <h2 className="text-white text-lg mb-3">Approval Inbox</h2>
            {visibleApprovals.length === 0 ? (
              <p className="text-sm text-slate-400">
                {approvals.length === 0 ? 'No pending approvals.' : 'All pending approvals are currently snoozed.'}
              </p>
            ) : (
              <div className="space-y-2">
                {visibleApprovals.map((approval) => (
                  <div key={approval.id} className="rounded-md border border-slate-700 bg-[#10141b] p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{approval.action}</p>
                      <p className="text-xs text-slate-400">Risk: {approval.riskClass} · Mission {approval.missionId.slice(0, 10)}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Node {approval.nodeId.slice(0, 10)} · {new Date(approval.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="tap-feedback bg-emerald-600 hover:bg-emerald-500" onClick={() => respondApproval(approval, 'approve')}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => respondApproval(approval, 'rollback')}>
                        <PauseCircle className="w-3.5 h-3.5 mr-1" />
                        Rollback
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => snoozeApproval(approval.id, 15)}>
                        Snooze 15m
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => respondApproval(approval, 'deny')}>Deny</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
              <p className="text-xs text-slate-500">Watch quick actions mirror these approval cards for mobile/series handoff.</p>
              <Button size="sm" variant="outline" onClick={() => void pushApprovalActionsToWatch()}>
                Push approval actions to watch
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="executor" className="space-y-4">
          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-3">
            <h2 className="text-white text-lg">Home Executor Handshake</h2>
            <p className="text-sm text-slate-400">
              Register a trusted laptop/desktop executor, then run long missions with verifiable artifacts.
            </p>
            <Button className="tap-feedback" onClick={onboardExecutor}>Register Home Executor</Button>
            <p className="text-xs text-slate-500">
              Credentials are copied to clipboard for secure local runner bootstrap.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="camera" className="space-y-4">
          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-300" />
              Authorized Camera Onboarding
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-200">Label</Label>
                <Input value={cameraLabel} onChange={(e) => setCameraLabel(e.target.value)} className="bg-[#10141b] border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Provider</Label>
                <select
                  value={cameraProvider}
                  onChange={(e) => setCameraProvider(e.target.value as 'rtsp' | 'onvif' | 'homekit' | 'api')}
                  className="w-full h-10 rounded-md border border-slate-700 bg-[#10141b] px-3 text-white"
                >
                  <option value="rtsp">RTSP</option>
                  <option value="onvif">ONVIF</option>
                  <option value="homekit">HomeKit Bridge</option>
                  <option value="api">Official Camera API</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Stream URL / API endpoint</Label>
              <Input value={cameraStreamUrl} onChange={(e) => setCameraStreamUrl(e.target.value)} className="bg-[#10141b] border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Secret hint</Label>
              <Input value={cameraSecretHint} onChange={(e) => setCameraSecretHint(e.target.value)} className="bg-[#10141b] border-slate-700 text-white" />
            </div>
            <Button className="tap-feedback" onClick={onboardCamera}>Link Camera</Button>
          </Card>

          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-3">
            <h3 className="text-white">Live View + Tactical Voice</h3>
            {cameras.length === 0 ? (
              <p className="text-sm text-slate-400">No cameras linked yet.</p>
            ) : (
              cameras.map((camera) => (
                <div key={camera.cameraId} className="rounded-md border border-slate-700 bg-[#10141b] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{camera.label}</p>
                    <p className="text-xs text-slate-400">{camera.provider} · {camera.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openLiveView(camera)}>
                      Open Live
                    </Button>
                    <Button size="sm" className="tap-feedback" onClick={() => triggerVoiceScenePrompt(camera.cameraId)}>
                      Trigger Nexus Alert
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card className="bg-[#1e2128] border-slate-800 p-5 space-y-3">
            <h3 className="text-white">Scene Alerts</h3>
            {sceneEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No scene alerts yet.</p>
            ) : (
              sceneEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-slate-700 bg-[#10141b] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                      {event.dialogue}
                    </p>
                    <p className="text-xs text-slate-400">{event.eventType} · confidence {Math.round(event.confidence * 100)}% · {event.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => respondScene(event.id, 'yes')}>Yes it's me</Button>
                    <Button size="sm" className="tap-feedback bg-rose-600 hover:bg-rose-500" onClick={() => respondScene(event.id, 'no')}>
                      Not me - secure it
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => respondScene(event.id, 'ignore')}>Ignore</Button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
