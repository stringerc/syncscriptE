import express from 'express';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Priority, TaskStatus } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Validation schemas
const conversationSchema = z.object({
  content: z.string().min(1, 'Conversation content is required'),
  source: z.string().default('syncscript')
});

const taskGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  context: z.object({
    currentTasks: z.array(z.string()).optional(),
    upcomingEvents: z.array(z.string()).optional(),
    energyLevel: z.number().min(1).max(10).optional(),
    budgetStatus: z.string().optional()
  }).optional()
});

// Extract tasks and events from conversation
router.post('/extract-conversation', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { content, source } = conversationSchema.parse(req.body);

  if (!openai) {
    throw createError('OpenAI API key not configured', 503);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are SyncScript's conversation extraction agent. Your job is to analyze conversations and extract actionable tasks, events, and commitments.

Extract information in this JSON format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Optional description",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "dueDate": "YYYY-MM-DD" (if mentioned),
      "estimatedDuration": minutes (if mentioned),
      "energyRequired": 1-10 (if mentioned),
      "budgetImpact": dollars (if mentioned)
    }
  ],
  "events": [
    {
      "title": "Event title",
      "description": "Optional description",
      "startTime": "YYYY-MM-DDTHH:mm:ss",
      "endTime": "YYYY-MM-DDTHH:mm:ss",
      "location": "Location if mentioned",
      "budgetImpact": dollars (if mentioned)
    }
  ],
  "commitments": ["List of general commitments mentioned"]
}

Only extract clear, actionable items. Be conservative - better to miss something than create false tasks.`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw createError('Failed to extract conversation data', 500);
    }

    const extractedData = JSON.parse(response);

    // Store conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: req.user!.id,
        content,
        source,
        extractedTasks: null
      }
    });

    // Create tasks if any were extracted
    const createdTasks = [];
    if (extractedData.tasks && extractedData.tasks.length > 0) {
      for (const taskData of extractedData.tasks) {
        const task = await prisma.task.create({
          data: {
            userId: req.user!.id,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority || Priority.MEDIUM,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            estimatedDuration: taskData.estimatedDuration,
            energyRequired: taskData.energyRequired,
            budgetImpact: taskData.budgetImpact,
            aiGenerated: true,
            extractedFrom: conversation.id,
            tags: null
          }
        });
        createdTasks.push(task);
      }

      // Update conversation with extracted task IDs
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          extractedTasks: createdTasks.map(t => t.id).join(',')
        }
      });
    }

    // Create events if any were extracted
    const createdEvents = [];
    if (extractedData.events && extractedData.events.length > 0) {
      for (const eventData of extractedData.events) {
        const event = await prisma.event.create({
          data: {
            userId: req.user!.id,
            title: eventData.title,
            description: eventData.description,
            startTime: new Date(eventData.startTime),
            endTime: new Date(eventData.endTime),
            location: eventData.location,
            budgetImpact: eventData.budgetImpact,
            aiGenerated: true
          }
        });
        createdEvents.push(event);
      }
    }

    logger.info('Conversation extracted successfully', {
      userId: req.user!.id,
      conversationId: conversation.id,
      tasksExtracted: createdTasks.length,
      eventsExtracted: createdEvents.length
    });

    res.json({
      success: true,
      data: {
        conversation,
        extractedTasks: createdTasks,
        extractedEvents: createdEvents,
        commitments: extractedData.commitments || []
      },
      message: `Extracted ${createdTasks.length} tasks and ${createdEvents.length} events`
    });

  } catch (error) {
    logger.error('Conversation extraction failed', { error, userId: req.user!.id });
    throw createError('Failed to extract conversation data', 500);
  }
}));

// Generate tasks using AI
router.post('/generate-tasks', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { prompt, context } = taskGenerationSchema.parse(req.body);

  if (!openai) {
    throw createError('OpenAI API key not configured', 503);
  }

  try {
    const systemPrompt = `You are SyncScript's task generation agent. Generate actionable tasks based on user prompts.

Context:
- Current energy level: ${context?.energyLevel || 'not specified'}
- Budget status: ${context?.budgetStatus || 'not specified'}
- Current tasks: ${context?.currentTasks?.length || 0} tasks
- Upcoming events: ${context?.upcomingEvents?.length || 0} events

Generate tasks in this JSON format:
{
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "estimatedDuration": minutes,
      "energyRequired": 1-10,
      "budgetImpact": dollars (if applicable),
      "tags": ["tag1", "tag2"]
    }
  ]
}

