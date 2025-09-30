import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useSpeechToText } from '@/hooks/useSpeechToText'

interface SpeechToTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
  className?: string
  label?: string
}

/**
 * Input/Textarea with Speech-to-Text button
 * Press and hold to record, release to stop
 */
export function SpeechToTextInput({
  value,
  onChange,
  placeholder = 'Type or use voice input...',
  multiline = true,
  rows = 4,
  className = '',
  label
}: SpeechToTextInputProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [editableTranscript, setEditableTranscript] = useState('')

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    hasPermission,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText({
    continuous: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        // Append final transcript to current value
        const newValue = value ? `${value} ${text}` : text
        onChange(newValue)
      }
    }
  })

  // Handle mouse/touch down
  const handleMouseDown = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsPressed(true)
    await startListening()
  }

  // Handle mouse/touch up
  const handleMouseUp = () => {
    setIsPressed(false)
    stopListening()
  }

  // Handle mouse leave (stop if pressed and mouse leaves button)
  const handleMouseLeave = () => {
    if (isPressed) {
      setIsPressed(false)
      stopListening()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [isListening, stopListening])

  // Update editable transcript when it changes
  useEffect(() => {
    if (transcript) {
      setEditableTranscript(transcript)
    }
  }, [transcript])

  if (!isSupported) {
    // Fallback to regular input
    return multiline ? (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
    ) : (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      
      <div className="relative">
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`pr-14 ${className}`}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`pr-14 ${className}`}
          />
        )}

        {/* Mic Button */}
        <div className="absolute top-2 right-2">
          <Button
            type="button"
            variant={isListening ? 'default' : 'outline'}
            size="icon"
            className={`h-8 w-8 transition-all ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : isPressed 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : ''
            }`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            title={
              hasPermission === false 
                ? 'Microphone permission denied' 
                : isListening 
                ? 'Release to stop recording' 
                : 'Press and hold to record'
            }
            disabled={hasPermission === false}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-3 w-3 animate-spin text-red-600" />
          <span className="text-red-600 font-medium">Listening...</span>
          {interimTranscript && (
            <Badge variant="secondary" className="text-xs">
              {interimTranscript}
            </Badge>
          )}
        </div>
      )}

      {hasPermission === false && (
        <p className="text-xs text-destructive">
          Microphone permission denied. Please enable it in your browser settings.
        </p>
      )}

      {/* Instructions */}
      {!isListening && hasPermission !== false && (
        <p className="text-xs text-muted-foreground">
          💡 Press and hold the microphone button to speak
        </p>
      )}

      {/* Editable Transcript (if available) */}
      {editableTranscript && !isListening && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Voice Transcript (Editable)</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(editableTranscript)
                resetTranscript()
                setEditableTranscript('')
              }}
            >
              Apply
            </Button>
          </div>
          <Textarea
            value={editableTranscript}
            onChange={(e) => setEditableTranscript(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>
      )}
    </div>
  )
}
