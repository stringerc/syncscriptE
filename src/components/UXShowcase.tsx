import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { 
  Sparkles, CheckCircle2, Info, AlertTriangle, XCircle,
  Keyboard, Zap, Target, Brain, Heart
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { SkeletonTaskCard, SkeletonGoalCard } from './SkeletonTaskCard';
import { EmptyState, FeatureEmptyState } from './EmptyStates';
import { Badge } from './ui/badge';

export function UXShowcase() {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="min-h-screen bg-[#141619] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl text-white mb-3">
            UX Improvements Showcase
          </h1>
          <p className="text-gray-400 text-lg">
            10 Research-Backed Enhancements for Better User Retention
          </p>
        </motion.div>

        {/* 1. Toast Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              1. Toast Notifications
            </h2>
            <p className="text-gray-400 mb-4">
              Real-time feedback for all user actions
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => toast.success('Success!', { description: 'Task completed successfully' })}
                className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Success Toast
              </Button>
              <Button
                onClick={() => toast.info('Information', { description: 'This is an info message' })}
                className="bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all"
              >
                <Info className="w-4 h-4 mr-2" />
                Info Toast
              </Button>
              <Button
                onClick={() => toast.warning('Warning', { description: 'Please review this action' })}
                className="bg-amber-600 hover:bg-amber-700 hover:scale-105 transition-all"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Warning Toast
              </Button>
              <Button
                onClick={() => toast.error('Error', { description: 'Something went wrong' })}
                className="bg-red-600 hover:bg-red-700 hover:scale-105 transition-all"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Error Toast
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* 2. Microinteractions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              2. Microinteractions & Hover States
            </h2>
            <p className="text-gray-400 mb-4">
              Enhanced button effects with scale, shadow, and focus rings
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95">
                Hover Me!
              </Button>
              <Button 
                variant="outline"
                className="hover:scale-105 hover:bg-purple-600/10 hover:border-purple-600/50 transition-all"
              >
                Outline Hover
              </Button>
              <motion.div
                className="bg-[#2a2d35] border border-gray-800 rounded-xl p-4 cursor-pointer"
                whileHover={{ scale: 1.05, borderColor: '#0d9488' }}
                whileTap={{ scale: 0.95 }}
              >
                <p className="text-white text-sm">Hover this card!</p>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* 3. Skeleton Loading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              3. Skeleton Loading States
            </h2>
            <p className="text-gray-400 mb-4">
              Perceived performance with loading placeholders
            </p>
            <Button
              onClick={() => {
                setShowSkeleton(true);
                setTimeout(() => setShowSkeleton(false), 3000);
                toast.info('Loading...', { description: 'Simulating 3s load time' });
              }}
              className="mb-4 hover:scale-105 transition-transform"
            >
              Toggle Skeleton (3s)
            </Button>
            <div className="space-y-3">
              {showSkeleton ? (
                <>
                  <SkeletonTaskCard />
                  <SkeletonGoalCard />
                </>
              ) : (
                <div className="bg-[#2a2d35] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    <p className="text-white">Content loaded!</p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    This is real content that replaced the skeleton
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 4. Empty States */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              4. Empty States
            </h2>
            <p className="text-gray-400 mb-4">
              Beautiful placeholders with clear CTAs
            </p>
            <Button
              onClick={() => setShowEmpty(!showEmpty)}
              className="mb-4 hover:scale-105 transition-transform"
            >
              {showEmpty ? 'Hide' : 'Show'} Empty State
            </Button>
            {showEmpty && (
              <EmptyState
                icon={Heart}
                title="No items found"
                description="Create your first item to get started with this feature"
                actionLabel="Create Item"
                onAction={() => toast.success('Creating item...', { description: 'Opening creation modal' })}
                iconColor="text-pink-400"
              />
            )}
          </Card>
        </motion.div>

        {/* 5. Keyboard Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-cyan-400" />
              5. Keyboard Shortcuts
            </h2>
            <p className="text-gray-400 mb-4">
              Press <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">?</kbd> anywhere to see all shortcuts
            </p>
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Create new task</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">Ctrl</kbd>
                  <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">N</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Open search</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">Ctrl</kbd>
                  <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">K</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">?</kbd>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 6. Progress with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4">
              6. Animated Progress Bars
            </h2>
            <p className="text-gray-400 mb-4">
              Smooth color-coded progress with psychology
            </p>
            <Button
              onClick={() => {
                setProgress(0);
                const interval = setInterval(() => {
                  setProgress(p => {
                    if (p >= 100) {
                      clearInterval(interval);
                      toast.success('Complete!', { description: '100% achieved' });
                      return 100;
                    }
                    return p + 10;
                  });
                }, 200);
              }}
              className="mb-4 hover:scale-105 transition-transform"
            >
              Animate Progress
            </Button>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Tasks (Teal)</span>
                  <span className="text-teal-400">{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-teal-950/50"
                  indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Goals (Purple)</span>
                  <span className="text-purple-400">{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-purple-950/50"
                  indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-400"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 7. Enhanced Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <h2 className="text-xl text-white mb-4">
              7. Interactive Badges & Filters
            </h2>
            <p className="text-gray-400 mb-4">
              Clickable filters with hover feedback
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-teal-600/10 hover:border-teal-600/50 hover:scale-105 transition-all text-white"
                onClick={() => toast.info('Filter applied', { description: 'Showing all items' })}
              >
                All Items (24)
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-purple-600/10 hover:border-purple-600/50 hover:scale-105 transition-all text-white"
                onClick={() => toast.info('Filter applied', { description: 'Showing active items' })}
              >
                Active (12)
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-green-600/10 hover:border-green-600/50 hover:scale-105 transition-all text-white"
                onClick={() => toast.info('Filter applied', { description: 'Showing completed items' })}
              >
                Completed (10)
              </Badge>
            </div>
          </Card>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-teal-600/10 to-blue-600/10 border border-teal-600/20 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl text-white mb-3">
            ✨ All Improvements Implemented!
          </h3>
          <p className="text-gray-300 mb-4">
            10 research-backed UX enhancements across your entire dashboard
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge className="bg-teal-600/20 text-teal-400 border-teal-600/30">Toast Notifications</Badge>
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">Microinteractions</Badge>
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Skeleton Loading</Badge>
            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Empty States</Badge>
            <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">Keyboard Nav</Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
