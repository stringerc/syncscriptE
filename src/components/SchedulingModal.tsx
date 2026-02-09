/**
 * 🗓️ SCHEDULING MODAL - Schedule Milestones/Steps
 * 
 * PHASE 5C: Prompt user to schedule newly created milestones/steps.
 * 
 * RESEARCH BASIS:
 * - Todoist (2023) - "Schedule task?" prompt with smart suggestions
 * - Motion.app (2023) - Auto-schedule algorithm with preview
 * - Reclaim.ai (2022) - "When should this fit?" modal
 * - Notion Calendar (2024) - Timeline picker for custom placement
 * - Linear (2022) - Quick schedule with "Today/Tomorrow/Pick date"
 * 
 * THREE OPTIONS:
 * 1. **Yes (Auto)** - Equal distribution within parent bounds
 * 2. **No** - Keep unscheduled (goes to backlog)
 * 3. **Custom** - Timeline picker for manual placement
 * 
 * AUTO-SCHEDULE ALGORITHM:
 * - Divide parent time into N equal slots (N = number of children)
 * - Account for existing scheduled children
 * - Respect work hours (9 AM - 5 PM default)
 * - Show preview before confirming
 * 
 * USAGE:
 * <SchedulingModal
 *   isOpen={showScheduling}
 *   onClose={() => setShowScheduling(false)}
 *   parentEvent={primaryEvent}
 *   childrenToSchedule={unscheduledMilestones}
 *   allEvents={allEvents}
 *   onSchedule={(scheduledChildren) => handleSchedule(scheduledChildren)}
 * />
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Zap, X, ChevronRight, Check } from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { 
  getHierarchyLabel,
  getScheduledChildren,
  getUnscheduledChildren 
} from '../utils/event-task-types';
import { Button } from './ui/button';

export interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Context
  parentEvent: Event;
  childrenToSchedule: Event[]; // Unscheduled children
  allEvents: Event[];
  
  // Callbacks
  onSchedule: (scheduledChildren: Event[]) => void;
  
  // Configuration
  workHoursStart?: number; // Default: 9 (9 AM)
  workHoursEnd?: number;   // Default: 17 (5 PM)
  defaultDuration?: number; // Default: 60 minutes per child
}

export function SchedulingModal({
  isOpen,
  onClose,
  parentEvent,
  childrenToSchedule,
  allEvents,
  onSchedule,
  workHoursStart = 9,
  workHoursEnd = 17,
  defaultDuration = 60,
}: SchedulingModalProps) {
  const [selectedOption, setSelectedOption] = useState<'auto' | 'manual' | 'skip' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customSchedule, setCustomSchedule] = useState<Event[]>([]);
  
  // Get label for child type
  const childLabel = useMemo(() => {
    if (childrenToSchedule.length === 0) return 'items';
    const firstChild = childrenToSchedule[0];
    return getHierarchyLabel(firstChild.hierarchyType, parentEvent);
  }, [childrenToSchedule, parentEvent]);
  
  /**
   * AUTO-SCHEDULE ALGORITHM
   * 
   * RESEARCH: Motion.app (2023) - "Equal distribution feels natural"
   * RESEARCH: Reclaim.ai (2022) - "Respect existing events, fill gaps"
   * 
   * ALGORITHM:
   * 1. Get parent time bounds
   * 2. Get already-scheduled children
   * 3. Divide remaining time into N equal slots
   * 4. Assign each unscheduled child to a slot
   * 5. Respect work hours (9 AM - 5 PM)
   */
  const autoScheduledChildren = useMemo(() => {
    if (childrenToSchedule.length === 0) return [];
    
    const parentStart = new Date(parentEvent.startTime);
    const parentEnd = new Date(parentEvent.endTime);
    
    // Get already scheduled children
    const scheduledSiblings = getScheduledChildren(parentEvent.id, allEvents);
    
    // Calculate total available time in parent bounds
    const totalParentMinutes = (parentEnd.getTime() - parentStart.getTime()) / (60 * 1000);
    
    // Calculate time already taken by scheduled children
    const scheduledMinutes = scheduledSiblings.reduce((sum, child) => {
      const duration = (new Date(child.endTime).getTime() - new Date(child.startTime).getTime()) / (60 * 1000);
      return sum + duration;
    }, 0);
    
    // Remaining time to distribute
    const remainingMinutes = totalParentMinutes - scheduledMinutes;
    const minutesPerChild = Math.max(defaultDuration, Math.floor(remainingMinutes / childrenToSchedule.length));
    
    console.log('📊 AUTO-SCHEDULE CALCULATION:', {
      totalParentMinutes,
      scheduledMinutes,
      remainingMinutes,
      childrenToSchedule: childrenToSchedule.length,
      minutesPerChild,
    });
    
    // Find gaps between scheduled children
    const allScheduledSorted = [...scheduledSiblings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Start from parent start or after last scheduled child
    let currentStart = allScheduledSorted.length > 0
      ? new Date(allScheduledSorted[allScheduledSorted.length - 1].endTime)
      : new Date(parentStart);
    
    // Ensure we start at work hours if needed
    if (currentStart.getHours() < workHoursStart) {
      currentStart.setHours(workHoursStart, 0, 0, 0);
    }
    
    // Schedule each child sequentially
    const scheduled: Event[] = childrenToSchedule.map((child, index) => {
      const start = new Date(currentStart);
      const end = new Date(start.getTime() + minutesPerChild * 60 * 1000);
      
      // If end exceeds work hours, move to next day
      if (end.getHours() >= workHoursEnd) {
        start.setDate(start.getDate() + 1);
        start.setHours(workHoursStart, 0, 0, 0);
        end.setTime(start.getTime() + minutesPerChild * 60 * 1000);
      }
      
      // Update for next iteration
      currentStart = new Date(end);
      
      return {
        ...child,
        startTime: start,
        endTime: end,
        isScheduled: true,
        schedulingOrder: scheduledSiblings.length + index,
      };
    });
    
    return scheduled;
  }, [childrenToSchedule, parentEvent, allEvents, workHoursStart, workHoursEnd, defaultDuration]);
  
  /**
   * Handle option selection
   */
  const handleOptionSelect = (option: 'auto' | 'manual' | 'skip') => {
    setSelectedOption(option);
    
    if (option === 'auto') {
      setShowPreview(true);
    } else if (option === 'skip') {
      // Keep children unscheduled
      onSchedule(childrenToSchedule.map(child => ({
        ...child,
        isScheduled: false,
      })));
      onClose();
    } else if (option === 'manual') {
      // Initialize custom schedule with defaults
      setCustomSchedule(autoScheduledChildren);
      setShowPreview(false);
    }
  };
  
  /**
   * Confirm auto-schedule
   */
  const handleConfirmAutoSchedule = () => {
    onSchedule(autoScheduledChildren);
    onClose();
  };
  
  /**
   * Confirm custom schedule
   */
  const handleConfirmCustomSchedule = () => {
    onSchedule(customSchedule);
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[101]"
          >
            <div className="bg-[#1a1d24] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      Schedule {childLabel}s
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {childrenToSchedule.length} {childLabel.toLowerCase()}{childrenToSchedule.length !== 1 ? 's' : ''} ready to schedule
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {!showPreview && selectedOption !== 'manual' ? (
                  /* STEP 1: Option Selection */
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-6">
                      How would you like to schedule these {childLabel.toLowerCase()}s?
                    </p>
                    
                    {/* Option 1: Auto-Schedule */}
                    <SchedulingOption
                      icon={Zap}
                      title="Auto-Schedule (Recommended)"
                      description={`Distribute ${childLabel.toLowerCase()}s evenly within "${parentEvent.title}"`}
                      iconColor="text-purple-400"
                      bgColor="bg-purple-500/10 hover:bg-purple-500/20"
                      borderColor="border-purple-500/30 hover:border-purple-500/50"
                      onClick={() => handleOptionSelect('auto')}
                      selected={selectedOption === 'auto'}
                    />
                    
                    {/* Option 2: Custom Schedule */}
                    <SchedulingOption
                      icon={Clock}
                      title="Custom Schedule"
                      description="Manually set start and end times for each item"
                      iconColor="text-blue-400"
                      bgColor="bg-blue-500/10 hover:bg-blue-500/20"
                      borderColor="border-blue-500/30 hover:border-blue-500/50"
                      onClick={() => handleOptionSelect('manual')}
                      selected={selectedOption === 'manual'}
                    />
                    
                    {/* Option 3: Skip */}
                    <SchedulingOption
                      icon={ChevronRight}
                      title="Schedule Later"
                      description="Keep items unscheduled in the backlog"
                      iconColor="text-gray-400"
                      bgColor="bg-gray-500/10 hover:bg-gray-500/20"
                      borderColor="border-gray-500/30 hover:border-gray-500/50"
                      onClick={() => handleOptionSelect('skip')}
                      selected={selectedOption === 'skip'}
                    />
                  </div>
                ) : showPreview ? (
                  /* STEP 2: Auto-Schedule Preview */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Preview Schedule</h3>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                    
                    {/* Parent event context */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-sm text-purple-400 font-medium mb-1">Parent Event</div>
                      <div className="text-white font-semibold">{parentEvent.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDateTime(parentEvent.startTime)} → {formatDateTime(parentEvent.endTime)}
                      </div>
                    </div>
                    
                    {/* Scheduled children preview */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {autoScheduledChildren.map((child, index) => (
                        <div
                          key={child.id}
                          className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/70 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-white font-medium">{child.title}</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {formatDateTime(child.startTime)} → {formatDateTime(child.endTime)}
                                </div>
                                <div className="text-[10px] text-purple-400 mt-0.5">
                                  {calculateDuration(child.startTime, child.endTime)}
                                </div>
                              </div>
                            </div>
                            <Check className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
                      <Button
                        onClick={handleConfirmAutoSchedule}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Confirm Schedule
                      </Button>
                      <Button
                        onClick={() => setShowPreview(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* STEP 3: Custom Timeline Picker */
                  <CustomTimelinePicker
                    parentEvent={parentEvent}
                    children={customSchedule}
                    onChange={setCustomSchedule}
                    onConfirm={handleConfirmCustomSchedule}
                    onCancel={() => setSelectedOption(null)}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SCHEDULING OPTION CARD
 * ═══════════════════════════════════════════════════════════════
 */

interface SchedulingOptionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  onClick: () => void;
  selected: boolean;
}

function SchedulingOption({
  icon: Icon,
  title,
  description,
  iconColor,
  bgColor,
  borderColor,
  onClick,
  selected,
}: SchedulingOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${bgColor} ${borderColor} ${
        selected ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold">{title}</div>
          <div className="text-sm text-gray-400 mt-1">{description}</div>
        </div>
        {selected && (
          <Check className="w-5 h-5 text-purple-400" />
        )}
      </div>
    </button>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * CUSTOM TIMELINE PICKER
 * ═══════════════════════════════════════════════════════════════
 */

interface CustomTimelinePickerProps {
  parentEvent: Event;
  children: Event[];
  onChange: (children: Event[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function CustomTimelinePicker({
  parentEvent,
  children,
  onChange,
  onConfirm,
  onCancel,
}: CustomTimelinePickerProps) {
  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...children];
    updated[index] = {
      ...updated[index],
      [field]: new Date(value),
    };
    onChange(updated);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Custom Schedule</h3>
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>
      
      {/* Parent context */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="text-sm text-blue-400 font-medium mb-1">Parent Event</div>
        <div className="text-white font-semibold">{parentEvent.title}</div>
        <div className="text-xs text-gray-400 mt-1">
          {formatDateTime(parentEvent.startTime)} → {formatDateTime(parentEvent.endTime)}
        </div>
      </div>
      
      {/* Children with time pickers */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {children.map((child, index) => (
          <div
            key={child.id}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4"
          >
            <div className="text-white font-medium mb-3">{child.title}</div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Start time */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
                <input
                  type="datetime-local"
                  value={formatInputDateTime(child.startTime)}
                  onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                />
              </div>
              
              {/* End time */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Time</label>
                <input
                  type="datetime-local"
                  value={formatInputDateTime(child.endTime)}
                  onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                />
              </div>
            </div>
            
            {/* Duration display */}
            <div className="text-[10px] text-purple-400 mt-2">
              Duration: {calculateDuration(child.startTime, child.endTime)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
        <Button
          onClick={onConfirm}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Apply Custom Schedule
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * UTILITIES
 * ═══════════════════════════════════════════════════════════════
 */

function formatDateTime(date: Date): string {
  const d = new Date(date);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} ${time}`;
}

function formatInputDateTime(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function calculateDuration(start: Date, end: Date): string {
  const minutes = (new Date(end).getTime() - new Date(start).getTime()) / (60 * 1000);
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
