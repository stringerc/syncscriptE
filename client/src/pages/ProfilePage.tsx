import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/contexts/ThemeContext'
import { LocationSettings } from '@/components/LocationSettings'
import { getCurrentTimezone } from '@/utils/timezone'
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  Calendar,
  Target,
  TrendingUp,
  Settings,
  FolderOpen
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: string
  isEmailVerified: boolean
  preferences: {
    notifications: boolean
    darkMode: boolean
    timezone: string
  }
}

interface ProfileStats {
  totalTasks: number
  completedTasks: number
  totalEvents: number
  streakDays: number
}

export function ProfilePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    darkMode: false,
    timezone: 'UTC'
  })

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/user/profile')
      return response.data.data
    }
  })

  // Fetch profile stats
  const { data: stats } = useQuery<ProfileStats>({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const response = await api.get('/user/profile/stats')
      return response.data.data
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.put('/user/profile', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive"
      })
    }
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/user/password', data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully."
      })
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.response?.data?.error || "Failed to change password",
        variant: "destructive"
      })
    }
  })

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/user/resend-verification')
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your email and click the verification link."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Email",
        description: error.response?.data?.error || "Failed to resend verification email",
        variant: "destructive"
      })
    }
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/user/account')
      return response.data
    },
    onSuccess: () => {
      localStorage.removeItem('syncscript-auth')
      window.location.href = '/auth'
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.response?.data?.error || "Failed to delete account",
        variant: "destructive"
      })
    }
  })

  // Auto-detect timezone from user's location
  useEffect(() => {
    const detectTimezone = async () => {
      try {
        const timezoneInfo = await getCurrentTimezone()
        if (timezoneInfo && timezoneInfo.timezone !== 'UTC') {
          console.log('🌍 Auto-detected timezone:', timezoneInfo.timezone)
          // Update form data with detected timezone
          setFormData(prev => ({
            ...prev,
            timezone: timezoneInfo.timezone
          }))
          
          // Optionally auto-save the timezone
          // updateProfileMutation.mutate({ timezone: timezoneInfo.timezone })
        }
      } catch (error) {
        console.error('Error detecting timezone:', error)
      }
    }

    detectTimezone()
  }, [])

  // Initialize form data when profile loads
  if (profile && !formData.name) {
    setFormData({
      name: profile.name || '',
      email: profile.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      notifications: profile.preferences?.notifications ?? true,
      darkMode: theme === 'dark', // Use actual theme state
      timezone: profile.preferences?.timezone || 'UTC'
    })
  }

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: formData.name,
      preferences: {
        notifications: formData.notifications,
        timezone: formData.timezone
      }
    })
  }

  const handleChangePassword = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }
    
    if (formData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      })
      return
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    })
  }

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      deleteAccountMutation.mutate()
    } else {
      setShowDeleteConfirm(true)
    }
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-muted rounded-lg" />
              <div className="h-32 bg-muted rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded-lg" />
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <User className="w-10 h-10" />
              Profile Settings
            </h1>
            <p className="text-white/90 text-lg">
              Manage your account settings and preferences
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your personal details and account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    {profile?.isEmailVerified ? (
                      <span className="text-green-600 text-sm">✓ Verified</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600 text-sm">⚠ Unverified</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => resendVerificationMutation.mutate()}
                          disabled={resendVerificationMutation.isPending}
                          className="text-xs"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          {resendVerificationMutation.isPending ? "Sending..." : "Resend"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !formData.currentPassword || !formData.newPassword}
              >
                <Lock className="w-4 h-4 mr-2" />
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your SyncScript experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      setFormData(prev => ({ ...prev, notifications: checked }))
                      // Immediately save the preference
                      updateProfileMutation.mutate({
                        name: formData.name,
                        preferences: {
                          notifications: checked,
                          timezone: formData.timezone
                        }
                      })
                      toast({
                        title: "Notification Preference Updated",
                        description: `Email notifications ${checked ? 'enabled' : 'disabled'}.`
                      })
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
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => {
                    setTheme(checked ? 'dark' : 'light')
                    setFormData(prev => ({ ...prev, darkMode: checked }))
                    // Theme is handled by localStorage, no need to save to backend
                    toast({
                      title: "Theme Updated",
                      description: `Switched to ${checked ? 'dark' : 'light'} theme.`
                    })
                  }}
                />
              </div>
              
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

          {/* Location Settings */}
          <LocationSettings />

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                My Resources
              </CardTitle>
              <CardDescription>
                Manage all your resources across tasks and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View and manage all your URLs, notes, and files from tasks and events in one place.
                </p>
                <Button 
                  onClick={() => navigate('/profile/resources')}
                  className="w-full"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Resources Library
                </Button>
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
                <span className="text-2xl font-bold text-purple-600">{stats?.totalTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-green-700">Completed</span>
                <span className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-blue-700">Events Created</span>
                <span className="text-2xl font-bold text-blue-600">{stats?.totalEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300">
                <span className="text-sm font-medium text-orange-700">Current Streak 🔥</span>
                <span className="text-2xl font-bold text-orange-600">{stats?.streakDays || 0} days</span>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <p className="text-sm">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Account ID</Label>
                <p className="text-sm font-mono text-xs">{profile?.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {showDeleteConfirm 
                  ? (deleteAccountMutation.isPending ? "Deleting..." : "Confirm Delete Account")
                  : "Delete Account"
                }
              </Button>
              {showDeleteConfirm && (
                <p className="text-xs text-muted-foreground mt-2">
                  This will permanently delete your account and all data. This action cannot be undone.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
