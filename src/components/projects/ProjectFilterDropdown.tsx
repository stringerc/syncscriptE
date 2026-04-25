/**
 * Project filter dropdown — top-right of TasksGoalsPage. Shows:
 *   • "All" (no filter)
 *   • Each user-owned project
 *   • "+ New project" inline create
 *
 * Persists selection in localStorage (via useSelectedProject) so it follows
 * the user back across reloads, and the AgentTasksPanel can read the same
 * value to scope agent runs to the active project.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, FolderOpen, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjects, useCreateProject, useSelectedProject } from '@/hooks/useProjects';

export function ProjectFilterDropdown({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const projectsQ = useProjects();
  const create = useCreateProject();
  const { selected, select } = useSelectedProject();
  const projects = projectsQ.data ?? [];
  const selectedProject = projects.find((p) => p.id === selected) ?? null;

  const display = selectedProject ? selectedProject.name : 'All projects';

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 border border-gray-700/50 bg-[#11131a] text-gray-200 hover:border-violet-500/40 hover:text-white"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FolderOpen className="w-3.5 h-3.5" />
        <span className="text-xs font-medium max-w-[10rem] truncate">{display}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Close project filter"
              className="fixed inset-0 z-[40]"
              onClick={() => { setOpen(false); setCreating(false); }}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1.5 z-[41] w-64 rounded-xl border border-gray-700/80 bg-[#0c0d12] shadow-2xl shadow-black/40 overflow-hidden"
              role="listbox"
            >
              <button
                type="button"
                onClick={() => { select(null); setOpen(false); }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-gray-800/60',
                  selected === null ? 'text-cyan-300' : 'text-gray-300',
                )}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3 h-3" />
                  All projects
                </span>
                {selected === null && <Check className="w-3 h-3" />}
              </button>
              <div className="max-h-72 overflow-y-auto border-t border-gray-800/60 py-0.5">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { select(p.id); setOpen(false); }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-gray-800/60',
                      selected === p.id ? 'text-cyan-300' : 'text-gray-300',
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#6b7280' }}
                      />
                      <span className="truncate">{p.name}</span>
                    </span>
                    {selected === p.id && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
                {projects.length === 0 && !creating && (
                  <p className="px-3 py-3 text-center text-[11px] text-gray-500">No projects yet.</p>
                )}
              </div>

              {!creating ? (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 border-t border-gray-800/60 px-3 py-2 text-xs text-violet-300 hover:bg-violet-500/10"
                >
                  <Plus className="w-3 h-3" />
                  New project
                </button>
              ) : (
                <form
                  className="flex items-center gap-1.5 border-t border-gray-800/60 p-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newName.trim()) return;
                    const p = await create.mutateAsync({ name: newName.trim() });
                    setNewName(''); setCreating(false); setOpen(false);
                    if (p?.id) select(p.id);
                  }}
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project name"
                    className="flex-1 rounded-md border border-gray-700 bg-[#11131a] px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="h-7 px-2 bg-violet-500/20 border border-violet-400/30 text-violet-200 hover:bg-violet-500/30">
                    Add
                  </Button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
