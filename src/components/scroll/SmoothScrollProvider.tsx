/**
 * SmoothScrollProvider — Native smooth scroll + GSAP triggers.
 *
 * No Lenis, no snap, no zoom, no JavaScript scroll manipulation.
 * CSS `scroll-behavior: smooth` on [data-marketing-root] handles
 * programmatic scrolls. GSAP ScrollTrigger observes native scroll
 * for entrance animations only.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
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
  const sectionsRef = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const onScroll = () => ScrollTrigger.update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const registerSection = useCallback(
    (id: string, el: HTMLElement) => {
      sectionsRef.current.set(id, el);
      return () => { sectionsRef.current.delete(id); };
    },
    [],
  );

  const scrollTo = useCallback(
    (target: string | HTMLElement | number) => {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else if (typeof target === 'string') {
        document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
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
