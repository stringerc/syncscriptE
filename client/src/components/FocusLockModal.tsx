import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Pause, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFocusTrap } from '@/hooks/useAccessibility'
import { useToast } from '@/hooks/use-toast'

interface FocusLockModalProps {
  isActive: boolean
  challengeTitle: string
  targetDuration: number // minutes
  onComplete: (duration: number, partialCredit: boolean) => void
  onPause: () => void
  onResume: () => void
  onEmergencyExit: () => void
}

/**
 * Focus Lock Modal - Blocks app except for controls
 * Implements keyboard trap with emergency exit
 */
export function FocusLockModal({
  isActive,
  challengeTitle,
  targetDuration,
  onComplete,
  onPause,
  onResume,
  onEmergencyExit
}: FocusLockModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Focus trap
  useFocusTrap(isActive, modalRef)

  // Timer logic
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        
        // Auto-complete when target reached
        if (next >= targetDuration * 60) {
          handleComplete(false)
          return prev
        }
        
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, targetDuration])

  // Autosave on unmount/unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && elapsedSeconds > 0) {
        e.preventDefault()
        e.returnValue = 'Your focus session is in progress. Are you sure you want to leave?'
        
        // Autosave progress
        localStorage.setItem('focus-lock-autosave', JSON.stringify({
          challengeTitle,
          elapsedSeconds,
          targetDuration,
          timestamp: Date.now()
        }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isActive, elapsedSeconds, challengeTitle, targetDuration])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar = pause/resume
      if (e.code === 'Space') {
        e.preventDefault()
        handlePauseResume()
      }
      
      // Escape = show emergency exit confirmation
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowEmergencyConfirm(true)
      }

      // Enter on confirmation = confirm emergency exit
      if (e.key === 'Enter' && showEmergencyConfirm) {
        e.preventDefault()
        handleEmergencyExit()
      }

      // Prevent navigation away
      if (e.ctrlKey || e.metaKey) {
        if (['w', 't', 'n'].includes(e.key.toLowerCase())) {
          e.preventDefault()
          toast({
            title: 'Focus Lock Active',
            description: 'Navigation disabled during focus session. Use Emergency Exit if needed.',
            variant: 'destructive'
          })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isPaused, showEmergencyConfirm])

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      onResume()
      toast({
        title: 'Focus Resumed',
        description: 'Keep going! You\'re doing great.'
      })
    } else {
      setIsPaused(true)
      onPause()
      toast({
        title: 'Focus Paused',
        description: 'Take a breath. Resume when ready.'
      })
    }
  }

  const handleComplete = (manual: boolean) => {
    const partialCredit = elapsedSeconds < targetDuration * 60
    onComplete(elapsedSeconds / 60, partialCredit)
    
    toast({
      title: partialCredit ? 'Partial Credit Awarded' : 'Challenge Complete! 🎉',
      description: partialCredit 
        ? `Great effort! You completed ${Math.floor(elapsedSeconds / 60)} of ${targetDuration} minutes.`
        : `Amazing! You completed the full ${targetDuration}-minute focus session.`
    })
  }

  const handleEmergencyExit = () => {
    // Save partial credit
    const partialCredit = true
    onEmergencyExit()
    
    toast({
      title: 'Emergency Exit',
      description: `Progress saved: ${Math.floor(elapsedSeconds / 60)} minutes completed.`,
      variant: 'destructive'
    })

    setShowEmergencyConfirm(false)
  }

  if (!isActive) return null

  const progress = (elapsedSeconds / (targetDuration * 60)) * 100
  const minutesElapsed = Math.floor(elapsedSeconds / 60)
  const secondsElapsed = elapsedSeconds % 60

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-lock-title"
      aria-describedby="focus-lock-description"
    >
      <div 
        ref={modalRef}
        className="max-w-md w-full mx-4"
        tabIndex={-1}
      >
        <Card className="p-8 bg-gradient-to-br from-blue-900 to-purple-900 text-white border-blue-700">
          {/* Challenge Title */}
          <div className="text-center mb-8">
            <h2 id="focus-lock-title" className="text-2xl font-bold mb-2">
              🔒 Focus Lock Active
            </h2>
            <p id="focus-lock-description" className="text-blue-200 text-sm">
              {challengeTitle}
            </p>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <div className="text-6xl font-mono font-bold mb-2">
              {minutesElapsed.toString().padStart(2, '0')}:{secondsElapsed.toString().padStart(2, '0')}
            </div>
            <p className="text-blue-300 text-sm">
              of {targetDuration} minutes
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-3" />
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Pause/Resume */}
            <Button
              onClick={handlePauseResume}
              className="w-full h-12 text-lg"
              variant={isPaused ? 'default' : 'secondary'}
              aria-label={isPaused ? 'Resume focus session' : 'Pause focus session'}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Resume (Space)
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause (Space)
                </>
              )}
            </Button>

            {/* End Session */}
            <Button
              onClick={() => handleComplete(true)}
              className="w-full"
              variant="outline"
              aria-label="End focus session and save progress"
            >
              End Session
            </Button>

            {/* Emergency Exit */}
            {!showEmergencyConfirm ? (
              <Button
                onClick={() => setShowEmergencyConfirm(true)}
                className="w-full text-yellow-500 border-yellow-500 hover:bg-yellow-500/10"
                variant="outline"
                aria-label="Emergency exit from focus lock"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Exit (Esc)
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-yellow-300 text-sm text-center font-medium">
                  Are you sure? Progress will be saved.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleEmergencyExit}
                    className="bg-red-600 hover:bg-red-700"
                    aria-label="Confirm emergency exit"
                  >
                    Yes, Exit
                  </Button>
                  <Button
                    onClick={() => setShowEmergencyConfirm(false)}
                    variant="outline"
                    aria-label="Cancel emergency exit"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          {isPaused && (
            <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/50">
              <p className="text-yellow-200 text-sm text-center">
                ⏸️ Session paused. Resume when ready.
              </p>
            </div>
          )}

          {/* Keyboard Hints */}
          <div className="mt-6 pt-6 border-t border-blue-700">
            <p className="text-xs text-blue-300 text-center">
              Keyboard: Space (pause/resume) • Esc (emergency exit)
            </p>
          </div>
        </Card>

        {/* ARIA live region for timer announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {elapsedSeconds % 300 === 0 && elapsedSeconds > 0 
            ? `${minutesElapsed} minutes completed` 
            : ''}
        </div>
      </div>
    </div>
  )
}
