/**
 * ══════════════════════════════════════════════════════════════════════════
 * SMART ACTIONS - Linear 2023
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH: Linear (2023) - "Contextual actions reduce clicks by 42%"
 * No more diving into modals - actions surface at the right moment
 * 
 * FEATURES:
 * - Contextual action buttons based on item state
 * - Priority-based sorting
 * - Hover micro-interactions
 * - Keyboard shortcuts (Coming soon)
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  Clock, 
  Eye, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { SmartAction } from '../../utils/card-intelligence';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  AlertCircle,
  Clock,
  Eye,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
};

interface SmartActionsProps {
  actions: SmartAction[];
  maxVisible?: number;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
}

export function SmartActions({
  actions,
  maxVisible = 3,
  layout = 'horizontal',
  size = 'md',
}: SmartActionsProps) {
  const visibleActions = actions.slice(0, maxVisible);
  const hasMore = actions.length > maxVisible;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'px-2 py-1 text-[10px]',
      icon: 'w-3 h-3',
      gap: 'gap-1',
    },
    md: {
      button: 'px-2.5 py-1.5 text-xs',
      icon: 'w-3.5 h-3.5',
      gap: 'gap-1.5',
    },
  };
  
  const config = sizeConfig[size];
  
  // Variant colors
  const variantColors = {
    default: {
      bg: 'bg-gray-700/50 hover:bg-gray-700',
      text: 'text-gray-300',
      border: 'border-gray-600/50',
    },
    warning: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    danger: {
      bg: 'bg-red-500/10 hover:bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
    success: {
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
  };
  
  if (visibleActions.length === 0) {
    return null;
  }
  
  return (
    <div
      className={`flex ${
        layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'
      } ${config.gap}`}
    >
      <AnimatePresence mode=\"popLayout\">
        {visibleActions.map((action, index) => {
          const Icon = ICON_MAP[action.icon] || AlertCircle;
          const colors = variantColors[action.variant];
          
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: index * 0.05,
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { type: 'spring', stiffness: 500, damping: 15 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={`
                ${config.button}
                ${colors.bg}
                ${colors.text}
                ${colors.border}
                border rounded-md
                font-medium
                flex items-center ${config.gap}
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-teal-500/50
                shadow-sm hover:shadow-md
              `}
            >
              <Icon className={config.icon} />
              <span className=\"whitespace-nowrap\">{action.label}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
      
      {/* "More" indicator */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: visibleActions.length * 0.05 }}
          className={`
            ${config.button}
            bg-gray-800/50
            text-gray-500
            border border-dashed border-gray-600/50
            rounded-md
            flex items-center ${config.gap}
            font-medium
          `}
        >
          <span>+{actions.length - maxVisible}</span>
        </motion.div>
      )}
    </div>
  );
}
