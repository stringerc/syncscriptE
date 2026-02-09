/**
 * DISCORD INTEGRATION SETUP GUIDE
 * Step-by-step guide to connect Discord to the feedback intelligence system
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink, Bot, Webhook, Shield, Code } from 'lucide-react';
import { Button } from './ui/button';
import { projectId } from '../utils/supabase/info';
import { copyToClipboard as copyUtil } from '../utils/clipboard';

export function DiscordSetupGuide() {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/discord-webhook`;

  async function copyToClipboard(text: string, id: string) {
    const success = await copyUtil(text);
    
    if (success) {
      setCopied(id);
      setCopyError(null);
      setTimeout(() => setCopied(null), 2000);
    } else {
      // Show error and select text for manual copy
      setCopyError(id);
      setTimeout(() => setCopyError(null), 5000);
      
      // Select the text if possible
      const element = document.querySelector(`[data-copy-id="${id}"]`);
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.select();
      }
    }
  }

  const webhookPayloadExample = `{
  "content": "The energy system is confusing. I don't understand the difference between Points Mode and Aura Mode.",
  "author": {
    "id": "123456789",
    "username": "TestUser",
    "bot": false
  },
  "channel_id": "987654321",
  "channel_name": "#feedback",
  "timestamp": "2024-02-04T12:00:00Z",
  "message_id": "111222333",
  "guild_id": "444555666",
  "attachments": []
}`;

  const discordBotCode = `// Discord.js bot example
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const FEEDBACK_CHANNELS = [
  '#bug-reports',
  '#feature-requests',
  '#feedback',
  '#ux-issues'
];

const WEBHOOK_URL = '${webhookUrl}';

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process feedback channels
  if (!FEEDBACK_CHANNELS.includes(\`#\${message.channel.name}\`)) return;
  
  // Send to feedback intelligence system
  try {
    await axios.post(WEBHOOK_URL, {
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        bot: message.author.bot
      },
      channel_id: message.channelId,
      channel_name: \`#\${message.channel.name}\`,
      timestamp: message.createdAt.toISOString(),
      message_id: message.id,
      guild_id: message.guildId,
      attachments: message.attachments.map(a => ({
        url: a.url,
        name: a.name
      }))
    });
    
    console.log('✅ Feedback sent to intelligence system');
  } catch (error) {
    console.error('❌ Failed to send feedback:', error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Bot className="w-10 h-10 text-purple-400" />
          Discord Integration Setup
        </h1>
        <p className="text-slate-400 mb-8">
          Connect your Discord server to automatically analyze all feedback
        </p>

        {/* CRITICAL WARNING */}
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-2 border-red-500 rounded-xl p-5 mb-6 shadow-lg shadow-red-500/20">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-300 mb-2">CRITICAL: Message Content Intent Required!</h3>
              <p className="text-white mb-3">
                <strong>You MUST enable "Message Content Intent"</strong> in the Bot tab or your bot will NOT be able to read messages.
              </p>
              <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/30">
                <p className="text-red-200 text-sm font-semibold mb-1">📍 Where to find it:</p>
                <p className="text-slate-300 text-sm">
                  Bot tab → Scroll down → <strong>"Privileged Gateway Intents"</strong> → Check ✅ <strong>"Message Content Intent"</strong>
                </p>
              </div>
              <p className="text-orange-200 text-sm mt-2">
                💡 This is the #1 reason Discord bots don't work. Don't skip this step!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference: Key Settings */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-3 text-purple-300">⚡ Quick Reference - Key Discord Settings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
              <p className="text-purple-300 font-semibold mb-2">🔑 Must Enable (Bot Tab)</p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✅ <strong>Message Content Intent</strong></li>
                <li className="text-slate-500 text-xs ml-4">Under "Privileged Gateway Intents"</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/30">
              <p className="text-cyan-300 font-semibold mb-2">📝 Bot Permissions</p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✅ View Channels</li>
                <li>✅ Send Messages</li>
                <li>✅ Read Message History</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/30">
              <p className="text-yellow-300 font-semibold mb-2">🔐 Don't Forget</p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>💾 Copy bot token immediately</li>
                <li>🔄 Use "Reset Token" if lost</li>
                <li className="text-slate-500 text-xs ml-4">You can only see it once!</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/30">
              <p className="text-green-300 font-semibold mb-2">🔗 OAuth2 Scopes</p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✅ bot</li>
                <li className="text-slate-500 text-xs ml-4">URL Generator tab</li>
              </ul>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-4 text-center">
            💡 Follow the steps below for detailed instructions
          </p>
        </div>

        {/* Step 1: Webhook URL */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <h2 className="text-2xl font-bold">Webhook URL</h2>
          </div>
          
          <p className="text-slate-300 mb-4">
            This is your unique webhook endpoint. Send all Discord messages to this URL.
          </p>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                data-copy-id="webhook-url"
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 bg-transparent text-cyan-400 text-sm break-all border-none outline-none cursor-pointer"
              />
              <Button
                onClick={() => copyToClipboard(webhookUrl, 'webhook-url')}
                className="bg-slate-700 hover:bg-slate-600 flex-shrink-0"
              >
                {copied === 'webhook-url' ? (
                  <Check className="w-4 h-4" />
                ) : copyError === 'webhook-url' ? (
                  <span className="text-xs">Select</span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copyError === 'webhook-url' && (
              <p className="text-yellow-400 text-xs mt-2">
                📋 Copy blocked. Text is now selected - press Ctrl+C (or Cmd+C on Mac) to copy
              </p>
            )}
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>💡 Tip:</strong> This webhook accepts POST requests with Discord message data.
              No authentication required - the endpoint is public but rate-limited.
            </p>
          </div>
        </div>

        {/* Step 2: Discord Bot Setup */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <h2 className="text-2xl font-bold">Create Discord Bot</h2>
          </div>

          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">1.</span>
              <div>
                <p className="text-white mb-2">
                  Go to{' '}
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    Discord Developer Portal
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">2.</span>
              <p className="text-slate-300">Click "New Application" and name it "SyncScript Feedback Bot"</p>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">3.</span>
              <div>
                <p className="text-slate-300 mb-2">Go to "Bot" tab (you'll automatically be on the bot creation page)</p>
                <p className="text-slate-400 text-sm">
                  Note: If you already have a bot, you'll see the bot settings immediately
                </p>
              </div>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">4.</span>
              <div>
                <p className="text-slate-300 mb-2">Scroll down to <strong>Privileged Gateway Intents</strong> and enable:</p>
                <ul className="ml-4 space-y-2 text-slate-400 text-sm">
                  <li className="bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                    <span className="text-red-300 font-semibold">✅ Message Content Intent</span> - <strong>REQUIRED!</strong>
                    <br />
                    <span className="text-slate-400 text-xs">Allows your bot to read message content in channels</span>
                  </li>
                  <li className="bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2">
                    <span className="text-blue-300 font-semibold">☐ Server Members Intent</span> - Optional
                    <br />
                    <span className="text-slate-400 text-xs">Only needed if you want to track user info</span>
                  </li>
                  <li className="bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2">
                    <span className="text-blue-300 font-semibold">☐ Presence Intent</span> - Not needed
                    <br />
                    <span className="text-slate-400 text-xs">You don't need this for feedback collection</span>
                  </li>
                </ul>
              </div>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">5.</span>
              <div>
                <p className="text-slate-300 mb-2">Scroll up to find the <strong>Token</strong> section</p>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-2">
                  <p className="text-yellow-300 text-sm font-semibold mb-1">⚠️ Important: Getting Your Token</p>
                  <p className="text-slate-300 text-sm mb-2">
                    If this is a new bot, you'll see a "Copy" button to get your token.
                  </p>
                  <p className="text-slate-300 text-sm">
                    If you created the bot before, click <strong>"Reset Token"</strong> to generate a new one, then copy it immediately.
                  </p>
                  <p className="text-red-300 text-xs mt-2">
                    ⚠️ Save it now! You can only see the token once. If you lose it, you'll need to reset it again.
                  </p>
                </div>
              </div>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">6.</span>
              <div>
                <p className="text-slate-300 mb-2">Scroll down to <strong>Bot Permissions</strong> and select these permissions:</p>
                <div className="mt-2 space-y-2">
                  <div className="bg-slate-700 rounded p-3">
                    <p className="text-cyan-300 font-semibold mb-2">Text Permissions (Required):</p>
                    <ul className="ml-4 space-y-1 text-slate-300 text-sm">
                      <li>✅ View Channels</li>
                      <li>✅ Send Messages</li>
                      <li>✅ Read Message History</li>
                    </ul>
                  </div>
                  <p className="text-slate-400 text-xs">
                    💡 Tip: Look for "Permissions Integer" at the bottom - it will calculate the permission value
                  </p>
                </div>
              </div>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">7.</span>
              <div>
                <p className="text-slate-300 mb-2">Go to <strong>"OAuth2"</strong> tab → <strong>"URL Generator"</strong></p>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-slate-400 text-sm mb-1"><strong>Scopes:</strong></p>
                    <ul className="ml-4 text-slate-300 text-sm">
                      <li>✅ bot</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1"><strong>Bot Permissions (same as step 6):</strong></p>
                    <ul className="ml-4 text-slate-300 text-sm">
                      <li>✅ View Channels</li>
                      <li>✅ Send Messages</li>
                      <li>✅ Read Message History</li>
                    </ul>
                  </div>
                  <p className="text-cyan-300 text-sm mt-2">
                    Copy the generated URL at the bottom of the page
                  </p>
                </div>
              </div>
            </li>
            
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">8.</span>
              <div>
                <p className="text-slate-300 mb-2">Open the URL in your browser to invite the bot to your Discord server</p>
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mt-2">
                  <p className="text-green-300 text-sm">
                    ✅ Choose your server from the dropdown and click "Authorize"
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </div>

        {/* Step 3: Bot Code */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <h2 className="text-2xl font-bold">Install Bot Code</h2>
          </div>

          <p className="text-slate-300 mb-4">
            Copy this code to create a bot that forwards all feedback messages to the webhook:
          </p>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 relative">
            <Button
              onClick={() => copyToClipboard(discordBotCode, 'bot-code')}
              className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 z-10"
            >
              {copied === 'bot-code' ? (
                <Check className="w-4 h-4" />
              ) : copyError === 'bot-code' ? (
                <span className="text-xs">Select</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <pre 
              className="text-green-400 text-xs overflow-x-auto cursor-pointer"
              data-copy-id="bot-code"
              onClick={(e) => {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }}
            >
              <code>{discordBotCode}</code>
            </pre>
            {copyError === 'bot-code' && (
              <p className="text-yellow-400 text-xs mt-2">
                📋 Copy blocked. Click the code to select it, then press Ctrl+C (or Cmd+C on Mac) to copy
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-300 text-sm">
                <strong>📦 Install dependencies:</strong>
              </p>
              <code className="block mt-2 text-purple-200 text-sm">
                npm install discord.js axios dotenv
              </code>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-300 text-sm">
                <strong>🔐 Environment variable:</strong>
              </p>
              <code className="block mt-2 text-green-200 text-sm">
                DISCORD_BOT_TOKEN=your_bot_token_here
              </code>
            </div>
          </div>
        </div>

        {/* Step 4: Webhook Payload Format */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              4
            </div>
            <h2 className="text-2xl font-bold">Webhook Payload Format</h2>
          </div>

          <p className="text-slate-300 mb-4">
            Your webhook should send messages in this JSON format:
          </p>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 relative">
            <Button
              onClick={() => copyToClipboard(webhookPayloadExample, 'payload')}
              className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 z-10"
            >
              {copied === 'payload' ? (
                <Check className="w-4 h-4" />
              ) : copyError === 'payload' ? (
                <span className="text-xs">Select</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <pre 
              className="text-cyan-400 text-xs overflow-x-auto cursor-pointer"
              data-copy-id="payload"
              onClick={(e) => {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }}
            >
              <code>{webhookPayloadExample}</code>
            </pre>
            {copyError === 'payload' && (
              <p className="text-yellow-400 text-xs mt-2">
                📋 Copy blocked. Click the code to select it, then press Ctrl+C (or Cmd+C on Mac) to copy
              </p>
            )}
          </div>
        </div>

        {/* Step 5: Testing */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              5
            </div>
            <h2 className="text-2xl font-bold">Test the Integration</h2>
          </div>

          <ol className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="text-cyan-400">1.</span>
              <span>Start your Discord bot: <code className="text-cyan-400">node bot.js</code></span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">2.</span>
              <span>Post a test message in one of your feedback channels</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">3.</span>
              <span>Check the bot console for "✅ Feedback sent to intelligence system"</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">4.</span>
              <span>Go to the Feedback Intelligence Dashboard to see the analyzed message</span>
            </li>
          </ol>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            What Happens Automatically
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">AI categorization:</strong> Each message is automatically categorized (bug, feature request, UX issue, etc.)</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">Sentiment analysis:</strong> Detects positive, negative, or neutral sentiment</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">Urgency scoring:</strong> Identifies critical issues that need immediate attention</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">Smart clustering:</strong> Groups similar feedback together</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">Priority ranking:</strong> Calculates priority scores based on frequency, urgency, and impact</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">Trend detection:</strong> Identifies rising and declining issues</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2" />
              <span><strong className="text-white">Actionable insights:</strong> Generates recommended actions for your team</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
