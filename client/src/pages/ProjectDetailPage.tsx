import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, UserPlus, Settings, Archive, Calendar, CheckSquare, Activity, Trash2, Folder } from 'lucide-react'
import { useState } from 'react'
import { ProjectResources } from '@/components/ProjectResources'

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('contributor')
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  // Fetch project details
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`)
      return response.data
    },
    enabled: !!projectId
  })

  // Fetch audit trail
  const { data: auditData } = useQuery({
    queryKey: ['project-audit', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/audit`)
      return response.data
    },
    enabled: !!projectId
  })

  const project = projectData?.data?.project
  const auditTrail = auditData?.data?.trail || []

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/projects/${projectId}/invite`, {
        email: inviteEmail,
        role: inviteRole
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast({
        title: 'Invite Sent!',
        description: `Invitation sent to ${inviteEmail}`
      })
      setIsInviteDialogOpen(false)
      setInviteEmail('')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send invite',
        variant: 'destructive'
      })
    }
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/projects/${projectId}/members/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast({
        title: 'Member Removed',
        description: 'User has been removed from the project'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove member',
        variant: 'destructive'
      })
    }
  })

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/projects/${projectId}/archive`)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Project Archived',
        description: 'This project has been archived'
      })
      navigate('/projects')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to archive project',
        variant: 'destructive'
      })
    }
  })

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Project Not Found</h2>
              <Button className="mt-4" onClick={() => navigate('/projects')}>
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const myRole = project.members?.find((m: any) => m.userId === project.owner.id)?.role || 'viewer'
  const canInvite = ['owner', 'admin'].includes(myRole)
  const canArchive = myRole === 'owner'

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {project.description || 'Collaborative workspace'}
          </p>
        </div>
        <div className="flex gap-2">
          {canInvite && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite to Project</DialogTitle>
                  <DialogDescription>
                    Send an invitation to collaborate on this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background text-black"
                    >
                      <option value="viewer">Viewer (Read-only)</option>
                      <option value="contributor">Contributor (Complete tasks, comment)</option>
                      <option value="editor">Editor (Create/edit items)</option>
                      <option value="admin">Admin (Full access except delete)</option>
                    </select>
                  </div>
                  <Button
                    onClick={() => inviteMutation.mutate()}
                    disabled={!inviteEmail || inviteMutation.isPending}
                    className="w-full"
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            Members ({project.members?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="items">
            Items ({project.items?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Folder className="w-4 h-4 mr-1" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{project.members?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Team collaborators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {project.items?.filter((i: any) => i.itemType === 'event').length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Shared events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {project.items?.filter((i: any) => i.itemType === 'task').length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Shared tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Add Event to Project
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckSquare className="w-4 h-4 mr-2" />
                Add Task to Project
              </Button>
              {canArchive && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => archiveMutation.mutate()}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Project
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People with access to this project</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {project.members?.map((member: any) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>
                            {(member.user.name || member.user.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{member.user.name || member.user.email}</h4>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.role !== 'owner' && canInvite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMemberMutation.mutate(member.userId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Project Items</CardTitle>
              <CardDescription>Events and tasks in this project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.items?.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No items yet. Add events or tasks to get started.
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {project.items?.map((item: any) => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {item.itemType === 'event' ? (
                            <Calendar className="w-4 h-4" />
                          ) : (
                            <CheckSquare className="w-4 h-4" />
                          )}
                          <span className="font-medium">{item.itemType}</span>
                        </div>
                        <Badge variant={item.privacy === 'restricted' ? 'destructive' : 'outline'}>
                          {item.privacy}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <ProjectResources projectId={projectId!} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Feed
              </CardTitle>
              <CardDescription>Recent changes and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {auditTrail.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No activity yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditTrail.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 border-l-2 border-primary/50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.actor?.avatar} />
                          <AvatarFallback>
                            {(log.actor?.name || log.actor?.email || '?').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{log.actor?.name || log.actor?.email}</span>
                            {' '}
                            <span className="text-muted-foreground">{log.action.toLowerCase().replace(/_/g, ' ')}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                          {log.before && log.after && (
                            <div className="text-xs mt-1">
                              <span className="text-red-600">-{JSON.stringify(log.before)}</span>
                              {' → '}
                              <span className="text-green-600">+{JSON.stringify(log.after)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
