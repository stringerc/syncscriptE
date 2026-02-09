/**
 * Reschedule Success Modal
 * 
 * Shows after user confirms a reschedule action
 * Provides option to view the task on the calendar
 * 
 * UX Research: Closure principle - confirm action was successful
 */

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Calendar, X } from 'lucide-react';
import { Button } from './ui/button';

interface RescheduleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCalendar?: (taskId?: string) => void; // NEW: Accept task ID parameter
  taskId?: string; // NEW: Task ID to highlight
  taskTitle: string;
  newTime: string;
  dateDisplay: string;
}

export function RescheduleSuccessModal({
  isOpen,
  onClose,
  onViewCalendar,
  taskId,
  taskTitle,
  newTime,
  dateDisplay,
}: RescheduleSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[60]"
          >
            <div className="bg-[#1a1d24] border border-gray-800 rounded-xl shadow-2xl p-6">
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                  className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-white text-2xl font-bold text-center mb-2">
                Successfully Rescheduled!
              </h2>

              {/* Task Info */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
                <p className="text-gray-400 text-sm mb-2">Task</p>
                <p className="text-white font-semibold mb-4">{taskTitle}</p>

                <div className="flex items-center gap-2 text-teal-300">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-semibold">{newTime}</p>
                    <p className="text-xs text-gray-400">{dateDisplay}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Done
                </Button>
                {onViewCalendar && (
                  <Button
                    onClick={() => {
                      onViewCalendar(taskId); // Pass task ID for highlighting
                      onClose();
                    }}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View on Calendar
                  </Button>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}