Consider the user's energy level and budget when generating tasks. Make tasks specific and actionable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw createError('Failed to generate tasks', 500);
    }

    const generatedData = JSON.parse(response);

    // Create tasks
    const createdTasks = [];
    if (generatedData.tasks && generatedData.tasks.length > 0) {
      for (const taskData of generatedData.tasks) {
        const task = await prisma.task.create({
          data: {
            userId: req.user!.id,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority || Priority.MEDIUM,
            estimatedDuration: taskData.estimatedDuration,
            energyRequired: taskData.energyRequired,
            budgetImpact: taskData.budgetImpact,
            aiGenerated: true,
            tags: taskData.tags || []
          }
        });
        createdTasks.push(task);
      }
    }

    logger.info('Tasks generated successfully', {
      userId: req.user!.id,
      tasksGenerated: createdTasks.length
    });

    res.json({
      success: true,
      data: createdTasks,
      message: `Generated ${createdTasks.length} tasks`
    });

  } catch (error) {
    logger.error('Task generation failed', { error, userId: req.user!.id });
    throw createError('Failed to generate tasks', 500);
  }
}));

// AI-powered task prioritization
router.post('/prioritize-tasks', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw createError('Task IDs array is required', 400);
  }

  if (!openai) {
    throw createError('OpenAI API key not configured', 503);
  }

  try {
    // Get tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId: req.user!.id
      }
    });

    if (tasks.length === 0) {
      throw createError('No tasks found', 404);
    }

    // Get user context
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        settings: true,
        _count: {
          select: {
            tasks: { where: { status: TaskStatus.PENDING } },
            events: { where: { startTime: { gte: new Date() } } }
          }
        }
      }
    });

    const systemPrompt = `You are SyncScript's prioritization agent. Use the Eisenhower Matrix to prioritize tasks.

User Context:
- Energy level: ${user?.energyLevel || 'not set'}
- Pending tasks: ${user?._count.tasks || 0}
- Upcoming events: ${user?._count.events || 0}

Tasks to prioritize:
${tasks.map(t => `- ID: ${t.id} | ${t.title} (${t.priority}, ${t.estimatedDuration || 'unknown'} min, energy: ${t.energyRequired || 'unknown'})`).join('\n')}

Return prioritized tasks in this JSON format:
{
  "prioritizedTasks": [
    {
      "taskId": "EXACT_TASK_ID_FROM_ABOVE",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "reasoning": "Why this priority was assigned",
      "suggestedOrder": 1
    }
  ]
}

IMPORTANT: Use the exact task IDs provided above. Do not create new IDs.

Consider urgency, importance, energy requirements, and user context.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please prioritize these tasks using the Eisenhower Matrix." }
      ],
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw createError('Failed to prioritize tasks', 500);
    }

    const prioritizedData = JSON.parse(response);

    // Update task priorities
    const updatedTasks = [];
    for (const item of prioritizedData.prioritizedTasks) {
      try {
        const task = await prisma.task.update({
          where: { id: item.taskId },
          data: { priority: item.priority },
          include: { subtasks: true }
        });
        updatedTasks.push({
          ...task,
          reasoning: item.reasoning,
          suggestedOrder: item.suggestedOrder
        });
      } catch (updateError: any) {
        logger.error('Failed to update task priority', { 
          taskId: item.taskId, 
          error: updateError.message,
          userId: req.user!.id 
        });
        // Continue with other tasks instead of failing completely
      }
    }

    if (updatedTasks.length === 0) {
      throw createError('No tasks could be updated. Please check if the task IDs are valid.', 400);
    }

    logger.info('Tasks prioritized successfully', {
      userId: req.user!.id,
      tasksPrioritized: updatedTasks.length,
      totalRequested: prioritizedData.prioritizedTasks.length
    });

    res.json({
      success: true,
      data: {
        updatedTasks,
        totalRequested: prioritizedData.prioritizedTasks.length,
        successfullyUpdated: updatedTasks.length
      },
      message: `Prioritized ${updatedTasks.length} out of ${prioritizedData.prioritizedTasks.length} tasks`
    });

  } catch (error) {
    logger.error('Task prioritization failed', { error, userId: req.user!.id });
    throw createError('Failed to prioritize tasks', 500);
  }
}));

// AI chat endpoint
router.post('/chat', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { message, context } = req.body;

  if (!message) {
    throw createError('Message is required', 400);
  }

  if (!openai) {
    throw createError('OpenAI API key not configured', 503);
  }

  try {
    // Get user context
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        tasks: {
          where: { status: TaskStatus.PENDING },
          take: 5,
          orderBy: { priority: 'desc' }
        },
        events: {
          where: { startTime: { gte: new Date() } },
          take: 5,
          orderBy: { startTime: 'asc' }
        }
      }
    });

    const systemPrompt = `You are SyncScript, an AI-powered life management assistant. You help users manage their time, tasks, finances, and energy.

