import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSmoothScroll } from './SmoothScrollProvider';

gsap.registerPlugin(ScrollTrigger);

export type AnimationFactory = (container: HTMLElement) => gsap.core.Timeline;

interface ScrollSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  animation?: AnimationFactory;
  snap?: boolean;
  fullHeight?: boolean;
}

const REDUCED_MOTION = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ScrollSection({
  id,
  children,
  className = '',
  animation,
  snap = true,
  fullHeight = false,
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerSection } = useSmoothScroll();
  const animRef = useRef(animation);
  animRef.current = animation;
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const revealedRef = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !animRef.current || REDUCED_MOTION()) return;

    tlRef.current = animRef.current(el);

    tlRef.current.eventCallback('onComplete', () => {
      revealedRef.current = true;
      el.setAttribute('data-revealed', 'true');
    });

    tlRef.current.pause();

    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let unregister: (() => void) | undefined;
    if (snap) {
      unregister = registerSection(id, el);
    }

    let st: ScrollTrigger | undefined;
    if (tlRef.current && !revealedRef.current) {
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        animation: tlRef.current,
      });
    }

    return () => {
      unregister?.();
      st?.kill();
    };
  }, [id, snap, registerSection]);

  const heightClass = fullHeight
    ? 'min-h-screen flex flex-col justify-center pb-20'
    : '';

  return (
    <div
      ref={ref}
      data-section={id}
      className={`relative ${heightClass} ${className}`}
    >
      {children}
    </div>
  );
}
