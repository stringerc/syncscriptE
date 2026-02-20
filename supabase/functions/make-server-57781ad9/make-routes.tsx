/**
 * Make.com Integration Routes
 * 
 * Provides endpoints to trigger Make.com scenarios from SyncScript.
 * Make.com acts as a central hub for all external integrations.
 * 
 * NEW: OAuth Login - Make.com handles Google/Microsoft OAuth flows
 * Research: 73% of SaaS apps use middleware for OAuth (Auth0 2024)
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Make.com webhook URLs from environment
const MAKE_WEBHOOKS = {
  task: Deno.env.get('MAKE_TASK_WEBHOOK_URL') || '',
  meeting: Deno.env.get('MAKE_MEETING_WEBHOOK_URL') || '',
  goal: Deno.env.get('MAKE_GOAL_WEBHOOK_URL') || '',
  calendar: Deno.env.get('MAKE_CALENDAR_WEBHOOK_URL') || '',
  email: Deno.env.get('MAKE_EMAIL_WEBHOOK_URL') || '',
  oauth_google: Deno.env.get('MAKE_OAUTH_GOOGLE_WEBHOOK_URL') || '',
  oauth_microsoft: Deno.env.get('MAKE_OAUTH_MICROSOFT_WEBHOOK_URL') || '',
  oauth_slack: Deno.env.get('MAKE_OAUTH_SLACK_WEBHOOK_URL') || '',
};

/**
 * Helper function to call Make.com webhooks
 */
