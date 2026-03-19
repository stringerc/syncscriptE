import type { NodeProps } from '@xyflow/react';
import type { DragEvent as ReactDragEvent } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '../ui/badge';
import { UserAvatar } from '../user/UserAvatar';
import { getTaskCardSurfaceClasses } from '../shared/TaskCardSurface';
import { Bot, Clock3, Link2, Plus, ShieldAlert, UserRound, Users } from 'lucide-react';

const FLOW_TEMPLATE_MIME = 'application/x-syncscript-flow-template';
const TASK_MIME = 'task';

function statusClass(status: string): string {
  if (status === 'done' || status === 'completed') return 'border-emerald-500/40 text-emerald-300';
  if (status === 'doing' || status === 'in_progress') return 'border-cyan-500/40 text-cyan-300';
  if (status === 'pending') return 'border-amber-500/40 text-amber-300';
  return 'border-gray-600 text-gray-300';
}

function ownerModeLabel(input: string): string {
  const value = String(input || '').toLowerCase();
  if (value === 'agent_only') return 'Agent Only';
  if (value === 'collaborative') return 'Collaborative';
  return 'Human Only';
}

function riskClass(level: string): string {
  const value = String(level || '').toLowerCase();
  if (value === 'critical') return 'border-red-600/50 text-red-300';
  if (value === 'high') return 'border-red-500/40 text-red-300';
  if (value === 'medium') return 'border-amber-500/40 text-amber-300';
  return 'border-gray-600 text-gray-300';
}

function normalizeAssignees(input: any[]): Array<{ name: string; avatar?: string }> {
  return (Array.isArray(input) ? input : [])
    .map((entry: any) => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        if (!name) return null;
        return { name, avatar: providerAvatarFromLabel(name) };
      }
      const name = String(entry?.name || entry?.email || entry?.id || '').trim();
      if (!name) return null;
      const explicitAvatar = String(entry?.avatar || entry?.image || '').trim();
      return {
        name,
        avatar: explicitAvatar || providerAvatarFromLabel(name),
      };
    })
    .filter((entry): entry is { name: string; avatar?: string } => Boolean(entry?.name));
}

function providerAvatarFromLabel(label: string): string {
  const lower = String(label || '').toLowerCase();
  const provider =
    lower.includes('github') ? 'github'
      : lower.includes('slack') ? 'slack'
        : lower.includes('facebook') ? 'facebook'
          : lower.includes('google') ? 'google'
            : lower.includes('agent') || lower.includes('ai') || lower.includes('bot') ? 'agent'
              : 'member';
  const palette =
    provider === 'github' ? ['#111827', '#d1d5db']
      : provider === 'slack' ? ['#4a154b', '#f4e7f6']
        : provider === 'facebook' ? ['#1877f2', '#e0ecff']
          : provider === 'google' ? ['#1a73e8', '#e8f0fe']
            : provider === 'agent' ? ['#0f766e', '#ccfbf1']
              : ['#334155', '#e2e8f0'];
  const glyph =
    provider === 'github' ? 'GH'
      : provider === 'slack' ? 'SL'
        : provider === 'facebook' ? 'FB'
          : provider === 'google' ? 'GO'
            : provider === 'agent' ? 'AI'
              : 'ME';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${palette[0]}"/><text x="32" y="38" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="700" fill="${palette[1]}">${glyph}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function lineageEntityKey(entityType: string, entityId: string, entityTitle: string): string {
  const type = String(entityType || '').trim().toLowerCase() || 'milestone';
  const id = String(entityId || '').trim().toLowerCase();
  const title = String(entityTitle || '').trim().toLowerCase();
  return `${type}:${id || title}`;
}

function AssigneeInline({ assignees }: { assignees: Array<{ name: string; avatar?: string }> }) {
  if (assignees.length === 0) {
    return <span className="text-[10px] text-gray-500">Unassigned</span>;
  }
  const visible = assignees.slice(0, 2);
  const extra = Math.max(0, assignees.length - visible.length);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center -space-x-1">
        {visible.map((assignee, idx) => (
          <span key={`wf-inline-assignee-${assignee.name}-${idx}`} className="rounded-full border border-[#1e2128]">
            <UserAvatar name={assignee.name} avatar={assignee.avatar} size="xs" />
          </span>
        ))}
      </span>
      <span className="max-w-[90px] truncate text-[10px] text-gray-300">{visible[0]?.name || 'Unassigned'}</span>
      {extra > 0 ? <span className="text-[10px] text-gray-500">+{extra}</span> : null}
    </span>
  );
}

