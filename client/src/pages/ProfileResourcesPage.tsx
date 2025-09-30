import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { 
  Link, 
  FileText, 
  Image, 
  ExternalLink,
  Pin,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Calendar,
  Tag
} from 'lucide-react'
import { api } from '@/lib/api'

interface Resource {
  id: string
  kind: 'url' | 'image' | 'file' | 'note'
  urlOrKey?: string
  title: string
  previewImage?: string
  domain?: string
  merchant?: string
  priceCents?: number
  note?: string
  tags: string[]
  isSelected: boolean
  createdAt: string
  updatedAt: string
  taskTitle?: string
  eventTitle?: string
}

export function ProfileResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKind, setSelectedKind] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNote, setEditNote] = useState('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: resourcesData, isLoading, error } = useQuery({
    queryKey: ['profile-resources'],
    queryFn: async () => {
      const response = await api.get('/resources/me/resources')
      return response.data
    }
  })

  const resources: Resource[] = resourcesData?.data?.resources || []

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.delete(`/resources/resources/${resourceId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-resources'] })
      toast({
        title: "Resource Deleted",
        description: "Resource has been deleted successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete resource",
        variant: "destructive"
      })
    }
  })

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ resourceId, title, note }: { resourceId: string; title: string; note?: string }) => {
      const response = await api.patch(`/resources/resources/${resourceId}`, {
        title,
        note
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-resources'] })
      setEditingResource(null)
      setEditTitle('')
      setEditNote('')
      toast({
        title: "Resource Updated",
        description: "Resource has been updated successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update resource",
        variant: "destructive"
      })
    }
  })

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setEditTitle(resource.title || '')
    setEditNote(resource.note || '')
  }

  const handleSaveEdit = () => {
    if (!editingResource) return
    updateResourceMutation.mutate({
      resourceId: editingResource.id,
      title: editTitle,
      note: editNote
    })
  }

  const handleCancelEdit = () => {
    setEditingResource(null)
    setEditTitle('')
    setEditNote('')
  }

  const handleDeleteResource = (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteResourceMutation.mutate(resourceId)
    }
  }

  // Get unique tags and domains for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    resources.forEach(resource => {
      resource.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [resources])

  const allDomains = useMemo(() => {
    const domainSet = new Set<string>()
    resources.forEach(resource => {
      if (resource.domain) domainSet.add(resource.domain)
    })
    return Array.from(domainSet).sort()
  }, [resources])

  // Filter resources based on search and filters
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          resource.title.toLowerCase().includes(query) ||
          resource.note?.toLowerCase().includes(query) ||
          resource.domain?.toLowerCase().includes(query) ||
          resource.taskTitle?.toLowerCase().includes(query) ||
          resource.eventTitle?.toLowerCase().includes(query)
        
        if (!matchesSearch) return false
      }

      // Kind filter
      if (selectedKind !== 'all' && resource.kind !== selectedKind) {
        return false
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => resource.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // Selected only filter
      if (showSelectedOnly && !resource.isSelected) {
        return false
      }

      return true
    })
  }, [resources, searchQuery, selectedKind, selectedTags, showSelectedOnly])

  const getResourceIcon = (kind: string) => {
    switch (kind) {
      case 'url': return <Link className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      case 'file': return <FileText className="w-4 h-4" />
      case 'note': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatPrice = (priceCents?: number) => {
    if (!priceCents) return null
    return `$${(priceCents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading your resources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load resources</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Resources</h1>
          <p className="text-muted-foreground">
            All your resources across tasks and events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {filteredResources.length} of {resources.length}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search resources, notes, domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Kind Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Type:</span>
            <div className="flex space-x-2">
              {['all', 'url', 'image', 'file', 'note'].map((kind) => (
                <Button
                  key={kind}
                  variant={selectedKind === kind ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedKind(kind)}
                >
                  {kind === 'all' ? 'All' : kind.charAt(0).toUpperCase() + kind.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Only Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showSelectedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
            >
              <Pin className="w-4 h-4 mr-2" />
              Selected Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedKind !== 'all' || selectedTags.length > 0 || showSelectedOnly
              ? 'Try adjusting your filters to see more resources'
              : 'Add resources to your tasks to see them here'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className={`${resource.isSelected ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getResourceIcon(resource.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{resource.title}</h4>
                      {resource.isSelected && (
                        <Badge variant="default" className="text-xs">
                          <Pin className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    {resource.domain && (
                      <p className="text-xs text-gray-500 truncate">{resource.domain}</p>
                    )}
                    
                    {resource.priceCents && (
                      <p className="text-xs text-green-600 font-medium">{formatPrice(resource.priceCents)}</p>
                    )}

                    {resource.taskTitle && (
                      <p className="text-xs text-blue-600 truncate">
                        Task: {resource.taskTitle}
                      </p>
                    )}

                    {resource.eventTitle && (
                      <p className="text-xs text-purple-600 truncate">
                        Event: {resource.eventTitle}
                      </p>
                    )}
                    
                    {resource.note && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{resource.note}</p>
                    )}

                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resource.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Added {formatDate(resource.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  {resource.kind === 'url' && resource.urlOrKey && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.urlOrKey, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open
                    </Button>
                  )}
                  
                  {resource.kind === 'image' && resource.previewImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.previewImage, '_blank')}
                      className="flex-1"
                    >
                      <Image className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditResource(resource)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteResource(resource.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Resource</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Resource title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Note</label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Resource note"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-6">
                <Button 
                  onClick={handleSaveEdit}
                  disabled={updateResourceMutation.isPending}
                  className="flex-1"
                >
                  {updateResourceMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
