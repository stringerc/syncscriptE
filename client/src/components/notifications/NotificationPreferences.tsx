import React, { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { NotificationPreferences as NotificationPrefs } from '@/types/notification'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Smartphone, Monitor, Clock, Zap } from 'lucide-react'

interface NotificationPreferencesProps {
  className?: string
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ className }) => {
  const { preferences, updatePreferences, isLoading } = useNotifications()
  const [localPreferences, setLocalPreferences] = useState<NotificationPrefs | null>(preferences)

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences])

  const handleSave = () => {
    if (localPreferences) {
      updatePreferences(localPreferences)
    }
  }

  const updateChannelSetting = (channel: keyof NotificationPrefs['channels'], setting: string, value: any) => {
    if (!localPreferences) return
    
    setLocalPreferences({
      ...localPreferences,
      channels: {
        ...localPreferences.channels,
        [channel]: {
          ...localPreferences.channels[channel],
          [setting]: value
        }
      }
    })
  }

  const updateTypeSetting = (type: keyof NotificationPrefs['types'], setting: string, value: any) => {
    if (!localPreferences) return
    
    setLocalPreferences({
      ...localPreferences,
      types: {
        ...localPreferences.types,
        [type]: {
          ...localPreferences.types[type],
          [setting]: value
        }
      }
    })
  }

  const updateTimingSetting = (setting: string, value: any) => {
    if (!localPreferences) return
    
    setLocalPreferences({
      ...localPreferences,
      timing: {
        ...localPreferences.timing,
        [setting]: value
      }
    })
  }

  if (isLoading || !localPreferences) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading preferences...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notification Settings</h2>
            <p className="text-gray-600">Customize how and when you receive notifications</p>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Changes
          </Button>
        </div>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* In-App Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="text-base font-medium">In-App Notifications</Label>
                  <p className="text-sm text-gray-600">Show notifications within the app</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.channels.in_app.enabled}
                onCheckedChange={(checked) => updateChannelSetting('in_app', 'enabled', checked)}
              />
            </div>

            {/* Email Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-500" />
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.channels.email.enabled}
                  onCheckedChange={(checked) => updateChannelSetting('email', 'enabled', checked)}
                />
              </div>
              
              {localPreferences.channels.email.enabled && (
                <div className="ml-8 space-y-2">
                  <Label className="text-sm">Email Frequency</Label>
                  <Select
                    value={localPreferences.channels.email.frequency}
                    onValueChange={(value) => updateChannelSetting('email', 'frequency', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily_digest">Daily Digest</SelectItem>
                      <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Receive push notifications on mobile devices</p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.channels.push.enabled}
                  onCheckedChange={(checked) => updateChannelSetting('push', 'enabled', checked)}
                />
              </div>
              
              {localPreferences.channels.push.enabled && (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Sound</Label>
                    <Switch
                      checked={localPreferences.channels.push.sound}
                      onCheckedChange={(checked) => updateChannelSetting('push', 'sound', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Vibration</Label>
                    <Switch
                      checked={localPreferences.channels.push.vibration}
                      onCheckedChange={(checked) => updateChannelSetting('push', 'vibration', checked)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing Settings
            </CardTitle>
            <CardDescription>
              Control when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiet Hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Quiet Hours</Label>
                <Switch
                  checked={localPreferences.timing.quietHours.enabled}
                  onCheckedChange={(checked) => updateTimingSetting('quietHours', { ...localPreferences.timing.quietHours, enabled: checked })}
                />
              </div>
              
              {localPreferences.timing.quietHours.enabled && (
                <div className="ml-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm w-16">From:</Label>
                    <Input
                      type="time"
                      value={localPreferences.timing.quietHours.start}
                      onChange={(e) => updateTimingSetting('quietHours', { ...localPreferences.timing.quietHours, start: e.target.value })}
                      className="w-32"
                    />
                    <Label className="text-sm w-16">To:</Label>
                    <Input
                      type="time"
                      value={localPreferences.timing.quietHours.end}
                      onChange={(e) => updateTimingSetting('quietHours', { ...localPreferences.timing.quietHours, end: e.target.value })}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Energy-Based Timing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <Label className="text-base font-medium">Energy-Based Timing</Label>
                  <p className="text-sm text-gray-600">Optimize notification timing based on energy levels</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.timing.energyBasedTiming}
                onCheckedChange={(checked) => updateTimingSetting('energyBasedTiming', checked)}
              />
            </div>

            {/* Respect Focus Mode */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Respect Focus Mode</Label>
                <p className="text-sm text-gray-600">Reduce notifications during focus sessions</p>
              </div>
              <Switch
                checked={localPreferences.timing.respectFocusMode}
                onCheckedChange={(checked) => updateTimingSetting('respectFocusMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Configure settings for different types of notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task Reminders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Task Reminders</Label>
                  <p className="text-sm text-gray-600">Reminders for upcoming tasks</p>
                </div>
                <Switch
                  checked={localPreferences.types.task_reminders.enabled}
                  onCheckedChange={(checked) => updateTypeSetting('task_reminders', 'enabled', checked)}
                />
              </div>
              
              {localPreferences.types.task_reminders.enabled && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Advance notice:</Label>
                    <Input
                      type="number"
                      value={localPreferences.types.task_reminders.advanceMinutes}
                      onChange={(e) => updateTypeSetting('task_reminders', 'advanceMinutes', parseInt(e.target.value))}
                      className="w-20"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Event Reminders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Event Reminders</Label>
                  <p className="text-sm text-gray-600">Reminders for upcoming events</p>
                </div>
                <Switch
                  checked={localPreferences.types.event_reminders.enabled}
                  onCheckedChange={(checked) => updateTypeSetting('event_reminders', 'enabled', checked)}
                />
              </div>
              
              {localPreferences.types.event_reminders.enabled && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Advance notice:</Label>
                    <Input
                      type="number"
                      value={localPreferences.types.event_reminders.advanceMinutes}
                      onChange={(e) => updateTypeSetting('event_reminders', 'advanceMinutes', parseInt(e.target.value))}
                      className="w-20"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Energy Alerts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Energy Alerts</Label>
                  <p className="text-sm text-gray-600">Alerts when energy levels are low</p>
                </div>
                <Switch
                  checked={localPreferences.types.energy_alerts.enabled}
                  onCheckedChange={(checked) => updateTypeSetting('energy_alerts', 'enabled', checked)}
                />
              </div>
              
              {localPreferences.types.energy_alerts.enabled && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Alert threshold:</Label>
                    <Input
                      type="number"
                      value={localPreferences.types.energy_alerts.threshold}
                      onChange={(e) => updateTypeSetting('energy_alerts', 'threshold', parseInt(e.target.value))}
                      className="w-20"
                      min="1"
                      max="10"
                    />
                    <span className="text-sm text-gray-600">/ 10</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Achievements */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Achievement Notifications</Label>
                <p className="text-sm text-gray-600">Celebrate your accomplishments</p>
              </div>
              <Switch
                checked={localPreferences.types.achievements.enabled}
                onCheckedChange={(checked) => updateTypeSetting('achievements', 'enabled', checked)}
              />
            </div>

            <Separator />

            {/* Deadline Warnings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Deadline Warnings</Label>
                  <p className="text-sm text-gray-600">Warnings for approaching deadlines</p>
                </div>
                <Switch
                  checked={localPreferences.types.deadline_warnings.enabled}
                  onCheckedChange={(checked) => updateTypeSetting('deadline_warnings', 'enabled', checked)}
                />
              </div>
              
              {localPreferences.types.deadline_warnings.enabled && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Advance warning:</Label>
                    <Input
                      type="number"
                      value={localPreferences.types.deadline_warnings.advanceHours}
                      onChange={(e) => updateTypeSetting('deadline_warnings', 'advanceHours', parseInt(e.target.value))}
                      className="w-20"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">hours</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* System Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">System Notifications</Label>
                <p className="text-sm text-gray-600">Important system updates and alerts</p>
              </div>
              <Switch
                checked={localPreferences.types.system.enabled}
                onCheckedChange={(checked) => updateTypeSetting('system', 'enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
