import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Play, Eye, TrendingUp } from 'lucide-react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

interface TemplateRecommendationsProps {
  eventId: string
  onApplied?: () => void
}

export function TemplateRecommendations({ eventId, onApplied }: TemplateRecommendationsProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isFlagEnabled } = useFeatureFlags()
  const recommendationsEnabled = isFlagEnabled('templates_recommendations')

  // Fetch recommendations
  const { data: recsData, isLoading } = useQuery({
    queryKey: ['template-recommendations', eventId],
    queryFn: async () => {
      const response = await api.get(`/templates/recommend?eventId=${eventId}`)
      return response.data
    },
    enabled: recommendationsEnabled && !!eventId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async (versionId: string) => {
      // Log click
      await api.post(`/templates/${versionId}/click`, { eventId })
      
      // Apply template
      const response = await api.post(`/templates/${versionId}/apply-to/${eventId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Template Applied!',
        description: 'Tasks have been created from this template'
      })
      onApplied?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to apply template',
        variant: 'destructive'
      })
    }
  })

  const recommendations = recsData?.data?.recommendations || []

  if (!recommendationsEnabled) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return null // No recommendations available
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Recommended Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec: any) => (
          <div
            key={rec.versionId}
            className="flex items-start gap-3 p-4 rounded-lg border bg-background hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rec.description}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
                  #{rec.position}
                </Badge>
              </div>

              {/* Reason */}
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {rec.reason}
              </p>

              {/* Tags & Category */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">{rec.category}</Badge>
                {rec.tags?.slice(0, 2).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Preview functionality (future)
                    toast({
                      title: 'Preview',
                      description: 'Preview feature coming soon'
                    })
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyMutation.mutate(rec.versionId)}
                  disabled={applyMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {applyMutation.isPending ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-center text-muted-foreground pt-2">
          💡 These templates match your event and can save you hours of planning
        </p>
      </CardContent>
    </Card>
  )
}
