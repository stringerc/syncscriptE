import { useState, useCallback } from 'react';
import { Check, X, Zap, Brain, Target, Users, BarChart3, Clock, Sparkles, Shield } from 'lucide-react';

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

  const handleCategoryChange = useCallback((cat: typeof selectedCategory) => {
    setSelectedCategory(cat);
  }, []);

  const preventFocusScroll = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-5">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">See The Difference</h2>
        <p className="text-sm sm:text-base text-[#cad5e2]">Interactive comparison — Filter by category</p>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-5 flex-wrap">
        {([
          { key: 'all' as const, label: 'All Features', icon: null, active: 'from-cyan-500 to-teal-500' },
          { key: 'ai' as const, label: 'AI', icon: Brain, active: 'from-purple-500 to-pink-500' },
          { key: 'productivity' as const, label: 'Productivity', icon: Zap, active: 'from-emerald-500 to-teal-500' },
          { key: 'collaboration' as const, label: 'Collaboration', icon: Users, active: 'from-orange-500 to-yellow-500' },
        ]).map(({ key, label, icon: Icon, active }) => (
          <button
            key={key}
            onMouseDown={preventFocusScroll}
            onClick={() => handleCategoryChange(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === key
                ? `bg-gradient-to-r ${active} text-white shadow-lg`
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 inline-block mr-1" />}
            {label}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 sm:p-4 text-sm sm:text-base font-semibold min-w-[200px]">
                  Feature ({filteredFeatures.length})
                </th>
                <th className="text-center p-3 sm:p-4 min-w-[120px]">
                  <span className="text-sm sm:text-base font-semibold text-cyan-400">SyncScript</span>
                </th>
                <th className="text-center p-3 sm:p-4 min-w-[120px]">
                  <span className="text-sm sm:text-base font-semibold text-[#cad5e2]">Others</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => {
                const Icon = feature.icon;
                const isMatch = selectedCategory === 'all' || feature.category === selectedCategory;
                return (
                  <tr
                    key={feature.name}
                    className={`border-b border-white/5 group ${
                      isMatch ? 'opacity-100 hover:bg-white/5' : 'opacity-[0.08]'
                    }`}
                    style={{
                      transition: 'opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease',
                      filter: isMatch ? 'blur(0px)' : 'blur(1px)',
                      transform: isMatch ? 'scale(1)' : 'scale(0.98)',
                    }}
                  >
                    <td className="p-2.5 sm:p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          feature.category === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                          feature.category === 'productivity' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[#cad5e2] group-hover:text-white transition-colors text-xs sm:text-sm">
                          {feature.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                        <Check className="w-4 h-4 text-cyan-400" />
                      </div>
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-500/10 group-hover:bg-gray-500/20 transition-colors">
                        <X className="w-4 h-4 text-gray-600" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-cyan-400 mb-0.5">12/12</div>
          <p className="text-[10px] sm:text-xs text-[#cad5e2]">SyncScript Features</p>
        </div>
        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl p-2.5 sm:p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-gray-500 mb-0.5">0/12</div>
          <p className="text-[10px] sm:text-xs text-[#cad5e2]">Traditional Tools</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-2.5 sm:p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 mb-0.5">100%</div>
          <p className="text-[10px] sm:text-xs text-[#cad5e2]">Better Performance</p>
        </div>
      </div>
    </div>
  );
}
