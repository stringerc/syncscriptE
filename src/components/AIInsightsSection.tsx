import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, TrendingUp, Clock, Zap, Target, Brain, RefreshCw, Bell, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLocation } from 'react-router';
import { getPageContext } from '../utils/ai-context-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { DynamicMiniChart } from './MiniCharts';
import { 
  RadarMetrics, 
  ComparisonBars, 
  MetricGrid, 
  ActivityHeatmap,
  TrendChart,
  InlineSparkline,
  HourlyTimeline,
  EnergyTrend,
  ProductivityGauge,
  TimeAllocation,
  TaskProgress,
  TeamComparison,
  AddTeamButton,
  MeetingHoursByDay,
  ProductivityVsMeetings,
  FocusTimeAvailability,
  MeetingsByType,
  CalendarHeatmap,
  TeamCalendarLoad,
  HourlyIntensity,
  DailyEnergyCurve,
  WeeklyEnergyTrend,
  EnergySleepCorrelation,
  FocusSessionDurations,
  EnergyHeatmap
} from './InsightVisualizations';
import {
  TasksCompletedVsPending,
  WorkloadDistribution,
  TeamProductivityTrend,
  CollaborationChart,
  TeamGoalProgress
} from './TeamProductivityVisualizations';
import {
  TasksCompletedOverTime,
  TaskStatusDistribution,
  OnTimeVsOverdue,
  TaskPriorityBreakdown,
  WorkloadByProject,
  GoalProgressOverTime,
  GoalHealthGauge,
  GoalsByStatus,
  GoalsAchievedVsTasks,
  GoalMilestonesTimeline,
  AssistantUsageFrequency,
  AverageResponseTime,
  ResolutionSuccessRate,
  FallbackConfusionIncidents,
  TopQueryCategories
} from './TasksGoalsVisualizations';

// Mini circular progress component
interface CircularProgressMiniProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const CircularProgressMini = memo(function CircularProgressMini({ 
  value, 
  max = 100, 
  size = 28, 
  strokeWidth = 3,
  color = '#06b6d4'
}: CircularProgressMiniProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1c20"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] text-white">
          {Math.round(percentage)}
        </span>
      </div>
    </div>
  );
});

// Mini gauge component
interface MiniGaugeInlineProps {
  value: number;
  max?: number;
  color?: string;
}

