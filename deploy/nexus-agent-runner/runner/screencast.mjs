/**
 * Per-run CDP screencast broadcaster.
 *
 * What top-tier agentic-browser products do (Browserbase, Anthropic
 * Computer Use, OpenAI Operator, Manus.im): start a Chrome DevTools
 * Protocol screencast on the active page, receive ~10-30 fps JPEG
 * frames as the page changes, fan them out over WebSocket to subscribed
 * UI clients. The user sees real cursor motion, real typing, real
 * scrolls — the agent "looks like" a human at the wheel.
 *
 * This is the Playwright-native equivalent — we attach a CDP session
 * to each agent run's Page and call Page.startScreencast. Every frame
 * is broadcast to any /v1/runs/<id>/live WS subscribers; we ack the
 * frame back to CDP so the next one is sent.
 *
 * Bandwidth target: ~50-100 KB/frame at quality 65 / 1024x768 / 2x
 * frame-rate-divisor → ~300-500 KB/s sustained per active run. Oracle
 * A1's gigabit interface handles 4 concurrent runs comfortably.
 */

const broadcasters = new Map(); // runId → Broadcaster

/**
 * Start a screencast for the given Playwright Page bound to runId.
 * Returns a stop() function that cleans up CDP + broadcaster on completion.
 *
 * Resilient to:
 *   - Pages that navigate (CDP session is bound to target, survives navigation)
 *   - Subscribers connecting late (next frame goes to all current subs)
 *   - All subscribers disconnecting (we keep capturing — fresh subs join silently)
 *   - Page closing (cleans up automatically via 'close' listener)
 */
export async function startScreencast({ runId, page, fps = 12, quality = 60, maxWidth = 1024, maxHeight = 768 }) {
  if (broadcasters.has(runId)) {
    // Idempotent: a re-call replaces the existing broadcaster. Should not
    // happen in practice but keeps the API safe under retry.
    await broadcasters.get(runId).stop();
  }

  let cdp;
  try {
    cdp = await page.context().newCDPSession(page);
  } catch (e) {
    console.warn(`[screencast ${runId}] newCDPSession failed:`, e?.message || e);
    return () => {};
  }

  const broadcaster = {
    runId,
    cdp,
    subs: new Set(), // WebSocket instances
    lastFrame: null, // most recent ArrayBuffer for late subscribers
    framesSent: 0,
    startedAt: Date.now(),
    closed: false,
    addSubscriber(ws) {
      if (this.closed) return;
      this.subs.add(ws);
      // Send the most recent frame immediately so the new subscriber
      // doesn't stare at black until the next visual change.
      if (this.lastFrame) {
        try { ws.send(this.lastFrame, { binary: true }); } catch { /* socket closed */ }
      }
      ws.on('close', () => this.subs.delete(ws));
      ws.on('error', () => this.subs.delete(ws));
    },
    broadcast(frameBuf) {
      this.framesSent += 1;
      this.lastFrame = frameBuf;
      for (const ws of this.subs) {
        if (ws.readyState !== 1) continue; // 1 = OPEN
        try { ws.send(frameBuf, { binary: true }); } catch { /* drop */ }
      }
    },
    async stop() {
      if (this.closed) return;
      this.closed = true;
      try { await cdp.send('Page.stopScreencast'); } catch { /* page already gone */ }
      try { await cdp.detach(); } catch { /* ignore */ }
      for (const ws of this.subs) {
        try { ws.close(1000, 'run_complete'); } catch { /* ignore */ }
      }
      this.subs.clear();
      broadcasters.delete(runId);
    },
  };

  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    // CDP ack — must respond OR new frames stop arriving.
    try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* CDP detached */ }
    // data is base64 JPEG; convert to Buffer for binary WS frame.
    try {
      const buf = Buffer.from(data, 'base64');
      broadcaster.broadcast(buf);
    } catch { /* ignore decode errors */ }
  });

  // Page may navigate / close — that's fine. We keep capturing on the
  // current target; CDP session survives same-page navigations.
  page.on('close', () => { broadcaster.stop().catch(() => {}); });

  try {
    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality,
      maxWidth,
      maxHeight,
      everyNthFrame: Math.max(1, Math.round(60 / fps)),
    });
  } catch (e) {
    console.warn(`[screencast ${runId}] startScreencast failed:`, e?.message || e);
    await broadcaster.stop();
    return () => {};
  }

  broadcasters.set(runId, broadcaster);
  console.log(`[screencast ${runId}] started — fps=${fps} q=${quality} ${maxWidth}x${maxHeight}`);
  return () => broadcaster.stop().catch(() => {});
}

/**
 * Subscribe a WebSocket to the per-run broadcaster.
 * If the run has no broadcaster (not running, or run finished), we close
 * the socket cleanly with a small text message.
 */
export function subscribeToRun(runId, ws) {
  const b = broadcasters.get(runId);
  if (!b) {
    try { ws.send(JSON.stringify({ type: 'no_active_broadcaster', runId })); } catch { /* ignore */ }
    try { ws.close(1000, 'no_active_broadcaster'); } catch { /* ignore */ }
    return false;
  }
  b.addSubscriber(ws);
  return true;
}

/**
 * Health/status for the /v1/health endpoint to expose live screencast counts.
 */
export function screencastStats() {
  return {
    active: broadcasters.size,
    by_run: Array.from(broadcasters.values()).map((b) => ({
      run_id: b.runId,
      subscribers: b.subs.size,
      frames_sent: b.framesSent,
      uptime_ms: Date.now() - b.startedAt,
    })),
  };
}
