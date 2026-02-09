import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Brain, 
  Zap, 
  Calendar, 
  Target, 
  Activity, 
  LineChart, 
  BarChart3, 
  PieChart, 
  Filter, 
  RefreshCw, 
  Download, 
  Clock, 
  AlertTriangle,
  Shield,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSection';
import { CompletionAnalyticsDashboard } from '../analytics/CompletionAnalyticsDashboard';
import { AnalyticsTestPanel } from '../analytics/AnalyticsTestPanel';
import { BehaviorInsightsPanel } from '../analytics/BehaviorInsightsPanel';
import { ComplianceDashboard } from '../analytics/ComplianceDashboard';

// Mock chart components for now - these can be replaced with real implementations
const ProductivityOverTime = ({ data }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const TasksCreatedVsCompleted = ({ data }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const FocusVsDistraction = ({ data }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const EnergyOutputCorrelation = ({ data }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const ActivityHeatmap = ({ data }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const TopProductivityFactors = ({ data }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const ForecastChart = ({ historicalData, forecastData }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const TrendLineChart = ({ data, height, color, showGrid }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const AreaChartComponent = ({ data, keys, colors, height, stacked }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const ScatterPlotChart = ({ data, height, xLabel, yLabel, color }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;
const Histogram = ({ data, height, color }: any) => <div className="h-48 bg-gray-800/30 rounded-lg" />;

export function AnalyticsInsightsPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [showComingSoon, setShowComingSoon] = useState(true);

  // AI Insights for Analytics & Insights - Comprehensive Dashboard
  // Research: 10-15 charts optimal (Chartio analysis of 90,000 dashboards)
  const aiInsightsContent: AIInsightsContent = {
    title: 'Analytics Dashboard',
    mode: 'custom',
    customContent: (
      <div className="space-y-6">
        {/* 1. Productivity Over Time */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Productivity Trend (6 Months)
          </h3>
          <ProductivityOverTime
            data={[
              { month: 'Jan', productivity: 68, tasksCompleted: 45, goalsAchieved: 3 },
              { month: 'Feb', productivity: 72, tasksCompleted: 52, goalsAchieved: 4 },
              { month: 'Mar', productivity: 78, tasksCompleted: 58, goalsAchieved: 5 },
              { month: 'Apr', productivity: 82, tasksCompleted: 64, goalsAchieved: 5 },
              { month: 'May', productivity: 88, tasksCompleted: 71, goalsAchieved: 6 },
              { month: 'Jun', productivity: 94, tasksCompleted: 78, goalsAchieved: 7 },
            ]}
          />
        </div>

        {/* 2. Tasks Created vs Completed */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            Tasks: Created vs Completed
          </h3>
          <TasksCreatedVsCompleted
            data={[
              { week: 'W1', created: 18, completed: 15 },
              { week: 'W2', created: 22, completed: 20 },
              { week: 'W3', created: 19, completed: 21 },
              { week: 'W4', created: 20, completed: 22 },
              { week: 'W5', created: 17, completed: 19 },
              { week: 'W6', created: 21, completed: 23 },
            ]}
          />
        </div>

        {/* 3. Focus vs Distraction Time */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Focus vs Distraction Time
          </h3>
          <FocusVsDistraction
            data={[
              { day: 'Mon', focusTime: 5.2, distractionTime: 2.8 },
              { day: 'Tue', focusTime: 6.1, distractionTime: 1.9 },
              { day: 'Wed', focusTime: 5.5, distractionTime: 2.5 },
              { day: 'Thu', focusTime: 6.3, distractionTime: 1.7 },
              { day: 'Fri', focusTime: 4.8, distractionTime: 3.2 },
            ]}
          />
        </div>

        {/* 4. Energy & Output Correlation */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Energy vs Output Correlation
          </h3>
          <EnergyOutputCorrelation
            data={[
              { day: 'Day 1', energy: 68, tasksCompleted: 12 },
              { day: 'Day 2', energy: 82, tasksCompleted: 18 },
              { day: 'Day 3', energy: 75, tasksCompleted: 15 },
              { day: 'Day 4', energy: 91, tasksCompleted: 22 },
              { day: 'Day 5', energy: 65, tasksCompleted: 11 },
              { day: 'Day 6', energy: 88, tasksCompleted: 20 },
              { day: 'Day 7', energy: 72, tasksCompleted: 14 },
              { day: 'Day 8', energy: 85, tasksCompleted: 19 },
              { day: 'Day 9', energy: 78, tasksCompleted: 16 },
              { day: 'Day 10', energy: 94, tasksCompleted: 24 },
            ]}
          />
        </div>

        {/* 5. Activity Heatmap */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Activity Heatmap (12 Weeks)
          </h3>
          <ActivityHeatmap
            data={[
              { week: 1, days: [20, 75, 82, 78, 85, 72, 25] },
              { week: 2, days: [18, 80, 85, 82, 88, 75, 22] },
              { week: 3, days: [15, 72, 78, 75, 82, 70, 20] },
              { week: 4, days: [22, 85, 88, 85, 90, 78, 28] },
              { week: 5, days: [25, 78, 82, 80, 85, 72, 30] },
              { week: 6, days: [20, 82, 88, 85, 92, 80, 25] },
              { week: 7, days: [18, 85, 90, 88, 95, 82, 28] },
              { week: 8, days: [22, 80, 85, 82, 88, 78, 30] },
              { week: 9, days: [25, 88, 92, 88, 94, 85, 32] },
              { week: 10, days: [20, 85, 90, 85, 92, 80, 28] },
              { week: 11, days: [22, 90, 94, 90, 96, 88, 35] },
              { week: 12, days: [25, 88, 92, 88, 94, 85, 30] },
            ]}
          />
        </div>

        {/* 6. Top Productivity Factors */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            Top Productivity Factors
          </h3>
          <TopProductivityFactors
            data={[
              { factor: '≥7 hours sleep', impact: 28, confidence: 'high' },
              { factor: 'Exercise days', impact: 22, confidence: 'high' },
              { factor: 'No meetings before noon', impact: 18, confidence: 'medium' },
              { factor: 'Pomodoro technique used', impact: 15, confidence: 'medium' },
              { factor: 'Morning routine completed', impact: 12, confidence: 'high' },
            ]}
          />
        </div>

        {/* 7. Forecast/Predictive Chart */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Performance Forecast
          </h3>
          <ForecastChart
            historicalData={[
              { week: 'W-3', actual: 18 },
              { week: 'W-2', actual: 20 },
              { week: 'W-1', actual: 22 },
              { week: 'Now', actual: 23 },
            ]}
            forecastData={[
              { week: 'W+1', predicted: 24, confidence: { min: 22, max: 26 } },
              { week: 'W+2', predicted: 25, confidence: { min: 23, max: 27 } },
              { week: 'W+3', predicted: 26, confidence: { min: 24, max: 28 } },
            ]}
          />
        </div>
      </div>
    ),
  };

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      {/* Coming Soon Overlay - Full Screen Block */}
      <div className="absolute inset-0 z-50 bg-[#1a1d24]/95 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-6 text-center"
        >
          <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">
              Coming Soon
            </h2>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-xl">
                Analytics & Insights
              </p>
              
              <p className="text-base leading-relaxed">
                Unlock the power of your productivity data with comprehensive analytics and AI-powered 
                insights. The analytics platform will feature trend analysis, predictive forecasting, 
                behavioral pattern detection, and compliance reporting—all designed to help you understand 
                and optimize your workflow based on real data.
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                  <LineChart className="w-3 h-3 mr-1" />
                  Trend Analysis
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Insights
                </Badge>
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                  <Target className="w-3 h-3 mr-1" />
                  Pattern Detection
                </Badge>
                <Badge variant="secondary" className="bg-amber-600/20 text-amber-300 border-amber-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Energy Tracking
                </Badge>
                <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Compliance Reports
                </Badge>
                <Badge variant="secondary" className="bg-pink-600/20 text-pink-300 border-pink-500/30">
                  <FileText className="w-3 h-3 mr-1" />
                  Export & Reports
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Analytics & Insights</h1>
            <p className="text-gray-400">Advanced data analysis and predictive insights</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" data-nav="filter-analytics">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2" data-nav="refresh-data">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600" data-nav="export-report">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Productivity Score', 
              value: '94', 
              unit: '/100',
              change: '+12%',
              trend: 'up',
              icon: TrendingUp, 
              color: 'text-green-400',
              bgColor: 'bg-green-500/10',
            },
            { 
              label: 'Task Completion', 
              value: '89', 
              unit: '%',
              change: '+5%',
              trend: 'up',
              icon: CheckCircle2, 
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10',
            },
            { 
              label: 'Focus Duration', 
              value: '6.8', 
              unit: 'hrs',
              change: '+0.4h',
              trend: 'up',
              icon: Clock, 
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/10',
            },
            { 
              label: 'Energy Level', 
              value: '78', 
              unit: '%',
              change: '+8%',
              trend: 'up',
              icon: Zap, 
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/10',
            },
          ].map((metric, i) => (
            <motion.div
              key={i}
              className="bg-[#1e2128] border border-gray-800 rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center mb-3`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
                <span className="text-sm text-gray-400">{metric.unit}</span>
              </div>
              <div className="text-sm text-gray-400 mb-2">{metric.label}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className={`w-3 h-3 ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                <span className={`text-xs ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.change}
                </span>
                <span className="text-xs text-gray-500">vs last {timeRange}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Research-Backed Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Productivity Trend Line Chart */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-green-400" />
                <h2 className="text-white">Productivity Index Trend</h2>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                +12% This Week
              </Badge>
            </div>
            <TrendLineChart
              data={[
                { name: 'Week 1', value: 72 },
                { name: 'Week 2', value: 76 },
                { name: 'Week 3', value: 81 },
                { name: 'Week 4', value: 85 },
                { name: 'Week 5', value: 89 },
                { name: 'Week 6', value: 94 },
              ]}
              height={250}
              color="#10b981"
              showGrid={true}
            />
          </div>

          {/* 2. Metric Breakdown (Stacked Area Chart) */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-white">Time Allocation Breakdown</h2>
            </div>
            <AreaChartComponent
              data={[
                { name: 'Mon', focus: 4.5, meetings: 1.5, breaks: 1, email: 0.8 },
                { name: 'Tue', focus: 5.2, meetings: 1.2, breaks: 0.8, email: 0.6 },
                { name: 'Wed', focus: 4.8, meetings: 2.0, breaks: 1.0, email: 0.9 },
                { name: 'Thu', focus: 5.5, meetings: 1.0, breaks: 0.9, email: 0.5 },
                { name: 'Fri', focus: 4.2, meetings: 1.8, breaks: 1.2, email: 1.0 },
              ]}
              keys={['focus', 'meetings', 'breaks', 'email']}
              colors={['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']}
              height={250}
              stacked={true}
            />
          </div>

          {/* 3. Energy vs Performance Correlation (Scatter Plot) */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-white">Energy vs Task Performance</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">Higher energy levels correlate with better task completion rates</p>
            <ScatterPlotChart
              data={[
                { x: 65, y: 72, name: 'Day 1' },
                { x: 78, y: 88, name: 'Day 2' },
                { x: 82, y: 91, name: 'Day 3' },
                { x: 58, y: 65, name: 'Day 4' },
                { x: 90, y: 95, name: 'Day 5' },
                { x: 72, y: 80, name: 'Day 6' },
                { x: 85, y: 89, name: 'Day 7' },
                { x: 68, y: 75, name: 'Day 8' },
                { x: 95, y: 98, name: 'Day 9' },
                { x: 75, y: 82, name: 'Day 10' },
              ]}
              height={250}
              xLabel="Energy Level"
              yLabel="Performance %"
              color="#f59e0b"
            />
          </div>

          {/* 4. Task Completion Time Distribution (Histogram) */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white">Task Duration Distribution</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">Most tasks completed within 1-2 hours</p>
            <Histogram
              data={[
                { range: '0-30m', count: 15 },
                { range: '30-60m', count: 28 },
                { range: '1-2h', count: 42 },
                { range: '2-3h', count: 25 },
                { range: '3-4h', count: 12 },
                { range: '4+h', count: 8 },
              ]}
              height={250}
              color="#06b6d4"
            />
          </div>
        </div>

        {/* Activity Distribution & Heat Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Distribution (Donut Chart) */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-orange-400" />
              <h2 className="text-white">Activity Distribution</h2>
            </div>

            {/* Radial Progress Circles */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Deep Work', percentage: 45, color: '#3b82f6' },
                { label: 'Meetings', percentage: 25, color: '#8b5cf6' },
                { label: 'Communication', percentage: 20, color: '#10b981' },
                { label: 'Breaks', percentage: 10, color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="#2a2d35"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                        animate={{ 
                          strokeDashoffset: 2 * Math.PI * 32 * (1 - item.percentage / 100) 
                        }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{item.percentage}%</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs text-center">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Total Active Time</div>
              <div className="text-2xl font-bold text-white">8.4 hrs</div>
            </div>
          </div>

          {/* Weekly Heat Map */}
          <div className="lg:col-span-2 bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white">Activity Heat Map</h2>
            </div>

            <div className="space-y-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-8">{day}</span>
                  <div className="flex-1 flex gap-1">
                    {Array.from({ length: 24 }, (_, hour) => {
                      // Simulate activity intensity
                      const intensity = Math.random();
                      const isActive = hour >= 8 && hour <= 18 && dayIndex < 5;
                      const value = isActive ? intensity * 100 : intensity * 30;
                      
                      return (
                        <motion.div
                          key={hour}
                          className="flex-1 h-8 rounded"
                          style={{
                            backgroundColor: 
                              value > 70 ? '#10b981' :
                              value > 40 ? '#fbbf24' :
                              value > 20 ? '#3b82f6' :
                              '#2a2d35',
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: (dayIndex * 24 + hour) * 0.002 }}
                          title={`${hour}:00 - ${value.toFixed(0)}% active`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-white">AI Insights & Recommendations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                type: 'success',
                icon: CheckCircle2,
                title: 'Strong Performance Pattern',
                description: 'Your productivity peaks on Tuesday and Thursday mornings (9-11 AM). Schedule high-priority tasks during these windows.',
                impact: 'High Impact',
              },
              {
                type: 'warning',
                icon: AlertTriangle,
                title: 'Afternoon Energy Dip Detected',
                description: 'Consistent 31% productivity drop on Friday afternoons. Consider scheduling lighter tasks or breaks during this time.',
                impact: 'Medium Impact',
              },
              {
                type: 'info',
                icon: Target,
                title: 'Goal Completion Prediction',
                description: 'Based on current pace, you will exceed monthly goals by 12%. You can safely add 2-3 more objectives.',
                impact: 'Opportunity',
              },
              {
                type: 'success',
                icon: Zap,
                title: 'Sleep-Performance Correlation',
                description: '7.5+ hours of sleep results in 28% higher productivity. Prioritize sleep on Sun-Thu nights for optimal performance.',
                impact: 'High Impact',
              },
            ].map((insight, i) => (
              <motion.div
                key={i}
                className={`border rounded-lg p-4 ${
                  insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                  insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <insight.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    insight.type === 'success' ? 'text-green-400' :
                    insight.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium ${
                        insight.type === 'success' ? 'text-green-400' :
                        insight.type === 'warning' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {insight.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* PHASE 2: Completion Analytics Dashboard - Real Backend Data */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-purple-600/10 to-cyan-600/10 border border-purple-500/30 rounded-xl p-1 mb-6">
            <div className="bg-[#16181d] rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-2">🎯 Completion Analytics (Live Data)</h2>
              <p className="text-gray-400 text-sm">
                Real-time completion tracking powered by backend analytics engine
              </p>
            </div>
          </div>
          <CompletionAnalyticsDashboard />
        </div>

        {/* Test Panel for Analytics */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-purple-600/10 to-cyan-600/10 border border-purple-500/30 rounded-xl p-1 mb-6">
            <div className="bg-[#16181d] rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-2">🧪 Analytics Test Panel</h2>
              <p className="text-gray-400 text-sm">
                Interactive test panel for analytics and data visualization
              </p>
            </div>
          </div>
          <AnalyticsTestPanel />
        </div>

        {/* Behavior Insights Panel */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-purple-600/10 to-cyan-600/10 border border-purple-500/30 rounded-xl p-1 mb-6">
            <div className="bg-[#16181d] rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-2">🧠 Behavior Insights Panel</h2>
              <p className="text-gray-400 text-sm">
                Detailed insights into user behavior and engagement patterns
              </p>
            </div>
          </div>
          <BehaviorInsightsPanel />
        </div>

        {/* Compliance Dashboard */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-purple-600/10 to-cyan-600/10 border border-purple-500/30 rounded-xl p-1 mb-6">
            <div className="bg-[#16181d] rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-2">🛡️ Compliance Dashboard</h2>
              <p className="text-gray-400 text-sm">
                Monitor and ensure compliance with industry standards and regulations
              </p>
            </div>
          </div>
          <ComplianceDashboard />
        </div>
      </div>
    </DashboardLayout>
  );
}