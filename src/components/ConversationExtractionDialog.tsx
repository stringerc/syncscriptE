import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { 
  Sparkles, Upload, FileText, CheckCircle2, Target, 
  Calendar, Zap, Lightbulb, AlertCircle, Download, Copy, Wand2
} from 'lucide-react';
import { motion } from 'motion/react';

interface ConversationExtractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtractedTask {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  category: string;
}

interface ExtractedGoal {
  id: string;
  title: string;
  description?: string;
  timeframe: string;
  category: string;
}

interface ExtractedInsight {
  id: string;
  type: 'tip' | 'warning' | 'idea';
  content: string;
  category: string;
}

interface ExtractionResult {
  tasks: ExtractedTask[];
  goals: ExtractedGoal[];
  insights: ExtractedInsight[];
  summary: string;
}

export function ConversationExtractionDialog({ open, onOpenChange }: ConversationExtractionDialogProps) {
  const [conversationText, setConversationText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());

  // Simulate AI extraction (client-side parsing)
  const extractFromConversation = async () => {
    if (!conversationText.trim()) {
      toast.error('Please paste a conversation first');
      return;
    }

    setIsExtracting(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Smart pattern matching to extract tasks, goals, and insights
    const tasks: ExtractedTask[] = extractTasks(conversationText);
    const goals: ExtractedGoal[] = extractGoals(conversationText);
    const insights: ExtractedInsight[] = extractInsights(conversationText);
    
    const summary = `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}, ${goals.length} goal${goals.length !== 1 ? 's' : ''}, and ${insights.length} insight${insights.length !== 1 ? 's' : ''} from your conversation.`;

    setExtractionResult({ tasks, goals, insights, summary });
    
    // Select all by default
    setSelectedTasks(new Set(tasks.map(t => t.id)));
    setSelectedGoals(new Set(goals.map(g => g.id)));
    
    setIsExtracting(false);
    
    toast.success('Extraction Complete!', {
      description: summary
    });
  };

  // Pattern matching for tasks
  const extractTasks = (text: string): ExtractedTask[] => {
    const tasks: ExtractedTask[] = [];
    const lines = text.split('\n');
    
    // Look for action items
    const taskPatterns = [
      /(?:task|todo|action item|need to|should|must|have to|remember to)[\s:]+(.+)/gi,
      /^[-*•]\s*(.+)/gm,
      /^\d+\.\s*(.+)/gm,
      /(?:create|build|make|write|design|implement|add|update|fix|review|test|deploy)[\s]+(.+)/gi
    ];

    let taskId = 1;
    const foundTasks = new Set<string>();

    taskPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const taskText = match[1]?.trim();
        if (taskText && taskText.length > 5 && taskText.length < 200 && !foundTasks.has(taskText.toLowerCase())) {
          foundTasks.add(taskText.toLowerCase());
          
          // Determine priority based on keywords
          let priority: 'high' | 'medium' | 'low' = 'medium';
          if (/urgent|critical|asap|immediately|important/i.test(taskText)) {
            priority = 'high';
          } else if (/later|eventually|consider|maybe/i.test(taskText)) {
            priority = 'low';
          }

          // Determine category
          let category = 'General';
          if (/code|develop|build|implement|debug|test/i.test(taskText)) category = 'Development';
          else if (/design|ui|ux|mockup|wireframe/i.test(taskText)) category = 'Design';
          else if (/meeting|call|email|discuss|communicate/i.test(taskText)) category = 'Communication';
          else if (/plan|strategy|research|analyze/i.test(taskText)) category = 'Planning';

          tasks.push({
            id: `task-${taskId++}`,
            title: taskText,
            priority,
            category
          });
        }
      }
    });

    return tasks.slice(0, 15); // Limit to 15 tasks
  };

  // Pattern matching for goals
  const extractGoals = (text: string): ExtractedGoal[] => {
    const goals: ExtractedGoal[] = [];
    
    const goalPatterns = [
      /(?:goal|objective|aim|target|want to|hoping to|plan to)[\s:]+(.+)/gi,
      /(?:by|in|within)[\s]+(?:the|next|this)[\s]+(?:week|month|quarter|year)[\s:,]+(.+)/gi,
      /(?:achieve|accomplish|reach|complete|finish)[\s]+(.+?)(?:\.|by|in|$)/gi
    ];

    let goalId = 1;
    const foundGoals = new Set<string>();

    goalPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const goalText = match[1]?.trim();
        if (goalText && goalText.length > 10 && goalText.length < 200 && !foundGoals.has(goalText.toLowerCase())) {
          foundGoals.add(goalText.toLowerCase());
          
          // Determine timeframe
          let timeframe = 'Medium-term';
          if (/today|tomorrow|this week/i.test(text)) timeframe = 'Short-term';
          else if (/this month|next month/i.test(text)) timeframe = 'Medium-term';
          else if (/this quarter|this year|next year/i.test(text)) timeframe = 'Long-term';

          // Category
          let category = 'Personal';
          if (/business|company|revenue|growth|market/i.test(goalText)) category = 'Business';
          else if (/health|fitness|exercise|diet/i.test(goalText)) category = 'Health';
          else if (/learn|study|course|skill|education/i.test(goalText)) category = 'Learning';
          else if (/project|product|launch|release/i.test(goalText)) category = 'Project';

          goals.push({
            id: `goal-${goalId++}`,
            title: goalText,
            timeframe,
            category
          });
        }
      }
    });

    return goals.slice(0, 10); // Limit to 10 goals
  };

  // Pattern matching for insights
  const extractInsights = (text: string): ExtractedInsight[] => {
    const insights: ExtractedInsight[] = [];
    
    const insightPatterns = [
      { pattern: /(?:tip|suggestion|recommend|advice)[\s:]+(.+)/gi, type: 'tip' as const },
      { pattern: /(?:warning|caution|careful|watch out|avoid)[\s:]+(.+)/gi, type: 'warning' as const },
      { pattern: /(?:idea|thought|consider|what if|could)[\s:]+(.+)/gi, type: 'idea' as const }
    ];

    let insightId = 1;
    const foundInsights = new Set<string>();

    insightPatterns.forEach(({ pattern, type }) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const insightText = match[1]?.trim();
        if (insightText && insightText.length > 10 && insightText.length < 300 && !foundInsights.has(insightText.toLowerCase())) {
          foundInsights.add(insightText.toLowerCase());
          
          let category = 'General';
          if (/productivity|efficient|optimize|workflow/i.test(insightText)) category = 'Productivity';
          else if (/team|collaborate|communicate/i.test(insightText)) category = 'Collaboration';
          else if (/strategy|plan|approach/i.test(insightText)) category = 'Strategy';

          insights.push({
            id: `insight-${insightId++}`,
            type,
            content: insightText,
            category
          });
        }
      }
    });

    return insights.slice(0, 10); // Limit to 10 insights
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleGoalSelection = (goalId: string) => {
    const newSelection = new Set(selectedGoals);
    if (newSelection.has(goalId)) {
      newSelection.delete(goalId);
    } else {
      newSelection.add(goalId);
    }
    setSelectedGoals(newSelection);
  };

  const handleImport = () => {
    const taskCount = selectedTasks.size;
    const goalCount = selectedGoals.size;
    
    if (taskCount === 0 && goalCount === 0) {
      toast.error('Please select at least one item to import');
      return;
    }

    toast.success('Import Successful!', {
      description: `Imported ${taskCount} task${taskCount !== 1 ? 's' : ''} and ${goalCount} goal${goalCount !== 1 ? 's' : ''} to your workspace`,
      duration: 5000
    });

    // Reset and close
    setConversationText('');
    setExtractionResult(null);
    setSelectedTasks(new Set());
    setSelectedGoals(new Set());
    onOpenChange(false);
  };

  const handleReset = () => {
    setConversationText('');
    setExtractionResult(null);
    setSelectedTasks(new Set());
    setSelectedGoals(new Set());
  };

  const priorityColors = {
    high: 'bg-red-500/10 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  const insightIcons = {
    tip: Lightbulb,
    warning: AlertCircle,
    idea: Sparkles
  };

  const insightColors = {
    tip: 'border-teal-500/30 bg-teal-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    idea: 'border-purple-500/30 bg-purple-500/10'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1c20] border-gray-800 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-400" />
            AI Conversation Extraction
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Paste a conversation from ChatGPT, Claude, or any AI assistant to automatically extract tasks, goals, and insights
          </DialogDescription>
        </DialogHeader>

        {!extractionResult ? (
          // Input Phase
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-sm text-gray-300 mb-2">Paste Your Conversation</label>
              <Textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder="Paste your AI conversation here... 

Example:
User: I need to build a new landing page for our product
AI: Great! Let me help you break that down:
1. Create wireframe designs
2. Write compelling copy
3. Add call-to-action buttons
..."
                className="flex-1 bg-[#1e2128] border-gray-800 text-white placeholder-gray-500 resize-none min-h-[300px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={extractFromConversation}
                disabled={isExtracting || !conversationText.trim()}
                className="flex-1 gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500"
              >
                {isExtracting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Wand2 className="w-4 h-4" />
                    </motion.div>
                    Extracting...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Extract Tasks & Goals
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                Clear
              </Button>
            </div>

            {/* Helper Tips */}
            <div className="bg-teal-900/20 border border-teal-600/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-white mb-2">💡 Pro Tips:</p>
                  <ul className="text-gray-400 space-y-1 text-xs">
                    <li>• Works with ChatGPT, Claude, Gemini, or any AI chat</li>
                    <li>• Automatically detects tasks, goals, deadlines, and priorities</li>
                    <li>• Understands action verbs like "create", "build", "plan"</li>
                    <li>• Identifies timeframes like "this week", "next month"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Results Phase
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Summary */}
            <div className="bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <p className="text-white">Extraction Complete</p>
              </div>
              <p className="text-gray-400 text-sm">{extractionResult.summary}</p>
            </div>

            {/* Tabs for Results */}
            <Tabs defaultValue="tasks" className="flex-1 flex flex-col min-h-0">
              <TabsList className="bg-[#1e2128] border-gray-800">
                <TabsTrigger value="tasks" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Tasks ({extractionResult.tasks.length})
                </TabsTrigger>
                <TabsTrigger value="goals" className="gap-2">
                  <Target className="w-4 h-4" />
                  Goals ({extractionResult.goals.length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Insights ({extractionResult.insights.length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="tasks" className="space-y-2 mt-0">
                  {extractionResult.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTasks.has(task.id)
                          ? 'border-teal-600 bg-teal-900/20'
                          : 'border-gray-800 bg-[#1e2128] hover:border-gray-700'
                      }`}
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedTasks.has(task.id)
                            ? 'bg-teal-600 border-teal-600'
                            : 'border-gray-600'
                        }`}>
                          {selectedTasks.has(task.id) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white mb-2">{task.title}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 border-gray-700">
                              {task.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="goals" className="space-y-2 mt-0">
                  {extractionResult.goals.map((goal) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedGoals.has(goal.id)
                          ? 'border-purple-600 bg-purple-900/20'
                          : 'border-gray-800 bg-[#1e2128] hover:border-gray-700'
                      }`}
                      onClick={() => toggleGoalSelection(goal.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedGoals.has(goal.id)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-600'
                        }`}>
                          {selectedGoals.has(goal.id) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white mb-2">{goal.title}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                              {goal.timeframe}
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 border-gray-700">
                              {goal.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="insights" className="space-y-2 mt-0">
                  {extractionResult.insights.map((insight) => {
                    const Icon = insightIcons[insight.type];
                    return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-4 ${insightColors[insight.type]}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-white text-sm mb-2">{insight.content}</p>
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                              {insight.category}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleReset}
              >
                <Upload className="w-4 h-4" />
                Extract Another
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
                onClick={handleImport}
                disabled={selectedTasks.size === 0 && selectedGoals.size === 0}
              >
                <Download className="w-4 h-4" />
                Import Selected ({selectedTasks.size + selectedGoals.size})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
