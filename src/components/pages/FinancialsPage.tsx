import { useMemo, useState } from 'react';
import { AlertTriangle, BrainCircuit, DollarSign, FileText, ShieldCheck, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useOpenClaw } from '../../contexts/OpenClawContext';
import { useRevenueAnalytics } from '../../hooks/useRevenueAnalytics';
import { calculateRevenueImpact } from '../RevenueOptimizer';
import { useTasks } from '../../hooks/useTasks';
import { useFinancialIntelligence } from '../../hooks/useFinancialIntelligence';
import { InvoiceDashboard } from '../InvoiceDashboard';
import { InvoiceFormModal } from '../InvoiceFormModal';
import type { Invoice } from '../../hooks/useInvoices';
import { PlaidConnectCard } from '../PlaidConnectCard';
import { BenchmarkOptInCard } from '../BenchmarkOptInCard';
import { RecurringInvoicesPanel } from '../RecurringInvoicesPanel';
import { useBiometricSummary } from '../../hooks/useBiometricSummary';
import { usePlaidSnapshot } from '../../hooks/usePlaidSnapshot';

type GrowthMode = 'stable' | 'aggressive';

export function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'invoices'>('invoices');
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0);
  const [visitors, setVisitors] = useState(2400);
  const [conversionRate, setConversionRate] = useState(2.8);
  const [price, setPrice] = useState(49);
  const [growthMode, setGrowthMode] = useState<GrowthMode>('aggressive');
  const [financialBrief, setFinancialBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [riskScanLoading, setRiskScanLoading] = useState(false);
  const [actionItems, setActionItems] = useState<any[]>([]);

  const { sendMessage, getTaskSuggestions, generateProactiveInsights, isInitialized } = useOpenClaw();
  const { trackRevenueEvent, getUpgradeProbability } = useRevenueAnalytics();
  const { createTask } = useTasks();
  const { accounts, snapshot, anomalies, cashflowSeries, upcomingObligations } = useFinancialIntelligence();
  const biometric = useBiometricSummary();
  const plaidLive = usePlaidSnapshot();

  const baseline = useMemo(
    () => calculateRevenueImpact({ visitors, conversionRate, price, optimizeConversion: false }),
    [visitors, conversionRate, price],
  );
  const optimized = useMemo(
    () =>
      calculateRevenueImpact({
        visitors,
        conversionRate: growthMode === 'aggressive' ? conversionRate : Math.max(1, conversionRate - 0.6),
        price,
        optimizeConversion: true,
      }),
    [visitors, conversionRate, price, growthMode],
  );

  const annualDelta = Math.max(0, (optimized.revenue - baseline.revenue) * 12);
  const usageProxy = Math.min(100, Math.max(0, Math.round((optimized.units / Math.max(1, visitors)) * 1000)));
  const upgradeProbability = Math.round(getUpgradeProbability(usageProxy, 'lite') * 100);

  const runFinancialBrief = async () => {
    setBriefLoading(true);
    try {
      const context = {
        source: 'financials',
        visitors,
        conversionRate,
        price,
        growthMode,
        baselineMRR: baseline.revenue,
        optimizedMRR: optimized.revenue,
        annualDelta,
        upgradeProbability,
        totalCash: snapshot.totalCash,
        runwayMonths: snapshot.runwayMonths,
        monthlyInflow: snapshot.monthlyInflow,
        monthlyOutflow: snapshot.monthlyOutflow,
        anomalies: anomalies.map((a) => ({ severity: a.severity, title: a.title })),
      };

      let brief = [
        '- Focus on conversion quality before pure traffic spend.',
        `- Current modeled MRR: $${baseline.revenue.toLocaleString()}; optimized MRR: $${optimized.revenue.toLocaleString()}.`,
        `- Estimated annual upside: $${annualDelta.toLocaleString()}.`,
        '- Next move: run one pricing + onboarding experiment this week.',
      ].join('\n');

      if (isInitialized) {
        const ai = await sendMessage({
          message: `You are a CFO copilot. Create a concise financial operating brief with priorities, risks, and weekly execution plan.
Visitors: ${visitors}
Conversion rate: ${conversionRate}%
Price: $${price}
Mode: ${growthMode}
Baseline MRR: $${baseline.revenue}
Optimized MRR: $${optimized.revenue}
Annual upside: $${annualDelta}
Upgrade probability: ${upgradeProbability}%`,
          context: {
            currentPage: '/financials',
            recentActions: ['financial-brief'],
            userPreferences: { format: 'concise-bullets' },
          },
        });
        brief = ai?.message?.content || brief;
      }

      const [suggestions, proactive] = await Promise.all([
        getTaskSuggestions(context),
        generateProactiveInsights(
          {
            page: 'financials',
            baselineMRR: baseline.revenue,
            optimizedMRR: optimized.revenue,
            runwayMonths: snapshot.runwayMonths,
            netMonthlyCashflow: snapshot.netMonthlyCashflow,
            anomalyCount: anomalies.length,
          },
          ['goal-trajectory', 'productivity-patterns', 'time-optimization'],
        ),
      ]);

      const proactiveItems = Array.isArray(proactive?.insights)
        ? proactive.insights.slice(0, 2).map((insight: any, index: number) => ({
            id: `proactive-${index}`,
            title: insight?.title || 'Proactive financial optimization',
            description: insight?.description || 'OpenClaw generated proactive insight.',
            priority: insight?.priority >= 8 ? 'high' : 'medium',
            estimatedTime: '30 min',
          }))
        : [];

      setFinancialBrief(brief);
      setActionItems([...(Array.isArray(suggestions) ? suggestions.slice(0, 3) : []), ...proactiveItems]);
      trackRevenueEvent('financial_brief_generated', {
        userId: 'current-user',
        revenueValue: optimized.revenue,
        annualDelta,
      });
      toast.success('Financial brief generated');
    } catch (error) {
      console.error('[Financials] brief generation failed:', error);
      toast.error('Could not generate financial brief');
    } finally {
      setBriefLoading(false);
    }
  };

  const runAutonomousRiskScan = async () => {
    setRiskScanLoading(true);
    try {
      const highRisk = anomalies.filter((a) => a.severity === 'high');
      if (highRisk.length === 0) {
        toast.success('No high-risk financial anomalies detected');
        return;
      }

      for (const anomaly of highRisk) {
        await createTask({
          title: `Mitigate: ${anomaly.title}`,
          description: `${anomaly.detail}\nRecommended action: ${anomaly.suggestedAction}`,
          priority: 'high',
          energyLevel: 'medium',
          estimatedTime: '60 min',
          tags: ['financials', 'risk', 'guardrail'],
          dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        } as any);
      }
      toast.success(`Created ${highRisk.length} mitigation task${highRisk.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('[Financials] risk scan failed:', error);
      toast.error('Could not create mitigation tasks');
    } finally {
      setRiskScanLoading(false);
    }
  };

  const createTaskFromAction = async (item: any) => {
    try {
      await createTask({
        title: item?.title || 'Financial follow-up',
        description: item?.description || 'Generated from Financials action cockpit',
        priority: (item?.priority || 'high') as 'low' | 'medium' | 'high' | 'urgent',
        energyLevel: 'medium',
        estimatedTime: item?.estimatedTime || '45 min',
        tags: ['financials', 'growth', 'openclaw'],
        dueDate: item?.suggestedTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as any);
      toast.success('Financial action added to tasks');
    } catch (error) {
      console.error('[Financials] task creation failed:', error);
      toast.error('Could not create financial task');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Financials
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Invoicing, revenue intelligence, and AI financial execution.
            </p>
          </div>
          {activeTab === 'revenue' && (
            <Button onClick={() => void runFinancialBrief()} disabled={briefLoading} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {briefLoading ? 'Building Brief...' : 'Generate Financial Brief'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#1a1b23] rounded-xl p-1 border border-gray-800 w-fit">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" /> Invoices
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Revenue Intelligence
          </button>
        </div>

        {activeTab === 'invoices' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PlaidConnectCard />
              <BenchmarkOptInCard />
            </div>
            {biometric.supported && biometric.note && (
              <p className="text-xs text-gray-500">{biometric.note}</p>
            )}
            <InvoiceDashboard
              key={invoiceRefreshKey}
              onCreateNew={() => { setEditingInvoice(null); setInvoiceFormOpen(true); }}
              onEdit={(inv) => { setEditingInvoice(inv); setInvoiceFormOpen(true); }}
            />
            <RecurringInvoicesPanel />
          </div>
        ) : (
        <>
        {plaidLive?.connected && plaidLive.snapshot && (
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            <span className="font-medium">Live bank data (Plaid):</span>{' '}
            Cash ${Number(plaidLive.snapshot.totalCash || 0).toLocaleString()} · Net monthly $
            {Number(plaidLive.snapshot.netMonthlyCashflow || 0).toLocaleString()} · Runway{' '}
            {Number(plaidLive.snapshot.runwayMonths || 0).toFixed(1)} mo
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Modeled baseline MRR</p>
            <p className="text-2xl font-semibold text-white mt-1">${baseline.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Optimized MRR forecast</p>
            <p className="text-2xl font-semibold text-emerald-300 mt-1">${optimized.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Annual uplift potential</p>
            <p className="text-2xl font-semibold text-teal-300 mt-1">${annualDelta.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Cash position</p>
            <p className="text-xl font-semibold text-white mt-1">${snapshot.totalCash.toLocaleString()}</p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Net monthly cashflow</p>
            <p className={`text-xl font-semibold mt-1 ${snapshot.netMonthlyCashflow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              ${snapshot.netMonthlyCashflow.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Runway (months)</p>
            <p className={`text-xl font-semibold mt-1 ${snapshot.runwayMonths < 6 ? 'text-rose-300' : snapshot.runwayMonths < 12 ? 'text-amber-300' : 'text-cyan-300'}`}>
              {snapshot.runwayMonths.toFixed(1)}
            </p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Anomalies</p>
            <p className={`text-xl font-semibold mt-1 ${snapshot.anomalyCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {snapshot.anomalyCount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-300" />
                Scenario Studio
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGrowthMode('stable')}
                  className={`text-xs px-2 py-1 rounded border ${growthMode === 'stable' ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10' : 'border-gray-700 text-gray-400'}`}
                >
                  Stable
                </button>
                <button
                  onClick={() => setGrowthMode('aggressive')}
                  className={`text-xs px-2 py-1 rounded border ${growthMode === 'aggressive' ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10' : 'border-gray-700 text-gray-400'}`}
                >
                  Aggressive
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-xs text-gray-400">
                Monthly visitors
                <input
                  type="number"
                  min={0}
                  value={visitors}
                  onChange={(e) => setVisitors(Number(e.target.value || 0))}
                  className="mt-1 w-full bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-gray-400">
                Conversion rate (%)
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={conversionRate}
                  onChange={(e) => setConversionRate(Number(e.target.value || 0))}
                  className="mt-1 w-full bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-gray-400">
                Price ($/month)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value || 0))}
                  className="mt-1 w-full bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                />
              </label>
            </div>

            <div className="bg-[#12151b] border border-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Upgrade intent likelihood</span>
                <span>{upgradeProbability}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${Math.min(100, upgradeProbability)}%` }} />
              </div>
            </div>

            <div className="bg-[#12151b] border border-gray-800 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
                6-week cashflow trend
              </p>
              <div className="space-y-1.5">
                {cashflowSeries.map((point) => {
                  const max = Math.max(1, point.inflow, point.outflow);
                  const inflowPct = Math.max(6, (point.inflow / max) * 100);
                  const outflowPct = Math.max(6, (point.outflow / max) * 100);
                  return (
                    <div key={point.date} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{new Date(point.date).toLocaleDateString()}</span>
                        <span>in ${point.inflow.toLocaleString()} / out ${point.outflow.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${inflowPct}%` }} />
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${outflowPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-300" />
              Strategic Signals
            </p>
            <div className="space-y-2">
              <div className="bg-[#12151b] border border-gray-800 rounded-md p-2">
                <p className="text-xs text-gray-400">Subscribers (modeled)</p>
                <p className="text-sm text-white mt-0.5">{optimized.units.toLocaleString()}</p>
              </div>
              <div className="bg-[#12151b] border border-gray-800 rounded-md p-2">
                <p className="text-xs text-gray-400">ARPU estimate</p>
                <p className="text-sm text-white mt-0.5">${price.toFixed(2)}</p>
              </div>
              <div className="bg-[#12151b] border border-gray-800 rounded-md p-2">
                <p className="text-xs text-gray-400">Acquisition pressure</p>
                <p className="text-sm text-white mt-0.5">{growthMode === 'aggressive' ? 'High - ensure CAC guardrails' : 'Moderate - sustainable'}</p>
              </div>
              <div className="bg-[#12151b] border border-gray-800 rounded-md p-2">
                <p className="text-xs text-gray-400">Active accounts</p>
                <p className="text-sm text-white mt-0.5">{accounts.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-3 min-h-[260px]">
            <p className="text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              OpenClaw Financial Brief
            </p>
            {financialBrief ? (
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{financialBrief}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Generate a briefing to get AI-prioritized financial moves, risk flags, and this week&apos;s execution focus.
              </p>
            )}
          </div>

          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-300" />
                Execution Queue
              </p>
              <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
                Financial Ops
              </Badge>
            </div>
            {actionItems.length > 0 ? (
              <div className="space-y-2">
                {actionItems.map((item, idx) => (
                  <div key={`${item.id || item.title || 'financial-action'}-${idx}`} className="bg-[#12151b] border border-gray-800 rounded-md p-2.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-200 truncate">{item.title || 'Financial action'}</p>
                    <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => void createTaskFromAction(item)}>
                      Add Task
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Run Financial Brief to generate action-ready tasks.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                Financial Anomaly Radar
              </p>
              <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
                {anomalies.length} detected
              </Badge>
            </div>
            {anomalies.length > 0 ? (
              <div className="space-y-2">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="bg-[#12151b] border border-gray-800 rounded-md p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white">{anomaly.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          anomaly.severity === 'high'
                            ? 'border-rose-500/50 text-rose-300'
                            : anomaly.severity === 'medium'
                            ? 'border-amber-500/50 text-amber-300'
                            : 'border-cyan-500/50 text-cyan-300'
                        }`}
                      >
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{anomaly.detail}</p>
                    <p className="text-xs text-gray-300 mt-2">Action: {anomaly.suggestedAction}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No anomalies detected in current operating window.</p>
            )}
          </div>

          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Autonomous Guardrails
            </p>
            <p className="text-xs text-gray-400">
              Automatically convert high-severity financial anomalies into mitigation tasks.
            </p>
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => void runAutonomousRiskScan()}
              disabled={riskScanLoading}
            >
              <Wallet className="w-3.5 h-3.5" />
              {riskScanLoading ? 'Running Risk Scan...' : 'Run Risk Scan + Create Tasks'}
            </Button>
            <div className="space-y-2">
              <p className="text-xs text-gray-300">Upcoming obligations</p>
              {upcomingObligations.length > 0 ? (
                upcomingObligations.map((item) => (
                  <div key={item.id} className="bg-[#12151b] border border-gray-800 rounded-md p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white truncate">{item.category}</p>
                      <p className="text-xs text-gray-300">${item.amount.toLocaleString()}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Due {new Date(item.dueAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No near-term obligations found.</p>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {invoiceFormOpen && (
        <InvoiceFormModal
          invoice={editingInvoice}
          onClose={() => { setInvoiceFormOpen(false); setEditingInvoice(null); }}
          onSaved={() => setInvoiceRefreshKey((k) => k + 1)}
        />
      )}
    </DashboardLayout>
  );
}
