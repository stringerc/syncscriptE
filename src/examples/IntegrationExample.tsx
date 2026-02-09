/**
 * SyncScript Integration System - Complete Example
 * 
 * This example demonstrates how to use the provider-agnostic integration system
 * that works with both Direct OAuth (current) and Merge.dev (future).
 * 
 * Key Benefits:
 * - Write once, works with any provider
 * - Easy migration from Direct OAuth to Merge.dev
 * - Type-safe integration management
 * - React hooks for clean component code
 */

import { useState } from 'react';
import { 
  useIntegrations, 
  useCalendarEvents,
  useTasks 
} from '../hooks/useIntegrations';
import { EnhancedOAuthConnector, ENHANCED_OAUTH_PROVIDERS } from '../components/integrations/EnhancedOAuthConnector';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Calendar, CheckSquare, Users } from 'lucide-react';

/**
 * Example 1: Basic Integration Management
 * Connect/disconnect integrations and monitor status
 */
function BasicIntegrationExample() {
  const userId = 'current-user-id'; // Get from auth context
  const { connections, isConnected, connect, disconnect } = useIntegrations(userId);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Integrations</h2>
      
      {/* Show all available providers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(ENHANCED_OAUTH_PROVIDERS).map(provider => (
          <EnhancedOAuthConnector
            key={provider.id}
            provider={provider}
            userId={userId}
            onConnectionChange={(connected) => {
              console.log(`${provider.name} is now ${connected ? 'connected' : 'disconnected'}`);
            }}
          />
        ))}
      </div>

      {/* Connection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Google Calendar: {isConnected('google') ? '✅ Connected' : '❌ Not Connected'}</p>
            <p>Outlook: {isConnected('microsoft') ? '✅ Connected' : '❌ Not Connected'}</p>
            <p>Slack: {isConnected('slack') ? '✅ Connected' : '❌ Not Connected'}</p>
            <p className="mt-4 text-sm text-gray-500">
              Total: {connections.length} active connection{connections.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example 2: Calendar Events Management
 * Fetch, create, update, delete calendar events
 */
function CalendarEventsExample() {
  const userId = 'current-user-id';
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft'>('google');
  
  const { events, createEvent, updateEvent, deleteEvent, loading } = useCalendarEvents(
    userId,
    selectedProvider,
    '2026-01-20', // Start date
    '2026-01-27'  // End date
  );

  const handleCreateEvent = async () => {
    try {
      await createEvent({
        title: 'Team Standup',
        description: 'Daily sync meeting',
        start_time: '2026-01-21T10:00:00Z',
        end_time: '2026-01-21T10:30:00Z',
        attendees: ['team@company.com']
      });
      alert('Event created successfully!');
    } catch (error) {
      alert('Failed to create event');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendar Events</h2>
        
        {/* Provider Selector */}
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as 'google' | 'microsoft')}
          className="rounded-lg border bg-white/5 px-4 py-2"
        >
          <option value="google">Google Calendar</option>
          <option value="microsoft">Outlook Calendar</option>
        </select>
      </div>

      {/* Create Event Button */}
      <Button onClick={handleCreateEvent}>
        <Calendar className="mr-2 h-4 w-4" />
        Create Event
      </Button>

      {/* Events List */}
      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {event.title}
                  <span className="text-sm font-normal text-gray-500">
                    {event.provider}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{event.description}</p>
                <div className="mt-2 flex gap-2 text-xs text-gray-500">
                  <span>{new Date(event.start_time).toLocaleString()}</span>
                  <span>→</span>
                  <span>{new Date(event.end_time).toLocaleString()}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateEvent(event.id, { title: event.title + ' (Updated)' })}
                  >
                    Update
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Unified Dashboard
 * Shows data from all connected integrations
 */
function UnifiedDashboardExample() {
  const userId = 'current-user-id';
  const { connections } = useIntegrations(userId);
  
  // Get events from all connected calendar providers
  const googleEvents = useCalendarEvents(userId, 'google', '2026-01-20', '2026-01-27');
  const outlookEvents = useCalendarEvents(userId, 'microsoft', '2026-01-20', '2026-01-27');

  // Combine all events
  const allEvents = [
    ...googleEvents.events,
    ...outlookEvents.events
  ].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Unified Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{allEvents.length}</p>
            <p className="text-sm text-gray-500">
              {googleEvents.events.length} from Google, {outlookEvents.events.length} from Outlook
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{connections.filter(c => c.is_active).length}</p>
            <p className="text-sm text-gray-500">Active integrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {connections.every(c => c.last_sync) ? '✅' : '⏳'}
            </p>
            <p className="text-sm text-gray-500">
              Last synced: {connections[0]?.last_sync 
                ? new Date(connections[0].last_sync).toLocaleTimeString()
                : 'Never'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allEvents.map(event => (
              <div 
                key={`${event.provider}-${event.id}`}
                className="flex items-start gap-3 rounded-lg border border-white/10 p-3"
              >
                <div className={`mt-1 h-2 w-2 rounded-full ${
                  event.provider === 'google' ? 'bg-blue-500' :
                  event.provider === 'microsoft' ? 'bg-blue-600' :
                  'bg-purple-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.start_time).toLocaleString()} • {event.provider}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example 4: Future-Ready Tasks Integration
 * This will work automatically when you switch to Merge.dev and add Jira/Linear/Asana
 */
function TasksIntegrationExample() {
  const userId = 'current-user-id';
  
  // This code works exactly the same whether you're using:
  // - Direct OAuth with Slack (current)
  // - Merge.dev with Jira/Linear/Asana (future)
  const { tasks, createTask, updateTask, loading } = useTasks(
    userId,
    'slack', // Change to 'jira', 'linear', 'asana' when using Merge.dev
    { status: 'todo' }
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tasks</h2>
      
      <Button onClick={() => createTask({
        title: 'New task',
        description: 'Task description',
        status: 'todo',
        priority: 'high'
      })}>
        Create Task
      </Button>

      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id}>
            <CardContent className="pt-4">
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-gray-500">{task.description}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateTask(task.id, { status: 'done' })}
                >
                  Mark Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 5: Migration Demo
 * Shows how easy it is to switch providers
 */
function MigrationDemo() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Migration Guide</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Setup (Direct OAuth)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-500/10 p-4">
            <p className="font-mono text-sm text-green-400">
              VITE_INTEGRATION_PROVIDER=direct_oauth
            </p>
            <p className="mt-2 text-sm text-gray-400">
              ✅ 3 integrations (Google Calendar, Outlook, Slack)<br />
              ✅ $0/month cost<br />
              ✅ Full control over OAuth flows
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Setup (Merge.dev)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-500/10 p-4">
            <p className="font-mono text-sm text-blue-400">
              VITE_INTEGRATION_PROVIDER=merge_dev<br />
              VITE_MERGE_API_KEY=your_api_key
            </p>
            <p className="mt-2 text-sm text-gray-400">
              ✅ 180+ integrations (Jira, Linear, Asana, Notion, etc.)<br />
              ✅ Automatic token refresh<br />
              ✅ Webhooks for real-time sync<br />
              ✅ SOC 2 compliance<br />
              💰 $250-600/month
            </p>
          </div>

          <div className="rounded-lg bg-yellow-500/10 p-4">
            <p className="text-sm font-medium text-yellow-400">
              ⚡ Zero Code Changes Required!
            </p>
            <p className="mt-1 text-sm text-gray-400">
              All your existing code continues to work exactly the same.
              The abstraction layer handles everything.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export all examples
export {
  BasicIntegrationExample,
  CalendarEventsExample,
  UnifiedDashboardExample,
  TasksIntegrationExample,
  MigrationDemo
};