const MiniGaugeInline = memo(function MiniGaugeInline({ value, max = 100, color = '#06b6d4' }: MiniGaugeInlineProps) {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="relative w-full h-10 flex items-end justify-center">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path
          d="M 15 45 A 35 35 0 0 1 85 45"
          fill="none"
          stroke="#1a1c20"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 15 45 A 35 35 0 0 1 85 45"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.1} 110`}
        />
        <line
          x1="50"
          y1="45"
          x2="50"
          y2="20"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${rotation} 50 45)`}
        />
        <circle cx="50" cy="45" r="2.5" fill={color} />
      </svg>
    </div>
  );
});

// Mini bar chart component
interface MiniBarInlineProps {
  data: number[];
  color?: string;
}

const MiniBarInline = memo(function MiniBarInline({ data, color = '#06b6d4' }: MiniBarInlineProps) {
  const max = Math.max(...data);

  return (
    <div className="flex items-end justify-between gap-0.5 h-8">
      {data.map((value, index) => {
        const heightPercent = (value / max) * 100;
        return (
          <div key={index} className="flex-1 bg-[#1a1c20] rounded-t flex items-end overflow-hidden">
            <motion.div
              className="w-full rounded-t"
              style={{ backgroundColor: color }}
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          </div>
        );
      })}
    </div>
  );
});

export interface AIInsightsContent {
  title?: string;
  mode?: 'full' | 'partial' | 'custom';
  customContent?: React.ReactNode;
  insights?: {
    title: string;
    value: string;
    icon?: 'brain' | 'target' | 'zap' | 'clock' | 'trending';
    description?: string;
    miniChart?: {
      type: 'sparkline' | 'bar' | 'gauge';
      data: number[];
    };
  }[];
  chartData?: {
    type: 'line' | 'bar' | 'area' | 'sparkline' | 'donut' | 'gauge';
    data: any[];
    label?: string;
  };
  visualizations?: {
    type: 'radar' | 'comparison' | 'metrics' | 'heatmap' | 'trend' | 'hourlyTimeline' | 'energyTrend' | 'productivityGauge' | 'timeAllocation' | 'taskProgress' | 'teamComparison' | 'meetingHoursByDay' | 'productivityVsMeetings' | 'focusTimeAvailability' | 'meetingsByType' | 'calendarHeatmap' | 'teamCalendarLoad' | 'hourlyIntensity';
    data: any;
    label?: string;
    hasTeam?: boolean;
    goal?: number;
    daysWithFocus?: number;
    month?: string;
  }[];
}

interface AIInsightsSectionProps {
  isOpen: boolean;
  content?: AIInsightsContent;
}

export const AIInsightsSection = memo(function AIInsightsSection({ isOpen, content }: AIInsightsSectionProps) {
  const location = useLocation();
  const pageContext = getPageContext(location.pathname);
  
  // Title should be "AI Assistant" with context when open
  const panelTitle = `AI Assistant`;
  const panelSubtitle = pageContext.displayName;
  
  const [animate, setAnimate] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [detailedView, setDetailedView] = useState(false);

  // Trigger animations when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  // Default content if none provided
  const defaultContent: AIInsightsContent = {
    title: panelTitle,
    insights: [
      {
        title: 'AI Analysis',
        value: 'Low Energy Mode Active',
        icon: 'brain',
        description: 'Conversation Extraction: PMI',
      },
      {
        title: 'Weekly Goals',
        value: '85%',
        icon: 'target',
      },
      {
        title: 'Energy Levels',
        value: 'This Week',
        icon: 'zap',
      },
      {
        title: 'Task Completion',
        value: '89%',
        icon: 'trending',
      },
      {
        title: 'Peak Focus',
        value: '2-4 PM',
        icon: 'clock',
      },
    ],
  };

  const displayContent = content || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'brain':
        return Brain;
      case 'target':
        return Target;
      case 'zap':
        return Zap;
      case 'clock':
        return Clock;
      case 'trending':
        return TrendingUp;
      default:
        return Brain;
    }
  };

  const getIconColor = (iconName?: string) => {
    switch (iconName) {
      case 'brain':
        return 'text-purple-400';
      case 'target':
        return 'text-blue-400';
      case 'zap':
        return 'text-yellow-400';
      case 'clock':
        return 'text-cyan-400';
      case 'trending':
        return 'text-green-400';
      default:
        return 'text-purple-400';
    }
  };

  const getProgressColor = (iconColorClass: string) => {
    switch (iconColorClass) {
      case 'text-purple-400':
        return '#a855f7';
      case 'text-blue-400':
        return '#60a5fa';
      case 'text-yellow-400':
        return '#facc15';
      case 'text-cyan-400':
        return '#06b6d4';
      case 'text-green-400':
        return '#4ade80';
      default:
        return '#a855f7';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1c20]">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800 relative">
        <div className="flex items-center gap-2 flex-col">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-white">{panelTitle}</h2>
          </div>
          <p className="text-xs text-gray-400">{panelSubtitle}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="absolute right-4 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-md p-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 hover:border-purple-600/40"
              aria-label="AI Assistant settings"
              title="Customize AI Assistant"
            >
              <Settings className="w-4 h-4 text-purple-400 hover:text-purple-300 cursor-pointer hover:rotate-90 transition-all duration-300" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1e2128] border-gray-800">
                <DropdownMenuLabel className="text-white">AI Assistant Settings</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
            
            <DropdownMenuCheckboxItem
              checked={autoRefresh}
              onCheckedChange={(checked) => {
                setAutoRefresh(checked);
                toast.success(checked ? 'Auto-refresh enabled' : 'Auto-refresh disabled', {
                  description: checked ? 'Insights will update every 30 seconds' : 'Insights will only refresh manually'
                });
              }}
              className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Auto-refresh
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={notifications}
              onCheckedChange={(checked) => {
                setNotifications(checked);
                toast.success(checked ? 'Notifications enabled' : 'Notifications disabled', {
                  description: checked ? 'You\'ll be notified of important insights' : 'No insight notifications'
                });
              }}
              className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={detailedView}
              onCheckedChange={(checked) => {
                setDetailedView(checked);
                toast.info(checked ? 'Detailed view enabled' : 'Compact view enabled', {
                  description: checked ? 'Showing expanded metrics' : 'Showing condensed insights'
                });
              }}
              className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              Detailed View
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator className="bg-gray-800" />
            
            <DropdownMenuItem
              onClick={() => {
                toast.success('Insights refreshed! ✨', {
                  description: 'AI is analyzing your latest activity...'
                });
              }}
              className="text-gray-300 focus:bg-teal-600/10 focus:text-white cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => {
                toast.success('AI recalibrating...', {
                  description: 'Learning from your patterns to improve accuracy'
                });
              }}
              className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Recalibrate AI
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content - Dynamic Insights */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayContent.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Custom Content Mode */}
            {displayContent.mode === 'custom' && displayContent.customContent ? (
              <div>{displayContent.customContent}</div>
            ) : (
              <>
                {/* Chart Section - if available */}
                {displayContent.chartData && (
              <motion.div
                className="bg-[#1e2128] rounded-lg p-3 border border-gray-800"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={animate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <DynamicMiniChart
                  type={displayContent.chartData.type}
                  data={displayContent.chartData.data}
                  label={displayContent.chartData.label}
                />
              </motion.div>
            )}

            {/* Additional Visualizations */}
            {displayContent.visualizations && displayContent.visualizations.map((viz, vizIndex) => (
              <motion.div
                key={`viz-${vizIndex}`}
                className="bg-[#1e2128] rounded-lg p-3 border border-gray-800"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={animate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: 0.1 + (vizIndex + 1) * 0.05 }}
              >
                {viz.label && (
                  <p className="text-xs text-gray-400 mb-3">{viz.label}</p>
                )}
                {viz.type === 'radar' && <RadarMetrics data={viz.data} />}
                {viz.type === 'comparison' && <ComparisonBars data={viz.data} />}
                {viz.type === 'metrics' && <MetricGrid metrics={viz.data} />}
                {viz.type === 'heatmap' && <ActivityHeatmap data={viz.data} />}
                {viz.type === 'trend' && <TrendChart data={viz.data} />}
                {viz.type === 'hourlyTimeline' && <HourlyTimeline data={viz.data} />}
                {viz.type === 'energyTrend' && <EnergyTrend data={viz.data} />}
                {viz.type === 'productivityGauge' && <ProductivityGauge data={viz.data} />}
                {viz.type === 'timeAllocation' && <TimeAllocation data={viz.data} />}
                {viz.type === 'taskProgress' && <TaskProgress data={viz.data} />}
                {viz.type === 'teamComparison' && (
                  viz.hasTeam === false ? (
                    <AddTeamButton onAddTeam={() => {
                      toast.info('Add Team Feature', {
                        description: 'Navigate to Team Collaboration page to add your team'
                      });
                    }} />
                  ) : (
                    <TeamComparison data={viz.data} />
                  )
                )}
                {viz.type === 'meetingHoursByDay' && <MeetingHoursByDay data={viz.data} />}
                {viz.type === 'productivityVsMeetings' && <ProductivityVsMeetings data={viz.data} />}
                {viz.type === 'focusTimeAvailability' && <FocusTimeAvailability data={viz.data} goal={viz.goal || 2} daysWithFocus={viz.daysWithFocus || 0} />}
                {viz.type === 'meetingsByType' && <MeetingsByType data={viz.data} />}
                {viz.type === 'calendarHeatmap' && <CalendarHeatmap data={viz.data} month={viz.month || ''} />}
                {viz.type === 'hourlyIntensity' && <HourlyIntensity data={viz.data} />}
                {viz.type === 'teamCalendarLoad' && (
                  viz.hasTeam === false ? (
                    <AddTeamButton onAddTeam={() => {
                      toast.info('Add Team Feature', {
                        description: 'Navigate to Team Collaboration page to add your team'
                      });
                    }} />
                  ) : (
                    <TeamCalendarLoad data={viz.data} />
                  )
                )}
                {viz.type === 'tasksCompletedOverTime' && <TasksCompletedOverTime data={viz.data} />}
                {viz.type === 'taskStatusDistribution' && <TaskStatusDistribution data={viz.data} />}
                {viz.type === 'onTimeVsOverdue' && <OnTimeVsOverdue data={viz.data} />}
                {viz.type === 'taskPriorityBreakdown' && <TaskPriorityBreakdown data={viz.data} />}
                {viz.type === 'tasksCompletedVsPending' && <TasksCompletedVsPending data={viz.data} />}
                {viz.type === 'workloadDistribution' && <WorkloadDistribution data={viz.data} />}
                {viz.type === 'teamProductivityTrend' && <TeamProductivityTrend data={viz.data} />}
                {viz.type === 'collaborationChart' && <CollaborationChart data={viz.data} />}
                {viz.type === 'teamGoalProgress' && <TeamGoalProgress data={viz.data} />}
                {viz.type === 'workloadByProject' && <WorkloadByProject data={viz.data} />}
                {viz.type === 'goalProgressOverTime' && <GoalProgressOverTime data={viz.data} />}
                {viz.type === 'goalHealthGauge' && <GoalHealthGauge data={viz.data} />}
                {viz.type === 'goalsByStatus' && <GoalsByStatus data={viz.data} />}
                {viz.type === 'goalsAchievedVsTasks' && <GoalsAchievedVsTasks data={viz.data} />}
                {viz.type === 'goalMilestonesTimeline' && <GoalMilestonesTimeline data={viz.data} />}
                {viz.type === 'assistantUsageFrequency' && <AssistantUsageFrequency data={viz.data} />}
                {viz.type === 'averageResponseTime' && <AverageResponseTime data={viz.data} />}
                {viz.type === 'resolutionSuccessRate' && <ResolutionSuccessRate data={viz.data} />}
                {viz.type === 'fallbackConfusionIncidents' && <FallbackConfusionIncidents data={viz.data} />}
                {viz.type === 'topQueryCategories' && <TopQueryCategories data={viz.data} />}
                {viz.type === 'dailyEnergyCurve' && <DailyEnergyCurve data={viz.data} />}
                {viz.type === 'weeklyEnergyTrend' && <WeeklyEnergyTrend data={viz.data} />}
                {viz.type === 'energySleepCorrelation' && <EnergySleepCorrelation data={viz.data} />}
                {viz.type === 'focusSessionDurations' && <FocusSessionDurations data={viz.data} />}
                {viz.type === 'energyHeatmap' && <EnergyHeatmap data={viz.data} />}
              </motion.div>
            ))}

            {/* Insights Cards with Visual Graphics */}
            {displayContent.insights && displayContent.insights.map((insight, index) => {
              const IconComponent = getIcon(insight.icon);
              const iconColor = getIconColor(insight.icon);
              
              // Extract numeric value from the insight value
              const numericMatch = insight.value.match(/(\d+(?:\.\d+)?)/);
              const hasPercentage = insight.value.includes('%');
              const hasFraction = insight.value.includes('/');
              
              let visualValue = null;
              let maxValue = 100;
              
              if (hasFraction) {
                const parts = insight.value.match(/(\d+)\/(\d+)/);
                if (parts) {
                  visualValue = parseInt(parts[1]);
                  maxValue = parseInt(parts[2]);
                }
              } else if (hasPercentage && numericMatch) {
                visualValue = parseFloat(numericMatch[0]);
                maxValue = 100;
              } else if (numericMatch) {
                visualValue = parseFloat(numericMatch[0]);
              }
              
              // Generate mini sparkline data based on the metric
              // Use provided miniChart data or generate sparkline data
              const miniChartData = insight.miniChart?.data || null;
              const miniChartType = insight.miniChart?.type || null;

              // Special expanded rendering for "Tasks Today" card
              if (insight.title === 'Tasks Today' && (insight as any).extraData) {
                const extraData = (insight as any).extraData;
                return (
                  <motion.div
                    key={`${displayContent.title}-${index}`}
                    className="bg-[#1e2128] rounded-lg p-4 border border-gray-800 flex-shrink-0 cursor-pointer hover:border-cyan-600/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
                    initial={{ opacity: 0, x: 20 }}
                    animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
                    onClick={() => {
                      toast.info(insight.title, {
                        description: insight.description || insight.value
                      });
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${iconColor}`} />
                        <h3 className="text-white text-sm">{insight.title}</h3>
                      </div>
                      <span className="text-cyan-400 text-sm">{insight.value}</span>
                    </div>
                    
                    {/* Progress bar */}
                    {extraData.stats && (
                      <div className="mb-3">
                        <div className="h-2 bg-[#0a0b0d] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${extraData.stats.complete}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Week overview */}
                    {extraData.weekProgress && (
                      <div className="mb-3 space-y-2">
                        <div className="flex justify-between px-1">
                          {extraData.weekProgress.map((dayData: any, idx: number) => (
                            <div key={dayData.day} className="flex flex-col items-center gap-0.5" style={{ width: '16.666%' }}>
                              <span className="text-[10px] text-gray-500">{dayData.day}</span>
                              <span className={`text-xs ${dayData.day === 'Today' ? 'text-cyan-400' : 'text-gray-300'}`}>
                                {dayData.count}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Mini sparkline */}
                        {miniChartData && (
                          <div className="h-10">
                            <InlineSparkline 
                              data={miniChartData} 
                              height={40} 
                              color="#06b6d4"
                              showDots={true}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats grid */}
                    {extraData.stats && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-cyan-400 text-xs">{extraData.stats.complete}%</p>
                          <p className="text-gray-500 text-[10px]">Complete</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-green-400 text-xs">{extraData.stats.done}</p>
                          <p className="text-gray-500 text-[10px]">Done</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-amber-400 text-xs">{extraData.stats.remaining}</p>
                          <p className="text-gray-500 text-[10px]">Remaining</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={`${displayContent.title}-${index}`}
                  className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0 cursor-pointer hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
                  initial={{ opacity: 0, x: 20 }}
                  animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    toast.info(insight.title, {
                      description: insight.description || insight.value
                    });
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-3 h-3 ${iconColor}`} />
                      <p className="text-white text-xs">{insight.title}</p>
                    </div>
                    {visualValue !== null && (
                      <div className="flex-shrink-0">
                        <CircularProgressMini
                          value={visualValue}
                          max={maxValue}
                          size={28}
                          strokeWidth={3}
                          color={getProgressColor(iconColor)}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Value with visual chart */}
                  <div className="space-y-1.5">
                    <p className="text-gray-400 text-xs leading-tight">
                      {insight.value}
                    </p>
                    
                    {/* Render miniChart if available - always show charts */}
                    {miniChartData && miniChartType && animate && (
                      <div className="mt-1">
                        {miniChartType === 'sparkline' && (
                          <InlineSparkline
                            data={miniChartData}
                            height={20}
                            color={getProgressColor(iconColor)}
                          />
                        )}
                        {miniChartType === 'bar' && (
                          <MiniBarInline
                            data={miniChartData}
                            color={getProgressColor(iconColor)}
                          />
                        )}
                        {miniChartType === 'gauge' && miniChartData[0] !== undefined && (
                          <MiniGaugeInline
                            value={miniChartData[0]}
                            max={maxValue}
                            color={getProgressColor(iconColor)}
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Auto-generate line chart for metrics without miniChart */}
                    {!miniChartData && visualValue !== null && (
                      <div className="mt-1">
                        <InlineSparkline
                          data={[
                            visualValue * 0.7, 
                            visualValue * 0.8, 
                            visualValue * 0.85, 
                            visualValue * 0.9, 
                            visualValue * 0.95, 
                            visualValue
                          ]}
                          height={20}
                          color={getProgressColor(iconColor)}
                        />
                      </div>
                    )}
                  </div>
                  
                  {insight.description && (
                    <p className="text-gray-500 text-[10px] leading-tight mt-1.5">
                      {insight.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
            </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});