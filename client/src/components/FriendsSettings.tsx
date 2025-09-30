import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Zap, Trophy } from 'lucide-react'

export function FriendsSettings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch current preferences
  const { data: prefsData } = useQuery({
    queryKey: ['friend-prefs'],
    queryFn: async () => {
      const response = await api.get('/friends/prefs')
      return response.data
    }
  })

  // Fetch privacy settings
  const { data: privacyData } = useQuery({
    queryKey: ['friend-privacy'],
    queryFn: async () => {
      const response = await api.get('/friends/privacy')
      return response.data
    }
  })

  const prefs = prefsData?.data || {}
  const privacy = privacyData?.data || {}

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await api.patch('/friends/prefs', updates)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-prefs'] })
      toast({
        title: 'Settings Updated',
        description: 'Your friend preferences have been saved.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update preferences',
        variant: 'destructive'
      })
    }
  })

  // Update privacy mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await api.patch('/friends/privacy', updates)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-privacy'] })
      toast({
        title: 'Privacy Updated',
        description: 'Your privacy settings have been saved.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update privacy',
        variant: 'destructive'
      })
    }
  })

  const handlePrefToggle = (key: string, value: boolean) => {
    updatePrefsMutation.mutate({ [key]: value })
  }

  const handlePrivacyToggle = (key: string, value: boolean) => {
    updatePrivacyMutation.mutate({ [key]: value })
  }

  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="space-y-6">
      {/* Friends List Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Friends List Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your friends list and what information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-friends">Show Friends List</Label>
              <p className="text-sm text-muted-foreground">
                Display your friends list on your profile
              </p>
            </div>
            <Switch
              id="show-friends"
              checked={prefs.showFriends !== false}
              onCheckedChange={(checked) => handlePrefToggle('showFriends', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="show-emblems" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Show Friend Emblems
              </Label>
              <p className="text-sm text-muted-foreground">
                Display energy emblems next to friend names
                {prefersReducedMotion && (
                  <span className="block text-xs text-yellow-600 mt-1">
                    ⚠️ Reduced motion enabled - animations will be minimal
                  </span>
                )}
              </p>
            </div>
            <Switch
              id="show-emblems"
              checked={prefs.showFriendEmblems === true}
              onCheckedChange={(checked) => handlePrefToggle('showFriendEmblems', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="show-energy" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Show Friend Energy Levels
              </Label>
              <p className="text-sm text-muted-foreground">
                Display energy levels (0-10) for your friends
              </p>
            </div>
            <Switch
              id="show-energy"
              checked={prefs.showFriendEnergy === true}
              onCheckedChange={(checked) => handlePrefToggle('showFriendEnergy', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="w-5 h-5" />
            Privacy Controls
          </CardTitle>
          <CardDescription>
            Control what information others can see about you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hide-emblems">Hide My Emblems</Label>
              <p className="text-sm text-muted-foreground">
                Don't show my energy emblem to anyone
              </p>
            </div>
            <Switch
              id="hide-emblems"
              checked={privacy.hideMyEmblems === true}
              onCheckedChange={(checked) => handlePrivacyToggle('hideMyEmblems', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hide-active">Hide Last Active</Label>
              <p className="text-sm text-muted-foreground">
                Don't show when I was last active
              </p>
            </div>
            <Switch
              id="hide-active"
              checked={privacy.hideLastActive === true}
              onCheckedChange={(checked) => handlePrivacyToggle('hideLastActive', checked)}
            />
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> These settings are conservative by default. 
              Friend emblems and energy levels are hidden until you explicitly enable them.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Notice */}
      {prefersReducedMotion && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Accessibility Detected:</strong> We've detected that you prefer reduced motion. 
              Emblem animations will be minimal or static to respect your preferences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
