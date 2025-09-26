import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Clock, Calendar, CheckCircle, MessageSquare, Zap, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'task' | 'event' | 'ai_response'
  title: string
  description?: string
  date?: string
  status?: string
  priority?: string
  location?: string
  content?: string
  relevanceScore?: number
}

interface SearchResponse {
  tasks: SearchResult[]
  events: SearchResult[]
  aiResponse?: string
  totalResults: number
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  // Search query
  const { data: searchResults, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return { tasks: [], events: [], totalResults: 0 }
      
      setIsSearching(true)
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query.trim())}`)
        return response.data.data || response.data
      } catch (error) {
        console.error('Search error:', error)
        // Fallback to local search if API fails
        return await performLocalSearch(query.trim())
      } finally {
        setIsSearching(false)
      }
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Local search fallback
  const performLocalSearch = async (searchQuery: string): Promise<SearchResponse> => {
    try {
      const [tasksResponse, eventsResponse] = await Promise.all([
        api.get('/tasks'),
        api.get('/calendar')
      ])

      const allTasks = tasksResponse.data.data || tasksResponse.data || []
      const allEvents = eventsResponse.data.data || eventsResponse.data || []

      const filteredTasks = allTasks.filter((task: any) => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).map((task: any) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description,
        date: task.dueDate || task.scheduledAt,
        status: task.status,
        priority: task.priority,
        relevanceScore: calculateRelevanceScore(task.title, searchQuery)
      }))

      const filteredEvents = allEvents.filter((event: any) => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).map((event: any) => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description,
        date: event.startTime,
        location: event.location,
        relevanceScore: calculateRelevanceScore(event.title, searchQuery)
      }))

      // Sort by relevance
      filteredTasks.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      filteredEvents.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

      return {
        tasks: filteredTasks,
        events: filteredEvents,
        totalResults: filteredTasks.length + filteredEvents.length
      }
    } catch (error) {
      console.error('Local search error:', error)
      return { tasks: [], events: [], totalResults: 0 }
    }
  }

  const calculateRelevanceScore = (text: string, query: string): number => {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()
    
    if (textLower === queryLower) return 100
    if (textLower.startsWith(queryLower)) return 90
    if (textLower.includes(queryLower)) return 70
    return 50
  }

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery.trim())
      setSearchParams({ q: searchQuery.trim() })
    }
  }, [setSearchParams])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
  }, [query, handleSearch])

  const clearSearch = () => {
    setQuery('')
    setSearchParams({})
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const totalResults = searchResults?.totalResults || 0
  const tasks = searchResults?.tasks || []
  const events = searchResults?.events || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-gray-600">
            Search tasks, events, or ask AI anything
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search tasks, events, or ask AI anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => handleSearch(query)}
            disabled={!query.trim() || isLoading}
            className="h-8"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {query && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Searching...' : `${totalResults} results for "${query}"`}
            </p>
            {totalResults > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Filter by type</span>
              </div>
            )}
          </div>

          {/* Results Tabs */}
          {totalResults > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="events">
                  Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="ai">
                  AI Assistant
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {/* Tasks */}
                    {tasks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Tasks ({tasks.length})
                        </h3>
                        <div className="grid gap-3">
                          {tasks.map((task) => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{task.title}</CardTitle>
                                    {task.description && (
                                      <CardDescription className="mt-1">
                                        {task.description}
                                      </CardDescription>
                                    )}
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    {task.status && (
                                      <Badge className={getStatusColor(task.status)}>
                                        {task.status}
                                      </Badge>
                                    )}
                                    {task.priority && (
                                      <Badge className={getPriorityColor(task.priority)}>
                                        {task.priority}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              {task.date && (
                                <CardContent className="pt-0">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(task.date)}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {events.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          Events ({events.length})
                        </h3>
                        <div className="grid gap-3">
                          {events.map((event) => (
                            <Card key={event.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{event.title}</CardTitle>
                                    {event.description && (
                                      <CardDescription className="mt-1">
                                        {event.description}
                                      </CardDescription>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0 space-y-2">
                                {event.date && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(event.date)}
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    {event.location}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tasks">
                <ScrollArea className="h-[600px]">
                  <div className="grid gap-3">
                    {tasks.map((task) => (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{task.title}</CardTitle>
                              {task.description && (
                                <CardDescription className="mt-1">
                                  {task.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              {task.status && (
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status}
                                </Badge>
                              )}
                              {task.priority && (
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {task.date && (
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {formatDate(task.date)}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="events">
                <ScrollArea className="h-[600px]">
                  <div className="grid gap-3">
                    {events.map((event) => (
                      <Card key={event.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{event.title}</CardTitle>
                              {event.description && (
                                <CardDescription className="mt-1">
                                  {event.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {event.date && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {formatDate(event.date)}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ai">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription>
                      Ask AI about your tasks, events, or get productivity advice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          AI search functionality will be integrated here. For now, you can ask questions in the AI Assistant page.
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate('/ai-assistant')}
                        className="w-full"
                      >
                        Go to AI Assistant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* No Results */}
          {!isLoading && totalResults === 0 && query && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  Try searching with different keywords or check your spelling.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Search suggestions:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['meeting', 'deadline', 'project', 'appointment'].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearch(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!query && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-gray-600 mb-6">
              Search through your tasks, events, or ask AI for help with productivity.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Tasks</h4>
                  <p className="text-sm text-gray-600">Find tasks by title or description</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Events</h4>
                  <p className="text-sm text-gray-600">Search calendar events and meetings</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">AI Assistant</h4>
                  <p className="text-sm text-gray-600">Get AI-powered productivity advice</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SearchPage
