/**
 * Right-side panel on AppAIPage with tabs for Chats / Tasks / Projects.
 * Each tab is collapsible (▼/▶) per the user's design ask. Persists tab +
 * collapse state in localStorage so reload restores their layout.
 *
 * Why a sidecar component (not inline in AppAIPage)?
 *   AppAIPage is a long protected-class file already at 1300+ lines.
 *   Keeping the new UX in its own component lets us iterate freely on tabs
 *   without bumping the AppAIPage diff every time.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, CheckCircle2, FolderOpen, ChevronDown, ChevronRight,
  Plus, Trash2, Users, FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentTasksPanel } from './AgentTasksPanel';
import { useProjects, useCreateProject, useSelectedProject, type Project } from '@/hooks/useProjects';

const TAB_KEY = 'syncscript-appai-sidebar-tab';
const COLLAPSED_KEY = 'syncscript-appai-sidebar-collapsed';

type Tab = 'chats' | 'tasks' | 'projects';

interface ChatItem {
  id: string;
  title: string;
  type?: 'direct' | 'group';
  agents?: string[];
}

interface Props {
  chats: ChatItem[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  selectedAgentRunId: string | null;
  onSelectAgentRun: (id: string) => void;
  onNewAgentRun: () => void;
}

export function AppAiSidebarPanel(props: Props) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'chats';
    const stored = localStorage.getItem(TAB_KEY);
    return stored === 'tasks' || stored === 'projects' ? (stored as Tab) : 'chats';
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  });

  useEffect(() => { try { localStorage.setItem(TAB_KEY, tab); } catch {} }, [tab]);
  useEffect(() => { try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch {} }, [collapsed]);

  const projectsQ = useProjects();
  const projects = projectsQ.data ?? [];
  const { selected: selectedProject, select: setSelectedProject } = useSelectedProject();

  return (
    <div className={cn(
      'hidden lg:flex flex-col shrink-0 border-l border-gray-800 bg-[#0c0d12] transition-[width] duration-200 ease-out',
      collapsed ? 'w-12' : 'w-64',
    )}>
      <div className="flex items-center gap-0.5 border-b border-gray-800 px-1.5 py-1.5">
        <TabButton icon={MessageSquare} label="Chats" tab="chats" active={tab} onClick={setTab} collapsed={collapsed} />
        <TabButton icon={CheckCircle2} label="Tasks" tab="tasks" active={tab} onClick={setTab} collapsed={collapsed} />
        <TabButton icon={FolderOpen} label="Projects" tab="projects" active={tab} onClick={setTab} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-800 hover:text-white"
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0"
          >
            {tab === 'chats' && (
              <ChatsTab
                chats={props.chats}
                activeChatId={props.activeChatId}
                onSelect={props.onSelectChat}
                onNew={props.onNewChat}
                onDelete={props.onDeleteChat}
              />
            )}
            {tab === 'tasks' && (
              <AgentTasksPanel
                selectedRunId={props.selectedAgentRunId}
                onSelect={props.onSelectAgentRun}
                onNewAgentTask={props.onNewAgentRun}
                projectFilter={selectedProject}
              />
            )}
            {tab === 'projects' && (
              <ProjectsTab projects={projects} selectedId={selectedProject} onSelect={setSelectedProject} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function TabButton({
  icon: Icon, label, tab, active, onClick, collapsed,
}: {
  icon: typeof MessageSquare; label: string; tab: Tab; active: Tab; onClick: (t: Tab) => void; collapsed: boolean;
}) {
  const isActive = active === tab;
  return (
    <button
      type="button"
      onClick={() => onClick(tab)}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
        isActive
          ? 'bg-violet-500/15 text-violet-200 border border-violet-500/30'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent',
        collapsed && 'w-7 h-7 px-0 justify-center',
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

function ChatsTab({
  chats, activeChatId, onSelect, onNew, onDelete,
}: {
  chats: ChatItem[]; activeChatId: string | null; onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/80">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Chats</span>
        <button
          type="button"
          onClick={onNew}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="New chat"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
        {chats.length === 0 && <div className="px-3 py-6 text-center text-xs text-gray-500">No chats yet — type to start one.</div>}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              'group flex cursor-pointer items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 text-xs transition-colors',
              activeChatId === chat.id
                ? 'border border-purple-500/30 bg-purple-500/10 text-purple-300'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200',
            )}
            onClick={() => onSelect(chat.id)}
          >
            {chat.type === 'group' ? <Users className="w-3 h-3 shrink-0" /> : <MessageSquare className="w-3 h-3 shrink-0" />}
            <span className="flex-1 truncate">{chat.title || 'New chat'}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              aria-label="Delete chat"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsTab({
  projects, selectedId, onSelect,
}: {
  projects: Project[]; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const create = useCreateProject();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/80">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Projects</span>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="New project"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            const p = await create.mutateAsync({ name: newName.trim() });
            setNewName('');
            setCreating(false);
            if (p?.id) onSelect(p.id);
          }}
          className="flex gap-1 px-2 py-2 border-b border-gray-800/80"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="flex-1 bg-[#11131a] border border-gray-700 rounded-md px-2 py-1 text-xs text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-violet-500/20 border border-violet-400/30 text-violet-200 px-2 text-xs hover:bg-violet-500/30">
            Add
          </button>
        </form>
      )}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors flex items-center gap-2',
            selectedId === null
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
              : 'border border-transparent text-gray-400 hover:bg-gray-800/50',
          )}
        >
          <FolderOpen className="w-3 h-3 shrink-0" />
          All
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              'w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors flex items-center gap-2',
              selectedId === p.id
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
                : 'border border-transparent text-gray-400 hover:bg-gray-800/50',
            )}
          >
            <span className={cn('w-2 h-2 rounded-full shrink-0', p.color ? '' : 'bg-gray-500')} style={p.color ? { backgroundColor: p.color } : undefined} />
            <span className="flex-1 truncate">{p.name}</span>
          </button>
        ))}
        {projects.length === 0 && !creating && (
          <p className="px-3 py-4 text-center text-[11px] text-gray-500">
            No projects yet. Tap <FolderPlus className="w-3 h-3 inline -translate-y-0.5" /> to add one.
          </p>
        )}
      </div>
    </div>
  );
}
