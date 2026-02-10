import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'syncscript-ai-bridge',
    timestamp: new Date().toISOString(),
    features: ['chat', 'suggestions', 'insights'],
    config: {
      deepseekConfigured: !!process.env.DEEPSEEK_API_KEY,
    },
  });
}
