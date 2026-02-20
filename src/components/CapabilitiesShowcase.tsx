import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Calendar, 
  Target, 
  Zap, 
  Users, 
  Shield, 
  Sparkles,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { FeatureCard } from './SyncScriptAnimations';

const CAPABILITIES = [
  {
    id: 'ai-assistant',
    icon: Brain,
    title: 'AI-Powered Assistant',
    description: 'Your personal AI co-pilot that learns your workflow and automates repetitive tasks.',
    color: 'purple' as const,
    demo: {
      type: 'chat',
      messages: [
        { sender: 'user', text: 'I need to plan my week' },
        { sender: 'ai', text: 'I\'ve analyzed your calendar and energy patterns. Here\'s an optimized schedule...' },
        { sender: 'ai', text: '✓ High-energy tasks scheduled for Tuesday morning' },
        { sender: 'ai', text: '✓ Meetings grouped to protect focus time' },
        { sender: 'ai', text: '✓ Buffer time added for unexpected issues' }
      ]
    }
  },
  {
    id: 'smart-scheduling',
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Automatically schedules tasks based on your energy levels, priorities, and deadlines.',
    color: 'indigo' as const,
    demo: {
      type: 'calendar',
      events: [
        { time: '9:00 AM', title: 'Deep Work Block', energy: 'high' },
        { time: '11:00 AM', title: 'Team Sync', energy: 'medium' },
        { time: '2:00 PM', title: 'Creative Work', energy: 'high' },
        { time: '4:00 PM', title: 'Email & Admin', energy: 'low' }
      ]
    }
  },
  {
    id: 'goal-tracking',
    icon: Target,
    title: 'Goal Tracking',
    description: 'Break down big goals into actionable steps and track your progress automatically.',
    color: 'green' as const,
    demo: {
      type: 'progress',
      goal: 'Launch Product',
      progress: 68,
      milestones: [
        { name: 'Design', complete: true },
        { name: 'Development', complete: true },
        { name: 'Testing', complete: false },
        { name: 'Launch', complete: false }
      ]
    }
  },
  {
    id: 'energy-management',
    icon: Zap,
    title: 'Energy Management',
    description: 'Tracks your energy patterns and suggests the best times for different types of work.',
    color: 'pink' as const,
    demo: {
      type: 'energy',
      currentLevel: 85,
      optimalTimes: ['9:00 AM - 12:00 PM', '2:00 PM - 4:00 PM']
    }
  },
  {
    id: 'team-sync',
    icon: Users,
    title: 'Team Synchronization',
    description: 'Keep your team aligned with shared goals, automated updates, and smart meeting scheduling.',
    color: 'blue' as const,
    demo: {
      type: 'team',
      members: [
        { name: 'You', status: 'Deep Work', color: 'purple' },
        { name: 'Sarah', status: 'In Meeting', color: 'yellow' },
        { name: 'Mike', status: 'Available', color: 'green' }
      ]
    }
  },
  {
    id: 'insights',
    icon: BarChart3,
    title: 'Intelligent Insights',
    description: 'Get actionable insights about your productivity patterns and recommendations for improvement.',
    color: 'purple' as const,
    demo: {
      type: 'insights',
      stats: [
        { label: 'Focus Time', value: '6.5 hrs', change: '+12%' },
        { label: 'Tasks Completed', value: '24', change: '+8%' },
        { label: 'Energy Score', value: '85%', change: '+5%' }
      ]
    }
  }
];

