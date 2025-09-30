import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export class FriendsService {
  private static instance: FriendsService

  static getInstance(): FriendsService {
    if (!FriendsService.instance) {
      FriendsService.instance = new FriendsService()
    }
    return FriendsService.instance
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(requesterId: string, addresseeEmail: string, message?: string): Promise<any> {
    try {
      // Find addressee by email
      const addressee = await prisma.user.findUnique({
        where: { email: addresseeEmail }
      })

      if (!addressee) {
        throw new Error('User not found')
      }

      if (requesterId === addressee.id) {
        throw new Error('Cannot send friend request to yourself')
      }

      // Check for existing friendship
      const existing = await prisma.friendship.findUnique({
        where: {
          requesterId_addresseeId: {
            requesterId,
            addresseeId: addressee.id
          }
        }
      })

      if (existing) {
        if (existing.status === 'blocked') {
          throw new Error('Cannot send friend request to blocked user')
        }
        if (existing.status === 'pending') {
          throw new Error('Friend request already sent')
        }
        if (existing.status === 'accepted') {
          throw new Error('Already friends')
        }
      }

      // Check reverse direction (addressee might have sent request)
      const reverse = await prisma.friendship.findUnique({
        where: {
          requesterId_addresseeId: {
            requesterId: addressee.id,
            addresseeId: requesterId
          }
        }
      })

      if (reverse) {
        if (reverse.status === 'blocked') {
          throw new Error('You have been blocked by this user')
        }
        if (reverse.status === 'pending') {
          // Auto-accept since both want to be friends
          await prisma.friendship.update({
            where: { id: reverse.id },
            data: { status: 'accepted' }
          })

          logger.info('Friend request auto-accepted (mutual request)', {
            requesterId,
            addresseeId: addressee.id
          })

          return { status: 'accepted', friendship: reverse }
        }
      }

      // Create new friendship request
      const friendship = await prisma.friendship.create({
        data: {
          requesterId,
          addresseeId: addressee.id,
          status: 'pending',
          message
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          },
          addressee: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      // Log to audit
      await prisma.auditLog.create({
        data: {
          userId: requesterId,
          action: 'FRIEND_REQUEST_SENT',
          resourceType: 'friendship',
          resourceId: friendship.id,
          details: JSON.stringify({ addresseeId: addressee.id, addresseeEmail })
        }
      })

      logger.info('Friend request sent', { requesterId, addresseeId: addressee.id })

      return friendship
    } catch (error: any) {
      logger.error('Failed to send friend request', { error: error.message })
      throw error
    }
  }

  /**
   * Respond to friend request (accept/decline/block)
   */
  async respondToFriendRequest(
    friendshipId: string,
    userId: string,
    action: 'accept' | 'decline' | 'block'
  ): Promise<any> {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId }
      })

      if (!friendship) {
        throw new Error('Friend request not found')
      }

      if (friendship.addresseeId !== userId) {
        throw new Error('Only the addressee can respond to this request')
      }

      if (friendship.status !== 'pending') {
        throw new Error('Friend request is not pending')
      }

      let updatedFriendship

      if (action === 'accept') {
        updatedFriendship = await prisma.friendship.update({
          where: { id: friendshipId },
          data: { status: 'accepted' },
          include: {
            requester: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true
              }
            },
            addressee: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true
              }
            }
          }
        })

        logger.info('Friend request accepted', { friendshipId, userId })
      } else if (action === 'decline') {
        // Delete the friendship
        await prisma.friendship.delete({
          where: { id: friendshipId }
        })

        logger.info('Friend request declined', { friendshipId, userId })
        
        return { status: 'declined' }
      } else if (action === 'block') {
        updatedFriendship = await prisma.friendship.update({
          where: { id: friendshipId },
          data: {
            status: 'blocked',
            blockedBy: 'addressee'
          }
        })

        logger.info('User blocked', { friendshipId, userId, blockedUserId: friendship.requesterId })
      }

      // Log to audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: `FRIEND_REQUEST_${action.toUpperCase()}`,
          resourceType: 'friendship',
          resourceId: friendshipId,
          details: JSON.stringify({ requesterId: friendship.requesterId, action })
        }
      })

      return updatedFriendship
    } catch (error: any) {
      logger.error('Failed to respond to friend request', { error: error.message })
      throw error
    }
  }

  /**
   * Get friends list
   */
  async getFriends(userId: string): Promise<any[]> {
    try {
      // Get all accepted friendships where user is either requester or addressee
      const sentFriendships = await prisma.friendship.findMany({
        where: {
          requesterId: userId,
          status: 'accepted'
        },
        include: {
          addressee: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              energyLevel: true,
              updatedAt: true
            }
          }
        }
      })

      const receivedFriendships = await prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: 'accepted'
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              energyLevel: true,
              updatedAt: true
            }
          }
        }
      })

      // Combine and format
      const friends = [
        ...sentFriendships.map(f => ({
          friendshipId: f.id,
          friend: f.addressee,
          since: f.createdAt
        })),
        ...receivedFriendships.map(f => ({
          friendshipId: f.id,
          friend: f.requester,
          since: f.createdAt
        }))
      ]

      // Get user's privacy settings
      const privacySettings = await prisma.privacySetting.findUnique({
        where: { userId },
        include: { energyHiddenFrom: true }
      })

      // Filter energy based on privacy settings
      const hiddenUserIds = privacySettings?.energyHiddenFrom.map(h => h.hiddenFromUserId) || []

      return friends.map(({ friendshipId, friend, since }) => ({
        friendshipId,
        userId: friend.id,
        email: friend.email,
        name: friend.name || friend.email.split('@')[0],
        avatar: friend.avatar,
        energyLevel: hiddenUserIds.includes(friend.id) ? null : friend.energyLevel,
        lastActive: friend.updatedAt,
        since
      }))
    } catch (error: any) {
      logger.error('Failed to get friends', { error: error.message })
      throw error
    }
  }

  /**
   * Get pending friend requests
   */
  async getPendingRequests(userId: string): Promise<any> {
    try {
      const sent = await prisma.friendship.findMany({
        where: {
          requesterId: userId,
          status: 'pending'
        },
        include: {
          addressee: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      const received = await prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: 'pending'
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      return {
        sent: sent.map(f => ({
          friendshipId: f.id,
          user: f.addressee,
          message: f.message,
          sentAt: f.createdAt
        })),
        received: received.map(f => ({
          friendshipId: f.id,
          user: f.requester,
          message: f.message,
          receivedAt: f.createdAt
        }))
      }
    } catch (error: any) {
      logger.error('Failed to get pending requests', { error: error.message })
      throw error
    }
  }

  /**
   * Remove friend
   */
  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId }
      })

      if (!friendship) {
        throw new Error('Friendship not found')
      }

      if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
        throw new Error('You are not part of this friendship')
      }

      await prisma.friendship.delete({
        where: { id: friendshipId }
      })

      // Log to audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'FRIEND_REMOVED',
          resourceType: 'friendship',
          resourceId: friendshipId,
          details: JSON.stringify({ friendshipId })
        }
      })

      logger.info('Friend removed', { userId, friendshipId })
    } catch (error: any) {
      logger.error('Failed to remove friend', { error: error.message })
      throw error
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string, userToBlockEmail: string): Promise<void> {
    try {
      const userToBlock = await prisma.user.findUnique({
        where: { email: userToBlockEmail }
      })

      if (!userToBlock) {
        throw new Error('User not found')
      }

      // Find existing friendship or create new one with blocked status
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: userId, addresseeId: userToBlock.id },
            { requesterId: userToBlock.id, addresseeId: userId }
          ]
        }
      })

      if (existing) {
        await prisma.friendship.update({
          where: { id: existing.id },
          data: {
            status: 'blocked',
            blockedBy: existing.requesterId === userId ? 'requester' : 'addressee'
          }
        })
      } else {
        await prisma.friendship.create({
          data: {
            requesterId: userId,
            addresseeId: userToBlock.id,
            status: 'blocked',
            blockedBy: 'requester'
          }
        })
      }

      // Log to audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_BLOCKED',
          resourceType: 'friendship',
          details: JSON.stringify({ blockedUserId: userToBlock.id })
        }
      })

      logger.info('User blocked', { userId, blockedUserId: userToBlock.id })
    } catch (error: any) {
      logger.error('Failed to block user', { error: error.message })
      throw error
    }
  }

  /**
   * Get/Update friend preferences
   */
  async getFriendPrefs(userId: string): Promise<any> {
    try {
      let prefs = await prisma.friendPrefs.findUnique({
        where: { userId }
      })

      if (!prefs) {
        prefs = await prisma.friendPrefs.create({
          data: { userId }
        })
      }

      return prefs
    } catch (error: any) {
      logger.error('Failed to get friend prefs', { error: error.message })
      throw error
    }
  }

  async updateFriendPrefs(userId: string, updates: any): Promise<any> {
    try {
      const prefs = await prisma.friendPrefs.upsert({
        where: { userId },
        update: updates,
        create: {
          userId,
          ...updates
        }
      })

      logger.info('Friend prefs updated', { userId, updates })

      return prefs
    } catch (error: any) {
      logger.error('Failed to update friend prefs', { error: error.message })
      throw error
    }
  }

  /**
   * Get/Update privacy settings
   */
  async getPrivacySettings(userId: string): Promise<any> {
    try {
      let settings = await prisma.privacySetting.findUnique({
        where: { userId },
        include: { energyHiddenFrom: true }
      })

      if (!settings) {
        settings = await prisma.privacySetting.create({
          data: { userId },
          include: { energyHiddenFrom: true }
        })
      }

      return {
        hideMyEmblems: settings.hideMyEmblems,
        hideLastActive: settings.hideLastActive,
        hideMyEnergyFrom: settings.energyHiddenFrom.map(h => h.hiddenFromUserId)
      }
    } catch (error: any) {
      logger.error('Failed to get privacy settings', { error: error.message })
      throw error
    }
  }

  async updatePrivacySettings(userId: string, updates: any): Promise<any> {
    try {
      // Upsert privacy setting
      await prisma.privacySetting.upsert({
        where: { userId },
        update: {
          hideMyEmblems: updates.hideMyEmblems,
          hideLastActive: updates.hideLastActive
        },
        create: {
          userId,
          hideMyEmblems: updates.hideMyEmblems || false,
          hideLastActive: updates.hideLastActive || false
        }
      })

      // Handle hideMyEnergyFrom
      if (updates.hideMyEnergyFrom !== undefined) {
        // Delete existing
        await prisma.energyHiddenFrom.deleteMany({
          where: { privacySettingId: userId }
        })

        // Create new
        if (updates.hideMyEnergyFrom.length > 0) {
          await prisma.energyHiddenFrom.createMany({
            data: updates.hideMyEnergyFrom.map((hiddenUserId: string) => ({
              privacySettingId: userId,
              hiddenFromUserId: hiddenUserId
            }))
          })
        }
      }

      logger.info('Privacy settings updated', { userId })

      return await this.getPrivacySettings(userId)
    } catch (error: any) {
      logger.error('Failed to update privacy settings', { error: error.message })
      throw error
    }
  }
}

export const friendsService = FriendsService.getInstance()
