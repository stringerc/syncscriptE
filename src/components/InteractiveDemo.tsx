import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Zap, Brain, CheckCircle2, TrendingUp } from 'lucide-react';

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'optimize' | 'insights'>('schedule');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold mb-4">See It In Action</h2>
        <p className="text-xl text-[#cad5e2]">Experience the power of AI-driven productivity</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'schedule'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Calendar className="w-5 h-5 inline-block mr-2" />
          Smart Scheduling
        </button>
        <button
          onClick={() => setActiveTab('optimize')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'optimize'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Zap className="w-5 h-5 inline-block mr-2" />
          Energy Optimization
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'insights'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Brain className="w-5 h-5 inline-block mr-2" />
          AI Insights
        </button>
      </div>

      {/* Demo Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Input */}
              <div>
                <h3 className="text-2xl font-bold mb-4">Your Tasks</h3>
                <div className="space-y-3">
                  {[
                    { task: 'Write project proposal', time: '2h', priority: 'high' },
                    { task: 'Team standup meeting', time: '30m', priority: 'medium' },
                    { task: 'Code review', time: '1h', priority: 'high' },
                    { task: 'Lunch break', time: '1h', priority: 'low' },
                    { task: 'Client presentation', time: '1.5h', priority: 'high' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.priority === 'high' ? 'bg-orange-400' :
                          item.priority === 'medium' ? 'bg-teal-400' : 'bg-gray-400'
                        }`} />
                        <span>{item.task}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#cad5e2]">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: AI Output */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-cyan-400" />
                  AI-Optimized Schedule
                </h3>
                <div className="space-y-3">
                  {[
                    { time: '9:00 AM', task: 'Write project proposal', energy: 'Peak Energy', color: 'emerald' },
                    { time: '11:00 AM', task: 'Code review', energy: 'High Energy', color: 'teal' },
                    { time: '12:00 PM', task: 'Lunch break', energy: 'Natural Break', color: 'gray' },
                    { time: '1:00 PM', task: 'Team standup meeting', energy: 'Recovery', color: 'blue' },
                    { time: '2:00 PM', task: 'Client presentation', energy: 'Peak Energy', color: 'emerald' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                      className={`bg-gradient-to-r from-${item.color}-500/20 to-transparent border border-${item.color}-500/30 rounded-lg p-4`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{item.time}</span>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${item.color}-500/20 text-${item.color}-400`}>
                          {item.energy}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 text-${item.color}-400`} />
                        <span className="text-sm">{item.task}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI scheduled high-priority tasks during your peak energy hours (9-11 AM, 2-4 PM)
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'optimize' && (
          <motion.div
            key="optimize"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">Your Energy Pattern</h3>
            
            {/* Energy Graph */}
            <div className="mb-8">
              <div className="h-64 flex items-end gap-2">
                {[
                  { hour: '6 AM', energy: 30 },
                  { hour: '8 AM', energy: 60 },
                  { hour: '10 AM', energy: 95 },
                  { hour: '12 PM', energy: 70 },
                  { hour: '2 PM', energy: 85 },
                  { hour: '4 PM', energy: 75 },
                  { hour: '6 PM', energy: 50 },
                  { hour: '8 PM', energy: 35 },
                ].map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${point.energy}%` }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className="flex-1 relative group"
                  >
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        point.energy > 80
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : point.energy > 60
                          ? 'bg-gradient-to-t from-teal-500 to-cyan-400'
                          : 'bg-gradient-to-t from-orange-500/50 to-yellow-400/50'
                      }`}
                      style={{ height: '100%' }}
                    />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-[#cad5e2] whitespace-nowrap">
                      {point.hour}
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                      {point.energy}% Energy
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-12">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="text-emerald-400 font-bold text-2xl mb-1">9-11 AM</div>
                <p className="text-sm text-[#cad5e2]">Peak Performance Window</p>
                <p className="text-xs text-emerald-400 mt-2">Best for: Deep work, creative tasks</p>
              </div>
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                <div className="text-teal-400 font-bold text-2xl mb-1">2-4 PM</div>
                <p className="text-sm text-[#cad5e2]">Secondary Peak</p>
                <p className="text-xs text-teal-400 mt-2">Best for: Meetings, collaboration</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="text-orange-400 font-bold text-2xl mb-1">6-8 PM</div>
                <p className="text-sm text-[#cad5e2]">Low Energy Period</p>
                <p className="text-xs text-orange-400 mt-2">Best for: Light tasks, planning</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">AI-Powered Insights</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Productivity Score */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">Productivity Score</h4>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  87/100
                </div>
                <p className="text-sm text-[#cad5e2] mb-4">+12% from last week</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '87%' }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* Focus Time */}
              <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">Deep Focus Time</h4>
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-5xl font-bold mb-2 text-cyan-400">
                  4.2h
                </div>
                <p className="text-sm text-[#cad5e2] mb-4">Daily average this week</p>
                <div className="flex gap-1">
                  {[3.5, 4.0, 4.8, 4.2, 3.9, 4.5, 4.1].map((hours, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-cyan-500/30 rounded-t"
                      style={{ height: `${(hours / 5) * 60}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Task Completion */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6">
                <h4 className="font-bold mb-4">Task Completion Rate</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-white/10"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.92) }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-emerald-400"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                      92%
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">46/50</p>
                    <p className="text-sm text-[#cad5e2]">Tasks completed</p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
                <h4 className="font-bold mb-4">Smart Suggestions</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5" />
                    <p className="text-[#cad5e2]">Schedule "Deep Work" sessions during 9-11 AM when you're most productive</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5" />
                    <p className="text-[#cad5e2]">Take a 15-minute break to maintain energy levels</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5" />
                    <p className="text-[#cad5e2]">Move low-priority tasks to Friday afternoon</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
