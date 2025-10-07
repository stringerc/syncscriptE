import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Smooth page transition wrapper
 * Adds fade-in animation when navigating between pages
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fade-in' | 'fade-out'>('fade-in');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'fade-out') {
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fade-in');
      }, 150); // 150ms fade-out duration
      
      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location]);

  return (
    <div
      className={`transition-opacity duration-200 ${
        transitionStage === 'fade-in' ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}

/**
 * Stagger animation for lists
 * Use with array.map() to stagger child animations
 */
export function useStaggerAnimation(itemCount: number, delay: number = 50) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < itemCount) {
      const timeout = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [visibleCount, itemCount, delay]);

  return (index: number) => ({
    opacity: index < visibleCount ? 1 : 0,
    transform: index < visibleCount ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 300ms ease-out ${index * delay}ms, transform 300ms ease-out ${index * delay}ms`,
  });
}

