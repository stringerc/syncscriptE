import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  iconColor = 'text-teal-400'
}: EmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className={`w-20 h-20 rounded-full bg-gradient-to-br from-teal-600/20 to-blue-600/20 flex items-center justify-center mb-6`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </motion.div>
      
      <h3 className="text-xl text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-400 max-w-md mb-6">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

interface FeatureEmptyStateProps {
  title: string;
  description: string;
  features: string[];
  actionLabel: string;
  onAction: () => void;
}

export function FeatureEmptyState({
  title,
  description,
  features,
  actionLabel,
  onAction
}: FeatureEmptyStateProps) {
  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-[#1e2128] border border-gray-800 rounded-2xl p-8 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center">
          <motion.span 
            className="text-5xl"
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            ✨
          </motion.span>
        </div>
        
        <h2 className="text-2xl text-white mb-3">
          {title}
        </h2>
        
        <p className="text-gray-400 mb-6">
          {description}
        </p>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-white font-semibold mb-3">What you can do:</h3>
          <ul className="text-gray-400 space-y-2">
            {features.map((feature, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
              >
                • {feature}
              </motion.li>
            ))}
          </ul>
        </div>
        
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95"
          size="lg"
        >
          {actionLabel}
        </Button>
      </div>
    </motion.div>
  );
}
