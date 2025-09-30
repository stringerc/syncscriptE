import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Lock, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface BadgePreview {
  id: string
  title: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isUnlocked: boolean
  progress: number
  maxProgress: number
  unlockCondition: string
}

const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-200',
  rare: 'bg-blue-100 text-blue-800 border-blue-200',
  epic: 'bg-purple-100 text-purple-800 border-purple-200',
  legendary: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const rarityIcons = {
  common: '🥉',
  rare: '🥈',
  epic: '🥇',
  legendary: '👑'
}

export function BadgePreview() {
  // Fetch all available badges with progress
  const { data: badgesData, isLoading } = useQuery({
    queryKey: ['badge-preview'],
    queryFn: async () => {
      const response = await api.get('/gamification/badges/preview')
      return response.data
    }
  })

  const badges = badgesData?.data?.badges || []

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Badge Catalog
          </CardTitle>
          <CardDescription>
            Discover all available badges and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge: BadgePreview) => (
              <div
                key={badge.id}
                className={cn(
                  "p-4 border-2 rounded-lg transition-all",
                  badge.isUnlocked 
                    ? "border-green-200 bg-green-50 hover:border-green-300" 
                    : "border-gray-200 bg-gray-50 hover:border-gray-300",
                  "hover:shadow-md"
                )}
              >
                {/* Badge Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-sm",
                        badge.isUnlocked ? "text-foreground" : "text-gray-500"
                      )}>
                        {badge.title}
                      </h3>
                      <Badge 
                        className={cn(
                          "text-xs mt-1",
                          rarityColors[badge.rarity]
                        )}
                      >
                        {rarityIcons[badge.rarity]} {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {badge.isUnlocked ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {badge.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={cn(
                      "font-medium",
                      badge.isUnlocked ? "text-green-600" : "text-gray-600"
                    )}>
                      {badge.progress}/{badge.maxProgress}
                    </span>
                  </div>
                  <Progress 
                    value={(badge.progress / badge.maxProgress) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Unlock Condition */}
                <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                  <span className="font-medium text-muted-foreground">Unlock:</span>
                  <p className="text-muted-foreground mt-1">
                    {badge.unlockCondition}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {badges.filter((b: BadgePreview) => b.isUnlocked).length}
                </p>
                <p className="text-sm text-muted-foreground">Unlocked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {badges.filter((b: BadgePreview) => !b.isUnlocked).length}
                </p>
                <p className="text-sm text-muted-foreground">Locked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {badges.filter((b: BadgePreview) => b.rarity === 'legendary').length}
                </p>
                <p className="text-sm text-muted-foreground">Legendary</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {badges.filter((b: BadgePreview) => b.rarity === 'epic').length}
                </p>
                <p className="text-sm text-muted-foreground">Epic</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
