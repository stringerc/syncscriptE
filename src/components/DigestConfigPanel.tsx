/**
 * DIGEST CONFIGURATION PANEL
 * Configure automated daily feedback digests
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Plus, X, Save, Send, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DigestConfig {
  enabled: boolean;
  recipients: string[];
  schedule: string;
  includeWeekends: boolean;
}

export function DigestConfigPanel() {
  const [config, setConfig] = useState<DigestConfig>({
    enabled: false,
    recipients: [],
    schedule: '9:00 AM UTC',
    includeWeekends: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingSimple, setSendingSimple] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/digest/config`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load digest config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/digest/config`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        }
      );

      if (response.ok) {
        toast.success('Configuration saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save digest config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function sendSimpleTestEmail() {
    if (config.recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setSendingSimple(true);
    try {
      const email = config.recipients[0]; // Send to first recipient
      console.log('Sending simple test email to:', email);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/test-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();
      console.log('Simple email response:', data);

      if (response.ok) {
        toast.success(
          `✅ Simple test email sent to ${email}! Check your inbox.`,
          { duration: 5000 }
        );
      } else {
        console.error('Simple email error:', data);
        toast.error(`❌ ${data.error || 'Failed to send test email'}`);
      }
    } catch (error) {
      console.error('Failed to send simple test email:', error);
      toast.error('Network error - check console for details');
    } finally {
      setSendingSimple(false);
    }
  }

  async function sendTestDigest() {
    if (config.recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setSending(true);
    try {
      console.log('Sending test digest to:', config.recipients);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/digest/send-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            isTest: true  // Force sending even if no feedback
          })
        }
      );

      const data = await response.json();
      console.log('Digest response:', data);

      if (response.ok) {
        toast.success(
          data.message || `Test digest sent to ${config.recipients.length} recipient(s)! Check your inbox.`,
          { duration: 5000 }
        );
        
        // Show details of what was sent
        if (data.results && data.results.length > 0) {
          const successEmails = data.results.filter((r: any) => r.success).map((r: any) => r.email);
          const failedEmails = data.results.filter((r: any) => !r.success).map((r: any) => r.email);
          
          if (successEmails.length > 0) {
            console.log('✅ Successfully sent to:', successEmails);
          }
          if (failedEmails.length > 0) {
            console.error('❌ Failed to send to:', failedEmails);
            toast.error(`Failed to send to: ${failedEmails.join(', ')}`);
          }
        }
      } else {
        console.error('Digest error:', data);
        toast.error(data.error || 'Failed to send test digest');
      }
    } catch (error) {
      console.error('Failed to send test digest:', error);
      toast.error('Network error - check console for details');
    } finally {
      setSending(false);
    }
  }

  function addRecipient() {
    if (!newEmail.trim()) return;
    
    if (!newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (config.recipients.includes(newEmail)) {
      toast.error('This email is already in the list');
      return;
    }

    setConfig({
      ...config,
      recipients: [...config.recipients, newEmail]
    });
    setNewEmail('');
  }

  function removeRecipient(email: string) {
    setConfig({
      ...config,
      recipients: config.recipients.filter(e => e !== email)
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Daily Digest Configuration</h2>
          <p className="text-slate-400">
            Automated feedback summaries delivered to your inbox every day
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveConfig}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button
            onClick={sendSimpleTestEmail}
            disabled={sendingSimple || config.recipients.length === 0}
            variant="outline"
            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
          >
            {sendingSimple ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Test Email
              </>
            )}
          </Button>
          <Button
            onClick={sendTestDigest}
            disabled={sending || !config.enabled || config.recipients.length === 0}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Digest
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enable/Disable */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
          />
          <div>
            <span className="text-white font-semibold text-lg">Enable Daily Digests</span>
            <p className="text-slate-400 text-sm">
              Automatically send feedback summaries every day
            </p>
          </div>
        </label>
      </div>

      {config.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6"
        >
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Email Recipients
            </label>
            
            {/* Add New Recipient */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                placeholder="admin@syncscript.app"
                className="flex-1 bg-slate-900 border-slate-600 text-white"
              />
              <Button
                onClick={addRecipient}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Recipient List */}
            {config.recipients.length > 0 ? (
              <div className="space-y-2">
                {config.recipients.map((email, idx) => (
                  <motion.div
                    key={email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-mono">{email}</span>
                    </div>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
                <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No recipients added yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Add email addresses to receive daily digests
                </p>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold mb-1">Delivery Schedule</p>
                <p className="text-slate-300 text-sm mb-2">
                  Digests are sent automatically at <strong>{config.schedule}</strong>
                </p>
                <p className="text-slate-400 text-xs">
                  Contains: Summary stats, critical issues, trending topics, recommended actions, 
                  sentiment analysis, and top contributors
                </p>
              </div>
            </div>
          </div>

          {/* Include Weekends */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeWeekends}
                onChange={(e) => setConfig({ ...config, includeWeekends: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
              <div>
                <span className="text-white font-medium">Include Weekends</span>
                <p className="text-slate-400 text-sm">
                  Send digests on Saturday and Sunday
                </p>
              </div>
            </label>
          </div>

          {/* How It Works */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-purple-300 font-semibold mb-2">How It Works</p>
                <ul className="space-y-1 text-slate-300 text-sm">
                  <li>• Automatically analyzes all feedback from the previous day</li>
                  <li>• AI categorizes and prioritizes issues</li>
                  <li>• Groups similar feedback into clusters</li>
                  <li>• Generates actionable recommendations</li>
                  <li>• Delivers beautiful HTML email with insights</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test Email Info */}
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-cyan-300 font-semibold mb-2">Testing Your Email Setup</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-white text-sm font-medium mb-1">
                      📧 "Test Email" Button (Blue)
                    </p>
                    <p className="text-slate-300 text-sm">
                      Sends a simple confirmation email to verify your email setup is working. 
                      Use this first to make sure emails are being delivered.
                    </p>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium mb-1">
                      📊 "Send Digest" Button (Cyan)
                    </p>
                    <p className="text-slate-300 text-sm">
                      Sends a full feedback digest with sample data. 
                      Only works when digests are enabled.
                    </p>
                  </div>
                </div>
                <ul className="space-y-1 text-slate-400 text-xs mt-3 pt-3 border-t border-cyan-500/20">
                  <li>• Check your spam/junk folder if you don't see it</li>
                  <li>• Email comes from: <span className="font-mono">noreply@syncscript.app</span></li>
                  <li>• Should arrive within 5-10 seconds</li>
                  <li>• Check browser console (F12) if there are errors</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">Email Preview</h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg px-6 py-4 mb-2">
                  <h4 className="text-2xl font-bold text-white">📊 Daily Feedback Digest</h4>
                  <p className="text-white/90 text-sm">Wednesday, February 4, 2026</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Total Feedback</p>
                  <p className="text-2xl font-bold text-cyan-400">24</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Bugs</p>
                  <p className="text-2xl font-bold text-red-400">5</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Features</p>
                  <p className="text-2xl font-bold text-blue-400">12</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Praise</p>
                  <p className="text-2xl font-bold text-green-400">7</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm text-center">
                Plus: Recommended actions, critical issues, trends, and more...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!config.enabled && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Daily digests are currently disabled</p>
          <p className="text-slate-500 text-sm">
            Enable to start receiving automated feedback summaries
          </p>
        </div>
      )}
    </div>
  );
}
