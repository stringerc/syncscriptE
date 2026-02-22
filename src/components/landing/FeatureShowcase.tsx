import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

interface FeatureShowcaseProps {
  features: Feature[];
}

export function FeatureShowcase({ features }: FeatureShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const pin = pinRef.current;
    if (!container || !pin) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: `+=${features.length * 100}%`,
        pin: pin,
        scrub: 1,
        onUpdate: (self) => {
          const idx = Math.min(
            features.length - 1,
            Math.floor(self.progress * features.length),
          );
          setActiveIndex(idx);
        },
      });
    }, container);

    return () => ctx.revert();
  }, [features.length]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${features.length * 100}vh` }}
      className="relative"
    >
      <div
        ref={pinRef}
        className="h-screen flex items-center justify-center overflow-hidden"
        style={{ fontFamily: 'var(--landing-font)' }}
      >
        <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: numbering + title */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {features.map((_, i) => (
                <button
                  key={i}
                  className="relative w-10 h-10 rounded-full transition-all duration-500"
                  style={{
                    border: `1px solid ${i === activeIndex ? 'var(--landing-accent)' : 'var(--landing-border)'}`,
                    background: i === activeIndex ? 'rgba(79,140,232,0.1)' : 'transparent',
                  }}
                >
                  <span
                    className="text-sm font-medium transition-colors duration-500"
                    style={{
                      color: i === activeIndex ? 'var(--landing-accent)' : 'var(--landing-text-dim)',
                      fontFamily: 'var(--landing-font)',
                    }}
                  >
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-h-[220px]">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-all duration-700"
                  style={{
                    opacity: i === activeIndex ? 1 : 0,
                    transform: `translateY(${i === activeIndex ? 0 : 20}px)`,
                  }}
                >
                  <p
                    className="text-sm uppercase tracking-[0.15em] mb-4"
                    style={{ color: 'var(--landing-accent)' }}
                  >
                    {feature.subtitle}
                  </p>
                  <h3
                    className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight mb-6"
                    style={{ color: 'var(--landing-text)', letterSpacing: '0.02em' }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-base sm:text-lg leading-relaxed max-w-md"
                    style={{ color: 'var(--landing-text-muted)' }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: icon / visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-square">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center transition-all duration-700"
                  style={{
                    opacity: i === activeIndex ? 1 : 0,
                    transform: `scale(${i === activeIndex ? 1 : 0.9})`,
                  }}
                >
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(79, 140, 232, 0.06)',
                      border: '1px solid var(--landing-border)',
                    }}
                  >
                    {feature.icon}
                  </div>
                </div>
              ))}
              {/* Orbital ring decoration */}
              <div
                className="absolute inset-[-20%] rounded-full"
                style={{
                  border: '1px solid var(--landing-border)',
                }}
              />
              <div
                className="absolute inset-[-40%] rounded-full"
                style={{
                  border: '1px solid rgba(255,255,255,0.03)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-px bg-white/5">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${((activeIndex + 1) / features.length) * 100}%`,
              background: 'var(--landing-accent)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
