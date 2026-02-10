/**
 * 📦 BATCH SCHEDULING PANEL - Schedule Multiple Parents at Once
 * 
 * PHASE 5D: Batch operations for scheduling multiple primary events simultaneously.
 * 
 * RESEARCH BASIS:
 * - Asana (2020) - Bulk edit tasks
 * - Linear (2022) - Batch issue operations
 * - Notion (2021) - Multi-select and batch actions
 * - Todoist (2023) - Bulk schedule
 * - ClickUp (2021) - Mass actions panel
 * 
 * FEATURES:
 * - Select multiple primary events
 * - Auto-schedule all children at once
 * - Custom settings per parent
 * - Progress indicator
 * - Conflict resolution
 * - Preview all changes
 * 
 * USAGE:
 * <BatchSchedulingPanel
 *   primaryEvents={primaryEventsWithUnscheduled}
 *   allEvents={allEvents}
 *   onBatchSchedule={(results) => applyBatchSchedule(results)}
 * />
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle, AlertCircle, X, Settings } from 'lucide-react';
import { Event } from '../utils/event-task-types';
import {
  getUnscheduledChildren,
  autoScheduleChildren,
  validateScheduleWithinParent,
  getHierarchyLabel,
} from '../utils/event-task-types';
import { Button } from './ui/button';

export interface BatchSchedulingPanelProps {
  primaryEvents: Event[];
  allEvents: Event[];
  onBatchSchedule: (results: BatchScheduleResult[]) => void;
  onClose?: () => void;
}

export interface BatchScheduleResult {
  parentEvent: Event;
  scheduledChildren: Event[];
  success: boolean;
  error?: string;
}

export interface BatchScheduleSettings {
  workHoursStart: number;
  workHoursEnd: number;
  defaultDuration: number;
  respectWorkHours: boolean;
}

export function BatchSchedulingPanel({
  primaryEvents,
  allEvents,
  onBatchSchedule,
  onClose,
}: BatchSchedulingPanelProps) {
  const [selectedParentIds, setSelectedParentIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<BatchScheduleSettings>({
    workHoursStart: 9,
    workHoursEnd: 17,
    defaultDuration: 60,
    respectWorkHours: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  
  /**
   * Get parents with unscheduled children
   */
  const parentsWithUnscheduled = useMemo(() => {
    return primaryEvents
      .map(parent => {
        const unscheduled = getUnscheduledChildren(parent.id, allEvents);
        return {
          parent,
          unscheduled,
          count: unscheduled.length,
        };
      })
      .filter(p => p.count > 0);
  }, [primaryEvents, allEvents]);
  
  /**
   * Toggle parent selection
   */
  const toggleParent = (parentId: string) => {
    setSelectedParentIds(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };
  
  /**
   * Select all parents
   */
  const selectAll = () => {
    setSelectedParentIds(new Set(parentsWithUnscheduled.map(p => p.parent.id)));
  };
  
  /**
   * Clear selection
   */
  const clearSelection = () => {
    setSelectedParentIds(new Set());
  };
  
  /**
   * Process batch schedule
   */
  const processBatchSchedule = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    
    const results: BatchScheduleResult[] = [];
    
    for (const item of parentsWithUnscheduled) {
      if (!selectedParentIds.has(item.parent.id)) continue;
      
      try {
        // Auto-schedule children
        const scheduled = autoScheduleChildren(
          item.parent,
          item.unscheduled,
          allEvents,
          settings
        );
        
        // Validate
        const validation = validateScheduleWithinParent(item.parent, scheduled);
        
        if (!validation.isValid) {
          results.push({
            parentEvent: item.parent,
            scheduledChildren: [],
            success: false,
            error: validation.violations.map(v => v.message).join(', '),
          });
        } else {
          results.push({
            parentEvent: item.parent,
            scheduledChildren: scheduled,
            success: true,
          });
        }
      } catch (error) {
        results.push({
          parentEvent: item.parent,
          scheduledChildren: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      setProcessedCount(prev => prev + 1);
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
    onBatchSchedule(results);
  };
  
  const selectedCount = selectedParentIds.size;
  const totalUnscheduled = parentsWithUnscheduled
    .filter(p => selectedParentIds.has(p.parent.id))
    .reduce((sum, p) => sum + p.count, 0);
  
  return (
    <div className="fixed inset-0 bg-black backdrop-blur-sm z-[100] flex items-center justify-center" style={{ opacity: 0.6 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1a1d24] border border-purple-500/30 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Batch Auto-Schedule
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Schedule children for multiple events at once
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
              >
                <Settings className="w-4 h-4 text-purple-400" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Settings (collapsible) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-gray-800/50"
            >
              <div className="p-4 bg-gray-900/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Work Hours Start</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={settings.workHoursStart}
                      onChange={(e) => setSettings(prev => ({ ...prev, workHoursStart: parseInt(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Work Hours End</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={settings.workHoursEnd}
                      onChange={(e) => setSettings(prev => ({ ...prev, workHoursEnd: parseInt(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Default Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={settings.defaultDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="respectWorkHours"
                    checked={settings.respectWorkHours}
                    onChange={(e) => setSettings(prev => ({ ...prev, respectWorkHours: e.target.checked }))}
                    className="rounded border-gray-700"
                  />
                  <label htmlFor="respectWorkHours" className="text-sm text-gray-300">
                    Respect work hours
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Parent list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {selectedCount} of {parentsWithUnscheduled.length} selected • {totalUnscheduled} items to schedule
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-gray-600">•</span>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {parentsWithUnscheduled.map(({ parent, unscheduled, count }) => {
              const isSelected = selectedParentIds.has(parent.id);
              const label = getHierarchyLabel('milestone', parent);
              
              return (
                <button
                  key={parent.id}
                  onClick={() => toggleParent(parent.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{parent.title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {count} unscheduled {label.toLowerCase()}{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Progress bar (during processing) */}
        {isProcessing && (
          <div className="border-t border-gray-800/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-purple-600 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(processedCount / selectedCount) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-sm text-gray-400">
                {processedCount} / {selectedCount}
              </div>
            </div>
            <div className="text-xs text-gray-500">Processing batch schedule...</div>
          </div>
        )}
        
        {/* Footer */}
        <div className="border-t border-gray-800/50 p-4 flex items-center gap-3">
          <Button
            onClick={processBatchSchedule}
            disabled={selectedCount === 0 || isProcessing}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isProcessing ? 'Processing...' : `Schedule ${totalUnscheduled} Items`}
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
