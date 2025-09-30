import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const router = Router()
const prisma = new PrismaClient()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// POST /api/ai-suggestions/task - Suggest a new task based on context
router.post('/task', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId

    // Get user's upcoming events (next 7 days)
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcomingEvents = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: now,
          lte: nextWeek
        }
      },
      orderBy: { startTime: 'asc' },
      take: 10
    })

    // Get user's incomplete tasks
    const incompleteTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { not: 'COMPLETED' }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Build context for AI
    const eventsContext = upcomingEvents.map(e => 
      `- ${e.title} on ${e.startTime.toLocaleDateString()}`
    ).join('\n')

    const tasksContext = incompleteTasks.map(t => 
      `- ${t.title} (${t.priority} priority)`
    ).join('\n')

    const prompt = `You are a productivity assistant. Based on the user's schedule and tasks, suggest ONE new high-value task they should add.

UPCOMING EVENTS (next 7 days):
${eventsContext || 'None'}

CURRENT INCOMPLETE TASKS:
${tasksContext || 'None'}

Analyze for:
1. Preparation gaps (events without prep tasks)
2. Follow-up actions missing
3. Important but not urgent tasks
4. Health/wellbeing tasks if overbooked

Respond with a JSON object ONLY:
{
  "title": "Concise task title (max 60 chars)",
  "description": "Why this task is important (1-2 sentences)",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "estimatedDuration": number in minutes,
  "reasoning": "Brief explanation of why you're suggesting this (1 sentence)"
}

Be specific and actionable. Don't suggest generic tasks.`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful productivity assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    let suggestion
    try {
      suggestion = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      throw new Error('AI returned invalid response')
    }

    // Validate response
    if (!suggestion.title || !suggestion.priority || !suggestion.reasoning) {
      throw new Error('AI response missing required fields')
    }

    res.json({
      success: true,
      data: {
        title: suggestion.title,
        description: suggestion.description || '',
        priority: suggestion.priority,
        estimatedDuration: suggestion.estimatedDuration || 30,
        reasoning: suggestion.reasoning
      }
    })

  } catch (error: any) {
    console.error('Task suggestion error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate task suggestion'
    })
  }
})

// POST /api/ai-suggestions/voice-to-task - Convert voice transcript to task fields
router.post('/voice-to-task', authenticateToken, async (req, res) => {
  try {
    const { transcript } = req.body

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      })
    }

    const prompt = `You are a task parser. Convert this natural speech into structured task data.

USER SAID: "${transcript}"

Extract and infer:
1. Task title (what needs to be done)
2. Task description (any details mentioned)
3. Priority (HIGH/MEDIUM/LOW based on urgency cues like "urgent", "important", "soon", "when I can")
4. Estimated duration in minutes (infer from task complexity)
5. Due date if mentioned (return as ISO date string, null if not mentioned)
6. Location if mentioned
7. Notes for anything that doesn't fit elsewhere

Respond with JSON ONLY:
{
  "title": "Clear, actionable task title",
  "description": "Detailed description if provided, empty string if not",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "estimatedDuration": number,
  "dueDate": "ISO date string or null",
  "location": "Location if mentioned, empty string if not",
  "notes": "Additional context, empty string if none"
}

Be smart about inferring priority and duration. If they say "buy milk", that's probably LOW priority and 15 minutes.
If they say "finish urgent report for client meeting tomorrow", that's HIGH priority and maybe 120 minutes.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a task extraction assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      throw new Error('AI returned invalid response')
    }

    // Validate response
    if (!parsed.title || !parsed.priority) {
      throw new Error('AI response missing required fields')
    }

    res.json({
      success: true,
      data: {
        title: parsed.title,
        description: parsed.description || '',
        priority: parsed.priority,
        estimatedDuration: parsed.estimatedDuration || 30,
        dueDate: parsed.dueDate || null,
        location: parsed.location || '',
        notes: parsed.notes || ''
      }
    })

  } catch (error: any) {
    console.error('Voice-to-task error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert voice to task'
    })
  }
})

// POST /api/ai-suggestions/voice-to-event - Convert voice transcript to event fields
router.post('/voice-to-event', authenticateToken, async (req, res) => {
  try {
    const { transcript } = req.body

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      })
    }

    const prompt = `You are an event parser. Convert this natural speech into structured event data.

USER SAID: "${transcript}"

Extract and infer:
1. Event title (what is the event)
2. Event description (any details mentioned)
3. Start date/time if mentioned (return as ISO string, null if not mentioned)
4. End date/time if mentioned (return as ISO string, null if not mentioned)
5. Location if mentioned
6. Budget impact if mentioned (extract numeric value, 0 if not mentioned)

Respond with JSON ONLY:
{
  "title": "Clear, descriptive event title",
  "description": "Detailed description if provided, empty string if not",
  "startTime": "ISO date-time string or null",
  "endTime": "ISO date-time string or null",
  "location": "Location if mentioned, empty string if not",
  "budgetImpact": number or 0
}

Be smart about inferring times. If they say "dinner party Friday at 7pm", calculate Friday's date and set 7pm as start, maybe 10pm as end.
If they say "team meeting tomorrow at 2", set tomorrow at 2pm start, maybe 3pm end.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an event extraction assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      throw new Error('AI returned invalid response')
    }

    // Validate response
    if (!parsed.title) {
      throw new Error('AI response missing required fields')
    }

    res.json({
      success: true,
      data: {
        title: parsed.title,
        description: parsed.description || '',
        startTime: parsed.startTime || null,
        endTime: parsed.endTime || null,
        location: parsed.location || '',
        budgetImpact: parsed.budgetImpact || 0
      }
    })

  } catch (error: any) {
    console.error('Voice-to-event error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert voice to event'
    })
  }
})

export default router