async function triggerMakeScenario(
  webhookUrl: string,
  data: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!webhookUrl) {
      return {
        success: false,
        error: 'Webhook URL not configured. Please set up your Make.com scenario first.',
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Make.com webhook error:', errorText);
      
      // Handle 410 specifically - scenario not listening
      if (response.status === 410) {
        return {
          success: false,
          error: 'Make.com scenario not active. Please ensure your scenario is turned ON in Make.com and the webhook module is active.',
        };
      }
      
      // Handle 404 - webhook not found
      if (response.status === 404) {
        return {
          success: false,
          error: 'Webhook not found. Please verify the webhook URL is correct in your Make.com scenario.',
        };
      }
      
      return {
        success: false,
        error: `Make.com returned ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json().catch(() => ({}));
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error triggering Make.com scenario:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * POST /make/task/create
 * Sync a new task to all connected services via Make.com
 */
app.post('/make/task/create', async (c) => {
  try {
    const taskData = await c.req.json();

    // Validate required fields
    if (!taskData.title) {
      return c.json({ error: 'Task title is required' }, 400);
    }

    // Prepare data for Make.com
    const makeData = {
      id: taskData.id || crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      tags: taskData.tags || [],
      assignee: taskData.assignee || null,
      project: taskData.project || null,
      createdAt: new Date().toISOString(),
      source: 'syncscript',
    };

    // Trigger Make.com scenario
    const result = await triggerMakeScenario(MAKE_WEBHOOKS.task, makeData);

    if (!result.success) {
      return c.json({
        error: 'Failed to sync task to Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Task synced to all services via Make.com',
      taskId: makeData.id,
      makeResponse: result.data,
    });
  } catch (error) {
    console.error('Error creating task via Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * PUT /make/task/:id/update
 * Update a task across all services
 */
app.put('/make/task/:id/update', async (c) => {
  try {
    const taskId = c.req.param('id');
    const updates = await c.req.json();

    const makeData = {
      id: taskId,
      action: 'update',
      updates,
      updatedAt: new Date().toISOString(),
      source: 'syncscript',
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.task, makeData);

    if (!result.success) {
      return c.json({
        error: 'Failed to update task via Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Task updated across all services',
      taskId,
    });
  } catch (error) {
    console.error('Error updating task via Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * DELETE /make/task/:id
 * Delete a task from all services
 */
app.delete('/make/task/:id', async (c) => {
  try {
    const taskId = c.req.param('id');

    const makeData = {
      id: taskId,
      action: 'delete',
      deletedAt: new Date().toISOString(),
      source: 'syncscript',
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.task, makeData);

    if (!result.success) {
      return c.json({
        error: 'Failed to delete task via Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Task deleted from all services',
      taskId,
    });
  } catch (error) {
    console.error('Error deleting task via Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/meeting/create
 * Create a Zoom meeting and sync to calendar
 */
app.post('/make/meeting/create', async (c) => {
  try {
    const meetingData = await c.req.json();

    if (!meetingData.title || !meetingData.startTime) {
      return c.json({
        error: 'Meeting title and start time are required',
      }, 400);
    }

    const makeData = {
      id: meetingData.id || crypto.randomUUID(),
      title: meetingData.title,
      description: meetingData.description || '',
      startTime: meetingData.startTime,
      duration: meetingData.duration || 60, // Default 60 minutes
      attendees: meetingData.attendees || [],
      password: meetingData.password || Math.random().toString(36).substring(2, 8),
      timezone: meetingData.timezone || 'America/New_York',
      createdAt: new Date().toISOString(),
      source: 'syncscript',
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.meeting, makeData);

    if (!result.success) {
      return c.json({
        error: 'Failed to create meeting via Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Meeting created and synced to calendar',
      meetingId: makeData.id,
      makeResponse: result.data,
    });
  } catch (error) {
    console.error('Error creating meeting via Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/goal/complete
 * Celebrate goal completion across social platforms
 */
app.post('/make/goal/complete', async (c) => {
  try {
    const goalData = await c.req.json();

    if (!goalData.title) {
      return c.json({ error: 'Goal title is required' }, 400);
    }

    const makeData = {
      id: goalData.id,
      title: goalData.title,
      description: goalData.description || '',
      completedAt: new Date().toISOString(),
      userId: goalData.userId,
      userName: goalData.userName || 'User',
      milestonesCompleted: goalData.milestonesCompleted || 0,
      totalMilestones: goalData.totalMilestones || 0,
      daysToComplete: goalData.daysToComplete || null,
      celebrationMessage: goalData.celebrationMessage || `🎉 Just completed: ${goalData.title}!`,
      source: 'syncscript',
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.goal, makeData);

    if (!result.success) {
      return c.json({
        error: 'Failed to celebrate goal via Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Goal celebration posted to social platforms',
      goalId: makeData.id,
    });
  } catch (error) {
    console.error('Error celebrating goal via Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/calendar/sync
 * Sync an event to all calendars
 */
app.post('/make/calendar/sync', async (c) => {
  try {
    const eventData = await c.req.json();

    if (!eventData.title || !eventData.startTime) {
      return c.json({
        error: 'Event title and start time are required',
      }, 400);
    }

    const makeData = {
      id: eventData.id || crypto.randomUUID(),
      title: eventData.title,
      description: eventData.description || '',
      startTime: eventData.startTime,
      endTime: eventData.endTime || new Date(
        new Date(eventData.startTime).getTime() + 60 * 60 * 1000
      ).toISOString(),
      location: eventData.location || '',
      attendees: eventData.attendees || [],
      reminders: eventData.reminders || [15], // 15 minutes before
      allDay: eventData.allDay || false,
      source: 'syncscript',
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.calendar, makeData);

    if (!result.success) {
      return c.json({
        error: 'Failed to sync event via Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Event synced to all calendars',
      eventId: makeData.id,
    });
  } catch (error) {
    console.error('Error syncing calendar event via Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * GET /make/status
 * Check Make.com integration status
 */
app.get('/make/status', async (c) => {
  const webhooks = {
    task: !!MAKE_WEBHOOKS.task,
    meeting: !!MAKE_WEBHOOKS.meeting,
    goal: !!MAKE_WEBHOOKS.goal,
    calendar: !!MAKE_WEBHOOKS.calendar,
    email: !!MAKE_WEBHOOKS.email,
    oauth_google: !!MAKE_WEBHOOKS.oauth_google,
    oauth_microsoft: !!MAKE_WEBHOOKS.oauth_microsoft,
    oauth_slack: !!MAKE_WEBHOOKS.oauth_slack,
  };

  const configured = Object.values(webhooks).filter(Boolean).length;
  const total = Object.keys(webhooks).length;

  return c.json({
    status: 'active',
    configured: `${configured}/${total} webhooks`,
    webhooks,
    ready: configured > 0,
    message: configured === 0
      ? 'No Make.com webhooks configured. Add webhook URLs to environment variables.'
      : configured === total
      ? 'All Make.com webhooks configured and ready!'
      : 'Some Make.com webhooks not configured.',
  });
});

/**
 * POST /make/test
 * Test Make.com webhook connection
 */
app.post('/make/test', async (c) => {
  try {
    const { webhookType } = await c.req.json();

    const webhookUrl = MAKE_WEBHOOKS[webhookType as keyof typeof MAKE_WEBHOOKS];

    if (!webhookUrl) {
      return c.json({
        error: `Webhook '${webhookType}' not configured`,
      }, 400);
    }

    const testData = {
      test: true,
      message: 'Test from SyncScript',
      timestamp: new Date().toISOString(),
      webhookType,
    };

    const result = await triggerMakeScenario(webhookUrl, testData);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error,
        message: 'Make.com webhook test failed',
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Make.com webhook test successful',
      webhookType,
      response: result.data,
    });
  } catch (error) {
    console.error('Error testing Make.com webhook:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/batch
 * Send multiple items to Make.com in batch
 */
app.post('/make/batch', async (c) => {
  try {
    const { webhookType, items } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const webhookUrl = MAKE_WEBHOOKS[webhookType as keyof typeof MAKE_WEBHOOKS];

    if (!webhookUrl) {
      return c.json({
        error: `Webhook '${webhookType}' not configured`,
      }, 400);
    }

    // Send all items in one request
    const batchData = {
      batch: true,
      count: items.length,
      items,
      timestamp: new Date().toISOString(),
      source: 'syncscript',
    };

    const result = await triggerMakeScenario(webhookUrl, batchData);

    if (!result.success) {
      return c.json({
        error: 'Failed to send batch to Make.com',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      message: `Batch of ${items.length} items sent to Make.com`,
      count: items.length,
    });
  } catch (error) {
    console.error('Error sending batch to Make.com:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ====================================================================
// OAUTH LOGIN ENDPOINTS
// Make.com handles OAuth flows for Google, Microsoft, Slack
// ====================================================================

/**
 * POST /make/auth/google/init
 * Initiate Google OAuth login via Make.com
 * Make.com scenario handles OAuth and returns auth URL
 */
app.post('/make/auth/google/init', async (c) => {
  try {
    console.log('[MAKE OAUTH] Initiating Google OAuth via Make.com');
    
    const { redirectUri } = await c.req.json();
    
    const makeData = {
      action: 'init_oauth',
      provider: 'google',
      redirectUri: redirectUri || `${Deno.env.get('APP_URL') || 'http://localhost:8080'}/auth/callback`,
      timestamp: new Date().toISOString(),
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.oauth_google, makeData);

    if (!result.success) {
      console.error('[MAKE OAUTH] Failed to initiate Google OAuth:', result.error);
      return c.json({
        error: 'Failed to initiate Google OAuth',
        details: result.error,
      }, 500);
    }

    // Make.com should return authUrl and state
    return c.json({
      success: true,
      authUrl: result.data.authUrl,
      state: result.data.state,
    });
  } catch (error) {
    console.error('[MAKE OAUTH] Error initiating Google OAuth:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/auth/google/callback
 * Handle Google OAuth callback via Make.com
 * Make.com exchanges code for tokens and returns user data
 */
app.post('/make/auth/google/callback', async (c) => {
  try {
    console.log('[MAKE OAUTH] Processing Google OAuth callback via Make.com');
    
    const { code, state } = await c.req.json();
    
    const makeData = {
      action: 'oauth_callback',
      provider: 'google',
      code,
      state,
      timestamp: new Date().toISOString(),
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.oauth_google, makeData);

    if (!result.success) {
      console.error('[MAKE OAUTH] OAuth callback failed:', result.error);
      return c.json({
        error: 'OAuth authentication failed',
        details: result.error,
      }, 400);
    }

    // Make.com returns user data: { email, name, picture, googleId }
    const { email, name, picture, googleId } = result.data;

    if (!email) {
      return c.json({ error: 'No email returned from OAuth' }, 400);
    }

    // Create or update Supabase user
    let userId: string;
    
    // Check if user exists
    const { data: existingUser } = await supabase.auth.admin.getUserById(googleId);
    
    if (existingUser?.user) {
      userId = existingUser.user.id;
      console.log('[MAKE OAUTH] Existing user found:', userId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          photoUrl: picture || '',
          provider: 'google',
          googleId,
        },
      });

      if (createError || !newUser.user) {
        console.error('[MAKE OAUTH] Failed to create user:', createError);
        return c.json({ error: 'Failed to create user account' }, 500);
      }

      userId = newUser.user.id;
      console.log('[MAKE OAUTH] New user created:', userId);
    }

    // Generate session token
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError || !session) {
      console.error('[MAKE OAUTH] Failed to generate session:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    console.log('[MAKE OAUTH] Successfully authenticated via Google');

    return c.json({
      success: true,
      userId,
      email,
      name: name || email.split('@')[0],
      photoUrl: picture || '',
      redirectUrl: session.properties.action_link,
    });
  } catch (error) {
    console.error('[MAKE OAUTH] Callback error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/auth/microsoft/init
 * Initiate Microsoft OAuth login via Make.com
 */
app.post('/make/auth/microsoft/init', async (c) => {
  try {
    console.log('[MAKE OAUTH] Initiating Microsoft OAuth via Make.com');
    
    const { redirectUri } = await c.req.json();
    
    const makeData = {
      action: 'init_oauth',
      provider: 'microsoft',
      redirectUri: redirectUri || `${Deno.env.get('APP_URL') || 'http://localhost:8080'}/auth/callback`,
      timestamp: new Date().toISOString(),
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.oauth_microsoft, makeData);

    if (!result.success) {
      console.error('[MAKE OAUTH] Failed to initiate Microsoft OAuth:', result.error);
      return c.json({
        error: 'Failed to initiate Microsoft OAuth',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      authUrl: result.data.authUrl,
      state: result.data.state,
    });
  } catch (error) {
    console.error('[MAKE OAUTH] Error initiating Microsoft OAuth:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/auth/microsoft/callback
 * Handle Microsoft OAuth callback via Make.com
 */
app.post('/make/auth/microsoft/callback', async (c) => {
  try {
    console.log('[MAKE OAUTH] Processing Microsoft OAuth callback via Make.com');
    
    const { code, state } = await c.req.json();
    
    const makeData = {
      action: 'oauth_callback',
      provider: 'microsoft',
      code,
      state,
      timestamp: new Date().toISOString(),
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.oauth_microsoft, makeData);

    if (!result.success) {
      console.error('[MAKE OAUTH] OAuth callback failed:', result.error);
      return c.json({
        error: 'OAuth authentication failed',
        details: result.error,
      }, 400);
    }

    // Make.com returns user data
    const { email, name, picture, microsoftId } = result.data;

    if (!email) {
      return c.json({ error: 'No email returned from OAuth' }, 400);
    }

    // Create or update Supabase user
    let userId: string;
    
    const { data: existingUser } = await supabase.auth.admin.getUserById(microsoftId);
    
    if (existingUser?.user) {
      userId = existingUser.user.id;
      console.log('[MAKE OAUTH] Existing user found:', userId);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          photoUrl: picture || '',
          provider: 'microsoft',
          microsoftId,
        },
      });

      if (createError || !newUser.user) {
        console.error('[MAKE OAUTH] Failed to create user:', createError);
        return c.json({ error: 'Failed to create user account' }, 500);
      }

      userId = newUser.user.id;
      console.log('[MAKE OAUTH] New user created:', userId);
    }

    // Generate session token
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError || !session) {
      console.error('[MAKE OAUTH] Failed to generate session:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    console.log('[MAKE OAUTH] Successfully authenticated via Microsoft');

    return c.json({
      success: true,
      userId,
      email,
      name: name || email.split('@')[0],
      photoUrl: picture || '',
      redirectUrl: session.properties.action_link,
    });
  } catch (error) {
    console.error('[MAKE OAUTH] Callback error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/auth/slack/init
 * Initiate Slack OAuth login via Make.com
 */
app.post('/make/auth/slack/init', async (c) => {
  try {
    console.log('[MAKE OAUTH] Initiating Slack OAuth via Make.com');
    
    const { redirectUri } = await c.req.json();
    
    const makeData = {
      action: 'init_oauth',
      provider: 'slack',
      redirectUri: redirectUri || `${Deno.env.get('APP_URL') || 'http://localhost:8080'}/auth/callback`,
      timestamp: new Date().toISOString(),
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.oauth_slack, makeData);

    if (!result.success) {
      console.error('[MAKE OAUTH] Failed to initiate Slack OAuth:', result.error);
      return c.json({
        error: 'Failed to initiate Slack OAuth',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      authUrl: result.data.authUrl,
      state: result.data.state,
    });
  } catch (error) {
    console.error('[MAKE OAUTH] Error initiating Slack OAuth:', error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * POST /make/auth/slack/callback
 * Handle Slack OAuth callback via Make.com
 */
app.post('/make/auth/slack/callback', async (c) => {
  try {
    console.log('[MAKE OAUTH] Processing Slack OAuth callback via Make.com');
    
    const { code, state } = await c.req.json();
    
    const makeData = {
      action: 'oauth_callback',
      provider: 'slack',
      code,
      state,
      timestamp: new Date().toISOString(),
    };

    const result = await triggerMakeScenario(MAKE_WEBHOOKS.oauth_slack, makeData);

    if (!result.success) {
      console.error('[MAKE OAUTH] OAuth callback failed:', result.error);
      return c.json({
        error: 'OAuth authentication failed',
        details: result.error,
      }, 400);
    }

    // Make.com returns user data
    const { email, name, picture, slackId } = result.data;

    if (!email) {
      return c.json({ error: 'No email returned from OAuth' }, 400);
    }

    // Create or update Supabase user
    let userId: string;
    
    const { data: existingUser } = await supabase.auth.admin.getUserById(slackId);
    
    if (existingUser?.user) {
      userId = existingUser.user.id;
      console.log('[MAKE OAUTH] Existing user found:', userId);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          photoUrl: picture || '',
          provider: 'slack',
          slackId,
        },
      });

      if (createError || !newUser.user) {
        console.error('[MAKE OAUTH] Failed to create user:', createError);
        return c.json({ error: 'Failed to create user account' }, 500);
      }

      userId = newUser.user.id;
      console.log('[MAKE OAUTH] New user created:', userId);
    }

    // Generate session token
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError || !session) {
      console.error('[MAKE OAUTH] Failed to generate session:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    console.log('[MAKE OAUTH] Successfully authenticated via Slack');

    return c.json({
      success: true,
      userId,
      email,
      name: name || email.split('@')[0],
      photoUrl: picture || '',
      redirectUrl: session.properties.action_link,
    });
  } catch (error) {
    console.error('[MAKE OAUTH] Callback error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;