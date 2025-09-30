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

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [previewTemplate, setPreviewTemplate] = useState<any>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>('')

  // Fetch catalog
  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['template-catalog', searchQuery, selectedCategory, selectedTags],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      
      const response = await api.get(`/templates/catalog?${params}`)
      return response.data
    },
    enabled: true // Always enabled for launch
  })

  // Fetch user's events for apply
  const { data: eventsData } = useQuery({
    queryKey: ['user-events'],
    queryFn: async () => {
      const response = await api.get('/calendar')
      return response.data
    },
    enabled: true
  })

  const templates = catalogData?.data?.templates || []
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

  // Gallery is always enabled for launch
  // Feature flag check removed

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookTemplate className="w-8 h-8" />
          Script Gallery
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse curated scripts to plan faster
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{template.quality}</span>
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
                      if (events.length === 0) {
                        toast({
                          title: 'Create an Event First',
                          description: 'You need at least one event to apply this script. Create one from the Dashboard!',
                          duration: 5000
                        })
                        return
                      }
                      try {
                        const manifest = typeof template.manifest === 'string' 
                          ? JSON.parse(template.manifest)
                          : template.manifest
                        
                        setPreviewTemplate({
                          ...template,
                          proposedTasks: manifest.tasks || [],
                          showApply: true
                        })
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
            
            {previewTemplate.showApply && events.length > 0 && (
              <div className="px-6 pb-4">
                <label className="block text-sm font-medium mb-2">Select Event to Apply To:</label>
                <select
                  className="w-full p-2 border rounded-md bg-white text-black"
                  value={selectedEventId}
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
            )}

            <ScrollArea className="flex-1 px-6">
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
            </ScrollArea>
            
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              {previewTemplate.showApply && (
                <Button
                  onClick={() => {
                    if (!selectedEventId) {
                      toast({
                        title: 'Select an Event',
                        description: 'Please choose which event to apply this script to',
                        variant: 'destructive'
                      })
                      return
                    }
                    applyMutation.mutate({
                      versionId: previewTemplate.versionId,
                      eventId: selectedEventId
                    })
                  }}
                  disabled={!selectedEventId}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Apply to Event
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
