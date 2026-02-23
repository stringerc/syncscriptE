/**
 * ScrollSection — cinematic entrance animation container.
 *
 * Mont-fort-inspired philosophy:
 *   - NO snap, NO forced viewport heights, NO zoom hacks
 *   - Content breathes at its natural size
 *   - GSAP ScrollTrigger fires a one-shot entrance animation
 *   - Registers with SmoothScrollProvider for dots nav
 *
 * The whitespace comes from generous padding in the content,
 * not from forcing sections to fill the viewport.
 */
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
  fullHeight = true,
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

    const unregister = registerSection(id, el);

    let st: ScrollTrigger | undefined;
    if (tlRef.current && !revealedRef.current) {
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          tlRef.current?.play();
        },
      });

      // Ensure ScrollTrigger recalculates positions after layout settles
      requestAnimationFrame(() => ScrollTrigger.refresh());

      // Safety fallback: if the animation hasn't played after 3s, force reveal.
      // Prevents content from being permanently hidden if ScrollTrigger glitches.
      const fallback = setTimeout(() => {
        if (!revealedRef.current && tlRef.current) {
          tlRef.current.progress(1);
          revealedRef.current = true;
          el.setAttribute('data-revealed', 'true');
        }
      }, 3000);

      return () => {
        clearTimeout(fallback);
        unregister();
        st?.kill();
      };
    }

    return () => {
      unregister();
      st?.kill();
    };
  }, [id, registerSection]);

  return (
    <div
      ref={ref}
      data-section={id}
      className={`relative ${fullHeight ? 'marketing-snap-section' : ''} ${snap ? 'marketing-snap-align' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
