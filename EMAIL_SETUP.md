# Email Setup Guide

SyncScript uses Gmail SMTP for sending emails in development. Here's how to set it up:

## 1. Enable 2-Factor Authentication on Gmail

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled

## 2. Generate App Password

1. In Google Account settings, go to Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Click "App passwords"
4. Select "Mail" as the app
5. Select "Other" as the device and enter "SyncScript"
6. Copy the generated 16-character password

## 3. Configure Environment Variables

Add these to your `.env` file in the server directory:

```env
# Email Service (Gmail SMTP for development)
EMAIL_USER="your-email@gmail.com"
EMAIL_APP_PASSWORD="your-16-character-app-password"
```

## 4. Test Email Functionality

Once configured, you can test:

- **Registration**: New users will receive email verification emails
- **Forgot Password**: Users will receive password reset emails
- **Resend Verification**: Users can request new verification emails

## 5. Email Templates

The system includes beautiful HTML email templates for:

- **Password Reset**: Professional design with reset button
- **Email Verification**: Welcome email with verification link
- **Security Features**: 
  - Links expire in 10 minutes (password reset) or 24 hours (verification)
  - Secure token generation
  - User-friendly error handling

## 6. Production Considerations

For production deployment, consider using:

- **SendGrid**: Professional email service
- **Mailgun**: Developer-friendly email API
- **AWS SES**: Amazon's email service
- **Postmark**: Transactional email service

Update the `emailService.ts` file to use your preferred email service provider.

## Troubleshooting

### Common Issues:

1. **"Invalid login"**: Check that 2FA is enabled and app password is correct
2. **"Less secure app access"**: Use app passwords instead of regular passwords
3. **"Authentication failed"**: Verify the app password is exactly 16 characters
4. **Emails not received**: Check spam folder, verify email address

### Testing:

You can test email functionality by:
1. Registering a new account
2. Using "Forgot Password" feature
3. Checking server logs for email sending status
4. Verifying emails arrive in inbox (not spam)

## Security Notes

- App passwords are more secure than regular passwords
- Email tokens expire automatically for security
- Failed email sending doesn't reveal user existence
- All email operations are logged for debugging
