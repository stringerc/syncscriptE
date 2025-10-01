import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import axios from 'axios';

const prisma = new PrismaClient();

export class OutlookCalendarService {
  private static instance: OutlookCalendarService;

  static getInstance(): OutlookCalendarService {
    if (!OutlookCalendarService.instance) {
      OutlookCalendarService.instance = new OutlookCalendarService();
    }
    return OutlookCalendarService.instance;
  }

  /**
   * Get authorization URL for Outlook Calendar
   */
  getAuthUrl(redirectUri: string): string {
    if (!process.env.MICROSOFT_CLIENT_ID) {
      throw new Error('Outlook Calendar not configured - set MICROSOFT_CLIENT_ID in .env');
    }

    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri || process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/outlook-callback',
      scope: 'Calendars.ReadWrite Calendars.ReadWrite.Shared User.Read offline_access',
      response_mode: 'query'
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string, redirectUri: string): Promise<any> {
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      throw new Error('Outlook Calendar not configured');
    }

    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri || process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/outlook-callback',
      grant_type: 'authorization_code'
    });

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

  /**
   * Save Outlook calendar connection
   */
  async saveConnection(userId: string, tokens: any, userInfo: any): Promise<any> {
    try {
      const account = await prisma.externalCalendarAccount.create({
        data: {
          userId,
          provider: 'outlook',
          accountId: userInfo.id || userInfo.sub,
          email: userInfo.email || userInfo.preferred_username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          tokenExpiry: tokens.expiresOn ? new Date(tokens.expiresOn) : null,
          scopes: JSON.stringify(tokens.scopes || []),
          status: 'CONNECTED'
        }
      });

      logger.info('Outlook calendar connected', { userId, email: account.email });
      return account;
    } catch (error: any) {
      logger.error('Failed to save Outlook connection', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Sync events from Outlook Calendar
   */
  async syncEvents(userId: string): Promise<any> {
    // TODO: Implement Microsoft Graph API calendar sync
    logger.info('Outlook calendar sync not yet implemented', { userId });
    return { synced: 0, message: 'Outlook sync coming soon' };
  }
}

export const outlookCalendarService = OutlookCalendarService.getInstance();
