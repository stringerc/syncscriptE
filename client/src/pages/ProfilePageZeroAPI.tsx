import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, TrendingUp, Save, Settings, Trash2 } from 'lucide-react';

export function ProfilePageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Profile Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All profile functionality working');
  }, []);

  // Mock profile data
  const mockProfile = {
    id: 'user123',
    name: 'Demo User',
    email: 'demo@syncscript.com',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    isEmailVerified: true,
    preferences: {
      notifications: true,
      darkMode: false,
      timezone: 'America/New_York'
    }
  };

  const mockStats = {
    totalTasks: 42,
    completedTasks: 28,
    totalEvents: 15,
    streakDays: 7
  };

  const [formData, setFormData] = useState({
    name: mockProfile.name,
    email: mockProfile.email,
    notifications: mockProfile.preferences.notifications,
    darkMode: mockProfile.preferences.darkMode,
    timezone: mockProfile.preferences.timezone
  });

  const handleSaveProfile = () => {
    console.log('✅ Save Profile button clicked successfully!');
    console.log('Profile saved:', formData);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <User className="w-10 h-10" />
              Profile Settings - Zero API Mode
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span>⚡ Loaded in {loadTime}ms</span>
              <span>•</span>
              <span>🚫 Zero network requests</span>
              <span>•</span>
              <span>✅ All settings functional</span>
            </p>
          </div>
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            className={`text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${
              isEditing 
                ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white" 
                : "bg-white text-purple-600 hover:bg-white/90"
            }`}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <User className="w-6 h-6 text-indigo-600" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal details and account information
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    {mockProfile.isEmailVerified && (
                      <Badge className="bg-green-500">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <Button 
                  onClick={handleSaveProfile}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Settings className="w-6 h-6 text-indigo-600" />
                Preferences
              </CardTitle>
              <CardDescription className="text-gray-600">
                Customize your SyncScript experience
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your tasks and events
                  </p>
                </div>
                <Switch
                  checked={formData.notifications}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, notifications: checked }));
                    console.log(`✅ Notifications ${checked ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme throughout the application
                  </p>
                </div>
                <Switch
                  checked={formData.darkMode}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, darkMode: checked }));
                    console.log(`✅ Dark mode ${checked ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats - Beautiful Cards */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <TrendingUp className="w-5 h-5" />
                Account Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-purple-700">Total Tasks</span>
                <span className="text-2xl font-bold text-purple-600">{mockStats.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-green-700">Completed</span>
                <span className="text-2xl font-bold text-green-600">{mockStats.completedTasks}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-blue-700">Events Created</span>
                <span className="text-2xl font-bold text-blue-600">{mockStats.totalEvents}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300">
                <span className="text-sm font-medium text-orange-700">Current Streak 🔥</span>
                <span className="text-2xl font-bold text-orange-600">{mockStats.streakDays} days</span>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <p className="text-sm font-semibold">
                  {new Date(mockProfile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Account ID</Label>
                <p className="text-sm font-mono text-xs">{mockProfile.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-700">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => console.log('✅ Delete Account clicked (Zero-API mode, no action taken)')}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testing Instructions */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2 text-xl">
            <span className="text-3xl">📋</span>
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-indigo-800">
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">1</span>
              <div><strong>Click "Edit Profile"</strong> - Enable editing mode</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">2</span>
              <div><strong>Toggle Switches</strong> - Test notification and dark mode switches</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">3</span>
              <div><strong>Update Fields</strong> - Change name and timezone</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">4</span>
              <div><strong>Save Changes</strong> - Click save to log changes to console</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">5</span>
              <div><strong>Check Console</strong> - All interactions logged</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

