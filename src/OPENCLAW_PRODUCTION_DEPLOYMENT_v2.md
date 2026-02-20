# OpenClaw Production Deployment Guide v2

**Status**: Updated architecture  
**Date**: February 11, 2026  
**Replaces**: OPENCLAW_PHASE1_DEPLOYMENT_GUIDE.md (Feb 10, 2026)

---

## What Changed Since v1

The original guide assumed a simple HTTP REST bridge to a single-model OpenClaw instance. The current local setup is significantly more advanced:

| Aspect | v1 (Original) | v2 (Current) |
|--------|---------------|--------------|
| Protocol | HTTP REST | ACP WebSocket + Ed25519 device auth |
| Models | DeepSeek only | 7 providers, 10+ fallback models |
| Proxies | None | Gemini (:18790), Mistral (:18791), Kimi (:18792) |
| Agents | Single agent | Fleet (main, scribe, sentinel) with subagent spawning |
| Monitoring | None | Mission Control v2.3.0 (watchdog, alerts, workflow tracker) |
| Skills | 4 custom | Bundled + ClawHub skills |
| Chat | HTTP request/response | Real-time streaming via WebSocket events |

---

## Architecture

```
                        Internet
                           |
              +------------+------------+
              |                         |
     [Vercel / quicksync.app]    [Vercel / syncscript.app]
     SyncScript Dashboard        SyncScript Main App
              |                         |
              +------------+------------+
                           |
                  [Supabase Edge Function]
                  openclaw-bridge (HTTP)
                           |
                    (HTTP to WS Bridge)
                           |
              +------------+------------+
              |     EC2 Instance         |
              |  (3.148.233.23)          |
              |                          |
              |  OpenClaw Gateway :18789 |
              |      |                   |
              |  +---+---+---+           |
              |  |   |   |   |           |
              |  G   M   K   Direct     |
              |  e   i   i   API        |
              |  m   s   m   calls      |
              |  i   t   i              |
              |  n   r   :              |
              |  i   a   1              |
              |  :   l   8              |
              |  1   :   7              |
              |  8   1   9              |
              |  7   8   2              |
              |  9   7                   |
              |  0   9                   |
              |      1                   |
              +-------------------------+
```

---

## EC2 Server Setup

### Prerequisites

- Ubuntu 22.04+ EC2 instance (t3.medium recommended)
- Node.js 20+ (for compatibility proxies)
- OpenClaw installed (`curl -fsSL https://openclaw.dev/install | bash`)

### Step 1: Install OpenClaw

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23

# Install OpenClaw
curl -fsSL https://openclaw.dev/install | bash

# Verify
openclaw --version
```

### Step 2: Copy Configuration

Copy the local `~/.openclaw/openclaw.json` to the EC2 server. This is the single source of truth for providers, models, fallbacks, and agent config.

```bash
# From local machine:
scp -i ~/Downloads/test.pem ~/.openclaw/openclaw.json ubuntu@3.148.233.23:~/.openclaw/openclaw.json
```

Key configuration sections that must be present:

**Providers** (7 total):
- `groq` - Groq Cloud (free tier)
- `gemini` - Google AI Studio (free tier, via proxy)
- `deepseek` - DeepSeek (paid, ~$10 balance)
- `cerebras` - Cerebras (free tier)
- `mistral` - Mistral AI (free tier, via proxy)
- `kimi` - Moonshot/Kimi K2.5 (paid, ~$15 balance, via proxy)
- `openrouter` - OpenRouter (free models)

**Model Fallback Chain** (in order):
1. `deepseek/deepseek-chat` (primary)
2. `kimi/kimi-k2.5`
3. `cerebras/llama-3.3-70b`
4. `mistral/mistral-small-latest`
5. `groq/meta-llama/llama-4-scout-17b-16e-instruct`
6. `openrouter/meta-llama/llama-3.3-70b-instruct:free`
7. `groq/llama-3.3-70b-versatile`
8. `openrouter/openai/gpt-oss-120b:free`
9. `gemini/gemini-2.5-flash`
10. `openrouter/nousresearch/hermes-3-llama-3.1-405b:free`
11. `gemini/gemini-2.5-flash-lite`

### Step 3: Set Up API Keys

```bash
nano ~/.openclaw/.env
```

Required keys:
```
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
CEREBRAS_API_KEY=csk-...
MISTRAL_API_KEY=...
KIMI_API_KEY=sk-...
OPENCLAW_GATEWAY_TOKEN=<generate-a-secure-random-token>
```

### Step 4: Deploy Compatibility Proxies

Three providers (Gemini, Mistral, Kimi) require compatibility proxies that translate between the OpenAI-compatible format and their native APIs.

**Create proxy directory:**
```bash
mkdir -p ~/openclaw-proxies
cd ~/openclaw-proxies
npm init -y
npm install express node-fetch
```

**Gemini Proxy (port 18790):**
Translates OpenAI chat/completions to Gemini's `generateContent` API. Required because Gemini uses a different request/response format.

**Mistral Proxy (port 18791):**
Passes through to Mistral's OpenAI-compatible endpoint but handles edge cases with streaming format differences.

**Kimi K2.5 Proxy (port 18792):**
Handles Kimi's strict parameter validation (temperature must be 0.001-0.999, specific required fields).

Copy the proxy files from the local Mission Control deployment or recreate them. Source files are in:
- `mission-control/proxies/gemini-proxy.js`
- `mission-control/proxies/mistral-proxy.js`
- `mission-control/proxies/kimi-proxy.js`

**Create systemd services for each proxy:**
```bash
sudo tee /etc/systemd/system/gemini-proxy.service << 'EOF'
[Unit]
Description=Gemini Compatibility Proxy
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/openclaw-proxies
ExecStart=/usr/bin/node gemini-proxy.js
Restart=always
RestartSec=5
Environment=GEMINI_API_KEY=<your-key>

