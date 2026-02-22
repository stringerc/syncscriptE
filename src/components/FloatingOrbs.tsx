import { useEffect, useRef, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

/* ═══════════════════════════════════════════════════════════════════════════
 *  "Through the noise, find your resonance."
 *
 *  Color philosophy:
 *    Resonance = BRIGHT saturated cool tones (the harmony)
 *    ~60% noise = dimmer cool tones (fragments of the harmony)
 *    ~25% noise = warm accents (foreign chaos)
 *    ~15% noise = neutral cool whites (depth)
 *
 *  Route-aware intensity:
 *    Landing & Pricing → resonance boosted, noise dimmed (darker layouts)
 *    Features & FAQ    → unchanged (content provides natural contrast)
 *
 *  Architecture:
 *    6 Resonance → framer-motion DOM (easeInOut)
 *    83 Noise + 5 Flyby → single <canvas> (zero lag)
 * ═══════════════════════════════════════════════════════════════════════════ */

function prng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

/* ── Layer 1: Resonance (DOM / framer-motion) ───────────────────────────── */

interface ResonanceOrb {
  color: string; size: number; blur: number; opacity: number;
  x: number; y: number;
  driftX: number[]; driftY: number[]; scale: number[];
  duration: number; delay: number;
}

function figure8(rx: number, ry: number, tilt: number, points = 12) {
  const driftX: number[] = [];
  const driftY: number[] = [];
  const scale: number[] = [];
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const rawX = rx * Math.sin(t);
    const rawY = ry * Math.sin(2 * t) * 0.5;
    driftX.push(Math.round(rawX * cosT - rawY * sinT));
    driftY.push(Math.round(rawX * sinT + rawY * cosT));
    scale.push(1 + 0.1 * Math.sin(t * 2));
  }
  return { driftX, driftY, scale };
}

const RESONANCE: ResonanceOrb[] = [
  { color: 'rgba(56,228,248,0.82)', size: 480, blur: 70, opacity: 0.40, x: 40, y: 36, ...figure8(150, 100, 0), duration: 24, delay: 0 },
  { color: 'rgba(72,232,210,0.78)', size: 420, blur: 72, opacity: 0.36, x: 44, y: 40, ...figure8(130, 110, Math.PI / 3), duration: 28, delay: 2 },
  { color: 'rgba(145,155,252,0.70)', size: 380, blur: 74, opacity: 0.30, x: 42, y: 38, ...figure8(160, 90, (2 * Math.PI) / 3), duration: 22, delay: 4 },
  { color: 'rgba(183,158,255,0.66)', size: 340, blur: 70, opacity: 0.27, x: 46, y: 42, ...figure8(120, 120, Math.PI / 6), duration: 30, delay: 1 },
  { color: 'rgba(80,235,175,0.72)', size: 300, blur: 65, opacity: 0.28, x: 43, y: 37, ...figure8(140, 100, (5 * Math.PI) / 6), duration: 26, delay: 3 },
  { color: 'rgba(82,210,255,0.72)', size: 260, blur: 55, opacity: 0.24, x: 45, y: 41, ...figure8(110, 130, Math.PI / 2), duration: 32, delay: 5 },
];

function ResonanceEl({ o, boost, blurScale }: { o: ResonanceOrb; boost: number; blurScale: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: o.size, height: o.size,
        left: `${o.x}%`, top: `${o.y}%`,
        background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
        filter: `blur(${Math.round(o.blur * blurScale)}px)`,
        opacity: Math.min(o.opacity * boost, 1),
        mixBlendMode: 'screen', willChange: 'transform',
        transition: 'opacity 0.8s ease, filter 0.8s ease',
      }}
      animate={{ x: o.driftX, y: o.driftY, scale: o.scale }}
      transition={{ duration: o.duration, repeat: Infinity, ease: 'linear', delay: o.delay }}
    />
  );
}

/* ── Canvas particle system ─────────────────────────────────────────────── */

const NOISE_RGB: [number, number, number][] = [
  [6, 182, 212], [20, 184, 166], [14, 165, 233], [99, 102, 241],
  [16, 185, 129], [56, 189, 248], [45, 212, 191],
  [249, 145, 55], [245, 130, 32], [236, 100, 75],
  [190, 210, 235], [170, 195, 225],
];

