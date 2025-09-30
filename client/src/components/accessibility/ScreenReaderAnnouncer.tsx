import { useEffect, useRef } from 'react'

interface ScreenReaderAnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
}

/**
 * Screen Reader Announcer Component
 * Announces messages to screen readers using ARIA live regions
 */
export function ScreenReaderAnnouncer({ message, priority = 'polite' }: ScreenReaderAnnouncerProps) {
  const liveRegionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message && liveRegionRef.current) {
      // Clear and re-announce to ensure screen reader picks it up
      liveRegionRef.current.textContent = ''
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message
        }
      }, 100)
    }
  }, [message])

  return (
    <div
      ref={liveRegionRef}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0
      }}
    />
  )
}

/**
 * Global announcer hook
 */
export function useScreenReaderAnnouncer() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('global-announcer')
    if (announcer) {
      announcer.setAttribute('aria-live', priority)
      announcer.textContent = ''
      setTimeout(() => {
        announcer.textContent = message
      }, 100)
    }
  }

  return { announce }
}

/**
 * Global Announcer - Mount once in App
 */
export function GlobalScreenReaderAnnouncer() {
  return (
    <div
      id="global-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0
      }}
    />
  )
}
