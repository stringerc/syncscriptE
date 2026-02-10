/**
 * FloatingAIChatWidget Component - Context-Aware AI Assistant
 * 
 * Features implemented:
 * ✅ Context-aware - Adapts to current page with relevant actions
 * ✅ Real data integration - Accesses actual tasks, goals, energy data
 * ✅ Page-specific quick actions - Different actions for each page
 * ✅ Smart conversation starters - Context-based suggestions
 * ✅ Proactive insights - Shows notification when relevant
 * ✅ Progressive disclosure - Shows most relevant features first
 * 
 * Research-based on:
 * - Microsoft Copilot's contextual intelligence
 * - Google Assistant's ambient computing
 * - Nielsen Norman Group's progressive disclosure
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Plus, Target, FileText, Search, Sparkles, Maximize2,
  TrendingUp, Zap, Calendar as CalendarIcon, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { useAI } from '../contexts/AIContext';
import { Badge } from './ui/badge';
import { getPageContext, generateWelcomeMessage, hasContextualInsights } from '../utils/ai-context-config';

export function FloatingAIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentPage,
    currentContext,
    processCommand,
    getContextualSuggestions,
    tasks,
    goals,
    energyData,
  } = useAI();

  // Get context-aware configuration
  const pageContext = getPageContext(location.pathname);
  const hasInsights = hasContextualInsights(location.pathname);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load welcome message when opening - Context aware!
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage(location.pathname);
      setMessages([{
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
        quickReplies: pageContext.conversationStarters.slice(0, 3),
      }]);
    }
  }, [isOpen, location.pathname]);

  // Use page-specific quick actions
  const quickActions = pageContext.quickActions.slice(0, 4).map(action => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    description: action.description,
    handler: async () => {
      if (action.type === 'create' && action.command.endsWith(' ')) {
        // For create actions, set the command for user to complete
        setMessage(action.command);
        toast.info('Complete your ' + action.label.toLowerCase());
      } else {
        // For other actions, execute immediately
        setIsProcessing(true);
        const response = await processCommand(action.command);
        setMessages(prev => [...prev, { type: 'user', content: action.command, timestamp: new Date() }, response]);
        setIsProcessing(false);
      }
    },
  }));

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;

    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const aiResponse = await processCommand(message);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast.error('Failed to process message');
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setMessage('');
      setIsProcessing(false);
    }
  };

  const handleOpenFullAI = () => {
    navigate('/ai');
    setIsOpen(false);
    toast.success('Opening AI Assistant', {
      description: 'Full conversation mode activated'
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center z-50 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow"
            data-nav="floating-ai-chat"
            aria-label="Open AI Chat"
          >
            <Sparkles className="w-6 h-6 text-white" />
            {/* Context awareness indicator */}
            {hasInsights && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#1e2128] border-l border-gray-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI Assistant</h3>
                    <p className="text-xs text-gray-400">
                      {pageContext.displayName} • {energyData.current}% energy
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Context Awareness Banner */}
              {pageContext.smartInsights.length > 0 && (
                <div className="p-3 bg-purple-600/10 border-b border-purple-600/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-300">
                      <p className="font-medium mb-1">{pageContext.displayName} insights:</p>
                      {pageContext.smartInsights.slice(0, 2).map((insight, i) => (
                        <p key={i} className="text-purple-400">• {insight}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions - Page Specific */}
              <div className="p-4 space-y-3 border-b border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Quick Actions for {pageContext.displayName}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.handler}
                        disabled={isProcessing}
                        className="flex flex-col items-center gap-2 p-3 bg-[#252830] border border-gray-700 rounded-lg hover:border-purple-600/50 hover:bg-[#2a2d35] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                          <Icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs text-white text-center">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.type === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`flex-1 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`rounded-lg p-3 max-w-[85%] ${
                        msg.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                          : 'bg-[#252830] border border-gray-700 text-gray-200'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Metrics */}
                        {msg.metrics && msg.metrics.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600 flex flex-wrap gap-2">
                            {msg.metrics.map((metric: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-gray-900/50 rounded">
                                <span className="text-xs text-gray-400">{metric.label}:</span>
                                <span className={`text-xs font-medium ${
                                  metric.status === 'success' ? 'text-green-400' :
                                  metric.status === 'warning' ? 'text-yellow-400' :
                                  metric.status === 'error' ? 'text-red-400' :
                                  'text-gray-300'
                                }`}>{metric.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600 flex flex-wrap gap-2">
                            {msg.actions.map((action: any, i: number) => (
                              <button
                                key={i}
                                onClick={action.handler}
                                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 rounded-lg text-xs text-purple-300 hover:text-purple-200 transition-colors"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Quick Reply Chips */}
                        {msg.quickReplies && msg.quickReplies.length > 0 && msg.type === 'ai' && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-xs text-gray-500 mb-2">Quick replies:</p>
                            <div className="flex flex-wrap gap-2">
                              {msg.quickReplies.map((reply: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={async () => {
                                    setMessage('');
                                    setMessages(prev => [...prev, { type: 'user', content: reply, timestamp: new Date() }]);
                                    setIsProcessing(true);
                                    try {
                                      const aiResponse = await processCommand(reply);
                                      setMessages(prev => [...prev, aiResponse]);
                                    } catch (error) {
                                      toast.error('Failed to process message');
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-full text-xs text-gray-300 hover:text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {reply}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Smart Suggestions - Context Aware */}
                {messages.length === 1 && !isProcessing && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Suggested for {pageContext.displayName}:</p>
                    <div className="space-y-2">
                      {pageContext.conversationStarters.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setMessage(suggestion)}
                          className="w-full text-left px-3 py-2 bg-[#252830] border border-gray-700 rounded-lg hover:border-purple-600/50 transition-colors text-sm text-gray-300 hover:text-white"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-800 space-y-3 bg-[#1a1d24]">
                {/* Command hint */}
                {message.startsWith('/') && (
                  <div className="text-xs text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Using smart command. Type /help for all commands</span>
                  </div>
                )}
                
                {/* Open Full AI Button */}
                <Button
                  onClick={handleOpenFullAI}
                  variant="outline"
                  className="w-full gap-2 border-purple-600/50 hover:border-purple-600 hover:bg-purple-600/10"
                >
                  <Maximize2 className="w-4 h-4" />
                  Open Full AI Assistant
                </Button>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message or /command..."
                    className="flex-1 bg-[#252830] border-gray-700 focus:border-purple-600"
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isProcessing}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Try /task, /goal, /schedule, or ask naturally
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}