import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SpendingChart } from '@/components/financial/SpendingChart';
import { AddTransactionModal } from '@/components/financial/AddTransactionModal';
import { BudgetAlerts } from '@/components/financial/BudgetAlerts';
import { RecurringTransactions } from '@/components/financial/RecurringTransactions';
import { FriendActivityFeed } from '@/components/friends/FriendActivityFeed';
import { ProjectDetailCard } from '@/components/projects/ProjectDetailCard';
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Users, 
  Folder, 
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  MessageSquare,
  Lock,
  Check,
  X,
  Flame,
  Target,
  Zap
} from 'lucide-react';

// Mock data
const mockFinancial = {
  balance: 2450,
  income: 3500,
  expenses: 1050,
  budgetUsed: 85,
  totalBudget: 2500,
  recentTransactions: [
    { id: 1, description: 'Salary', amount: 3500, type: 'income', date: 'Oct 1' },
    { id: 2, description: 'Rent', amount: -1200, type: 'expense', date: 'Oct 1' },
    { id: 3, description: 'Groceries', amount: -150, type: 'expense', date: 'Oct 3' }
  ],
  categories: [
    { name: 'Housing', amount: 1200, percentage: 48, color: 'rgb(99 102 241)' },
    { name: 'Food', amount: 400, percentage: 16, color: 'rgb(34 197 94)' },
    { name: 'Transportation', amount: 250, percentage: 10, color: 'rgb(245 158 11)' },
    { name: 'Entertainment', amount: 150, percentage: 6, color: 'rgb(236 72 153)' },
    { name: 'Utilities', amount: 200, percentage: 8, color: 'rgb(59 130 246)' },
    { name: 'Other', amount: 300, percentage: 12, color: 'rgb(156 163 175)' },
  ]
};

const mockFriends = {
  friends: [
    { id: 1, name: 'Sarah Johnson', status: 'online', streak: 12, emoji: '🎯' },
    { id: 2, name: 'Mike Chen', status: 'offline', streak: 8, emoji: '💪' },
    { id: 3, name: 'Emily Davis', status: 'online', streak: 15, emoji: '🔥' }
  ],
  requests: {
    sent: [],
    received: [{ id: 1, name: 'Alex Smith', emoji: '⭐' }]
  },
  activities: [
    {
      id: '1',
      friendName: 'Sarah Johnson',
      friendEmoji: '🎯',
      type: 'task_complete' as const,
      title: 'Completed task',
      description: 'Finished "Write Q4 Strategy" during PEAK energy',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      points: 150,
      isOnline: true
    },
    {
      id: '2',
      friendName: 'Emily Davis',
      friendEmoji: '🔥',
      type: 'streak_milestone' as const,
      title: '15-day streak!',
      description: 'Reached a new streak milestone',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      isOnline: true
    },
    {
      id: '3',
      friendName: 'Mike Chen',
      friendEmoji: '💪',
      type: 'challenge_complete' as const,
      title: 'Challenge complete',
      description: 'Claimed "Peak Performance" challenge reward',
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      points: 500,
      isOnline: false
    },
    {
      id: '4',
      friendName: 'Sarah Johnson',
      friendEmoji: '🎯',
      type: 'energy_log' as const,
      title: 'Logged energy',
      description: 'Set energy to PEAK and started morning routine',
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      isOnline: true
    },
    {
      id: '5',
      friendName: 'Emily Davis',
      friendEmoji: '🔥',
      type: 'event_scheduled' as const,
      title: 'Scheduled event',
      description: 'Added "Team Standup" to calendar for tomorrow',
      timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
      isOnline: true
    }
  ]
};

