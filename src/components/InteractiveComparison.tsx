import { useState } from 'react';
import { Check, X, Zap, Brain, Target, Users, BarChart3, Clock, Sparkles, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export function InteractiveComparison() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'productivity' | 'collaboration'>('all');

  const features = [
    { name: 'AI-Powered Scheduling', category: 'ai', icon: Brain },
    { name: 'Smart Task Prioritization', category: 'ai', icon: Target },
    { name: 'Predictive Analytics', category: 'ai', icon: BarChart3 },
    { name: 'Energy Optimization', category: 'productivity', icon: Zap },
    { name: 'Automated Workflows', category: 'productivity', icon: Sparkles },
    { name: 'Natural Language Input', category: 'productivity', icon: Brain },
    { name: 'Team Collaboration', category: 'collaboration', icon: Users },
    { name: 'Real-time Sync', category: 'collaboration', icon: Clock },
    { name: 'Advanced Security', category: 'collaboration', icon: Shield },
    { name: 'Multi-Platform Sync', category: 'productivity', icon: Clock },
    { name: 'Habit Tracking', category: 'productivity', icon: Target },
    { name: 'Performance Insights', category: 'ai', icon: BarChart3 },
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold mb-4">See The Difference</h2>
        <p className="text-xl text-[#cad5e2]">Interactive comparison - Filter by category</p>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          All Features
        </button>
        <button
          onClick={() => setSelectedCategory('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'ai'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Brain className="w-4 h-4 inline-block mr-1" />
          AI Features
        </button>
        <button
          onClick={() => setSelectedCategory('productivity')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'productivity'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Zap className="w-4 h-4 inline-block mr-1" />
          Productivity
        </button>
        <button
          onClick={() => setSelectedCategory('collaboration')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'collaboration'
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4 inline-block mr-1" />
          Collaboration
        </button>
      </div>

      {/* Comparison Table */}
      <motion.div 
        layout
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-6 text-lg font-semibold min-w-[250px]">
                  Feature ({filteredFeatures.length})
                </th>
                <th className="text-center p-6 min-w-[200px]">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-lg font-semibold text-cyan-400">SyncScript</span>
                    <span className="text-xs text-[#cad5e2] mt-1">Next-Gen AI Platform</span>
                  </div>
                </th>
                <th className="text-center p-6 min-w-[200px]">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-lg font-semibold text-[#cad5e2]">Traditional Tools</span>
                    <span className="text-xs text-[#cad5e2] mt-1">Legacy Platforms</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.tr
                    key={feature.name}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          feature.category === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                          feature.category === 'productivity' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[#cad5e2] group-hover:text-white transition-colors">
                          {feature.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                        <Check className="w-6 h-6 text-cyan-400" />
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-500/10 group-hover:bg-gray-500/20 transition-colors">
                        <X className="w-6 h-6 text-gray-600" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Stats Footer */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-6 text-center"
        >
          <div className="text-4xl font-bold text-cyan-400 mb-2">12/12</div>
          <p className="text-sm text-[#cad5e2]">Features in SyncScript</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl p-6 text-center"
        >
          <div className="text-4xl font-bold text-gray-500 mb-2">0/12</div>
          <p className="text-sm text-[#cad5e2]">Features in Traditional Tools</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6 text-center"
        >
          <div className="text-4xl font-bold text-emerald-400 mb-2">100%</div>
          <p className="text-sm text-[#cad5e2]">Better Performance</p>
        </motion.div>
      </div>
    </div>
  );
}
