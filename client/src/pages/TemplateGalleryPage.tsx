import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Search, BookTemplate, Play, Eye, TrendingUp, Star } from 'lucide-react'
import { useState } from 'react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

export function TemplateGalleryPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'gallery' | 'my-scripts'>('gallery')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [previewTemplate, setPreviewTemplate] = useState<any>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Fetch public catalog (Gallery)
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ['template-catalog', searchQuery, selectedCategory, selectedTags],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      
      const response = await api.get(`/templates/catalog?${params}`)
      return response.data
    },
    enabled: viewMode === 'gallery'
  })

  // Fetch user's scripts (My Scripts)
  const { data: myScriptsData, isLoading: myScriptsLoading } = useQuery({
    queryKey: ['my-scripts', searchQuery, showFavoritesOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (showFavoritesOnly) params.append('favorites', 'true')
      
      const response = await api.get(`/scripts/my-scripts?${params}`)
      return response.data
    },
    enabled: viewMode === 'my-scripts'
  })

  const isLoading = viewMode === 'gallery' ? catalogLoading : myScriptsLoading

  // Fetch user's events for apply
  const { data: eventsData } = useQuery({
    queryKey: ['user-events'],
    queryFn: async () => {
      const response = await api.get('/calendar')
      return response.data
    },
    enabled: true
  })

  const templates = viewMode === 'gallery' 
    ? (catalogData?.data?.templates || [])
    : (myScriptsData?.data || [])
  const events = eventsData?.data || []

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async ({ versionId, eventId }: { versionId: string; eventId: string }) => {
      const response = await api.get(`/templates/${versionId}/preview?eventId=${eventId}`)
      return response.data
    },
    onSuccess: (data) => {
      setPreviewTemplate(data.data)
    },
    onError: (error: any) => {
      toast({
        title: 'Preview Error',
        description: error.response?.data?.error || 'Failed to preview template',
        variant: 'destructive'
      })
    }
  })

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async ({ versionId, eventId }: { versionId: string; eventId: string }) => {
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
        description: 'Tasks and sub-events have been created'
      })
      setPreviewTemplate(null)
      setSelectedEventId('')
    },
    onError: (error: any) => {
      toast({
        title: 'Apply Error',
        description: error.response?.data?.error || 'Failed to apply template',
        variant: 'destructive'
      })
    }
  })

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ scriptId, isFavorite }: { scriptId: string; isFavorite: boolean }) => {
      const response = await api.post(`/scripts/${scriptId}/favorite`, { isFavorite })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-scripts'] })
      toast({
        title: 'Updated!',
        description: 'Script favorites updated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update favorite',
        variant: 'destructive'
      })
    }
  })

  // Gallery is always enabled for launch
  // Feature flag check removed

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookTemplate className="w-8 h-8" />
            {viewMode === 'gallery' ? 'Script Gallery' : 'My Scripts'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'gallery' 
              ? 'Browse curated scripts to plan faster'
              : 'Your saved scripts and templates'
            }
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('gallery')
              setShowFavoritesOnly(false)
            }}
            className="gap-2"
          >
            <BookTemplate className="w-4 h-4" />
            Gallery
          </Button>
          <Button
            variant={viewMode === 'my-scripts' ? 'default' : 'outline'}
            onClick={() => setViewMode('my-scripts')}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            My Scripts
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {viewMode === 'gallery' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-black"
              >
                <option value="">All Categories</option>
                <option value="Move">Move</option>
                <option value="Wedding">Wedding</option>
                <option value="Launch">Product Launch</option>
                <option value="Event">General Event</option>
                <option value="Hosting">Hosting</option>
                <option value="Travel">Travel</option>
              </select>

              {/* Tags */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="cursor-pointer">venue</Badge>
                <Badge variant="outline" className="cursor-pointer">logistics</Badge>
                <Badge variant="outline" className="cursor-pointer">guests</Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search your scripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Favorites Filter */}
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="gap-2"
              >
                <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-2">
              <BookTemplate className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                No templates found. Try different filters or search terms.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: any) => (
            <Card key={template.versionId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === 'my-scripts' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavoriteMutation.mutate({
                            scriptId: template.id || template.versionId,
                            isFavorite: !template.isFavorite
                          })
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Star 
                          className={`w-5 h-5 ${template.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                        />
                      </button>
                    )}
                    {viewMode === 'gallery' && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{template.quality}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category & Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{template.category}</Badge>
                  {template.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {template.applyCount || 0} uses
                  </div>
                  {template.createdBy && (
                    <div>by {template.createdBy}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      console.log('View Details clicked for template:', template)
                      try {
                        // Parse manifest to get tasks
                        const manifest = typeof template.manifest === 'string' 
                          ? JSON.parse(template.manifest)
                          : template.manifest
                        
                        console.log('Parsed manifest:', manifest)
                        
                        setPreviewTemplate({
                          ...template,
                          proposedTasks: manifest.tasks || []
                        })
                      } catch (error) {
                        console.error('Error parsing template:', error)
                        toast({
                          title: 'Error',
                          description: 'Failed to load template details',
                          variant: 'destructive'
                        })
                      }
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      console.log('Apply clicked, events:', events)
                      console.log('Template:', template)
                      
                      try {
                        const manifest = typeof template.manifest === 'string' 
                          ? JSON.parse(template.manifest)
                          : template.manifest
                        
                        console.log('Manifest parsed:', manifest)
                        console.log('Setting preview with showApply=true')
                        
                        const newPreview = {
                          ...template,
                          proposedTasks: manifest.tasks || [],
                          showApply: true
                        }
                        
                        console.log('New preview state:', newPreview)
                        setPreviewTemplate(newPreview)
                        console.log('setPreviewTemplate called successfully')
                      } catch (error) {
                        console.error('Error parsing template:', error)
                        toast({
                          title: 'Error',
                          description: 'Failed to load template',
                          variant: 'destructive'
                        })
                      }
                    }}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Apply to Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{previewTemplate.title || 'Script Details'}</DialogTitle>
              <DialogDescription>
                {previewTemplate.description || 'Review the tasks in this script'}
              </DialogDescription>
            </DialogHeader>
            
            {previewTemplate.showApply && (
              <div className="px-6 pb-4 space-y-3 border-b">
                <p className="text-sm font-medium">Choose how to use this script:</p>
                
                {/* Option 1: Create New Event */}
                <div className="space-y-2 p-3 border-2 border-purple-500/50 rounded-lg bg-purple-50/50 dark:bg-purple-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Create New Event from Script</p>
                    <Button
                      size="sm"
                      variant={selectedEventId === '__CREATE_NEW__' ? 'default' : 'outline'}
                      onClick={() => setSelectedEventId('__CREATE_NEW__')}
                    >
                      {selectedEventId === '__CREATE_NEW__' ? '✓ Selected' : 'Select'}
                    </Button>
                  </div>
                  
                  {selectedEventId === '__CREATE_NEW__' && (
                    <div className="space-y-2 mt-3">
                      <Input
                        placeholder="Event title (e.g., My Wedding)"
                        value={previewTemplate.newEventTitle || ''}
                        onChange={(e) => setPreviewTemplate({
                          ...previewTemplate,
                          newEventTitle: e.target.value
                        })}
                        className="bg-white dark:bg-gray-800"
                      />
                      <Input
                        type="datetime-local"
                        value={previewTemplate.newEventStartTime || ''}
                        onChange={(e) => setPreviewTemplate({
                          ...previewTemplate,
                          newEventStartTime: e.target.value
                        })}
                        className="bg-white dark:bg-gray-800"
                      />
                    </div>
                  )}
                </div>
                
                {/* Option 2: Apply to Existing Event */}
                <div className="space-y-2 p-3 border-2 border-blue-500/50 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Apply to Existing Event</p>
                  <select
                    className="w-full p-2 border rounded-md bg-white text-black dark:bg-gray-800 dark:text-white"
                    value={selectedEventId === '__CREATE_NEW__' ? '' : selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event: any) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({new Date(event.startTime).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: '60vh' }}>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {previewTemplate.proposedTasks?.length || 0} Tasks in this Script:
                </h3>
                {previewTemplate.proposedTasks?.map((task: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{task.priority || 'MEDIUM'}</Badge>
                        {task.durationMin && (
                          <span className="text-xs text-muted-foreground">
                            {task.durationMin} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              {previewTemplate.showApply && (
                <Button
                  onClick={async () => {
                    if (!selectedEventId) {
                      toast({
                        title: 'Select an Event',
                        description: 'Please choose which event to apply this script to or create a new one',
                        variant: 'destructive'
                      })
                      return
                    }
                    
                    try {
                      let targetEventId = selectedEventId
                      
                      // If creating new event, create it first
                      if (selectedEventId === '__CREATE_NEW__') {
                        if (!previewTemplate.newEventTitle || !previewTemplate.newEventStartTime) {
                          toast({
                            title: 'Missing Details',
                            description: 'Please enter event title and start time',
                            variant: 'destructive'
                          })
                          return
                        }
                        
                        // Create the event
                        const startTime = new Date(previewTemplate.newEventStartTime)
                        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // +2 hours default
                        
                        const eventResponse = await api.post('/calendar', {
                          title: previewTemplate.newEventTitle,
                          description: `Created from ${previewTemplate.title} script`,
                          startTime: startTime.toISOString(),
                          endTime: endTime.toISOString()
                        })
                        
                        targetEventId = eventResponse.data.data.id
                        
                        toast({
                          title: 'Event Created!',
                          description: 'Now applying script tasks...'
                        })
                      }
                      
                      // Apply the script
                      applyMutation.mutate({
                        versionId: previewTemplate.versionId,
                        eventId: targetEventId
                      })
                      
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.response?.data?.error || 'Failed to create event',
                        variant: 'destructive'
                      })
                    }
                  }}
                  disabled={!selectedEventId || (selectedEventId === '__CREATE_NEW__' && (!previewTemplate.newEventTitle || !previewTemplate.newEventStartTime))}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {selectedEventId === '__CREATE_NEW__' ? 'Create & Apply' : 'Apply to Event'}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
