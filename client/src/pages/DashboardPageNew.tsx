import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Target,
  Clock,
  AlertCircle,
  Trophy,
  Trash2,
  Sparkles,
  Eye,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  MapPin,
  Star,
  Flame,
  CheckCircle,
  Plus,
  Paperclip,
  Mic,
  Search,
  MessageCircle,
  Bell,
  Battery,
  User,
  Globe
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency, getPriorityColor } from '@/lib/utils'
import { Task, Event, Achievement, Streak, Notification } from '@/shared/types'

const DashboardPage = memo(() => {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Mock data for the new design - replace with real queries
  const mockData = {
    aiSuggestion: {
      title: "Prioritize 'Q4 Budget Allocation (Financial Agent)'",
      description: "'Q4 Budget Allocation before your team sync for maximum success.'",
      avatar: "👩"
    },
    energyLevel: 85,
    energyHoursLeft: 4,
    weather: {
      condition: "Heavy rain 5 PM",
      suggestion: "Reschedule 'Outdoor run or pack gear'"
    },
    tasks: [
      { id: 1, title: "Time", priority: "high", progress: 7.0, total: 8, badge: "Polte Kamtaw" },
      { id: 2, title: "Thevitee tiee", priority: "medium", progress: 7.0, total: 8 },
      { id: 3, title: "Money Snaik by", priority: "high", progress: 7.0, total: 8 },
      { id: 4, title: "Personal", priority: "low", progress: 7.0, total: 8 },
      { id: 5, title: "Treenies idbe", priority: "medium", progress: 7.0, total: 8 },
      { id: 6, title: "Thenainoit", priority: "low", progress: 7.0, total: 8 }
    ],
    financialAlert: {
      message: "Dinner exceeds budget by $45",
      action: "Suggest Alternatives"
    },
    dailyChallenge: {
      points: 900
    },
    financialHealth: {
      weeklySpend: 75,
      budget: 100
    },
    streaks: [
      { title: "7-Day Streak", count: 2, type: "Overdue Tasks" },
      { title: "Q4 Latinde Tasks", count: 1, type: "Overdue Tasks" },
      { title: "Decision Pending", count: 1, type: "Decision Time" }
    ],
    achievements: [
      { title: "Treserectiom Moer", progress: 983, total: 1000 },
      { title: "Budget Master", progress: 8, total: 10, period: "This Week" },
      { title: "Task Spree", progress: 20, total: 25, period: "This Week" },
      { title: "Sudgri Master", progress: 100, total: 100 }
    ]
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SyncScript</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Universal Search & Command"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Battery className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation Sidebar */}
        <nav className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen py-6">
          <div className="px-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start text-white bg-gray-800">
              <Target className="w-5 h-5 mr-3" />
              Home
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
              <Calendar className="w-5 h-5 mr-3" />
              Calendar
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
              <CheckSquare className="w-5 h-5 mr-3" />
              Tasks
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
              <Target className="w-5 h-5 mr-3" />
              Project
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
              <Zap className="w-5 h-5 mr-3" />
              Energy & Goals
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
              <Globe className="w-5 h-5 mr-3" />
              Integrations
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
              <Target className="w-5 h-5 mr-3" />
              Settings
            </Button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-6">
            
            {/* AI & FOCUS Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">AI & FOCUS</h2>
              
              {/* What Should I Be Doing Right Now Card */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">What Should I Be Doing Right Now?</h3>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
                      {mockData.aiSuggestion.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200 mb-1">{mockData.aiSuggestion.title}</p>
                      <p className="text-xs text-gray-400">{mockData.aiSuggestion.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Energy Adaptive Agent */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Energy Adaptive Agent</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-800"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - mockData.energyLevel / 100)}`}
                          className="text-green-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{mockData.energyLevel}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{mockData.energyHoursLeft} hrs left. Optimize load?</p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Mic className="w-4 h-4 mr-2" />
                      Voice-to-Task
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Weather & Route Intelligence */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Weather & Route Intelligence</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-200">{mockData.weather.condition}</p>
                    <p className="text-xs text-gray-400">{mockData.weather.suggestion}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* TODAY'S ORCHESTRATION Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">TODAY'S ORCHESTRATION</h2>
              
              {/* My Day Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white">My Day: Tuesday, Nov 28, 2023</h3>
              </div>

              {/* Prioritized Tasks */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Prioritized Tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm text-white">
                          {task.id}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{task.title}</p>
                          <p className="text-xs text-gray-400">{task.progress}/{task.total}</p>
                        </div>
                      </div>
                      {task.badge && (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          {task.badge}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Financial Conflict Alert */}
              <Card className="bg-gray-900 border-orange-500 border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-400">Financial Conflict Alert</p>
                      <p className="text-xs text-gray-300">{mockData.financialAlert.message}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white">
                      {mockData.financialAlert.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Challenge */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Daily Challenge</h4>
                    <span className="text-lg font-bold text-green-400">+{mockData.dailyChallenge.points}</span>
                  </div>
                </CardContent>
              </Card>

              {/* My Calendar */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">My Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                      <div key={day} className="text-center text-gray-400 py-1">{day}</div>
                    ))}
                    {Array.from({ length: 30 }, (_, i) => (
                      <div key={i + 1} className="text-center py-1 text-gray-300">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RESOURCE HUB Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">RESOURCE HUB</h2>
              
              {/* Financial Health Snapshot */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Financial Health Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Weekly Spend vs Budget</p>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${mockData.financialHealth.weeklySpend}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{mockData.financialHealth.weeklySpend}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gamification Streaks */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Gamification Streaks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Weekly Spend Analysis</span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">Suggest Alternatives</Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">Adjust Budget</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction In-Box */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Transaction In-Box</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockData.streaks.map((streak, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <div>
                        <p className="text-sm font-medium text-white">{streak.title}</p>
                        <p className="text-xs text-gray-400">{streak.count} {streak.type}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" className="text-green-400 hover:bg-gray-700">+</Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-gray-700">-</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Achievement Progress Rail */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Achievement Progress Rail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockData.achievements.map((achievement, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{achievement.title}</span>
                        <span className="text-gray-400">{achievement.progress}/{achievement.total}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div 
                          className="bg-purple-500 h-1 rounded-full" 
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        ></div>
                      </div>
                      {achievement.period && (
                        <p className="text-xs text-gray-400">{achievement.period}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
})

DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
