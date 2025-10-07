import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Zap, Calendar, Target, TrendingUp, Send, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAssistantModalProps {
  open: boolean;
  onClose: () => void;
  context?: 'home' | 'do' | 'plan' | 'manage';
  currentEnergy?: string;
}

const contextPrompts = {
  home: [
    '💡 What should I focus on today?',
    '📊 Analyze my productivity trends',
    '⚡ Suggest tasks for my current energy',
  ],
  do: [
    '🎯 Help me prioritize my tasks',
    '🔥 What tasks match my energy level?',
    '📝 Create a task template',
  ],
  plan: [
    '📅 Find the best time for a meeting',
    '🕐 Suggest optimal schedule for this week',
    '⏰ When am I most productive?',
  ],
  manage: [
    '💰 Review my budget',
    '👥 Suggest collaboration opportunities',
    '📈 Analyze my spending patterns',
  ],
};

const mockSuggestions = [
  {
    icon: <Zap className="w-5 h-5 text-green-600" />,
    title: 'Energy-Matched Tasks',
    description: 'You have 3 HIGH-priority tasks perfect for your current PEAK energy',
    action: 'View Tasks',
  },
  {
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    title: 'Schedule Optimization',
    description: 'I found 2 open PEAK slots this week for your strategic work',
    action: 'Auto-Schedule',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
    title: 'Productivity Boost',
    description: 'Your 10am-12pm window has 95% task completion rate',
    action: 'Learn More',
  },
  {
    icon: <Target className="w-5 h-5 text-orange-600" />,
    title: 'Weekly Goal',
    description: 'You\'re 85% toward your 100-task monthly goal. Keep it up!',
    action: 'View Progress',
  },
];

export function AIAssistantModal({ open, onClose, context = 'home', currentEnergy }: AIAssistantModalProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);

  const prompts = contextPrompts[context] || contextPrompts.home;

  const handleSend = () => {
    if (!input.trim()) return;

    console.log('🤖 AI Query:', input);
    
    // Add user message
    setConversation(prev => [...prev, { role: 'user', message: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `Based on your ${currentEnergy || 'HIGH'} energy, I recommend focusing on your strategic tasks first.`,
        `I've analyzed your patterns - you're most productive between 9-11am. Let's schedule important work there!`,
        `Great question! I suggest completing 3 tasks today to maintain your 14-day streak.`,
        `I can help with that! Would you like me to create a custom task template?`,
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setConversation(prev => [...prev, { role: 'ai', message: randomResponse }]);
    }, 500);

    setInput('');
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    handleSend();
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    toast({
      title: isListening ? '🎤 Mic Off' : '🎤 Listening...',
      description: isListening ? 'Voice input stopped' : 'Speak your question',
      duration: 2000,
    });
    
    // TODO: Integrate Web Speech API
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader 
          className="p-6 pb-4 text-white"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(147 51 234), rgb(219 39 119))' }}
        >
          <DialogTitle className="flex items-center gap-3 text-2xl text-white">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)' }}
            >
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-bold">SyncScript AI</div>
              <div className="text-sm font-normal" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Your intelligent assistant
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            AI-powered assistant for task management, scheduling, and productivity insights
          </DialogDescription>
        </DialogHeader>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 max-h-96">
          {conversation.length === 0 ? (
            /* Welcome state */
            <div className="text-center py-8 space-y-6">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))' }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">How can I help you today?</h3>
                <p className="text-gray-600">Ask me anything about your tasks, schedule, or productivity</p>
              </div>
              
              {/* Quick prompts */}
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Suggestions */}
              <div className="space-y-3 mt-8">
                <h4 className="text-sm font-semibold text-gray-700">Suggested Actions:</h4>
                {mockSuggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm mb-1">{suggestion.title}</div>
                      <div className="text-xs text-gray-600">{suggestion.description}</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      {suggestion.action}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation */
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className="max-w-lg p-4 rounded-lg"
                    style={msg.role === 'user' 
                      ? { backgroundImage: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))', color: 'white' }
                      : { backgroundColor: 'white', border: '1px solid rgb(229 231 235)', color: 'rgb(17 24 39)' }
                    }
                  >
                    <div className="flex items-start gap-2">
                      {msg.role === 'ai' && <Bot className="w-5 h-5 text-purple-600 flex-shrink-0" />}
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything... (or try voice input)"
              className="flex-1"
            />
            <Button
              onClick={handleVoiceInput}
              variant="outline"
              size="icon"
              className={isListening ? 'bg-red-100 border-red-300' : ''}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'text-red-600' : ''}`} />
            </Button>
            <Button 
              onClick={handleSend} 
              className="text-white border-0"
              style={{ backgroundImage: 'linear-gradient(to right, rgb(147 51 234), rgb(219 39 119))' }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send</span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 rounded">⌘K</kbd> to open from anywhere
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

