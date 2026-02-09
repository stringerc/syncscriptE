import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Link2, Check, X, AlertCircle, RefreshCw, Settings,
  Calendar, Mail, MessageSquare, Video, Heart, Dumbbell,
  FileText, Trello, GitBranch, Slack, Clock, Zap,
  Cloud, Database, Lock, Unlock, TrendingUp, Activity, Download
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSectionOriginal';
import { toast } from 'sonner@2.0.3';
import { OAuthConnector, OAUTH_PROVIDERS } from '../integrations/OAuthConnector';
import { CalendarImportDialog } from '../integrations/CalendarImportDialog';
import { SetupStatusBanner } from '../integrations/SetupStatusBanner';
import {
  IntegrationUsagePie,
  SyncSuccessRate,
  AutomatedVsManual,
  IntegrationLatency,
  IntegrationRecommendations
} from '../IntegrationVisualizations';

export function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProvider, setImportProvider] = useState<'google_calendar' | 'outlook_calendar'>('google_calendar');

  const handleImportClick = (provider: 'google_calendar' | 'outlook_calendar') => {
    setImportProvider(provider);
    setShowImportDialog(true);
  };

  // AI Insights with INTEGRATION USAGE & HEALTH VISUALIZATIONS
  // Research: Platform monitoring best practices (Moesif, DreamFactory)
  const aiInsightsContent: AIInsightsContent = {
    title: 'Integration Health',
    mode: 'custom',
    customContent: (
      <div className="space-y-6">
        {/* 1. Integration Usage Pie Chart */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Usage by Source
          </h3>
          <IntegrationUsagePie
            integrations={[
              { name: 'Gmail', percentage: 40, count: 156, color: '#ef4444' },
              { name: 'Slack', percentage: 35, count: 137, color: '#3b82f6' },
              { name: 'Calendar', percentage: 25, count: 98, color: '#10b981' },
              { name: 'Notion', percentage: 0, count: 0, color: '#a855f7' },
            ]}
          />
        </div>

        {/* 2. Sync Success Rate Gauge */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Sync Health
          </h3>
          <SyncSuccessRate
            successRate={99.5}
            totalSyncs={2847}
            failedSyncs={14}
            periodDays={7}
          />
        </div>

        {/* 3. Automated vs Manual Tasks */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Automation Impact
          </h3>
          <AutomatedVsManual
            weeklyData={[
              { week: 'W1', automated: 42, manual: 18 },
              { week: 'W2', automated: 48, manual: 15 },
              { week: 'W3', automated: 55, manual: 12 },
              { week: 'W4', automated: 52, manual: 14 },
              { week: 'W5', automated: 58, manual: 11 },
              { week: 'W6', automated: 61, manual: 10 },
              { week: 'W7', automated: 64, manual: 9 },
              { week: 'W8', automated: 67, manual: 8 },
            ]}
          />
        </div>

        {/* 4. Integration Latency */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Response Times
          </h3>
          <IntegrationLatency
            integrationData={[
              { name: 'Gmail', avgLatency: 245, trend: 'stable' },
              { name: 'Slack', avgLatency: 180, trend: 'down' },
              { name: 'Google Calendar', avgLatency: 310, trend: 'stable' },
              { name: 'Notion', avgLatency: 420, trend: 'up' },
            ]}
          />
        </div>

        {/* 5. New Integration Recommendations */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Suggested Integrations
          </h3>
          <IntegrationRecommendations
            recommendations={[
              {
                name: 'Zoom',
                icon: '📹',
                reason: 'You schedule many meetings. Auto-capture meeting notes and action items.',
                estimatedBenefit: '+30% efficiency',
                confidence: 92,
              },
              {
                name: 'Asana',
                icon: '✅',
                reason: 'Sync project tasks automatically. Teams with project trackers complete 15% more tasks on time.',
                estimatedBenefit: '+15% completion',
                confidence: 85,
              },
              {
                name: 'Trello',
                icon: '📋',
                reason: 'Visualize workflows and sync cards as tasks seamlessly.',
                estimatedBenefit: '+20% organization',
                confidence: 78,
              },
            ]}
          />
        </div>
      </div>
    ),
  };

  const integrations = [
    {
      id: 1,
      name: 'Google Calendar',
      category: 'calendar',
      description: 'Sync events and tasks with Google Calendar',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      connected: true,
      lastSync: '2 minutes ago',
      status: 'active',
      dataPoints: 1247,
      mode: 'hybrid' as const,
      hasUpdates: true,
      updateCount: 3,
    },
    {
      id: 2,
      name: 'Slack',
      category: 'communication',
      description: 'Team communication and notifications',
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      connected: true,
      lastSync: '5 minutes ago',
      status: 'active',
      dataPoints: 892,
      mode: 'push' as const,
      hasUpdates: true,
      updateCount: 5,
    },
    {
      id: 3,
      name: 'Gmail',
      category: 'communication',
      description: 'Email integration and task creation',
      icon: Mail,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      connected: true,
      lastSync: '1 hour ago',
      status: 'syncing',
      dataPoints: 2134,
      mode: 'pull' as const,
      hasUpdates: false,
      updateCount: 0,
    },
    {
      id: 4,
      name: 'Zoom',
      category: 'communication',
      description: 'Video meetings and calendar sync',
      icon: Video,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
      connected: false,
      lastSync: null,
      status: 'disconnected',
      dataPoints: 0,
      mode: 'hybrid' as const,
      hasUpdates: false,
      updateCount: 0,
    },
    {
      id: 5,
      name: 'Apple Health',
      category: 'health',
      description: 'Fitness and wellness data tracking',
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      connected: true,
      lastSync: '10 minutes ago',
      status: 'active',
      dataPoints: 567,
      mode: 'push' as const,
      hasUpdates: false,
      updateCount: 0,
    },
    {
      id: 6,
      name: 'Google Fit',
      category: 'health',
      description: 'Activity and health monitoring',
      icon: Dumbbell,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      connected: true,
      lastSync: '15 minutes ago',
      status: 'active',
      dataPoints: 445,
      mode: 'hybrid' as const,
      hasUpdates: true,
      updateCount: 2,
    },
    {
      id: 7,
      name: 'Notion',
      category: 'productivity',
      description: 'Note-taking and knowledge management',
      icon: FileText,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      connected: false,
      lastSync: null,
      status: 'disconnected',
      dataPoints: 0,
      mode: 'hybrid' as const,
      hasUpdates: false,
      updateCount: 0,
    },
    {
      id: 8,
      name: 'Trello',
      category: 'productivity',
      description: 'Project management and task boards',
      icon: Trello,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      connected: false,
      lastSync: null,
      status: 'disconnected',
      dataPoints: 0,
      mode: 'pull' as const,
      hasUpdates: false,
      updateCount: 0,
    },
    {
      id: 9,
      name: 'GitHub',
      category: 'productivity',
      description: 'Code repository and issue tracking',
      icon: GitBranch,
      color: 'text-gray-300',
      bgColor: 'bg-gray-300/10',
      connected: true,
      lastSync: '30 minutes ago',
      status: 'warning',
      dataPoints: 328,
      mode: 'push' as const,
      hasUpdates: true,
      updateCount: 7,
    },
  ];

  const categories = [
    { id: 'all', label: 'All Integrations', count: integrations.length },
    { id: 'calendar', label: 'Calendar', count: integrations.filter(i => i.category === 'calendar').length },
    { id: 'communication', label: 'Communication', count: integrations.filter(i => i.category === 'communication').length },
    { id: 'health', label: 'Health & Wellness', count: integrations.filter(i => i.category === 'health').length },
    { id: 'productivity', label: 'Productivity', count: integrations.filter(i => i.category === 'productivity').length },
  ];

  const connectedCount = integrations.filter(i => i.connected).length;
  const activeCount = integrations.filter(i => i.status === 'active').length;
  const totalDataPoints = integrations.reduce((sum, i) => sum + i.dataPoints, 0);

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 border-green-400';
      case 'syncing': return 'text-blue-400 border-blue-400';
      case 'warning': return 'text-yellow-400 border-yellow-400';
      case 'error': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      <div className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Integrations</h1>
            <p className="text-gray-400">Connect with 500+ apps and services</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              data-nav="integration-settings"
              onClick={() => toast.info('Opening integration settings...')}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600" 
              data-nav="browse-integrations"
              onClick={() => toast.info('Opening integration marketplace...')}
            >
              <Link2 className="w-4 h-4" />
              Browse All
            </Button>
          </div>
        </div>

        {/* Integration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Connected', 
              value: connectedCount, 
              total: integrations.length,
              icon: Link2, 
              color: 'text-teal-400',
              bgColor: 'bg-teal-500/10',
            },
            { 
              label: 'Active', 
              value: activeCount, 
              total: connectedCount,
              icon: Activity, 
              color: 'text-green-400',
              bgColor: 'bg-green-500/10',
            },
            { 
              label: 'Data Synced', 
              value: `${(totalDataPoints / 1000).toFixed(1)}K`, 
              total: '',
              icon: Database, 
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10',
            },
            { 
              label: 'Last Sync', 
              value: '2m', 
              total: 'ago',
              icon: RefreshCw, 
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/10',
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-[#1e2128] border border-gray-800 rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">
                {stat.value}
                {stat.total && <span className="text-gray-500 text-lg">/{stat.total}</span>}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#252830] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.label}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Setup Status Banner (show if OAuth not configured) */}
        <SetupStatusBanner />

        {/* OAuth Integrations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold mb-1">Connected Integrations</h2>
              <p className="text-gray-400 text-sm">Manage your connected accounts and sync settings</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleImportClick('google_calendar')}
            >
              <Download className="w-4 h-4" />
              Import Events
            </Button>
          </div>

          {/* Google Calendar OAuth */}
          <OAuthConnector 
            provider={OAUTH_PROVIDERS.google_calendar}
            onConnectionChange={(connected) => {
              if (connected) {
                toast.success('Google Calendar connected! You can now import events.');
              }
            }}
          />

          {/* Outlook Calendar OAuth */}
          <OAuthConnector 
            provider={OAUTH_PROVIDERS.outlook_calendar}
            onConnectionChange={(connected) => {
              if (connected) {
                toast.success('Outlook Calendar connected! You can now import events.');
              }
            }}
          />

          {/* Slack OAuth */}
          <OAuthConnector 
            provider={OAUTH_PROVIDERS.slack}
            onConnectionChange={(connected) => {
              if (connected) {
                toast.success('Slack connected! Notifications will now sync automatically.');
              }
            }}
          />
        </div>

        {/* Other Integrations (Coming Soon) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-white text-xl font-bold mb-1">More Integrations</h2>
            <p className="text-gray-400 text-sm">Additional integrations coming soon</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter(i => !['Google Calendar', 'Slack'].includes(i.name))
              .map((integration, i) => (
              <motion.div
                key={integration.id}
                className={`bg-[#1e2128] border rounded-xl p-5 ${
                  integration.connected ? 'border-gray-700' : 'border-gray-800'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${integration.bgColor} flex items-center justify-center relative`}>
                      <integration.icon className={`w-6 h-6 ${integration.color}`} />
                      {/* Red dot for push/hybrid with updates */}
                      {integration.connected && 
                       (integration.mode === 'push' || integration.mode === 'hybrid') && 
                       integration.hasUpdates && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1e2128] animate-pulse">
                          <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium flex items-center gap-2">
                        {integration.name}
                        {integration.connected && integration.hasUpdates && integration.updateCount > 0 && (
                          <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                            {integration.updateCount} new
                          </Badge>
                        )}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-1 ${getStatusColor(integration.status)}`}
                      >
                        {integration.status}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-800 text-gray-400 text-xs">
                    Coming Soon
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4">
                  {integration.description}
                </p>

                {/* Stats */}
                {integration.connected && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Last Sync</span>
                      <span className="text-white">{integration.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Data Points</span>
                      <span className="text-white">{integration.dataPoints.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2" 
                    variant="outline"
                    disabled
                  >
                    <Link2 className="w-3 h-3" />
                    Coming Soon
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              <h2 className="text-white text-xl font-bold">Sync Status</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                toast.success('Refreshing all integrations...');
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh All
            </Button>
          </div>

          <div className="space-y-3">
            {integrations.filter(i => i.connected).map((integration, i) => (
              <div key={integration.id} className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${integration.bgColor} flex items-center justify-center`}>
                      <integration.icon className={`w-4 h-4 ${integration.color}`} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{integration.name}</div>
                      <div className="text-xs text-gray-500">Last sync: {integration.lastSync}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.status === 'active' && (
                      <Badge variant="outline" className="border-green-400 text-green-400">
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {integration.status === 'syncing' && (
                      <Badge variant="outline" className="border-blue-400 text-blue-400">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Syncing
                      </Badge>
                    )}
                    {integration.status === 'warning' && (
                      <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Warning
                      </Badge>
                    )}
                  </div>
                </div>

                {integration.status === 'syncing' && (
                  <div className="mt-3">
                    <Progress 
                      value={65} 
                      className="h-2" 
                      indicatorClassName="bg-gradient-to-r from-cyan-500 to-blue-400"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>Syncing...</span>
                      <span>65%</span>
                    </div>
                  </div>
                )}

                {integration.status === 'warning' && (
                  <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-xs text-yellow-400">
                    Rate limit reached. Next sync in 2 hours.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* API Access */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-purple-400" />
            <h2 className="text-white text-xl font-bold">API & Webhooks</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">API Access</h3>
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Build custom integrations with our REST API
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Documentation
              </Button>
            </div>

            <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Webhooks</h3>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Receive real-time notifications for events
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Configure Webhooks
              </Button>
            </div>
          </div>
        </div>

        {/* Import Dialog */}
        {showImportDialog && (
          <CalendarImportDialog
            provider={importProvider}
            onClose={() => setShowImportDialog(false)}
          />
        )}

      </div>
    </DashboardLayout>
  );
}