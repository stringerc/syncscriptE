import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
}

export function TextReveal({
  children,
  as: Tag = 'h2',
  className = '',
  start = 'top 85%',
  end = 'top 35%',
  scrub = true,
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const words = children.split(' ');
    el.innerHTML = words
      .map((w) => `<span class="inline-block overflow-hidden"><span class="tr-word inline-block" style="transform: translateY(100%); opacity: 0">${w}</span></span>`)
      .join(' ');

    const wordEls = el.querySelectorAll('.tr-word');

    const ctx = gsap.context(() => {
      gsap.to(wordEls, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.04,
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: scrub === true ? 1 : scrub || undefined,
          toggleActions: scrub ? undefined : 'play none none reverse',
        },
      });
    });

    return () => ctx.revert();
  }, [children, start, end, scrub]);

  return (
    <Tag
      ref={containerRef as React.RefObject<any>}
      className={className}
      style={{ fontFamily: 'var(--landing-font)' }}
    />
  );
}
