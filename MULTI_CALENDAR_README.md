# 📅 SyncScript Multi-Calendar Integration

SyncScript now supports multiple calendar providers, allowing users to connect and sync events from Google Calendar, Microsoft Outlook, Exchange/Office 365, and iCloud Calendar in one unified interface.

## 🎯 Features

- **Multi-Provider Support**: Google Calendar, Outlook Calendar, Exchange/Office 365, iCloud Calendar
- **Unified Event View**: See events from all connected calendars in one place
- **Real-time Sync**: Automatic synchronization of events across providers
- **Token Management**: Automatic token refresh and expiration handling
- **Provider Management**: Easy connect/disconnect for each calendar provider
- **Error Resilience**: If one provider fails, others continue working

## 🚀 Quick Start

### 1. Prerequisites
- SyncScript application running
- Microsoft Azure account (for Outlook integration)
- Google Cloud Console project (for Google Calendar integration)

### 2. Access Multi-Calendar Interface
Navigate to `http://localhost:3000/multi-calendar` in your SyncScript application.

### 3. Connect Calendar Providers
- **Google Calendar**: Click "Connect Google Calendar" (uses existing integration)
- **Outlook Calendar**: Follow the [Outlook Setup Guide](./OUTLOOK_CALENDAR_SETUP.md)
- **Exchange/Office 365**: Follow the [Exchange Setup Guide](./EXCHANGE_CALENDAR_SETUP.md)
- **iCloud Calendar**: Follow the [iCloud Setup Guide](./ICLOUD_CALENDAR_SETUP.md)

## 📚 Setup Guides

### Microsoft Exchange/Office 365 Calendar Integration
- **[Complete Setup Guide](./EXCHANGE_CALENDAR_SETUP.md)** - Detailed step-by-step instructions
- **[Quick Reference](./EXCHANGE_SETUP_QUICK.md)** - 15-minute setup checklist
- **[Troubleshooting Guide](./EXCHANGE_TROUBLESHOOTING.md)** - Common issues and solutions
- **[Production Deployment](./EXCHANGE_PRODUCTION_DEPLOYMENT.md)** - Production setup and security

### Microsoft Outlook Calendar Integration
- **[Complete Setup Guide](./OUTLOOK_CALENDAR_SETUP.md)** - Detailed step-by-step instructions
- **[Quick Reference](./OUTLOOK_SETUP_QUICK.md)** - 12-minute setup checklist
- **[Troubleshooting Guide](./OUTLOOK_TROUBLESHOOTING.md)** - Common issues and solutions
- **[Production Deployment](./OUTLOOK_PRODUCTION_DEPLOYMENT.md)** - Production setup and security

### Google Calendar Integration
- Uses existing Google Calendar integration
- No additional setup required
- Already configured and working

### iCloud Calendar Integration
- **[Complete Setup Guide](./ICLOUD_CALENDAR_SETUP.md)** - Detailed step-by-step instructions
- **Method**: CalDAV protocol with app-specific passwords
- **Status**: Fully functional

## 🏗️ Architecture

### Backend Services
```
MultiCalendarService
├── GoogleCalendarService (existing)
├── OutlookCalendarService (new)
├── ExchangeCalendarService (new)
└── ICloudCalendarService (new)
```

### API Endpoints
```
/api/multi-calendar/
├── GET /providers - List connected providers
├── GET /events - Get events from all providers
├── GET /events/:provider - Get events from specific provider
├── POST /events/:provider - Create event in provider
├── PUT /events/:provider/:eventId - Update event
├── DELETE /events/:provider/:eventId - Delete event
├── DELETE /providers/:provider - Disconnect provider
└── POST /refresh-tokens - Refresh all tokens
```

### Database Schema
```sql
CalendarIntegration {
  id: String (Primary Key)
  userId: String (Foreign Key)
  provider: String (google|outlook|exchange|icloud)
  accessToken: String (encrypted)
  refreshToken: String (encrypted, optional)
  expiresAt: DateTime (optional)
  isActive: Boolean
  createdAt: DateTime
}
```

## 🔧 Development