function setPromotionDragPayload(event: ReactDragEvent<HTMLElement>, payload: Record<string, unknown>): void {
  const json = JSON.stringify(payload);
  event.dataTransfer.setData(FLOW_TEMPLATE_MIME, json);
  event.dataTransfer.setData(TASK_MIME, json);
  event.dataTransfer.setData('text/plain', json);
  event.dataTransfer.effectAllowed = 'copy';
}

function dispatchPromotion(payload: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('syncscript:workstream-promote', { detail: payload }));
}

function dispatchOpenTask(taskId: string): void {
  if (!taskId) return;
  window.dispatchEvent(new CustomEvent('syncscript:workstream-open-task', { detail: { taskId } }));
}

function dispatchOpenAssign(taskId: string): void {
  if (!taskId) return;
  window.dispatchEvent(new CustomEvent('syncscript:workstream-open-assign', { detail: { taskId } }));
}

function dispatchOpenIntegrations(taskId: string): void {
  if (!taskId) return;
  window.dispatchEvent(new CustomEvent('syncscript:workstream-open-integrations', { detail: { taskId } }));
}

export function WorkstreamFlowNode({ id, data, selected }: NodeProps<any>) {
  const title = String(data?.title || 'Untitled task');
  const status = String(data?.status || 'todo');
  const priority = String(data?.priority || '').trim();
  const dueDate = String(data?.dueDate || '').trim();
  const taskId = String(data?.taskId || String(id || '').replace(/^task:/, '')).trim();
  const ownerMode = String(data?.ownerMode || 'human_only').trim();
  const createdByType = String(data?.createdByType || 'human').trim();
  const riskLevel = String(data?.riskLevel || 'low').trim().toLowerCase();
  const assigneeName = String(data?.assigneeName || '').trim();
  const assigneeAvatar = String(data?.assigneeAvatar || '').trim();
  const assignees = normalizeAssignees(Array.isArray(data?.assignees) ? data.assignees : []);
  const milestones = Array.isArray(data?.milestones) ? data.milestones : [];
  const integrations = Array.isArray(data?.integrations) ? data.integrations : [];
  const integrationBindings = Array.isArray(data?.integrationBindings) ? data.integrationBindings : [];
  const promotedLineageKeys = Array.isArray(data?.promotedLineageKeys) ? data.promotedLineageKeys : [];
  const promotedLineageKeySet = new Set(
    promotedLineageKeys.map((value: any) => String(value || '').trim().toLowerCase()).filter(Boolean),
  );
  const integrationCount = integrationBindings.length || integrations.length;
  const compactView = Boolean(data?.compactView);
  const denseView = Boolean(data?.denseView);
  const ultraDenseView = Boolean(data?.ultraDenseView);
  const focusActive = Boolean(data?.focusActive);
  const isFocusRoot = Boolean(data?.isFocusRoot);
  const inFocusLineage = data?.inFocusLineage !== false;
  const assigneePreview = assignees;
  const visibleAssignees = assigneePreview.slice(0, 2);
  const extraAssigneeCount = Math.max(0, assigneePreview.length - visibleAssignees.length);
  const goalTitle = String(data?.goalTitle || '').trim();
  const milestoneCompletion =
    milestones.length > 0
      ? Math.round(
          (milestones.filter((milestone: any) => Boolean(milestone?.completed)).length / milestones.length) * 100,
        )
      : null;
  const progressPercent = Number.isFinite(Number(data?.progress))
    ? Math.max(0, Math.min(100, Number(data?.progress)))
    : status === 'done' || status === 'completed'
      ? 100
      : status === 'doing' || status === 'in_progress'
        ? 68
        : status === 'pending'
          ? 14
          : milestoneCompletion ?? 24;
  const iconControlBaseClass =
    'nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70';
  const promoteButtonClass =
    'nodrag nopan rounded border border-gray-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-gray-300 transition-colors duration-150 hover:border-cyan-500/70 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70';
  const dragButtonClass =
    'nodrag nopan rounded border border-cyan-700/60 px-1 py-0.5 text-[9px] uppercase tracking-wide text-cyan-300 transition-colors duration-150 hover:border-cyan-500 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70';
  return (
    <div
      className={getTaskCardSurfaceClasses({
        priority,
        selected,
        className: compactView
          ? 'w-[232px] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out'
          : denseView
            ? 'w-[248px] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out'
            : 'w-[292px] p-4 shadow-[0_10px_26px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out',
      })}
      style={{
        transform: focusActive && inFocusLineage ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isFocusRoot ? '0 0 0 1px rgba(34,211,238,0.55), 0 12px 28px rgba(8,145,178,0.25)' : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-cyan-400" />
      <div className={compactView ? 'space-y-2' : 'space-y-2.5'}>
        <div className="flex items-start justify-between gap-2">
          <p className={`${ultraDenseView ? 'line-clamp-1 text-[12px]' : 'line-clamp-2 text-sm'} font-semibold text-gray-100`}>{title}</p>
          <div className="flex items-center gap-1">
            {!ultraDenseView ? (
            <button
              type="button"
              onClick={() => dispatchOpenTask(taskId)}
              className={`${iconControlBaseClass} border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400/60 hover:bg-cyan-500/20`}
              title="Open task details"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            ) : null}
            {!ultraDenseView ? (
            <button
              type="button"
              onClick={() => dispatchOpenAssign(taskId)}
              className={`${iconControlBaseClass} border-gray-600 text-gray-300 hover:border-gray-500 hover:text-gray-100`}
              title="Assign users"
            >
              <Users className="h-3.5 w-3.5" />
            </button>
            ) : null}
            {!ultraDenseView ? (
            <button
              type="button"
              onClick={() => dispatchOpenIntegrations(taskId)}
              className={`${iconControlBaseClass} border-violet-500/35 bg-violet-500/10 text-violet-200 hover:border-violet-400/60 hover:bg-violet-500/20`}
              title="Task integrations"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            ) : null}
            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${statusClass(status)}`}>
              {status}
            </Badge>
          </div>
        </div>
        {compactView ? (
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="h-5 border-cyan-500/40 text-[10px] text-cyan-200">
              Compressed
            </Badge>
            <span className="text-[10px] text-gray-400">
              {milestones.length > 0 ? `${milestones.length} milestones` : 'Derived node'}
            </span>
          </div>
        ) : null}

        {!ultraDenseView ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="h-5 border-gray-700 text-[10px] text-gray-300">
            {ownerModeLabel(ownerMode)}
          </Badge>
          <Badge variant="outline" className="h-5 border-gray-700 text-[10px] text-gray-300">
            {createdByType === 'agent' ? <Bot className="mr-1 h-3 w-3" /> : <UserRound className="mr-1 h-3 w-3" />}
            {createdByType === 'agent' ? 'Agent' : 'Human'}
          </Badge>
          <Badge variant="outline" className="h-5 border-gray-700 text-[10px] text-gray-300">
            {priority || 'medium'}
          </Badge>
          {integrationCount > 0 ? (
            <Badge variant="outline" className="h-5 border-violet-500/35 text-[10px] text-violet-200">
              <Link2 className="mr-1 h-3 w-3" />
              {integrationCount} integration{integrationCount === 1 ? '' : 's'}
            </Badge>
          ) : null}
          {['medium', 'high', 'critical'].includes(riskLevel) ? (
            <Badge variant="outline" className={`h-5 text-[10px] ${riskClass(riskLevel)}`}>
              <ShieldAlert className="mr-1 h-3 w-3" />
              {riskLevel.toUpperCase()}
            </Badge>
          ) : null}
          {goalTitle ? (
            <Badge variant="outline" className="h-5 border-fuchsia-500/40 text-[10px] text-fuchsia-300">
              {goalTitle}
            </Badge>
          ) : null}
        </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>{milestones.length} milestone{milestones.length === 1 ? '' : 's'}</span>
            <span>
              {assignees.length || (assigneeName ? 1 : 0)} assigned
              {integrationCount > 0 ? ` • ${integrationCount} apps` : ''}
            </span>
          </div>
        )}

        {!denseView ? (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {dueDate ? `Due ${new Date(dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'No due date'}
          </span>
          <span>{assigneeName || 'Unassigned'}</span>
        </div>
        ) : null}

        {!ultraDenseView && (visibleAssignees.length > 0 || assigneeName) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              {(visibleAssignees.length > 0 ? visibleAssignees : [{ name: assigneeName || 'Unassigned', avatar: assigneeAvatar }]).map((entry, idx) => (
                <span key={`wf-assignee-avatar-${entry.name}-${idx}`} className="rounded-full border-2 border-[#1e2128]">
                  <UserAvatar name={entry.name} avatar={entry.avatar} size="xs" />
                </span>
              ))}
            </div>
            {extraAssigneeCount > 0 ? (
              <span className="text-[10px] text-gray-400">+{extraAssigneeCount}</span>
            ) : null}
          </div>
        ) : null}
        {!ultraDenseView ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded bg-gray-800">
              <div
                className="h-1.5 rounded bg-cyan-400 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        {!compactView && !denseView && milestones.length > 0 ? (
          <div className="space-y-1.5 rounded-md border border-gray-700/70 bg-[#11151d] p-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Milestones</p>
            {milestones.slice(0, 3).map((milestone: any, milestoneIndex: number) => {
              const milestoneAssignees = normalizeAssignees(
                Array.isArray(milestone?.assignees)
                  ? milestone.assignees
                  : Array.isArray(milestone?.assignedTo)
                    ? milestone.assignedTo
                    : milestone?.assignedTo
                      ? [milestone.assignedTo]
                      : [],
              );
              const steps = Array.isArray(milestone?.steps) ? milestone.steps : [];
              const milestoneTitle = String(milestone?.title || `Milestone ${milestoneIndex + 1}`);
              const milestoneEntityKey = lineageEntityKey('milestone', String(milestone?.id || ''), milestoneTitle);
              const milestonePromoted = Boolean(milestone?.promoted) || promotedLineageKeySet.has(milestoneEntityKey);
              return (
                <div key={`wf-node-milestone-${String(milestone?.id || milestoneIndex)}`} className="rounded border border-gray-800 bg-[#0d1118] p-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-1.5">
                      <span
                        className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full border ${
                          milestonePromoted
                            ? 'border-cyan-300 bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.55)]'
                            : 'border-gray-500 bg-gray-700'
                        }`}
                        title={milestonePromoted ? 'Branch continues from this milestone' : 'Milestone branch point'}
                      />
                      <p className="line-clamp-2 text-[11px] font-medium text-gray-200">
                        {milestoneTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!milestonePromoted ? (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              dispatchPromotion({
                                title: milestoneTitle,
                                description: `Promoted milestone from ${title}`,
                                priority: priority || 'medium',
                                dueDate,
                                assignees: milestoneAssignees,
                                milestones: (Array.isArray(milestone?.steps) ? milestone.steps : []).map((step: any, stepIndex: number) => ({
                                  id: String(step?.id || `promoted-step-${milestoneIndex}-${stepIndex}`),
                                  title: String(step?.title || `Step ${stepIndex + 1}`),
                                  completed: Boolean(step?.completed),
                                  resources: Array.isArray(step?.resources) ? step.resources : [],
                                  assignedTo: step?.assignedTo || step?.assignees || [],
                                })),
                                lineage: {
                                  parentTaskId: taskId,
                                  sourceNodeId: id,
                                  sourceEntityType: 'milestone',
                                  sourceEntityId: String(milestone?.id || ''),
                                  sourceEntityTitle: milestoneTitle,
                                },
                              });
                            }}
                            className={promoteButtonClass}
                            title="Create a derived task from this milestone"
                          >
                            Promote +
                          </button>
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.stopPropagation();
                              const payload = {
                                title: milestoneTitle,
                                description: `Promoted milestone from ${title}`,
                                priority: priority || 'medium',
                                dueDate,
                                assignees: milestoneAssignees,
                                milestones: (Array.isArray(milestone?.steps) ? milestone.steps : []).map((step: any, stepIndex: number) => ({
                                  id: String(step?.id || `promoted-step-${milestoneIndex}-${stepIndex}`),
                                  title: String(step?.title || `Step ${stepIndex + 1}`),
                                  completed: Boolean(step?.completed),
                                  resources: Array.isArray(step?.resources) ? step.resources : [],
                                  assignedTo: step?.assignedTo || step?.assignees || [],
                                })),
                                lineage: {
                                  parentTaskId: taskId,
                                  sourceNodeId: id,
                                  sourceEntityType: 'milestone',
                                  sourceEntityId: String(milestone?.id || ''),
                                  sourceEntityTitle: milestoneTitle,
                                },
                              };
                              setPromotionDragPayload(event, payload);
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            className={dragButtonClass}
                            title="Drag milestone out to create task"
                          >
                            Drag Out
                          </button>
                        </>
                      ) : (
                        <Badge variant="outline" className="h-5 border-cyan-500/40 text-[9px] uppercase tracking-wide text-cyan-200">
                          Continued
                        </Badge>
                      )}
                      <AssigneeInline assignees={milestoneAssignees} />
                    </div>
                  </div>
                  {steps.length > 0 ? (
                    <div className="mt-1 space-y-1 pl-2">
                      {steps.slice(0, 3).map((step: any, stepIndex: number) => {
                        const stepAssignees = normalizeAssignees(
                          Array.isArray(step?.assignees)
                            ? step.assignees
                            : Array.isArray(step?.assignedTo)
                              ? step.assignedTo
                              : step?.assignedTo
                                ? [step.assignedTo]
                                : [],
                        );
                        const stepTitle = String(step?.title || `Step ${stepIndex + 1}`);
                        const stepEntityKey = lineageEntityKey('step', String(step?.id || ''), stepTitle);
                        const stepPromoted = Boolean(step?.promoted) || promotedLineageKeySet.has(stepEntityKey);
                        return (
                          <div key={`wf-node-step-${String(step?.id || stepIndex)}`} className="flex items-center justify-between gap-2">
                            <p className="line-clamp-1 text-[10px] text-cyan-200">
                              - {stepTitle}
                            </p>
                            <div className="flex items-center gap-1">
                              {!stepPromoted ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      dispatchPromotion({
                                        title: stepTitle,
                                        description: `Promoted step from ${title}`,
                                        priority: priority || 'medium',
                                        dueDate,
                                        assignees: stepAssignees,
                                        lineage: {
                                          parentTaskId: taskId,
                                          sourceNodeId: id,
                                          sourceEntityType: 'step',
                                          sourceEntityId: String(step?.id || ''),
                                          sourceEntityTitle: stepTitle,
                                        },
                                      });
                                    }}
                                    className={promoteButtonClass}
                                    title="Create a derived task from this step"
                                  >
                                    Promote +
                                  </button>
                                  <button
                                    type="button"
                                    draggable
                                    onDragStart={(event) => {
                                      event.stopPropagation();
                                      const payload = {
                                        title: stepTitle,
                                        description: `Promoted step from ${title}`,
                                        priority: priority || 'medium',
                                        dueDate,
                                        assignees: stepAssignees,
                                        lineage: {
                                          parentTaskId: taskId,
                                          sourceNodeId: id,
                                          sourceEntityType: 'step',
                                          sourceEntityId: String(step?.id || ''),
                                          sourceEntityTitle: stepTitle,
                                        },
                                      };
                                      setPromotionDragPayload(event, payload);
                                    }}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                    }}
                                    className={dragButtonClass}
                                    title="Drag step out to create task"
                                  >
                                    Drag Out
                                  </button>
                                </>
                              ) : (
                                <Badge variant="outline" className="h-5 border-cyan-500/40 text-[9px] uppercase tracking-wide text-cyan-200">
                                  Continued
                                </Badge>
                              )}
                              <AssigneeInline assignees={stepAssignees} />
                            </div>
                          </div>
                        );
                      })}
                      {steps.length > 3 ? (
                        <p className="text-[10px] text-gray-500">+{steps.length - 3} more steps</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {milestones.length > 3 ? (
              <p className="text-[10px] text-gray-500">+{milestones.length - 3} more milestones</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-violet-400" />
    </div>
  );
}
