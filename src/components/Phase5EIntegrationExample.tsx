/**
 * Phase 5E Integration Example
 * 
 * Demonstrates how to integrate event-task associations into an existing page
 * Shows before/after comparison with working examples
 */

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Calendar, Link2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { EventTaskBreadcrumb } from './EventTaskBreadcrumb';
import { EventTaskCrossReference } from './EventTaskCrossReference';
import { TaskEventAssociationManager } from './TaskEventAssociationManager';
import { TaskEventAssociationBadge } from './TaskEventAssociationBadge';
import { TaskEventFilter, TaskEventFilterType } from './TaskEventFilter';
import {
  filterStandaloneTasks,
  filterEventAssociatedTasks,
  linkTaskToEvent,
  unlinkTaskFromEvent,
} from '../utils/task-event-integration';
import { Event, Task } from '../utils/event-task-types';
import { toast } from 'sonner@2.0.3';

// Mock data for demonstration
const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Q1 Product Launch',
    description: 'Major product launch for Q1 2024',
    startTime: new Date('2024-01-15'),
    endTime: new Date('2024-03-31'),
    completed: false,
    isPrimaryEvent: true,
    primaryEventId: 'event-1',
    depth: 0,
    childEventIds: ['event-2', 'event-3'],
    tasks: [],
    teamMembers: [],
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: [],
    linksNotes: [],
    allowTeamEdits: true,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: false,
    hasScript: false,
  },
  {
    id: 'event-2',
    title: 'Marketing Campaign',
    description: 'Pre-launch marketing campaign',
    startTime: new Date('2024-01-15'),
    endTime: new Date('2024-02-15'),
    completed: false,
    isPrimaryEvent: false,
    primaryEventId: 'event-1',
    parentEventId: 'event-1',
    depth: 1,
    childEventIds: [],
    tasks: [],
    teamMembers: [],
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: [],
    linksNotes: [],
    allowTeamEdits: true,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    hasScript: false,
  },
  {
    id: 'event-3',
    title: 'Development Sprint',
    description: 'Final development sprint',
    startTime: new Date('2024-02-01'),
    endTime: new Date('2024-03-15'),
    completed: false,
    isPrimaryEvent: false,
    primaryEventId: 'event-1',
    parentEventId: 'event-1',
    depth: 1,
    childEventIds: [],
    tasks: [],
    teamMembers: [],
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: [],
    linksNotes: [],
    allowTeamEdits: true,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    hasScript: false,
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Create marketing materials',
    description: 'Design and create all marketing collateral',
    completed: false,
    dueDate: new Date('2024-02-01'),
    parentEventId: 'event-2',
    primaryEventId: 'event-1',
    archived: false,
    archiveWithParentEvent: true,
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [],
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task-2',
    title: 'Standalone task - Review quarterly metrics',
    description: 'This task is not associated with any event',
    completed: false,
    dueDate: new Date('2024-01-20'),
    archived: false,
    archiveWithParentEvent: false,
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [],
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task-3',
    title: 'Finalize feature implementation',
    description: 'Complete the final features before launch',
    completed: false,
    dueDate: new Date('2024-03-10'),
    parentEventId: 'event-3',
    primaryEventId: 'event-1',
    archived: false,
    archiveWithParentEvent: true,
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [],
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function Phase5EIntegrationExample() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [events] = useState<Event[]>(mockEvents);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAssociationManagerOpen, setIsAssociationManagerOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState<TaskEventFilterType>('all');

  // Filter tasks based on event association
  const filteredTasks = useMemo(() => {
    switch (eventFilter) {
      case 'standalone':
        return filterStandaloneTasks(tasks);
      case 'event-associated':
        return filterEventAssociatedTasks(tasks);
      default:
        return tasks;
    }
  }, [tasks, eventFilter]);

  const handleLinkTask = (
    taskId: string,
    eventId: string,
    primaryEventId?: string,
    archiveWithParent?: boolean
  ) => {
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId
          ? linkTaskToEvent(t, eventId, primaryEventId, archiveWithParent)
          : t
      )
    );
    toast.success('Task linked to event successfully');
  };

  const handleUnlinkTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === taskId ? unlinkTaskFromEvent(t) : t))
    );
    toast.success('Task unlinked from event');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Phase 5E: Event/Task Associations</h1>
        <p className="text-muted-foreground">
          Live demonstration of task-event linking, hierarchy breadcrumbs, and cross-reference
          displays
        </p>
      </div>

      <Tabs defaultValue="task-view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="task-view">Task View</TabsTrigger>
          <TabsTrigger value="event-view">Event View</TabsTrigger>
          <TabsTrigger value="components">Component Gallery</TabsTrigger>
        </TabsList>

        {/* Task View - Shows task list with event associations */}
        <TabsContent value="task-view" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tasks with Event Associations</h2>
                <TaskEventFilter
                  value={eventFilter}
                  onChange={setEventFilter}
                  counts={{
                    all: tasks.length,
                    standalone: filterStandaloneTasks(tasks).length,
                    eventAssociated: filterEventAssociatedTasks(tasks).length,
                  }}
                />
              </div>

              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h3 className="font-medium">{task.title}</h3>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground ml-8">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 ml-8">
                          <TaskEventAssociationBadge
                            task={task}
                            allEvents={events}
                            mode="compact"
                            onNavigateToEvent={(eventId) => {
                              const event = events.find(e => e.id === eventId);
                              if (event) {
                                setSelectedEvent(event);
                                toast.info(`Navigating to: ${event.title}`);
                              }
                            }}
                          />
                          {!task.parentEventId && (
                            <Badge variant="outline" className="text-xs">
                              Standalone
                            </Badge>
                          )}
                        </div>

                        {/* Breadcrumb for event-associated tasks */}
                        {task.parentEventId && (
                          <div className="ml-8">
                            <EventTaskBreadcrumb
                              task={task}
                              allEvents={events}
                              mode="compact"
                              onNavigateToEvent={(eventId) => {
                                const event = events.find(e => e.id === eventId);
                                if (event) {
                                  setSelectedEvent(event);
                                  toast.info(`Navigating to: ${event.title}`);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsAssociationManagerOpen(true);
                          }}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          {task.parentEventId ? 'Manage Link' : 'Link to Event'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Event View - Shows event with associated tasks */}
        <TabsContent value="event-view" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Events with Task Cross-References</h2>

              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setSelectedEvent(selectedEvent?.id === event.id ? null : event)
                      }
                      className="w-full p-4 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{event.title}</h3>
                              {event.isPrimaryEvent && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                        >
                          View Tasks
                        </Button>
                      </div>
                    </button>

                    {selectedEvent?.id === event.id && (
                      <div className="p-4 bg-accent/10 border-t">
                        <EventTaskCrossReference
                          event={event}
                          allEvents={events}
                          allTasks={tasks}
                          onTaskClick={(taskId) => {
                            const task = tasks.find(t => t.id === taskId);
                            if (task) {
                              setSelectedTask(task);
                              toast.info(`Opening task: ${task.title}`);
                            }
                          }}
                          onNavigateToEvent={(eventId) => {
                            const evt = events.find(e => e.id === eventId);
                            if (evt) {
                              setSelectedEvent(evt);
                            }
                          }}
                          showHierarchy={true}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Component Gallery - Shows all components */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid gap-6">
            {/* Breadcrumb Examples */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">EventTaskBreadcrumb Component</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mode: Full</p>
                  <EventTaskBreadcrumb
                    task={tasks.find(t => t.parentEventId)}
                    allEvents={events}
                    mode="full"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mode: Compact</p>
                  <EventTaskBreadcrumb
                    task={tasks.find(t => t.parentEventId)}
                    allEvents={events}
                    mode="compact"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mode: Badge</p>
                  <EventTaskBreadcrumb
                    task={tasks.find(t => t.parentEventId)}
                    allEvents={events}
                    mode="badge"
                  />
                </div>
              </div>
            </Card>

            {/* Association Badge Examples */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                TaskEventAssociationBadge Component
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Compact Mode</p>
                  <TaskEventAssociationBadge
                    task={tasks.find(t => t.parentEventId) || tasks[0]}
                    allEvents={events}
                    mode="compact"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Full Mode</p>
                  <TaskEventAssociationBadge
                    task={tasks.find(t => t.parentEventId) || tasks[0]}
                    allEvents={events}
                    mode="full"
                  />
                </div>
              </div>
            </Card>

            {/* Filter Example */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">TaskEventFilter Component</h3>
              <TaskEventFilter
                value={eventFilter}
                onChange={setEventFilter}
                counts={{
                  all: tasks.length,
                  standalone: filterStandaloneTasks(tasks).length,
                  eventAssociated: filterEventAssociatedTasks(tasks).length,
                }}
              />
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Association Manager Modal */}
      {selectedTask && (
        <TaskEventAssociationManager
          task={selectedTask}
          allEvents={events}
          onLinkToEvent={handleLinkTask}
          onUnlinkFromEvent={handleUnlinkTask}
          open={isAssociationManagerOpen}
          onOpenChange={setIsAssociationManagerOpen}
        />
      )}
    </div>
  );
}
