import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    let mouseX = 0;
    let mouseY = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1, ease: 'power2.out' });
      gsap.to(follower, { x: mouseX, y: mouseY, duration: 0.35, ease: 'power2.out' });
    };

    const onEnterInteractive = () => {
      gsap.to(cursor, { scale: 0.5, opacity: 0.5, duration: 0.25 });
      gsap.to(follower, { scale: 1.8, opacity: 0.3, duration: 0.25 });
    };

    const onLeaveInteractive = () => {
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.25 });
      gsap.to(follower, { scale: 1, opacity: 0.4, duration: 0.25 });
    };

    window.addEventListener('mousemove', onMove);

    const interactiveEls = document.querySelectorAll('a, button, [data-cursor-hover]');
    interactiveEls.forEach((el) => {
      el.addEventListener('mouseenter', onEnterInteractive);
      el.addEventListener('mouseleave', onLeaveInteractive);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      interactiveEls.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterInteractive);
        el.removeEventListener('mouseleave', onLeaveInteractive);
      });
    };
  }, []);

  const isTouchDevice = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  if (isTouchDevice) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          width: 8,
          height: 8,
          marginLeft: -4,
          marginTop: -4,
          borderRadius: '50%',
          backgroundColor: '#e2e8f0',
        }}
      />
      <div
        ref={followerRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: '50%',
          border: '1px solid rgba(226, 232, 240, 0.3)',
          opacity: 0.4,
        }}
      />
    </>
  );
}
