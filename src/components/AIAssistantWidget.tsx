import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Zap, Clock, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface QuickAction {
  id: string;
  icon: typeof Sparkles;
  label: string;
  action: string;
}

/**
 * AI Assistant Widget - Floating bottom-right helper
 * SEPARATE from:
 * 1. AI Chat (/ai route) - Full-page conversational UI
 * 2. AI Insights Panel - Sidebar toggle with coming soon state
 */
export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const quickActions: QuickAction[] = [
    { id: 'optimize', icon: Sparkles, label: 'Optimize My Day', action: 'optimize-schedule' },
    { id: 'reschedule', icon: Clock, label: 'Reschedule Tasks', action: 'reschedule' },
    { id: 'suggest', icon: Target, label: 'Suggest Next Task', action: 'suggest-task' },
    { id: 'boost', icon: Zap, label: 'Energy Boost Tips', action: 'energy-tips' },
  ];

  const handleQuickAction = (action: string) => {
    // Context-aware quick help based on current page
    console.log('Quick action:', action);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    console.log('AI Assistant message:', message);
    setMessage('');
  };

  return (
    <>
      {/* Floating Button - Bottom Right */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Bot className="w-6 h-6 text-white" />
              {/* Pulse indicator */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Collapsible Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-32 md:bottom-24 right-6 w-[calc(100vw-3rem)] md:w-96 bg-[#1a1c20] border border-gray-700 rounded-2xl shadow-2xl z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center gap-3">
              <Bot className="w-5 h-5 text-white" />
              <div className="flex-1">
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-white/80">Context-aware quick help</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-800">
              <p className="text-xs text-gray-400 mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.action)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left group"
                    >
                      <Icon className="w-4 h-4 text-purple-400 group-hover:text-purple-300 flex-shrink-0" />
                      <span className="text-xs text-gray-300 group-hover:text-white">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-2">Ask me anything...</p>
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your question..."
                  className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-purple-600 hover:bg-purple-500 px-3"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                For full conversations, visit <span className="text-purple-400">AI Chat</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
