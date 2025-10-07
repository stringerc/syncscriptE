import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { emailService, EmailProvider, EmailTemplate } from '@/services/emailService';
import { Mail, Settings, TestTube, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function EmailSettings() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = () => {
    const emailProviders = emailService.getProviders();
    const emailTemplates = emailService.getTemplates();
    
    setProviders(emailProviders);
    setTemplates(emailTemplates);
    
    // Load saved provider settings
    const savedProviders = localStorage.getItem('syncscript-email-providers');
    if (savedProviders) {
      try {
        const parsed = JSON.parse(savedProviders);
        setProviders(parsed);
      } catch (error) {
        console.error('Failed to load email provider settings:', error);
      }
    }
  };

  const handleProviderToggle = async (providerName: string, enabled: boolean) => {
    setIsLoading(true);
    try {
      await emailService.setProviderEnabled(providerName, enabled);
      loadEmailSettings();
      
      toast({
        title: enabled ? 'Provider Enabled' : 'Provider Disabled',
        description: `${providerName} email provider has been ${enabled ? 'enabled' : 'disabled'}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update provider settings',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestProvider = async (providerName: string) => {
    setIsLoading(true);
    try {
      const result = await emailService.testEmailProvider(providerName);
      setTestResults(prev => ({
        ...prev,
        [providerName]: result
      }));
      
      toast({
        title: result.success ? 'Test Successful' : 'Test Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Test Error',
        description: 'Failed to test email provider',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedProvider) {
      toast({
        title: 'No Provider Selected',
        description: 'Please select an email provider first',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        template: 'welcome',
        variables: {
          name: 'Test User'
        }
      });
      
      toast({
        title: result.success ? 'Test Email Sent' : 'Failed to Send',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Integration
          </CardTitle>
          <CardDescription>
            Configure email providers and templates for notifications and reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="providers" className="space-y-4">
              <div className="space-y-4">
                {providers.map((provider) => (
                  <Card key={provider.name} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{provider.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {provider.config.apiKey ? 'Configured' : 'Not configured'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {testResults[provider.name] && (
                            <div className="flex items-center gap-1">
                              {testResults[provider.name].success ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {testResults[provider.name].success ? 'Working' : 'Failed'}
                              </span>
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestProvider(provider.name)}
                            disabled={isLoading || !provider.config.apiKey}
                          >
                            <TestTube className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          
                          <Switch
                            checked={provider.enabled}
                            onCheckedChange={(enabled) => handleProviderToggle(provider.name, enabled)}
                            disabled={isLoading || !provider.config.apiKey}
                          />
                        </div>
                      </div>
                      
                      {provider.config.apiKey && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`from-${provider.name}`}>From Email</Label>
                              <Input
                                id={`from-${provider.name}`}
                                value={provider.config.fromEmail || ''}
                                placeholder="noreply@syncscript.ai"
                                disabled
                              />
                            </div>
                            <div>
                              <Label htmlFor={`name-${provider.name}`}>From Name</Label>
                              <Input
                                id={`name-${provider.name}`}
                                value={provider.config.fromName || ''}
                                placeholder="SyncScript AI"
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Email Provider Setup
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    To enable email functionality, configure API keys in your environment variables:
                    VITE_RESEND_API_KEY, VITE_SENDGRID_API_KEY, or VITE_SMTP_CONFIG
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {template.subject}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Test Email Functionality
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Send a test email to verify your email provider is working correctly
                  </p>
                </div>
                <Button
                  onClick={handleSendTestEmail}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send Test Email
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