User Context:
- Name: ${user?.name || 'User'}
- Energy Level: ${user?.energyLevel || 'not set'} (1-10 scale)
- Current Location: ${user?.currentLocation || 'not set'}
- Home Location: ${user?.homeLocation || 'not set'}
- Work Location: ${user?.workLocation || 'not set'}
- Pending Tasks: ${user?.tasks.map(t => t.title).join(', ') || 'none'}
- Upcoming Events: ${user?.events.map(e => e.title).join(', ') || 'none'}

Be helpful, proactive, and encouraging. You can:
- Help prioritize tasks
- Suggest energy-appropriate activities
- Provide budgeting advice
- Schedule optimization
- Motivation and accountability
- Location-aware planning and suggestions
- Weather-based activity recommendations
- Travel time optimization between locations
- CREATE CALENDAR EVENTS when users ask to schedule something

IMPORTANT: When a user asks you to schedule, add, or create an event/meeting/appointment, you MUST respond with TWO parts:

1. A clean, user-friendly message (what the user sees)
2. Hidden action data (for the system to process)

Format your response like this:
[USER_MESSAGE]Your clean, friendly response here[/USER_MESSAGE]
[ACTION_DATA]ACTION:CREATE_EVENT|TITLE:Event Title|DESCRIPTION:Event description|START_TIME:YYYY-MM-DDTHH:MM:SS|END_TIME:YYYY-MM-DDTHH:MM:SS|LOCATION:Location Name[/ACTION_DATA]

CRITICAL: For LOCATION, use only the location name without any extra characters, numbers, or formatting. Examples:
- "Hudson Grill" not "Hudson Grill0" or "Hudson Grill Restaurant"
- "Office" not "Office Building" or "Office1"
- "Conference Room" not "Conference Room A" or "Room 1"

CRITICAL: Use proper ISO 8601 date format. For times, use the user's local timezone (don't add 'Z'). For dates, use the current date context:
- Today is ${new Date().toISOString().split('T')[0]}
- Tomorrow is ${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
- Next Monday is ${new Date(Date.now() + (8 - new Date().getDay()) * 24*60*60*1000).toISOString().split('T')[0]}

IMPORTANT: When user says "2pm", generate "14:00:00" (without Z). When user says "10am", generate "10:00:00" (without Z).

Examples:
- "Schedule an interview tomorrow at 2pm" → 
[USER_MESSAGE]Perfect! I've scheduled your interview for tomorrow at 2:00 PM. The event has been added to your calendar.[/USER_MESSAGE]
[ACTION_DATA]ACTION:CREATE_EVENT|TITLE:Interview|DESCRIPTION:Job interview|START_TIME:${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}T14:00:00|END_TIME:${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}T15:00:00|LOCATION:Office[/ACTION_DATA]

- "Add a team meeting next Monday at 10am" → 
[USER_MESSAGE]Great! I've added a team meeting to your calendar for next Monday at 10:00 AM.[/USER_MESSAGE]
[ACTION_DATA]ACTION:CREATE_EVENT|TITLE:Team Meeting|DESCRIPTION:Team meeting|START_TIME:${new Date(Date.now() + (8 - new Date().getDay()) * 24*60*60*1000).toISOString().split('T')[0]}T10:00:00|END_TIME:${new Date(Date.now() + (8 - new Date().getDay()) * 24*60*60*1000).toISOString().split('T')[0]}T11:00:00|LOCATION:Conference Room[/ACTION_DATA]

DO NOT add 'Z' to times - use local timezone!

Keep responses concise but helpful.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content;

    logger.info('AI chat response generated', {
      userId: req.user!.id,
      messageLength: message.length
    });

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI chat failed', { error, userId: req.user!.id });
    throw createError('Failed to generate AI response', 500);
  }
}));

// AI-powered event creation
router.post('/create-event', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { title, description, startTime, endTime, location, budgetImpact } = req.body;

  if (!title || !startTime || !endTime) {
    throw createError('Title, start time, and end time are required', 400);
  }

  try {
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        budgetImpact: budgetImpact || 0,
        aiGenerated: true,
        userId: req.user!.id
      }
    });

    logger.info('AI-generated event created', { 
      userId: req.user!.id, 
      eventId: event.id 
    });

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    logger.error('AI event creation error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw createError('Failed to create event', 500);
  }
}));

