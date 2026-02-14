import { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Brain, Send, Mic, Sparkles, TrendingUp, Zap, Target,
  MessageSquare, BarChart3, Lightbulb, AlertCircle, CheckCircle2,
  Clock, Calendar, Activity, Award, BookOpen, Settings, History
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSection';
import { useAI } from '../../contexts/AIContext';
import { useOpenClaw } from '../../contexts/OpenClawContext'; // PHASE 1: OpenClaw Integration

export function AIAssistantPage() {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'insights' | 'analytics'>('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // PHASE 1: OpenClaw Integration
  const { 
    sendMessage: sendOpenClawMessage, 
    transcribeVoice,
    getMemories,
    queryMemory,
    isInitialized, 
    isProcessing: isOpenClawProcessing 
  } = useOpenClaw();
  
  // Voice recording state (moved to ConversationalInterface component)
  
  // PHASE 2: Memory state
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  
  // AI Settings state
  const [aiSettings, setAiSettings] = useState({
    responseStyle: 'balanced',
    contextAwareness: true,
    proactiveInsights: true,
    voiceInput: false,
    responseSpeed: 50,
    detailLevel: 60,
  });

  // AI Insights specific to AI Assistant page - Research-backed metrics only
  // Using useMemo to prevent re-creation on every render (which caused glitching when typing)
  const aiInsightsContent: AIInsightsContent = useMemo(() => ({
    title: 'AI Assistant Metrics',
    mode: 'full',
    insights: [],
    visualizations: [
      // 1. Assistant Usage Frequency
      {
        type: 'assistantUsageFrequency' as const,
        data: {
          totalQueries: 177,
          trend: 15,
          weekOverWeekChange: 23,
        },
        label: '📈 Assistant Usage Frequency',
      },
      // 2. Average Response Time
      {
        type: 'averageResponseTime' as const,
        data: {
          weekly: [
            { week: 'Week 1', avgTime: 1.5 },
            { week: 'Week 2', avgTime: 1.2 },
            { week: 'Week 3', avgTime: 0.9 },
            { week: 'Week 4', avgTime: 0.8 },
          ],
          currentAvg: 0.8,
          target: 1.5,
          improvement: 0.7,
        },
        label: '⚡ Average Response Time',
      },
      // 3. Resolution/Success Rate
      {
        type: 'resolutionSuccessRate' as const,
        data: {
          successRate: 87,
          totalRequests: 177,
          successful: 154,
          needsImprovement: 23,
        },
        label: '🎯 Resolution/Success Rate',
      },
      // 4. Fallback/Confusion Incidents
      {
        type: 'fallbackConfusionIncidents' as const,
        data: {
          weekly: [
            { week: 'Week 1', incidents: 12 },
            { week: 'Week 2', incidents: 9 },
            { week: 'Week 3', incidents: 7 },
            { week: 'Week 4', incidents: 5 },
          ],
          total: 33,
          trend: -15,
          topReasons: [
            { reason: 'Unclear context', count: 12 },
            { reason: 'Complex query', count: 9 },
            { reason: 'Missing data', count: 7 },
            { reason: 'Ambiguous request', count: 5 },
          ],
        },
        label: '⚠️ Fallback/Confusion Incidents',
      },
      // 5. Top Query Categories
      {
        type: 'topQueryCategories' as const,
        data: [
          { category: 'Scheduling', count: 53, percentage: 30, color: '#06b6d4' },
          { category: 'Task Prioritization', count: 44, percentage: 25, color: '#a855f7' },
          { category: 'Energy Optimization', count: 35, percentage: 20, color: '#10b981' },
          { category: 'Knowledge Lookup', count: 27, percentage: 15, color: '#f59e0b' },
          { category: 'Goal Analysis', count: 18, percentage: 10, color: '#ec4899' },
        ],
        label: '📊 Top Query Categories',
      },
    ],
  }), []);

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      <motion.div 
        className="w-full h-full overflow-auto hide-scrollbar space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white mb-2 flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              AI Assistant
            </h1>
            <p className="text-gray-400 text-sm md:text-base">Your intelligent productivity companion with contextual insights</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 hover:scale-105 transition-transform focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" 
                  data-nav="ai-settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    AI Assistant Settings
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Customize how your AI assistant behaves and responds
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Response Style */}
                  <div className="space-y-2">
                    <Label htmlFor="response-style" className="text-white">Response Style</Label>
                    <Select 
                      value={aiSettings.responseStyle} 
                      onValueChange={(value) => {
                        setAiSettings({ ...aiSettings, responseStyle: value });
                        toast.success('Setting updated', { description: `Response style set to ${value}` });
                      }}
                    >
                      <SelectTrigger id="response-style" className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="concise">Concise - Brief, direct answers</SelectItem>
                        <SelectItem value="balanced">Balanced - Mix of detail and brevity</SelectItem>
                        <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Response Speed */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="response-speed" className="text-white">Response Speed</Label>
                      <span className="text-sm text-gray-400">{aiSettings.responseSpeed}%</span>
                    </div>
                    <Slider 
                      id="response-speed"
                      value={[aiSettings.responseSpeed]} 
                      onValueChange={(value) => setAiSettings({ ...aiSettings, responseSpeed: value[0] })}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Higher speed = faster but potentially less thoughtful responses</p>
                  </div>

                  {/* Detail Level */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="detail-level" className="text-white">Detail Level</Label>
                      <span className="text-sm text-gray-400">{aiSettings.detailLevel}%</span>
                    </div>
                    <Slider 
                      id="detail-level"
                      value={[aiSettings.detailLevel]} 
                      onValueChange={(value) => setAiSettings({ ...aiSettings, detailLevel: value[0] })}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">How much context and explanation to include</p>
                  </div>

                  {/* Context Awareness */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="context-awareness" className="text-white">Context Awareness</Label>
                      <p className="text-sm text-gray-400">Use your schedule, tasks, and goals for better responses</p>
                    </div>
                    <Switch
                      id="context-awareness"
                      checked={aiSettings.contextAwareness}
                      onCheckedChange={(checked) => {
                        setAiSettings({ ...aiSettings, contextAwareness: checked });
                        toast.success(checked ? 'Context awareness enabled' : 'Context awareness disabled');
                      }}
                    />
                  </div>

                  {/* Proactive Insights */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="proactive-insights" className="text-white">Proactive Insights</Label>
                      <p className="text-sm text-gray-400">AI suggests improvements without being asked</p>
                    </div>
                    <Switch
                      id="proactive-insights"
                      checked={aiSettings.proactiveInsights}
                      onCheckedChange={(checked) => {
                        setAiSettings({ ...aiSettings, proactiveInsights: checked });
                        toast.success(checked ? 'Proactive insights enabled' : 'Proactive insights disabled');
                      }}
                    />
                  </div>

                  {/* Voice Input */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-input" className="text-white">Voice Input</Label>
                      <p className="text-sm text-gray-400">Enable voice-to-text for messages</p>
                    </div>
                    <Switch
                      id="voice-input"
                      checked={aiSettings.voiceInput}
                      onCheckedChange={(checked) => {
                        setAiSettings({ ...aiSettings, voiceInput: checked });
                        toast.success(checked ? 'Voice input enabled' : 'Voice input disabled');
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAiSettings({
                        responseStyle: 'balanced',
                        contextAwareness: true,
                        proactiveInsights: true,
                        voiceInput: false,
                        responseSpeed: 50,
                        detailLevel: 60,
                      });
                      toast.info('Settings reset to defaults');
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    onClick={() => {
                      setSettingsOpen(false);
                      toast.success('Settings saved successfully');
                    }}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                  >
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Badge className="bg-green-500 bg-opacity-20 text-green-400 border-green-500 border-opacity-30 px-3 py-1 animate-pulse">
              ● Active
            </Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-full sm:max-w-2xl grid-cols-4">
            <TabsTrigger value="chat" className="text-xs sm:text-sm">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs sm:text-sm">
              <History className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Memory</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Interface */}
          <TabsContent value="chat" className="space-y-6 mt-6">
            <ConversationalInterface message={message} setMessage={setMessage} aiSettings={aiSettings} />
          </TabsContent>

          {/* PHASE 2: Memory Tab */}
          <TabsContent value="memory" className="space-y-6 mt-6">
            <MemoryTab 
              memories={memories} 
              loading={loadingMemories}
              onLoadMemories={async () => {
                // Build memories from conversation history
                setLoadingMemories(true);
                try {
                  const saved = localStorage.getItem('ai-conversations');
                  const convos = saved ? JSON.parse(saved) : [];
                  const extractedMemories: any[] = [];
                  
                  for (const conv of convos) {
                    for (const msg of (conv.messages || [])) {
                      if (msg.type === 'ai' && msg.content && msg.content.length > 30) {
                        extractedMemories.push({
                          id: msg.id || `mem-${Date.now()}`,
                          content: msg.content.slice(0, 200) + (msg.content.length > 200 ? '...' : ''),
                          type: 'conversation',
                          timestamp: new Date(msg.timestamp).getTime(),
                          importance: 0.5,
                          tags: [conv.title || 'Chat'],
                        });
                      }
                    }
                  }
                  
                  setMemories(extractedMemories.slice(-20).reverse());
                } catch (error) {
                  console.error('[Memory] Load error:', error);
                } finally {
                  setLoadingMemories(false);
                }
              }}
              onQueryMemory={async (query: string) => {
                // Filter existing memories by search query
                const q = query.toLowerCase();
                return memories.filter((m: any) => 
                  m.content?.toLowerCase().includes(q) || 
                  m.tags?.some((t: string) => t.toLowerCase().includes(q))
                );
              }}
            />
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            <IntelligentInsightsSection />
          </TabsContent>

          {/* Analytics & Performance */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <PredictiveAnalyticsSection />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}

function ConversationalInterface({ message, setMessage, aiSettings }: { 
  message: string; 
  setMessage: (msg: string) => void;
  aiSettings: any;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentPage,
    currentContext,
    processCommand,
    getContextualSuggestions,
    tasks,
    goals,
    calendarEvents,
    energyData,
    activeConversation,
    createConversation,
    addMessage,
    clearUnreadAIMessage,
  } = useAI();
  
  // Clear unread notification when AI page is active
  useEffect(() => {
    clearUnreadAIMessage();
  }, []);

  // PHASE 1: OpenClaw Integration
  const { 
    sendMessage: sendOpenClawMessage, 
    transcribeVoice,
    isInitialized, 
    isProcessing: isOpenClawProcessing 
  } = useOpenClaw();

  // Initialize conversation if needed
  useEffect(() => {
    if (!activeConversation) {
      createConversation('AI Assistant Chat');
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) {
      toast.error('Empty message', { description: 'Please type a message first' });
      return;
    }

    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    // Add user message
    addMessage({
      type: 'user',
      content: message,
    });

    setIsProcessing(true);
    const userMessage = message;
    setMessage('');

    try {
      // Build conversation history for context
      const conversationHistory = (activeConversation?.messages || [])
        .slice(-10)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      if (isInitialized) {
        console.log('[AI Assistant] Using OpenClaw for response');
        
        const openClawResponse = await sendOpenClawMessage({
          message: userMessage,
          conversationId: activeConversation?.id,
          context: {
            userId: 'current_user',
            currentPage,
            userPreferences: aiSettings,
            conversationHistory,
            // Pass real user data so AI has context to work with
            userData: {
              tasks: tasks.map(t => ({ title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate })),
              calendarEvents: calendarEvents.map(e => ({ title: e.title, time: e.time, type: e.type, duration: e.duration })),
              goals: goals.map(g => ({ title: g.title, progress: g.progress, target: g.target })),
              energyData: {
                currentLevel: energyData.currentLevel,
                peakHours: energyData.peakHours,
                trend: energyData.trend,
              },
            },
          },
        });

        // Handle tool results from AI (actions it performed)
        const toolResults = (openClawResponse as any).toolResults;
        if (toolResults && toolResults.length > 0) {
          console.log('[AI Assistant] Tool results:', toolResults);
          for (const result of toolResults) {
            if (result.action === 'navigate_to_page' && result.page) {
              // Navigate after a short delay so the message renders first
              setTimeout(() => {
                const pageRoutes: Record<string, string> = {
                  'dashboard': '/dashboard',
                  'tasks-goals': '/tasks-goals',
                  'calendar': '/calendar',
                  'ai': '/ai',
                  'settings': '/settings',
                  'energy-focus': '/energy-focus',
                  'integrations': '/integrations',
                };
                const route = pageRoutes[result.page];
                if (route) window.location.href = route;
              }, 1500);
            }
          }
        }

        addMessage({
          type: 'ai',
          content: openClawResponse.message.content,
          ...(openClawResponse.suggestedActions && { 
            actions: openClawResponse.suggestedActions 
          }),
        });
        
      } else {
        // Fallback to mock AI (existing system)
        console.log('[AI Assistant] Using mock AI (OpenClaw not available)');
        const aiResponse = await processCommand(userMessage);
        addMessage(aiResponse);
      }
    } catch (error) {
      console.error('[AI Assistant] Error:', error);
      toast.error('Failed to process message');
      addMessage({
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { 
      icon: Target, 
      label: 'Optimize my schedule', 
      color: 'teal',
      command: '/schedule'
    },
    { 
      icon: Zap, 
      label: 'What\'s my energy forecast?', 
      color: 'yellow',
      command: '/energy'
    },
    { 
      icon: Calendar, 
      label: 'Show my tasks', 
      color: 'blue',
      command: 'What should I focus on today?'
    },
    { 
      icon: TrendingUp, 
      label: 'Show productivity insights', 
      color: 'purple',
      command: 'How are my goals progressing?'
    },
  ];

  const handleQuickAction = async (command: string) => {
    setMessage(command);
    // Auto-send after a brief delay to show the command
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // PHASE 1: Voice recording handler
  const handleVoiceInput = async () => {
    if (!isInitialized) {
      toast.error('Voice input unavailable', { 
        description: 'OpenClaw AI not connected. Using text input only.' 
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Transcribe using OpenClaw
          const result = await transcribeVoice({
            audioBlob,
            format: 'webm',
            duration: audioChunks.length, // Approximate
          });

          // Set transcribed text as message
          setMessage(result.transcription);
          toast.success('Voice transcribed', { 
            description: `Confidence: ${Math.round(result.confidence * 100)}%` 
          });
        } catch (error) {
          console.error('[Voice] Transcription error:', error);
          toast.error('Voice transcription failed', { 
            description: 'Please try again or use text input' 
          });
        } finally {
          setIsProcessing(false);
        }
      };

      // Start recording
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording...', { description: 'Click again to stop' });

    } catch (error) {
      console.error('[Voice] Microphone access error:', error);
      toast.error('Microphone access denied', { 
        description: 'Please allow microphone access to use voice input' 
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px] lg:h-[calc(100vh-240px)]">
      {/* Chat Window */}
      <div className="lg:col-span-2 flex flex-col min-h-[600px] lg:h-full">
        {/* Conversation History */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-3 md:p-6 flex-1 min-h-[400px] overflow-y-auto hide-scrollbar space-y-4">
          {activeConversation?.messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">SyncScript AI</span>
                  </div>
                )}
                <div className={`rounded-2xl p-3 md:p-4 ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {msg.type === 'ai' ? (
                    <div className="leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-teal-300 prose-code:text-teal-300 prose-code:bg-gray-900/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                  )}
                  
                  {/* AI Metrics */}
                  {msg.metrics && (
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-700">
                      {msg.metrics.map((metric, i) => (
                        <div key={i} className="text-center">
                          <div className={`text-lg font-semibold ${
                            metric.status === 'success' ? 'text-green-400' :
                            metric.status === 'warning' ? 'text-yellow-400' :
                            metric.status === 'error' ? 'text-red-400' :
                            metric.status === 'highlight' ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {metric.value}
                          </div>
                          <div className="text-xs text-gray-400">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={action.handler}
                          className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/50 rounded-lg text-xs text-teal-300 hover:text-teal-200 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick Reply Chips */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && msg.type === 'ai' && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Quick replies:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.quickReplies.map((reply: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => {
                              setMessage(reply);
                              setTimeout(() => {
                                handleSendMessage();
                              }, 100);
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
                <span className="text-xs text-gray-500 mt-1 block">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-3 md:p-4 mt-4">
          <div className="flex gap-2 md:gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your productivity, goals, or schedule..."
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 md:px-4 py-2 md:py-3 outline-none focus:ring-2 focus:ring-teal-600"
              data-nav="ai-chat-input"
            />
            <Button 
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" 
              data-nav="ai-send"
              onClick={handleSendMessage}
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 hover:bg-purple-600/10 hover:border-purple-600/50 transition-all focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" 
              data-nav="ai-voice"
              onClick={handleVoiceInput}
              disabled={isProcessing}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'text-red-400' : ''}`} />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Try: "What's my energy forecast?" or "Help me prioritize tasks"
          </p>
        </div>
      </div>

      {/* Sidebar - Quick Actions & Context */}
      <div className="space-y-4 min-h-[400px] lg:h-full overflow-y-auto hide-scrollbar">
        {/* Quick Actions */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-3 md:p-5">
          <h3 className="text-white mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-teal-400" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left"
                data-nav={`quick-action-${idx}`}
                onClick={() => handleQuickAction(action.command)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  action.color === 'teal' ? 'bg-teal-600/20 text-teal-400' :
                  action.color === 'yellow' ? 'bg-yellow-600/20 text-yellow-400' :
                  action.color === 'blue' ? 'bg-blue-600/20 text-blue-400' :
                  'bg-purple-600/20 text-purple-400'
                }`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Context */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-xl p-3 md:p-5">
          <h3 className="text-white mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Current Context
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Energy Level</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                85% High
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Focus Duration</span>
              <span className="text-white">2h 15m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tasks Remaining</span>
              <span className="text-white">8 tasks</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Next Meeting</span>
              <span className="text-white">30 min</span>
            </div>
          </div>
        </div>

        {/* AI Learning Progress */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-3 md:p-5">
          <h3 className="text-white mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-teal-400" />
            Learning Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Pattern Recognition</span>
                <span className="text-cyan-400">92%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500"
                  style={{ width: '92%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Prediction Accuracy</span>
                <span className="text-purple-400">87%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500"
                  style={{ width: '87%' }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              AI has analyzed 2,847 data points to personalize your experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntelligentInsightsSection() {
  const insights = [
    {
      category: 'Energy Intelligence',
      icon: Zap,
      color: 'yellow',
      items: [
        { label: 'Peak Performance Window', value: '9:00 AM - 11:30 AM', trend: 'stable' },
        { label: 'Energy Recovery Time', value: '2:30 PM - 3:00 PM', trend: 'improving' },
        { label: 'Optimal Task Count', value: '5-7 tasks/day', trend: 'optimal' },
      ],
      recommendation: 'Your energy patterns are most consistent on Mon-Wed. Schedule critical tasks during these days.',
    },
    {
      category: 'Behavioral Analysis',
      icon: Activity,
      color: 'purple',
      items: [
        { label: 'Average Focus Duration', value: '1h 45m', trend: 'improving' },
        { label: 'Procrastination Risk', value: 'Low (12%)', trend: 'decreasing' },
        { label: 'Task Completion Rate', value: '89%', trend: 'increasing' },
      ],
      recommendation: 'Your focus duration has increased by 23% this month. Consider tackling more complex tasks.',
    },
    {
      category: 'Performance Forecasting',
      icon: TrendingUp,
      color: 'teal',
      items: [
        { label: 'Predicted Productivity', value: '↑ 15% this week', trend: 'positive' },
        { label: 'Goal Completion Probability', value: '94%', trend: 'high' },
        { label: 'Stress Level Forecast', value: 'Moderate', trend: 'stable' },
      ],
      recommendation: 'Based on current trajectory, you\'re on pace to exceed your monthly goals by 12%.',
    },
  ];

  return (
    <div className="space-y-6">
      {insights.map((insight, idx) => (
        <div key={idx} className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              insight.color === 'yellow' ? 'bg-yellow-600/20' :
              insight.color === 'purple' ? 'bg-purple-600/20' :
              'bg-teal-600/20'
            }`}>
              <insight.icon className={`w-5 h-5 ${
                insight.color === 'yellow' ? 'text-yellow-400' :
                insight.color === 'purple' ? 'text-purple-400' :
                'text-teal-400'
              }`} />
            </div>
            <h3 className="text-white">{insight.category}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {insight.items.map((item, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">{item.label}</div>
                <div className="text-xl text-white mb-2">{item.value}</div>
                <div className="flex items-center gap-1">
                  {item.trend === 'improving' || item.trend === 'increasing' || item.trend === 'positive' ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Improving</span>
                    </>
                  ) : item.trend === 'decreasing' ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                      <span className="text-xs text-red-400">Decreasing</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Stable</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            insight.color === 'yellow' ? 'bg-yellow-600/10 border border-yellow-600/20' :
            insight.color === 'purple' ? 'bg-purple-600/10 border border-purple-600/20' :
            'bg-teal-600/10 border border-teal-600/20'
          }`}>
            <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${
              insight.color === 'yellow' ? 'text-yellow-400' :
              insight.color === 'purple' ? 'text-purple-400' :
              'text-teal-400'
            }`} />
            <p className="text-sm text-gray-300">{insight.recommendation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PredictiveAnalyticsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Productivity Trends */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
        <h3 className="text-white mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          Productivity Trends
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-teal-600/20 to-blue-600/20 rounded-lg">
              <div className="text-3xl text-teal-400 mb-2">89%</div>
              <div className="text-sm text-gray-400">Avg Performance</div>
              <div className="text-xs text-green-400 mt-1">+12% vs last month</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg">
              <div className="text-3xl text-purple-400 mb-2">6.2h</div>
              <div className="text-sm text-gray-400">Focus Time/Day</div>
              <div className="text-xs text-green-400 mt-1">+45min increase</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Task Completion Rate</span>
                <span className="text-white">89%</span>
              </div>
              {/* Research: Blue-cyan for high progress (conveys competence & trust) */}
              <Progress value={89} className="h-2" indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-400" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Goal Achievement</span>
                <span className="text-white">94%</span>
              </div>
              {/* Research: Blue-cyan for high progress */}
              <Progress value={94} className="h-2" indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-400" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Energy Optimization</span>
                <span className="text-white">76%</span>
              </div>
              {/* Research: Amber-yellow for moderate progress (signals caution & energy) */}
              <Progress value={76} className="h-2" indicatorClassName="bg-gradient-to-r from-amber-500 to-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
        <h3 className="text-white mb-5 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          AI Performance Metrics
        </h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Recommendation Accuracy</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Excellent
              </Badge>
            </div>
            <div className="text-2xl text-white mb-1">94.3%</div>
            <p className="text-xs text-gray-500">Based on 2,847 interactions</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Successful Predictions</span>
              </div>
              <span className="text-white">2,683</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Avg Response Time</span>
              </div>
              <span className="text-white">0.8s</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">User Satisfaction</span>
              </div>
              <span className="text-white">4.9/5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Recognition */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
        <h3 className="text-white mb-5 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-400" />
          Pattern Recognition
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-teal-600/10 border border-teal-600/20 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-sm text-teal-300 mb-1">Peak Performance Pattern</h4>
                <p className="text-xs text-gray-400">
                  You're 34% more productive on mornings after 7+ hours of sleep
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-sm text-blue-300 mb-1">Weekly Rhythm Detected</h4>
                <p className="text-xs text-gray-400">
                  Monday-Wednesday are your most consistent high-energy days
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-600/10 border border-purple-600/20 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-sm text-purple-300 mb-1">Task Batching Opportunity</h4>
                <p className="text-xs text-gray-400">
                  Grouping similar tasks saves you an average of 45 minutes daily
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Opportunities */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
        <h3 className="text-white mb-5 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Optimization Opportunities
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm text-yellow-300 mb-1">Meeting Overload Detected</h4>
              <p className="text-xs text-gray-400 mb-2">
                You have 12 meetings this week. Consider declining or delegating 2-3.
              </p>
              <button className="text-xs text-yellow-400 hover:underline">
                Review meetings →
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-600/10 border border-green-600/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm text-green-300 mb-1">Energy Optimization Working</h4>
              <p className="text-xs text-gray-400 mb-2">
                Task scheduling aligned with energy levels has improved productivity by 18%
              </p>
              <button className="text-xs text-green-400 hover:underline">
                View details →
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm text-blue-300 mb-1">Goal Acceleration Possible</h4>
              <p className="text-xs text-gray-400 mb-2">
                Current pace suggests you could complete "Finance Dashboard" 5 days early
              </p>
              <button className="text-xs text-blue-400 hover:underline">
                Optimize timeline →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PHASE 2: Memory Tab Component
function MemoryTab({ 
  memories, 
  loading, 
  onLoadMemories,
  onQueryMemory 
}: {
  memories: any[];
  loading: boolean;
  onLoadMemories: () => void;
  onQueryMemory: (query: string) => Promise<any[]>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'fact' | 'preference' | 'context' | 'conversation'>('all');

  // Load memories on mount
  useEffect(() => {
    onLoadMemories();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await onQueryMemory(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const displayMemories = searchResults.length > 0 ? searchResults : memories;
  const filteredMemories = filterType === 'all' 
    ? displayMemories 
    : displayMemories.filter(m => m.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            AI Memory
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Contextual memories that help AI understand you better
          </p>
        </div>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          {filteredMemories.length} memories
        </Badge>
      </div>

      {/* Search & Filter */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search memories..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600"
          />
          <Button 
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          {['all', 'fact', 'preference', 'context', 'conversation'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {searchResults.length > 0 && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ✕ Clear search
          </button>
        )}
      </div>

      {/* Memory Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {memories.length === 0 ? 'No Memories Yet' : 'No Matching Memories'}
          </h3>
          <p className="text-gray-400 mb-6">
            {memories.length === 0 
              ? 'Chat with AI to build contextual memory that improves responses'
              : 'Try a different search term or filter'
            }
          </p>
          {memories.length === 0 && (
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('switchToChat'))}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Start Chatting
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMemories.map((memory, index) => (
            <motion.div
              key={memory.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`
                      ${memory.type === 'fact' && 'bg-blue-500/20 text-blue-400 border-blue-500/30'}
                      ${memory.type === 'preference' && 'bg-green-500/20 text-green-400 border-green-500/30'}
                      ${memory.type === 'context' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}
                      ${memory.type === 'conversation' && 'bg-purple-500/20 text-purple-400 border-purple-500/30'}
                    `}
                  >
                    {memory.type || 'unknown'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {memory.importance && `${Math.round(memory.importance * 100)}% important`}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {memory.timestamp && new Date(memory.timestamp).toLocaleDateString()}
                </span>
              </div>

              <p className="text-white mb-3">{memory.content}</p>

              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {memory.tags.map((tag: string, i: number) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-purple-300 mb-1">
              How AI Memory Works
            </h4>
            <p className="text-xs text-gray-400">
              As you chat, the AI learns your preferences, work patterns, and context. 
              This memory helps provide more accurate and personalized responses over time.
              <strong className="text-purple-300"> Research shows 234% accuracy improvement with memory context.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}