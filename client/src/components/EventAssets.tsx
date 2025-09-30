import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Link, 
  FileText, 
  Image, 
  ExternalLink,
  Pin,
  Calendar
} from 'lucide-react'
import { api } from '@/lib/api'

interface EventAssetsProps {
  eventId: string
}

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
}

interface AssetGroup {
  type: 'event' | 'task'
  taskId?: string
  taskTitle: string
  resources: Resource[]
}

export function EventAssets({ eventId }: EventAssetsProps) {
  const { data: assetsData, isLoading, error } = useQuery({
    queryKey: ['event-assets', eventId],
    queryFn: async () => {
      const response = await api.get(`/resources/events/${eventId}/assets`)
      return response.data
    },
    enabled: !!eventId
  })

  const assets: AssetGroup[] = assetsData?.data?.assets || []

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load assets</p>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Yet</h3>
        <p className="text-gray-500 mb-4">Add resources to your event tasks to see them here</p>
        <p className="text-sm text-gray-400">
          Go to your tasks and click the paperclip icon to add URLs, notes, or files
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Event Assets</h2>
          <p className="text-muted-foreground">
            All resources from tasks related to this event
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {assets.reduce((total, group) => total + group.resources.length, 0)} resources
        </Badge>
      </div>

      <div className="space-y-6">
        {assets.map((group, groupIndex) => (
          <Card key={`${group.type}-${group.taskId || 'event'}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {group.type === 'event' ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span>{group.taskTitle}</span>
                {group.type === 'task' && (
                  <Badge variant="secondary" className="text-xs">
                    Task
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {group.resources.length} resource{group.resources.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.resources.map((resource) => (
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
