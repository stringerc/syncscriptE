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
    const { tasks, goals, timeRange } = req.body || {};
    const range = timeRange || 'week';

    const prompt = `Analyze the following productivity data and provide insights.

Time range: ${range}
Tasks (${(tasks || []).length}): ${JSON.stringify((tasks || []).slice(0, 20))}
Goals (${(goals || []).length}): ${JSON.stringify((goals || []).slice(0, 10))}

Provide a JSON object with:
- completion_rate: number (percentage)
- insights: string[] (3-5 key observations)
- recommendations: string[] (3 actionable suggestions)
- encouragement: string (motivational message)
- risk_areas: string[] (things to watch out for)`;

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a productivity analytics AI. Return only valid JSON when asked for insights.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: 'Failed to generate insights' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      insights = { raw: content };
    }

    return res.status(200).json({
      success: true,
      data: { insights, model: data.model },
    });
  } catch (error: any) {
    console.error('Insights handler error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