// Generate preparation tasks for an event
router.post('/events/:eventId/prepare', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { eventId } = req.params;
  const userId = req.user!.id;

  if (!openai) {
    throw createError('AI service not available', 500);
  }

  try {
    // Get the event details
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: userId
      }
    });

    if (!event) {
      throw createError('Event not found', 404);
    }

    // Create AI prompt for event preparation
    const systemPrompt = `You are an AI assistant that helps users prepare for events by generating relevant preparation tasks. 
    Based on the event details provided, generate 3-5 specific, actionable preparation tasks that would help the user be ready for this event.
    
    Consider factors like:
    - Event type and nature
    - Duration and timing
    - Location and travel requirements
    - Materials or items needed
    - Preparation time required
    - Budget considerations
    
    Return your response as a JSON array of tasks, where each task has:
    - title: A clear, actionable task title
    - description: Detailed description of what needs to be done
    - priority: HIGH, MEDIUM, or LOW based on importance and urgency
    - estimatedDuration: Estimated time in minutes (e.g., 30, 60, 120)
    - category: Relevant category like "logistics", "materials", "research", "communication", etc.
    
    Example format:
    [
      {
        "title": "Book transportation to venue",
        "description": "Research and book appropriate transportation method to get to the event location on time",
        "priority": "HIGH",
        "estimatedDuration": 15,
        "category": "logistics"
      }
    ]`;

    const userPrompt = `Generate preparation tasks for this event:
    
    Event Title: ${event.title}
    Description: ${event.description || 'No description provided'}
    Start Time: ${event.startTime}
    End Time: ${event.endTime}
    Location: ${event.location || 'No location specified'}
    Budget Impact: ${event.budgetImpact || 'No budget impact specified'}
    Event Type: ${event.type || 'General event'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw createError('No response from AI', 500);
    }

    let preparationTasks;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = response.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      preparationTasks = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error('Failed to parse AI response', { response, error: parseError });
      throw createError('Invalid AI response format', 500);
    }

    // Validate the response format
    if (!Array.isArray(preparationTasks)) {
      throw createError('AI response must be an array of tasks', 500);
    }

    // Create tasks in the database
    const createdTasks = [];
    for (const taskData of preparationTasks) {
      try {
        const task = await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority || Priority.MEDIUM,
            status: TaskStatus.PENDING,
            userId: userId,
            tags: taskData.category || 'preparation',
            estimatedDuration: taskData.estimatedDuration || 30,
            aiGenerated: true,
            // Link to the event
            eventId: eventId
          }
        });
        createdTasks.push(task);
      } catch (taskError) {
        logger.error('Failed to create preparation task', { taskData, error: taskError });
        // Continue with other tasks even if one fails
      }
    }

    logger.info('Event preparation tasks generated', { 
      userId, 
      eventId, 
      tasksCreated: createdTasks.length,
      totalRequested: preparationTasks.length 
    });

    res.json({
      success: true,
      data: {
        tasks: createdTasks,
        totalCreated: createdTasks.length,
        totalRequested: preparationTasks.length
      },
      message: `Generated ${createdTasks.length} preparation tasks for "${event.title}"`
    });

  } catch (error) {
    logger.error('AI event preparation error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw createError('Failed to generate preparation tasks', 500);
  }
}));

// Suggest calendar event for a task
router.post('/tasks/:taskId/suggest-calendar', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const { taskTitle, taskDescription, estimatedDuration, location, notes } = req.body;

  if (!openai) {
    throw createError('AI service not available', 500);
  }

  try {
    // Get user's existing events for the next 7 days
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const existingEvents = await prisma.event.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: now,
          lte: nextWeek
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Get user's timezone and energy patterns
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyEnergy: {
          where: {
            date: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    // Create AI prompt for calendar suggestion
    const systemPrompt = `You are an AI assistant that helps users schedule tasks optimally by suggesting the best time slots for calendar events.

    Based on the task details and user's existing schedule, suggest the optimal time slot for this task.
    
    Consider these factors:
    - Task type and nature (work, personal, errands, etc.)
    - Estimated duration
    - Location requirements
    - User's energy patterns (morning person vs evening person)
    - Existing calendar events and travel time between locations
    - Time of day preferences for different task types
    - Buffer time between events (minimum 15-30 minutes)
    
    Return your response as JSON with this exact format:
    {
      "suggestedTime": "YYYY-MM-DDTHH:MM:SS.000Z",
      "suggestedEndTime": "YYYY-MM-DDTHH:MM:SS.000Z", 
      "reasoning": "Detailed explanation of why this time was chosen",
      "conflicts": ["List any potential conflicts or considerations"]
    }
    
    IMPORTANT: 
    - Use UTC timezone for the suggested times
    - Ensure suggestedEndTime is exactly estimatedDuration minutes after suggestedTime
    - Consider travel time if location differs from existing events
    - Suggest realistic times (avoid late night for work tasks, early morning for social events)
    - Account for weekends vs weekdays
    - Include buffer time between events`;

    const userPrompt = `Suggest optimal calendar timing for this task:
    
    Task: ${taskTitle}
    Description: ${taskDescription || 'No description provided'}
    Estimated Duration: ${estimatedDuration} minutes
    Location: ${location || 'No location specified'}
    Notes: ${notes || 'No additional notes'}
    
    Current time: ${now.toISOString()}
    User timezone: ${user?.timezone || 'UTC'}
    
    Existing events in the next 7 days:
    ${existingEvents.map(event => 
      `- ${event.title}: ${new Date(event.startTime).toLocaleString()} to ${new Date(event.endTime).toLocaleString()} at ${event.location || 'No location'}`
    ).join('\n')}
    
    User's energy patterns (if available):
    ${user?.dailyEnergy.map(energy => 
      `Date ${energy.date.toLocaleDateString()}: Energy level ${energy.level}/10`
    ).join('\n') || 'No energy data available'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw createError('No response from AI', 500);
    }

    let suggestion;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = response.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      suggestion = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error('Failed to parse AI response', { response, error: parseError });
      throw createError('Invalid AI response format', 500);
    }

    // Validate the response format
    if (!suggestion.suggestedTime || !suggestion.suggestedEndTime || !suggestion.reasoning) {
      throw createError('AI response missing required fields', 500);
    }

    logger.info('Calendar suggestion generated', { 
      userId, 
      taskId, 
      suggestedTime: suggestion.suggestedTime,
      reasoning: suggestion.reasoning
    });

    res.json({
      success: true,
      data: {
        suggestion: suggestion
      },
      message: `Generated calendar suggestion for "${taskTitle}"`
    });

  } catch (error) {
    logger.error('AI calendar suggestion error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw createError('Failed to generate calendar suggestion', 500);
  }
}));

