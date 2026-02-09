/**
 * Quick Event Actions
 * 
 * PHASE 3: Enhanced Interactions
 * Quick action buttons that appear on hover/selection of calendar events
 * Enables rapid event management without opening full modal
 */

import { Copy, Trash2, Edit, Clock, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickEventActionsProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReschedule: () => void;
  onAddParticipants?: () => void;
  onToggleFocusMode?: () => void;
  isFocusBlock?: boolean;
}

export function QuickEventActions({
  onEdit,
  onDuplicate,
  onDelete,
  onReschedule,
  onAddParticipants,
  onToggleFocusMode,
  isFocusBlock = false,
}: QuickEventActionsProps) {
  const actions = [
    { icon: Edit, label: 'Edit', onClick: onEdit, color: 'text-blue-400 hover:bg-blue-500/20' },
    { icon: Clock, label: 'Reschedule', onClick: onReschedule, color: 'text-purple-400 hover:bg-purple-500/20' },
    { icon: Copy, label: 'Duplicate', onClick: onDuplicate, color: 'text-teal-400 hover:bg-teal-500/20' },
    { icon: Trash2, label: 'Delete', onClick: onDelete, color: 'text-red-400 hover:bg-red-500/20' },
  ];

  if (onAddParticipants) {
    actions.splice(2, 0, { 
      icon: Users, 
      label: 'Add People', 
      onClick: onAddParticipants, 
      color: 'text-green-400 hover:bg-green-500/20' 
    });
  }

  if (onToggleFocusMode) {
    actions.unshift({ 
      icon: Zap, 
      label: isFocusBlock ? 'Unfocus' : 'Focus Mode', 
      onClick: onToggleFocusMode, 
      color: isFocusBlock ? 'text-amber-400 hover:bg-amber-500/20' : 'text-gray-400 hover:bg-gray-500/20' 
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-1 bg-[#1a1d24] border border-gray-700 rounded-lg p-1 shadow-xl"
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className={`p-2 rounded transition-colors ${action.color}`}
          title={action.label}
        >
          <action.icon className="w-4 h-4" />
        </button>
      ))}
    </motion.div>
  );
}
