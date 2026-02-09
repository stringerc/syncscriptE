import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Brain, Zap, Target, Users, BarChart3, Clock, Sparkles, TrendingUp } from 'lucide-react';

export function BentoGrid() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Everything You Need, Beautifully Designed</h2>
          <p className="text-xl text-[#cad5e2]">Powerful features that work together seamlessly</p>
        </div>

        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {/* Large Card - AI Brain */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-3xl p-8 hover:border-cyan-500/50 transition-all hover:scale-[1.02] group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-4 py-2 mb-4">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">AI-Powered</span>
              </div>
              <h3 className="text-3xl font-bold mb-4">Smart Task Scheduling</h3>
              <p className="text-[#cad5e2] text-lg mb-6 leading-relaxed">
                Our AI learns your work patterns and energy levels to schedule tasks at optimal times, maximizing your productivity throughout the day.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Machine Learning</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Pattern Recognition</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Auto-Optimization</span>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </motion.div>

          {/* Energy Optimization */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-3xl p-6 hover:border-emerald-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Energy Tracking</h3>
            <p className="text-[#cad5e2] text-sm leading-relaxed">
              Monitors your energy patterns and suggests optimal work times
            </p>
          </motion.div>

          {/* Focus Sessions */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-orange-500/20 to-teal-500/20 border border-orange-500/30 rounded-3xl p-6 hover:border-orange-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Focus Mode</h3>
            <p className="text-[#cad5e2] text-sm leading-relaxed">
              Distraction-free environment with timed work sessions
            </p>
          </motion.div>

          {/* Analytics Dashboard */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-6 hover:border-purple-500/50 transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Advanced Analytics</h3>
              <p className="text-[#cad5e2] leading-relaxed mb-4">
                Deep insights into your productivity patterns with beautiful visualizations
              </p>
              {/* Mini chart visualization */}
              <div className="flex items-end gap-2 h-20">
                {[40, 65, 45, 80, 60, 90, 75, 85].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500/50 to-pink-500/50 rounded-t-lg transition-all group-hover:scale-y-110"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
          </motion.div>

          {/* Team Collaboration */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-3xl p-6 hover:border-blue-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Team Sync</h3>
            <p className="text-[#cad5e2] text-sm leading-relaxed">
              Collaborate seamlessly with shared calendars and tasks
            </p>
          </motion.div>

          {/* Time Tracking */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-3xl p-6 hover:border-teal-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Time Insights</h3>
            <p className="text-[#cad5e2] text-sm leading-relaxed">
              Automatic time tracking with detailed breakdowns
            </p>
          </motion.div>

          {/* Smart Suggestions */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-3xl p-6 hover:border-yellow-500/50 transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">AI Suggestions</h3>
              <p className="text-[#cad5e2] leading-relaxed mb-4">
                Get intelligent recommendations for task prioritization and schedule optimization
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-[#cad5e2]">Suggested: Move "Deep Work" to 9-11 AM</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  <span className="text-[#cad5e2]">Tip: Schedule break after 2 hours</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
          </motion.div>

          {/* Performance Boost */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-3xl p-6 hover:border-pink-500/50 transition-all hover:scale-[1.02] group"
          >
            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">40% Boost</h3>
            <p className="text-[#cad5e2] text-sm leading-relaxed">
              Average productivity increase reported by users
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
