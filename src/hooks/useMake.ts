/**
 * Make.com Integration Hook
 * 
 * Provides easy access to Make.com automation from React components.
 * Syncs tasks, meetings, goals, and events to all connected services.
 */

import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

interface MakeResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface TaskData {
  id?: string;
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
  assignee?: string;
  project?: string;
}

interface MeetingData {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  duration?: number; // minutes
  attendees?: string[];
  password?: string;
  timezone?: string;
}

interface GoalData {
  id: string;
  title: string;
  description?: string;
  userId: string;
  userName?: string;
  milestonesCompleted?: number;
  totalMilestones?: number;
  daysToComplete?: number;
  celebrationMessage?: string;
}

interface EventData {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  attendees?: string[];
  reminders?: number[];
  allDay?: boolean;
}

export function useMake() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sync a task to all connected services (GitHub, Trello, Notion, etc.)
   */
  const syncTask = async (taskData: TaskData): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/task/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync task');
      }

      setLoading(false);
      return { success: true, message: data.message, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Update a task across all services
   */
  const updateTask = async (
    taskId: string,
    updates: Partial<TaskData>
  ): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/task/${taskId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Delete a task from all services
   */
  const deleteTask = async (taskId: string): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/task/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      setLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Create a Zoom meeting and sync to calendar
   */
  const createMeeting = async (meetingData: MeetingData): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/meeting/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(meetingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting');
      }

      setLoading(false);
      return { success: true, message: data.message, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Celebrate goal completion on social platforms
   */
  const celebrateGoal = async (goalData: GoalData): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/goal/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to celebrate goal');
      }

      setLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Sync event to all calendars
   */
  const syncEvent = async (eventData: EventData): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/calendar/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync event');
      }

      setLoading(false);
      return { success: true, message: data.message, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Check Make.com integration status
   */
  const checkStatus = async (): Promise<{
    configured: string;
    webhooks: Record<string, boolean>;
    ready: boolean;
    message: string;
  }> => {
    try {
      const response = await fetch(`${BASE_URL}/make/status`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (err) {
      return {
        configured: '0/5 webhooks',
        webhooks: {},
        ready: false,
        message: 'Failed to check status',
      };
    }
  };

  /**
   * Test Make.com webhook connection
   */
  const testWebhook = async (webhookType: 'task' | 'meeting' | 'goal' | 'calendar' | 'email'): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ webhookType }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Webhook test failed';
        
        // Add helpful context to error messages
        let enhancedError = errorMsg;
        
        if (errorMsg.includes('410') || errorMsg.includes('not active')) {
          enhancedError = `Scenario not active. Turn ON your Make.com scenario for ${webhookType}.`;
        } else if (errorMsg.includes('not configured')) {
          enhancedError = `Webhook not configured. Add MAKE_${webhookType.toUpperCase()}_WEBHOOK_URL to environment variables.`;
        } else if (errorMsg.includes('404')) {
          enhancedError = `Webhook not found. Verify the webhook URL in your Make.com ${webhookType} scenario.`;
        }
        
        throw new Error(enhancedError);
      }

      setLoading(false);
      return { success: true, message: data.message, data: data.response };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Send batch of items to Make.com
   */
  const sendBatch = async (
    webhookType: 'task' | 'meeting' | 'goal' | 'calendar',
    items: any[]
  ): Promise<MakeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/make/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ webhookType, items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Batch send failed');
      }

      setLoading(false);
      return { success: true, message: data.message, data: { count: data.count } };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  return {
    // State
    loading,
    error,
    
    // Task operations
    syncTask,
    updateTask,
    deleteTask,
    
    // Meeting operations
    createMeeting,
    
    // Goal operations
    celebrateGoal,
    
    // Calendar operations
    syncEvent,
    
    // Utility
    checkStatus,
    testWebhook,
    sendBatch,
  };
}