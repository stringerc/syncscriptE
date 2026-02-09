/**
 * ComingSoonOverlay Component
 * 
 * Standardized Coming Soon pattern for features not yet implemented.
 * Shows an overlay that blocks interaction and explains future functionality.
 */

import { X, Sparkles, Calendar, Zap, Users, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface ComingSoonOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  features?: string[];
  icon?: 'sparkles' | 'calendar' | 'zap' | 'users' | 'trending';
}

export function ComingSoonOverlay({
  open,
  onClose,
  title,
  description,
  features = [],
  icon = 'sparkles',
}: ComingSoonOverlayProps) {
  const icons = {
    sparkles: Sparkles,
    calendar: Calendar,
    zap: Zap,
    users: Users,
    trending: TrendingUp,
  };
  
  const Icon = icons[icon];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-white text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {features.length > 0 && (
          <div className="mt-4 p-4 bg-[#252830] border border-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-3">What's Coming:</h4>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600"
          >
            Got it
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          We're working hard to bring you this feature. Stay tuned!
        </p>
      </DialogContent>
    </Dialog>
  );
}
