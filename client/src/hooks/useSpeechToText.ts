import { useState, useEffect, useRef, useCallback } from 'react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { useToast } from '@/hooks/use-toast'

interface SpeechToTextOptions {
  continuous?: boolean
  language?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

interface SpeechToTextHook {
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSupported: boolean
  error: string | null
  hasPermission: boolean | null
  startListening: () => Promise<void>
  stopListening: () => void
  resetTranscript: () => void
}

/**
 * Hook for Speech-to-Text functionality
 * Uses Web Speech API with permission handling and retry logic
 */
export function useSpeechToText(options: SpeechToTextOptions = {}): SpeechToTextHook {
  const {
    continuous = false,
    language = 'en-US',
    onResult,
    onError
  } = options

  const { isFlagEnabled } = useFeatureFlags()
  const { toast } = useToast()
  
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // Check if mic feature is enabled
  const isEnabled = isFlagEnabled('mic')

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported || !isEnabled) return

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = language
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started')
        setIsListening(true)
        setError(null)
        retryCountRef.current = 0
      }

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript

          if (result.isFinal) {
            final += text + ' '
          } else {
            interim += text
          }
        }

        if (final) {
          setTranscript(prev => prev + final)
          setInterimTranscript('')
          if (onResult) onResult(final.trim(), true)
        } else if (interim) {
          setInterimTranscript(interim)
          if (onResult) onResult(interim, false)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error)
        
        let errorMessage = 'Speech recognition error'
        
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.'
            setHasPermission(false)
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            // Don't set error for this, just retry
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              setTimeout(() => {
                if (recognitionRef.current) {
                  recognitionRef.current.start()
                }
              }, 1000)
              return
            }
            break
          case 'audio-capture':
            errorMessage = 'No microphone found. Please connect a microphone.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          case 'aborted':
            // User stopped, don't show error
            return
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }

        setError(errorMessage)
        setIsListening(false)
        
        if (onError) onError(errorMessage)
        
        toast({
          title: 'Microphone Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended')
        setIsListening(false)
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err)
      setError('Failed to initialize speech recognition')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [isSupported, isEnabled, continuous, language, onResult, onError, toast])

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop immediately after permission
      setHasPermission(true)
      return true
    } catch (err: any) {
      console.error('Microphone permission denied:', err)
      setHasPermission(false)
      
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Microphone permission denied. Please enable microphone access in your browser settings.'
        : 'Unable to access microphone. Please check your device settings.'
      
      setError(errorMessage)
      toast({
        title: 'Permission Required',
        description: errorMessage,
        variant: 'destructive'
      })
      
      return false
    }
  }, [toast])

  // Start listening
  const startListening = useCallback(async () => {
    if (!isSupported) {
      const msg = 'Speech recognition is not supported in your browser'
      setError(msg)
      toast({
        title: 'Not Supported',
        description: msg,
        variant: 'destructive'
      })
      return
    }

    if (!isEnabled) {
      const msg = 'Microphone feature is not enabled'
      setError(msg)
      toast({
        title: 'Feature Disabled',
        description: msg
      })
      return
    }

    // Request permission if not already granted
    if (hasPermission === null || hasPermission === false) {
      const granted = await requestPermission()
      if (!granted) return
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setError(null)
      } catch (err: any) {
        // Already started, ignore
        if (err.message.includes('already started')) {
          return
        }
        console.error('Failed to start recognition:', err)
        setError('Failed to start speech recognition')
      }
    }
  }, [isSupported, isEnabled, isListening, hasPermission, requestPermission, toast])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    hasPermission,
    startListening,
    stopListening,
    resetTranscript
  }
}
