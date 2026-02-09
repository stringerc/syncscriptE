// =====================================================================
// TEST EMAIL ENDPOINT
// Quick test to verify Resend integration is working
// =====================================================================

export async function sendTestEmail(recipientEmail: string): Promise<{ success: boolean; error?: string; emailId?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  console.log('[Test Email] Starting...');
  console.log('[Test Email] Recipient:', recipientEmail);
  console.log('[Test Email] API Key exists:', !!resendApiKey);
  console.log('[Test Email] API Key length:', resendApiKey?.length || 0);
  
  if (!resendApiKey) {
    console.error('[Test Email] RESEND_API_KEY not found in environment variables');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
    <h1 style="color: #06b6d4; margin: 0 0 20px;">✅ Email System Working!</h1>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      This is a test email from your SyncScript Feedback Intelligence System.
    </p>
    <p style="color: #666; font-size: 14px;">
      If you're seeing this, your email configuration is working correctly!
    </p>
    <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-left: 4px solid #06b6d4; border-radius: 4px;">
      <p style="margin: 0; color: #0c4a6e; font-weight: bold;">Next Steps:</p>
      <ul style="color: #0c4a6e; margin: 10px 0 0; padding-left: 20px;">
        <li>Daily digests are now ready to send</li>
        <li>Configure your schedule in the admin dashboard</li>
        <li>Add more recipients as needed</li>
      </ul>
    </div>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #999; font-size: 12px; margin: 0;">
      Sent from SyncScript Intelligence System • ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>
    `;

    console.log('[Test Email] Sending request to Resend API...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SyncScript <noreply@syncscript.app>',
        to: recipientEmail,
        subject: '✅ Test Email - SyncScript Feedback System',
        html: htmlContent
      })
    });

    console.log('[Test Email] Response status:', response.status);
    
    const responseText = await response.text();
    console.log('[Test Email] Response body:', responseText);

    if (!response.ok) {
      console.error('[Test Email] Resend API error:', responseText);
      return { success: false, error: `Resend API error (${response.status}): ${responseText}` };
    }

    const data = JSON.parse(responseText);
    console.log('[Test Email] Email sent successfully! ID:', data.id);
    
    return { success: true, emailId: data.id };
    
  } catch (error) {
    console.error('[Test Email] Exception:', error);
    return { success: false, error: String(error) };
  }
}
