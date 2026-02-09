import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, Users, Shield, Lock, Key, FileText,
  TrendingUp, BarChart3, Download, Settings, Eye,
  CheckCircle2, AlertTriangle, Clock, DollarSign,
  UserPlus, UserMinus, Globe, Server, Database, Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSectionOriginal';
import {
  OrganizationProductivityIndex,
  DepartmentPerformance,
  AdoptionUsageStats,
  MeetingVsFocusTime,
  GoalAchievementRate
} from '../EnterpriseAnalytics';
import { toast } from 'sonner@2.0.3';
import { ComingSoonOverlay } from '../ComingSoonOverlay';
import { useNavigate } from 'react-router';
import { COMING_SOON_FEATURES } from '../../utils/global-rules';

export function EnterpriseToolsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security' | 'analytics'>('overview');
  const [showComingSoon, setShowComingSoon] = useState(true);
  const navigate = useNavigate();

  // Add Enterprise to coming soon features if not already there
  const enterpriseFeature = {
    title: 'Enterprise Tools & Admin Console',
    description: 'Powerful organization-wide management and analytics designed for team leaders and admins. Monitor team productivity, manage user permissions, track adoption metrics, and ensure compliance.',
    expectedDate: 'Q2 2025',
  };

  // AI Insights with ENTERPRISE ANALYTICS VISUALIZATIONS
  // Research: Worklytics, Microsoft, Teramind - Enterprise productivity metrics
  const aiInsightsContent: AIInsightsContent = {
    title: 'Enterprise Analytics',
    mode: 'custom',
    customContent: (
      <div className="space-y-6">
        {/* 1. Organization Productivity Index */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Organization Productivity Index
          </h3>
          <OrganizationProductivityIndex />
        </div>

        {/* 2. Department Performance Comparison */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Department Performance
          </h3>
          <DepartmentPerformance />
        </div>

        {/* 3. Adoption & Usage Stats */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Platform Adoption
          </h3>
          <AdoptionUsageStats />
        </div>

        {/* 4. Meeting vs Focus Time */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Time Allocation (Org-wide)
          </h3>
          <MeetingVsFocusTime />
        </div>

        {/* 5. Goal Achievement Rate */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Strategic Initiatives
          </h3>
          <GoalAchievementRate />
        </div>
      </div>
    ),
  };

  const enterpriseStats = {
    totalUsers: 1247,
    activeUsers: 1089,
    departments: 12,
    teams: 47,
    licenseUsage: 87,
    monthlyActive: 94,
    avgProductivity: 89,
    costPerUser: 12.50,
  };

  const departments = [
    { name: 'Engineering', users: 342, activeRate: 96, productivity: 92 },
    { name: 'Sales', users: 189, activeRate: 91, productivity: 88 },
    { name: 'Marketing', users: 156, activeRate: 94, productivity: 90 },
    { name: 'Product', users: 127, activeRate: 98, productivity: 94 },
    { name: 'Support', users: 98, activeRate: 89, productivity: 87 },
    { name: 'HR', users: 67, activeRate: 92, productivity: 85 },
  ];

  const recentActivity = [
    { type: 'user_added', user: 'Sarah Chen', department: 'Engineering', time: '5 minutes ago' },
    { type: 'user_removed', user: 'John Doe', department: 'Sales', time: '1 hour ago' },
    { type: 'role_changed', user: 'Mike Smith', department: 'Product', time: '2 hours ago' },
    { type: 'security_alert', user: 'System', department: 'Security', time: '3 hours ago' },
  ];

  const securityMetrics = [
    { label: 'Two-Factor Auth', value: 94, status: 'good' },
    { label: 'SSO Enabled', value: 100, status: 'excellent' },
    { label: 'Password Strength', value: 87, status: 'good' },
    { label: 'Access Violations', value: 2, status: 'warning' },
  ];

  const complianceStatus = [
    { standard: 'GDPR', status: 'compliant', lastAudit: '2024-01-15' },
    { standard: 'SOC 2', status: 'compliant', lastAudit: '2024-02-01' },
    { standard: 'HIPAA', status: 'pending', lastAudit: '2024-03-10' },
    { standard: 'ISO 27001', status: 'compliant', lastAudit: '2023-12-20' },
  ];

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
          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl shadow-emerald-500/10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">
              Coming Soon
            </h2>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-xl">
                Enterprise Tools & Admin Console
              </p>
              
              <p className="text-base leading-relaxed">
                Powerful organization-wide management and analytics designed for team leaders 
                and admins. Monitor team productivity, manage user permissions, track adoption 
                metrics, and ensure compliance—all from a centralized enterprise dashboard with 
                advanced reporting and security controls.
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  User Management
                </Badge>
                <Badge variant="secondary" className="bg-teal-600/20 text-teal-300 border-teal-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Security & Compliance
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Analytics & ROI
                </Badge>
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                  <Building2 className="w-3 h-3 mr-1" />
                  Department Insights
                </Badge>
                <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                  <Lock className="w-3 h-3 mr-1" />
                  SSO & 2FA
                </Badge>
                <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
                  <FileText className="w-3 h-3 mr-1" />
                  Compliance Reports
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
            <h1 className="text-white mb-2">Enterprise Tools</h1>
            <p className="text-gray-400">Organization-wide management and analytics</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              data-nav="enterprise-settings"
              onClick={() => toast.info('Opening enterprise settings...')}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600" 
              data-nav="export-report"
              onClick={() => toast.success('Generating enterprise report...')}
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Total Users', 
              value: enterpriseStats.totalUsers.toLocaleString(), 
              change: '+12 this month',
              icon: Users, 
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10',
            },
            { 
              label: 'Active Rate', 
              value: `${enterpriseStats.monthlyActive}%`, 
              change: '+3% vs last month',
              icon: TrendingUp, 
              color: 'text-green-400',
              bgColor: 'bg-green-500/10',
            },
            { 
              label: 'License Usage', 
              value: `${enterpriseStats.licenseUsage}%`, 
              change: '1,089 / 1,250',
              icon: Key, 
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/10',
            },
            { 
              label: 'Cost Per User', 
              value: `$${enterpriseStats.costPerUser}`, 
              change: 'per month',
              icon: DollarSign, 
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
              <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
              <div className="text-xs text-gray-500">{metric.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            
            {/* Department Overview */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-white text-xl font-bold">Departments</h2>
                </div>
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {enterpriseStats.departments} Active
                </Badge>
              </div>

              <div className="space-y-4">
                {departments.map((dept, i) => (
                  <motion.div
                    key={dept.name}
                    className="bg-[#252830] border border-gray-700 rounded-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{dept.name}</h3>
                          <span className="text-gray-400 text-sm">{dept.users} users</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Active Rate</span>
                              <span className="text-white">{dept.activeRate}%</span>
                            </div>
                            {/* Blue - Trust & Reliability (Research: Joe Hallock study) */}
                            <Progress 
                              value={dept.activeRate} 
                              className="h-1.5 bg-blue-500/20" 
                              indicatorClassName="bg-blue-500"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Productivity</span>
                              <span className="text-white">{dept.productivity}%</span>
                            </div>
                            {/* Green - Growth & Performance (Research: Satyendra Singh study) */}
                            <Progress 
                              value={dept.productivity} 
                              className="h-1.5 bg-emerald-500/20" 
                              indicatorClassName="bg-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-white text-xl font-bold">Recent Activity</h2>
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'user_added' ? 'bg-green-500/10' :
                      activity.type === 'user_removed' ? 'bg-red-500/10' :
                      activity.type === 'role_changed' ? 'bg-blue-500/10' :
                      'bg-yellow-500/10'
                    }`}>
                      {activity.type === 'user_added' && <UserPlus className="w-4 h-4 text-green-400" />}
                      {activity.type === 'user_removed' && <UserMinus className="w-4 h-4 text-red-400" />}
                      {activity.type === 'role_changed' && <Users className="w-4 h-4 text-blue-400" />}
                      {activity.type === 'security_alert' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm">
                        {activity.type === 'user_added' && `${activity.user} joined ${activity.department}`}
                        {activity.type === 'user_removed' && `${activity.user} left ${activity.department}`}
                        {activity.type === 'role_changed' && `${activity.user} role updated in ${activity.department}`}
                        {activity.type === 'security_alert' && 'Security policy updated'}
                      </div>
                      <div className="text-gray-500 text-xs">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            
            {/* User Management */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h2 className="text-white text-xl font-bold">User Management</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600">
                    <UserPlus className="w-4 h-4" />
                    Add Users
                  </Button>
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Total Users</div>
                  <div className="text-2xl font-bold text-white">{enterpriseStats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-green-400 mt-1">+12 this month</div>
                </div>
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Active Users</div>
                  <div className="text-2xl font-bold text-white">{enterpriseStats.activeUsers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{enterpriseStats.monthlyActive}% active rate</div>
                </div>
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">License Usage</div>
                  <div className="text-2xl font-bold text-white">{enterpriseStats.licenseUsage}%</div>
                  {/* Research: Blue-cyan for high progress (87% is good usage) */}
                  <Progress value={enterpriseStats.licenseUsage} className="h-2 mt-2" indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
              </div>

              {/* User List Preview */}
              <div className="space-y-2">
                {[
                  { name: 'Sarah Chen', email: 'sarah@company.com', role: 'Admin', dept: 'Engineering', status: 'active' },
                  { name: 'Marcus Johnson', email: 'marcus@company.com', role: 'Manager', dept: 'Sales', status: 'active' },
                  { name: 'Elena Rodriguez', email: 'elena@company.com', role: 'User', dept: 'Marketing', status: 'active' },
                  { name: 'David Kim', email: 'david@company.com', role: 'User', dept: 'Product', status: 'inactive' },
                ].map((user, i) => (
                  <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-white text-sm">{user.role}</div>
                        <div className="text-gray-500 text-xs">{user.dept}</div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={user.status === 'active' ? 'border-green-400 text-green-400' : 'border-gray-400 text-gray-400'}
                      >
                        {user.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            
            {/* Security Overview */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-green-400" />
                <h2 className="text-white text-xl font-bold">Security Overview</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityMetrics.map((metric, i) => (
                  <motion.div
                    key={i}
                    className="bg-[#252830] border border-gray-700 rounded-lg p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">{metric.label}</span>
                      {metric.status === 'excellent' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      {metric.status === 'good' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                      {metric.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {metric.value}{metric.label !== 'Access Violations' && '%'}
                    </div>
                    {metric.label !== 'Access Violations' && (
                      <Progress 
                        value={metric.value} 
                        className={`h-2 ${
                          metric.status === 'excellent' ? 'bg-emerald-600/20' :
                          metric.status === 'good' ? 'bg-indigo-500/20' :
                          'bg-amber-500/20'
                        }`}
                        indicatorClassName={
                          metric.status === 'excellent' ? 'bg-emerald-600' :
                          metric.status === 'good' ? 'bg-indigo-500' :
                          'bg-amber-500'
                        }
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Compliance Status */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-purple-400" />
                <h2 className="text-white text-xl font-bold">Compliance Status</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complianceStatus.map((item, i) => (
                  <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{item.standard}</h3>
                      <Badge 
                        variant="outline"
                        className={
                          item.status === 'compliant' ? 'border-green-400 text-green-400' :
                          item.status === 'pending' ? 'border-yellow-400 text-yellow-400' :
                          'border-red-400 text-red-400'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Last audit: {new Date(item.lastAudit).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-yellow-400" />
                <h2 className="text-white text-xl font-bold">Security Features</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Key, label: 'SSO Integration', enabled: true },
                  { icon: Shield, label: 'Two-Factor Auth', enabled: true },
                  { icon: Lock, label: 'Encryption at Rest', enabled: true },
                  { icon: Eye, label: 'Audit Logging', enabled: true },
                  { icon: Server, label: 'IP Whitelisting', enabled: false },
                  { icon: Database, label: 'Data Backup', enabled: true },
                ].map((feature, i) => (
                  <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg ${
                        feature.enabled ? 'bg-green-500/10' : 'bg-gray-500/10'
                      } flex items-center justify-center`}>
                        <feature.icon className={`w-5 h-5 ${
                          feature.enabled ? 'text-green-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{feature.label}</div>
                        <Badge 
                          variant="outline"
                          className={`text-xs mt-1 ${
                            feature.enabled ? 'border-green-400 text-green-400' : 'border-gray-400 text-gray-400'
                          }`}
                        >
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            
            {/* ROI Analysis */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h2 className="text-white text-xl font-bold">ROI Analysis</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Monthly Cost</div>
                  <div className="text-2xl font-bold text-white">$15,625</div>
                  <div className="text-xs text-gray-500 mt-1">$12.50 per user</div>
                </div>
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Productivity Gain</div>
                  <div className="text-2xl font-bold text-green-400">+23%</div>
                  <div className="text-xs text-gray-500 mt-1">vs before adoption</div>
                </div>
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">ROI</div>
                  <div className="text-2xl font-bold text-green-400">340%</div>
                  <div className="text-xs text-gray-500 mt-1">annual return</div>
                </div>
              </div>
            </div>

            {/* Usage Analytics */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="text-white text-xl font-bold">Usage Analytics</h2>
              </div>

              <div className="space-y-4">
                {[
                  { feature: 'Task Management', usage: 94, users: 1174 },
                  { feature: 'Calendar', usage: 87, users: 1085 },
                  { feature: 'Team Collaboration', usage: 76, users: 948 },
                  { feature: 'AI Assistant', usage: 68, users: 848 },
                  { feature: 'Analytics', usage: 45, users: 561 },
                ].map((item, i) => {
                  // Research-based color psychology for progress bars
                  const getProgressColor = (usage: number) => {
                    if (usage >= 85) return 'bg-gradient-to-r from-blue-500 to-cyan-400'; // High progress
                    if (usage >= 70) return 'bg-gradient-to-r from-amber-500 to-yellow-400'; // Moderate
                    if (usage >= 50) return 'bg-gradient-to-r from-orange-500 to-amber-400'; // Warning
                    return 'bg-gradient-to-r from-red-500 to-orange-400'; // Urgent/needs attention
                  };
                  
                  return (
                    <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{item.feature}</span>
                        <span className="text-gray-400 text-sm">{item.users} users</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={item.usage} 
                          className="flex-1 h-2" 
                          indicatorClassName={getProgressColor(item.usage)}
                        />
                        <span className="text-white text-sm font-medium w-12 text-right">{item.usage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </TabsContent>
        </Tabs>

      </div>

    </DashboardLayout>
  );
}