const mockProjects = [
  { 
    id: 1, 
    name: 'Q4 Planning', 
    description: 'Strategic planning and goal setting for Q4',
    progress: 65,
    members: [
      { id: '1', name: 'Sarah Johnson', role: 'Project Lead' },
      { id: '2', name: 'Mike Chen', role: 'Analyst' },
      { id: '3', name: 'Emily Davis', role: 'Designer' },
      { id: '4', name: 'Alex Smith', role: 'Developer' },
      { id: '5', name: 'Chris Lee', role: 'Marketing' }
    ],
    totalTasks: 12,
    completedTasks: 8,
    inProgressTasks: 3,
    blockedTasks: 1,
    upcomingTasks: [
      { id: '1', title: 'Finalize Q4 roadmap', status: 'in_progress' as const, assignee: 'Sarah Johnson' },
      { id: '2', title: 'Budget allocation review', status: 'in_progress' as const, assignee: 'Mike Chen' },
      { id: '3', title: 'Team resource planning', status: 'blocked' as const, assignee: 'Emily Davis' }
    ],
    milestones: [
      { id: '1', title: 'Initial planning complete', dueDate: 'Oct 15', isCompleted: true },
      { id: '2', title: 'Budget approved', dueDate: 'Oct 25', isCompleted: false },
      { id: '3', title: 'Roadmap finalized', dueDate: 'Nov 1', isCompleted: false }
    ],
    dueDate: 'Nov 1, 2025',
    status: 'on_track' as const
  },
  { 
    id: 2, 
    name: 'Website Redesign', 
    description: 'Complete overhaul of company website',
    progress: 40,
    members: [
      { id: '1', name: 'Emily Davis', role: 'Lead Designer' },
      { id: '2', name: 'Alex Smith', role: 'Frontend Dev' },
      { id: '3', name: 'Mike Chen', role: 'Backend Dev' }
    ],
    totalTasks: 8,
    completedTasks: 3,
    inProgressTasks: 4,
    blockedTasks: 1,
    upcomingTasks: [
      { id: '1', title: 'Homepage mockup', status: 'in_progress' as const, assignee: 'Emily Davis' },
      { id: '2', title: 'Component library setup', status: 'in_progress' as const, assignee: 'Alex Smith' }
    ],
    milestones: [
      { id: '1', title: 'Design approved', dueDate: 'Oct 20', isCompleted: false },
      { id: '2', title: 'Development complete', dueDate: 'Nov 15', isCompleted: false }
    ],
    dueDate: 'Nov 30, 2025',
    status: 'at_risk' as const
  },
  { 
    id: 3, 
    name: 'Marketing Campaign', 
    description: 'Q4 product launch marketing campaign',
    progress: 80,
    members: [
      { id: '1', name: 'Chris Lee', role: 'Campaign Manager' },
      { id: '2', name: 'Sarah Johnson', role: 'Content Writer' },
      { id: '3', name: 'Emily Davis', role: 'Designer' },
      { id: '4', name: 'Mike Chen', role: 'Analytics' }
    ],
    totalTasks: 15,
    completedTasks: 12,
    inProgressTasks: 3,
    blockedTasks: 0,
    upcomingTasks: [
      { id: '1', title: 'Final ad copy review', status: 'in_progress' as const, assignee: 'Sarah Johnson' },
      { id: '2', title: 'Social media schedule', status: 'in_progress' as const, assignee: 'Chris Lee' }
    ],
    milestones: [
      { id: '1', title: 'Content created', dueDate: 'Oct 10', isCompleted: true },
      { id: '2', title: 'Ads launched', dueDate: 'Oct 20', isCompleted: true },
      { id: '3', title: 'Campaign complete', dueDate: 'Oct 31', isCompleted: false }
    ],
    dueDate: 'Oct 31, 2025',
    status: 'ahead' as const
  }
];

