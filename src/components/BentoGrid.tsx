import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Brain, Zap, Target, Users, BarChart3, Clock, Sparkles, TrendingUp } from 'lucide-react';

export function BentoGrid() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">Everything You Need, Beautifully Designed</h2>
          <p className="text-base sm:text-lg text-[#cad5e2]">Powerful features that work together seamlessly</p>
        </div>

        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {/* Row 1: Smart Task (2) | Energy | Focus */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-2xl p-5 hover:border-cyan-500/50 transition-all hover:scale-[1.01] group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-3 py-1 mb-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">AI-Powered</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Smart Task Scheduling</h3>
              <p className="text-[#cad5e2] text-sm leading-relaxed mb-3">
                AI learns your energy levels to schedule tasks at optimal times, maximizing productivity.
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs">Machine Learning</span>
                <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs">Pattern Recognition</span>
                <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs">Auto-Optimize</span>
              </div>
            </div>
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 hover:border-emerald-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Energy Tracking</h3>
            <p className="text-[#cad5e2] text-xs leading-relaxed">
              Monitors energy patterns and suggests optimal work times
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-orange-500/20 to-teal-500/20 border border-orange-500/30 rounded-2xl p-4 hover:border-orange-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Focus Mode</h3>
            <p className="text-[#cad5e2] text-xs leading-relaxed">
              Distraction-free environment with timed work sessions
            </p>
          </motion.div>

          {/* Row 2: 40% Boost (2) | Analytics (2) */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-1 lg:col-span-2 bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-indigo-500/20 border border-pink-500/30 rounded-2xl p-4 hover:border-pink-500/50 transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 shrink-0 bg-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-0.5">
                  <span className="text-pink-400">40%</span> Boost
                </h3>
                <p className="text-[#cad5e2] text-xs leading-relaxed">
                  Average productivity increase after one week of AI-optimized scheduling
                </p>
              </div>
            </div>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 hover:border-purple-500/50 transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold mb-1">Advanced Analytics</h3>
              <p className="text-[#cad5e2] text-xs leading-relaxed mb-3">
                Deep insights into productivity patterns with beautiful visualizations
              </p>
              <div className="flex items-end gap-1.5 h-12">
                {[40, 65, 45, 80, 60, 90, 75, 85].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500/50 to-pink-500/50 rounded-t-sm transition-all group-hover:scale-y-110"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
          </motion.div>

          {/* Row 3: Team Sync | Time Insights | AI Suggestions (2) */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4 hover:border-blue-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Team Sync</h3>
            <p className="text-[#cad5e2] text-xs leading-relaxed">
              Collaborate seamlessly with shared calendars and tasks
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-2xl p-4 hover:border-teal-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Time Insights</h3>
            <p className="text-[#cad5e2] text-xs leading-relaxed">
              Automatic time tracking with detailed breakdowns
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 hover:border-yellow-500/50 transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1">AI Suggestions</h3>
              <p className="text-[#cad5e2] text-xs leading-relaxed mb-2">
                Intelligent recommendations for task prioritization and schedule optimization
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  <span className="text-[#cad5e2]">Move &quot;Deep Work&quot; to 9-11 AM</span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  <span className="text-[#cad5e2]">Schedule break after 2 hours</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
