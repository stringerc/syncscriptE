/**
 * Discord Bot Integration Routes
 * 
 * Manages the SyncScript Discord community:
 * - Post welcome messages to channels
 * - Automated engagement via cron jobs
 * - Send Discord invite to beta testers
 * - Channel management (clear, post)
 * 
 * Requires DISCORD_BOT_TOKEN environment variable.
 * Uses Discord REST API v10.
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const discordRoutes = new Hono();

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_INVITE = Deno.env.get('DISCORD_INVITE_URL') || 'https://discord.gg/2rq38UJrDJ';

function botHeaders(): Record<string, string> {
  const token = Deno.env.get('DISCORD_BOT_TOKEN');
  if (!token) throw new Error('DISCORD_BOT_TOKEN not set');
  return {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json',
  };
}

async function discordFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: { ...botHeaders(), ...(options.headers || {}) },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Discord API error ${response.status}: ${err}`);
    throw new Error(`Discord API ${response.status}: ${err}`);
  }

  return response.json();
}

// ============================================================================
// GUILD & CHANNEL DISCOVERY
// ============================================================================

/**
 * GET /discord/guild-info
 * List bot's guilds and channels — used to find channel IDs
 */
discordRoutes.get('/guild-info', async (c) => {
  try {
    const guilds = await discordFetch('/users/@me/guilds');

    const result: any[] = [];
    for (const guild of guilds) {
      const channels = await discordFetch(`/guilds/${guild.id}/channels`);
      result.push({
        guild: { id: guild.id, name: guild.name },
        channels: channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          position: ch.position,
        })),
      });
    }

    return c.json({ guilds: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// WELCOME MESSAGE
// ============================================================================

const WELCOME_MESSAGE = {
  content: '',
  embeds: [
    {
      title: '🎉 Welcome to the SyncScript Community!',
      description: 
        'We\'re thrilled to have you here! This is the official home for SyncScript beta testers, ' +
        'early adopters, and productivity enthusiasts.\n\n' +
        '**SyncScript** is an AI-powered productivity platform that helps you work with your natural ' +
        'energy rhythms — not against them.',
      color: 0x06b6d4, // cyan-500
      fields: [
        {
          name: '📋 What This Server Is For',
          value: 
            '• **Share feedback** — Your input directly shapes the product\n' +
            '• **Report bugs** — Help us squash issues fast\n' +
            '• **Feature requests** — Tell us what you want built\n' +
            '• **Productivity tips** — Share and learn from the community\n' +
            '• **Early access** — Be first to test new features',
          inline: false,
        },
        {
          name: '🏷️ Channel Guide',
          value: 
            '**#general** — Introduce yourself & chat\n' +
            '**#feedback** — Product feedback & suggestions\n' +
            '**#bugs** — Bug reports\n' +
            '**#feature-requests** — What should we build next?\n' +
            '**#tips-and-tricks** — Share productivity hacks\n' +
            '**#announcements** — Product updates & news',
          inline: false,
        },
        {
          name: '🎁 Beta Tester Perks',
          value: 
            '• **Free full access** during beta\n' +
            '• **Lifetime 50% off** all paid plans\n' +
            '• **Direct founder access** right here in Discord\n' +
            '• **Exclusive beta tester badge** in the app\n' +
            '• **Priority support** — we respond fast',
          inline: false,
        },
        {
          name: '🚀 Getting Started',
          value: 
            '1. Drop a quick intro in **#general**\n' +
            '2. Check your email for your unique beta code\n' +
            '3. Sign up at [syncscript.app](https://www.syncscript.app)\n' +
            '4. Start tracking your energy & productivity!',
          inline: false,
        },
      ],
      footer: {
        text: 'SyncScript Beta • Built for people who want to get more done',
      },
      timestamp: new Date().toISOString(),
    },
  ],
};

/**
 * POST /discord/welcome
 * Clear channel messages and post the welcome message.
 * Body: { channel_id: string } 
 * If no channel_id, discovers guild and uses the first text channel (general).
 */
discordRoutes.post('/welcome', async (c) => {
  try {
    let { channel_id } = await c.req.json().catch(() => ({}));

    // Auto-discover channel if not provided
    if (!channel_id) {
      const guilds = await discordFetch('/users/@me/guilds');
      if (!guilds.length) return c.json({ error: 'Bot is not in any guild' }, 400);

      const syncScriptGuild = guilds.find((g: any) => g.name.toLowerCase().includes('syncscript')) || guilds[0];
      const channels = await discordFetch(`/guilds/${syncScriptGuild.id}/channels`);
      // Find #general or first text channel (type 0 = text)
      const general = channels.find((ch: any) => ch.type === 0 && ch.name === 'general');
      const firstText = channels.find((ch: any) => ch.type === 0);
      channel_id = (general || firstText)?.id;

      if (!channel_id) return c.json({ error: 'No text channel found' }, 404);
    }

    // Try to clear existing messages (requires Manage Messages permission)
    let messagesCleared = 0;
    try {
      const existingMessages = await discordFetch(`/channels/${channel_id}/messages?limit=100`);

      if (existingMessages.length > 0) {
        const messageIds = existingMessages.map((m: any) => m.id);
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const recentIds = messageIds.filter((id: string) => {
          const timestamp = Number(BigInt(id) >> BigInt(22)) + 1420070400000;
          return timestamp > twoWeeksAgo;
        });

        if (recentIds.length >= 2) {
          await discordFetch(`/channels/${channel_id}/messages/bulk-delete`, {
            method: 'POST',
            body: JSON.stringify({ messages: recentIds }),
          });
          messagesCleared = recentIds.length;
        } else if (recentIds.length === 1) {
          await fetch(`${DISCORD_API}/channels/${channel_id}/messages/${recentIds[0]}`, {
            method: 'DELETE',
            headers: botHeaders(),
          });
          messagesCleared = 1;
        }
      }
    } catch (clearErr: any) {
      console.log(`[Discord] Could not clear messages (permission issue): ${clearErr.message}`);
      // Continue — posting the welcome message is more important
    }

    // Post welcome message
    const posted = await discordFetch(`/channels/${channel_id}/messages`, {
      method: 'POST',
      body: JSON.stringify(WELCOME_MESSAGE),
    });

    // Store the channel ID for future automated posts
    await kv.set('discord_general_channel', channel_id);

    return c.json({
      success: true,
      messagesCleared,
      welcomeMessageId: posted.id,
      channelId: channel_id,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// AUTOMATED ENGAGEMENT MESSAGES (for cron jobs)
// ============================================================================

const ENGAGEMENT_MESSAGES = [
  // Monday - Weekly motivation
  {
    embeds: [{
      title: '🌅 Monday Momentum',
      description: 
        'New week, fresh energy! Here\'s your Monday power-up:\n\n' +
        '**Tip:** Start your week by logging your energy levels in SyncScript. ' +
        'Studies show that scheduling high-focus tasks during your peak energy hours ' +
        'can boost productivity by up to **40%**.\n\n' +
        'What\'s your #1 goal this week? Drop it below!',
      color: 0x06b6d4,
      footer: { text: 'SyncScript Weekly Tips' },
    }],
  },
  // Tuesday - Feature spotlight
  {
    embeds: [{
      title: '✨ Feature Spotlight',
      description: 
        'Did you know SyncScript can **automatically schedule tasks** based on your circadian rhythm?\n\n' +
        'Here\'s how:\n' +
        '1. Log your energy levels for 3+ days\n' +
        '2. Go to Settings > AI Scheduling\n' +
        '3. Enable "Smart Scheduling"\n\n' +
        'The AI learns your energy patterns and places tasks at optimal times. ' +
        'Give it a try and share your results!',
      color: 0x8b5cf6,
      footer: { text: 'SyncScript Feature Tips' },
    }],
  },
  // Wednesday - Community challenge
  {
    embeds: [{
      title: '🏆 Midweek Challenge',
      description: 
        'Let\'s hear it! What\'s one productivity hack that changed your life?\n\n' +
        'Share your best tip and we\'ll feature the top ones in our next product update.\n\n' +
        '💡 **React with 👍 on tips you love!**',
      color: 0x10b981,
      footer: { text: 'SyncScript Community Challenge' },
    }],
  },
  // Thursday - Behind the scenes
  {
    embeds: [{
      title: '🔨 Building in Public',
      description: 
        'Here\'s what the team has been working on this week:\n\n' +
        '• Performance improvements across the dashboard\n' +
        '• New energy tracking visualizations\n' +
        '• Bug fixes from community reports (thank you!)\n' +
        '• Upcoming: Calendar sync improvements\n\n' +
        'Got a feature you\'re waiting for? Let us know in **#feature-requests**!',
      color: 0xf59e0b,
      footer: { text: 'SyncScript Dev Updates' },
    }],
  },
  // Friday - Weekend prep
  {
    embeds: [{
      title: '🎯 Friday Focus',
      description: 
        'Before you wrap up for the week:\n\n' +
        '✅ Review what you accomplished this week\n' +
        '📊 Check your energy trends in the dashboard\n' +
        '📝 Set 1-3 priorities for next Monday\n\n' +
        '**Pro tip:** Your Friday afternoon is perfect for planning, not deep work. ' +
        'Use those last energy reserves for organization!\n\n' +
        'Have a great weekend! 🚀',
      color: 0xec4899,
      footer: { text: 'SyncScript Friday Wrap-up' },
    }],
  },
  // Saturday - Casual/fun
  {
    embeds: [{
      title: '🧠 Science Saturday',
      description: 
        '**Fun fact:** Your brain uses about 20% of your body\'s total energy, ' +
        'even though it\'s only 2% of your body weight.\n\n' +
        'This is why energy management matters more than time management. ' +
        'When your brain is fueled, you can accomplish in 1 hour what might take 3 hours when depleted.\n\n' +
        'That\'s exactly why we built SyncScript! 🧪',
      color: 0x6366f1,
      footer: { text: 'SyncScript Science Corner' },
    }],
  },
  // Sunday - Week preview
  {
    embeds: [{
      title: '📅 Week Preview',
      description: 
        'Tomorrow starts a new week! Here\'s how to set yourself up for success:\n\n' +
        '1. **Open SyncScript** and check your energy patterns from last week\n' +
        '2. **Plan your top 3** most important tasks\n' +
        '3. **Block time** for deep work during your peak hours\n\n' +
        'Remember: You don\'t need to do everything. You need to do the right things ' +
        'at the right time. That\'s the SyncScript way. ⚡',
      color: 0x14b8a6,
      footer: { text: 'SyncScript Weekly Prep' },
    }],
  },
];

/**
 * POST /discord/cron-engagement
 * Called by a cron job to post the day's engagement message.
 * Posts to the stored general channel. Different message for each day of the week.
 */
discordRoutes.post('/cron-engagement', async (c) => {
  try {
    const { force } = await c.req.json().catch(() => ({ force: false }));

    // Get stored channel ID (set during welcome message)
    let channelId = await kv.get('discord_general_channel') as string;

    if (!channelId) {
      // Auto-discover — prefer SyncScript Server over personal server
      const guilds = await discordFetch('/users/@me/guilds');
      if (!guilds.length) return c.json({ error: 'No guilds found' }, 400);

      const syncScriptGuild = guilds.find((g: any) => g.name.toLowerCase().includes('syncscript')) || guilds[0];
      const channels = await discordFetch(`/guilds/${syncScriptGuild.id}/channels`);
      const general = channels.find((ch: any) => ch.type === 0 && ch.name === 'general');
      const firstText = channels.find((ch: any) => ch.type === 0);
      channelId = (general || firstText)?.id;

      if (channelId) await kv.set('discord_general_channel', channelId);
    }

    if (!channelId) return c.json({ error: 'No channel configured' }, 400);

    // Pick message based on day of week (0 = Sunday)
    const dayIndex = new Date().getDay();
    const message = ENGAGEMENT_MESSAGES[dayIndex];

    // Check if we already posted today (avoid duplicates) — skip check if force=true
    const today = new Date().toISOString().slice(0, 10);
    const lastPost = await kv.get('discord_last_cron_post') as string;
    if (lastPost === today && !force) {
      return c.json({ success: true, skipped: true, reason: 'Already posted today' });
    }

    // Post the message
    const posted = await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });

    await kv.set('discord_last_cron_post', today);

    return c.json({
      success: true,
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
      messageId: posted.id,
      channelId,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/post-announcement
 * Post a custom announcement to the guild's announcements channel (or general).
 * Body: { title: string, message: string, channel_name?: string }
 */
discordRoutes.post('/post-announcement', async (c) => {
  try {
    const { title, message, channel_name } = await c.req.json();

    if (!title || !message) {
      return c.json({ error: 'title and message are required' }, 400);
    }

    // Find the target channel
    const guilds = await discordFetch('/users/@me/guilds');
    if (!guilds.length) return c.json({ error: 'No guilds found' }, 400);

    const channels = await discordFetch(`/guilds/${guilds[0].id}/channels`);
    const target = channel_name
      ? channels.find((ch: any) => ch.type === 0 && ch.name === channel_name)
      : channels.find((ch: any) => ch.type === 0 && ch.name === 'announcements')
        || channels.find((ch: any) => ch.type === 0 && ch.name === 'general');

    if (!target) return c.json({ error: 'Target channel not found' }, 404);

    const posted = await discordFetch(`/channels/${target.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [{
          title,
          description: message,
          color: 0x06b6d4,
          footer: { text: 'SyncScript Team' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    return c.json({ success: true, messageId: posted.id, channel: target.name });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// CREATE PERMANENT INVITE LINK
// ============================================================================

/**
 * POST /discord/create-invite
 * Uses the bot to create a permanent (never-expiring) invite on the first
 * text channel of the bot's guild. Returns the invite URL.
 */
discordRoutes.post('/create-invite', async (c) => {
  try {
    const guilds = await discordFetch('/users/@me/guilds');
    if (!guilds.length) return c.json({ error: 'Bot is not in any guild' }, 404);

    const guildId = guilds[0].id;
    const channels = await discordFetch(`/guilds/${guildId}/channels`);
    const textChannel = channels.find((ch: any) => ch.type === 0);
    if (!textChannel) return c.json({ error: 'No text channel found' }, 404);

    const invite = await discordFetch(`/channels/${textChannel.id}/invites`, {
      method: 'POST',
      body: JSON.stringify({ max_age: 0, max_uses: 0, unique: false }),
    });

    const url = `https://discord.gg/${invite.code}`;
    return c.json({ success: true, inviteUrl: url, code: invite.code, channel: textChannel.name });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// SEND DISCORD INVITE TO BETA TESTERS
// ============================================================================

/**
 * POST /discord/send-invite-to-beta
 * Email all beta testers the Discord invite link
 */
discordRoutes.post('/send-invite-to-beta', async (c) => {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return c.json({ error: 'RESEND_API_KEY not set' }, 500);

    const signups = await kv.getByPrefix('beta:signup:');
    const sent: any[] = [];

    for (const item of signups) {
      const data = item as any;
      if (!data?.email || data.email.includes('@example.com')) continue;

      // Check if we already sent Discord invite to this person
      const alreadySent = await kv.get(`discord_invite_sent:${data.email}`);
      if (alreadySent) {
        sent.push({ email: data.email, status: 'already_sent' });
        continue;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SyncScript <noreply@syncscript.app>',
          to: [data.email],
          subject: `🎮 You're Invited — Join the SyncScript Discord Community`,
          reply_to: 'support@syncscript.app',
          html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;width:64px;height:64px;background:#5865F2;border-radius:16px;line-height:64px;font-size:32px;margin-bottom:12px;">🎮</div>
    <h1 style="font-size:24px;color:#fff;margin:0;">You're Invited to Discord!</h1>
    <p style="color:#94a3b8;font-size:14px;margin-top:8px;">Beta Tester #${data.memberNumber}</p>
  </div>
  
  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;line-height:1.6;">
      Hey there! 👋
    </p>
    <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
      As one of our valued beta testers, you're invited to join the <strong style="color:#5865F2;">SyncScript Discord community</strong> — 
      the hub where we share updates, discuss features, and build the future of productivity together.
    </p>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">
      This is where you'll get:
    </p>
  </div>

  <div style="background:linear-gradient(135deg,#5865F220,#7c3aed20);border:1px solid #5865F240;border-radius:12px;padding:20px;margin-bottom:24px;">
    <ul style="color:#cbd5e1;padding-left:20px;margin:0;">
      <li style="margin-bottom:10px;"><strong style="color:#5865F2;">Early feature previews</strong> before anyone else</li>
      <li style="margin-bottom:10px;"><strong style="color:#06b6d4;">Direct access to the founder</strong> for questions & ideas</li>
      <li style="margin-bottom:10px;"><strong style="color:#10b981;">Weekly productivity tips</strong> and science-backed insights</li>
      <li style="margin-bottom:10px;"><strong style="color:#f59e0b;">Community challenges</strong> to boost your workflow</li>
      <li style="margin-bottom:0;"><strong style="color:#ec4899;">Priority bug fixes</strong> reported here get fast-tracked</li>
    </ul>
  </div>
  
  <div style="text-align:center;margin-bottom:24px;">
    <a href="${DISCORD_INVITE}" style="display:inline-block;padding:16px 40px;background:#5865F2;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;letter-spacing:0.5px;">Join the Discord →</a>
    <p style="color:#64748b;font-size:12px;margin-top:12px;">or paste this link: ${DISCORD_INVITE}</p>
  </div>

  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">SyncScript • Your energy-first productivity platform</p>
</div>`,
        }),
      });

      if (response.ok) {
        await kv.set(`discord_invite_sent:${data.email}`, new Date().toISOString());
        sent.push({ email: data.email, memberNumber: data.memberNumber, status: 'sent' });
      } else {
        const err = await response.text();
        console.error(`Failed to send Discord invite to ${data.email}: ${err}`);
        sent.push({ email: data.email, status: 'failed', error: err });
      }
    }

    return c.json({ success: true, results: sent, totalSent: sent.filter(s => s.status === 'sent').length });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/post-changelog
 * Post a changelog/update to the announcements channel.
 * Body: { version: string, changes: string[] }
 */
discordRoutes.post('/post-changelog', async (c) => {
  try {
    const { version, changes } = await c.req.json();

    if (!version || !changes?.length) {
      return c.json({ error: 'version and changes[] are required' }, 400);
    }

    const guilds = await discordFetch('/users/@me/guilds');
    if (!guilds.length) return c.json({ error: 'No guilds found' }, 400);

    const channels = await discordFetch(`/guilds/${guilds[0].id}/channels`);
    const announcements = channels.find((ch: any) => ch.type === 0 && ch.name === 'announcements')
      || channels.find((ch: any) => ch.type === 0 && ch.name === 'general');

    if (!announcements) return c.json({ error: 'No announcements channel' }, 404);

    const changeList = changes.map((ch: string) => `• ${ch}`).join('\n');

    const posted = await discordFetch(`/channels/${announcements.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: '@everyone',
        embeds: [{
          title: `🚀 SyncScript ${version} — What's New`,
          description: `We've been hard at work! Here's what's changed:\n\n${changeList}`,
          color: 0x06b6d4,
          fields: [{
            name: '📝 Your Feedback Matters',
            value: 'Spotted a bug? Have a suggestion? Drop it in **#feedback** or **#bugs**!',
            inline: false,
          }],
          footer: { text: `SyncScript ${version}` },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    return c.json({ success: true, messageId: posted.id, channel: announcements.name });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default discordRoutes;
