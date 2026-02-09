/**
 * Task Modal - PHASE 4: Architectural Cleanup
 * 
 * Dedicated modal for task management
 * Features: completion tracking, subtasks, resources, links/notes, team assignments
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Progress } from './ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Paperclip,
  Link as LinkIcon,
  FileText,
  Users,
  Save,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Calendar,
  Tag,
} from 'lucide-react';
import { Task, Resource, LinkNote, TeamMember, getResourceCount, getLinksNotesCount, getCompletedSubtaskCount } from '../utils/event-task-types';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  currentUserId: string;
  onSave: (task: Task) => void;
  onDelete?: () => void;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  currentUserId,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(task);

  // Reset editing state when modal opens/closes or task changes
  useEffect(() => {
    setIsEditing(false);
    setEditedTask(task);
  }, [open, task]);

  if (!task || !editedTask) return null;

  const resourceCount = getResourceCount(task);
  const linksNotesCount = getLinksNotesCount(task);
  const subtaskProgress = getCompletedSubtaskCount(task);

  // Handle subtask completion toggle
  const handleToggleSubtaskComplete = (subtaskId: string) => {
    const updatedTask = { ...editedTask };
    const subtask = updatedTask.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
    }
    setEditedTask(updatedTask);
  };

  // Handle save
  const handleSave = () => {
    if (!editedTask) return;
    
    onSave(editedTask);
    setIsEditing(false);
    
    toast.success('Task updated', {
      description: 'All team members have been notified',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1000px] w-[90vw] max-h-[90vh] bg-[#1a1d24] border-gray-800 text-white p-0 overflow-hidden !z-[100] flex flex-col !border-l-4 !border-l-blue-500">
        {/* Header - Fixed at top */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Type Identifier Badge */}
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/50 px-2 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  TASK
                </Badge>
                
                {/* Prep For Badge */}
                {task.prepForEventName && (
                  <Badge variant="secondary" className="bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    Prep for: {task.prepForEventName}
                  </Badge>
                )}

                {/* Completed Badge */}
                {task.completed && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/50 px-2 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    COMPLETED
                  </Badge>
                )}
              </div>
              
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-2xl mb-2 bg-[#2a2d35] border-gray-700 text-white"
                />
              ) : (
                <DialogTitle className={`text-2xl text-white ${task.completed ? 'line-through opacity-70' : ''}`}>
                  {task.title}
                </DialogTitle>
              )}
              <DialogDescription className="sr-only">
                {task.description || `Task details for ${task.title}`}
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {isEditing ? 'Save' : 'Edit'}
              </Button>
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Description</h4>
              {isEditing ? (
                <Textarea
                  value={editedTask.description || ''}
                  onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
                  placeholder="Add a description..."
                  rows={3}
                  className="bg-[#2a2d35] border-gray-700 text-white"
                />
              ) : (
                <p className="text-gray-300">{task.description || 'No description'}</p>
              )}
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div>
                <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Due Date
                </h4>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={new Date(editedTask.dueDate).toISOString().slice(0, 16)}
                    onChange={e => {
                      const newDueDate = new Date(e.target.value);
                      setEditedTask({ ...editedTask, dueDate: newDueDate });
                    }}
                    className="bg-[#2a2d35] border-gray-700 text-white"
                  />
                ) : (
                  <p className="text-gray-300">
                    {new Date(task.dueDate).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <Separator />

            {/* Assigned Team Members */}
            {task.assignedTo && task.assignedTo.length > 0 && (
              <>
                <div>
                  <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assigned To ({task.assignedTo.length})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {task.assignedTo.map((member: TeamMember) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 bg-[#2a2d35] border border-gray-800 rounded-lg p-3"
                      >
                        <AnimatedAvatar
                          name={member.name}
                          image={member.avatar}
                          fallback={member.name[0]}
                          progress={member.progress}
                          animationType={member.progress >= 80 ? 'glow' : member.progress >= 50 ? 'pulse' : 'heartbeat'}
                          size={40}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{member.name}</p>
                          {member.progress !== undefined && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Progress value={member.progress} className="h-1.5 w-24 bg-gray-700" />
                              <span className="text-xs text-gray-400 font-medium">{member.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm text-gray-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Subtasks ({subtaskProgress.completed}/{subtaskProgress.total})
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {task.subtasks.map((subtask: Task) => (
                        <motion.div
                          key={subtask.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-[#1a1f2e] rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleSubtaskComplete(subtask.id)}
                              className="mt-0.5"
                            >
                              {subtask.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-gray-300 ${subtask.completed ? 'line-through opacity-50' : ''}`}>
                                {subtask.title}
                              </p>
                              {subtask.description && (
                                <p className="text-xs text-gray-500 mt-1">{subtask.description}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Resources */}
            {resourceCount > 0 && (
              <>
                <div>
                  <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Resources ({resourceCount})
                  </h4>
                  <div className="space-y-2">
                    {task.resources.map((resource: Resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2433] transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div className="min-w-0">
                            <p className="text-gray-300 truncate">{resource.name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded by {resource.uploadedBy}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Links & Notes */}
            {linksNotesCount > 0 && (
              <div>
                <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Links & Notes ({linksNotesCount})
                </h4>
                <div className="space-y-2">
                  {task.linksNotes.map((linkNote: LinkNote) => (
                    <div
                      key={linkNote.id}
                      className="flex items-center justify-between bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2433] transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {linkNote.type === 'link' ? (
                          <ExternalLink className="w-5 h-5 text-purple-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-yellow-400" />
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-300 truncate">{linkNote.title}</p>
                          <p className="text-xs text-gray-500 truncate">{linkNote.content}</p>
                        </div>
                      </div>
                      {linkNote.type === 'link' && (
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
