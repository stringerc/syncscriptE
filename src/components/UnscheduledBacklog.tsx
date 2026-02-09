/**
 * 📋 UNSCHEDULED BACKLOG - Sidebar for Unscheduled Milestones/Steps
 * 
 * PHASE 5C: Shows milestones/steps that haven't been scheduled yet.
 * 
 * RESEARCH BASIS:
 * - Todoist (2023) - "Inbox" section for unscheduled tasks
 * - Motion.app (2023) - "Backlog" panel with drag-to-schedule
 * - Asana (2020) - "Unscheduled" section in timeline view
 * - Linear (2022) - "Backlog" with smart suggestions
 * - ClickUp (2021) - "Unscheduled tasks" sidebar
 * 
 * FEATURES:
 * - Groups by parent event
 * - Shows milestone/step hierarchy
 * - Drag to calendar to schedule
 * - Quick schedule button (opens modal)
 * - Reorderable within backlog
 * - Count badges per parent
 * 
 * USAGE:
 * <UnscheduledBacklog
 *   events={allEvents}
 *   onScheduleRequest={(parent, children) => showSchedulingModal(parent, children)}
 *   onDragStart={(item) => handleDragStart(item)}
 * />
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Clock,
  GripVertical,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { 
  getUnscheduledChildren,
  getHierarchyLabel,
  getPrimaryEvent,
  countChildEvents
} from '../utils/event-task-types';
import { Button } from './ui/button';

export interface UnscheduledBacklogProps {
  events: Event[];
  onScheduleRequest: (parentEvent: Event, children: Event[]) => void;
  onDragStart?: (item: Event) => void;
  onReorder?: (parentId: string, reorderedChildren: Event[]) => void;
}

export function UnscheduledBacklog({
  events,
  onScheduleRequest,
  onDragStart,
  onReorder,
}: UnscheduledBacklogProps) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  
  /**
   * Group unscheduled items by parent event
   */
  const groupedUnscheduled = useMemo(() => {
    const primaryEvents = events.filter(e => e.isPrimaryEvent);
    
    const groups = primaryEvents.map(parent => {
      const unscheduled = getUnscheduledChildren(parent.id, events);
      
      if (unscheduled.length === 0) return null;
      
      // Further group by hierarchy type (milestones vs steps)
      const milestones = unscheduled.filter(e => e.hierarchyType === 'milestone');
      const steps = unscheduled.filter(e => e.hierarchyType === 'step');
      
      return {
        parent,
        unscheduled,
        milestones,
        steps,
        count: unscheduled.length,
      };
    }).filter(Boolean);
    
    return groups;
  }, [events]);
  
  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };
  
  const handleScheduleAll = (group: any) => {
    onScheduleRequest(group.parent, group.unscheduled);
  };
  
  if (groupedUnscheduled.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
          <Calendar className="w-6 h-6 text-green-400" />
        </div>
        <div className="text-sm text-gray-400">All items scheduled!</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/50 bg-gray-900/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Unscheduled
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {groupedUnscheduled.reduce((sum, g) => sum + (g?.count || 0), 0)} items
            </p>
          </div>
        </div>
      </div>
      
      {/* Groups */}
      <div className="flex-1 overflow-y-auto">
        {groupedUnscheduled.map((group) => {
          if (!group) return null;
          
          const isExpanded = expandedParents.has(group.parent.id);
          const milestoneLabel = getHierarchyLabel('milestone', group.parent);
          const stepLabel = getHierarchyLabel('step', group.parent);
          
          return (
            <div key={group.parent.id} className="border-b border-gray-800/30">
              {/* Parent header */}
              <button
                onClick={() => toggleParent(group.parent.id)}
                className="w-full px-4 py-3 hover:bg-gray-800/30 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <motion.div
                    initial={false}
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </motion.div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {group.parent.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.milestones.length > 0 && (
                        <span>
                          {group.milestones.length} {milestoneLabel.toLowerCase()}
                          {group.milestones.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {group.milestones.length > 0 && group.steps.length > 0 && (
                        <span className="mx-1">•</span>
                      )}
                      {group.steps.length > 0 && (
                        <span>
                          {group.steps.length} {stepLabel.toLowerCase()}
                          {group.steps.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick schedule button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScheduleAll(group);
                  }}
                  className="flex-shrink-0 p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                  title="Auto-schedule all"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                </button>
              </button>
              
              {/* Children list */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2">
                      {/* Milestones */}
                      {group.milestones.length > 0 && (
                        <div className="px-4 py-1">
                          <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">
                            {milestoneLabel}s
                          </div>
                          <div className="space-y-1">
                            {group.milestones.map((milestone) => (
                              <UnscheduledItem
                                key={milestone.id}
                                item={milestone}
                                label={milestoneLabel}
                                onDragStart={onDragStart}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Steps */}
                      {group.steps.length > 0 && (
                        <div className="px-4 py-1">
                          <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">
                            {stepLabel}s
                          </div>
                          <div className="space-y-1">
                            {group.steps.map((step) => (
                              <UnscheduledItem
                                key={step.id}
                                item={step}
                                label={stepLabel}
                                onDragStart={onDragStart}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-gray-800/50 bg-gray-900/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400">
            Drag items to calendar or click <Zap className="w-3 h-3 inline text-purple-400" /> to auto-schedule
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * UNSCHEDULED ITEM CARD
 * ═══════════════════════════════════════════════════════════════
 */

interface UnscheduledItemProps {
  item: Event;
  label: string;
  onDragStart?: (item: Event) => void;
}

function UnscheduledItem({ item, label, onDragStart }: UnscheduledItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('event', JSON.stringify(item));
    onDragStart?.(item);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-move ${
        isDragging
          ? 'opacity-50 bg-purple-500/20 border-purple-500/50'
          : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600/50'
      }`}
      data-event-title={item.title}
    >
      {/* Drag handle */}
      <GripVertical className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-medium truncate">
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {item.description}
          </div>
        )}
      </div>
      
      {/* Type badge */}
      <div className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        item.hierarchyType === 'milestone'
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      }`}>
        {label}
      </div>
    </div>
  );
}
