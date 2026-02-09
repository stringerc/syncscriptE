/**
 * AIInsightsPanel Component
 * 
 * Right-side AI Insights panel that appears on all pages.
 * Currently shows Coming Soon overlay.
 */

import { useState } from 'react';
import { Brain, X, Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ComingSoonOverlay } from './ComingSoonOverlay';
import { ScrollArea } from './ui/scroll-area';

interface AIInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIInsightsPanel({ isOpen, onClose }: AIInsightsPanelProps) {
  const [showComingSoon, setShowComingSoon] = useState(true);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-80 bg-[#1a1c20] border-l border-gray-800 z-40 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-medium">AI Insights</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="p-4 space-y-4">
            {/* Preview Cards */}
            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg opacity-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Smart Suggestions</h4>
                  <p className="text-sm text-gray-400">
                    AI-powered task recommendations based on your patterns
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg opacity-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-teal-600/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Productivity Insights</h4>
                  <p className="text-sm text-gray-400">
                    Analyze your work patterns and optimize your schedule
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg opacity-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Goal Tracking</h4>
                  <p className="text-sm text-gray-400">
                    AI analysis of your progress toward goals
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg opacity-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Energy Optimization</h4>
                  <p className="text-sm text-gray-400">
                    Suggestions to maximize your energy levels
                  </p>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg">
              <p className="text-sm text-purple-300 text-center">
                Click anywhere to learn more about AI Insights
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Click overlay */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setShowComingSoon(true)}
        />
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonOverlay
        open={showComingSoon}
        onClose={() => {
          setShowComingSoon(false);
          onClose();
        }}
        title="AI Insights Coming Soon"
        description="We're building powerful AI-driven insights to help you understand your productivity patterns and optimize your workflow."
        icon="sparkles"
        features={[
          'Smart task suggestions based on your work patterns',
          'Productivity analytics and trend analysis',
          'Energy optimization recommendations',
          'Goal progress predictions and insights',
          'Personalized scheduling suggestions',
          'Automated task prioritization',
        ]}
      />
    </>
  );
}
