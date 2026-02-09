/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENT AGENDA TAB - INTEGRATED INTO EVENT MODAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH FOUNDATION:
 * ────────────────────
 * - **Linear (2024)**: Inline editing, keyboard shortcuts
 * - **Notion (2023)**: Template quick-apply, slash commands
 * - **Figma (2024)**: Keyboard-first UX, command palette
 * - **Google Calendar (2024)**: Smart suggestions
 * - **Asana (2023)**: Bulk operations, quick actions
 * 
 * FEATURES:
 * ─────────
 * • Quick template application
 * • Inline milestone/step creation
 * • Keyboard shortcuts (Cmd+K for templates, Cmd+M for milestone)
 * • Undo/redo support (Cmd+Z / Cmd+Shift+Z)
 * • Smart suggestions based on event context
 * • Drag-and-drop reordering
 * • Bulk operations (clear all, auto-schedule)
 * • Export agenda (Markdown, JSON)
 * • Real-time conflict detection
 * • Energy-aware scheduling (future)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Sparkles,
  Download,
  Undo2,
  Redo2,
  Zap,
  BookTemplate,
  Info,
  Keyboard,
  Layout,
} from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EventAgendaView } from './calendar/EventAgendaView';
import { ScheduleMilestoneModal } from './calendar/ScheduleMilestoneModal';
import { useAgendaManagement } from './hooks/useAgendaManagement';
import { AGENDA_TEMPLATES, suggestTemplate, getTemplatesByCategory } from '../utils/agenda-templates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

interface EventAgendaTabProps {
  event: Event;
  allEvents: Event[];
  onUpdateEvents: (events: Event[]) => void;
  currentUserId: string;
  canEdit: boolean;
}

