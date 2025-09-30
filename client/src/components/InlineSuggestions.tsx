import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles, Check, X, Undo } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

interface Suggestion {
  id: string
  type: 'task' | 'event'
  title: string
  description: string
  reason: string
  confidence: number
  suggestedData: {
    priority?: string
    dueDate?: string
    startTime?: string
    endTime?: string
    tags?: string[]
    durationMin?: number
  }
}

interface InlineSuggestionsProps {
  type: 'task' | 'event'
  context?: string
  onAccept?: (suggestion: Suggestion, createdId: string) => void
}

export function InlineSuggestions({ type, context, onAccept }: InlineSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastAcceptedId, setLastAcceptedId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isFlagEnabled } = useFeatureFlags()

  // Check if suggestion feature is enabled
  if (!isFlagEnabled('askAI')) {
    return null
  }

  // Fetch suggestions when expanded
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suggestions', type, context],
    queryFn: async () => {
      const response = await api.post(`/suggestions/${type}s`, { context })
      return response.data.data.suggestions as Suggestion[]
    },
    enabled: isExpanded,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Accept suggestion mutation
  const acceptMutation = useMutation({
    mutationFn: async (suggestion: Suggestion) => {
      const response = await api.post('/suggestions/accept', {
        suggestionId: suggestion.id,
        type: suggestion.type,
        data: {
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.suggestedData.priority,
          dueDate: suggestion.suggestedData.dueDate,
          startTime: suggestion.suggestedData.startTime,
          endTime: suggestion.suggestedData.endTime,
          durationMin: suggestion.suggestedData.durationMin
        }
      })
      return { suggestion, response: response.data }
    },
    onSuccess: ({ suggestion, response }) => {
      const createdId = response.data.id
      
      // Show success toast with undo
      toast({
        title: `${type === 'task' ? 'Task' : 'Event'} Added`,
        description: (
          <div className="flex items-center justify-between">
            <span className="flex-1">{suggestion.title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUndo(createdId)}
              className="ml-2"
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>
          </div>
        ),
        duration: 5000
      })

      // Track for undo
      setLastAcceptedId(createdId)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      // Callback
      if (onAccept) {
        onAccept(suggestion, createdId)
      }

      // Refetch suggestions
      refetch()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add suggestion',
        description: error.response?.data?.error || 'Please try again',
        variant: 'destructive'
      })
    }
  })

  // Reject suggestion mutation
  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      await api.post('/suggestions/reject', { suggestionId })
    },
    onSuccess: () => {
      // Just refetch suggestions
      refetch()
    }
  })

  // Undo accepted suggestion
  const handleUndo = async (itemId: string) => {
    try {
      if (type === 'task') {
        await api.delete(`/tasks/${itemId}`)
      } else {
        await api.delete(`/calendar/events/${itemId}`)
      }

      toast({
        title: 'Undone',
        description: `${type === 'task' ? 'Task' : 'Event'} removed`
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      setLastAcceptedId(null)
    } catch (error) {
      toast({
        title: 'Undo failed',
        description: 'Unable to remove item',
        variant: 'destructive'
      })
    }
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Suggest {type === 'task' ? 'Tasks' : 'Events'}…
      </Button>
    )
  }

  return (
    <div className="space-y-3 border-t pt-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">AI Suggestions</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((suggestion) => (
            <Card key={suggestion.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
                  {suggestion.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {suggestion.description}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {suggestion.reason}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => acceptMutation.mutate(suggestion)}
                    disabled={acceptMutation.isPending}
                    className="h-8 w-8 p-0"
                    title="Add"
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectMutation.mutate(suggestion.id)}
                    disabled={rejectMutation.isPending}
                    className="h-8 w-8 p-0"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No suggestions available right now
        </p>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        disabled={isLoading}
        className="w-full"
      >
        Refresh Suggestions
      </Button>
    </div>
  )
}
