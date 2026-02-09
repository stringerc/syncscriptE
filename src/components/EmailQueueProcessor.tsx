// =====================================================================
// EMAIL QUEUE PROCESSOR
// Background processor for scheduled emails (runs every 5 minutes)
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function EmailQueueProcessor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const MAX_FAILURES = 3;
  
  useEffect(() => {
    // Process queue after 30 seconds on mount (not immediately to avoid startup spam)
    const initialDelay = setTimeout(() => {
      processQueue();
    }, 30000); // 30 second initial delay
    
    // Then every 10 minutes (reduced frequency to avoid unnecessary requests)
    intervalRef.current = setInterval(() => {
      processQueue();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  const processQueue = async () => {
    try {
      // Check if projectId and publicAnonKey are available
      if (!projectId || !publicAnonKey) {
        console.warn('[Email Queue] Missing Supabase configuration, skipping processing');
        return;
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout (server has 25s + network buffer)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/process-queue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // Only log when emails were actually processed
        if (data.processed > 0) {
          console.log(`[Email Queue] ✅ Processed ${data.processed} emails`);
        }
        // Reset failure counter on success
        setConsecutiveFailures(0);
      } else {
        // Handle non-OK responses
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`[Email Queue] Processing returned ${response.status}: ${errorText}`);
        
        setConsecutiveFailures(prev => prev + 1);
        
        // If we've failed too many times, stop processing temporarily
        if (consecutiveFailures >= MAX_FAILURES) {
          console.error(`[Email Queue] Too many consecutive failures (${MAX_FAILURES}), pausing processing`);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }
    } catch (error) {
      // Handle different error types gracefully
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Timeout is normal if server is processing heavy workload - don't spam console
          // Only warn if we've had multiple consecutive timeouts
          if (consecutiveFailures >= 1) {
            console.warn('[Email Queue] Multiple request timeouts detected - server may be overloaded');
          }
          // Silent otherwise - timeouts are normal during email processing
        } else if (error.message.includes('Failed to fetch')) {
          // Network errors are normal when offline - only log first occurrence
          if (consecutiveFailures === 0) {
            console.log('[Email Queue] Network unavailable (this is normal if offline or server is starting)');
          }
        } else {
          console.warn('[Email Queue] Processing failed:', error.message);
        }
      } else {
        console.warn('[Email Queue] Processing failed:', error);
      }
      
      setConsecutiveFailures(prev => prev + 1);
      
      // If we've failed too many times, stop processing temporarily
      if (consecutiveFailures >= MAX_FAILURES) {
        console.error(`[Email Queue] ⚠️ Too many consecutive failures (${MAX_FAILURES}), will retry in 15 minutes`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Retry after 15 minutes
        setTimeout(() => {
          console.log('[Email Queue] Retrying after pause...');
          setConsecutiveFailures(0);
          processQueue();
          
          // Restart interval
          intervalRef.current = setInterval(() => {
            processQueue();
          }, 10 * 60 * 1000);
        }, 15 * 60 * 1000);
      }
    }
  };
  
  // This component doesn't render anything
  return null;
}