export function ManageMode() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('money');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const handleAddTransaction = () => {
    console.log('➕ Add Transaction clicked');
    setShowAddTransaction(true);
  };

  const handleAddFriend = () => {
    console.log('➕ Add Friend clicked');
    toast({
      title: '👥 Friend Request Sent',
      description: 'Your friend request has been sent!',
      duration: 3000,
    });
  };

  const handleAcceptFriend = (name: string) => {
    console.log('✅ Accept friend:', name);
    toast({
      title: `✅ Friend Added!`,
      description: `You and ${name} are now friends`,
      duration: 3000,
    });
  };

  const handleCreateProject = () => {
    console.log('➕ Create Project clicked');
    toast({
      title: '📁 Project Created',
      description: 'New project created successfully',
      duration: 3000,
    });
  };

  const handleSaveSettings = () => {
    console.log('💾 Save Settings clicked');
    toast({
      title: '✅ Settings Saved',
      description: 'Your preferences have been updated',
      duration: 3000,
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-2xl"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(245 158 11), rgb(249 115 22), rgb(239 68 68))' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <DollarSign className="w-10 h-10" />
            Manage — Life Admin Hub
          </h1>
          <p className="text-white/90 text-base md:text-lg">
            Money, people, projects, and account — all in one place
          </p>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100">
          <TabsTrigger 
            value="money" 
            className="flex items-center gap-2 py-3"
            style={activeTab === 'money' ? { 
              backgroundImage: 'linear-gradient(to right, rgb(245 158 11), rgb(249 115 22))',
              color: 'white'
            } : {}}
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Money</span>
          </TabsTrigger>
          <TabsTrigger 
            value="people" 
            className="flex items-center gap-2 py-3"
            style={activeTab === 'people' ? { 
              backgroundImage: 'linear-gradient(to right, rgb(236 72 153), rgb(244 63 94))',
              color: 'white'
            } : {}}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">People</span>
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="flex items-center gap-2 py-3"
            style={activeTab === 'projects' ? { 
              backgroundImage: 'linear-gradient(to right, rgb(139 92 246), rgb(168 85 247))',
              color: 'white'
            } : {}}
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger 
            value="account" 
            className="flex items-center gap-2 py-3"
            style={activeTab === 'account' ? { 
              backgroundImage: 'linear-gradient(to right, rgb(75 85 99), rgb(55 65 81))',
              color: 'white'
            } : {}}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

                {/* MONEY TAB */}
                <TabsContent value="money" className="mt-6 space-y-6">
                  {/* Spending Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SpendingChart 
                      categories={mockFinancial.categories}
                      totalBudget={mockFinancial.totalBudget}
                    />
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-green-700">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-green-600">${mockFinancial.balance.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-blue-700">Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">+${mockFinancial.income}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-red-700">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-red-600">-${mockFinancial.expenses}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-purple-700">Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-purple-600">{mockFinancial.budgetUsed}%</div>
              </CardContent>
            </Card>
          </div>
                  </div>

          {/* Recent Transactions */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">Recent Transactions</CardTitle>
                <Button size="sm" onClick={handleAddTransaction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {mockFinancial.recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      {tx.type === 'income' ? (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 rounded-lg">
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{tx.description}</div>
                        <div className="text-xs text-gray-500">{tx.date}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : ''}{tx.amount < 0 ? tx.amount : `$${tx.amount}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Budget Alerts */}
          <BudgetAlerts />
          
          {/* Recurring Transactions */}
          <RecurringTransactions />
        </TabsContent>

                {/* PEOPLE TAB */}
                <TabsContent value="people" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Friends List */}
                  <Card className="border-none shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle>Friends</CardTitle>
                <Button size="sm" onClick={handleAddFriend}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockFriends.friends.map(friend => (
                  <div key={friend.id} className="p-4 bg-white rounded-lg border hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarFallback 
                          className="text-white"
                          style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(236 72 153), rgb(168 85 247))' }}
                        >
                          {friend.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{friend.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {friend.status}
                        </div>
                      </div>
                      <span className="text-2xl">{friend.emoji}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">{friend.streak} day streak</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {mockFriends.requests.received.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-900 mb-3">Pending Requests</div>
                  {mockFriends.requests.received.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{req.emoji}</span>
                        <span className="font-medium text-gray-900">{req.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleAcceptFriend(req.name)}
                          className="text-white"
                          style={{ backgroundImage: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))' }}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Friend Activity Feed */}
                  <FriendActivityFeed activities={mockFriends.activities} />
                  </div>
                </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="mt-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">ShareSync Projects</h2>
            <Button 
              size="sm" 
              onClick={handleCreateProject}
              className="text-white"
              style={{ backgroundImage: 'linear-gradient(to right, rgb(139 92 246), rgb(168 85 247))' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockProjects.map(project => (
              <ProjectDetailCard
                key={project.id}
                project={project}
                onAddTask={() => {
                  console.log('Add task to project:', project.name);
                  toast({
                    title: '📋 Add Task',
                    description: `Adding task to ${project.name}`,
                    duration: 3000,
                  });
                }}
                onViewDetails={() => {
                  console.log('View project details:', project.name);
                  toast({
                    title: '📊 Project Details',
                    description: `Opening full details for ${project.name}`,
                    duration: 3000,
                  });
                }}
              />
            ))}
          </div>
        </TabsContent>

        {/* ACCOUNT TAB */}
        <TabsContent value="account" className="mt-6 space-y-6">
          {/* Theme Customizer */}
          <ThemeCustomizer />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile */}
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                  <input 
                    type="text" 
                    defaultValue="Test User"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <input 
                    type="email" 
                    defaultValue="test@example.com"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  className="w-full text-white"
                  style={{ backgroundImage: 'linear-gradient(to right, rgb(147 51 234), rgb(219 39 119))' }}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Theme</div>
                    <div className="text-sm text-gray-600">Light mode</div>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Timezone</div>
                    <div className="text-sm text-gray-600">America/New_York</div>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Notifications</div>
                    <div className="text-sm text-gray-600">All enabled</div>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Privacy */}
          <Card className="border-none shadow-xl border-2 border-red-200">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Lock className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Your Data
              </Button>
              <div className="pt-4 border-t">
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onAdd={(transaction) => {
          console.log('Transaction added:', transaction);
          // TODO: Update transaction list when backend is connected
        }}
      />
    </div>
  );
}
