import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * Test Email Generator
 * 
 * Quickly generate test emails to populate the admin dashboard.
 * Useful for testing the AI draft system without setting up webhooks.
 * 
 * Usage: Add to admin dashboard during development
 */

interface TestEmailTemplate {
  from: string;
  subject: string;
  body: string;
  category: 'bug' | 'feature' | 'question' | 'praise' | 'onboarding';
}

const TEST_EMAILS: TestEmailTemplate[] = [
  {
    from: 'sarah@example.com',
    subject: 'Bug: Calendar events not syncing',
    body: 'Hi! I noticed that when I create an event in the calendar, it doesn\'t sync to my dashboard. I tried refreshing but it still doesn\'t show up. Can you help? Thanks!',
    category: 'bug'
  },
  {
    from: 'mike@example.com',
    subject: 'Feature Request: Dark mode toggle',
    body: 'Hey, I love SyncScript! Would it be possible to add a dark mode toggle? I work late nights and the current theme is a bit bright. Thanks for building such an awesome app!',
    category: 'feature'
  },
  {
    from: 'jessica@example.com',
    subject: 'How do I add team members?',
    body: 'Hi there! I just signed up and I\'m trying to figure out how to add my team members to a project. I don\'t see an obvious button for it. Could you point me in the right direction?',
    category: 'question'
  },
  {
    from: 'david@example.com',
    subject: 'This app is amazing!',
    body: 'Just wanted to say thank you for building SyncScript. I\'ve been using it for a week now and it\'s completely changed how I manage my tasks. The AI suggestions are spot-on. Keep up the great work!',
    category: 'praise'
  },
  {
    from: 'emma@example.com',
    subject: 'Getting started with SyncScript',
    body: 'Hi! I just joined the beta and I\'m not sure where to start. What are the main features I should try first? Also, is there a tutorial or onboarding guide? Thanks!',
    category: 'onboarding'
  },
  {
    from: 'alex@example.com',
    subject: 'Urgent: Lost all my data!',
    body: 'I logged in this morning and all my tasks are gone! I had over 50 tasks and goals set up. This is really frustrating. Can you please help me recover my data ASAP?',
    category: 'bug'
  },
  {
    from: 'olivia@example.com',
    subject: 'Suggestion: Integration with Notion',
    body: 'Would love to see an integration with Notion! I use both apps daily and it would be amazing to sync my SyncScript tasks with my Notion workspace. Is this on your roadmap?',
    category: 'feature'
  },
  {
    from: 'chris@example.com',
    subject: 'How does the energy system work?',
    body: 'I see the energy points in my profile but I\'m not entirely sure how they work. Do they decay over time? How do I earn more? Is there documentation about this?',
    category: 'question'
  }
];

export function TestEmailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);

  const generateTestEmail = async (template: TestEmailTemplate) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/admin/webhook`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: template.from,
            subject: template.subject,
            body: template.body,
            receivedAt: new Date().toISOString()
          })
        }
      );

      if (response.ok) {
        toast.success('Test email generated!');
      } else {
        // Fallback to localStorage
        const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const email = {
          id: emailId,
          from: template.from,
          subject: template.subject,
          body: template.body,
          category: template.category,
          sentiment: template.category === 'praise' ? 'positive' : template.category === 'bug' ? 'negative' : 'neutral',
          priority: template.category === 'bug' ? 'high' : template.category === 'feature' ? 'medium' : 'low',
          status: 'pending',
          receivedAt: new Date().toISOString()
        };

        const stored = localStorage.getItem('admin_emails');
        const emails = stored ? JSON.parse(stored) : [];
        emails.unshift(email);
        localStorage.setItem('admin_emails', JSON.stringify(emails));
        
        toast.success('Test email added to localStorage!');
      }
      
      // Refresh page to show new email
      window.location.reload();
    } catch (error) {
      console.error('Error generating test email:', error);
      toast.error('Failed to generate test email');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllEmails = async () => {
    setIsGenerating(true);
    
    for (const template of TEST_EMAILS) {
      await generateTestEmail(template);
      // Wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsGenerating(false);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <div>
          <h3 className="text-lg font-medium text-white">Test Email Generator</h3>
          <p className="text-sm text-gray-400">Generate test emails to try the AI system</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <Select value={selectedTemplate.toString()} onValueChange={(v) => setSelectedTemplate(parseInt(v))}>
            <SelectTrigger className="flex-1 bg-gray-800/50 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {TEST_EMAILS.map((template, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {template.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => generateTestEmail(TEST_EMAILS[selectedTemplate])}
            disabled={isGenerating}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
          >
            <Mail className="w-4 h-4 mr-2" />
            Generate One
          </Button>
        </div>

        <Button
          onClick={generateAllEmails}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : `Generate All ${TEST_EMAILS.length} Emails`}
        </Button>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-300">
          <strong>Tip:</strong> These test emails will be stored in localStorage and/or the backend KV store. 
          Use this to test AI draft generation without setting up email webhooks.
        </p>
      </div>
    </Card>
  );
}