export function EventAgendaTab({
  event,
  allEvents,
  onUpdateEvents,
  currentUserId,
  canEdit,
}: EventAgendaTabProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [itemToSchedule, setItemToSchedule] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'milestone' | 'step'>('milestone');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Use agenda management hook
  const {
    milestones,
    steps,
    createMilestone,
    createStep,
    scheduleItem,
    updateItem,
    deleteItem,
    reorderMilestones,
    reorderSteps,
    undo,
    redo,
    canUndo,
    canRedo,
    applyTemplate,
    isDirty,
  } = useAgendaManagement({
    parentEvent: event,
    allEvents,
    onUpdateEvents,
    currentUserId,
  });

  // Calculate event duration
  const eventDurationMinutes = Math.floor(
    (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) /
      (1000 * 60)
  );

  // Smart template suggestion
  const suggestedTemplate = suggestTemplate(event.title, eventDurationMinutes);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + M = New Milestone
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        if (canEdit) {
          setCreateType('milestone');
          setShowCreateModal(true);
        }
      }
      
      // Cmd/Ctrl + K = Open template picker
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (canEdit) {
          setShowTemplateDialog(true);
        }
      }
      
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      
      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      
      // ? = Show keyboard shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit, canUndo, canRedo, undo, redo]);

  // Handle milestone creation
  const handleCreateMilestone = () => {
    console.log('🎯 handleCreateMilestone called', { newItemTitle, canEdit });
    
    if (!newItemTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    console.log('✅ Creating milestone with title:', newItemTitle);
    const milestone = createMilestone(newItemTitle, newItemDescription);
    console.log('✅ Milestone created:', milestone);
    
    // Auto-open schedule modal
    setItemToSchedule(milestone);
    setShowScheduleModal(true);
    console.log('✅ Schedule modal opened for milestone');
    
    // Reset form
    setNewItemTitle('');
    setNewItemDescription('');
    setShowCreateModal(false);
  };

  // Handle step creation
  const handleCreateStep = () => {
    if (!newItemTitle.trim() || !createParentId) {
      toast.error('Please enter a title');
      return;
    }
    
    const step = createStep(createParentId, newItemTitle, newItemDescription);
    
    // Auto-open schedule modal
    setItemToSchedule(step);
    setShowScheduleModal(true);
    
    // Reset form
    setNewItemTitle('');
    setNewItemDescription('');
    setCreateParentId(null);
    setShowCreateModal(false);
  };

  // Export agenda as Markdown
  const exportAsMarkdown = () => {
    let markdown = `# ${event.title}\n\n`;
    markdown += `**Date**: ${new Date(event.startTime).toLocaleDateString()}\n`;
    markdown += `**Time**: ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}\n`;
    markdown += `**Duration**: ${eventDurationMinutes} minutes\n\n`;
    markdown += `## Agenda\n\n`;

    milestones.forEach((milestone, index) => {
      const startOffset = Math.floor(
        (new Date(milestone.startTime).getTime() - new Date(event.startTime).getTime()) /
          (1000 * 60)
      );
      const duration = Math.floor(
        (new Date(milestone.endTime).getTime() - new Date(milestone.startTime).getTime()) /
          (1000 * 60)
      );
      
      markdown += `${index + 1}. **${milestone.title}** (${new Date(milestone.startTime).toLocaleTimeString()} - ${duration}min)\n`;
      
      // Add steps
      const milestoneSteps = steps.filter(s => s.parentEventId === milestone.id);
      if (milestoneSteps.length > 0) {
        milestoneSteps.forEach(step => {
          const stepDuration = Math.floor(
            (new Date(step.endTime).getTime() - new Date(step.startTime).getTime()) /
              (1000 * 60)
          );
          markdown += `   - ${step.title} (${stepDuration}min)\n`;
        });
      }
      
      markdown += '\n';
    });

    // Create download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-agenda.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Exported agenda as Markdown');
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Event Agenda</h3>
          {isDirty && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/50">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5 animate-pulse" />
              Saving...
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          {canEdit && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Cmd+Z)"
                className="h-8 w-8 p-0"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Cmd+Shift+Z)"
                className="h-8 w-8 p-0"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-700" />
            </>
          )}

          {/* Template Picker */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <BookTemplate className="w-3.5 h-3.5 mr-1.5" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {suggestedTemplate && (
                  <>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Suggested for you</span>
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        console.log('🎯 Apply Template button clicked', { suggestedTemplate, canEdit });
                        applyTemplate(suggestedTemplate);
                      }}
                      className="flex items-start gap-2"
                    >
                      <div className="text-2xl">{suggestedTemplate.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{suggestedTemplate.name}</div>
                        <div className="text-xs text-gray-400">{suggestedTemplate.description}</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuLabel>All Templates</DropdownMenuLabel>
                
                {/* Meetings */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">🏃</span>
                    Meetings
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {getTemplatesByCategory('meeting').map(template => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                {/* Workshops */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">🎨</span>
                    Workshops
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {getTemplatesByCategory('workshop').map(template => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                {/* Personal */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">🧠</span>
                    Personal
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {getTemplatesByCategory('personal').map(template => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                {/* Projects */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">🚀</span>
                    Projects
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {getTemplatesByCategory('project').map(template => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsMarkdown}>
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const json = JSON.stringify({ event, milestones, steps }, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${event.title}-agenda.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Exported agenda as JSON');
              }}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Keyboard Shortcuts Help */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowKeyboardShortcuts(true)}
            className="h-8 w-8 p-0"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Smart Suggestion Banner (if template detected) */}
      {suggestedTemplate && milestones.length === 0 && canEdit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">
                {suggestedTemplate.icon} Quick Start with "{suggestedTemplate.name}"
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                {suggestedTemplate.description}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  console.log('🎯 Apply Template button clicked', { suggestedTemplate, canEdit });
                  applyTemplate(suggestedTemplate);
                }}
                className="bg-gradient-to-r from-teal-500 to-blue-500"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Apply Template
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Agenda View */}
      <EventAgendaView
        event={event}
        milestones={milestones}
        steps={steps}
        onScheduleMilestone={(milestone, startMinuteOffset, durationMinutes) => {
          scheduleItem(milestone.id, startMinuteOffset, durationMinutes);
        }}
        onScheduleStep={(step, startMinuteOffset, durationMinutes) => {
          scheduleItem(step.id, startMinuteOffset, durationMinutes);
        }}
        onReorderMilestones={reorderMilestones}
        onReorderSteps={reorderSteps}
        onAddMilestone={() => {
          setCreateType('milestone');
          setShowCreateModal(true);
        }}
        onAddStep={(milestoneId) => {
          setCreateType('step');
          setCreateParentId(milestoneId);
          setShowCreateModal(true);
        }}
        onEdit={(item) => {
          // Open edit modal (could expand EventAgendaView to support inline editing)
          setItemToSchedule(item);
          setShowScheduleModal(true);
        }}
        onDelete={deleteItem}
        readOnly={!canEdit}
      />

      {/* Schedule Modal */}
      {itemToSchedule && (
        <ScheduleMilestoneModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          parentEvent={event}
          itemToSchedule={itemToSchedule}
          onSchedule={(startMinuteOffset, durationMinutes) => {
            // CRITICAL FIX: Pass the full Event object instead of just ID
            // This prevents "not found" errors when state hasn't updated yet
            scheduleItem(itemToSchedule, startMinuteOffset, durationMinutes);
            setShowScheduleModal(false);
            setItemToSchedule(null);
          }}
          existingItems={milestones
            // ⚡ CRITICAL FIX: Exclude the item being scheduled to prevent self-conflict
            .filter(m => m.id !== itemToSchedule.id)
            .map(m => ({
              startMinuteOffset: Math.floor(
                (new Date(m.startTime).getTime() - new Date(event.startTime).getTime()) /
                  (1000 * 60)
              ),
              durationMinutes: Math.floor(
                (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) /
                  (1000 * 60)
              ),
            }))
          }
        />
      )}

      {/* Create Milestone/Step Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1d24] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Create New {createType === 'milestone' ? 'Milestone' : 'Step'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a {createType} to break down your event into manageable parts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-gray-300">
                Title *
              </Label>
              <Input
                id="title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder={`e.g., "${createType === 'milestone' ? 'Opening Remarks' : 'Introduction'}"`}
                className="bg-gray-800 border-gray-700 text-white mt-1.5"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemTitle.trim()) {
                    createType === 'milestone' ? handleCreateMilestone() : handleCreateStep();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Add details about what this covers..."
                className="bg-gray-800 border-gray-700 text-white mt-1.5"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewItemTitle('');
                setNewItemDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createType === 'milestone' ? handleCreateMilestone : handleCreateStep}
              disabled={!newItemTitle.trim()}
              className="bg-gradient-to-r from-teal-500 to-blue-500"
            >
              Create & Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1d24] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Power-user shortcuts for faster agenda management
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {[
              { keys: ['⌘', 'M'], action: 'Create new milestone' },
              { keys: ['⌘', 'K'], action: 'Open template picker' },
              { keys: ['⌘', 'Z'], action: 'Undo last action' },
              { keys: ['⌘', 'Shift', 'Z'], action: 'Redo action' },
              { keys: ['?'], action: 'Show keyboard shortcuts' },
            ].map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300 text-sm">{shortcut.action}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 font-mono">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && <span className="text-gray-500">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}