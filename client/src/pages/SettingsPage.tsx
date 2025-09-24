import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Bell, Shield, Palette } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your SyncScript experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option>UTC-8 (Pacific)</option>
                  <option>UTC-5 (Eastern)</option>
                  <option>UTC+0 (GMT)</option>
                </select>
              </div>
              <Button className="w-full">Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Browser notifications</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-muted-foreground">Text message alerts</p>
                </div>
                <input type="checkbox" className="rounded" />
              </div>
              <Button className="w-full">Save Preferences</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacy & Security</span>
            </CardTitle>
            <CardDescription>
              Control your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Data Sharing</h4>
                  <p className="text-sm text-muted-foreground">Allow anonymous usage data</p>
                </div>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">AI Learning</h4>
                  <p className="text-sm text-muted-foreground">Let AI learn from your patterns</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <Button variant="outline" className="w-full">Change Password</Button>
              <Button variant="destructive" className="w-full">Delete Account</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize the look and feel of SyncScript
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Energy Level Display</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option>Numbers (1-10)</option>
                  <option>Emoji</option>
                  <option>Colors</option>
                </select>
              </div>
              <Button className="w-full">Apply Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
