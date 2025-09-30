import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Users } from 'lucide-react'
import { useState } from 'react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

interface Friend {
  friendshipId: string
  userId: string
  email: string
  name: string
  avatar?: string
  energyLevel?: number
  lastActive: string
  since: string
}

interface FriendsPickerProps {
  selectedFriendId?: string
  onSelectFriend: (friendId: string, friendName: string) => void
  showEnergy?: boolean
  showEmblems?: boolean
}

export function FriendsPicker({
  selectedFriendId,
  onSelectFriend,
  showEnergy = false,
  showEmblems = false
}: FriendsPickerProps) {
  const { isFlagEnabled } = useFeatureFlags()
  const friendsCoreEnabled = isFlagEnabled('friends_core')

  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await api.get('/friends')
      return response.data
    },
    enabled: friendsCoreEnabled
  })

  const { data: prefsData } = useQuery({
    queryKey: ['friend-prefs'],
    queryFn: async () => {
      const response = await api.get('/friends/prefs')
      return response.data
    },
    enabled: friendsCoreEnabled
  })

  const friends: Friend[] = friendsData?.data?.friends || []
  const prefs = prefsData?.data || {}

  // Respect user preferences
  const shouldShowEnergy = showEnergy && (prefs.showFriendEnergy !== false)
  const shouldShowEmblems = showEmblems && (prefs.showFriendEmblems !== false)

  if (!friendsCoreEnabled) {
    // Fallback stub selector
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/20">
        <div className="text-center space-y-2">
          <Users className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Friends feature not enabled
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/20">
        <div className="text-center space-y-2">
          <Users className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No friends yet. Add friends to send messages!
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-64 border rounded-lg">
      <div className="p-2 space-y-1">
        {friends.map((friend) => (
          <button
            key={friend.userId}
            onClick={() => onSelectFriend(friend.userId, friend.name)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg transition-colors
              hover:bg-accent
              ${selectedFriendId === friend.userId ? 'bg-accent ring-2 ring-primary' : ''}
            `}
          >
            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatar} alt={friend.name} />
              <AvatarFallback>
                {friend.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Friend Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{friend.name}</span>
                {shouldShowEmblems && (
                  <Badge variant="outline" className="text-xs">
                    ⚡
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{friend.email}</span>
                {shouldShowEnergy && friend.energyLevel !== null && friend.energyLevel !== undefined && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-primary">{friend.energyLevel}/10</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedFriendId === friend.userId && (
              <Check className="w-5 h-5 text-primary" />
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

/**
 * Simple friend selector for inline use
 */
export function FriendSelector({
  onSelect,
  placeholder = "Select a friend..."
}: {
  onSelect: (friendId: string, friendName: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null)

  const handleSelect = (friendId: string, friendName: string) => {
    setSelectedFriend({ id: friendId, name: friendName })
    onSelect(friendId, friendName)
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 border rounded-lg hover:bg-accent"
      >
        <span className={selectedFriend ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedFriend ? selectedFriend.name : placeholder}
        </span>
        <Users className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="border rounded-lg bg-background shadow-lg">
          <FriendsPicker
            selectedFriendId={selectedFriend?.id}
            onSelectFriend={handleSelect}
          />
        </div>
      )}
    </div>
  )
}