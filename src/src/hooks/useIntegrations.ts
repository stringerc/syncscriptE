/**
 * Integration Management Hook
 * 
 * Provides a clean, React-friendly interface for managing integrations
 * Works with any provider (Direct OAuth, Merge.dev, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getIntegrationService,
  type IntegrationProvider,
  type IntegrationConnection,
  type CalendarEvent,
  type Task
} from '../services/IntegrationProvider';

export function useIntegrations(userId: string) {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const integrationService = getIntegrationService();

  // Load user's connections
  const loadConnections = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const userConnections = await integrationService.getConnections(userId);
      setConnections(userConnections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Check if a provider is connected
  const isConnected = useCallback((provider: IntegrationProvider): boolean => {
    return connections.some(c => c.provider === provider && c.is_active);
  }, [connections]);

  // Get a specific connection
  const getConnection = useCallback((provider: IntegrationProvider): IntegrationConnection | null => {
    return connections.find(c => c.provider === provider) || null;
  }, [connections]);

  // Initiate OAuth flow
  const connect = useCallback(async (provider: IntegrationProvider) => {
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', provider);
      
      const authUrl = await integrationService.getAuthUrl(provider, state);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate connection');
      console.error('Error connecting:', err);
      throw err;
    }
  }, []);

  // Disconnect a provider
  const disconnect = useCallback(async (provider: IntegrationProvider) => {
    try {
      await integrationService.revokeAccess(provider, userId);
      await loadConnections(); // Refresh connections list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      console.error('Error disconnecting:', err);
      throw err;
    }
  }, [userId, loadConnections]);

  // Sync a connection (fetch latest data)
  const sync = useCallback(async (provider: IntegrationProvider) => {
    try {
      await integrationService.syncConnection(userId, provider);
      await loadConnections(); // Refresh connections list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
      console.error('Error syncing:', err);
      throw err;
    }
  }, [userId, loadConnections]);

  return {
    connections,
    loading,
    error,
    isConnected,
    getConnection,
    connect,
    disconnect,
    sync,
    refresh: loadConnections
  };
}

/**
 * Calendar Events Hook
 * Provides easy access to calendar events from any provider
 */
export function useCalendarEvents(
  userId: string,
  provider: IntegrationProvider | null,
  startDate: string,
  endDate: string
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const integrationService = getIntegrationService();

  const loadEvents = useCallback(async () => {
    if (!userId || !provider) return;

    try {
      setLoading(true);
      setError(null);
      const calendarEvents = await integrationService.getCalendarEvents(
        provider,
        userId,
        startDate,
        endDate
      );
      setEvents(calendarEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
      console.error('Error loading calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, provider, startDate, endDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const createEvent = useCallback(async (event: Partial<CalendarEvent>) => {
    if (!userId || !provider) throw new Error('No provider selected');

    try {
      const newEvent = await integrationService.createCalendarEvent(provider, userId, event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      console.error('Error creating event:', err);
      throw err;
    }
  }, [userId, provider]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!userId || !provider) throw new Error('No provider selected');

    try {
      const updatedEvent = await integrationService.updateCalendarEvent(
        provider,
        userId,
        eventId,
        updates
      );
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      console.error('Error updating event:', err);
      throw err;
    }
  }, [userId, provider]);

  const deleteEvent = useCallback(async (eventId: string) => {
    if (!userId || !provider) throw new Error('No provider selected');

    try {
      await integrationService.deleteCalendarEvent(provider, userId, eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      console.error('Error deleting event:', err);
      throw err;
    }
  }, [userId, provider]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: loadEvents
  };
}

/**
 * Tasks Hook (for Slack, Jira, Linear, Asana, etc.)
 * Provides unified task management across platforms
 */
export function useTasks(
  userId: string,
  provider: IntegrationProvider | null,
  filters?: { status?: string; assignee?: string }
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const integrationService = getIntegrationService();

  const loadTasks = useCallback(async () => {
    if (!userId || !provider) return;

    try {
      setLoading(true);
      setError(null);
      const userTasks = await integrationService.getTasks(provider, userId, filters);
      setTasks(userTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, provider, filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (task: Partial<Task>) => {
    if (!userId || !provider) throw new Error('No provider selected');

    try {
      const newTask = await integrationService.createTask(provider, userId, task);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      console.error('Error creating task:', err);
      throw err;
    }
  }, [userId, provider]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!userId || !provider) throw new Error('No provider selected');

    try {
      const updatedTask = await integrationService.updateTask(provider, userId, taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
      throw err;
    }
  }, [userId, provider]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    refresh: loadTasks
  };
}
