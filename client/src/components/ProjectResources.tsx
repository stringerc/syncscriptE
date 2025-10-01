import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, FolderPlus, FileText, Image, Link, Plus, Move, Trash2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProjectResourcesProps {
  projectId: string
}

interface ProjectResource {
  id: string
  title?: string
  kind: string
  urlOrKey?: string
  previewImage?: string
  domain?: string
  note?: string
  sourceTaskId?: string
  sourceEventId?: string
  createdAt: string
  folder?: {
    id: string
    name: string
  }
  addedByUser: {
    name?: string
    email: string
  }
}

interface ProjectFolder {
  id: string
  name: string
  description?: string
  order: number
}

export function ProjectResources({ projectId }: ProjectResourcesProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  // Fetch project folders
  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ['project-folders', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/resources/folders`)
      return response.data.data
    }
  })

  // Fetch project resources
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['project-resources', projectId, selectedFolderId],
    queryFn: async () => {
      const params = selectedFolderId ? { folderId: selectedFolderId } : {}
      const response = await api.get(`/projects/${projectId}/resources`, { params })
      return response.data.data
    }
  })

  // Fetch available resources to add
  const { data: availableResourcesData } = useQuery({
    queryKey: ['available-project-resources', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/resources/available`)
      return response.data.data
    }
  })

  const folders: ProjectFolder[] = foldersData?.folders || []
  const resources: ProjectResource[] = resourcesData?.resources || []
  const availableResources = availableResourcesData?.availableResources || []

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/projects/${projectId}/resources/folders`, {
        name: newFolderName,
        description: newFolderDescription
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-folders', projectId] })
      toast({
        title: 'Success!',
        description: 'Folder created successfully'
      })
      setIsCreateFolderOpen(false)
      setNewFolderName('')
      setNewFolderDescription('')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create folder',
        variant: 'destructive'
      })
    }
  })

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async ({ resourceId, sourceTaskId, sourceEventId }: any) => {
      const endpoint = sourceTaskId 
        ? `/projects/${projectId}/resources/add-from-task`
        : `/projects/${projectId}/resources/add-from-event`
      
      const payload = sourceTaskId 
        ? { taskId: sourceTaskId, resourceId, folderId: selectedFolderId }
        : { eventId: sourceEventId, resourceId, folderId: selectedFolderId }

      const response = await api.post(endpoint, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-resources', projectId] })
      queryClient.invalidateQueries({ queryKey: ['available-project-resources', projectId] })
      toast({
        title: 'Success!',
        description: 'Resource added to project'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add resource',
        variant: 'destructive'
      })
    }
  })

  const getResourceIcon = (kind: string) => {
    switch (kind) {
      case 'url': return <Link className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      case 'file': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (foldersLoading || resourcesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Resources</CardTitle>
          <CardDescription>Loading resources...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Folder Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Resource Folders
              </CardTitle>
              <CardDescription>Organize project resources</CardDescription>
            </div>
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Create a new folder to organize project resources
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Folder Name</label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Input
                      value={newFolderDescription}
                      onChange={(e) => setNewFolderDescription(e.target.value)}
                      placeholder="Enter folder description"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createFolderMutation.mutate()} 
                      disabled={!newFolderName || createFolderMutation.isPending}
                    >
                      Create Folder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFolderId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolderId(null)}
            >
              All Resources
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <Folder className="w-4 h-4 mr-2" />
                {folder.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Resources to Add */}
      {availableResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Resources to Add</CardTitle>
            <CardDescription>Resources from tasks and events that can be added to this project</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {availableResources.map((resource: any) => (
                  <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getResourceIcon(resource.kind)}
                      <div>
                        <p className="font-medium">{resource.title || 'Untitled Resource'}</p>
                        <p className="text-sm text-muted-foreground">
                          From: {resource.resourceSet?.task?.title || resource.resourceSet?.event?.title || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addResourceMutation.mutate({
                        resourceId: resource.id,
                        sourceTaskId: resource.resourceSet?.task?.id,
                        sourceEventId: resource.resourceSet?.event?.id
                      })}
                      disabled={addResourceMutation.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Project Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Project Resources</CardTitle>
          <CardDescription>
            {selectedFolderId 
              ? `Resources in ${folders.find(f => f.id === selectedFolderId)?.name || 'selected folder'}`
              : 'All project resources'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No resources found</p>
              <p className="text-sm text-muted-foreground">
                Add resources from tasks and events above
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getResourceIcon(resource.kind)}
                      <div className="flex-1">
                        <p className="font-medium">{resource.title || 'Untitled Resource'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Added by {resource.addedByUser.name || resource.addedByUser.email}</span>
                          <span>•</span>
                          <span>{formatDate(resource.createdAt)}</span>
                          {resource.domain && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary">{resource.domain}</Badge>
                            </>
                          )}
                        </div>
                        {resource.note && (
                          <p className="text-sm text-muted-foreground mt-1">{resource.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resource.urlOrKey && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={resource.urlOrKey} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Move className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
