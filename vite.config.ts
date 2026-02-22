
  import { defineConfig, loadEnv, type Plugin } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  /**
   * Vite dev-server middleware that proxies Vercel-style API routes
   * to their actual backends so the full voice pipeline works locally.
   *
   *  /api/ai/tts          → Kokoro TTS on EC2 (via Cloudflare Tunnel)
   *  /api/ai/nexus-guest  → direct AI provider (if key available) OR production syncscript.app
   */

  const DIRECT_AI_PROVIDERS: { name: string; url: string; model: string; keyEnv: string }[] = [
    { name: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', keyEnv: 'GROQ_API_KEY' },
    { name: 'nvidia', url: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'moonshotai/kimi-k2-instruct', keyEnv: 'NVIDIA_API_KEY' },
    { name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'moonshotai/kimi-k2', keyEnv: 'OPENROUTER_API_KEY' },
    { name: 'deepseek', url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat', keyEnv: 'DEEPSEEK_API_KEY' },
    { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', keyEnv: 'OPENAI_API_KEY' },
  ];

  const NEXUS_SYSTEM_PROMPT = `You are Nexus, SyncScript's AI assistant on a live voice call. Every word you write is read aloud through text-to-speech, so you must write exactly the way a human speaks.

CRITICAL OUTPUT FORMAT (your text goes directly to a TTS engine):
- Prefer 1 punchy sentence. Use 2 only when the question truly needs it. Never more than 2.
- Write spoken English ONLY. No markdown, no asterisks, no underscores, no backticks, no formatting of any kind.
- Never use hyphens between numbers. Write "2 to 3 days" not "2-3 days". Write "9 to 11 AM" not "9-11am".
- Write out dollar amounts naturally: "twelve dollars a month" not "$12/month".
- Write "percent" not "%". Write "and" not "&".
- Never use parentheses. Work the information into the sentence naturally.
- Never use semicolons or em dashes. Use periods and commas only.
- Use contractions always: "you'll", "it's", "we've", "that's", "don't".
- End questions with a question mark so the voice rises at the end.
- Use exclamation marks when genuinely enthusiastic! It makes the voice come alive.
- Mix short and longer sentences for natural rhythm.

YOUR PERSONALITY:
Warm, confident, and genuinely enthusiastic about SyncScript. You're like the best customer service rep who truly loves their product. Be empathetic when someone mentions stress or burnout. Never pushy or salesy.

ABOUT SYNCSCRIPT:
AI-powered productivity that works with your natural energy rhythms. It learns when you're at your best and schedules your hardest work during peak hours automatically.

KEY FEATURES: Energy-based scheduling, voice-first AI assistant, smart task management, calendar intelligence with conflict detection, team collaboration, gamification with XP and streaks, Google Calendar and Slack integrations.

PRICING (all include a fourteen day free trial, no credit card needed):
Free plan with core tasks. Pro at twelve dollars a month, or nine dollars if you pay annually, with full AI and voice features. Team at twenty-four dollars per user per month, or nineteen annually, with shared workspaces. Enterprise has custom pricing.

HOW IT WORKS: Sign up in about sixty seconds, connect your calendar, and within two to three days the AI learns your patterns and starts optimizing your schedule automatically.

STRICT RULES:
- Only discuss SyncScript, productivity, or how the product helps them
- Never pretend to access user data, tasks, or accounts
- Never share technical details or API information
- For issues or bugs, direct them to support at syncscript dot app
- Competitors: briefly acknowledge, then focus on what makes SyncScript unique`;

  function apiProxyPlugin(): Plugin {
    let kokoroTtsUrl = '';
    let directAI: { name: string; url: string; model: string; key: string } | null = null;

    return {
      name: 'api-proxy',
      config(_, { mode }) {
        const env = loadEnv(mode, process.cwd(), '');
        kokoroTtsUrl = env.KOKORO_TTS_URL || '';
        if (kokoroTtsUrl) {
          console.info(`[api-proxy] KOKORO_TTS_URL loaded: ${kokoroTtsUrl}`);
        } else {
          console.warn('[api-proxy] KOKORO_TTS_URL not found in .env — TTS proxy will be unavailable');
        }

        for (const p of DIRECT_AI_PROVIDERS) {
          const key = env[p.keyEnv];
          if (key) {
            directAI = { name: p.name, url: p.url, model: p.model, key };
            console.info(`[api-proxy] Direct AI: ${p.name} (streaming enabled — fastest path)`);
            break;
          }
        }
        if (!directAI) {
          console.info('[api-proxy] No local AI key found — falling back to syncscript.app (add GROQ_API_KEY to .env for 3x faster responses)');
        }
      },
      configureServer(server) {
        // ── TTS proxy: browser → Kokoro EC2 ────────────────────────────
        server.middlewares.use('/api/ai/tts', (req, res, next) => {
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            });
            return res.end();
          }
          if (req.method !== 'POST') return next();

          if (!kokoroTtsUrl) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'KOKORO_TTS_URL not set in .env', code: 'NO_TTS_URL' }));
          }

          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { text, voice, speed } = JSON.parse(body);
              const PRESETS: Record<string, string> = {
                nexus: 'nexus', nexus_emphatic: 'nexus_emphatic',
                nexus_query: 'nexus_query', cortana: 'cortana',
                commander: 'commander', professional: 'professional',
                gentle: 'af_heart', playful: 'af_bella', natural: 'af_sky',
              };
              const resolvedVoice = PRESETS[voice] || voice || 'nexus';

              const upstream = await fetch(`${kokoroTtsUrl}/v1/audio/speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'kokoro',
                  input: text,
                  voice: resolvedVoice,
                  speed: typeof speed === 'number' ? Math.max(0.5, Math.min(speed, 2.0)) : 1.0,
                }),
              });

              if (!upstream.ok) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `Kokoro returned ${upstream.status}`, code: 'KOKORO_ERROR' }));
              }

              const buf = Buffer.from(await upstream.arrayBuffer());
              res.writeHead(200, {
                'Content-Type': upstream.headers.get('content-type') || 'audio/wav',
                'Content-Length': buf.byteLength.toString(),
                'Cache-Control': 'no-store',
              });
              res.end(buf);
            } catch (err: any) {
              console.error('[dev-proxy] TTS error:', err.message);
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message, code: 'UNREACHABLE' }));
            }
          });
        });

        // ── AI chat proxy ────────────────────────────────────────────────
        // If a local AI key is available → call provider directly with SSE
        // streaming for minimum latency. Otherwise → syncscript.app fallback.
        server.middlewares.use('/api/ai/nexus-guest', (req, res, next) => {
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            });
            return res.end();
          }
          if (req.method !== 'POST') return next();

          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);

              // ── Direct AI path (local key available) ──────────────
              if (directAI) {
                const chatMessages = [
                  { role: 'system', content: NEXUS_SYSTEM_PROMPT },
                  ...(parsed.messages || [])
                    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
                    .slice(-10),
                ];

                const aiRes = await fetch(directAI.url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${directAI.key}`,
                  },
                  body: JSON.stringify({
                    model: directAI.model,
                    messages: chatMessages,
                    max_tokens: 80,
                    temperature: 0.7,
                    stream: true,
                  }),
                });

                if (!aiRes.ok || !aiRes.body) {
                  console.error(`[dev-proxy] Direct AI ${directAI.name} failed (${aiRes.status}), falling back to syncscript.app`);
                  throw new Error('direct-ai-failed');
                }

                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'Access-Control-Allow-Origin': '*',
                });

                const reader = (aiRes.body as any).getReader();
                const decoder = new TextDecoder();

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n');

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    const payload = trimmed.slice(6);

                    if (payload === '[DONE]') {
                      res.write('data: [DONE]\n\n');
                      continue;
                    }

                    try {
                      const obj = JSON.parse(payload);
                      const token = obj.choices?.[0]?.delta?.content;
                      if (token) {
                        res.write(`data: ${JSON.stringify({ token })}\n\n`);
                      }
                    } catch { /* skip malformed */ }
                  }
                }

                if (!res.writableEnded) {
                  res.write('data: [DONE]\n\n');
                  res.end();
                }
                return;
              }

              // ── Fallback: proxy to production syncscript.app ──────
              const upstream = await fetch('https://syncscript.app/api/ai/nexus-guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
              });

              const upstreamCT = upstream.headers.get('content-type') || '';
              const isUpstreamSSE = upstreamCT.includes('text/event-stream');

              if (parsed.stream && upstream.ok && upstream.body && isUpstreamSSE) {
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'Access-Control-Allow-Origin': '*',
                });
                const reader = (upstream.body as any).getReader();
                const pump = async () => {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(Buffer.from(value));
                  }
                  res.end();
                };
                pump().catch(() => res.end());
              } else {
                const data = await upstream.text();
                res.writeHead(upstream.status, {
                  'Content-Type': upstream.headers.get('content-type') || 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(data);
              }
            } catch (err: any) {
              if (err?.message === 'direct-ai-failed' && directAI) {
                try {
                  const upstream = await fetch('https://syncscript.app/api/ai/nexus-guest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                  });
                  const data = await upstream.text();
                  res.writeHead(upstream.status, {
                    'Content-Type': upstream.headers.get('content-type') || 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  });
                  res.end(data);
                  return;
                } catch { /* double failure */ }
              }
              console.error('[dev-proxy] AI chat error:', err.message);
              if (!res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
              }
              res.end(JSON.stringify({ error: 'AI service unreachable' }));
            }
          });
        });
      },
    };
  }

  export default defineConfig({
    plugins: [react(), apiProxyPlugin()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'stripe@14.11.0': 'stripe',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/9f574c53e1c264d4351db616e8a79c11f6fef154.png': path.resolve(__dirname, './src/assets/9f574c53e1c264d4351db616e8a79c11f6fef154.png'),
        'figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png': path.resolve(__dirname, './src/assets/914d5787f554946c037cbfbb2cf65fcc0de06278.png'),
        'figma:asset/8d26f4b2d886ed95614e70e1339182969ce6d6a1.png': path.resolve(__dirname, './src/assets/8d26f4b2d886ed95614e70e1339182969ce6d6a1.png'),
        'figma:asset/822ef8e3ddcda0058b73bfd2085c07481b1d9329.png': path.resolve(__dirname, './src/assets/822ef8e3ddcda0058b73bfd2085c07481b1d9329.png'),
        'figma:asset/7d99b6ac70210faffa2ce5893d00a818091c56dc.png': path.resolve(__dirname, './src/assets/7d99b6ac70210faffa2ce5893d00a818091c56dc.png'),
        'figma:asset/580ef2437ae1d201a47de3db3c9b112bdab02b2f.png': path.resolve(__dirname, './src/assets/580ef2437ae1d201a47de3db3c9b112bdab02b2f.png'),
        'figma:asset/4e94542666132dbcb0ad88c6a1fa77857c6435c9.png': path.resolve(__dirname, './src/assets/4e94542666132dbcb0ad88c6a1fa77857c6435c9.png'),
        'figma:asset/32f9c29c68f7ed10b9efd8ff6ac4135b7a2a4290.png': path.resolve(__dirname, './src/assets/32f9c29c68f7ed10b9efd8ff6ac4135b7a2a4290.png'),
        'figma:asset/10a3b698cc11b04c569092c39ce52acabd7f851f.png': path.resolve(__dirname, './src/assets/10a3b698cc11b04c569092c39ce52acabd7f851f.png'),
        'figma:asset/0da3094bdfb779c6e044ac8ae51d7afc3151da28.png': path.resolve(__dirname, './src/assets/0da3094bdfb779c6e044ac8ae51d7afc3151da28.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@jsr/supabase__supabase-js@2': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router'],
            'vendor-ui': ['sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            'vendor-charts': ['recharts'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
            'vendor-gsap': ['gsap'],
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  });