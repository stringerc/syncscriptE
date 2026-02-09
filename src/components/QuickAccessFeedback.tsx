/**
 * QUICK ACCESS FEEDBACK BUTTON
 * Add this to your admin dashboard for easy access
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, AlertTriangle, TrendingUp } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function QuickAccessFeedback() {
  const [stats, setStats] = useState({
    totalFeedback: 0,
    criticalIssues: 0,
    trendingUp: 0
  });

  useEffect(() => {
    loadQuickStats();
  }, []);

  async function loadQuickStats() {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/insights?period=7d`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalFeedback: data.insights.total_feedback,
          criticalIssues: data.insights.critical_issues.length,
          trendingUp: data.insights.trending_up.length
        });
      }
    } catch (error) {
      console.error('Failed to load feedback stats:', error);
    }
  }

  function openFeedbackDashboard() {
    window.location.href = '/feedback-intelligence';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
      onClick={openFeedbackDashboard}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Feedback Intelligence</h3>
            <p className="text-purple-300 text-sm">AI-powered insights</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Total (7d)</p>
          <p className="text-2xl font-bold text-white">{stats.totalFeedback}</p>
        </div>

        <div className="bg-red-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <p className="text-red-400 text-xs">Critical</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.criticalIssues}</p>
        </div>

        <div className="bg-orange-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-orange-400" />
            <p className="text-orange-400 text-xs">Trending</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.trendingUp}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-purple-300">View full dashboard →</span>
        {stats.criticalIssues > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-semibold animate-pulse">
            Action Required
          </span>
        )}
      </div>
    </motion.div>
  );
}
