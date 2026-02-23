import gsap from 'gsap';
import type { AnimationFactory } from './ScrollSection';

const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < 768;

function q(container: HTMLElement, sel: string) {
  return Array.from(container.querySelectorAll<HTMLElement>(sel));
}

function heading(c: HTMLElement) {
  return c.querySelector<HTMLElement>('h1, h2, h3');
}

function subtext(c: HTMLElement) {
  const h = heading(c);
  if (!h) return q(c, 'p').slice(0, 2);
  const parent = h.parentElement;
  if (!parent) return [];
  return q(parent, 'p').slice(0, 2);
}

function cards(c: HTMLElement) {
  const grid = c.querySelector('.grid');
  return grid ? Array.from(grid.children) as HTMLElement[] : [];
}

function media(c: HTMLElement) {
  return q(c, 'img, video');
}

export const parallaxReveal: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const m = media(container);

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 80 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power2.out' },
    0.15);
  }
  if (m.length) {
    tl.fromTo(m,
      { opacity: 0, y: 60, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 1.2, ease: 'power2.out' },
    0.25);
  }

  return tl;
};

export const textSplitReveal: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const c = cards(container);

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 100, skewY: 3 },
      { opacity: 1, y: 0, skewY: 0, duration: 1, ease: 'power4.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: 'power2.out' },
    0.2);
  }
  if (c.length) {
    tl.fromTo(c,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' },
    0.3);
  }

  return tl;
};

export const cardCascade: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const c = cards(container);

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out' },
    0.1);
  }
  if (c.length) {
    const extra = isMobile() ? {} : { rotateX: -8, transformOrigin: 'center bottom' };
    const extraTo = isMobile() ? {} : { rotateX: 0 };
    tl.fromTo(c,
      { opacity: 0, y: 100, ...extra },
      { opacity: 1, y: 0, ...extraTo, stagger: 0.1, duration: 0.9, ease: 'power3.out' },
    0.25);
  }

  return tl;
};

export const splitScreen: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);

  const grid = container.querySelector('.grid');
  const cols = grid ? (Array.from(grid.children) as HTMLElement[]) : [];
  const left = cols[0];
  const right = cols[1];

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
    0);
  }
  if (left) {
    tl.fromTo(left,
      { opacity: 0, x: isMobile() ? 0 : -80, y: isMobile() ? 40 : 0 },
      { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power3.out' },
    0.15);
  }
  if (right) {
    tl.fromTo(right,
      { opacity: 0, x: isMobile() ? 0 : 80, y: isMobile() ? 40 : 0 },
      { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power3.out' },
    0.15);
  }

  return tl;
};

export const blurToSharp: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const c = cards(container);
  const m = media(container);
  const targets = [...c, ...m];

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: 'power2.out' },
    0.15);
  }
  if (targets.length) {
    tl.fromTo(targets,
      { opacity: 0, scale: 0.94, y: 20 },
      { opacity: 1, scale: 1, y: 0, stagger: 0.08, duration: 0.9, ease: 'power2.out' },
    0.25);
  }

  return tl;
};

export const cardElevate: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const c = cards(container);

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out' },
    0.1);
  }
  if (c.length) {
    tl.fromTo(c,
      { opacity: 0, y: 120, boxShadow: '0 0 0 rgba(0,0,0,0)' },
      { opacity: 1, y: 0, boxShadow: '', stagger: 0.08, duration: 1, ease: 'back.out(1.2)' },
    0.2);
  }

  return tl;
};

export const timelineProgress: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const items = q(container, '.space-y-8 > *, .space-y-4 > *, .grid > *');

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out' },
    0.1);
  }
  if (items.length) {
    tl.fromTo(items,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out' },
    0.25);
  }

  const line = container.querySelector(
    '[class~="w-px"], [data-scroll-line]',
  );
  if (line) {
    tl.fromTo(line as HTMLElement,
      { scaleY: 0, transformOrigin: 'top center' },
      { scaleY: 1, duration: 1.2, ease: 'power2.inOut' },
    0.2);
  }

  return tl;
};

export const waveGrid: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const c = cards(container);

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
    0);
  }
  if (c.length) {
    c.forEach((card, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const delay = (row + col) * 0.06;
      tl.fromTo(card,
        { opacity: 0, y: 60, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
      0.2 + delay);
    });
  }

  return tl;
};

export const convergenceZoom: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const sub = subtext(container);
  const btns = q(container, 'button, a[href]');

  if (h) {
    tl.fromTo(h,
      { opacity: 0, scale: 0.85, y: 60 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power3.out' },
    0);
  }
  if (sub.length) {
    tl.fromTo(sub,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.8, ease: 'power2.out' },
    0.2);
  }
  if (btns.length) {
    tl.fromTo(btns,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
    0.4);
  }

  return tl;
};

export const staggerAlternate: AnimationFactory = (container) => {
  const tl = gsap.timeline({ paused: true });
  const h = heading(container);
  const items = q(container, '.space-y-4 > *, .space-y-2 > *');

  if (h) {
    tl.fromTo(h,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    0);
  }
  if (items.length) {
    items.forEach((item, i) => {
      const fromLeft = i % 2 === 0;
      tl.fromTo(item,
        { opacity: 0, x: fromLeft ? -30 : 30 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
      0.2 + i * 0.06);
    });
  }

  return tl;
};
