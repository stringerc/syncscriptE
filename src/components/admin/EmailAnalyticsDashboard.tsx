// =====================================================================
// EMAIL ANALYTICS DASHBOARD
// Advanced email metrics, campaign performance, and subscriber insights
// =====================================================================

import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmailSubscriber {
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  segments: string[];
  metadata: {
    goals_completed?: number;
    tasks_completed?: number;
    energy_points?: number;
  };
}

interface CampaignStats {
  campaign: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  benchmarks: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
}

export function EmailAnalyticsDashboard() {
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'subscribers'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load subscribers
      const subsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/admin/subscribers`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (subsResponse.ok) {
        const data = await subsResponse.json();
        setSubscribers(data.subscribers || []);
      }
      
      // Load beta welcome campaign stats
      const campaignResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/campaign/beta_welcome_sequence/analytics`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (campaignResponse.ok) {
        const data = await campaignResponse.json();
        setCampaignStats(data);
      }
      
    } catch (error) {
      console.error('[Email Analytics] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
    bounced: subscribers.filter(s => s.status === 'bounced').length
  };

  // Segment distribution
  const segmentCounts: Record<string, number> = {};
  subscribers.forEach(sub => {
    sub.segments.forEach(segment => {
      segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
    });
  });

  const segmentData = Object.entries(segmentCounts).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-purple-300">Loading email analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-200 mb-2">📊 Email Analytics</h1>
        <p className="text-purple-300/70">Monitor your email campaigns and subscriber engagement</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'campaigns', 'subscribers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6">
              <div className="text-purple-400 text-sm font-medium mb-2">Total Subscribers</div>
              <div className="text-3xl font-bold text-purple-200">{stats.total}</div>
              <div className="text-purple-300/60 text-xs mt-1">All time</div>
            </div>
            
            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6">
              <div className="text-green-400 text-sm font-medium mb-2">Active</div>
              <div className="text-3xl font-bold text-green-200">{stats.active}</div>
              <div className="text-green-300/60 text-xs mt-1">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
              </div>
            </div>
            
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6">
              <div className="text-red-400 text-sm font-medium mb-2">Unsubscribed</div>
              <div className="text-3xl font-bold text-red-200">{stats.unsubscribed}</div>
              <div className="text-red-300/60 text-xs mt-1">
                {stats.total > 0 ? Math.round((stats.unsubscribed / stats.total) * 100) : 0}% churn
              </div>
            </div>
            
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-6">
              <div className="text-yellow-400 text-sm font-medium mb-2">Bounced</div>
              <div className="text-3xl font-bold text-yellow-200">{stats.bounced}</div>
              <div className="text-yellow-300/60 text-xs mt-1">Invalid emails</div>
            </div>
          </div>

          {/* Segment Distribution */}
          {segmentData.length > 0 && (
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Subscriber Segments</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Campaign Performance */}
          {campaignStats && (
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-200 mb-4">
                Campaign: {campaignStats.campaign.name}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-purple-400 text-xs mb-1">Sent</div>
                  <div className="text-2xl font-bold text-purple-200">{campaignStats.stats.sent}</div>
                </div>
                <div>
                  <div className="text-blue-400 text-xs mb-1">Opened</div>
                  <div className="text-2xl font-bold text-blue-200">{campaignStats.stats.opened}</div>
                  <div className="text-blue-300/60 text-xs">{campaignStats.rates.openRate}% rate</div>
                </div>
                <div>
                  <div className="text-green-400 text-xs mb-1">Clicked</div>
                  <div className="text-2xl font-bold text-green-200">{campaignStats.stats.clicked}</div>
                  <div className="text-green-300/60 text-xs">{campaignStats.rates.clickRate}% rate</div>
                </div>
                <div>
                  <div className="text-yellow-400 text-xs mb-1">Unsubscribed</div>
                  <div className="text-2xl font-bold text-yellow-200">{campaignStats.stats.unsubscribed}</div>
                  <div className="text-yellow-300/60 text-xs">{campaignStats.rates.unsubscribeRate}% rate</div>
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-300">Open Rate</span>
                    <span className="text-purple-200">
                      {campaignStats.rates.openRate}% 
                      {campaignStats.rates.openRate >= campaignStats.benchmarks.openRate && (
                        <span className="text-green-400 ml-2">✓ Above benchmark</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-purple-900/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(campaignStats.rates.openRate * 3, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-purple-300/50 mt-1">
                    Industry avg: {campaignStats.benchmarks.openRate}%
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-300">Click Rate</span>
                    <span className="text-purple-200">
                      {campaignStats.rates.clickRate}%
                      {campaignStats.rates.clickRate >= campaignStats.benchmarks.clickRate && (
                        <span className="text-green-400 ml-2">✓ Above benchmark</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-purple-900/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(campaignStats.rates.clickRate * 20, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-purple-300/50 mt-1">
                    Industry avg: {campaignStats.benchmarks.clickRate}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-purple-200 mb-4">Active Campaigns</h3>
            
            {campaignStats ? (
              <div className="space-y-4">
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-200">{campaignStats.campaign.name}</h4>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                      {campaignStats.campaign.status}
                    </span>
                  </div>
                  <div className="text-sm text-purple-300/70 mb-3">
                    Type: {campaignStats.campaign.type}
                  </div>
                  <div className="grid grid-cols-5 gap-3 text-xs">
                    <div>
                      <div className="text-purple-400">Sent</div>
                      <div className="font-semibold text-purple-200">{campaignStats.stats.sent}</div>
                    </div>
                    <div>
                      <div className="text-blue-400">Opens</div>
                      <div className="font-semibold text-blue-200">{campaignStats.rates.openRate}%</div>
                    </div>
                    <div>
                      <div className="text-green-400">Clicks</div>
                      <div className="font-semibold text-green-200">{campaignStats.rates.clickRate}%</div>
                    </div>
                    <div>
                      <div className="text-red-400">Bounces</div>
                      <div className="font-semibold text-red-200">{campaignStats.rates.bounceRate}%</div>
                    </div>
                    <div>
                      <div className="text-yellow-400">Unsubs</div>
                      <div className="font-semibold text-yellow-200">{campaignStats.rates.unsubscribeRate}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-purple-300/50 text-center py-8">
                No campaign data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-purple-500/30">
            <h3 className="text-lg font-semibold text-purple-200">All Subscribers ({subscribers.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-300">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-300">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-300">Segments</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-300">Goals</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-300">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {subscribers.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-purple-900/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-purple-200">{sub.email}</td>
                    <td className="px-4 py-3 text-sm text-purple-300">{sub.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sub.status === 'active' ? 'bg-green-500/20 text-green-300' :
                        sub.status === 'unsubscribed' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sub.segments.map((seg, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                            {seg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-300">
                      {sub.metadata.goals_completed || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-300">
                      {new Date(sub.subscribed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadAnalytics}
        className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        🔄 Refresh Data
      </button>
    </div>
  );
}
