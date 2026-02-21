import { useEffect, useRef, useState } from 'react';
import { useSmoothScroll } from './SmoothScrollProvider';

export function SectionIndicator() {
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-section]'),
    ).sort((a, b) => a.offsetTop - b.offsetTop);

    setSections(els);

    if (els.length < 2) return;

    const ratios = new Map<HTMLElement, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          ratios.set(e.target as HTMLElement, e.intersectionRatio);
        });

        let maxRatio = 0;
        let maxIdx = 0;
        els.forEach((el, i) => {
          const r = ratios.get(el) || 0;
          if (r > maxRatio) {
            maxRatio = r;
            maxIdx = i;
          }
        });
        setActiveIdx(maxIdx);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    els.forEach((el) => observerRef.current!.observe(el));

    const onScroll = () => {
      if (window.scrollY > 100) setVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2.5 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {sections.map((el, i) => {
        const sectionId = el.getAttribute('data-section') || `section-${i}`;
        const isActive = i === activeIdx;

        return (
          <button
            key={sectionId}
            onClick={() => scrollTo(el)}
            aria-label={`Go to section ${sectionId}`}
            aria-current={isActive ? 'true' : undefined}
            className="group relative flex items-center justify-end"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-3 h-3 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                  : 'w-2 h-2 bg-white/25 group-hover:bg-white/50'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
