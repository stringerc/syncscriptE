/**
 * Live agent browser view — connects via WebSocket to the Oracle runner,
 * receives binary JPEG frames from CDP screencast, decodes them via
 * createImageBitmap, draws to canvas. Same approach as Browserbase /
 * Anthropic Operator / OpenAI Operator.
 *
 * Frames typically arrive at ~10-15 fps when the page is changing
 * (cursor moves, typing, scrolling, navigation). When the page is
 * static, no frames are emitted — that's normal CDP behavior.
 *
 * Auth flow:
 *   1. Hit /api/agent/live-token?run_id=X with the user's Supabase JWT
 *   2. Server returns { ws_url, token, expires_at }
 *   3. Open WebSocket to ws_url (token is in the query param)
 *   4. Runner verifies HMAC + run ownership before subscribing
 *
 * Falls back to the latest static screenshot when:
 *   - run is no longer 'running' (no broadcaster)
 *   - WebSocket fails (network, runner down, token expired)
 *   - createImageBitmap is unsupported (old browsers)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Globe, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePageVisibility } from '../../hooks/usePageVisibility';

/** Max client-side draw rate, regardless of WS frame arrival rate. The CDP
 *  side already emits at ~12fps via `everyNthFrame`, but during fast scrolls
 *  it can spike higher; we coalesce to a single rAF-aligned paint per ~80ms. */
const MAX_DRAW_FPS = 12;
const MIN_FRAME_INTERVAL_MS = 1000 / MAX_DRAW_FPS;

interface Props {
  runId: string;
  isActive: boolean;
  fallbackScreenshotB64?: string | null;
  fallbackUrlLabel?: string | null;
}

interface LiveTokenResponse {
  token: string;
  expires_at: number;
  ws_url: string;
}

