import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import axios from 'axios';

const prisma = new PrismaClient();

export class AppleCalendarService {
  private static instance: AppleCalendarService;

  static getInstance(): AppleCalendarService {
    if (!AppleCalendarService.instance) {
      AppleCalendarService.instance = new AppleCalendarService();
    }
    return AppleCalendarService.instance;
  }

  /**
   * Get authorization URL for Apple Calendar (Sign in with Apple)
   */
  getAuthUrl(redirectUri: string): string {
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID) {
      throw new Error('Apple Calendar not configured');
    }

    const params = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID,
      redirect_uri: redirectUri || process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/apple-callback',
      response_type: 'code id_token',
      scope: 'name email',
      response_mode: 'form_post',
      state: Math.random().toString(36).substring(7)
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string, redirectUri: string): Promise<any> {
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_CLIENT_SECRET) {
      throw new Error('Apple Calendar not configured');
    }

    const tokenUrl = 'https://appleid.apple.com/auth/token';
    
    const params = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID,
      client_secret: process.env.APPLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri || process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/apple-callback'
    });

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

  /**
   * Save Apple calendar connection
   */
  async saveConnection(userId: string, tokens: any, userInfo: any): Promise<any> {
    try {
      const account = await prisma.externalCalendarAccount.create({
        data: {
          userId,
          provider: 'apple',
          accountId: userInfo.sub || userInfo.user,
          email: userInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          scopes: JSON.stringify(['calendar']),
          status: 'CONNECTED'
        }
      });

      logger.info('Apple calendar connected', { userId, email: account.email });
      return account;
    } catch (error: any) {
      logger.error('Failed to save Apple connection', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Sync events from Apple Calendar (iCloud)
   */
  async syncEvents(userId: string): Promise<any> {
    // TODO: Implement iCloud Calendar API sync (CalDAV)
    logger.info('Apple calendar sync not yet implemented', { userId });
    return { synced: 0, message: 'Apple Calendar sync coming soon' };
  }
}

export const appleCalendarService = AppleCalendarService.getInstance();

