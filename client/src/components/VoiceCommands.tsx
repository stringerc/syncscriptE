import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Zap
} from 'lucide-react';
import { analytics } from '@/services/analytics';

interface VoiceCommand {
  id: string;
  command: string;
  action: string;
  executed: boolean;
  timestamp: Date;
}

const VoiceCommands: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        analytics.trackFeatureUsage('voice_commands', 'started_listening');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript);

        if (finalTranscript) {
          processCommand(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        analytics.trackError('voice_recognition_error', { error: event.error });
      };

      recognition.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');
      };
    }

    // Load recent commands from localStorage
    const savedCommands = localStorage.getItem('voice-commands');
    if (savedCommands) {
      setCommands(JSON.parse(savedCommands));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    setCurrentTranscript('');

    // Simulate command processing
    const newCommand: VoiceCommand = {
      id: Date.now().toString(),
      command,
      action: 'Processing...',
      executed: false,
      timestamp: new Date()
    };

    setCommands(prev => [newCommand, ...prev.slice(0, 9)]); // Keep last 10 commands

    // Simulate AI processing
    setTimeout(() => {
      const action = getCommandAction(command);
      setCommands(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, action, executed: true }
            : cmd
        )
      );
      setIsProcessing(false);
      analytics.trackFeatureUsage('voice_commands', 'command_executed', { command, action });
    }, 1500);
  };

  const getCommandAction = (command: string): string => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('create task') || lowerCommand.includes('add task')) {
      return 'Creating new task...';
    } else if (lowerCommand.includes('schedule') || lowerCommand.includes('meeting')) {
      return 'Scheduling event...';
    } else if (lowerCommand.includes('check calendar') || lowerCommand.includes('what\'s next')) {
      return 'Opening calendar...';
    } else if (lowerCommand.includes('energy') || lowerCommand.includes('how am i doing')) {
      return 'Checking energy levels...';
    } else if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      return 'Showing available commands...';
    } else {
      return 'Command not recognized';
    }
  };

  const clearCommands = () => {
    setCommands([]);
    localStorage.removeItem('voice-commands');
    analytics.trackFeatureUsage('voice_commands', 'cleared_history');
  };

  // Save commands to localStorage whenever commands change
  useEffect(() => {
    localStorage.setItem('voice-commands', JSON.stringify(commands));
  }, [commands]);

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-500" />
            Voice Commands
          </CardTitle>
          <CardDescription>
            Voice recognition is not supported in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Voice commands require a modern browser with speech recognition support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-500" />
          Voice Commands
        </CardTitle>
        <CardDescription>
          Control SyncScript with your voice using natural language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Voice Control */}
          <div className="text-center">
            <div className="mb-4">
              <Button
                size="lg"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-20 h-20 rounded-full ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {isListening ? 'Listening...' : 'Click to start voice command'}
            </p>
            
            {currentTranscript && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  "{currentTranscript}"
                </p>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>

          {/* Available Commands */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Available Commands
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "Create task [description]",
                "Schedule meeting [title]",
                "Check my calendar",
                "What's my energy level?",
                "Show my tasks",
                "Help me prioritize"
              ].map((command, index) => (
                <Badge key={index} variant="outline" className="text-xs p-2">
                  "{command}"
                </Badge>
              ))}
            </div>
          </div>

          {/* Recent Commands */}
          {commands.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Recent Commands</h4>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearCommands}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commands.map((cmd) => (
                  <div key={cmd.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {cmd.executed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        "{cmd.command}"
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {cmd.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {cmd.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCommands;
