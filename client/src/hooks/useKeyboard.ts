import { useEffect } from 'react'

/**
 * Hook for handling keyboard shortcuts and navigation
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  } = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        ctrl = false,
        shift = false,
        alt = false,
        meta = false
      } = options

      if (
        event.key === key &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta
      ) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}

/**
 * Hook for arrow key navigation in lists
 */
export function useArrowNavigation(
  itemsLength: number,
  onSelect: (index: number) => void
) {
  useEffect(() => {
    let currentIndex = 0

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        currentIndex = Math.min(currentIndex + 1, itemsLength - 1)
        onSelect(currentIndex)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        currentIndex = Math.max(currentIndex - 1, 0)
        onSelect(currentIndex)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        onSelect(currentIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [itemsLength, onSelect])
}

/**
 * Trap focus within a modal/dialog
 */
export function useFocusTrap(elementRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !elementRef.current) return

    const element = elementRef.current
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleTab)
    }
  }, [elementRef, isActive])
}