export function CapabilitiesShowcase() {
  const [selectedCapability, setSelectedCapability] = useState(CAPABILITIES[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (capability: typeof CAPABILITIES[0]) => {
    if (capability.id === selectedCapability.id) return;
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedCapability(capability);
      setIsAnimating(false);
    }, 200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="text-center mb-12">
        <motion.h2
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            What SyncScript Can Do For You
          </span>
        </motion.h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Experience the full power of AI-driven productivity. Click on any capability to see it in action.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Capability Cards */}
        <div className="grid grid-cols-2 gap-4">
          {CAPABILITIES.map((capability, index) => (
            <motion.div
              key={capability.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(capability)}
              className={`
                cursor-pointer transition-all duration-300
                ${selectedCapability.id === capability.id ? 'scale-105' : 'hover:scale-102'}
              `}
            >
              <FeatureCard
                icon={capability.icon}
                title={capability.title}
                description={capability.description}
                color={capability.color}
              />
            </motion.div>
          ))}
        </div>

        {/* Live Demo Area */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative bg-surface-1/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full min-h-[400px]">
            <AnimatePresence mode="wait">
              {!isAnimating && (
                <motion.div
                  key={selectedCapability.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Demo Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      bg-gradient-to-br from-${selectedCapability.color}-500/20 to-${selectedCapability.color}-600/20
                    `}>
                      <selectedCapability.icon className={`w-5 h-5 text-${selectedCapability.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedCapability.title}</h3>
                      <p className="text-xs text-gray-500">Live Demo</p>
                    </div>
                  </div>

                  {/* Demo Content */}
                  <div className="bg-black/30 rounded-xl p-4 overflow-hidden">
                    {selectedCapability.demo.type === 'chat' && (
                      <div className="space-y-3">
                        {selectedCapability.demo.messages.map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.3 }}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`
                              max-w-[80%] px-4 py-2 rounded-xl text-sm
                              ${msg.sender === 'user' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-gray-700 text-gray-200'
                              }
                            `}>
                              {msg.text}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {selectedCapability.demo.type === 'calendar' && (
                      <div className="space-y-2">
                        {selectedCapability.demo.events.map((event, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                          >
                            <span className="text-xs text-gray-500 w-16">{event.time}</span>
                            <div className="flex-1">
                              <p className="text-sm text-white">{event.title}</p>
                            </div>
                            <span className={`
                              text-[10px] px-2 py-0.5 rounded-full
                              ${event.energy === 'high' ? 'bg-green-500/20 text-green-400' :
                                event.energy === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'}
                            `}>
                              {event.energy} energy
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {selectedCapability.demo.type === 'progress' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-white">{selectedCapability.demo.goal}</h4>
                          <span className="text-2xl font-bold text-indigo-400">
                            {selectedCapability.demo.progress}%
                          </span>
                        </div>
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-6">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedCapability.demo.progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </div>
                        <div className="space-y-2">
                          {selectedCapability.demo.milestones.map((milestone, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                              className="flex items-center gap-3"
                            >
                              {milestone.complete ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                              )}
                              <span className={milestone.complete ? 'text-white' : 'text-gray-500'}>
                                {milestone.name}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCapability.demo.type === 'energy' && (
                      <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                          <svg className="w-full h-full -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="12"
                            />
                            <motion.circle
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke="url(#energy-gradient)"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              initial={{ strokeDashoffset: `${2 * Math.PI * 56}` }}
                              animate={{ 
                                strokeDashoffset: `${2 * Math.PI * 56 * (1 - selectedCapability.demo.currentLevel / 100)}` 
                              }}
                              transition={{ duration: 1, delay: 0.3 }}
                            />
                            <defs>
                              <linearGradient id="energy-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#fbbf24" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {selectedCapability.demo.currentLevel}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Current Energy Level</p>
                        <div className="text-left">
                          <p className="text-xs text-gray-500 mb-2">Optimal work times:</p>
                          {selectedCapability.demo.optimalTimes.map((time, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-white mb-1">
                              <Clock className="w-4 h-4 text-pink-400" />
                              {time}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCapability.demo.type === 'team' && (
                      <div className="space-y-3">
                        {selectedCapability.demo.members.map((member, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                          >
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center
                              bg-${member.color}-500/20
                            `}>
                              <span className={`text-${member.color}-400 font-medium`}>
                                {member.name[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.status}</p>
                            </div>
                            <div className={`
                              w-2 h-2 rounded-full
                              bg-${member.color}-400
                            `} />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {selectedCapability.demo.type === 'insights' && (
                      <div className="grid grid-cols-1 gap-3">
                        {selectedCapability.demo.stats.map((stat, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <span className="text-sm text-gray-400">{stat.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-white">{stat.value}</span>
                              <span className="text-xs text-green-400">{stat.change}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <motion.button
                    className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try {selectedCapability.title}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
