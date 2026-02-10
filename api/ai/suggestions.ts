import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ success: false, error: 'DEEPSEEK_API_KEY not configured' });
  }

  try {
    const { context, tasks, goals, count } = req.body || {};
    const numSuggestions = count || 3;

    const prompt = `Based on the following user context, suggest ${numSuggestions} actionable tasks they should focus on. Return ONLY a valid JSON array of objects, each with: title, description, priority (low/medium/high), category, and reasoning fields.

Context: ${context || 'General productivity improvement'}
${tasks ? `Current tasks (${tasks.length}): ${JSON.stringify(tasks.slice(0, 10))}` : ''}
${goals ? `Goals (${goals.length}): ${JSON.stringify(goals.slice(0, 5))}` : ''}`;

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a productivity AI. Return only valid JSON arrays when asked for suggestions.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: 'Failed to generate suggestions' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      suggestions = [];
    }

    return res.status(200).json({
      success: true,
      data: { suggestions, model: data.model },
    });
  } catch (error: any) {
    console.error('Suggestions handler error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
