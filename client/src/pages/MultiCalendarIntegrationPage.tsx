import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Apple, Mail } from 'lucide-react';
import { OutlookCalendarIntegration } from '@/components/OutlookCalendarIntegration';
import { AppleCalendarIntegration } from '@/components/AppleCalendarIntegration';

export function MultiCalendarIntegrationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Calendar Integrations</h1>
        <p className="text-muted-foreground">
          Connect your external calendars to sync events and create new ones directly from SyncScript.
        </p>
      </div>

      {/* Integration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Available Integrations
          </CardTitle>
          <CardDescription>
            Choose from the supported calendar providers below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-medium">Outlook Calendar</h3>
                <p className="text-sm text-muted-foreground">Microsoft Outlook & Office 365</p>
              </div>
              <Badge variant="default">OAuth 2.0</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Apple className="h-8 w-8 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium">Apple/iCloud Calendar</h3>
                <p className="text-sm text-muted-foreground">iCloud, Apple Calendar, CalDAV</p>
              </div>
              <Badge variant="secondary">ICS Feed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutlookCalendarIntegration
          onConnected={() => {
            console.log('Outlook Calendar connected');
          }}
          onDisconnected={() => {
            console.log('Outlook Calendar disconnected');
          }}
        />
        
        <AppleCalendarIntegration
          onConnected={() => {
            console.log('Apple Calendar connected');
          }}
          onDisconnected={() => {
            console.log('Apple Calendar disconnected');
          }}
        />
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Learn how to set up calendar integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Outlook Calendar Setup
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Connect Outlook Calendar" and sign in with your Microsoft account. 
                You'll be redirected to Microsoft to authorize the connection.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Apple className="h-4 w-4 text-gray-600" />
                Apple/iCloud Calendar Setup
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                To connect your Apple/iCloud calendar, you'll need to get the ICS URL from your calendar settings:
              </p>
              <ol className="text-sm text-muted-foreground mt-2 ml-4 list-decimal space-y-1">
                <li>Open Apple Calendar or iCloud.com</li>
                <li>Right-click on your calendar and select "Get Info"</li>
                <li>Copy the "Public Calendar" URL</li>
                <li>Paste it in the ICS URL field above</li>
              </ol>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Calendar integrations are read-only for Apple/iCloud calendars. 
              Outlook Calendar supports both reading and creating events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