const FLYBY_RGB: [number, number, number][] = [
  [34, 211, 238], [167, 139, 250], [45, 212, 191], [56, 189, 248], [249, 145, 55],
];

function createSprite(r: number, g: number, b: number): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.7)`);
  grad.addColorStop(0.8, `rgba(${r},${g},${b},0.15)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

interface Particle {
  sprite: HTMLCanvasElement;
  drawSize: number;
  opacity: number;
  cx: number; cy: number;
  ax1: number; fx1: number; px1: number;
  ax2: number; fx2: number; px2: number;
  ay1: number; fy1: number; py1: number;
  ay2: number; fy2: number; py2: number;
}

interface FlybyP {
  sprite: HTMLCanvasElement;
  x0: number; y0: number; x1: number; y1: number;
  sizeStart: number; sizePeak: number; sizeEnd: number;
  opacityPeak: number;
  duration: number; pause: number; delay: number;
}

function buildSystem() {
  const rand = prng(42_007);

  const noiseSprites = NOISE_RGB.map(([r, g, b]) => createSprite(r, g, b));
  const flybySprites = FLYBY_RGB.map(([r, g, b]) => createSprite(r, g, b));

  const pickWeighted = (): HTMLCanvasElement => {
    const r = rand();
    if (r < 0.60) return noiseSprites[Math.floor(rand() * 7)];
    if (r < 0.85) return noiseSprites[7 + Math.floor(rand() * 3)];
    return noiseSprites[10 + Math.floor(rand() * 2)];
  };

  const particles: Particle[] = [];
  const TAU = Math.PI * 2;

  // Streaks — gentle drifts, not aggressive traversals
  for (let i = 0; i < 25; i++) {
    particles.push({
      sprite: pickWeighted(),
      drawSize: lerp(50, 130, rand()),
      opacity: lerp(0.22, 0.48, rand()),
      cx: lerp(0.15, 0.85, rand()), cy: lerp(0.15, 0.85, rand()),
      ax1: lerp(0.12, 0.30, rand()), fx1: lerp(0.04, 0.12, rand()), px1: rand() * TAU,
      ax2: lerp(0.03, 0.08, rand()), fx2: lerp(0.08, 0.22, rand()), px2: rand() * TAU,
      ay1: lerp(0.12, 0.30, rand()), fy1: lerp(0.04, 0.12, rand()), py1: rand() * TAU,
      ay2: lerp(0.03, 0.08, rand()), fy2: lerp(0.08, 0.22, rand()), py2: rand() * TAU,
    });
  }

  // Orbital — slower, calmer circles
  for (let i = 0; i < 18; i++) {
    const radius = lerp(0.25, 0.45, rand());
    const speed = lerp(0.03, 0.08, rand());
    const phase = rand() * TAU;
    particles.push({
      sprite: pickWeighted(),
      drawSize: lerp(60, 150, rand()),
      opacity: lerp(0.20, 0.42, rand()),
      cx: 0.5, cy: 0.5,
      ax1: radius, fx1: speed, px1: phase,
      ax2: lerp(0.01, 0.04, rand()), fx2: lerp(0.15, 0.4, rand()), px2: rand() * TAU,
      ay1: radius, fy1: speed, py1: phase,
      ay2: lerp(0.01, 0.04, rand()), fy2: lerp(0.15, 0.4, rand()), py2: rand() * TAU,
    });
  }

  // Scattered — gentle ambient drift
  for (let i = 0; i < 40; i++) {
    particles.push({
      sprite: pickWeighted(),
      drawSize: lerp(30, 80, rand()),
      opacity: lerp(0.16, 0.38, rand()),
      cx: lerp(-0.08, 1.08, rand()), cy: lerp(-0.08, 1.08, rand()),
      ax1: lerp(0.02, 0.08, rand()), fx1: lerp(0.03, 0.10, rand()), px1: rand() * TAU,
      ax2: lerp(0.01, 0.05, rand()), fx2: lerp(0.06, 0.18, rand()), px2: rand() * TAU,
      ay1: lerp(0.02, 0.08, rand()), fy1: lerp(0.03, 0.10, rand()), py1: rand() * TAU,
      ay2: lerp(0.01, 0.05, rand()), fy2: lerp(0.06, 0.18, rand()), py2: rand() * TAU,
    });
  }

  // Flybys — fewer, slower, longer pauses between
  const flybys: FlybyP[] = [];
  for (let i = 0; i < 3; i++) {
    const fromLeft = rand() > 0.5;
    flybys.push({
      sprite: flybySprites[i % flybySprites.length],
      x0: fromLeft ? lerp(-0.15, 0.05, rand()) : lerp(0.95, 1.15, rand()),
      y0: lerp(0.15, 0.85, rand()),
      x1: fromLeft ? lerp(0.95, 1.15, rand()) : lerp(-0.15, 0.05, rand()),
      y1: lerp(0.15, 0.85, rand()),
      sizeStart: lerp(10, 22, rand()),
      sizePeak: lerp(140, 320, rand()),
      sizeEnd: lerp(400, 700, rand()),
      opacityPeak: lerp(0.25, 0.45, rand()),
      duration: lerp(7, 12, rand()),
      pause: lerp(30, 50, rand()),
      delay: lerp(5, 25, rand()),
    });
  }

  return { particles, flybys };
}

