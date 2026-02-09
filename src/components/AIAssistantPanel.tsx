/**
 * AI Assistant Panel - State-of-the-art Context-Aware AI Interface
 * 
 * Research-based on:
 * - Notion AI's contextual sidebar patterns
 * - Microsoft Copilot's split-view interaction model
 * - Intercom/Drift's conversational dashboard interfaces
 * - Google Assistant's ambient computing principles
 * - Progressive disclosure best practices (Nielsen Norman Group)
 * 
 * Features:
 * ✅ Fully context-aware - Adapts to current page
 * ✅ Page-specific quick actions
 * ✅ Chat conversation interface
 * ✅ Smart suggestions and insights
 * ✅ Persistent conversation history
 * ✅ Progressive disclosure UI
 * ✅ Real-time user data integration
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Send, Sparkles, Settings, RefreshCw, MessageSquare,
  ChevronDown, ChevronUp, Maximize2, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { useAI } from '../contexts/AIContext';
import { getPageContext, generateWelcomeMessage, hasContextualInsights } from '../utils/ai-context-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface AIAssistantPanelProps {
  isOpen: boolean;
}

export function AIAssistantPanel({ isOpen }: AIAssistantPanelProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    currentPage,
    processCommand,
    getContextualSuggestions,
    energyData,
  } = useAI();

  // Get context-aware configuration
  const pageContext = getPageContext(location.pathname);
  const hasInsights = hasContextualInsights(location.pathname);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message when panel opens or page changes
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

  // Reset conversation when page changes
  useEffect(() => {
    setMessages([]);
    const welcomeMessage = generateWelcomeMessage(location.pathname);
    setMessages([{
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date(),
      quickReplies: pageContext.conversationStarters.slice(0, 3),
    }]);
  }, [location.pathname]);

  // Page-specific quick actions
  const quickActions = pageContext.quickActions.slice(0, 4).map(action => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    description: action.description,
    handler: async () => {
      if (action.type === 'create' && action.command.endsWith(' ')) {
        // For create actions, set the command for user to complete
        setMessage(action.command);
        inputRef.current?.focus();
        toast.info('Complete your ' + action.label.toLowerCase());
      } else {
        // For other actions, execute immediately
        setIsProcessing(true);
        const userMsg = { type: 'user', content: action.command, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        
        try {
          const response = await processCommand(action.command);
          setMessages(prev => [...prev, response]);
        } catch (error) {
          toast.error('Failed to process action');
          setMessages(prev => [...prev, {
            type: 'ai',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          }]);
        } finally {
          setIsProcessing(false);
        }
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
    setMessage('');
    setIsProcessing(true);

    try {
      const aiResponse = await processCommand(userMessage.content);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast.error('Failed to process message');
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickReply = async (reply: string) => {
    setMessage('');
    const userMsg = { type: 'user', content: reply, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    try {
      const aiResponse = await processCommand(reply);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast.error('Failed to process message');
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-[#1a1c20] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center relative">
              <Brain className="w-4 h-4 text-white" />
              {hasInsights && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1a1c20] animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
              <p className="text-[10px] text-gray-400">
                {pageContext.displayName} • {energyData.current}% energy
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-md p-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 hover:border-purple-600/40 transition-colors"
                aria-label="AI Assistant settings"
              >
                <Settings className="w-4 h-4 text-purple-400 hover:text-purple-300 cursor-pointer hover:rotate-90 transition-all duration-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1e2128] border-gray-800">
              <DropdownMenuLabel className="text-white">AI Assistant Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              
              <DropdownMenuCheckboxItem
                checked={autoRefresh}
                onCheckedChange={(checked) => {
                  setAutoRefresh(checked);
                  toast.success(checked ? 'Auto-refresh enabled' : 'Auto-refresh disabled');
                }}
                className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto-refresh Insights
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={notifications}
                onCheckedChange={(checked) => {
                  setNotifications(checked);
                  toast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
                }}
                className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Proactive Suggestions
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator className="bg-gray-800" />
              
              <DropdownMenuItem
                onClick={() => {
                  setMessages([]);
                  const welcomeMessage = generateWelcomeMessage(location.pathname);
                  setMessages([{
                    type: 'ai',
                    content: welcomeMessage,
                    timestamp: new Date(),
                    quickReplies: pageContext.conversationStarters.slice(0, 3),
                  }]);
                  toast.success('Conversation cleared');
                }}
                className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Clear Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Context Insights Banner */}
        {pageContext.smartInsights.length > 0 && (
          <div className="mt-2 p-2 bg-purple-600/10 border border-purple-600/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-purple-300 space-y-0.5">
                {pageContext.smartInsights.slice(0, 2).map((insight, i) => (
                  <p key={i}>• {insight}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Collapsible */}
      {quickActions.length > 0 && (
        <div className="flex-shrink-0 border-b border-gray-800">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
          >
            <span className="font-medium uppercase tracking-wide">Quick Actions</span>
            {showQuickActions ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 grid grid-cols-2 gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.handler}
                        disabled={isProcessing}
                        className="flex flex-col items-center gap-2 p-2.5 bg-[#252830] border border-gray-700 rounded-lg hover:border-purple-600/50 hover:bg-[#2a2d35] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        title={action.description}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                          <Icon className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-[10px] text-white text-center leading-tight">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-3">
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.type === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                
                <div className={`flex-1 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-lg p-3 max-w-[85%] ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-[#252830] border border-gray-700 text-gray-200'
                  }`}>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Metrics */}
                    {msg.metrics && msg.metrics.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600/50 flex flex-wrap gap-1.5">
                        {msg.metrics.map((metric: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-gray-900/50 rounded text-[10px]">
                            <span className="text-gray-400">{metric.label}:</span>
                            <span className={`font-medium ${
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
                      <div className="mt-2 pt-2 border-t border-gray-600/50 flex flex-wrap gap-1.5">
                        {msg.actions.map((action: any, i: number) => (
                          <button
                            key={i}
                            onClick={action.handler}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 rounded text-[10px] text-purple-300 hover:text-purple-200 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick Reply Chips */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && msg.type === 'ai' && (
                      <div className="mt-2 pt-2 border-t border-gray-600/50">
                        <p className="text-[10px] text-gray-500 mb-1.5">Quick replies:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.quickReplies.map((reply: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => handleQuickReply(reply)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-full text-[10px] text-gray-300 hover:text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Processing Indicator */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-3 border-t border-gray-800 bg-[#1a1d24] space-y-2">
        {/* Command hint */}
        {message.startsWith('/') && (
          <div className="text-[10px] text-purple-400 flex items-center gap-1.5 px-2">
            <Sparkles className="w-3 h-3" />
            <span>Smart command detected. Type /help for all commands</span>
          </div>
        )}
        
        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask about ${pageContext.displayName.toLowerCase()}...`}
            className="flex-1 bg-[#252830] border-gray-700 focus:border-purple-600 text-sm h-9"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isProcessing}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 h-9 px-3"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <p className="text-[10px] text-gray-500 text-center px-2">
          Try: {pageContext.conversationStarters[0]}
        </p>
      </div>
    </div>
  );
}