import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, AlertCircle, ExternalLink } from 'lucide-react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { Button } from '@/components/ui/button'

interface SearchResult {
  id: string
  type: 'task' | 'event' | 'resource'
  title: string
  description: string
  relevance: number
  matchedFields: string[]
  metadata?: any
}

interface Citation {
  itemId: string
  itemType: 'task' | 'event' | 'resource'
  title: string
  excerpt: string
}

interface AISearchResponse {
  keywordResults: SearchResult[]
  aiAnswer?: string
  citations?: Citation[]
  fallbackMode: boolean
  latency: number
}

interface AISearchPanelProps {
  query: string
  onResultClick?: (result: SearchResult) => void
}

export function AISearchPanel({ query, onResultClick }: AISearchPanelProps) {
  const { isFlagEnabled } = useFeatureFlags()

  // Only fetch if askAI flag is enabled and query is present
  const { data, isLoading, error } = useQuery<AISearchResponse>({
    queryKey: ['ai-search', query],
    queryFn: async () => {
      const response = await api.get(`/search/ai?q=${encodeURIComponent(query)}`)
      return response.data.data
    },
    enabled: isFlagEnabled('askAI') && query.trim().length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  })

  if (!isFlagEnabled('askAI')) {
    return null
  }

  if (!query || query.trim().length < 3) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Type at least 3 characters to search with AI</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Searching with AI...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Search failed</p>
              <p className="text-sm text-red-700 mt-1">
                Unable to perform AI search. Please try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const { keywordResults, aiAnswer, citations, fallbackMode, latency } = data

  return (
    <div className="space-y-4">
      {/* Performance Badge */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {fallbackMode ? '⚡ Keyword mode' : '🤖 AI-enhanced'} • {latency}ms
        </Badge>
        {fallbackMode && (
          <p className="text-xs text-muted-foreground">
            AI timed out, showing keyword results
          </p>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Keyword Results */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Matching Items ({keywordResults.length})
          </h3>
          
          {keywordResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p className="text-sm">No matching items found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {keywordResults.map((result) => (
                <Card
                  key={result.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onResultClick?.(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(result.relevance)}% match
                          </span>
                        </div>
                        <h4 className="font-medium text-sm truncate">{result.title}</h4>
                        {result.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        {result.matchedFields.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {result.matchedFields.map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: AI Answer */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            AI Answer
          </h3>

          {aiAnswer ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {aiAnswer}
                </p>

                {citations && citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-2">
                      Sources:
                    </p>
                    <div className="space-y-2">
                      {citations.map((citation) => (
                        <Button
                          key={citation.itemId}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => {
                            const result = keywordResults.find(
                              r => r.id === citation.itemId && r.type === citation.itemType
                            )
                            if (result) onResultClick?.(result)
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {citation.itemType}
                              </Badge>
                              <span className="font-medium text-xs truncate">
                                {citation.title}
                              </span>
                            </div>
                            {citation.excerpt && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {citation.excerpt}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {fallbackMode 
                    ? 'AI answer unavailable (timeout)' 
                    : 'Unable to generate AI answer'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Fix import reference
import { Search } from 'lucide-react'
