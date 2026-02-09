import { AlertCircle, CheckCircle, ExternalLink, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export function SetupStatusBanner() {
  // In production, this would check actual environment variables
  const setupSteps: SetupStep[] = [
    {
      id: 'google_credentials',
      label: 'Google Calendar OAuth Credentials',
      completed: false, // Check if GOOGLE_CLIENT_ID exists
      required: true
    },
    {
      id: 'microsoft_credentials',
      label: 'Microsoft Outlook OAuth Credentials',
      completed: false, // Check if MICROSOFT_CLIENT_ID exists
      required: true
    },
    {
      id: 'slack_credentials',
      label: 'Slack OAuth Credentials',
      completed: false, // Check if SLACK_CLIENT_ID exists
      required: true
    },
    {
      id: 'app_url',
      label: 'Application URL Configuration',
      completed: false, // Check if APP_URL exists
      required: true
    }
  ];

  const completedCount = setupSteps.filter(s => s.completed).length;
  const totalRequired = setupSteps.filter(s => s.required).length;
  const isComplete = completedCount === totalRequired;

  // Don't show banner if everything is set up
  if (isComplete) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-lg">Setup Required for OAuth Integrations</h3>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              {completedCount}/{totalRequired} Complete
            </Badge>
          </div>

          <p className="text-gray-300 text-sm mb-4">
            To enable Google Calendar, Outlook, and Slack integrations, you need to configure OAuth credentials. 
            This is a one-time setup process.
          </p>

          {/* Setup Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {setupSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                  step.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-gray-900/50 border-gray-700'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${step.completed ? 'text-emerald-300' : 'text-gray-300'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                // In production, this would open the setup guide or Supabase settings
                window.open('/OAUTH_SETUP_GUIDE.md', '_blank');
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              View Setup Guide
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
              onClick={() => {
                // In production, this would link to Supabase project settings
                window.open('https://supabase.com/dashboard', '_blank');
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Supabase Dashboard
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => {
                // Refresh to check if credentials have been added
                window.location.reload();
              }}
            >
              Check Status
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4">
            💡 <strong>Tip:</strong> You can test the integration flow even without OAuth credentials - 
            the UI components and backend routes are fully functional. Just add your credentials when ready to go live.
          </p>
        </div>
      </div>
    </div>
  );
}
