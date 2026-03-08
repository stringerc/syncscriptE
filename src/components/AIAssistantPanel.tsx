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
import { motion } from 'motion/react';
import { 
  Brain, Send, Sparkles, Settings, RefreshCw, MessageSquare,
  UserPlus
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useLocation } from 'react-router';
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
import { useAIInsightsRouting } from '../contexts/AIInsightsRoutingContext';
import { buildAgentDeepLink, buildRoutePrefix, normalizeRouteContext, routeContextFromUrl } from '../utils/ai-route';
import { useContinuity } from '../contexts/ContinuityContext';
import { showLocalAgentNotification } from '../pwa/push';
import { routeAgentRequest, buildAgentRoutedPrompt } from '../utils/agent-router';
import { buildChatThreadEnvelope } from '../utils/ai-thread-model';
import { buildResponseContractCards, sanitizeAssistantContent } from '../utils/ai-response-contract';
import { shouldShowPromptWithCadence, markPromptShown } from '../utils/prompt-cadence';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onOpenAIInsights?: () => void; // Callback to open/focus the Chat panel
  quickTalkStarter?: string | null;
  onQuickTalkConsumed?: () => void;
}

export function AIAssistantPanel({
  isOpen,
  onOpenAIInsights,
  quickTalkStarter,
  onQuickTalkConsumed,
}: AIAssistantPanelProps) {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [hubTab, setHubTab] = useState<'social' | 'nexus' | 'agents'>('nexus');
  const [socialTab, setSocialTab] = useState<'friends' | 'teammates' | 'collaboratives'>('friends');
  const { routeContext } = useAIInsightsRouting();
  const { queueAgentAction } = useContinuity();
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
  const welcomeCadenceKey = `ai-panel:welcome:${location.pathname}`;
  const shouldShowFullWelcome = shouldShowPromptWithCadence(welcomeCadenceKey, 10 * 60 * 1000);

  const buildPanelWelcome = () => {
    const base = generateWelcomeMessage(location.pathname);
    if (hubTab === 'social') {
      return 'Social mode active. I can help with friends, teammates, collaboratives, and handoff-ready updates.';
    }
    if (hubTab === 'agents') {
      return 'Agents mode active. I can route requests to specialists, explain confidence, and queue delegated actions.';
    }
    if (shouldShowFullWelcome) {
      markPromptShown(welcomeCadenceKey);
      return base;
    }
    return `Welcome back. Continuing ${pageContext.displayName.toLowerCase()} context.`;
  };

  const enrichAiResponse = (raw: any, routingDecision: any, threadEnvelope: any) => {
    const content = sanitizeAssistantContent(String(raw?.content || ''));
    return {
      ...raw,
      content,
      contractCards: buildResponseContractCards(content),
      routing: {
        agentId: routingDecision.agent.id,
        agentName: routingDecision.agent.name,
        confidence: routingDecision.confidence,
        reason: routingDecision.reason,
        threadId: threadEnvelope.threadId,
        threadType: threadEnvelope.threadType,
      },
    };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message when panel opens or page changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = buildPanelWelcome();
      setMessages([{
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
        quickReplies: pageContext.conversationStarters.slice(0, 3),
      }]);
    }
  }, [isOpen, location.pathname, hubTab]);

  // Reset conversation when page changes
  useEffect(() => {
    setMessages([]);
    const welcomeMessage = buildPanelWelcome();
    setMessages([{
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date(),
      quickReplies: pageContext.conversationStarters.slice(0, 3),
    }]);
  }, [location.pathname, hubTab]);

  const tabContextHint = (tab: 'social' | 'nexus' | 'agents') => {
    if (tab === 'social') return 'Mode: Social. Focus collaboration, friends, teammates, and handoffs.';
    if (tab === 'agents') return 'Mode: Agents. Focus specialist routing, delegation, and execution status.';
    return 'Mode: Nexus. Focus orchestration, planning, and contextual guidance.';
  };


  const sendMessageText = async (content: string) => {
    if (!content.trim()) return;
    const canonicalRoute = normalizeRouteContext(
      routeContext || routeContextFromUrl(location.pathname, location.search)
    );
    const routingDecision = routeAgentRequest(content, canonicalRoute);
    const threadEnvelope = buildChatThreadEnvelope(content, routingDecision.route);
    const routedPrefix = buildRoutePrefix(routingDecision.route);
    const userMessage = {
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      await queueAgentAction({
        routeKey: routedPrefix,
        prompt: userMessage.content,
      });
      const aiResponse = await processCommand(
        `${tabContextHint(hubTab)}\n${buildAgentRoutedPrompt(userMessage.content, routingDecision)}`
      );
      const enriched = enrichAiResponse(aiResponse, routingDecision, threadEnvelope);
      setMessages(prev => [...prev, enriched]);
      showLocalAgentNotification(
        'Agent replied',
        String(enriched?.content || '').slice(0, 140),
        buildAgentDeepLink(canonicalRoute),
      );
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
  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;
    const content = message;
    setMessage('');
    await sendMessageText(content);
  };

  useEffect(() => {
    if (!isOpen || !quickTalkStarter || isProcessing) return;
    onQuickTalkConsumed?.();
    // Keep dashboard interactions responsive: prefill quick-talk text
    // instead of auto-sending a potentially long-running AI command.
    setMessage(quickTalkStarter);
    queueMicrotask(() => {
      inputRef.current?.focus();
    });
  }, [isOpen, quickTalkStarter, isProcessing, onQuickTalkConsumed]);

  const handleQuickReply = async (reply: string) => {
    setMessage('');
    
    // Special handling for "Open the panel" quick reply
    if (reply.toLowerCase() === 'open the panel' && onOpenAIInsights) {
      onOpenAIInsights();
      const userMsg = { type: 'user', content: reply, timestamp: new Date() };
      const aiMsg = {
        type: 'ai',
        content: 'Chat panel is now open! Check out your personalized task and goal suggestions on the right side.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg, aiMsg]);
      toast.success('Chat panel opened', { description: 'View your personalized suggestions' });
      return;
    }
    
    const userMsg = { type: 'user', content: reply, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    try {
      const canonicalRoute = normalizeRouteContext(
        routeContext || routeContextFromUrl(location.pathname, location.search)
      );
      const routingDecision = routeAgentRequest(reply, canonicalRoute);
      const threadEnvelope = buildChatThreadEnvelope(reply, routingDecision.route);
      const aiResponse = await processCommand(
        `${tabContextHint(hubTab)}\n${buildAgentRoutedPrompt(reply, routingDecision)}`
      );
      setMessages(prev => [...prev, enrichAiResponse(aiResponse, routingDecision, threadEnvelope)]);
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
              <h3 className="text-white font-semibold text-sm">Chat Hub</h3>
              <p className="text-[10px] text-gray-400">
                {pageContext.displayName} • {energyData.current}% energy
                {routeContext?.agentName ? ` • Agent: ${routeContext.agentName}` : ''}
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
              <DropdownMenuLabel className="text-white">Chat Hub Settings</DropdownMenuLabel>
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

        <Tabs
          value={hubTab}
          onValueChange={(value) => setHubTab(value as 'social' | 'nexus' | 'agents')}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-3 bg-[#252830] border border-gray-700">
            <TabsTrigger value="social" className="text-[11px] data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
              Social
            </TabsTrigger>
            <TabsTrigger value="nexus" className="text-[11px] data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              Nexus
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-[11px] data-[state=active]:bg-teal-600/20 data-[state=active]:text-teal-300">
              Agents
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
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

      {hubTab === 'social' && (
        <div className="flex-shrink-0 border-b border-gray-800 px-4 py-3">
          <Tabs
            value={socialTab}
            onValueChange={(value) => setSocialTab(value as 'friends' | 'teammates' | 'collaboratives')}
          >
            <TabsList className="grid w-full grid-cols-3 bg-[#252830] border border-gray-700">
              <TabsTrigger value="friends" className="text-[11px] data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                Friends
              </TabsTrigger>
              <TabsTrigger value="teammates" className="text-[11px] data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                Teammates
              </TabsTrigger>
              <TabsTrigger value="collaboratives" className="text-[11px] data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                Collaboratives
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {hubTab === 'social' ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <Button
            type="button"
            onClick={() => toast.info('Friend invites are coming soon')}
            className="rounded-xl border border-blue-200/40 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-5 py-2 text-white shadow-[0_10px_30px_rgba(30,64,175,0.45)] ring-1 ring-inset ring-white/10 transition-all hover:from-slate-800 hover:via-blue-800 hover:to-indigo-800 hover:shadow-[0_12px_34px_rgba(37,99,235,0.55)] hover:scale-[1.01] font-semibold tracking-wide"
          >
            <UserPlus className="mr-2 h-4 w-4 text-blue-100" />
            Add Friend
          </Button>
        </div>
      ) : (
        <>
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

                    {msg.type === 'ai' && msg.routing && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-200">
                          {msg.routing.agentName}
                        </span>
                        <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-200">
                          {Math.round((msg.routing.confidence || 0) * 100)}%
                        </span>
                      </div>
                    )}

                    {msg.type === 'ai' && Array.isArray(msg.contractCards) && msg.contractCards.length > 0 && (
                      <div className="mt-2 grid gap-1.5">
                        {msg.contractCards.map((card: any, cardIdx: number) => (
                          <div key={`${card.kind}-${cardIdx}`} className="rounded-md border border-gray-700/80 bg-black/20 p-2">
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">{card.title}</p>
                            <p className="text-xs text-gray-200 whitespace-pre-wrap">{card.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                            onClick={() => {
                              // Special handling for "Open Chat Panel" action
                              if ((action.label === 'Open Chat Panel' || action.label === 'Open AI Insights Panel') && onOpenAIInsights) {
                                onOpenAIInsights();
                                toast.success('Chat panel opened', { description: 'View your personalized suggestions' });
                              } else if (action.handler) {
                                action.handler();
                              }
                            }}
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
        </>
      )}
    </div>
  );
}