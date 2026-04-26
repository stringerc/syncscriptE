/**
 * Off-main-thread canvas painter for the Nexus Agent live view.
 *
 * Runs in a Web Worker. The main thread `transferControlToOffscreen`s the
 * <canvas> element to us once, then posts ArrayBuffer JPEG frames as they
 * arrive over the WebSocket. We `createImageBitmap` (decode is async, off
 * main thread) and `drawImage` to the OffscreenCanvas.
 *
 * Net effect: zero JPEG decode + drawImage cost on the main thread during
 * an agent run. User typing / scrolling stays buttery even at 12fps draws.
 *
 * Browser support: Safari 16.4+ (Mar 2023), Chrome 69+, Edge 79+, Firefox 105+.
 * Main thread uses `OffscreenCanvas in window` to feature-detect; falls back
 * to in-place rendering when not supported.
 */

interface InitMessage { type: 'init'; canvas: OffscreenCanvas; }
interface FrameMessage { type: 'frame'; frame: ArrayBuffer; }
interface ResetMessage { type: 'reset'; }
type WorkerInbound = InitMessage | FrameMessage | ResetMessage;

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

let pendingFrame: ArrayBuffer | null = null;
let scheduled = false;

async function paint(): Promise<void> {
  scheduled = false;
  const buf = pendingFrame;
  pendingFrame = null;
  if (!buf || !canvas || !ctx) return;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(new Blob([buf], { type: 'image/jpeg' }));
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
    }
    ctx.drawImage(bitmap, 0, 0);
    self.postMessage({ type: 'frame_drawn', width: bitmap.width, height: bitmap.height });
  } catch {
    /* corrupt / unsupported frame — drop silently */
  } finally {
    bitmap?.close?.();
  }
}

self.onmessage = (ev: MessageEvent<WorkerInbound>) => {
  const msg = ev.data;
  if (msg.type === 'init') {
    canvas = msg.canvas;
    // 'desynchronized' hints to the browser that low-latency presentation is
    // OK — fewer compositor frames blocked on canvas updates. Per Chrome's
    // OffscreenCanvas best-practices doc.
    ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    return;
  }
  if (msg.type === 'reset') {
    pendingFrame = null;
    scheduled = false;
    return;
  }
  if (msg.type === 'frame') {
    pendingFrame = msg.frame;
    if (!scheduled) {
      scheduled = true;
      // OffscreenCanvas has its own rAF scheduling — use it so we paint at
      // the worker's animation rate (matches main-thread display).
      if (typeof self.requestAnimationFrame === 'function') {
        self.requestAnimationFrame(() => { paint().catch(() => {}); });
      } else {
        // Worker context without rAF — paint in microtask
        Promise.resolve().then(() => { paint().catch(() => {}); });
      }
    }
  }
};
