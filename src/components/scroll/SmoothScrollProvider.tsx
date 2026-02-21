import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollContextValue {
  scrollTo: (target: string | HTMLElement | number) => void;
  registerSection: (id: string, el: HTMLElement) => () => void;
}

const ScrollContext = createContext<ScrollContextValue>({
  scrollTo: () => {},
  registerSection: () => () => {},
});

export const useSmoothScroll = () => useContext(ScrollContext);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const sectionsRef = useRef(new Map<string, HTMLElement>());
  const snapTriggerRef = useRef<ScrollTrigger | null>(null);
  const rafRef = useRef(0);

  const rebuildSnap = useCallback(() => {
    snapTriggerRef.current?.kill();
    snapTriggerRef.current = null;

    const entries = Array.from(sectionsRef.current.values());
    if (entries.length < 2) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion) return;

    const totalScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll <= 0) return;

    const isMobile = window.innerWidth < 768;

    const points = entries
      .map((el) => el.offsetTop / totalScroll)
      .filter((v) => v >= 0 && v <= 1)
      .sort((a, b) => a - b);

    if (points.length < 2) return;

    snapTriggerRef.current = ScrollTrigger.create({
      snap: {
        snapTo: points,
        duration: isMobile
          ? { min: 0.2, max: 0.4 }
          : { min: 0.3, max: 0.6 },
        delay: 0.05,
        ease: 'power2.inOut',
      },
    });
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: !reducedMotion,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      snapTriggerRef.current?.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        requestAnimationFrame(rebuildSnap),
      );
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [rebuildSnap]);

  const registerSection = useCallback(
    (id: string, el: HTMLElement) => {
      sectionsRef.current.set(id, el);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        requestAnimationFrame(rebuildSnap),
      );
      return () => {
        sectionsRef.current.delete(id);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() =>
          requestAnimationFrame(rebuildSnap),
        );
      };
    },
    [rebuildSnap],
  );

  const scrollTo = useCallback(
    (target: string | HTMLElement | number) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target as Parameters<Lenis['scrollTo']>[0], {
          duration: 1.2,
        });
      }
    },
    [],
  );

  return (
    <ScrollContext.Provider value={{ scrollTo, registerSection }}>
      {children}
    </ScrollContext.Provider>
  );
}
