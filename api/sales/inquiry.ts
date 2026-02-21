import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAI, isAIConfigured } from '../_lib/ai-service';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const ENTERPRISE_SYSTEM_PROMPT = `You are Nexus, SyncScript's senior enterprise solutions advisor. You respond to enterprise sales inquiries with deep product knowledge, genuine helpfulness, and executive-level professionalism.

## YOUR KNOWLEDGE BASE — SyncScript Enterprise

**Product:** SyncScript is an AI-powered productivity platform that optimizes work around users' natural energy rhythms. It combines task management, calendar intelligence, AI coaching, and team collaboration.

**Enterprise Plan ($99/mo per seat, $79/mo annual):**
- Unlimited tasks, team members, and integrations (50+)
- SSO/SAML authentication, advanced security, SOC 2 & HIPAA compliance
- Dedicated account manager and priority support (< 1 hour response)
- Custom integrations and API access
- AI-powered Voice Assistant (Nexus) with priority phone capabilities
- Advanced analytics, custom workflows, and resonance engine
- SLA guarantee (99.9% uptime)
- Onboarding assistance and training for teams
- Custom resonance tuning and energy optimization at team level
- Volume discounts available: 50+ seats (15% off), 200+ seats (25% off), 500+ (custom pricing)

**Professional Plan ($49/mo, $39/mo annual):**
- Up to 10 team members, unlimited tasks
- Advanced calendar integration, priority support
- AI insights, custom workflows, API access
- Mobile Voice Chat AI, all integrations

**Security & Compliance:**
- SOC 2 Type II certified, HIPAA compliant
- Data encrypted at rest (AES-256) and in transit (TLS 1.3)
- SSO via SAML 2.0 / OIDC, SCIM provisioning
- Role-based access control (RBAC)
- Audit logging, data residency options (US, EU, APAC)
- 99.9% SLA, dedicated infrastructure for 500+ seat deployments
- Regular third-party penetration testing
- GDPR compliant with DPA available

**Integrations:** Google Workspace, Microsoft 365, Slack, Teams, Jira, Asana, Notion, Salesforce, HubSpot, Zoom, and 40+ more. Custom integrations via REST API and webhooks.

**Deployment Options:**
- Cloud (multi-tenant, default)
- Dedicated cloud (single-tenant, 200+ seats)
- On-premise deployment (500+ seats, custom pricing)

**Onboarding:** White-glove onboarding with dedicated CSM, custom training programs, phased rollout support, and migration assistance from existing tools.

**ROI Data:**
- Average 2.3 hours saved per employee per week
- 34% improvement in meeting-to-focus-time ratio
- 89% user adoption rate within 30 days
- 67% reduction in scheduling conflicts

## RESPONSE GUIDELINES
1. Address their specific questions directly and thoroughly — do NOT give generic responses
2. If they mention their company size, tailor your response (startup vs mid-market vs enterprise)
3. Include specific numbers, features, and pricing when relevant
4. Offer a clear next step (demo, pilot program, custom proposal)
5. Keep tone warm but professional — you're a trusted advisor, not a salesperson
6. If they ask something you don't know, say so honestly and offer to connect them with someone who does
7. Format with clear sections using **bold** headers and bullet points
8. Keep response under 500 words — concise and high-value
9. End with a specific call-to-action appropriate to their question`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, company, companySize, role, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const userContext = [
    name && `Name: ${name}`,
    company && `Company: ${company}`,
    companySize && `Company Size: ${companySize}`,
    role && `Role: ${role}`,
  ].filter(Boolean).join('\n');

  const userPrompt = `${userContext ? `## PROSPECT INFO\n${userContext}\n\n` : ''}## THEIR INQUIRY\n${message}`;

  let aiResponse = '';
  let aiProvider = 'fallback';

  if (isAIConfigured()) {
    try {
      const result = await callAI(
        [
          { role: 'system', content: ENTERPRISE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        { maxTokens: 1024, temperature: 0.6 },
      );
      aiResponse = result.content;
      aiProvider = result.provider;
    } catch (err: any) {
      console.error('[Sales Inquiry] AI generation failed:', err.message);
    }
  }

  if (!aiResponse) {
    aiResponse = buildFallbackResponse(name, companySize);
  }

  let emailSent = false;
  if (RESEND_API_KEY) {
    try {
      const htmlBody = aiResponse
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/• /g, '&bull; ')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#06b6d4;">$1</a>');

      const emailResult = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Nexus from SyncScript <sales@syncscript.app>',
          to: [email],
          subject: `Re: Your SyncScript Enterprise Inquiry${company ? ` — ${company}` : ''}`,
          reply_to: 'sales@syncscript.app',
          html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:32px;background:#0a0e1a;color:#e2e8f0;border-radius:16px;">
  <div style="border-bottom:1px solid rgba(6,182,212,0.2);padding-bottom:16px;margin-bottom:24px;">
    <h2 style="margin:0;font-size:20px;color:#06b6d4;">SyncScript Enterprise</h2>
    <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Personalized response to your inquiry</p>
  </div>
  <div style="font-size:15px;line-height:1.8;color:#cbd5e1;">${htmlBody}</div>
  <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:32px;padding-top:20px;">
    <p style="margin:0;font-size:13px;color:#64748b;">
      This is a personalized response from SyncScript's AI advisor. A member of our enterprise team will also follow up personally within 24 hours.
    </p>
    <p style="margin:12px 0 0;font-size:13px;">
      <a href="https://syncscript.app/pricing" style="color:#06b6d4;text-decoration:none;">View Plans</a>
      &nbsp;&middot;&nbsp;
      <a href="https://syncscript.app/features" style="color:#06b6d4;text-decoration:none;">Features</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:sales@syncscript.app" style="color:#06b6d4;text-decoration:none;">Reply to Sales</a>
    </p>
  </div>
</div>`,
        }),
      });

      emailSent = emailResult.ok;
      if (!emailSent) {
        const errText = await emailResult.text();
        console.error('[Sales Inquiry] Resend error:', errText);
      }

      // Also notify the internal sales team
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SyncScript Sales Bot <noreply@syncscript.app>',
          to: ['sales@syncscript.app'],
          subject: `[Enterprise Lead] ${company || 'Unknown'} — ${companySize || 'Unknown size'}`,
          reply_to: email,
          html: `
<div style="font-family:monospace;padding:20px;background:#111;color:#eee;border-radius:8px;">
  <h3 style="color:#06b6d4;margin:0 0 16px;">New Enterprise Inquiry</h3>
  <p><strong>Name:</strong> ${name || 'N/A'}</p>
  <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#06b6d4;">${email}</a></p>
  <p><strong>Company:</strong> ${company || 'N/A'}</p>
  <p><strong>Size:</strong> ${companySize || 'N/A'}</p>
  <p><strong>Role:</strong> ${role || 'N/A'}</p>
  <hr style="border-color:#333;margin:16px 0;">
  <p><strong>Message:</strong></p>
  <p style="white-space:pre-wrap;">${message}</p>
  <hr style="border-color:#333;margin:16px 0;">
  <p style="color:#94a3b8;"><strong>AI Response sent (${aiProvider}):</strong></p>
  <p style="white-space:pre-wrap;color:#94a3b8;">${aiResponse}</p>
</div>`,
        }),
      });
    } catch (err: any) {
      console.error('[Sales Inquiry] Email send failed:', err.message);
    }
  }

  return res.status(200).json({
    success: true,
    response: aiResponse,
    emailSent,
  });
}

function buildFallbackResponse(name?: string, companySize?: string): string {
  return `Hi${name ? ` ${name}` : ''}!

Thank you for your interest in SyncScript Enterprise. I'd love to help you find the right solution for your team.

**SyncScript Enterprise includes:**
• Unlimited team members and tasks
• SSO/SAML, SOC 2 & HIPAA compliance
• Dedicated account manager and < 1 hour priority support
• Custom integrations via REST API
• AI Voice Assistant with priority phone capabilities
• 99.9% SLA with dedicated infrastructure options

**Pricing:** $99/seat/month (or $79/seat/month billed annually). Volume discounts available for 50+ seats.

${companySize ? `For a team of ${companySize}, I'd recommend scheduling a quick 15-minute discovery call so we can tailor a proposal to your specific needs.` : 'I\'d love to schedule a quick 15-minute discovery call to understand your team\'s specific needs and put together a tailored proposal.'}

**Book a demo:** Reply to this email or reach us at sales@syncscript.app and we'll have a personalized demo ready within 24 hours.

Looking forward to helping your team work smarter!

Best,
The SyncScript Enterprise Team`;
}
