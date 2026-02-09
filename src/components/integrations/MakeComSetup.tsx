/**
 * Make.com Setup Component
 * 
 * Guides users through Make.com integration setup with real-time status.
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, CheckCircle, XCircle, Loader2, ExternalLink,
  Github, Calendar, Mail, Trello, Video, FileText, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useMake } from '../../hooks/useMake';
import { toast } from 'sonner@2.0.3';

export function MakeComSetup() {
  const { checkStatus, testWebhook, loading } = useMake();
  const [status, setStatus] = useState<any>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const statusData = await checkStatus();
    setStatus(statusData);
  };

  const handleTestWebhook = async (webhookType: string) => {
    setTestingWebhook(webhookType);
    const result = await testWebhook(webhookType as any);
    
    if (result.success) {
      toast.success(`${webhookType} webhook test passed!`);
      setTestResults(prev => ({ ...prev, [webhookType]: true }));
    } else {
      // Parse error message to provide better guidance
      const errorMsg = result.error || 'Unknown error';
      
      if (errorMsg.includes('410') || errorMsg.includes('not active')) {
        toast.error(
          `${webhookType} webhook failed: Scenario not active. Please turn ON your Make.com scenario.`,
          { duration: 6000 }
        );
      } else if (errorMsg.includes('not configured')) {
        toast.error(
          `${webhookType} webhook not configured. Add MAKE_${webhookType.toUpperCase()}_WEBHOOK_URL to environment variables.`,
          { duration: 6000 }
        );
      } else if (errorMsg.includes('404')) {
        toast.error(
          `${webhookType} webhook failed: URL not found. Verify your webhook URL in Make.com.`,
          { duration: 6000 }
        );
      } else {
        toast.error(`${webhookType} webhook test failed: ${errorMsg}`, { duration: 5000 });
      }
      
      setTestResults(prev => ({ ...prev, [webhookType]: false }));
    }
    
    setTestingWebhook(null);
  };

  const webhooks = [
    {
      id: 'task',
      name: 'Task Sync',
      icon: CheckCircle,
      description: 'Sync tasks to GitHub, Trello, Notion',
      color: 'text-blue-400',
    },
    {
      id: 'meeting',
      name: 'Meeting Creator',
      icon: Video,
      description: 'Create Zoom meetings and calendar events',
      color: 'text-purple-400',
    },
    {
      id: 'goal',
      name: 'Goal Celebration',
      icon: Zap,
      description: 'Post achievements to social platforms',
      color: 'text-yellow-400',
    },
    {
      id: 'calendar',
      name: 'Calendar Sync',
      icon: Calendar,
      description: 'Sync events across all calendars',
      color: 'text-green-400',
    },
    {
      id: 'email',
      name: 'Email Integration',
      icon: Mail,
      description: 'Convert emails to tasks',
      color: 'text-red-400',
    },
  ];

  const services = [
    { name: 'GitHub', icon: Github, available: true },
    { name: 'Trello', icon: Trello, available: true },
    { name: 'Notion', icon: FileText, available: true },
    { name: 'Google Calendar', icon: Calendar, available: true },
    { name: 'Gmail', icon: Mail, available: true },
    { name: 'Zoom', icon: Video, available: true },
  ];

  const isConfigured = status?.ready;
  const configuredCount = status ? Object.values(status.webhooks).filter(Boolean).length : 0;
  const totalWebhooks = 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Make.com Integration</h2>
          <p className="text-gray-400 mt-1">
            Connect 1,500+ apps through Make.com automation
          </p>
        </div>
        <Button
          onClick={() => window.open('https://www.make.com/en/register', '_blank')}
          className="bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Make.com
        </Button>
      </div>

      {/* Status Card */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5" />
                Integration Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                {status?.message || 'Loading...'}
              </CardDescription>
            </div>
            <Badge className={
              isConfigured 
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }>
              {isConfigured ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Setup Required
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Webhooks Configured</span>
                <span className="font-semibold text-white">
                  {configuredCount}/{totalWebhooks}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(configuredCount / totalWebhooks) * 100}%` }}
                  className={`h-full rounded-full ${
                    configuredCount === totalWebhooks
                      ? 'bg-green-500'
                      : configuredCount > 0
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Refresh Status */}
            <Button
              onClick={loadStatus}
              variant="secondary"
              size="sm"
              disabled={loading}
              className="w-full hover:bg-white/10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh Status'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Services */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Available Services</CardTitle>
          <CardDescription className="text-gray-400">
            Services you can connect through Make.com
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <service.icon className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium text-white">{service.name}</span>
                {service.available && (
                  <CheckCircle className="ml-auto h-4 w-4 text-green-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Webhook Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Test each webhook to verify Make.com scenarios are working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhooks.map((webhook) => {
            const Icon = webhook.icon;
            const configured = status?.webhooks?.[webhook.id];
            const tested = testResults[webhook.id];
            const isTesting = testingWebhook === webhook.id;

            return (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-4 rounded-lg border p-4 ${
                  configured
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Icon className={`h-5 w-5 ${webhook.color}`} />
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{webhook.name}</h4>
                  <p className="text-xs text-gray-400">{webhook.description}</p>
                </div>
                
                {configured ? (
                  tested === true ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Tested
                    </Badge>
                  ) : tested === false ? (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                      <XCircle className="mr-1 h-3 w-3" />
                      Failed
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleTestWebhook(webhook.id)}
                      disabled={isTesting}
                      size="sm"
                      variant="secondary"
                      className="hover:bg-white/10"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Webhook'
                      )}
                    </Button>
                  )
                ) : (
                  <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                    Not Configured
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!isConfigured && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-400" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20 mb-4">
              <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Common Error: 410 - No scenario listening
              </h4>
              <p className="text-sm text-red-300 mb-2">
                This means your Make.com scenario exists but is not turned ON.
              </p>
              <ol className="text-sm text-red-300/90 space-y-1 list-decimal pl-5">
                <li>Go to make.com and open your scenario</li>
                <li>Look at the bottom - turn the toggle to ON (green)</li>
                <li>Come back and test again</li>
              </ol>
              <a
                href="/docs/MAKE_COM_QUICK_FIX.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-400 hover:text-red-300 underline mt-2 inline-block"
              >
                See Quick Fix Guide →
              </a>
            </div>

            <ol className="space-y-3 text-sm text-gray-300 list-decimal pl-5">
              <li>
                <strong className="text-white">Sign up for Make.com</strong>
                <br />
                <span className="text-gray-400">
                  Go to{' '}
                  <a
                    href="https://www.make.com/en/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    make.com
                  </a>
                  {' '}and create a free account (1,000 operations/month)
                </span>
              </li>
              
              <li>
                <strong className="text-white">Connect your services</strong>
                <br />
                <span className="text-gray-400">
                  In Make.com, connect GitHub, Trello, Zoom, Notion, Gmail, and Google Calendar
                </span>
              </li>
              
              <li>
                <strong className="text-white">Create scenarios with webhooks</strong>
                <br />
                <span className="text-gray-400">
                  Create 5 scenarios (Task Sync, Meeting Creator, Goal Celebration, Calendar Sync, Email Integration) using Custom Webhooks as triggers
                </span>
              </li>
              
              <li>
                <strong className="text-white">Copy webhook URLs</strong>
                <br />
                <span className="text-gray-400">
                  Each scenario will give you a webhook URL starting with https://hook.make.com/...
                </span>
              </li>
              
              <li>
                <strong className="text-white">Add to environment variables</strong>
                <br />
                <span className="text-gray-400">
                  In Supabase, add: MAKE_TASK_WEBHOOK_URL, MAKE_MEETING_WEBHOOK_URL, MAKE_GOAL_WEBHOOK_URL, MAKE_CALENDAR_WEBHOOK_URL, MAKE_EMAIL_WEBHOOK_URL
                </span>
              </li>
            </ol>
            
            <div className="mt-4 rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <p className="text-sm text-blue-300">
                📖 See <strong>MAKE_COM_SETUP_GUIDE.md</strong> for detailed step-by-step instructions
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}