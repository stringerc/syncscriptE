# Google Calendar API Setup Guide

This guide will help you set up Google Calendar API integration for SyncScript.

## Prerequisites

- Google account
- Google Cloud Console access
- SyncScript development environment running

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" or "New Project"
3. Click "New Project"
4. Enter project name: `SyncScript Calendar Integration`
5. Click "Create"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields:
     - App name: `SyncScript`
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Add test users (your email address)
4. Choose "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

Add the following to your `server/.env` file:

```env
# Google Calendar API
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

## Step 5: Test the Integration

1. Start your SyncScript server:
   ```bash
   cd server
   npm run dev
   ```

2. Start your SyncScript client:
   ```bash
   cd client
   npm run dev
   ```

3. Navigate to `http://localhost:3000/google-calendar`
4. Click "Connect Google Calendar"
5. Complete the OAuth flow
6. Test calendar sync functionality

## API Endpoints

Once configured, the following endpoints will be available:

### Authentication
- `GET /api/google-calendar/auth-url` - Get OAuth authorization URL
- `POST /api/google-calendar/auth/callback` - Handle OAuth callback
- `GET /api/google-calendar/status` - Check connection status
- `DELETE /api/google-calendar/disconnect` - Disconnect Google Calendar

### Calendar Management
- `GET /api/google-calendar/calendars` - List user's calendars
- `GET /api/google-calendar/events` - Get events from a calendar
- `POST /api/google-calendar/events` - Create event in Google Calendar

### Synchronization
- `POST /api/google-calendar/sync` - Sync events between Google Calendar and SyncScript
- `POST /api/google-calendar/refresh-tokens` - Refresh access tokens

## Sync Directions

The sync functionality supports three directions:

1. **From Google Calendar** (`from_google`): Import events from Google Calendar to SyncScript
2. **To Google Calendar** (`to_google`): Export SyncScript events to Google Calendar
3. **Bidirectional** (`bidirectional`): Sync in both directions

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in your OAuth client matches exactly
   - Check that `GOOGLE_REDIRECT_URI` in your `.env` matches

2. **"Access blocked" error**
   - Make sure your app is in testing mode and you've added yourself as a test user
   - Verify OAuth consent screen is properly configured

3. **"Insufficient permissions" error**
   - Ensure you've requested the correct scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`

4. **"Token expired" error**
   - The system will automatically refresh tokens
   - If issues persist, disconnect and reconnect Google Calendar

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs of API calls and responses.

## Production Deployment

For production deployment:

1. Update OAuth consent screen to "Production"
2. Add your production domain to authorized redirect URIs
3. Update `GOOGLE_REDIRECT_URI` in production environment
4. Consider implementing token refresh logic for long-running applications

## Security Considerations

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Implement proper token refresh mechanisms
- Consider rate limiting for API calls
- Monitor API usage in Google Cloud Console

## Rate Limits

Google Calendar API has the following limits:
- 1,000,000 queries per day
- 100 queries per 100 seconds per user

SyncScript implements automatic rate limiting and retry logic.

## Support

For issues with Google Calendar API:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

For SyncScript-specific issues:
- Check server logs for detailed error messages
- Verify environment variables are correctly set
- Ensure database schema is up to date
