import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Zap, Heart, Sparkles, Waves, Lock, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Emblem {
  id: string
  emblemType: string
  isUnlocked: boolean
  isActive: boolean
  metadata: {
    name: string
    description: string
    unlockCondition: string
  }
}

const emblemIcons = {
  bolt: <Zap className="w-6 h-6" />,
  heart: <Heart className="w-6 h-6" />,
  comet: <Sparkles className="w-6 h-6" />,
  wave: <Waves className="w-6 h-6" />
}

const emblemColors = {
  bolt: 'text-yellow-400',
  heart: 'text-red-400',
  comet: 'text-purple-400',
  wave: 'text-blue-400'
}

export function EmblemInventory() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedEmblem, setSelectedEmblem] = useState<Emblem | null>(null)

  // Fetch user's emblems
  const { data: emblemsData, isLoading } = useQuery({
    queryKey: ['energy-emblems'],
    queryFn: async () => {
      const response = await api.get('/energy-engine/emblems')
      return response.data
    }
  })

  const emblems = emblemsData?.data?.emblems || []

  // Equip emblem mutation
  const equipEmblemMutation = useMutation({
    mutationFn: async (emblemId: string) => {
      const response = await api.post(`/energy-engine/emblems/${emblemId}/equip`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['energy-emblems'] })
      queryClient.invalidateQueries({ queryKey: ['energy-status'] })
      toast({
        title: 'Emblem Equipped!',
        description: `${data.data.emblem.name} is now your active emblem`
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to equip emblem',
        variant: 'destructive'
      })
    }
  })

  const handleEquipEmblem = (emblemId: string) => {
    equipEmblemMutation.mutate(emblemId)
  }

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
            <Sparkles className="w-5 h-5" />
            Energy Emblem Inventory
          </CardTitle>
          <CardDescription>
            Collect and equip energy emblems to show your progress and style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {emblems.map((emblem: Emblem) => (
              <div
                key={emblem.id}
                className={cn(
                  "relative p-4 border-2 rounded-lg cursor-pointer transition-all",
                  emblem.isActive 
                    ? "border-primary bg-primary/5" 
                    : emblem.isUnlocked 
                      ? "border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100" 
                      : "border-gray-200 bg-gray-50 opacity-60",
                  "hover:scale-105"
                )}
                onClick={() => setSelectedEmblem(emblem)}
              >
                {/* Active indicator */}
                {emblem.isActive && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                {/* Lock icon for locked emblems */}
                {!emblem.isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}

                {/* Emblem icon */}
                <div className="flex justify-center mb-3">
                  <div className={cn(
                    "p-3 rounded-full",
                    emblem.isUnlocked ? emblemColors[emblem.emblemType as keyof typeof emblemColors] : "text-gray-400"
                  )}>
                    {emblemIcons[emblem.emblemType as keyof typeof emblemIcons]}
                  </div>
                </div>

                {/* Emblem info */}
                <div className="text-center">
                  <h3 className={cn(
                    "font-semibold text-sm mb-1",
                    emblem.isUnlocked ? "text-foreground" : "text-gray-400"
                  )}>
                    {emblem.metadata.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {emblem.isUnlocked ? 'Click to equip' : 'Locked'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emblem Detail Dialog */}
      <Dialog open={!!selectedEmblem} onOpenChange={() => setSelectedEmblem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEmblem && emblemIcons[selectedEmblem.emblemType as keyof typeof emblemIcons]}
              {selectedEmblem?.metadata.name}
            </DialogTitle>
            <DialogDescription>
              {selectedEmblem?.metadata.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmblem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedEmblem.isUnlocked ? "default" : "secondary"}>
                  {selectedEmblem.isUnlocked ? "Unlocked" : "Locked"}
                </Badge>
                {selectedEmblem.isActive && (
                  <Badge variant="outline">Currently Active</Badge>
                )}
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Unlock Condition:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEmblem.metadata.unlockCondition}
                </p>
              </div>

              {selectedEmblem.isUnlocked && !selectedEmblem.isActive && (
                <Button
                  onClick={() => {
                    handleEquipEmblem(selectedEmblem.id)
                    setSelectedEmblem(null)
                  }}
                  className="w-full"
                  disabled={equipEmblemMutation.isPending}
                >
                  {equipEmblemMutation.isPending ? 'Equipping...' : 'Equip This Emblem'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
