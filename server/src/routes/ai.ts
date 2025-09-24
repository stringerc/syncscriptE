import express from 'express';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Priority, TaskStatus } from '../../../shared/types';

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
        extractedTasks: []
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
            tags: []
          }
        });
        createdTasks.push(task);
      }

      // Update conversation with extracted task IDs
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          extractedTasks: createdTasks.map(t => t.id)
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
${tasks.map(t => `- ${t.title} (${t.priority}, ${t.estimatedDuration || 'unknown'} min, energy: ${t.energyRequired || 'unknown'})`).join('\n')}

Return prioritized tasks in this JSON format:
{
  "prioritizedTasks": [
    {
      "taskId": "task-id",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "reasoning": "Why this priority was assigned",
      "suggestedOrder": 1
    }
  ]
}

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
    }

    logger.info('Tasks prioritized successfully', {
      userId: req.user!.id,
      tasksPrioritized: updatedTasks.length
    });

    res.json({
      success: true,
      data: updatedTasks,
      message: `Prioritized ${updatedTasks.length} tasks`
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
- Pending Tasks: ${user?.tasks.map(t => t.title).join(', ') || 'none'}
- Upcoming Events: ${user?.events.map(e => e.title).join(', ') || 'none'}

Be helpful, proactive, and encouraging. You can:
- Help prioritize tasks
- Suggest energy-appropriate activities
- Provide budgeting advice
- Schedule optimization
- Motivation and accountability
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

export default router;
