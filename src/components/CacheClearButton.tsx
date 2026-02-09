/**
 * Cache Clear Button (Development Helper)
 * 
 * Helps users clear browser cache when experiencing issues
 * with old code being cached.
 */

import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function CacheClearButton() {
  const [clearing, setClearing] = useState(false);
  
  const handleClearCache = async () => {
    setClearing(true);
    
    try {
      // Clear service worker cache if it exists
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear localStorage (optional - be careful with this)
      // localStorage.clear();
      
      console.log('%c[Cache] All caches cleared!', 'color: #10b981; font-weight: bold');
      
      // Reload the page to get fresh code
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('[Cache] Error clearing caches:', error);
      setClearing(false);
    }
  };
  
  return (
    <button
      onClick={handleClearCache}
      disabled={clearing}
      className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all disabled:opacity-50"
      title="Clear cache and reload"
    >
      <RotateCcw className={`w-3 h-3 ${clearing ? 'animate-spin' : ''}`} />
      {clearing ? 'Clearing...' : 'Clear Cache'}
    </button>
  );
}
