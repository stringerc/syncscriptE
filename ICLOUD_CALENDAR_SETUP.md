# iCloud Calendar Integration Setup Guide

This guide will help you set up iCloud Calendar integration with SyncScript using app-specific passwords.

## Overview

iCloud Calendar integration uses the CalDAV protocol with app-specific passwords for secure access to your iCloud Calendar events. This method is more secure than using your main Apple ID password.

## Prerequisites

- An Apple ID account
- iCloud Calendar enabled
- Access to Apple ID settings

## Step-by-Step Setup

### 1. Enable Two-Factor Authentication

Before you can create an app-specific password, you need to enable two-factor authentication on your Apple ID:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. In the "Security" section, click "Edit"
4. Turn on "Two-Factor Authentication" if it's not already enabled

### 2. Generate an App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. In the "Security" section, click "Edit"
4. Under "App-Specific Passwords", click "Generate Password"
5. Enter a label for the password (e.g., "SyncScript Calendar")
6. Click "Create"
7. **Copy the generated password immediately** - you won't be able to see it again

### 3. Connect iCloud Calendar in SyncScript

1. Navigate to the Multi-Calendar page in SyncScript
2. Click "Connect iCloud Calendar" on the iCloud Calendar card
3. Enter your Apple ID username (email address)
4. Enter the app-specific password you generated
5. Click "Connect"

## Troubleshooting

### Common Issues

#### "Invalid Apple ID credentials" Error
- **Cause**: Incorrect username or app-specific password
- **Solution**: 
  - Verify your Apple ID username is correct
  - Generate a new app-specific password
  - Ensure two-factor authentication is enabled

#### "Could not discover calendar home set" Error
- **Cause**: CalDAV discovery failed
- **Solution**:
  - Check your internet connection
  - Verify iCloud Calendar is enabled in your Apple ID settings
  - Try again in a few minutes

#### "No calendars found" Error
- **Cause**: No calendars exist or permissions issue
- **Solution**:
  - Ensure you have at least one calendar in iCloud
  - Check that Calendar sync is enabled in iCloud settings
  - Verify the app-specific password has correct permissions

### Security Best Practices

1. **Use App-Specific Passwords**: Never use your main Apple ID password
2. **Regular Rotation**: Consider regenerating app-specific passwords periodically
3. **Unique Labels**: Use descriptive labels for your app-specific passwords
4. **Monitor Access**: Regularly review your Apple ID security settings

### App-Specific Password Management

- **Storage**: Store app-specific passwords securely (password manager recommended)
- **Revocation**: You can revoke app-specific passwords at any time from Apple ID settings
- **Limits**: Apple allows up to 25 app-specific passwords per Apple ID

## Technical Details

### CalDAV Protocol
SyncScript uses the CalDAV protocol to communicate with iCloud Calendar:
- **Server**: `https://caldav.icloud.com`
- **Authentication**: Basic authentication with app-specific password
- **Data Format**: iCalendar (RFC 5545)

### Supported Operations
- ✅ Read calendar events
- ✅ Create new events
- ✅ Update existing events
- ✅ Delete events
- ✅ Sync multiple calendars

### Limitations
- App-specific passwords don't expire but can be revoked
- CalDAV has some limitations compared to native APIs
- Bulk operations may be slower than other providers

## Production Deployment

### Environment Variables
For production deployment, ensure these environment variables are set:

```bash
# iCloud Calendar (uses app-specific passwords)
ICLOUD_REDIRECT_URI="https://yourdomain.com/auth/icloud/callback"
```

### Security Considerations
- App-specific passwords are stored encrypted in the database
- All CalDAV communications use HTTPS
- Credentials are never logged or exposed in error messages

## Support

If you encounter issues with iCloud Calendar integration:

1. Check the troubleshooting section above
2. Verify your Apple ID settings
3. Test with a new app-specific password
4. Contact support with specific error messages

## Additional Resources

- [Apple ID Security](https://support.apple.com/en-us/HT204152)
- [App-Specific Passwords](https://support.apple.com/en-us/HT204397)
- [CalDAV Specification](https://tools.ietf.org/html/rfc4791)
- [iCalendar Specification](https://tools.ietf.org/html/rfc5545)
