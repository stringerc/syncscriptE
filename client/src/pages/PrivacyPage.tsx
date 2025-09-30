import { Shield, Lock, Eye, Database, Download, Trash2, Mail, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-purple-200">
            Your privacy is our priority
          </p>
          <p className="text-sm text-white/60 mt-2">
            Last updated: September 30, 2025
          </p>
        </div>

        {/* Quick Summary */}
        <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-400/30 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Privacy in Plain English
          </h2>
          <ul className="space-y-3 text-purple-100">
            <li className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>We encrypt all your data in transit and at rest</span>
            </li>
            <li className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>We never sell or share your personal data with third parties</span>
            </li>
            <li className="flex items-start gap-3">
              <Download className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>You can export all your data anytime</span>
            </li>
            <li className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>You can delete your account and all data permanently</span>
            </li>
          </ul>
        </Card>

        {/* Detailed Sections */}
        <div className="space-y-8">
          {/* Data Collection */}
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                What Data We Collect
              </h2>
            </div>
            <div className="space-y-4 text-purple-200">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                <p>Email address, name, and password (hashed and salted). If you sign in with Google, we receive your name, email, and profile photo.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Content You Create</h3>
                <p>Tasks, events, notes, resources, templates, and project data you create in SyncScript.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Calendar Data</h3>
                <p>If you connect Google Calendar, we access and sync calendar events you grant us permission to read/write. Calendar tokens are stored securely and can be revoked anytime.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage Analytics</h3>
                <p>We collect anonymous usage data (feature interactions, page views) to improve the product. We use Sentry for error tracking. No personal data is shared.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Voice Input</h3>
                <p>When you use voice input, audio is processed by your browser's Web Speech API. Audio is not stored or transmitted to our servers—only the final text transcript is saved.</p>
              </div>
            </div>
          </Card>

          {/* How We Use Data */}
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                How We Use Your Data
              </h2>
            </div>
            <div className="space-y-3 text-purple-200">
              <p>We use your data to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve SyncScript features</li>
                <li>Sync with external calendar services you connect</li>
                <li>Send you service notifications (task reminders, challenge notifications)</li>
                <li>Respond to your support requests and feedback</li>
                <li>Detect and prevent fraud, abuse, and security issues</li>
                <li>Generate anonymous analytics to improve the product</li>
              </ul>
              <p className="font-semibold text-white mt-4">
                We do NOT:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sell your data to anyone</li>
                <li>Share your personal data with advertisers</li>
                <li>Train AI models on your private tasks/events</li>
                <li>Access your data without explicit permission</li>
              </ul>
            </div>
          </Card>

          {/* Data Security */}
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                Data Security
              </h2>
            </div>
            <div className="space-y-3 text-purple-200">
              <p>We take security seriously:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Encryption:</strong> All data transmitted over HTTPS. Database encrypted at rest.</li>
                <li><strong className="text-white">Authentication:</strong> Passwords hashed with bcrypt. JWT tokens for sessions.</li>
                <li><strong className="text-white">Access Control:</strong> Role-based permissions for projects. Private data stays private.</li>
                <li><strong className="text-white">Monitoring:</strong> Real-time error tracking and security alerts.</li>
                <li><strong className="text-white">Backups:</strong> Regular encrypted backups stored securely.</li>
              </ul>
            </div>
          </Card>

          {/* Third-Party Services */}
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                Third-Party Services
              </h2>
            </div>
            <div className="space-y-3 text-purple-200">
              <p>We use these trusted third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Google Calendar API:</strong> For calendar sync (if you connect)</li>
                <li><strong className="text-white">OpenAI API:</strong> For AI-powered suggestions (anonymized)</li>
                <li><strong className="text-white">Sentry:</strong> For error tracking (no personal data)</li>
                <li><strong className="text-white">Vercel:</strong> Frontend hosting</li>
                <li><strong className="text-white">Render:</strong> Backend hosting and database</li>
              </ul>
              <p className="mt-4">
                Each service has their own privacy policy. We only share the minimum data required for functionality.
              </p>
            </div>
          </Card>

          {/* Your Rights */}
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                Your Rights
              </h2>
            </div>
            <div className="space-y-4 text-purple-200">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Export Your Data</h3>
                <p>Go to Settings → Privacy → Export Data. Receive a complete JSON file with all your content.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Your Data</h3>
                <p>Go to Settings → Privacy → Delete Account. All data permanently deleted within 30 days (cannot be undone).</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Revoke Calendar Access</h3>
                <p>Disconnect Google Calendar anytime. We immediately stop accessing your calendar data.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Control Friend Visibility</h3>
                <p>Hide your energy level, emblems, or entire profile from specific friends or everyone.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Opt Out of Emails</h3>
                <p>Unsubscribe from digest emails anytime. You'll still receive critical account notifications.</p>
              </div>
            </div>
          </Card>

          {/* Children's Privacy */}
          <Card className="bg-white/5 border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Children's Privacy
            </h2>
            <p className="text-purple-200">
              SyncScript is not intended for children under 13. We do not knowingly collect data from children. 
              If we discover we have collected data from a child under 13, we will delete it immediately.
            </p>
          </Card>

          {/* Changes to Policy */}
          <Card className="bg-white/5 border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-purple-200">
              We may update this policy occasionally. Material changes will be announced via email or in-app notification. 
              Continued use after changes means you accept the new policy. Last updated date is shown at the top of this page.
            </p>
          </Card>

          {/* Contact */}
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                Contact Us
              </h2>
            </div>
            <p className="text-purple-200 mb-4">
              Questions about privacy? We're here to help.
            </p>
            <Button
              onClick={() => {
                const feedbackBtn = document.querySelector('[aria-label="Leave feedback"]') as HTMLButtonElement
                if (feedbackBtn) feedbackBtn.click()
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Send Privacy Question
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