[Install]
WantedBy=multi-user.target
EOF

# Repeat for mistral-proxy (port 18791) and kimi-proxy (port 18792)

sudo systemctl enable gemini-proxy mistral-proxy kimi-proxy
sudo systemctl start gemini-proxy mistral-proxy kimi-proxy
```

### Step 5: Start OpenClaw Gateway

```bash
# Start as a systemd service for reliability
sudo tee /etc/systemd/system/openclaw.service << 'EOF'
[Unit]
Description=OpenClaw AI Gateway
After=network.target gemini-proxy.service mistral-proxy.service kimi-proxy.service

[Service]
Type=simple
User=ubuntu
ExecStart=/home/ubuntu/.openclaw/bin/openclaw start
Restart=always
RestartSec=10
Environment=HOME=/home/ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable openclaw
sudo systemctl start openclaw

# Verify
curl http://localhost:18789/
```

### Step 6: Configure EC2 Security Group

Only expose what's needed:
- Port 22 (SSH) - your IP only
- Port 18789 (OpenClaw Gateway) - Supabase Edge Function IPs only
- Ports 18790-18792 - localhost only (proxies, no external access)

---

## Supabase Edge Function Bridge

### Why a Bridge?

The bridge serves three purposes:
1. **Security** - Never expose the EC2 OpenClaw gateway directly to the internet
2. **Auth** - Validate Supabase user tokens before forwarding requests
3. **Protocol translation** - Frontend sends HTTP; bridge translates to ACP WebSocket

### Architecture Decision: HTTP-to-WebSocket Per-Request Pattern

Supabase Edge Functions (Deno Deploy) have a **150-second execution limit** and cannot maintain persistent WebSocket connections. Instead, the bridge uses a per-request pattern:

1. Frontend sends HTTP POST to bridge
2. Bridge opens a temporary WebSocket to OpenClaw EC2
3. Bridge sends ACP `connect` frame, waits for hello
4. Bridge sends ACP `chat.send` frame
5. Bridge collects streaming `agent` and `chat` events
6. Bridge pipes responses back as Server-Sent Events (SSE) to the frontend
7. When `chat` event with `state: "final"` arrives, bridge closes the WebSocket

For non-streaming endpoints (health, history), the bridge uses simple HTTP-to-ACP request/response.

### Updated Bridge Code

The existing `src/supabase/functions/server/openclaw-bridge.tsx` needs these changes:

1. **Replace HTTP calls with ACP WebSocket calls:**
   ```typescript
   // OLD: HTTP REST
   const response = await fetch(`${OPENCLAW_BASE_URL}/v1/chat/completions`, {...})

   // NEW: ACP WebSocket
   const ws = new WebSocket(`ws://${EC2_HOST}:18789`)
   // Send connect frame, then chat.send frame
   // Collect streaming events
   ```

2. **Add Ed25519 device auth:**
   The EC2 gateway requires the same ACP authentication protocol used by Mission Control's `gateway.ts`. The bridge needs to generate a device identity and sign connection payloads.

3. **Update CORS origins:**
   ```typescript
   origin: ['https://syncscript.app', 'https://quicksync.app', 'http://localhost:5173']
   ```

4. **Add SSE streaming for chat:**
   ```typescript
   // Return streaming response
   return new Response(readableStream, {
     headers: {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive',
     },
   })
   ```

### Bridge Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/openclaw/health` | GET | Gateway health check |
| `/openclaw/chat` | POST | Send message, stream response via SSE |
| `/openclaw/history` | GET | Fetch chat history |
| `/openclaw/agents/status` | GET | Agent fleet status |
| `/openclaw/skills` | GET | Available skills |

