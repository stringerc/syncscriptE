import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Users, UserPlus, Check, X, Ban, Trash2, Clock, Zap } from 'lucide-react'
import { useState } from 'react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { FriendsSettings } from '@/components/FriendsSettings'

export function FriendsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const friendsCoreEnabled = true // Always enabled for launch

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newFriendEmail, setNewFriendEmail] = useState('')
  const [friendRequestMessage, setFriendRequestMessage] = useState('')

  // Fetch friends
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await api.get('/friends')
      return response.data
    },
    enabled: friendsCoreEnabled
  })

  // Fetch pending requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const response = await api.get('/friends/requests')
      return response.data
    },
    enabled: friendsCoreEnabled
  })

  const friends = friendsData?.data?.friends || []
  const requests = requestsData?.data || { sent: [], received: [] }

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/friends/request', {
        email: newFriendEmail,
        message: friendRequestMessage || undefined
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast({
        title: 'Success!',
        description: data.message
      })
      setIsAddDialogOpen(false)
      setNewFriendEmail('')
      setFriendRequestMessage('')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send friend request',
        variant: 'destructive'
      })
    }
  })

  // Respond to request mutation
  const respondMutation = useMutation({
    mutationFn: async ({ friendshipId, action }: { friendshipId: string; action: string }) => {
      const response = await api.post('/friends/respond', { friendshipId, action })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast({
        title: 'Success!',
        description: 'Friend request updated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to respond to request',
        variant: 'destructive'
      })
    }
  })

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const response = await api.delete(`/friends/${friendshipId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast({
        title: 'Friend Removed',
        description: 'Friend has been removed from your list'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove friend',
        variant: 'destructive'
      })
    }
  })

  if (!friendsCoreEnabled) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Users className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Friends Feature Not Enabled</h2>
              <p className="text-muted-foreground">
                The friends feature is currently disabled. Contact your administrator to enable it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-10 h-10" />
            Friends
          </h1>
          <p className="text-white/90 text-lg">
            Manage your friends and privacy settings • {friends.length} friends • {(requests.sent?.length || 0) + (requests.received?.length || 0)} pending
          </p>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </Button>
        </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Friend Request</DialogTitle>
              <DialogDescription>
                Enter your friend's email address to send them a friend request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={friendRequestMessage}
                  onChange={(e) => setFriendRequestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => sendRequestMutation.mutate()}
                disabled={!newFriendEmail || sendRequestMutation.isPending}
                className="w-full"
              >
                {sendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({requests.received.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Friends List Tab */}
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends</CardTitle>
              <CardDescription>
                People you're connected with on SyncScript
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center p-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No friends yet. Add some to get started!</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {friends.map((friend: any) => (
                      <div
                        key={friend.friendshipId}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar} alt={friend.name} />
                          <AvatarFallback>
                            {friend.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{friend.name}</h4>
                            {friend.energyLevel && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {friend.energyLevel}/10
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{friend.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Friends since {new Date(friend.since).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFriendMutation.mutate(friend.friendshipId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Received Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Received Requests</CardTitle>
              <CardDescription>
                Friend requests waiting for your response
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : requests.received.length === 0 ? (
                <p className="text-center text-muted-foreground p-4">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {requests.received.map((request: any) => (
                    <div
                      key={request.friendshipId}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user.avatar} alt={request.user.name} />
                        <AvatarFallback>
                          {(request.user.name || request.user.email).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h4 className="font-medium">{request.user.name || request.user.email}</h4>
                        <p className="text-sm text-muted-foreground">{request.user.email}</p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            "{request.message}"
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            respondMutation.mutate({
                              friendshipId: request.friendshipId,
                              action: 'accept'
                            })
                          }
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            respondMutation.mutate({
                              friendshipId: request.friendshipId,
                              action: 'decline'
                            })
                          }
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            respondMutation.mutate({
                              friendshipId: request.friendshipId,
                              action: 'block'
                            })
                          }
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
              <CardDescription>
                Friend requests you've sent that are pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.sent.length === 0 ? (
                <p className="text-center text-muted-foreground p-4">No pending sent requests</p>
              ) : (
                <div className="space-y-2">
                  {requests.sent.map((request: any) => (
                    <div
                      key={request.friendshipId}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user.avatar} alt={request.user.name} />
                        <AvatarFallback>
                          {(request.user.name || request.user.email).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h4 className="font-medium">{request.user.name || request.user.email}</h4>
                        <p className="text-sm text-muted-foreground">{request.user.email}</p>
                      </div>

                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <FriendsSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
