/**
 * Bulk Event Operations
 * 
 * PHASE 3: Enhanced Interactions
 * Multi-select and bulk operations for calendar events
 * Enables efficient management of multiple events at once
 */

import { useState } from 'react';
import { CheckSquare, Copy, Trash2, Calendar, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Event } from '../utils/event-task-types';

interface BulkEventOperationsProps {
  selectedEvents: Event[];
  onClearSelection: () => void;
  onDuplicateAll: () => void;
  onDeleteAll: () => void;
  onMoveAll: () => void;
  onRescheduleAll: () => void;
}

export function BulkEventOperations({
  selectedEvents,
  onClearSelection,
  onDuplicateAll,
  onDeleteAll,
  onMoveAll,
  onRescheduleAll,
}: BulkEventOperationsProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (selectedEvents.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-[#1a1d24] border border-gray-700 rounded-xl shadow-2xl px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-teal-400">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">{selectedEvents.length} selected</span>
            </div>

            <div className="h-6 w-px bg-gray-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={onDuplicateAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-teal-500/20 text-teal-400 transition-colors"
                title="Duplicate all selected events"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">Duplicate</span>
              </button>

              <button
                onClick={onMoveAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors"
                title="Move all selected events"
              >
                <Move className="w-4 h-4" />
                <span className="text-sm">Move</span>
              </button>

              <button
                onClick={onRescheduleAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                title="Reschedule all selected events"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Reschedule</span>
              </button>

              {!showConfirmDelete ? (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Delete all selected events"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onDeleteAll();
                      setShowConfirmDelete(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-400 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-700" />

            <button
              onClick={onClearSelection}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Event Selection Checkbox
 * Shows on event cards when bulk selection mode is active
 */
interface EventSelectionCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
}

export function EventSelectionCheckbox({ isSelected, onToggle }: EventSelectionCheckboxProps) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors z-10 ${
        isSelected
          ? 'bg-teal-500 border-teal-500'
          : 'border-gray-500 hover:border-teal-500'
      }`}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <CheckSquare className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