/* ── Canvas renderer (reads noiseFade ref each frame) ───────────────────── */

function useNoiseCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  noiseFadeRef: React.RefObject<number>,
) {
  const system = useMemo(() => buildSystem(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const { particles, flybys } = system;
    let raf = 0;
    let currentFade = noiseFadeRef.current;
    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 30; // Cap at 30fps — plenty for ambient bg

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);

      if (document.hidden) return;
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      const t = now * 0.001;

      // Smooth transition toward the target fade value (~0.6s ease)
      const target = noiseFadeRef.current;
      currentFade += (target - currentFade) * 0.03;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Noise particles — skip if effectively invisible
      if (currentFade > 0.01) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const alpha = p.opacity * currentFade;
          if (alpha < 0.02) continue;
          const px = (p.cx + p.ax1 * Math.sin(p.fx1 * t + p.px1) + p.ax2 * Math.cos(p.fx2 * t + p.px2)) * w;
          const py = (p.cy + p.ay1 * Math.cos(p.fy1 * t + p.py1) + p.ay2 * Math.sin(p.fy2 * t + p.py2)) * h;
          const s = p.drawSize;
          ctx.globalAlpha = alpha;
          ctx.drawImage(p.sprite, px - s * 0.5, py - s * 0.5, s, s);
        }
      }

      // Flyby particles — NOT faded (they use resonance colors, cinematic)
      for (let i = 0; i < flybys.length; i++) {
        const f = flybys[i];
        const cycle = f.duration + f.pause;
        const elapsed = t - f.delay;
        if (elapsed < 0) continue;
        const local = elapsed % cycle;
        if (local > f.duration) continue;
        const progress = local / f.duration;

        const fx = lerp(f.x0, f.x1, progress) * w;
        const fy = lerp(f.y0, f.y1, progress) * h;

        const size = progress < 0.45
          ? lerp(f.sizeStart, f.sizePeak, progress / 0.45)
          : lerp(f.sizePeak, f.sizeEnd, (progress - 0.45) / 0.55);

        const opacity = progress < 0.35
          ? lerp(0, f.opacityPeak, progress / 0.35)
          : lerp(f.opacityPeak, 0, (progress - 0.35) / 0.65);

        ctx.globalAlpha = opacity;
        ctx.drawImage(f.sprite, fx - size * 0.5, fy - size * 0.5, size, size);
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, noiseFadeRef, system]);
}

/* ── Main export ────────────────────────────────────────────────────────── */

export function FloatingOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pathname } = useLocation();
  const [deferred, setDeferred] = useState(false);

  // Defer canvas init until after first content paint
  useEffect(() => {
    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 800);
    const id = schedule(() => setDeferred(true));
    return () => {
      if (typeof cancelIdleCallback === 'function' && typeof id === 'number') {
        cancelIdleCallback(id);
      }
    };
  }, []);

  const heroPage = pathname === '/' || pathname === '/pricing';
  const noiseFade = heroPage ? 0.2 : 0.45;

  const noiseFadeRef = useRef(noiseFade);
  noiseFadeRef.current = noiseFade;

  useNoiseCanvas(deferred ? canvasRef : { current: null }, noiseFadeRef);

  if (!deferred) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}
      />
    </div>
  );
}
