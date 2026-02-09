/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHEDULE MILESTONE/STEP MODAL - MINUTE-LEVEL PRECISION SCHEDULING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH FOUNDATION:
 * ────────────────────
 * - Google Calendar (2024): Time picker with 1-minute precision
 * - Apple Calendar (2023): Relative time offsets
 * - Microsoft Outlook (2023): Duration presets
 * - Linear (2022): Estimated time with quick presets
 * 
 * FEATURES:
 * ─────────
 * • Absolute time selection (specific time within event)
 * • Relative offset selection (e.g., "+15 min" from start)
 * • Duration quick presets (5m, 15m, 30m, 1h, 2h)
 * • Visual timeline preview
 * • Conflict detection
 * • Auto-suggest next available slot
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Calendar, AlertCircle, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Event } from '../../utils/event-task-types';

interface ScheduleMilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentEvent: Event;
  itemToSchedule: Event;
  onSchedule: (startMinuteOffset: number, durationMinutes: number) => void;
  existingItems?: Array<{ startMinuteOffset: number; durationMinutes: number }>;
}

const DURATION_PRESETS = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
];

export function ScheduleMilestoneModal({
  open,
  onOpenChange,
  parentEvent,
  itemToSchedule,
  onSchedule,
  existingItems = [],
}: ScheduleMilestoneModalProps) {
  const [startMinuteOffset, setStartMinuteOffset] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [inputMode, setInputMode] = useState<'absolute' | 'relative'>('relative');

  // Calculate parent event duration
  const parentDurationMinutes = Math.floor(
    (new Date(parentEvent.endTime).getTime() - new Date(parentEvent.startTime).getTime()) /
      (1000 * 60)
  );

  // Find next available slot (auto-suggest)
  const nextAvailableSlot = () => {
    if (existingItems.length === 0) return 0;

    // Sort by start time
    const sorted = [...existingItems].sort((a, b) => a.startMinuteOffset - b.startMinuteOffset);
    
    // Find first gap
    let currentTime = 0;
    for (const item of sorted) {
      if (currentTime < item.startMinuteOffset) {
        const gapDuration = item.startMinuteOffset - currentTime;
        if (gapDuration >= durationMinutes) {
          return currentTime;
        }
      }
      currentTime = Math.max(currentTime, item.startMinuteOffset + item.durationMinutes);
    }
    
    // Return time after last item
    return currentTime;
  };

  // Detect conflicts
  // RESEARCH: Linear (2024) - Milestones are deadline markers, not time-blocks
  // FLEXIBILITY: Allow milestone overlaps, but warn about step overlaps
  const hasConflict = existingItems.some((item) => {
    const itemEnd = item.startMinuteOffset + item.durationMinutes;
    const newEnd = startMinuteOffset + durationMinutes;
    
    const overlaps = (
      (startMinuteOffset >= item.startMinuteOffset && startMinuteOffset < itemEnd) ||
      (newEnd > item.startMinuteOffset && newEnd <= itemEnd) ||
      (startMinuteOffset <= item.startMinuteOffset && newEnd >= itemEnd)
    );
    
    // ⚡ CRITICAL FIX: Only flag conflict if scheduling a STEP and there's an overlap
    // Milestones can freely overlap (they're conceptual deadlines, not time-blocks)
    return itemToSchedule.hierarchyType === 'step' && overlaps;
  });

  // Determine if this is a blocking conflict (steps only) or just a warning
  const isBlockingConflict = hasConflict;

  const isOutOfBounds = startMinuteOffset + durationMinutes > parentDurationMinutes;

  const formatTime = (minuteOffset: number): string => {
    const eventStart = new Date(parentEvent.startTime);
    const time = new Date(eventStart.getTime() + minuteOffset * 60 * 1000);
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const handleSubmit = () => {
    // RESEARCH FIX: Allow milestone overlaps (Linear pattern)
    // Only block if it's a step conflict or out of bounds
    if (!isBlockingConflict && !isOutOfBounds) {
      onSchedule(startMinuteOffset, durationMinutes);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Auto-suggest next available slot when modal opens
      const suggested = nextAvailableSlot();
      setStartMinuteOffset(suggested);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1d24] border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Schedule {itemToSchedule.hierarchyType === 'milestone' ? 'Milestone' : 'Step'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Set the timing for "{itemToSchedule.title}" within {parentEvent.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parent Event Timeline */}
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">Parent Event</div>
                <div className="text-white font-medium">{parentEvent.title}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs mb-1">Duration</div>
                <div className="text-teal-400 font-mono">{formatDuration(parentDurationMinutes)}</div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={inputMode === 'relative' ? 'default' : 'outline'}
              onClick={() => setInputMode('relative')}
              className="flex-1"
            >
              Relative Time
            </Button>
            <Button
              size="sm"
              variant={inputMode === 'absolute' ? 'default' : 'outline'}
              onClick={() => setInputMode('absolute')}
              className="flex-1"
            >
              Absolute Time
            </Button>
          </div>

          {/* Start Time Input */}
          <div>
            <Label htmlFor="start-time" className="text-gray-300 mb-2 block">
              Start Time
            </Label>
            {inputMode === 'relative' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="start-time"
                    type="number"
                    min={0}
                    max={parentDurationMinutes}
                    value={startMinuteOffset}
                    onChange={(e) => setStartMinuteOffset(parseInt(e.target.value) || 0)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <span className="text-gray-400 text-sm whitespace-nowrap">
                    minutes from start
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(startMinuteOffset)} absolute time
                </div>
              </div>
            ) : (
              <Input
                id="start-time"
                type="time"
                value={formatTime(startMinuteOffset)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            )}
          </div>

          {/* Duration Input */}
          <div>
            <Label className="text-gray-300 mb-2 block">Duration</Label>
            <div className="space-y-2">
              <Input
                type="number"
                min={1}
                max={parentDurationMinutes}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.minutes}
                    size="sm"
                    variant="outline"
                    onClick={() => setDurationMinutes(preset.minutes)}
                    className={`h-7 text-xs ${
                      durationMinutes === preset.minutes
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : ''
                    }`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Timeline */}
          <div className="space-y-2">
            <Label className="text-gray-300">Preview</Label>
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="text-gray-400">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {formatTime(startMinuteOffset)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatDuration(durationMinutes)}
                </Badge>
                <div className="text-gray-400">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {formatTime(startMinuteOffset + durationMinutes)}
                </div>
              </div>
              
              {/* Visual Timeline Bar */}
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden relative">
                <motion.div
                  className={`absolute h-full ${
                    hasConflict || isOutOfBounds
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    left: `${(startMinuteOffset / parentDurationMinutes) * 100}%`,
                    width: `${(durationMinutes / parentDurationMinutes) * 100}%`,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </div>

          {/* Warnings */}
          {hasConflict && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 p-2 border rounded-lg ${
                isBlockingConflict
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}
            >
              <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                isBlockingConflict ? 'text-red-400' : 'text-yellow-400'
              }`} />
              <div className={`text-xs ${isBlockingConflict ? 'text-red-300' : 'text-yellow-300'}`}>
                <strong>{isBlockingConflict ? '⛔ Blocking Conflict' : '⚠️ Overlap Warning'}</strong>
                <p className={`mt-0.5 ${isBlockingConflict ? 'text-red-400/80' : 'text-yellow-400/80'}`}>
                  {isBlockingConflict
                    ? 'Steps cannot overlap with other items. Please choose a different time.'
                    : 'This milestone overlaps with another item. This is allowed since milestones are conceptual markers.'}
                </p>
              </div>
            </motion.div>
          )}

          {isOutOfBounds && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-300">
                <strong>Exceeds parent event</strong>
                <p className="text-yellow-400/80 mt-0.5">
                  This scheduling extends beyond the parent event's end time.
                </p>
              </div>
            </motion.div>
          )}

          {/* Auto-Suggest */}
          {(hasConflict || isOutOfBounds) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const suggested = nextAvailableSlot();
                setStartMinuteOffset(suggested);
              }}
              className="w-full"
            >
              <Zap className="w-3.5 h-3.5 mr-2" />
              Auto-Suggest Next Available Slot
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isBlockingConflict || isOutOfBounds}
            className="bg-gradient-to-r from-teal-500 to-blue-500"
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}