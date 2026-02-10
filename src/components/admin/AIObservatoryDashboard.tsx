/**
 * AI Observatory Dashboard - Production-Grade Monitoring UI
 * 
 * Comprehensive real-time monitoring of all 11 AI skills across 6 agents
 * Provides visibility into costs, performance, and optimization opportunities
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Activity,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  Brain,
  Database,
  RefreshCw,
  Download,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// ============================================================================
// TYPES
// ============================================================================

interface ObservatoryStats {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  
  mistral: {
    requests: number;
    cost: number;
    avgLatency: number;
    successRate: number;
  };
  
  deepseek: {
    requests: number;
    cost: number;
    avgLatency: number;
    successRate: number;
  };
  
  skillBreakdown: Record<string, {
    requests: number;
    cost: number;
    avgLatency: number;
    successRate: number;
  }>;
  
  cacheHitRate: number;
  cacheSavings: number;
  
  last5Minutes: Partial<ObservatoryStats>;
  last1Hour: Partial<ObservatoryStats>;
  last24Hours: Partial<ObservatoryStats>;
  last7Days: Partial<ObservatoryStats>;
}

interface Alert {
  type: string;
  message: string;
  timestamp: number;
}

interface CostProjection {
  daily: number;
  monthly: number;
  yearly: number;
  dailySavingsFromCache: number;
  monthlySavingsFromCache: number;
  yearlySavingsFromCache: number;
}

interface RouterStats {
  totalRoutes: number;
  mistralRoutes: number;
  deepseekRoutes: number;
  totalCostSaved: number;
  averageConfidence: number;
  mistralPercentage: number;
  deepseekPercentage: number;
  avgCostSavingsPerRequest: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AIObservatoryDashboard() {
  const [stats, setStats] = useState<ObservatoryStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [costProjection, setCostProjection] = useState<CostProjection | null>(null);
  const [routerStats, setRouterStats] = useState<RouterStats | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [contextStats, setContextStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'5m' | '1h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchData = async () => {
    try {
      // Fetch observatory stats
      const statsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/ai/observatory/stats?period=${period}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch alerts
      const alertsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/ai/observatory/alerts`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      // Fetch cost projection
      const costRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/ai/observatory/cost-projection`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (costRes.ok) {
        const costData = await costRes.json();
        setCostProjection(costData.projection);
      }

      // Fetch router stats
      const routerRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/ai/router/stats`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (routerRes.ok) {
        const routerData = await routerRes.json();
        setRouterStats(routerData.stats);
      }

      // Fetch cache stats
      const cacheRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/ai/cache/stats`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        setCacheStats(cacheData.stats);
      }

      // Fetch context optimizer stats
      const contextRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/ai/context/stats`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (contextRes.ok) {
        const contextData = await contextRes.json();
        setContextStats(contextData.stats);
      }

    } catch (error) {
      console.error('[Observatory] Error fetching data:', error);
      toast.error('Failed to fetch observatory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, period]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(4)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatLatency = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-zinc-400">Loading AI Observatory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">AI Observatory</h1>
          <p className="text-zinc-400 mt-1">
            Real-time monitoring of all AI systems
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Auto-refresh:</span>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['5m', '1h', '24h', '7d'] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === '5m' ? 'Last 5 min' : p === '1h' ? 'Last hour' : p === '24h' ? 'Last 24h' : 'Last 7 days'}
          </Button>
        ))}
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-100 mb-2">Active Alerts ({alerts.length})</h3>
              <div className="space-y-1">
                {alerts.slice(0, 3).map((alert, i) => (
                  <p key={i} className="text-sm text-orange-200">{alert.message}</p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Total Requests</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats?.totalRequests.toLocaleString() || 0}</div>
          <p className="text-xs text-zinc-500 mt-1">
            {formatPercentage(stats?.successRate || 0)} success rate
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Total Cost</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{formatCurrency(stats?.totalCost || 0)}</div>
          <p className="text-xs text-green-400 mt-1">
            {formatCurrency(stats?.cacheSavings || 0)} saved by cache
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Avg Latency</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{formatLatency(stats?.averageLatency || 0)}</div>
          <p className="text-xs text-zinc-500 mt-1">
            Response time
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Cache Hit Rate</span>
            <Database className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{formatPercentage(stats?.cacheHitRate || 0)}</div>
          <p className="text-xs text-cyan-400 mt-1">
            {cacheStats?.totalHits || 0} hits
          </p>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model Comparison */}
            <Card className="p-4">
              <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Model Performance
              </h3>
              
              <div className="space-y-4">
                {/* Mistral */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-300">Mistral (Creative)</span>
                    <Badge variant="outline">{stats?.mistral?.requests || 0} requests</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-500">Cost</p>
                      <p className="text-zinc-100 font-medium">{formatCurrency(stats?.mistral?.cost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Latency</p>
                      <p className="text-zinc-100 font-medium">{formatLatency(stats?.mistral?.avgLatency || 0)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Success</p>
                      <p className="text-zinc-100 font-medium">{formatPercentage(stats?.mistral?.successRate || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* DeepSeek */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-300">DeepSeek (Structured)</span>
                    <Badge variant="outline">{stats?.deepseek?.requests || 0} requests</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-500">Cost</p>
                      <p className="text-green-400 font-medium">{formatCurrency(stats?.deepseek?.cost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Latency</p>
                      <p className="text-zinc-100 font-medium">{formatLatency(stats?.deepseek?.avgLatency || 0)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Success</p>
                      <p className="text-zinc-100 font-medium">{formatPercentage(stats?.deepseek?.successRate || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Router Efficiency */}
            <Card className="p-4">
              <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Router Efficiency
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">DeepSeek (cheaper)</span>
                    <span className="text-green-400">{formatPercentage(routerStats?.deepseekPercentage || 0)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${routerStats?.deepseekPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Mistral (quality)</span>
                    <span className="text-blue-400">{formatPercentage(routerStats?.mistralPercentage || 0)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${routerStats?.mistralPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Total Cost Saved</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(routerStats?.totalCostSaved || 0)}</p>
                  <p className="text-xs text-zinc-500">{formatCurrency(routerStats?.avgCostSavingsPerRequest || 0)} per request</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold text-zinc-100 mb-4">Mistral Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Requests</span>
                  <span className="text-zinc-100 font-medium">{stats?.mistral?.requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className="text-zinc-100 font-medium">{formatPercentage(stats?.mistral?.successRate || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Avg Latency</span>
                  <span className="text-zinc-100 font-medium">{formatLatency(stats?.mistral?.avgLatency || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Cost</span>
                  <span className="text-zinc-100 font-medium">{formatCurrency(stats?.mistral?.cost || 0)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-zinc-100 mb-4">DeepSeek Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Requests</span>
                  <span className="text-zinc-100 font-medium">{stats?.deepseek?.requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className="text-zinc-100 font-medium">{formatPercentage(stats?.deepseek?.successRate || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Avg Latency</span>
                  <span className="text-zinc-100 font-medium">{formatLatency(stats?.deepseek?.avgLatency || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Cost</span>
                  <span className="text-green-400 font-medium">{formatCurrency(stats?.deepseek?.cost || 0)}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">Skills Performance Breakdown</h3>
            <div className="space-y-3">
              {stats?.skillBreakdown && Object.entries(stats.skillBreakdown).map(([skillName, skillStats]) => (
                <div key={skillName} className="border border-zinc-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-200">{skillName}</span>
                    <Badge variant="outline">{skillStats.requests} requests</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-500">Cost</p>
                      <p className="text-zinc-100">{formatCurrency(skillStats.cost)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Latency</p>
                      <p className="text-zinc-100">{formatLatency(skillStats.avgLatency)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Success</p>
                      <p className="text-zinc-100">{formatPercentage(skillStats.successRate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Daily Projection</h3>
              <p className="text-3xl font-bold text-zinc-100">{formatCurrency(costProjection?.daily || 0)}</p>
              <p className="text-xs text-green-400 mt-1">
                {formatCurrency(costProjection?.dailySavingsFromCache || 0)} saved
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Monthly Projection</h3>
              <p className="text-3xl font-bold text-zinc-100">{formatCurrency(costProjection?.monthly || 0)}</p>
              <p className="text-xs text-green-400 mt-1">
                {formatCurrency(costProjection?.monthlySavingsFromCache || 0)} saved
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Yearly Projection</h3>
              <p className="text-3xl font-bold text-zinc-100">{formatCurrency(costProjection?.yearly || 0)}</p>
              <p className="text-xs text-green-400 mt-1">
                {formatCurrency(costProjection?.yearlySavingsFromCache || 0)} saved
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold text-zinc-100 mb-4">Cache Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Entries</span>
                  <span className="text-zinc-100 font-medium">{cacheStats?.totalEntries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Hit Rate</span>
                  <span className="text-green-400 font-medium">{formatPercentage(cacheStats?.hitRate || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Cost Saved</span>
                  <span className="text-green-400 font-medium">{formatCurrency(cacheStats?.totalCostSaved || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Avg Hit Latency</span>
                  <span className="text-zinc-100 font-medium">{formatLatency(cacheStats?.averageHitLatency || 50)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-zinc-100 mb-4">Top Cached Queries</h3>
              <div className="space-y-2">
                {cacheStats?.topQueries?.slice(0, 5).map((query: any, i: number) => (
                  <div key={i} className="text-xs">
                    <p className="text-zinc-300 truncate">{query.query}</p>
                    <p className="text-zinc-500">{query.hits} hits • {formatCurrency(query.costSaved)} saved</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">Context Optimization</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Optimizations</span>
                <span className="text-zinc-100 font-medium">{contextStats?.totalOptimizations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Tokens Saved</span>
                <span className="text-green-400 font-medium">{contextStats?.totalTokensSaved?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Avg Savings %</span>
                <span className="text-green-400 font-medium">{formatPercentage(contextStats?.averageSavingsPercentage || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Quality Score</span>
                <span className="text-zinc-100 font-medium">{(contextStats?.averageQualityScore * 100 || 0).toFixed(0)}%</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
