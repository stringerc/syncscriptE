import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { aiService, TaskSuggestion } from '@/services/aiService';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  Target, 
  TrendingUp,
  Plus,
  Lightbulb,
  Zap,
  Brain
} from 'lucide-react';

interface AITaskSuggestionsProps {
  onTaskCreated?: (suggestion: TaskSuggestion) => void;
}

export function AITaskSuggestions({ onTaskCreated }: AITaskSuggestionsProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const newSuggestions = await aiService.getTaskSuggestions('current-user', {
        timeOfDay: new Date().getHours(),
        recentTasks: [],
        energyLevel: 'HIGH'
      });
      setSuggestions(newSuggestions);
      
      toast({
        title: '🤖 AI Suggestions Generated!',
        description: `Found ${newSuggestions.length} personalized task suggestions`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      toast({
        title: '❌ AI Error',
        description: 'Failed to generate suggestions. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTask = (suggestion: TaskSuggestion) => {
    console.log('🤖 Creating task from AI suggestion:', suggestion.title);
    
    if (onTaskCreated) {
      onTaskCreated(suggestion);
    }
    
    toast({
      title: '✅ Task Created!',
      description: `"${suggestion.title}" added to your task list`,
      duration: 3000,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
      case 'LOW': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'PEAK': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600';
      case 'HIGH': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
      case 'LOW': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                AI Task Suggestions
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Personalized recommendations based on your patterns
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isGenerating ? (
              <>
                <Brain className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No suggestions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Click "Generate" to get AI-powered task suggestions based on your productivity patterns.
            </p>
            <Button
              onClick={generateSuggestions}
              disabled={isGenerating}
              variant="outline"
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              Get AI Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {suggestion.title}
                      </h4>
                      <Badge className={`text-xs border ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </Badge>
                      <Badge className={`text-xs border ${getEnergyColor(suggestion.energyLevel)}`}>
                        {suggestion.energyLevel}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suggestion.estimatedDuration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {suggestion.category}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        💡 {suggestion.reasoning}
                      </p>
                    </div>
                    
                    {suggestion.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {suggestion.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleCreateTask(suggestion)}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
