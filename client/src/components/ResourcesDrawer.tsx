import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Paperclip, 
  Plus, 
  Pin, 
  Edit, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Image, 
  Link,
  X,
  Check,
  Upload,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

interface Resource {
  id: string
  kind: string
  urlOrKey?: string
  title?: string
  previewImage?: string
  domain?: string
  merchant?: string
  priceCents?: number
  note?: string
  tags: string
  createdAt: string
  isSelected: boolean
}

interface ResourcesDrawerProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
}

export function ResourcesDrawer({ taskId, isOpen, onClose }: ResourcesDrawerProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'note' | 'file'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [urlTitleInput, setUrlTitleInput] = useState('')
  const [noteTitleInput, setNoteTitleInput] = useState('')
  const [fileTitleInput, setFileTitleInput] = useState('')
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNote, setEditNote] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Fetch resources for this task (use separate query key to avoid cache conflicts with badge)
  const { data: resourcesData, isLoading, error: queryError, isFetching, refetch } = useQuery({
    queryKey: ['task-resources-drawer', taskId],
    queryFn: async () => {
      const response = await api.get(`/resources/tasks/${taskId}/resources`)
      return response.data
    },
    enabled: !!taskId && isOpen,
    staleTime: 0, // Always treat as stale when drawer opens
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always', // ALWAYS refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on focus to prevent flickering
  })

  // Force refetch when drawer opens AND invalidate the badge cache
  React.useEffect(() => {
    if (isOpen && taskId) {
      refetch()
      // Also invalidate the badge query to update counts
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
    }
  }, [isOpen, taskId, refetch, queryClient])

  const resources = resourcesData?.data?.resources || []
  const selectedResource = resources.find((r: Resource) => r.isSelected)

  // Add URL resource mutation
  const addUrlMutation = useMutation({
    mutationFn: async (data: { url: string; title?: string; note?: string; tags?: string[] }) => {
      const response = await api.post(`/resources/tasks/${taskId}/resources/url`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.invalidateQueries({ queryKey: ['profile-resources'] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
      setUrlInput('')
      setUrlTitleInput('')
      setHasUnsavedChanges(false)
      toast({
        title: "Resource Added",
        description: "URL resource has been added successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add resource",
        variant: "destructive"
      })
    }
  })

  // Add Note resource mutation
  const addNoteMutation = useMutation({
    mutationFn: async (data: { note: string; title?: string; tags?: string[] }) => {
      const response = await api.post(`/resources/tasks/${taskId}/resources/note`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.invalidateQueries({ queryKey: ['profile-resources'] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
      setNoteInput('')
      setNoteTitleInput('')
      setHasUnsavedChanges(false)
      toast({
        title: "Note Added",
        description: "Note has been added successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add note",
        variant: "destructive"
      })
    }
  })

  // Add file resource mutation
  const addFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(`/resources/tasks/${taskId}/resources/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.invalidateQueries({ queryKey: ['profile-resources'] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
      setUploadingFile(false)
      setFileTitleInput('')
      setHasUnsavedChanges(false)
      toast({
        title: "File Uploaded",
        description: "File has been uploaded successfully"
      })
    },
    onError: (error: any) => {
      setUploadingFile(false)
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload file",
        variant: "destructive"
      })
    }
  })

  // Select resource mutation
  const selectResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.post(`/resources/resourceSets/${resourcesData?.data?.resourceSetId}/select`, {
        resourceId
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
      toast({
        title: "Resource Selected",
        description: "Resource has been pinned as selected"
      })
    }
  })

  // Unselect resource mutation
  const unselectResourceMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/resources/resourceSets/${resourcesData?.data?.resourceSetId}/unselect`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
      toast({
        title: "Resource Unselected",
        description: "Resource has been unpinned"
      })
    }
  })

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.delete(`/resources/resources/${resourceId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
      toast({
        title: "Resource Deleted",
        description: "Resource has been deleted successfully"
      })
    }
  })

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ resourceId, title, note }: { resourceId: string; title: string; note?: string }) => {
      const response = await api.patch(`/resources/resources/${resourceId}`, { title, note })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-resources', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-resources-drawer', taskId] })
      queryClient.invalidateQueries({ queryKey: ['profile-resources'] })
      queryClient.refetchQueries({ queryKey: ['task-resources', taskId] })
      refetch() // Refetch drawer data
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

  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    
    addUrlMutation.mutate({
      url: urlInput.trim(),
      title: urlTitleInput.trim() || undefined
    })
  }

  const handleAddNote = () => {
    if (!noteInput.trim()) return
    
    addNoteMutation.mutate({
      note: noteInput.trim(),
      title: noteTitleInput.trim() || 'Note'
    })
  }

  // Track input changes to show unsaved state
  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleUrlTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlTitleInput(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleNoteInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteInput(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleNoteTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitleInput(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleFileTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileTitleInput(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select a file smaller than 10MB", variant: "destructive" }); return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please select an image, PDF, or document file", variant: "destructive" }); return;
    }

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', fileTitleInput.trim() || file.name)
    
    addFileMutation.mutate(formData)
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleSelectResource = (resourceId: string) => {
    selectResourceMutation.mutate(resourceId)
  }

  const handleDeleteResource = (resourceId: string) => {
    deleteResourceMutation.mutate(resourceId)
  }

  const handleSaveEdit = () => {
    if (!editingResource) return
    if (!editTitle.trim()) {
      toast({ title: "Title Required", description: "Please enter a title", variant: "destructive" })
      return
    }
    updateResourceMutation.mutate({ 
      resourceId: editingResource.id, 
      title: editTitle.trim(), 
      note: editNote.trim() || undefined 
    })
  }

  const handleCancelEdit = () => {
    setEditingResource(null)
    setEditTitle('')
    setEditNote('')
  }

  // When editingResource changes, populate the edit form
  React.useEffect(() => {
    if (editingResource) {
      setEditTitle(editingResource.title || '')
      setEditNote(editingResource.note || '')
    }
  }, [editingResource])

  // Helper to ensure URL has protocol
  const ensureUrlProtocol = (url: string): string => {
    if (!url) return url
    // If URL doesn't start with http:// or https://, add https://
    if (!url.match(/^https?:\/\//i)) {
      return `https://${url}`
    }
    return url
  }

  const handleResourceClick = (resource: Resource) => {
    if (resource.kind === 'url' && resource.urlOrKey) {
      window.open(resource.urlOrKey, '_blank', 'noopener,noreferrer')
    } else if (resource.kind === 'note') {
      // For notes, we could show a preview modal or just select them
      handleSelectResource(resource.id)
    } else if (resource.kind === 'file' || resource.kind === 'image') {
      // For files, we could show a preview or download them
      if (resource.urlOrKey) {
        // If it's base64, we could create a blob URL
        const blob = new Blob([resource.urlOrKey], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const getResourceIcon = (kind: string) => {
    switch (kind) {
      case 'url':
        return <Link className="w-4 h-4 text-blue-500" />
      case 'note':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'image':
        return <Image className="w-4 h-4 text-purple-500" />
      case 'file':
        return <Paperclip className="w-4 h-4 text-gray-500" />
      default:
        return <Paperclip className="w-4 h-4 text-gray-500" />
    }
  }

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-background h-full w-96 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Resources</h2>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Unsaved
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Selected Resource */}
        {selectedResource && (
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center space-x-2 mb-2">
              <Pin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Selected</span>
            </div>
            <Card className="bg-card">
              <CardContent className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getResourceIcon(selectedResource.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{selectedResource.title}</h4>
                    {selectedResource.domain && (
                      <p className="text-xs text-muted-foreground truncate">{selectedResource.domain}</p>
                    )}
                    {selectedResource.priceCents && (
                      <p className="text-xs text-green-600 font-medium">{formatPrice(selectedResource.priceCents)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for adding resources */}
        <div className="p-4 border-b">
          <div className="flex space-x-2 mb-4">
            <Button variant={activeTab === 'url' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('url')}>
              <Link className="w-4 h-4 mr-1" /> URL
            </Button>
            <Button variant={activeTab === 'note' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('note')}>
              <FileText className="w-4 h-4 mr-1" /> Note
            </Button>
            <Button variant={activeTab === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('file')}>
              <Upload className="w-4 h-4 mr-1" /> File
            </Button>
          </div>

          <div className="space-y-3">
            {activeTab === 'url' ? (
              <>
                <Input
                  placeholder="Enter URL..."
                  value={urlInput}
                  onChange={handleUrlInputChange}
                />
                <Input
                  placeholder="Enter title (optional)..."
                  value={urlTitleInput}
                  onChange={handleUrlTitleChange}
                />
                <Button 
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim() || addUrlMutation.isPending}
                  className="w-full"
                >
                  {addUrlMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save URL
                    </>
                  )}
                </Button>
              </>
            ) : activeTab === 'note' ? (
              <>
                <Input
                  placeholder="Enter title..."
                  value={noteTitleInput}
                  onChange={handleNoteTitleChange}
                />
                <Textarea
                  placeholder="Enter your note..."
                  value={noteInput}
                  onChange={handleNoteInputChange}
                  rows={3}
                />
                <Button 
                  onClick={handleAddNote}
                  disabled={!noteInput.trim() || addNoteMutation.isPending}
                  className="w-full"
                >
                  {addNoteMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save Note
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Input
                  placeholder="Enter file title (optional)..."
                  value={fileTitleInput}
                  onChange={handleFileTitleChange}
                />
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">Images, PDFs, documents up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.txt,.doc,.docx"
                  />
                </div>
                <Button 
                  onClick={handleFileClick}
                  disabled={uploadingFile}
                  className="w-full"
                >
                  {uploadingFile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select & Save File
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Resources List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No resources yet</p>
              <p className="text-sm">Add URLs or notes to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource: Resource) => (
                <Card 
                  key={resource.id} 
                  className={`${resource.isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <CardContent className="p-3">
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
                        
                        {resource.kind === 'url' && resource.urlOrKey && (
                          <div className="mt-2">
                            <a 
                              href={ensureUrlProtocol(resource.urlOrKey)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate block"
                            >
                              {resource.urlOrKey.length > 50 
                                ? resource.urlOrKey.substring(0, 50) + '...' 
                                : resource.urlOrKey}
                            </a>
                            {resource.previewImage && (
                              <img 
                                src={resource.previewImage} 
                                alt={resource.title || 'Preview'} 
                                className="w-full h-24 object-cover rounded mt-2"
                              />
                            )}
                          </div>
                        )}
                        
                        {resource.domain && (
                          <p className="text-xs text-muted-foreground truncate">{resource.domain}</p>
                        )}
                        
                        {resource.priceCents && (
                          <p className="text-xs text-green-600 font-medium">{formatPrice(resource.priceCents)}</p>
                        )}
                        
                        {resource.note && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.note}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      {/* Pin/Unpin Row */}
                      <div className="flex gap-2">
                        {!resource.isSelected ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSelectResource(resource.id)}
                            className="flex-1"
                          >
                            <Pin className="w-3 h-3 mr-1" /> 
                            Pin as Selected
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => unselectResourceMutation.mutate()}
                            className="flex-1"
                          >
                            <Pin className="w-3 h-3 mr-1" /> 
                            Unpin
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingResource(resource)}
                          title="Edit resource"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteResource(resource.id)}
                          title="Delete resource"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* Action Button Row */}
                      {resource.kind === 'url' && resource.urlOrKey && (
                        <div className="relative group">
                          <a 
                            href={ensureUrlProtocol(resource.urlOrKey)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button 
                              variant="default" 
                              size="sm"
                              className="w-full"
                              title={`Open: ${resource.urlOrKey}`}
                              type="button"
                            >
                              <ExternalLink className="w-3 h-3 mr-2" /> Open Link
                            </Button>
                          </a>
                          
                          {/* Hover Preview Tooltip */}
                          {resource.previewImage && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-64 bg-background border border-border rounded-lg shadow-xl p-2 pointer-events-none">
                              <img 
                                src={resource.previewImage} 
                                alt={`Preview of ${resource.title}`}
                                className="w-full h-40 object-cover rounded"
                              />
                              <p className="text-xs text-muted-foreground mt-2 truncate">{resource.urlOrKey}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {(resource.kind === 'file' || resource.kind === 'image') && resource.urlOrKey && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => {
                            // Create a download link for base64 data
                            const link = document.createElement('a')
                            link.href = `data:application/octet-stream;base64,${resource.urlOrKey}`
                            link.download = resource.title || 'download'
                            link.click()
                          }}
                          className="w-full"
                          title="Download file"
                        >
                          <Download className="w-3 h-3 mr-2" /> Download File
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Resource</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Title</label>
                  <Input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    placeholder="Resource title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Note</label>
                  <Textarea 
                    value={editNote} 
                    onChange={(e) => setEditNote(e.target.value)} 
                    placeholder="Add a note (optional)"
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
                  {updateResourceMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={updateResourceMutation.isPending}
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