import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Whether the section content fades in on scroll entry */
  fadeIn?: boolean;
  /** Minimum height, defaults to 100vh */
  minHeight?: string;
}

export function ScrollSection({
  children,
  className = '',
  id,
  fadeIn = true,
  minHeight = '100vh',
}: ScrollSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!fadeIn || !sectionRef.current) return;

    const targets = sectionRef.current.querySelectorAll('[data-scroll-fade]');
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      targets.forEach((target) => {
        gsap.from(target, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: target,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [fadeIn]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`relative ${className}`}
      style={{ minHeight }}
    >
      {children}
    </section>
  );
}
