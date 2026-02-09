/**
 * Event/Task System Demo
 * 
 * Comprehensive demonstration of the new event/task/script system
 * Shows all features: tasks, subtasks, resources, AI suggestions, scripts
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Calendar,
  ListChecks,
  BookTemplate,
  Plus,
  Sparkles,
  Paperclip,
  Link as LinkIcon,
} from 'lucide-react';
import { Event, Task, Script } from '../utils/event-task-types';
import { sampleEvents, sampleTasks, sampleScripts } from '../utils/sample-event-data';
import { CURRENT_USER } from '../utils/user-constants';
import { EventModal } from './EventModal';
import { TaskModal } from './TaskModal';
import { TaskEventCard } from './TaskEventCard';
import { ResourceManager } from './ResourceManager';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

export function EventTaskSystemDemo() {
  const [events, setEvents] = useState<Event[]>(sampleEvents);
  const [tasks, setTasks] = useState<Task[]>(sampleTasks.filter(t => !t.parentEventId)); // Standalone tasks
  const [scripts, setScripts] = useState<Script[]>(sampleScripts);
  
  const [selectedItem, setSelectedItem] = useState<Event | Task | null>(null);
  const [selectedType, setSelectedType] = useState<'event' | 'task'>('event');
  const [modalOpen, setModalOpen] = useState(false);
  const [resourceManagerOpen, setResourceManagerOpen] = useState(false);

  // Handle opening event/task modal
  const handleOpenItem = (item: Event | Task, type: 'event' | 'task') => {
    setSelectedItem(item);
    setSelectedType(type);
    setModalOpen(true);
  };

  // Handle saving event/task
  const handleSaveItem = (item: Event | Task) => {
    if (selectedType === 'event') {
      setEvents(prev => prev.map(e => e.id === item.id ? item as Event : e));
      toast.success('Event updated', {
        description: 'All team members have been notified',
      });
    } else {
      setTasks(prev => prev.map(t => t.id === item.id ? item as Task : t));
      toast.success('Task updated');
    }
  };

  // Handle converting task to event
  const handleConvertTaskToEvent = (task: Task) => {
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: task.title,
      description: task.description,
      startTime: task.dueDate || new Date(),
      endTime: new Date((task.dueDate || new Date()).getTime() + 60 * 60 * 1000),
      tasks: task.subtasks || [],
      hasScript: false,
      resources: task.resources,
      linksNotes: task.linksNotes,
      teamMembers: task.assignedTo,
      createdBy: task.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      allowTeamEdits: true,
      createdFromTaskId: task.id,
      parentEventId: task.prepForEventId, // Maintain connection to parent
    };

    setEvents(prev => [...prev, newEvent]);
    
    // Update task to mark it as converted
    setTasks(prev => prev.map(t => 
      t.id === task.id 
        ? { ...t, isConvertedToEvent: true, convertedEventId: newEvent.id } 
        : t
    ));
    
    toast.success('Task converted to event!');
  };

  // Handle saving event as script
  const handleSaveAsScript = (event: Event) => {
    const newScript: Script = {
      id: `script-${Date.now()}`,
      name: `${event.title} Template`,
      description: `Reusable template based on ${event.title}`,
      originalEventId: event.id,
      templateEvent: event,
      createdBy: CURRENT_USER.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTeamScript: true,
      teamMembers: event.teamMembers,
      timesUsed: 0,
      rating: 0,
      tags: [event.category || 'general'],
      category: event.category || 'Other',
      allResources: event.resources,
      allLinksNotes: event.linksNotes,
    };

    setScripts(prev => [...prev, newScript]);
    setEvents(prev => prev.map(e => 
      e.id === event.id 
        ? { ...e, hasScript: true, scriptId: newScript.id } 
        : e
    ));
    
    toast.success('Script created!', {
      description: 'Available in Scripts & Templates',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-100 mb-2">Event & Task System Demo</h1>
          <p className="text-gray-400">
            Complete workflow with tasks, subtasks, resources, AI suggestions, and scripts
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <BookTemplate className="w-4 h-4" />
            Scripts ({scripts.length})
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <TaskEventCard
                key={event.id}
                item={event}
                type="event"
                onClick={() => handleOpenItem(event, 'event')}
              />
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12 bg-[#1a1f2e] rounded-lg">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No events yet</p>
              <p className="text-sm text-gray-500 mb-4">Create your first event to get started</p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
              <TaskEventCard
                key={task.id}
                item={task}
                type="task"
                onClick={() => handleOpenItem(task, 'task')}
              />
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12 bg-[#1a1f2e] rounded-lg">
              <ListChecks className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No standalone tasks</p>
              <p className="text-sm text-gray-500 mb-4">
                Tasks are shown here when they're not attached to an event
              </p>
            </div>
          )}
        </TabsContent>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scripts.map(script => (
              <motion.div
                key={script.id}
                whileHover={{ scale: 1.02 }}
                className="bg-[#1a1f2e] rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <BookTemplate className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-200 mb-1">{script.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {script.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Used {script.timesUsed} times</span>
                  {script.rating > 0 && (
                    <span>⭐ {script.rating.toFixed(1)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {script.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {script.allResources.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      {script.allResources.length}
                    </span>
                  )}
                  {script.allLinksNotes.length > 0 && (
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {script.allLinksNotes.length}
                    </span>
                  )}
                </div>

                <Button className="w-full mt-4" variant="outline">
                  Use Template
                </Button>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Highlights */}
      <div className="bg-[#1a1f2e] rounded-lg p-6 border border-purple-500/20">
        <h3 className="text-lg text-gray-200 mb-4">✨ System Features</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Tasks & Subtasks</h4>
            <p className="text-xs text-gray-500">
              Hierarchical task structure with completion tracking
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ AI Task Generation</h4>
            <p className="text-xs text-gray-500">
              Generate 5 smart task suggestions, regenerate if needed
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Resources & Links</h4>
            <p className="text-xs text-gray-500">
              Attach files, images, URLs, and notes to any item
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Prep Badges</h4>
            <p className="text-xs text-gray-500">
              Tasks show which event they prepare for
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Task → Event</h4>
            <p className="text-xs text-gray-500">
              Convert any task into a full event
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Save as Script</h4>
            <p className="text-xs text-gray-500">
              Turn events into reusable templates
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Team Collaboration</h4>
            <p className="text-xs text-gray-500">
              Assign tasks, track progress, notify team
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Attachment Indicators</h4>
            <p className="text-xs text-gray-500">
              Icons show resources/links count on cards
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm text-purple-400">✓ Progress Tracking</h4>
            <p className="text-xs text-gray-500">
              Visual progress bars for task completion
            </p>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {selectedItem && selectedType === 'event' && (
        <EventModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          event={selectedItem as Event}
          currentUserId={CURRENT_USER.name}
          onSave={(event) => handleSaveItem(event)}
          onSaveAsScript={handleSaveAsScript}
        />
      )}

      {/* Task Modal */}
      {selectedItem && selectedType === 'task' && (
        <TaskModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          task={selectedItem as Task}
          currentUserId={CURRENT_USER.name}
          onSave={(task) => handleSaveItem(task)}
        />
      )}

      {/* Resource Manager (can be opened separately if needed) */}
      {selectedItem && (
        <ResourceManager
          open={resourceManagerOpen}
          onOpenChange={setResourceManagerOpen}
          resources={selectedItem.resources}
          linksNotes={selectedItem.linksNotes}
          onResourcesChange={(resources) => {
            setSelectedItem({ ...selectedItem, resources });
          }}
          onLinksNotesChange={(linksNotes) => {
            setSelectedItem({ ...selectedItem, linksNotes });
          }}
          currentUserId={CURRENT_USER.name}
        />
      )}
    </div>
  );
}
