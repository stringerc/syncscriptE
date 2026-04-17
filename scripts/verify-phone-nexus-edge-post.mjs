#!/usr/bin/env node
/**
 * Live check: POST /phone/nexus-execute creates a row retrievable via GET /tasks (same user JWT).
 *
 * Required env:
 *   NEXUS_PHONE_EDGE_SECRET — must match Supabase Edge secret for make-server-57781ad9
 *   NEXUS_VERIFY_USER_ID — real auth.users id
 *   NEXUS_LIVE_TEST_JWT (or ENGRAM_LIVE_USER_JWT) — access token for that same user
 *
 * Optional: SUPABASE_URL, SUPABASE_ANON_KEY (defaults to project public values)
 *
 * Run: node scripts/verify-phone-nexus-edge-post.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PUBLIC_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
const PUBLIC_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8';

function loadDotEnv() {
  const p = join(process.cwd(), '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadDotEnv();

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_URL).replace(/\/$/, '');
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_ANON;
const secret = process.env.NEXUS_PHONE_EDGE_SECRET?.trim();
const userId = process.env.NEXUS_VERIFY_USER_ID?.trim();
const jwt =
  process.env.NEXUS_LIVE_TEST_JWT?.trim() ||
  process.env.ENGRAM_LIVE_USER_JWT?.trim() ||
  '';

const title = `Phone Nexus verify ${Date.now()}`;

async function main() {
  if (!secret) {
    console.error('[verify-phone] SKIP: set NEXUS_PHONE_EDGE_SECRET (same as Supabase Edge for nexus-execute)');
    process.exit(0);
  }
  if (!userId || !jwt) {
    console.error('[verify-phone] SKIP: set NEXUS_VERIFY_USER_ID and NEXUS_LIVE_TEST_JWT (same user)');
    process.exit(0);
  }

  const executeUrl = `${url}/functions/v1/make-server-57781ad9/phone/nexus-execute`;
  // Supabase gateway expects a valid user session JWT in Authorization (anon key → 401 Invalid JWT).
  const res = await fetch(executeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${jwt}`,
      'x-nexus-internal-secret': secret,
    },
    body: JSON.stringify({
      userId,
      task: {
        title,
        description: 'verify-phone-nexus-edge-post',
        priority: 'medium',
        energyLevel: 'medium',
        estimatedTime: '30 min',
        dueDate: new Date(Date.now() + 864e5).toISOString(),
        tags: ['verify'],
        source: 'verify_script',
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('[verify-phone] FAIL: nexus-execute', res.status, text.slice(0, 500));
    process.exit(1);
  }

  let created;
  try {
    created = JSON.parse(text);
  } catch {
    console.error('[verify-phone] FAIL: non-JSON', text.slice(0, 200));
    process.exit(1);
  }

  if (!created.id) {
    console.error('[verify-phone] FAIL: response missing id', created);
    process.exit(1);
  }

  const tasksRes = await fetch(`${url}/functions/v1/make-server-57781ad9/tasks`, {
    headers: { apikey: anon, Authorization: `Bearer ${jwt}` },
  });
  const tasksText = await tasksRes.text();
  if (!tasksRes.ok) {
    console.error('[verify-phone] FAIL: GET /tasks', tasksRes.status, tasksText.slice(0, 400));
    process.exit(1);
  }

  const tasks = JSON.parse(tasksText);
  const ok = Array.isArray(tasks) && tasks.some((t) => String(t.title || '').includes(title.slice(0, 22)));
  if (!ok) {
    console.error('[verify-phone] FAIL: task not in GET /tasks list', { taskCount: tasks?.length, createdId: created.id });
    process.exit(1);
  }

  console.log('[verify-phone] OK: nexus-execute + GET /tasks', { id: created.id, title: created.title });
  process.exit(0);
}

main().catch((e) => {
  console.error('[verify-phone] ERROR', e);
  process.exit(1);
});
