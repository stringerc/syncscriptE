import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const phone = readFileSync(join(root, 'api/phone/[endpoint].ts'), 'utf8');
const discordRoute = readFileSync(join(root, 'api/phone/_route-discord.ts'), 'utf8');
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');

assert.ok(!existsSync(join(root, 'api/discord/interactions.ts')), 'standalone api/discord/interactions must be removed (merged into phone router)');
assert.ok(phone.includes('discord-interactions'), 'phone router must handle discord-interactions');
assert.ok(phone.includes('bodyParser: false'), 'phone router must disable bodyParser for Discord raw body');
assert.ok(discordRoute.includes('make-server-57781ad9/discord/interactions'), 'Discord proxy must target Edge');
assert.ok(vercel.includes('/api/discord/interactions'), 'vercel.json must rewrite Discord public URL');
assert.ok(vercel.includes('/api/phone/discord-interactions'), 'vercel.json must route to phone handler');

console.log('discord-vercel-proxy-contract: ok');
