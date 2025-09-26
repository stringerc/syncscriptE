export interface Notification {
  id: string
  type: 'task_reminder' | 'event_reminder' | 'energy_alert' | 'achievement' | 'system' | 'deadline_warning'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionText?: string
  metadata?: {
    taskId?: string
    eventId?: string
    energyLevel?: number
    userId?: string
  }
  expiresAt?: Date
  channels: NotificationChannel[]
}

export interface NotificationChannel {
  type: 'in_app' | 'email' | 'push' | 'desktop'
  enabled: boolean
  settings?: {
    sound?: boolean
    vibration?: boolean
    desktopEnabled?: boolean
  }
}

export interface NotificationPreferences {
  userId: string
  channels: {
    in_app: {
      enabled: boolean
      sound: boolean
      showBadge: boolean
    }
    email: {
      enabled: boolean
      frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'disabled'
      types: string[]
    }
    push: {
      enabled: boolean
      sound: boolean
      vibration: boolean
    }
    desktop: {
      enabled: boolean
      sound: boolean
      showPreview: boolean
    }
  }
  timing: {
    quietHours: {
      enabled: boolean
      start: string // HH:mm format
      end: string // HH:mm format
      timezone: string
    }
    energyBasedTiming: boolean
    respectFocusMode: boolean
  }
  types: {
    task_reminders: {
      enabled: boolean
      advanceMinutes: number
      priority: 'low' | 'medium' | 'high'
    }
    event_reminders: {
      enabled: boolean
      advanceMinutes: number
      priority: 'low' | 'medium' | 'high'
    }
    energy_alerts: {
      enabled: boolean
      threshold: number
      priority: 'low' | 'medium' | 'high'
    }
    achievements: {
      enabled: boolean
      priority: 'low' | 'medium' | 'high'
    }
    deadline_warnings: {
      enabled: boolean
      advanceHours: number
      priority: 'low' | 'medium' | 'high'
    }
    system: {
      enabled: boolean
      priority: 'low' | 'medium' | 'high'
    }
  }
}

export interface NotificationTemplate {
  id: string
  type: string
  title: string
  message: string
  variables: string[]
  channels: NotificationChannel[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  recentActivity: {
    today: number
    thisWeek: number
    thisMonth: number
  }
}
