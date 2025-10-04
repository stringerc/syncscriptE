import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, CheckCircle, XCircle, Calendar, Users, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

interface Conflict {
  id: string;
  type: 'task_overlap' | 'dependency_violation' | 'store_hours_violation' | 'insufficient_buffer';
  description: string;
  affectedTasks: string[];
  suggestedFix?: {
    action: 'reschedule' | 'extend_buffer' | 'remove_dependency';
    targetId: string;
    newValue: any;
  };
}

interface ConflictResolverProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({ eventId, isOpen, onClose }) => {
  const [selectedConflicts, setSelectedConflicts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conflicts for the event
  const { data: conflictsData, isLoading, refetch } = useQuery({
    queryKey: ['conflicts', eventId],
    queryFn: async () => {
      const response = await api.get(`/scheduling/conflicts/${eventId}`);
      return response.data.data;
    },
    enabled: isOpen && !!eventId,
    staleTime: 30 * 1000,
  });

  const conflicts: Conflict[] = conflictsData?.conflicts || [];

  // Apply fix mutation
  const applyFixMutation = useMutation({
    mutationFn: async ({ conflictId, fix }: { conflictId: string; fix: any }) => {
      const response = await api.post(`/scheduling/conflicts/${conflictId}/fix`, fix);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Conflict Resolved",
        description: data.message || "The conflict has been successfully resolved",
      });
      
      // Remove the resolved conflict from selection
      setSelectedConflicts(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.conflictId);
        return newSet;
      });
      
      // Refetch conflicts to get updated list
      refetch();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resolve Conflict",
        description: error.response?.data?.error || "Failed to apply the suggested fix",
        variant: "destructive",
      });
    },
  });

  // Apply all selected fixes
  const applyAllMutation = useMutation({
    mutationFn: async () => {
      const promises = Array.from(selectedConflicts).map(conflictId => {
        const conflict = conflicts.find(c => c.id === conflictId);
        if (!conflict?.suggestedFix) return Promise.resolve();
        
        return api.post(`/scheduling/conflicts/${conflictId}/fix`, conflict.suggestedFix);
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "All Conflicts Resolved",
        description: "All selected conflicts have been successfully resolved",
      });
      
      setSelectedConflicts(new Set());
      refetch();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resolve Some Conflicts",
        description: error.response?.data?.error || "Some conflicts could not be resolved",
        variant: "destructive",
      });
    },
  });

  const handleConflictSelect = (conflictId: string) => {
    setSelectedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  };

  const handleApplyFix = (conflict: Conflict) => {
    if (!conflict.suggestedFix) return;
    
    applyFixMutation.mutate({
      conflictId: conflict.id,
      fix: conflict.suggestedFix,
    });
  };

  const handleApplyAll = () => {
    applyAllMutation.mutate();
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'task_overlap':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'dependency_violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'store_hours_violation':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'insufficient_buffer':
        return <Users className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConflictBadgeVariant = (type: string) => {
    switch (type) {
      case 'task_overlap':
        return 'secondary';
      case 'dependency_violation':
        return 'destructive';
      case 'store_hours_violation':
        return 'default';
      case 'insufficient_buffer':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'reschedule':
        return 'default';
      case 'extend_buffer':
        return 'secondary';
      case 'remove_dependency':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Schedule Conflicts
          </DialogTitle>
          <DialogDescription>
            Review and resolve scheduling conflicts for this event
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : conflicts.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No scheduling conflicts detected. Your event schedule looks good!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <h3 className="font-medium">Found {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConflicts.size} selected for resolution
                </p>
              </div>
              {selectedConflicts.size > 0 && (
                <Button
                  onClick={handleApplyAll}
                  disabled={applyAllMutation.isPending}
                  className="ml-4"
                >
                  {applyAllMutation.isPending ? 'Resolving...' : `Resolve ${selectedConflicts.size} Selected`}
                </Button>
              )}
            </div>

            {/* Conflicts List */}
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <Card key={conflict.id} className={`transition-colors ${
                  selectedConflicts.has(conflict.id) ? 'ring-2 ring-primary' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getConflictIcon(conflict.type)}
                        <CardTitle className="text-base">{conflict.description}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getConflictBadgeVariant(conflict.type)}>
                          {conflict.type.replace('_', ' ')}
                        </Badge>
                        <input
                          type="checkbox"
                          checked={selectedConflicts.has(conflict.id)}
                          onChange={() => handleConflictSelect(conflict.id)}
                          className="rounded border-gray-300"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Affected Tasks */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Affected Tasks:</h4>
                        <div className="flex flex-wrap gap-1">
                          {conflict.affectedTasks.map((taskId) => (
                            <Badge key={taskId} variant="outline" className="text-xs">
                              {taskId}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Fix */}
                      {conflict.suggestedFix && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Suggested Fix:</h4>
                            <Badge variant={getActionBadgeVariant(conflict.suggestedFix.action)}>
                              {conflict.suggestedFix.action.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {conflict.suggestedFix.action === 'reschedule' && 
                              `Reschedule to ${formatDateTime(conflict.suggestedFix.newValue)}`
                            }
                            {conflict.suggestedFix.action === 'extend_buffer' && 
                              `Extend buffer to ${conflict.suggestedFix.newValue} minutes`
                            }
                            {conflict.suggestedFix.action === 'remove_dependency' && 
                              'Remove dependency constraint'
                            }
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleApplyFix(conflict)}
                            disabled={applyFixMutation.isPending}
                            className="w-full"
                          >
                            {applyFixMutation.isPending ? 'Applying...' : 'Apply Fix'}
                          </Button>
                        </div>
                      )}

                      {!conflict.suggestedFix && (
                        <Alert>
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            No automatic fix available. Please resolve this conflict manually.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {conflicts.length > 0 && (
                <Button
                  onClick={() => refetch()}
                  variant="secondary"
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolver;
