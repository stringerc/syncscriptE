/**
 * Live task preview during Nexus voice — edit title/description while staying in the voice session.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTodo, X, Save, Loader2 } from 'lucide-react';
import { useTasks } from '../../contexts/TasksContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type NexusVoiceTaskPeekProps = {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function NexusVoiceTaskPeek({ taskId, open, onOpenChange, className }: NexusVoiceTaskPeekProps) {
  const { tasks, updateTask, loading } = useTasks();
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title || '');
    setDescription(typeof task.description === 'string' ? task.description : '');
  }, [task?.id, task?.title, task?.description, open]);

  const handleSave = useCallback(async () => {
    if (!taskId || !task) return;
    const t = title.trim();
    if (!t) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    try {
      await updateTask(taskId, {
        title: t,
        description: description.trim() || undefined,
      } as Parameters<typeof updateTask>[1]);
      toast.success('Task updated', { description: 'Kept in sync with your list.' });
    } catch (e) {
      toast.error('Could not save', {
        description: e instanceof Error ? e.message : 'Try again',
      });
    } finally {
      setSaving(false);
    }
  }, [taskId, task, title, description, updateTask]);

  if (!taskId) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className={cn(
            'pointer-events-auto fixed bottom-6 left-1/2 z-[515] w-[min(92vw,420px)] -translate-x-1/2',
            className,
          )}
        >
          <div
            className={cn(
              'overflow-hidden rounded-2xl border border-white/12',
              'bg-gradient-to-br from-[#12131c]/95 to-[#0a0a10]/98 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)] backdrop-blur-2xl',
              'ring-1 ring-white/[0.06]',
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/25 ring-1 ring-white/10">
                  <ListTodo className="h-4 w-4 text-cyan-100" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/90">Task created</p>
                  <p className="truncate text-[13px] font-semibold text-white/95">Edit with Nexus</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-white/45 hover:bg-white/10 hover:text-white"
                onClick={() => onOpenChange(false)}
                aria-label="Close task preview"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 px-4 py-3">
              {loading && !task ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading task…
                </div>
              ) : !task ? (
                <p className="py-6 text-center text-sm text-amber-200/80">
                  Syncing your new task… speak again in a moment or check Tasks.
                </p>
              ) : (
                <>
                  <div>
                    <label htmlFor="nv-task-title" className="mb-1 block text-[11px] font-medium text-white/45">
                      Title
                    </label>
                    <Input
                      id="nv-task-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border-white/10 bg-white/[0.06] text-white placeholder:text-white/30"
                      placeholder="Task title"
                    />
                  </div>
                  <div>
                    <label htmlFor="nv-task-desc" className="mb-1 block text-[11px] font-medium text-white/45">
                      Notes
                    </label>
                    <Textarea
                      id="nv-task-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="resize-none border-white/10 bg-white/[0.06] text-white placeholder:text-white/30"
                      placeholder="Details Nexus can refine with you…"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={saving || !title.trim()}
                    onClick={() => void handleSave()}
                    className="w-full gap-2 bg-gradient-to-r from-violet-600/90 to-cyan-600/85 text-white hover:from-violet-500 hover:to-cyan-500"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