---

## Frontend Client Update

The `src/utils/openclaw-client.ts` needs to be updated to use the Supabase bridge URL and handle SSE responses for streaming chat.

Key changes:
1. **Base URL**: Switch from direct gateway to Supabase Edge Function URL
2. **Auth**: Include Supabase user token in requests
3. **Streaming**: Use `EventSource` or `fetch` with streaming for chat responses
4. **Fallback**: If bridge is unavailable, show appropriate error (not a fake response)

---

## Mission Control on EC2 (Optional)

For remote monitoring, Mission Control can also run on the EC2 server:

```bash
# Clone the mission-control directory
scp -r mission-control/ ubuntu@3.148.233.23:~/mission-control/

# Install dependencies and build
cd ~/mission-control
npm install
npm run build

# Run with PM2 or systemd
npx tsx server/index.ts
```

Access via SSH tunnel:
```bash
ssh -L 5201:localhost:5201 -i ~/Downloads/test.pem ubuntu@3.148.233.23
# Then open http://localhost:5201 locally
```

---

## Deployment Checklist

### EC2 Server
- [ ] OpenClaw installed and configured
- [ ] `openclaw.json` copied from local (with proxy baseUrls updated to localhost)
- [ ] `.env` with all 7 API keys + gateway token
- [ ] Gemini proxy running on :18790
- [ ] Mistral proxy running on :18791
- [ ] Kimi proxy running on :18792
- [ ] OpenClaw gateway running on :18789
- [ ] Security group configured (18789 open to Supabase only)
- [ ] Heartbeat working (`openclaw system heartbeat last --json`)

### Supabase Edge Function
- [ ] `openclaw-bridge.tsx` updated with ACP WebSocket protocol
- [ ] Ed25519 device identity generation
- [ ] CORS updated for quicksync.app
- [ ] SSE streaming for chat responses
- [ ] Deployed to Supabase project

### Frontend (Vercel)
- [ ] `openclaw-client.ts` updated to use bridge URL
- [ ] SSE/EventSource for streaming chat
- [ ] Error handling for bridge unavailability
- [ ] Environment variables set in Vercel dashboard

### Testing
- [ ] Health check through bridge: `curl <bridge-url>/openclaw/health`
- [ ] Chat message round-trip through bridge
- [ ] Streaming response works in browser
- [ ] Model fallback triggers correctly
- [ ] Mission Control can monitor EC2 gateway (optional)

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| EC2 t3.medium | ~$30 |
| DeepSeek API | ~$5-10 (primary model) |
| Kimi API | ~$5-10 (first fallback) |
| Supabase | Free tier |
| Vercel | Free tier |
| Other LLMs | Free tiers |
| **Total** | **~$40-50/month** |

---

## Differences from Local Setup

| Local | Production |
|-------|-----------|
| Gateway at `localhost:18789` | Gateway at EC2 private IP |
| Direct WebSocket from browser | HTTP/SSE via Supabase bridge |
| Mission Control on same machine | SSH tunnel or EC2 deployment |
| No auth needed (local trust) | Ed25519 + token + Supabase JWT |
| `.env` on disk | Systemd environment + Supabase secrets |

---

## Rollback Plan

If the production deployment has issues:
1. The bridge has a health check endpoint -- monitor it
2. If EC2 gateway fails, the bridge returns a clear error to the frontend
3. Frontend shows "AI temporarily unavailable" instead of crashing
4. Mission Control alerts (if deployed on EC2) will send iMessage notifications
5. SSH into EC2 and restart services: `sudo systemctl restart openclaw`
