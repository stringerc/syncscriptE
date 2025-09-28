import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  X, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Trash2, 
  Save, 
  Plus,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface EventEndedNotificationProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata: string;
    createdAt: string;
    read: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: (notificationId: string) => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  estimatedDuration?: number;
}

interface EventData {
  eventId: string;
  eventTitle: string;
  incompleteTasksCount: number;
  taskIds: string[];
}

export function EventEndedNotification({ 
  notification, 
  isOpen, 
  onClose, 
  onNotificationRead 
}: EventEndedNotificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    budgetImpact: 0
  });

  // Parse notification metadata
  const eventData: EventData = JSON.parse(notification.metadata);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Load tasks when notification opens
  React.useEffect(() => {
    if (isOpen && !tasksLoaded) {
      loadTasks();
    }
  }, [isOpen, tasksLoaded]);

  const loadTasks = async () => {
    try {
      const response = await api.get(`/tasks?eventId=${eventData.eventId}`);
      const eventTasks = response.data.data.filter((task: Task) => 
        task.status !== 'COMPLETED'
      );
      setTasks(eventTasks);
      setTasksLoaded(true);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleTaskActionMutation = useMutation({
    mutationFn: async ({ action, taskIds, newEventData: eventData }: {
      action: string;
      taskIds: string[];
      newEventData?: any;
    }) => {
      const response = await api.post('/task-scheduling/handle-ended-event-tasks', {
        eventId: eventData.eventId,
        action,
        taskIds,
        newEventData: eventData
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Action Completed!",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onNotificationRead(notification.id);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.response?.data?.error || "Failed to handle tasks",
        variant: "destructive"
      });
    }
  });

  const handleAction = (action: string) => {
    if (action === 'create_event') {
      setShowCreateEventForm(true);
      setSelectedAction(action);
    } else {
      setSelectedAction(action);
      handleTaskActionMutation.mutate({
        action,
        taskIds: tasks.map(t => t.id),
        newEventData: action === 'create_event' ? newEventData : undefined
      });
    }
  };

  const handleCreateEvent = () => {
    if (!newEventData.title.trim() || !newEventData.startTime || !newEventData.endTime) {
      toast({
        title: "Error",
        description: "Event title, start time, and end time are required",
        variant: "destructive"
      });
      return;
    }

    handleTaskActionMutation.mutate({
      action: 'create_event',
      taskIds: tasks.map(t => t.id),
      newEventData
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Email-like */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">{notification.title}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Email Preview */}
          <div className="p-6 border-b">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Event Ended Notification</span>
              </div>
              <p className="text-muted-foreground">{notification.message}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-blue-600 font-medium">
                  Event: {eventData.eventTitle}
                </span>
                <span className="text-orange-600 font-medium">
                  {eventData.incompleteTasksCount} incomplete task(s)
                </span>
              </div>
            </div>
          </div>

          {/* Expanded View */}
          {expanded && (
            <div className="p-6 space-y-6">
              {/* Tasks List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Incomplete Preparation Tasks</span>
                  </CardTitle>
                  <CardDescription>
                    These tasks were created for "{eventData.eventTitle}" but weren't completed before the event ended.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasks.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {tasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {task.status}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  {task.description}
                                </p>
                              )}
                              {task.estimatedDuration && (
                                <p className="text-xs text-muted-foreground">
                                  Estimated: {task.estimatedDuration} minutes
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No incomplete tasks found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>What would you like to do with these tasks?</CardTitle>
                  <CardDescription>
                    Choose how to handle the incomplete preparation tasks for "{eventData.eventTitle}".
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleAction('keep')}
                      disabled={handleTaskActionMutation.isPending}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span className="font-medium">Keep Tasks</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Keep the tasks in your task list but remove the preparation label
                      </p>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAction('delete')}
                      disabled={handleTaskActionMutation.isPending}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium">Delete Tasks</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Remove these tasks from your task list
                      </p>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAction('save')}
                      disabled={handleTaskActionMutation.isPending}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Mark as Completed</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Mark all tasks as completed and remove from active list
                      </p>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAction('create_event')}
                      disabled={handleTaskActionMutation.isPending}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Create New Event</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Create a new event and link these tasks to it
                      </p>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Create Event Form */}
              {showCreateEventForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                    <CardDescription>
                      Create a new event and link the incomplete tasks to it as preparation tasks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="eventTitle">Event Title</Label>
                      <Input
                        id="eventTitle"
                        value={newEventData.title}
                        onChange={(e) => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventDescription">Description</Label>
                      <Textarea
                        id="eventDescription"
                        value={newEventData.description}
                        onChange={(e) => setNewEventData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter event description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={newEventData.startTime}
                          onChange={(e) => setNewEventData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={newEventData.endTime}
                          onChange={(e) => setNewEventData(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newEventData.location}
                        onChange={(e) => setNewEventData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter event location"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={handleCreateEvent}
                        disabled={handleTaskActionMutation.isPending}
                      >
                        {handleTaskActionMutation.isPending ? 'Creating...' : 'Create Event & Link Tasks'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateEventForm(false);
                          setNewEventData({
                            title: '',
                            description: '',
                            startTime: '',
                            endTime: '',
                            location: '',
                            budgetImpact: 0
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {expanded ? 'Full notification view' : 'Click to expand and manage tasks'}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onNotificationRead(notification.id);
                onClose();
              }}
            >
              Mark as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