// Suggest notes for a task
router.post('/tasks/:taskId/suggest-notes', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const { taskTitle, taskDescription } = req.body;

  if (!openai) {
    throw createError('AI service not available', 500);
  }

  try {
    // Create AI prompt for notes suggestion
    const systemPrompt = `You are an AI assistant that helps users create helpful notes for their tasks.

    Based on the task title and description, generate 3-5 practical, actionable notes that would help the user complete this task effectively.
    
    Consider these factors:
    - Task type and nature (work, personal, errands, etc.)
    - Potential challenges or considerations
    - Preparation steps or materials needed
    - Important reminders or tips
    - Context-specific advice
    
    Return your response as JSON with this exact format:
    {
      "suggestedNotes": [
        "First practical note",
        "Second helpful note", 
        "Third actionable note",
        "Fourth consideration",
        "Fifth tip or reminder"
      ]
    }
    
    IMPORTANT: 
    - Keep notes concise but informative (1-2 sentences each)
    - Make them actionable and practical
    - Focus on things that would genuinely help with task completion
    - Avoid generic advice - be specific to the task`;

    const userPrompt = `Generate helpful notes for this task:
    
    Task Title: ${taskTitle}
    Description: ${taskDescription || 'No description provided'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw createError('No response from AI', 500);
    }

    let suggestion;
    try {
      suggestion = JSON.parse(response);
    } catch (parseError) {
      logger.error('Failed to parse AI response', { response, error: parseError });
      throw createError('Invalid AI response format', 500);
    }

    // Validate the response format
    if (!suggestion.suggestedNotes || !Array.isArray(suggestion.suggestedNotes)) {
      throw createError('AI response missing required fields', 500);
    }

    logger.info('Notes suggestion generated', { 
      userId, 
      taskId, 
      notesCount: suggestion.suggestedNotes.length
    });

    res.json({
      success: true,
      data: {
        suggestedNotes: suggestion.suggestedNotes
      },
      message: `Generated ${suggestion.suggestedNotes.length} note suggestions`
    });

  } catch (error) {
    logger.error('AI notes suggestion error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw createError('Failed to generate notes suggestion', 500);
  }
}));

export default router;
