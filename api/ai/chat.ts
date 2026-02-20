import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth } from '../lib/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are SyncScript AI Assistant — an intelligent productivity companion built into the SyncScript app. SyncScript is an AI-powered productivity system that works with the user's natural energy rhythms.

You help users:
- Manage tasks, goals, and calendar events
- Provide productivity insights and suggestions
- Analyze work patterns and energy levels
- Create, organize, and prioritize tasks
- Generate actionable recommendations

Be concise, helpful, and action-oriented. Use markdown formatting for clarity. When the user asks to create a task, extract the title, priority, and due date. When asked for suggestions, provide 3-5 specific, actionable items. Always be encouraging and data-driven.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ success: false, error: 'DEEPSEEK_API_KEY not configured' });
  }

  try {
    const { message, messages, context } = req.body || {};

    const chatMessages: any[] = [
      { role: 'system', content: context ? `${SYSTEM_PROMPT}\n\nCurrent context:\n${context}` : SYSTEM_PROMPT },
    ];

    if (messages && Array.isArray(messages)) {
      // Filter out system messages from client (we provide our own)
      chatMessages.push(...messages.filter((m: any) => m.role !== 'system'));
    } else if (message) {
      chatMessages.push({ role: 'user', content: message });
    } else {
      return res.status(400).json({ success: false, error: 'No message provided' });
    }

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: chatMessages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(502).json({
        success: false,
        error: `AI service error: ${response.status}`,
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    return res.status(200).json({
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices: data.choices,
      usage: data.usage,
    });
  } catch (error: any) {
    console.error('Chat handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
