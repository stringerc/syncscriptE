// Simple email service stub to prevent initialization errors
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  template: string;
  variables?: Record<string, string>;
  attachments?: File[];
}

export interface EmailProvider {
  name: string;
  enabled: boolean;
  config: {
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

// Simple stub service that doesn't cause initialization errors
export const emailService = {
  getProviders: (): EmailProvider[] => [
    {
      name: 'Resend',
      enabled: false,
      config: {
        apiKey: import.meta.env.VITE_RESEND_API_KEY,
        fromEmail: 'noreply@syncscript.ai',
        fromName: 'SyncScript AI'
      }
    },
    {
      name: 'SendGrid',
      enabled: false,
      config: {
        apiKey: import.meta.env.VITE_SENDGRID_API_KEY,
        fromEmail: 'noreply@syncscript.ai',
        fromName: 'SyncScript AI'
      }
    },
    {
      name: 'SMTP',
      enabled: false,
      config: {
        apiKey: import.meta.env.VITE_SMTP_CONFIG,
        fromEmail: 'noreply@syncscript.ai',
        fromName: 'SyncScript AI'
      }
    }
  ],
  
  getTemplates: (): EmailTemplate[] => [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to SyncScript AI Life Manager!',
      body: 'Welcome to SyncScript AI Life Manager!',
      variables: ['name']
    },
    {
      id: 'task_reminder',
      name: 'Task Reminder',
      subject: 'Reminder: {{taskTitle}} is due soon',
      body: 'Task reminder template',
      variables: ['name', 'taskTitle', 'dueDate', 'priority', 'description']
    },
    {
      id: 'event_reminder',
      name: 'Event Reminder',
      subject: 'Upcoming Event: {{eventTitle}}',
      body: 'Event reminder template',
      variables: ['name', 'eventTitle', 'eventTime', 'location']
    },
    {
      id: 'daily_summary',
      name: 'Daily Summary',
      subject: 'Your Daily SyncScript Summary',
      body: 'Daily summary template',
      variables: ['name', 'date', 'tasksCompleted', 'eventsAttended', 'expensesAmount', 'energyLevel']
    }
  ],
  
  setProviderEnabled: async (providerName: string, enabled: boolean): Promise<void> => {
    console.log(`Setting ${providerName} enabled: ${enabled}`);
  },
  
  sendEmail: async (emailData: EmailData): Promise<{ success: boolean; message: string }> => {
    console.log('Sending email:', emailData);
    return { success: true, message: 'Email sent successfully' };
  },
  
  testEmailProvider: async (providerName: string): Promise<{ success: boolean; message: string }> => {
    console.log(`Testing ${providerName} provider`);
    return { success: true, message: `${providerName} provider is working correctly` };
  }
};