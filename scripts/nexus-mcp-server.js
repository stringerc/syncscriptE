#!/usr/bin/env node

/**
 * Nexus MCP Server Bridge
 * 
 * This script provides an MCP (Model Context Protocol) server interface for IDEs
 * like Antigravity to interact with the SyncScript cloud state.
 * 
 * Capabilities:
 * - Read/Write deferred questions (nexus_deferred_questions)
 * - Read/Write debrief data (nexus_voice_debrief)
 * - Fetch harmony briefs
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const USER_ID = process.env.SYNCSCRIPT_USER_ID; // The user ID to act on behalf of

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !USER_ID) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, or SYNCSCRIPT_USER_ID');
  process.exit(1);
}

const server = new Server(
  {
    name: 'nexus-mcp-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to call Supabase Edge Functions for KV
async function callKvApi(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/make-server-57781ad9/kv/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`KV API Error: ${res.statusText}`);
  return res.json();
}

async function kvGet(key) {
  const result = await callKvApi('get', { key });
  const v = result.value;
  if (!v) return null;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

async function kvSet(key, value) {
  await callKvApi('set', { key, value: JSON.stringify(value) });
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_deferred_questions',
        description: 'Get pending questions deferred to the noon check-in',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_debrief_data',
        description: 'Get the latest nightly debrief data',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date string (e.g. 2026-05-25). Defaults to today.' }
          },
        },
      },
      {
        name: 'save_debrief_data',
        description: 'Save or overwrite debrief data (wins, reflection, tomorrow) for a given date',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date string (e.g. 2026-05-25). Defaults to today.' },
            wins: { type: 'string', description: 'Comma-separated list of wins' },
            reflection: { type: 'string', description: 'Reflection text' },
            tomorrow: { type: 'string', description: 'Plans for tomorrow' },
          },
          required: ['wins', 'reflection', 'tomorrow'],
        },
      },
      {
        name: 'clear_deferred_questions',
        description: 'Clear all deferred questions (e.g. after they have been addressed in the noon check-in)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_briefing_schedule',
        description: 'Get the current briefing schedule configuration (times, toggles, phone number)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_briefing_schedule',
        description: 'Update the briefing schedule configuration',
        inputSchema: {
          type: 'object',
          properties: {
            time: { type: 'string', description: 'Briefing time (e.g. 07:00)' },
            timezone: { type: 'string', description: 'Timezone (e.g. America/New_York)' },
            days: { type: 'string', description: 'Comma-separated days (e.g. mon,tue,wed,thu,fri)' },
            phoneNumber: { type: 'string', description: 'Phone number for voice calls' },
            morningBriefEnabled: { type: 'boolean', description: 'Enable 7 AM morning brief' },
            noonCheckInEnabled: { type: 'boolean', description: 'Enable 12 PM noon check-in' },
            debriefEnabled: { type: 'boolean', description: 'Enable 9 PM nightly debrief' },
          },
        },
      },
      {
        name: 'sync_notes_to_nexus',
        description: 'Save a note or thought to the Nexus Thought Bubble for inclusion in the next briefing',
        inputSchema: {
          type: 'object',
          properties: {
            note: { type: 'string', description: 'The note or thought to capture' },
          },
          required: ['note'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'get_deferred_questions') {
      const data = await kvGet(`nexus_deferred_questions:${USER_ID}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }],
      };
    }

    if (request.params.name === 'get_debrief_data') {
      const date = request.params.arguments?.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const data = await kvGet(`nexus_voice_debrief:${USER_ID}:${date}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(data || {}, null, 2) }],
      };
    }

    if (request.params.name === 'save_debrief_data') {
      const date = request.params.arguments?.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const { wins, reflection, tomorrow } = request.params.arguments || {};
      await kvSet(`nexus_voice_debrief:${USER_ID}:${date}`, {
        wins: wins || '',
        reflection: reflection || '',
        tomorrow: tomorrow || '',
        savedVia: 'mcp',
        savedAt: new Date().toISOString(),
      });
      return {
        content: [{ type: 'text', text: `Debrief saved for ${date}` }],
      };
    }

    if (request.params.name === 'clear_deferred_questions') {
      await kvSet(`nexus_deferred_questions:${USER_ID}`, []);
      return {
        content: [{ type: 'text', text: 'Deferred questions cleared' }],
      };
    }

    if (request.params.name === 'get_briefing_schedule') {
      const data = await kvGet(`briefing_schedule:${USER_ID}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(data || {}, null, 2) }],
      };
    }

    if (request.params.name === 'update_briefing_schedule') {
      const args = request.params.arguments || {};
      const existing = (await kvGet(`briefing_schedule:${USER_ID}`)) || {};
      const updated = { ...existing };
      if (args.time !== undefined) updated.time = args.time;
      if (args.timezone !== undefined) updated.timezone = args.timezone;
      if (args.days !== undefined) updated.days = args.days.split(',').map((d) => d.trim());
      if (args.phoneNumber !== undefined) updated.phoneNumber = args.phoneNumber;
      if (args.morningBriefEnabled !== undefined) updated.morningBriefEnabled = args.morningBriefEnabled;
      if (args.noonCheckInEnabled !== undefined) updated.noonCheckInEnabled = args.noonCheckInEnabled;
      if (args.debriefEnabled !== undefined) updated.debriefEnabled = args.debriefEnabled;
      updated.userId = USER_ID;
      await kvSet(`briefing_schedule:${USER_ID}`, updated);
      return {
        content: [{ type: 'text', text: `Briefing schedule updated: ${JSON.stringify(updated, null, 2)}` }],
      };
    }

    if (request.params.name === 'sync_notes_to_nexus') {
      const { note } = request.params.arguments || {};
      if (!note) throw new Error('note is required');
      const existing = (await kvGet(`nexus_thought_bubble:${USER_ID}:${new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}`)) || [];
      existing.push({ text: note, capturedAt: new Date().toISOString(), source: 'mcp' });
      await kvSet(`nexus_thought_bubble:${USER_ID}:${new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}`, existing);
      return {
        content: [{ type: 'text', text: `Note synced to Nexus Thought Bubble` }],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Nexus MCP Bridge running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
