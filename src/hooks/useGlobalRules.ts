/**
 * useResponsive Hook
 * 
 * React hook for responsive breakpoint detection.
 * Returns current breakpoint and utility functions.
 * 
 * Usage:
 * const { isDesktop, isMobile, breakpoint, sidebarLayout } = useResponsive();
 */

import { useState, useEffect } from 'react';
import { BREAKPOINTS, getCurrentBreakpoint, isBreakpoint, getSidebarLayout } from '@/utils/global-rules';

export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<ReturnType<typeof getCurrentBreakpoint>>('lg');
  
  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };
    
    // Set initial breakpoint
    handleResize();
    
    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md' || breakpoint === 'lg',
    isDesktop: breakpoint === 'xl' || breakpoint === '2xl',
    
    // Specific breakpoint checks
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl',
    
    // Utilities
    sidebarLayout: getSidebarLayout(),
    showFullSidebar: isBreakpoint('xl'),
    showCompactSidebar: isBreakpoint('lg') && !isBreakpoint('xl'),
    showDrawerSidebar: !isBreakpoint('lg'),
  };
}

/**
 * useComingSoon Hook
 * 
 * Manages coming soon overlay state.
 * 
 * Usage:
 * const { showOverlay, openOverlay, closeOverlay } = useComingSoon();
 */

export function useComingSoon(initialState = false) {
  const [showOverlay, setShowOverlay] = useState(initialState);
  
  return {
    showOverlay,
    openOverlay: () => setShowOverlay(true),
    closeOverlay: () => setShowOverlay(false),
    toggleOverlay: () => setShowOverlay(prev => !prev),
  };
}

/**
 * useScrollLock Hook
 * 
 * Locks body scroll when modals/drawers are open.
 * Automatically unlocks when component unmounts.
 * 
 * Usage:
 * useScrollLock(isModalOpen);
 */

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [locked]);
}

/**
 * useKeyPress Hook
 * 
 * Detects keyboard shortcuts (e.g., ESC to close modal).
 * 
 * Usage:
 * useKeyPress('Escape', () => closeModal());
 */

export function useKeyPress(targetKey: string, handler: () => void) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        handler();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [targetKey, handler]);
}
