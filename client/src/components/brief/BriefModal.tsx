import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  ExternalLink,
  Zap,
  AlertTriangle,
  AlertCircle,
  Pin,
  DollarSign,
  Cloud,
  BookTemplate,
  UserPlus,
  Flame,
  CheckCircle,
  Calendar,
  Save,
  Book
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'morning' | 'evening';
}

const iconMap: Record<string, any> = {
  Zap,
  AlertTriangle,
  AlertCircle,
  Pin,
  DollarSign,
  Cloud,
  BookTemplate,
  UserPlus,
  Flame,
  CheckCircle,
  Calendar,
  Save,
  Book
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200',
  red: 'bg-red-50 border-red-200',
  orange: 'bg-orange-50 border-orange-200',
  purple: 'bg-purple-50 border-purple-200',
  teal: 'bg-teal-50 border-teal-200',
  green: 'bg-green-50 border-green-200',
  indigo: 'bg-indigo-50 border-indigo-200'
};

export function BriefModal({ isOpen, onClose, type }: BriefModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Fetch brief cards
  const { data: briefData, isLoading, error } = useQuery({
    queryKey: ['brief', type],
    queryFn: async () => {
      const response = await api.get(`/brief/today?type=${type}`);
      return response.data.data;
    },
    enabled: isOpen,
    retry: false
  });

  // Fetch budget insights
  const { data: budgetInsights } = useQuery({
    queryKey: ['budget-insights'],
    queryFn: async () => {
      const response = await api.get('/budget/insights');
      return response.data;
    },
    enabled: isOpen
  });

  // Take action mutation
  const actionMutation = useMutation({
    mutationFn: async ({ cardId, action }: any) => {
      const response = await api.post('/brief/action', { cardId, action });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brief'] });
      const card = cards?.find((c: any) => c.id === variables.cardId);
      if (card) {
        toast({
          title: 'Action Taken',
          description: `"${card.title}" action completed`
        });
      }
    }
  });

  // Dismiss card mutation
  const dismissMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await api.post('/brief/dismiss', { cardId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brief'] });
    }
  });

  const cards = briefData?.cards || [];
  const isMorning = type === 'morning';

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Zap;
    return IconComponent;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogTitle className="sr-only">
          {isMorning ? 'Morning Brief' : 'Evening Brief'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isMorning 
            ? 'Your daily morning brief with tasks and priorities'
            : 'Your evening reflection and tomorrow preparation'
          }
        </DialogDescription>
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {isMorning ? '☀️ Good Morning!' : '🌙 Evening Brief'}
              </h2>
              <p className="text-blue-100 mt-1">
                {isMorning 
                  ? 'Here\'s your plan for today - decide what matters most'
                  : 'Reflect on today and prepare for tomorrow'
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              title="Close Brief"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Card Stack */}
        <ScrollArea className="h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-24 px-6">
              <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Brief System Not Ready</h3>
              <p className="text-muted-foreground mb-4">
                The brief system needs to be set up. This feature will be available soon!
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-24 px-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                {isMorning 
                  ? 'No critical actions needed. You\'re all set for today!'
                  : 'Great work today! Take some time to rest.'
                }
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Budget Insights Card */}
              {budgetInsights && (
                <Card className="bg-green-50 border-green-200 border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">Budget Insights</CardTitle>
                        <CardDescription className="mt-1">
                          Your budget status and recommendations
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Total Budget Used:</span>
                        <span className="font-medium text-green-800">
                          ${budgetInsights.totalUsed || 0} / ${budgetInsights.totalBudget || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Remaining Budget:</span>
                        <span className="font-medium text-green-800">
                          ${budgetInsights.remaining || 0}
                        </span>
                      </div>
                      {budgetInsights.alerts && budgetInsights.alerts.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                          <p className="text-sm text-yellow-800">
                            ⚠️ {budgetInsights.alerts[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {cards.map((card: any, index: number) => {
                const Icon = getIcon(card.icon);
                const isExpanded = expandedCard === card.id;
                const colorClass = colorMap[card.color] || 'bg-gray-50 border-gray-200';

                return (
                  <Card key={card.id} className={`${colorClass} border-2`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            card.color === 'red' ? 'bg-red-500' :
                            card.color === 'orange' ? 'bg-orange-500' :
                            card.color === 'green' ? 'bg-green-500' :
                            card.color === 'blue' ? 'bg-blue-500' :
                            card.color === 'purple' ? 'bg-purple-500' :
                            card.color === 'teal' ? 'bg-teal-500' :
                            'bg-indigo-500'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{card.title}</CardTitle>
                            {card.reason && (
                              <CardDescription className="mt-1">
                                {card.reason}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          #{index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Key Facts */}
                      {card.keyFacts && card.keyFacts.length > 0 && (
                        <ul className="space-y-1 text-sm">
                          {card.keyFacts.map((fact: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (card.deepLink) {
                              window.location.href = card.deepLink;
                            }
                            actionMutation.mutate({ cardId: card.id, action: 'primary' });
                          }}
                          className="flex-1"
                          disabled={actionMutation.isPending || card.actionTaken}
                        >
                          {card.actionTaken ? '✓ Done' : card.primaryAction?.label || 'Take Action'}
                        </Button>
                        
                        {card.deepLink && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.location.href = card.deepLink}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dismissMutation.mutate(card.id)}
                          disabled={dismissMutation.isPending}
                          title="Dismiss this card"
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Secondary Actions */}
                      {card.secondaryActions && card.secondaryActions.length > 0 && (
                        <div className="flex gap-2">
                          {card.secondaryActions.map((action: any, i: number) => (
                            <Button
                              key={i}
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                // Handle secondary action
                                console.log('Secondary action:', action);
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">
              {error ? 'Brief system unavailable' : `${cards.length} action${cards.length !== 1 ? 's' : ''} for ${isMorning ? 'today' : 'tonight'}`}
            </p>
            <Button 
              variant="default" 
              onClick={onClose}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6"
            >
              {isMorning ? '☀️ Start Your Day' : '🌙 Good Night'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