### Environment Variables
```env
# Google Calendar (existing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/callback"

# Microsoft Outlook Calendar (new)
OUTLOOK_CLIENT_ID="your-outlook-client-id"
OUTLOOK_CLIENT_SECRET="your-outlook-client-secret"
OUTLOOK_REDIRECT_URI="http://localhost:3000/auth/outlook/callback"

# Microsoft Exchange/Office 365 Calendar (new)
EXCHANGE_CLIENT_ID="your-exchange-client-id"
EXCHANGE_CLIENT_SECRET="your-exchange-client-secret"
EXCHANGE_REDIRECT_URI="http://localhost:3000/auth/exchange/callback"

# iCloud Calendar (new)
ICLOUD_REDIRECT_URI="http://localhost:3000/auth/icloud/callback"
```

### Running Locally
```bash
# Start server
cd server
npm run dev

# Start client
cd client
npm run dev

# Access multi-calendar interface
open http://localhost:3000/multi-calendar
```

### Testing Integration
```bash
# Test Outlook auth URL
curl -X GET "http://localhost:3001/api/outlook-calendar/auth-url" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test Exchange auth URL
curl -X GET "http://localhost:3001/api/exchange-calendar/auth-url" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test iCloud connection
curl -X POST "http://localhost:3001/api/icloud-calendar/connect" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"username":"user@icloud.com","appPassword":"your-app-password"}'

# Test multi-calendar providers
curl -X GET "http://localhost:3001/api/multi-calendar/providers" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test events from all providers
curl -X GET "http://localhost:3001/api/multi-calendar/events" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security

### Authentication Flow
1. **OAuth 2.0 Authorization Code Flow** for Google, Outlook, and Exchange
2. **App-specific passwords** for iCloud
3. **Automatic token refresh** with secure storage
4. **Encrypted token storage** in database

### Security Features
- Environment variable protection
- HTTPS enforcement in production
- CORS configuration
- Rate limiting
- Token expiration handling
- Secure error handling

## 📊 Monitoring

### Key Metrics
- Authentication success rates
- Token refresh success rates
- API response times
- Error rates by provider
- User engagement metrics

### Logging
```typescript
// Example logging
logger.info('Outlook OAuth success', {
  userId: 'user123',
  provider: 'outlook',
  duration: 1500,
  timestamp: new Date().toISOString()
});
```

## 🚨 Troubleshooting

### Common Issues
1. **Redirect URI Mismatch**: Check Azure Portal configuration
2. **Token Expiration**: Verify automatic refresh is working
3. **Permission Errors**: Ensure API permissions are granted
4. **Network Issues**: Check Microsoft Graph API status

### Debug Commands
```bash
# Check environment variables
echo $OUTLOOK_CLIENT_ID
echo $OUTLOOK_CLIENT_SECRET

# Test server connectivity
curl -X GET "http://localhost:3001/health"

# Check server logs
cd server && npm run dev
```

## 🔄 Roadmap

### Phase 1: Core Integration ✅
- [x] Multi-provider architecture
- [x] Google Calendar integration
- [x] Outlook Calendar integration
- [x] Exchange/Office 365 Calendar integration
- [x] iCloud Calendar integration
- [x] Unified event API
- [x] Provider management UI

### Phase 2: Enhanced Features 🚧
- [ ] Event conflict resolution
- [ ] Calendar sharing
- [ ] Advanced filtering
- [ ] Bulk operations
- [ ] Calendar analytics

### Phase 3: Advanced Features 📋
- [ ] Smart scheduling suggestions
- [ ] Meeting optimization
- [ ] Time zone handling
- [ ] Recurring event management
- [ ] AI-powered calendar insights

## 🤝 Contributing

### Adding New Calendar Providers
1. Create new service class implementing `CalendarProviderService`
2. Add OAuth routes for authentication
3. Update `MultiCalendarService` to include new provider
4. Add UI components for provider management
5. Update database schema if needed

### Example: Adding Yahoo Calendar
```typescript
export class YahooCalendarService implements CalendarProviderService {
  async getEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    // Implementation
  }
  
  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    // Implementation
  }
  
  // ... other methods
}
```

## 📞 Support

### Documentation
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [Google Calendar API](https://developers.google.com/calendar)
- [CalDAV Protocol](https://tools.ietf.org/html/rfc4791)

### Community
- [SyncScript GitHub Issues](https://github.com/your-repo/syncscript/issues)
- [Microsoft Graph Community](https://techcommunity.microsoft.com/t5/microsoft-365-developer/ct-p/Microsoft365Developer)

### Professional Support
- Email: support@syncscript.com
- Documentation: [docs.syncscript.com](https://docs.syncscript.com)

---

**Built with ❤️ by the SyncScript Team**

*Last updated: October 2024*
