import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Folder, Plus, Users, Settings, Archive, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

export function ProjectsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isFlagEnabled } = useFeatureFlags()
  const shareScriptEnabled = isFlagEnabled('shareScript')

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  // Fetch projects
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      return response.data
    },
    enabled: shareScriptEnabled
  })

  const projects = projectsData?.data?.projects || []

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/projects', {
        name: newProjectName,
        description: newProjectDescription
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-projects'] })
      toast({
        title: 'Project Created!',
        description: `${data.data.project.name} is ready for collaboration`
      })
      setIsCreateDialogOpen(false)
      setNewProjectName('')
      setNewProjectDescription('')
      navigate(`/projects/${data.data.project.id}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create project',
        variant: 'destructive'
      })
    }
  })

  if (!shareScriptEnabled) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Folder className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">ShareScript Not Enabled</h2>
              <p className="text-muted-foreground">
                Collaboration features are currently disabled
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Folder className="w-8 h-8" />
            ShareSync
          </h1>
          <p className="text-muted-foreground mt-1">
            Collaborate with your team on shared events and tasks
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a collaborative workspace for your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Team Offsite 2025"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (Optional)</Label>
                <Textarea
                  id="project-description"
                  placeholder="Planning for our annual team offsite..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => createProjectMutation.mutate()}
                disabled={!newProjectName || createProjectMutation.isPending}
                className="w-full"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Folder className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold">No Projects Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first project to start collaborating with your team
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="w-5 h-5" />
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="mt-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary">{project.myRole}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.owner.avatar} />
                    <AvatarFallback>
                      {(project.owner.name || project.owner.email).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {project.owner.name || project.owner.email}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/projects/${project.id}/settings`)
                    }}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                  {project.myRole === 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Archive functionality
                      }}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
