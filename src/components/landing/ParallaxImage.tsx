import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxImageProps {
  src: string;
  speed?: number;
  overlay?: string;
  className?: string;
}

export function ParallaxImage({
  src,
  speed = 0.3,
  overlay = 'rgba(9,9,11,0.55)',
  className = '',
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        image,
        { yPercent: -speed * 50 },
        {
          yPercent: speed * 50,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }, container);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        ref={imageRef}
        className="absolute inset-[-20%] bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div className="absolute inset-0" style={{ background: overlay }} />
    </div>
  );
}