export function AgentLiveCanvas({ runId, isActive, fallbackScreenshotB64, fallbackUrlLabel }: Props) {
  const { accessToken } = useAuth();
  const { visible } = usePageVisibility();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  // rAF-coalesced paint state: pendingFrame holds the most recent ArrayBuffer,
  // rafScheduled prevents queueing duplicate rAFs. If frames arrive faster than
  // the browser can paint, only the LATEST is rendered (last-write-wins).
  const pendingFrameRef = useRef<ArrayBuffer | null>(null);
  const rafScheduledRef = useRef(false);
  const lastDrawAtRef = useRef(0);
  const [status, setStatus] = useState<'connecting' | 'live' | 'fallback' | 'idle' | 'paused'>('idle');
  const [framesReceived, setFramesReceived] = useState(0);
  const [lastFrameAt, setLastFrameAt] = useState<number | null>(null);

  // Track if we've ever received a frame — once we have, we never go back to
  // fallback even on disconnect (last frame stays on canvas).
  const hasLiveFrameRef = useRef(false);

  useEffect(() => {
    if (!isActive || !accessToken || !runId) {
      setStatus('idle');
      return;
    }
    // Page is hidden: don't open a fresh WS — last frame stays on canvas, we
    // resume on visibility change. This is the single biggest CPU win on
    // background tabs (Browserbase + Operator both do this).
    if (!visible) {
      setStatus('paused');
      return;
    }

    let cancelled = false;
    let currentWs: WebSocket | null = null;

    async function connect() {
      if (cancelled) return;
      setStatus('connecting');
      try {
        // 1. Get a live token from Vercel
        const tokenRes = await fetch(`/api/agent/live-token?run_id=${encodeURIComponent(runId)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!tokenRes.ok) {
          if (tokenRes.status === 503) {
            // Runner unreachable — stay in fallback mode without retrying.
            setStatus('fallback');
            return;
          }
          throw new Error(`live-token ${tokenRes.status}`);
        }
        const tokenJson = (await tokenRes.json()) as LiveTokenResponse;

        if (cancelled) return;
        // 2. Open the WebSocket
        const ws = new WebSocket(tokenJson.ws_url);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;
        currentWs = ws;

        ws.onopen = () => {
          if (cancelled) { ws.close(); return; }
          reconnectAttempt.current = 0;
          // We may not see frames until the page changes — keep "connecting"
          // until first frame. Avoids a confusing "live" badge over a black canvas.
        };

        ws.onmessage = (ev) => {
          if (cancelled) return;
          // Binary = JPEG frame. Text = control message (no_active_broadcaster, etc.)
          if (typeof ev.data === 'string') {
            try {
              const msg = JSON.parse(ev.data);
              if (msg.type === 'no_active_broadcaster') {
                setStatus('fallback');
              }
            } catch { /* non-JSON text — ignore */ }
            return;
          }
          if (!(ev.data instanceof ArrayBuffer)) return;
          // Last-write-wins: keep only the most recent frame. If we're already
          // about to paint, just update the buffer; the queued rAF picks it up.
          pendingFrameRef.current = ev.data;
          if (rafScheduledRef.current) return;
          // Frame-rate cap: skip the rAF if we drew too recently. Lets the WS
          // keep buffering; the next message will fire a draw within ≤80ms.
          const now = performance.now();
          const sinceLast = now - lastDrawAtRef.current;
          if (sinceLast < MIN_FRAME_INTERVAL_MS) return;
          rafScheduledRef.current = true;
          requestAnimationFrame(async () => {
            rafScheduledRef.current = false;
            const buf = pendingFrameRef.current;
            pendingFrameRef.current = null;
            if (!buf || cancelled) return;
            try {
              const bitmap = await createImageBitmap(new Blob([buf], { type: 'image/jpeg' }));
              const canvas = canvasRef.current;
              if (!canvas) { bitmap.close?.(); return; }
              if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
              }
              const ctx = canvas.getContext('2d');
              if (ctx) ctx.drawImage(bitmap, 0, 0);
              bitmap.close?.();
              hasLiveFrameRef.current = true;
              lastDrawAtRef.current = performance.now();
              setStatus('live');
              setFramesReceived((n) => n + 1);
              setLastFrameAt(Date.now());
            } catch {
              /* corrupt frame — drop */
            }
          });
        };

        ws.onerror = () => {
          // onclose will fire next; just log here.
        };

        ws.onclose = (ev) => {
          if (cancelled) return;
          wsRef.current = null;
          // 1000 = clean close (run done). Don't reconnect.
          if (ev.code === 1000 || ev.reason === 'run_complete') {
            setStatus(hasLiveFrameRef.current ? 'fallback' : 'idle');
            return;
          }
          // Reconnect with exponential backoff up to ~10s.
          reconnectAttempt.current += 1;
          const delay = Math.min(10_000, 500 * Math.pow(2, reconnectAttempt.current));
          setStatus('fallback');
          setTimeout(() => { if (!cancelled) connect(); }, delay);
        };
      } catch (e) {
        if (cancelled) return;
        console.warn('[AgentLiveCanvas] connect failed:', e instanceof Error ? e.message : e);
        setStatus('fallback');
        // Retry once after 2s
        setTimeout(() => { if (!cancelled) connect(); }, 2000);
      }
    }

    connect();

    return () => {
      cancelled = true;
      reconnectAttempt.current = 0;
      // Cancel any pending paint so we don't process a stale frame after
      // unmount / pause.
      pendingFrameRef.current = null;
      rafScheduledRef.current = false;
      try { currentWs?.close(1000, 'unmount'); } catch { /* ignore */ }
      wsRef.current = null;
    };
    // `visible` is intentionally a dep — when the tab goes hidden the effect
    // re-runs, hits the early return above, and the cleanup closes the WS.
    // When the tab comes back, the effect re-runs again and reconnects.
  }, [runId, isActive, accessToken, visible]);

  // Compute how stale the last frame is — used to show "frozen" indicator.
  const staleMs = useMemo(() => {
    if (!lastFrameAt) return null;
    return Date.now() - lastFrameAt;
  }, [lastFrameAt]);

  const showCanvas = hasLiveFrameRef.current || status === 'live';
  const showFallbackImage = !showCanvas && fallbackScreenshotB64;

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-[#06070a] overflow-hidden">
      {/* Live canvas — always mounted so the drawn frame persists across status changes */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ display: showCanvas ? 'block' : 'none' }}
      />

      {showFallbackImage && (
        <img
          src={`data:image/png;base64,${fallbackScreenshotB64}`}
          alt="Latest agent screenshot"
          className="max-w-full max-h-full object-contain opacity-90"
        />
      )}

      {!showCanvas && !showFallbackImage && (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          {status === 'connecting' && (
            <>
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-xs text-gray-500">Connecting to live browser…</p>
            </>
          )}
          {status === 'fallback' && (
            <>
              <WifiOff className="w-6 h-6 text-gray-500" />
              <p className="text-xs text-gray-500">Live view unavailable — waiting for next screenshot.</p>
            </>
          )}
          {status === 'idle' && (
            <>
              <Globe className="w-8 h-8 text-gray-600" />
              <p className="text-xs text-gray-500">{isActive ? 'Loading…' : 'Run not active.'}</p>
            </>
          )}
        </div>
      )}

      {/* Status pill */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium pointer-events-none backdrop-blur-sm"
        style={{
          backgroundColor: status === 'live' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(75, 85, 99, 0.4)',
          border: `1px solid ${status === 'live' ? 'rgba(52, 211, 153, 0.6)' : 'rgba(156, 163, 175, 0.4)'}`,
          color: status === 'live' ? '#6ee7b7' : '#9ca3af',
        }}>
        {status === 'live' ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
        {status === 'live' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
            {staleMs !== null && staleMs > 4000 && <span className="opacity-60">· paused</span>}
          </>
        )}
        {status === 'connecting' && <span>connecting…</span>}
        {status === 'fallback' && <span>screenshot</span>}
        {status === 'idle' && <span>idle</span>}
        {status === 'paused' && <span>paused (tab hidden)</span>}
      </div>

      {fallbackUrlLabel && (
        <div className="absolute bottom-2 left-2 right-2 mx-auto max-w-md rounded-md bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] text-gray-300 truncate text-center pointer-events-none">
          {fallbackUrlLabel}
        </div>
      )}
    </div>
  );
}
