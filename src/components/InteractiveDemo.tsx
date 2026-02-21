import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Zap, Brain, CheckCircle2, TrendingUp } from 'lucide-react';

type TabKey = 'schedule' | 'optimize' | 'insights';

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<TabKey>('schedule');

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const preventFocusScroll = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const panelStyle = (key: TabKey): React.CSSProperties => {
    const isActive = activeTab === key;
    return {
      gridArea: 'stack',
      opacity: isActive ? 1 : 0,
      visibility: isActive ? 'visible' : 'hidden',
      transition: isActive
        ? 'opacity 0.35s ease-out, visibility 0s'
        : 'opacity 0s, visibility 0s',
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 10 : 0,
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold mb-4">See It In Action</h2>
        <p className="text-xl text-[#cad5e2]">Experience the power of AI-driven productivity</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onMouseDown={preventFocusScroll}
          onClick={() => handleTabChange('schedule')}
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
          onMouseDown={preventFocusScroll}
          onClick={() => handleTabChange('optimize')}
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
          onMouseDown={preventFocusScroll}
          onClick={() => handleTabChange('insights')}
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

      {/* Grid-stack: all panels rendered, only active visible. Zero height change. */}
      <div className="grid" style={{ gridTemplateAreas: "'stack'" }}>

        {/* ─── Schedule Panel ─── */}
        <div style={panelStyle('schedule')}>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
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
                      animate={{
                        opacity: activeTab === 'schedule' ? 1 : 0,
                        x: activeTab === 'schedule' ? 0 : -20,
                      }}
                      transition={{ delay: activeTab === 'schedule' ? i * 0.1 : 0, duration: 0.4 }}
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
                      animate={{
                        opacity: activeTab === 'schedule' ? 1 : 0,
                        x: activeTab === 'schedule' ? 0 : 20,
                      }}
                      transition={{ delay: activeTab === 'schedule' ? i * 0.1 + 0.2 : 0, duration: 0.4 }}
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
          </div>
        </div>

        {/* ─── Optimize Panel ─── */}
        <div style={panelStyle('optimize')}>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">Your Energy Pattern</h3>

            <div className="mb-8">
              <div className="flex items-end gap-2 h-64">
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
                  <div key={i} className="flex-1 flex flex-col items-center h-full">
                    <div className="w-full flex-1 relative">
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg ${
                          point.energy > 80
                            ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                            : point.energy > 60
                            ? 'bg-gradient-to-t from-teal-500 to-cyan-400'
                            : 'bg-gradient-to-t from-orange-500/60 to-yellow-400/60'
                        }`}
                        style={{
                          height: `${point.energy}%`,
                          transform: activeTab === 'optimize' ? 'scaleY(1)' : 'scaleY(0)',
                          transformOrigin: 'bottom',
                          transition: `transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${activeTab === 'optimize' ? i * 0.08 : 0}s`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#cad5e2] mt-2 whitespace-nowrap">{point.hour}</span>
                  </div>
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
          </div>
        </div>

        {/* ─── Insights Panel ─── */}
        <div style={panelStyle('insights')}>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
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
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{
                      width: activeTab === 'insights' ? '87%' : '0%',
                      transition: `width 1s ease-out ${activeTab === 'insights' ? '0.4s' : '0s'}`,
                    }}
                  />
                </div>
              </div>

              {/* Deep Focus Time — CSS transform bars for reliable rendering */}
              <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">Deep Focus Time</h4>
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-5xl font-bold mb-2 text-cyan-400">
                  4.2h
                </div>
                <p className="text-sm text-[#cad5e2] mb-4">Daily average this week</p>
                <div className="flex items-end gap-1.5 h-16">
                  {[
                    { hours: 3.5, day: 'M' },
                    { hours: 4.0, day: 'T' },
                    { hours: 4.8, day: 'W' },
                    { hours: 4.2, day: 'T' },
                    { hours: 3.9, day: 'F' },
                    { hours: 4.5, day: 'S' },
                    { hours: 4.1, day: 'S' },
                  ].map((d, i) => {
                    const barHeight = (d.hours / 5) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full">
                        <div className="w-full flex-1 relative">
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t"
                            style={{
                              height: `${barHeight}%`,
                              transform: activeTab === 'insights' ? 'scaleY(1)' : 'scaleY(0)',
                              transformOrigin: 'bottom',
                              transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${activeTab === 'insights' ? 0.3 + i * 0.08 : 0}s`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[#cad5e2] mt-1">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Completion */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6">
                <h4 className="font-bold mb-4">Task Completion Rate</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48" cy="48" r="40"
                        stroke="currentColor" strokeWidth="8" fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="48" cy="48" r="40"
                        stroke="currentColor" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        className="text-emerald-400"
                        style={{
                          strokeDashoffset: activeTab === 'insights'
                            ? 2 * Math.PI * 40 * (1 - 0.92)
                            : 2 * Math.PI * 40,
                          transition: `stroke-dashoffset 1s ease-out ${activeTab === 'insights' ? '0.4s' : '0s'}`,
                        }}
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
                    <p className="text-[#cad5e2]">Schedule &ldquo;Deep Work&rdquo; sessions during 9-11 AM when you&apos;re most productive</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
