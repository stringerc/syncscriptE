/**
 * FEEDBACK ADMIN PAGE
 * Complete admin interface for feedback intelligence system
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Bot, TestTube, ArrowLeft, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { FeedbackIntelligenceDashboard } from './FeedbackIntelligenceDashboard';
// DiscordSetupGuide removed (contained secrets)
import { FeedbackTestWidget } from './FeedbackTestWidget';
import { DigestConfigPanel } from './DigestConfigPanel';

type Tab = 'dashboard' | 'setup' | 'test' | 'digest';

export function FeedbackAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Feedback Intelligence System</h1>
            <Button
              onClick={() => window.history.back()}
              className="bg-slate-700 hover:bg-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Dashboard"
            />
            <TabButton
              active={activeTab === 'setup'}
              onClick={() => setActiveTab('setup')}
              icon={<Bot className="w-4 h-4" />}
              label="Discord Setup"
            />
            <TabButton
              active={activeTab === 'digest'}
              onClick={() => setActiveTab('digest')}
              icon={<Mail className="w-4 h-4" />}
              label="Daily Digest"
            />
            <TabButton
              active={activeTab === 'test'}
              onClick={() => setActiveTab('test')}
              icon={<TestTube className="w-4 h-4" />}
              label="Test Widget"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'dashboard' && <FeedbackIntelligenceDashboard />}
        {activeTab === 'setup' && <div className="p-6 text-center text-muted-foreground">Discord setup guide removed for security</div>}
        {activeTab === 'digest' && (
          <div className="max-w-4xl mx-auto p-6">
            <DigestConfigPanel />
          </div>
        )}
        {activeTab === 'test' && (
          <div className="max-w-4xl mx-auto p-6">
            <FeedbackTestWidget />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-cyan-500 text-white'
          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
