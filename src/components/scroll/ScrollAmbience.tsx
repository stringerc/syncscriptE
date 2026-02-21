import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Full-viewport fixed background layer that shifts colour palette as the user
 * scrolls through sections, eliminating hard colour boundaries between them.
 *
 * Uses two overlapping radial gradient orbs whose hue, position, and size are
 * driven by GSAP ScrollTrigger scrub — giving a continuous, buttery-smooth
 * colour morph that feels like the page itself is breathing.
 */
const PALETTE = [
  { h1: 200, s1: 80, l1: 45, h2: 170, s2: 70, l2: 40 },
  { h1: 190, s1: 75, l1: 42, h2: 260, s2: 55, l2: 38 },
  { h1: 175, s1: 70, l1: 40, h2: 220, s2: 60, l2: 42 },
  { h1: 260, s1: 50, l1: 38, h2: 200, s2: 70, l2: 45 },
  { h1: 195, s1: 80, l1: 44, h2: 165, s2: 65, l2: 40 },
];

export function ScrollAmbience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    h1: PALETTE[0].h1,
    s1: PALETTE[0].s1,
    l1: PALETTE[0].l1,
    h2: PALETTE[0].h2,
    s2: PALETTE[0].s2,
    l2: PALETTE[0].l2,
    x1: 0.25,
    y1: 0.2,
    r1: 0.55,
    x2: 0.75,
    y2: 0.7,
    r2: 0.5,
  });
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const state = stateRef.current;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(
        state.x1 * w,
        state.y1 * h,
        0,
        state.x1 * w,
        state.y1 * h,
        state.r1 * Math.max(w, h),
      );
      g1.addColorStop(
        0,
        `hsla(${state.h1}, ${state.s1}%, ${state.l1}%, 0.12)`,
      );
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        state.x2 * w,
        state.y2 * h,
        0,
        state.x2 * w,
        state.y2 * h,
        state.r2 * Math.max(w, h),
      );
      g2.addColorStop(
        0,
        `hsla(${state.h2}, ${state.s2}%, ${state.l2}%, 0.09)`,
      );
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    if (reducedMotion) {
      draw();
      cancelAnimationFrame(rafRef.current);
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-section]'),
    );

    const triggers: ScrollTrigger[] = [];

    sections.forEach((el, i) => {
      if (i >= PALETTE.length) return;
      const next = PALETTE[Math.min(i + 1, PALETTE.length - 1)];
      const nextPos = {
        x1: 0.2 + ((i + 1) % 3) * 0.25,
        y1: 0.15 + ((i + 1) % 2) * 0.35,
        r1: 0.45 + ((i + 1) % 2) * 0.15,
        x2: 0.8 - ((i + 1) % 3) * 0.2,
        y2: 0.65 - ((i + 1) % 2) * 0.2,
        r2: 0.4 + ((i + 1) % 3) * 0.1,
      };

      const tween = gsap.to(state, {
        h1: next.h1,
        s1: next.s1,
        l1: next.l1,
        h2: next.h2,
        s2: next.s2,
        l2: next.l2,
        ...nextPos,
        ease: 'none',
        paused: true,
      });

      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
          animation: tween,
        }),
      );
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      triggers.forEach((t) => t.kill());
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
