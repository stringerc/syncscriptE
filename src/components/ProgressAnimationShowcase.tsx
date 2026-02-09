import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, Target, TrendingUp, Award, CheckCircle2, Clock, 
  Brain, Users, Calendar, Flame, Star, Trophy, Activity
} from 'lucide-react';
import { AnimatedAvatar } from './AnimatedAvatar';
import { EnergyProgressBar } from './EnergyProgressBar';
import { AnimatedMetricCard } from './AnimatedMetricCard';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

/**
 * Progress Animation Showcase
 * 
 * Demonstrates how the profile's progress bar and animations
 * are used consistently throughout the SyncScript application.
 */

export function ProgressAnimationShowcase() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-[#0f172a] min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-4xl mb-2">Progress & Animation System</h1>
            <p className="text-gray-400">
              Consistent progress indicators and animations throughout SyncScript
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="border-teal-600 text-teal-400">
            Refresh Animations
          </Button>
        </div>

        <Tabs defaultValue="avatars" className="w-full">
          <TabsList className="bg-[#1e2128] border border-gray-700">
            <TabsTrigger value="avatars">Animated Avatars</TabsTrigger>
            <TabsTrigger value="progress">Progress Bars</TabsTrigger>
            <TabsTrigger value="metrics">Metric Cards</TabsTrigger>
            <TabsTrigger value="examples">Real Examples</TabsTrigger>
          </TabsList>

          {/* Tab 1: Animated Avatars */}
          <TabsContent value="avatars" className="space-y-6" key={`avatars-${refreshKey}`}>
            <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
              <h2 className="text-white text-xl mb-6">Avatar Progress Rings</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Different progress levels */}
                <div className="text-center space-y-3">
                  <AnimatedAvatar
                    src="https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=400"
                    fallback="JS"
                    progress={95}
                    animationType="glow"
                    size={80}
                    className="mx-auto"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">Peak Energy</p>
                    <p className="text-teal-400 text-xs">95%</p>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <AnimatedAvatar
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                    fallback="AJ"
                    progress={72}
                    animationType="glow"
                    size={80}
                    className="mx-auto"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">High Energy</p>
                    <p className="text-yellow-400 text-xs">72%</p>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <AnimatedAvatar
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
                    fallback="ST"
                    progress={48}
                    animationType="pulse"
                    size={80}
                    className="mx-auto"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">Medium Energy</p>
                    <p className="text-orange-400 text-xs">48%</p>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <AnimatedAvatar
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
                    fallback="MK"
                    progress={22}
                    animationType="pulse"
                    size={80}
                    className="mx-auto"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">Low Energy</p>
                    <p className="text-red-400 text-xs">22%</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-teal-900/20 border border-teal-700 rounded-lg">
                <p className="text-sm text-teal-400">
                  💡 <strong>Use in:</strong> Headers, profiles, team pages, comments, activity feeds
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Progress Bars */}
          <TabsContent value="progress" className="space-y-6" key={`progress-${refreshKey}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default variant */}
              <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6 space-y-6">
                <h3 className="text-white font-medium mb-4">Default Progress Bars</h3>
                
                <EnergyProgressBar 
                  value={85}
                  label="Energy Level"
                  showIcon
                  showTrend
                  trend="up"
                  trendValue="+5%"
                  size="md"
                />

                <EnergyProgressBar 
                  value={62}
                  label="Task Completion"
                  showIcon
                  showTrend
                  trend="down"
                  trendValue="-3%"
                  size="md"
                />

                <EnergyProgressBar 
                  value={40}
                  label="Focus Time"
                  showIcon
                  size="md"
                />

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    💡 Use for: Main metrics, dashboard cards, detailed views
                  </p>
                </div>
              </div>

              {/* Minimal variant */}
              <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6 space-y-6">
                <h3 className="text-white font-medium mb-4">Minimal Progress Bars</h3>
                
                <EnergyProgressBar 
                  value={92}
                  label="Goals Progress"
                  variant="minimal"
                  size="sm"
                />

                <EnergyProgressBar 
                  value={68}
                  label="Weekly Target"
                  variant="minimal"
                  size="sm"
                />

                <EnergyProgressBar 
                  value={45}
                  label="Habit Streak"
                  variant="minimal"
                  size="sm"
                />

                <EnergyProgressBar 
                  value={28}
                  label="Recovery Mode"
                  variant="minimal"
                  size="sm"
                />

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    💡 Use for: Compact spaces, lists, sidebars, quick stats
                  </p>
                </div>
              </div>

              {/* Ring variant */}
              <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
                <h3 className="text-white font-medium mb-4">Ring Progress Indicators</h3>
                
                <div className="flex justify-around items-center">
                  <EnergyProgressBar 
                    value={88}
                    label="Today"
                    variant="ring"
                  />
                  
                  <EnergyProgressBar 
                    value={65}
                    label="Week"
                    variant="ring"
                  />
                  
                  <EnergyProgressBar 
                    value={42}
                    label="Month"
                    variant="ring"
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    💡 Use for: Featured metrics, avatar overlays, circular displays
                  </p>
                </div>
              </div>

              {/* Size variations */}
              <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6 space-y-6">
                <h3 className="text-white font-medium mb-4">Size Variations</h3>
                
                <div>
                  <p className="text-xs text-gray-400 mb-2">Small</p>
                  <EnergyProgressBar 
                    value={75}
                    label="Small Size"
                    variant="minimal"
                    size="sm"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Medium</p>
                  <EnergyProgressBar 
                    value={75}
                    label="Medium Size"
                    variant="minimal"
                    size="md"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Large</p>
                  <EnergyProgressBar 
                    value={75}
                    label="Large Size"
                    variant="minimal"
                    size="lg"
                  />
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    💡 Adjust size based on context and available space
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Metric Cards */}
          <TabsContent value="metrics" className="space-y-6" key={`metrics-${refreshKey}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatedMetricCard 
                title="Energy Level"
                value="85%"
                progress={85}
                icon={Zap}
                trend="up"
                trendValue="+5%"
                color="teal"
              />

              <AnimatedMetricCard 
                title="Goals Completed"
                value="12/15"
                progress={80}
                icon={Target}
                trend="up"
                trendValue="+2"
                color="blue"
              />

              <AnimatedMetricCard 
                title="Focus Score"
                value="92"
                progress={92}
                icon={Brain}
                trend="up"
                trendValue="+8"
                color="purple"
              />

              <AnimatedMetricCard 
                title="Daily Streak"
                value="12 days"
                progress={60}
                icon={Flame}
                color="orange"
              />

              <AnimatedMetricCard 
                title="Team Activity"
                value="Active"
                progress={75}
                icon={Users}
                trend="up"
                trendValue="+12%"
                color="green"
              />

              <AnimatedMetricCard 
                title="Tasks Today"
                value="8/10"
                progress={80}
                icon={CheckCircle2}
                trend="neutral"
                color="teal"
              />
            </div>

            <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
              <h3 className="text-white font-medium mb-4">Compact Variant</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedMetricCard 
                  title="Energy"
                  value="85%"
                  progress={85}
                  icon={Zap}
                  variant="compact"
                  color="teal"
                />
                
                <AnimatedMetricCard 
                  title="Focus"
                  value="92"
                  progress={92}
                  icon={Brain}
                  variant="compact"
                  color="purple"
                />

                <AnimatedMetricCard 
                  title="Streak"
                  value="12"
                  progress={60}
                  icon={Flame}
                  variant="compact"
                  color="orange"
                />

                <AnimatedMetricCard 
                  title="Score"
                  value="A+"
                  progress={95}
                  icon={Trophy}
                  variant="compact"
                  color="green"
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Real Examples */}
          <TabsContent value="examples" className="space-y-6" key={`examples-${refreshKey}`}>
            {/* Dashboard Overview */}
            <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedMetricCard 
                  title="Today's Energy"
                  value="85%"
                  progress={85}
                  icon={Zap}
                  variant="energy"
                  trend="up"
                  trendValue="+5%"
                  description="Above average"
                  color="teal"
                />

                <AnimatedMetricCard 
                  title="Active Goals"
                  value="12"
                  progress={75}
                  icon={Target}
                  variant="energy"
                  trend="up"
                  trendValue="+2"
                  description="3 near completion"
                  color="blue"
                />

                <AnimatedMetricCard 
                  title="Focus Sessions"
                  value="4"
                  progress={80}
                  icon={Clock}
                  variant="energy"
                  trend="neutral"
                  description="2h 30min today"
                  color="purple"
                />

                <AnimatedMetricCard 
                  title="Achievements"
                  value="47"
                  progress={94}
                  icon={Award}
                  variant="energy"
                  trend="up"
                  trendValue="+3"
                  description="Top 5% this week"
                  color="orange"
                />
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">Team Energy Levels</h2>
              <div className="space-y-4">
                {[
                  { name: 'Jordan Smith', role: 'Team Lead', energy: 85, avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=400' },
                  { name: 'Alex Johnson', role: 'Developer', energy: 72, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
                  { name: 'Sam Taylor', role: 'Designer', energy: 95, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
                  { name: 'Morgan Kim', role: 'Product Manager', energy: 58, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
                ].map((member, index) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-[#2a2d35] rounded-lg"
                  >
                    <AnimatedAvatar
                      src={member.avatar}
                      fallback={member.name.split(' ').map(n => n[0]).join('')}
                      progress={member.energy}
                      animationType="glow"
                      size={56}
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-400">{member.role}</p>
                    </div>
                    <div className="w-48">
                      <EnergyProgressBar 
                        value={member.energy}
                        variant="minimal"
                        size="sm"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
              <h2 className="text-white text-xl mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { user: 'Jordan Smith', action: 'Completed deep work session', time: '2m ago', energy: 85 },
                  { user: 'Alex Johnson', action: 'Achieved daily goal streak', time: '15m ago', energy: 72 },
                  { user: 'Sam Taylor', action: 'Started focus session', time: '1h ago', energy: 95 },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="flex items-center gap-3 p-3 bg-[#2a2d35] rounded-lg"
                  >
                    <AnimatedAvatar
                      src={`https://images.unsplash.com/photo-${index === 0 ? '1576558656222-ba66febe3dec' : index === 1 ? '1507003211169-0a1dd7228f2d' : '1494790108377-be9c29b29330'}?w=400`}
                      fallback={activity.user.split(' ').map(n => n[0]).join('')}
                      progress={activity.energy}
                      animationType="glow"
                      size={40}
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        <span className="text-gray-400">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Activity className="w-4 h-4 text-teal-400" />
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Design System Guide */}
        <div className="bg-gradient-to-r from-teal-900/20 to-blue-900/20 border border-teal-700 rounded-lg p-6">
          <h2 className="text-teal-400 text-xl mb-4">🎨 Design System Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-white font-medium mb-2">Color Meanings</h3>
              <ul className="space-y-1 text-sm">
                <li>• <span className="text-teal-400">Teal</span> - Primary, energy, system health</li>
                <li>• <span className="text-blue-400">Blue</span> - Goals, tasks, productivity</li>
                <li>• <span className="text-purple-400">Purple</span> - Focus, brain activity, AI</li>
                <li>• <span className="text-orange-400">Orange</span> - Streaks, achievements, rewards</li>
                <li>• <span className="text-green-400">Green</span> - Success, growth, collaboration</li>
                <li>• <span className="text-red-400">Red</span> - Alerts, low energy, critical</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Animation Principles</h3>
              <ul className="space-y-1 text-sm">
                <li>• Progress bars animate from 0 to value (1s duration)</li>
                <li>• Hover effects scale cards by 2% (0.2s duration)</li>
                <li>• Glow effects appear on hover for emphasis</li>
                <li>• Stagger animations for lists (0.1-0.15s delay)</li>
                <li>• Use easeOut easing for smooth, natural motion</li>
                <li>• Avatar rings pulse gently for low energy states</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
