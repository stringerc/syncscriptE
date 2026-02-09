import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      
      // Simulate voice transcription
      const mockTranscripts = [
        "Complete quarterly budget review and analysis",
        "Schedule team meeting to discuss project roadmap",
        "Review and approve design mockups for new feature",
        "Prepare presentation slides for client meeting",
      ];
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      onTranscript(transcript);
      toast.success('Voice transcribed', { 
        description: 'Your voice input has been converted to text' 
      });
    } else {
      // Start recording
      setIsRecording(true);
      toast.info('Recording started', { 
        description: 'Speak clearly into your microphone' 
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleRecording}
        disabled={disabled}
        className={`gap-2 ${isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : ''}`}
      >
        {isRecording ? (
          <>
            <MicOff className="w-4 h-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Voice Input
          </>
        )}
      </Button>

      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            {/* Animated Recording Dot */}
            <div className="flex items-center gap-2 bg-red-600/20 border border-red-600/30 rounded-full px-3 py-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="text-xs text-red-400 font-mono">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Waveform Animation */}
            <div className="flex items-center gap-0.5 h-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  animate={{
                    height: ['12px', '24px', '12px'],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
