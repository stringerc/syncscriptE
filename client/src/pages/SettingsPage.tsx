import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { getCurrentTimezone } from '@/utils/timezone'
import { User, Bell, Shield, Palette, Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface UserSettings {
  id: string
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  aiSchedulingEnabled: boolean
  aiBudgetAdviceEnabled: boolean
  aiEnergyAdaptation: boolean
  dataSharingEnabled: boolean
  workHoursStart: string
  workHoursEnd: string
  breakDuration: number
}

interface UserProfile {
  id: string
  email: string
  name: string
  timezone: string
}

export function SettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [profileData, setProfileData] = useState({
    name: '',
    timezone: 'UTC'
  })

  const [settingsData, setSettingsData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    aiSchedulingEnabled: true,
    aiBudgetAdviceEnabled: true,
    aiEnergyAdaptation: true,
    dataSharingEnabled: false,
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    breakDuration: 15
  })

  // Fetch user profile
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/user/profile')
      return response.data.data
    }
  })

  // Fetch user settings
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await api.get('/user/settings')
      return response.data.data
    }
  })

  // Initialize form data when data loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        timezone: profile.timezone || 'UTC'
      })
    }
  }, [profile])

  // Auto-detect timezone from user's location
  useEffect(() => {
    const detectTimezone = async () => {
      try {
        const timezoneInfo = await getCurrentTimezone()
        if (timezoneInfo && timezoneInfo.timezone !== 'UTC') {
          console.log('🌍 Auto-detected timezone:', timezoneInfo.timezone)
          setProfileData(prev => ({
            ...prev,
            timezone: timezoneInfo.timezone
          }))
        }
      } catch (error) {
        console.error('Error detecting timezone:', error)
      }
    }

    detectTimezone()
  }, [])

  useEffect(() => {
    if (settings) {
      setSettingsData({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        aiSchedulingEnabled: settings.aiSchedulingEnabled,
        aiBudgetAdviceEnabled: settings.aiBudgetAdviceEnabled,
        aiEnergyAdaptation: settings.aiEnergyAdaptation,
        dataSharingEnabled: settings.dataSharingEnabled,
        workHoursStart: settings.workHoursStart,
        workHoursEnd: settings.workHoursEnd,
        breakDuration: settings.breakDuration
      })
    }
  }, [settings])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.put('/user/profile', data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Update the Zustand store with the new user data
      updateUser(variables)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive"
      })
    }
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await api.put('/user/settings', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update settings",
        variant: "destructive"
      })
    }
  })

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData)
  }

  const handleSettingsSave = () => {
    updateSettingsMutation.mutate(settingsData)
  }


  const timezones = [
    { value: 'UTC-12', label: 'UTC-12 (Baker Island)' },
    { value: 'UTC-11', label: 'UTC-11 (Samoa)' },
    { value: 'UTC-10', label: 'UTC-10 (Hawaii)' },
    { value: 'UTC-9', label: 'UTC-9 (Alaska)' },
    { value: 'UTC-8', label: 'UTC-8 (Pacific)' },
    { value: 'UTC-7', label: 'UTC-7 (Mountain)' },
    { value: 'UTC-6', label: 'UTC-6 (Central)' },
    { value: 'UTC-5', label: 'UTC-5 (Eastern)' },
    { value: 'UTC-4', label: 'UTC-4 (Atlantic)' },
    { value: 'UTC-3', label: 'UTC-3 (Brazil)' },
    { value: 'UTC-2', label: 'UTC-2 (Mid-Atlantic)' },
    { value: 'UTC-1', label: 'UTC-1 (Azores)' },
    { value: 'UTC+0', label: 'UTC+0 (GMT)' },
    { value: 'UTC+1', label: 'UTC+1 (Central European)' },
    { value: 'UTC+2', label: 'UTC+2 (Eastern European)' },
    { value: 'UTC+3', label: 'UTC+3 (Moscow)' },
    { value: 'UTC+4', label: 'UTC+4 (Gulf)' },
    { value: 'UTC+5', label: 'UTC+5 (Pakistan)' },
    { value: 'UTC+6', label: 'UTC+6 (Bangladesh)' },
    { value: 'UTC+7', label: 'UTC+7 (Thailand)' },
    { value: 'UTC+8', label: 'UTC+8 (China)' },
    { value: 'UTC+9', label: 'UTC+9 (Japan)' },
    { value: 'UTC+10', label: 'UTC+10 (Australia Eastern)' },
    { value: 'UTC+11', label: 'UTC+11 (Solomon Islands)' },
    { value: 'UTC+12', label: 'UTC+12 (New Zealand)' }
  ]

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
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
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select 
                  id="timezone"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  value={profileData.timezone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>


              <Button 
                className="w-full" 
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
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
                <Switch
                  checked={settingsData.emailNotifications}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Browser notifications</p>
                </div>
                <Switch
                  checked={settingsData.pushNotifications}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, pushNotifications: checked }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-muted-foreground">Text message alerts</p>
                </div>
                <Switch
                  checked={settingsData.smsNotifications}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, smsNotifications: checked }))}
                />
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleSettingsSave}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>AI Preferences</span>
            </CardTitle>
            <CardDescription>
              Customize AI behavior and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">AI Scheduling</h4>
                  <p className="text-sm text-muted-foreground">Let AI suggest optimal scheduling</p>
                </div>
                <Switch
                  checked={settingsData.aiSchedulingEnabled}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, aiSchedulingEnabled: checked }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Budget Advice</h4>
                  <p className="text-sm text-muted-foreground">Get AI-powered financial recommendations</p>
                </div>
                <Switch
                  checked={settingsData.aiBudgetAdviceEnabled}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, aiBudgetAdviceEnabled: checked }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Energy Adaptation</h4>
                  <p className="text-sm text-muted-foreground">Adjust tasks based on your energy levels</p>
                </div>
                <Switch
                  checked={settingsData.aiEnergyAdaptation}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, aiEnergyAdaptation: checked }))}
                />
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleSettingsSave}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save AI Preferences
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
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
                  <p className="text-sm text-muted-foreground">Allow anonymous usage data for improvements</p>
                </div>
                <Switch
                  checked={settingsData.dataSharingEnabled}
                  onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, dataSharingEnabled: checked }))}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="workHoursStart">Work Hours Start</Label>
                  <Input
                    id="workHoursStart"
                    type="time"
                    value={settingsData.workHoursStart}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, workHoursStart: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workHoursEnd">Work Hours End</Label>
                  <Input
                    id="workHoursEnd"
                    type="time"
                    value={settingsData.workHoursEnd}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, workHoursEnd: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                  <Input
                    id="breakDuration"
                    type="number"
                    min="5"
                    max="60"
                    value={settingsData.breakDuration}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 15 }))}
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleSettingsSave}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Privacy Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}