import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Calculator,
  List,
  History,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface BudgetModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TaskBudget {
  id: string;
  taskId: string;
  mode: 'total' | 'lines';
  taxCents: number;
  shippingCents: number;
  estimatedCents: number;
  actualCents?: number;
  includeInEvent: boolean;
  lineItems: BudgetLineItem[];
}

interface BudgetLineItem {
  id: string;
  taskBudgetId: string;
  name: string;
  url?: string;
  qty: number;
  unitPriceCents: number;
  categoryId?: string;
  notes?: string;
  isActual: boolean;
}

interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export function BudgetModal({ taskId, isOpen, onClose }: BudgetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('quick-total');
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [editingItemData, setEditingItemData] = useState<Partial<BudgetLineItem>>({});
  const [quickTotalValue, setQuickTotalValue] = useState<number>(0);
  const [isQuickTotalFocused, setIsQuickTotalFocused] = useState<boolean>(false);
  const [focusedPriceInputId, setFocusedPriceInputId] = useState<string | null>(null);
  const [isSuggestingEstimate, setIsSuggestingEstimate] = useState<boolean>(false);

  // Fetch task budget
  const { data: budgetData, isLoading, refetch } = useQuery({
    queryKey: ['task-budget', taskId],
    queryFn: async () => {
      const response = await api.get(`/budget/tasks/${taskId}`);
      return response.data.data;
    },
    enabled: isOpen && !!taskId
  });

  const taskBudget = budgetData?.budget;

  // Refetch budget data when modal opens
  useEffect(() => {
    if (isOpen && taskId) {
      refetch();
    }
  }, [isOpen, taskId, refetch]);

  // Sync quickTotalValue with taskBudget changes
  useEffect(() => {
    if (taskBudget?.estimatedCents !== undefined) {
      setQuickTotalValue(taskBudget.estimatedCents / 100);
    }
  }, [taskBudget?.estimatedCents]);


  // Fetch budget categories
  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const response = await api.get('/budget/categories');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  // Create/update task budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (data: Partial<TaskBudget>) => {
      const response = await api.put(`/budget/tasks/${taskId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Budget Updated",
        description: "Task budget has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update task budget",
        variant: "destructive"
      });
    }
  });

  // Add line item mutation
  const addLineItemMutation = useMutation({
    mutationFn: async (data: Partial<BudgetLineItem>) => {
      const response = await api.post(`/budget/tasks/${taskId}/line-items`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      toast({
        title: "Line Item Added",
        description: "Budget line item has been added successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Add Failed",
        description: error.response?.data?.error || "Failed to add line item",
        variant: "destructive"
      });
    }
  });

  // Update line item mutation
  const updateLineItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<BudgetLineItem> }) => {
      const response = await api.put(`/budget/line-items/${itemId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      setEditingItemId(null);
      toast({
        title: "Line Item Updated",
        description: "Budget line item has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update line item",
        variant: "destructive"
      });
    }
  });

  // Delete line item mutation
  const deleteLineItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/budget/line-items/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      toast({
        title: "Line Item Deleted",
        description: "Budget line item has been deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete line item",
        variant: "destructive"
      });
    }
  });

  // AI suggestion mutation
  const suggestEstimateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/ai/tasks/${taskId}/suggest-budget`);
      return response.data;
    },
    onSuccess: (data) => {
      const suggestedAmount = data.data?.suggestedAmount || 0;
      setQuickTotalValue(suggestedAmount);
      setIsSuggestingEstimate(false);
      toast({
        title: "Estimate Suggested",
        description: `AI suggested an estimated cost of $${suggestedAmount.toFixed(2)}`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      setIsSuggestingEstimate(false);
      toast({
        title: "Suggestion Failed",
        description: error.response?.data?.error || "Failed to generate budget estimate",
        variant: "destructive"
      });
    }
  });


  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateLineItemTotal = (item: BudgetLineItem) => {
    return item.qty * item.unitPriceCents;
  };

  const calculateLineItemsTotal = () => {
    if (!taskBudget || !taskBudget.lineItems) return 0;
    
    return taskBudget.lineItems.reduce((sum, item) => {
      return sum + calculateLineItemTotal(item);
    }, 0);
  };

  const calculateTotal = () => {
    if (!taskBudget) return 0;
    
    if (taskBudget.mode === 'total') {
      return taskBudget.estimatedCents || 0;
    } else {
      const lineItemsTotal = calculateLineItemsTotal();
      return lineItemsTotal + (taskBudget.taxCents || 0) + (taskBudget.shippingCents || 0);
    }
  };

  const handleQuickTotalUpdate = (value: number) => {
    updateBudgetMutation.mutate({
      mode: 'total',
      estimatedCents: Math.round(value * 100)
    });
  };

  const handleSaveQuickTotal = () => {
    updateBudgetMutation.mutate({
      mode: 'total',
      estimatedCents: Math.round(quickTotalValue * 100)
    });
  };

  const handleSaveAll = () => {
    let hasChanges = false;
    
    // Save quick total if it's different from the current value
    if (taskBudget?.mode === 'total' && quickTotalValue !== (taskBudget.estimatedCents || 0) / 100) {
      updateBudgetMutation.mutate({
        mode: 'total',
        estimatedCents: Math.round(quickTotalValue * 100)
      });
      hasChanges = true;
    }
    
    // Save estimated total in lines mode if it's different from the current value
    if (taskBudget?.mode === 'lines' && quickTotalValue > 0 && quickTotalValue !== (taskBudget.estimatedCents || 0) / 100) {
      updateBudgetMutation.mutate({
        mode: taskBudget.mode,
        estimatedCents: Math.round(quickTotalValue * 100),
        taxCents: taskBudget.taxCents || 0,
        shippingCents: taskBudget.shippingCents || 0,
        lineItems: taskBudget.lineItems || []
      });
      hasChanges = true;
    }
    
    // Save any pending line item edits
    if (editingItemId && editingItemData) {
      updateLineItemMutation.mutate({ itemId: editingItemId, data: editingItemData });
      hasChanges = true;
    }
    
    if (hasChanges) {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: "Budget Saved",
        description: "All budget changes have been saved successfully",
      });
    } else {
      toast({
        title: "No Changes",
        description: "No budget changes to save",
        variant: "default"
      });
    }
  };

  const handleModeChange = (mode: 'total' | 'lines') => {
    updateBudgetMutation.mutate({ mode });
  };

  const handleAddLineItem = () => {
    addLineItemMutation.mutate({
      name: 'New Item',
      qty: 1,
      unitPriceCents: 0,
      isActual: false
    });
  };

  const handleUpdateLineItem = (itemId: string, data: Partial<BudgetLineItem>) => {
    updateLineItemMutation.mutate({ itemId, data });
  };

  const handleStartEditItem = (item: BudgetLineItem) => {
    setEditingItemId(item.id);
    setEditingItemData({
      name: item.name,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents / 100, // Convert from cents to dollars for editing
      notes: item.notes
    });
  };

  const handleSaveEditItem = (itemId: string) => {
    updateLineItemMutation.mutate({ itemId, data: editingItemData });
    setEditingItemId(null);
    setEditingItemData({});
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemData({});
  };

  const handleDeleteLineItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this line item?')) {
      deleteLineItemMutation.mutate(itemId);
    }
  };

  const handleSaveEstimatedTotal = () => {
    if (quickTotalValue > 0 && taskBudget) {
      updateBudgetMutation.mutate({
        mode: taskBudget.mode,
        estimatedCents: Math.round(quickTotalValue * 100),
        taxCents: taskBudget.taxCents || 0,
        shippingCents: taskBudget.shippingCents || 0,
        lineItems: taskBudget.lineItems || []
      });
    }
  };

  const handleSuggestEstimate = () => {
    setIsSuggestingEstimate(true);
    suggestEstimateMutation.mutate();
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="z-[60]" />
      <DialogContent className="w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Task Budget
          </DialogTitle>
          <DialogDescription>
            Manage budget for this task
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quick-total" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Quick Total
                </TabsTrigger>
                <TabsTrigger value="line-items" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Line Items
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quick-total" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>AI Budget Estimate</span>
                      <Badge variant={taskBudget?.mode === 'total' ? 'default' : 'secondary'}>
                        {taskBudget?.mode === 'total' ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Get an AI-suggested budget estimate based on your task details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="quick-total">Estimated Total</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <Input
                            id="quick-total"
                            type="text"
                            value={isQuickTotalFocused ? (quickTotalValue === 0 ? '' : quickTotalValue.toString()) : quickTotalValue.toFixed(2)}
                            onChange={(e) => {
                              let value = e.target.value;
                              
                              // Remove dollar sign and other non-numeric characters except decimal point
                              value = value.replace(/[^0-9.]/g, '');
                              
                              // Handle multiple decimal points - keep only the first one
                              const decimalIndex = value.indexOf('.');
                              if (decimalIndex !== -1) {
                                value = value.substring(0, decimalIndex + 1) + value.substring(decimalIndex + 1).replace(/\./g, '');
                              }
                              
                              // Handle leading zeros - allow "0.50" but not "00.50"
                              if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
                                value = value.substring(1);
                              }
                              
                              // Convert to number
                              const numValue = value === '' ? 0 : parseFloat(value);
                              
                              // Only update if it's a valid number or empty string
                              if (!isNaN(numValue) || value === '') {
                                setQuickTotalValue(numValue);
                              }
                            }}
                            onFocus={() => setIsQuickTotalFocused(true)}
                            onBlur={() => setIsQuickTotalFocused(false)}
                            placeholder={isQuickTotalFocused ? "" : "0.00"}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleSuggestEstimate}
                          disabled={isSuggestingEstimate}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isSuggestingEstimate ? 'Suggesting...' : 'Suggest Estimate'}
                        </Button>
                        {taskBudget?.mode === 'lines' && quickTotalValue > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => handleSaveEstimatedTotal()}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Estimated
                          </Button>
                        )}
                        {taskBudget?.mode === 'total' && quickTotalValue > 0 && (
                          <Button
                            variant="default"
                            onClick={() => handleModeChange('total')}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Use Quick Total
                          </Button>
                        )}
                      </div>
                    </div>


                    {/* Auto-calculated actual cost from line items */}
                    {taskBudget?.mode === 'lines' && taskBudget?.lineItems && taskBudget.lineItems.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-800">Actual Cost (from line items):</span>
                          <span className="font-bold text-green-900">
                            {formatCurrency(calculateLineItemsTotal())}
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Automatically calculated from your line items
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-800">Current Total:</span>
                        <span className="font-bold text-blue-900">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="line-items" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Line Items</span>
                      <Badge variant={taskBudget?.mode === 'lines' ? 'default' : 'secondary'}>
                        {taskBudget?.mode === 'lines' ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Break down your budget into individual line items
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant={taskBudget?.mode === 'lines' ? 'default' : 'outline'}
                        onClick={() => handleModeChange('lines')}
                      >
                        <List className="h-4 w-4 mr-2" />
                        Use Line Items
                      </Button>
                      <Button onClick={handleAddLineItem} disabled={addLineItemMutation.isPending}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>

                    {taskBudget?.lineItems && taskBudget.lineItems.length > 0 ? (
                      <div className="space-y-3">
                        {taskBudget.lineItems.map((item) => (
                          <Card key={item.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 space-y-2">
                                {editingItemId === item.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editingItemData.name || ''}
                                      onChange={(e) => setEditingItemData(prev => ({ ...prev, name: e.target.value }))}
                                      placeholder="Item name"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <Label htmlFor={`qty-${item.id}`} className="text-sm font-medium">Quantity</Label>
                                        <Input
                                          id={`qty-${item.id}`}
                                          type="number"
                                          min="1"
                                          value={editingItemData.qty || 1}
                                          onChange={(e) => setEditingItemData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                                          placeholder="1"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`price-${item.id}`} className="text-sm font-medium">Unit Price</Label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                          <Input
                                            id={`price-${item.id}`}
                                            type="text"
                                            value={focusedPriceInputId === item.id ? 
                                              (editingItemData.unitPriceCents === 0 ? '' : editingItemData.unitPriceCents.toString()) : 
                                              (editingItemData.unitPriceCents ? editingItemData.unitPriceCents.toFixed(2) : '0.00')
                                            }
                                            onChange={(e) => {
                                              let value = e.target.value;
                                              
                                              // Remove dollar sign and other non-numeric characters except decimal point
                                              value = value.replace(/[^0-9.]/g, '');
                                              
                                              // Handle multiple decimal points - keep only the first one
                                              const decimalIndex = value.indexOf('.');
                                              if (decimalIndex !== -1) {
                                                value = value.substring(0, decimalIndex + 1) + value.substring(decimalIndex + 1).replace(/\./g, '');
                                              }
                                              
                                              // Handle leading zeros - allow "0.50" but not "00.50"
                                              if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
                                                value = value.substring(1);
                                              }
                                              
                                              // Convert to number
                                              const numValue = value === '' ? 0 : parseFloat(value);
                                              
                                              // Only update if it's a valid number or empty string
                                              if (!isNaN(numValue) || value === '') {
                                                setEditingItemData(prev => ({ ...prev, unitPriceCents: numValue }));
                                              }
                                            }}
                                            onFocus={() => setFocusedPriceInputId(item.id)}
                                            onBlur={() => setFocusedPriceInputId(null)}
                                            placeholder={focusedPriceInputId === item.id ? "" : "0.00"}
                                            className="pl-8"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    {item.url && (
                                      <div className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-gray-500" />
                                        <a 
                                          href={item.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm"
                                        >
                                          {item.url}
                                        </a>
                                      </div>
                                    )}
                                    <Textarea
                                      value={editingItemData.notes || ''}
                                      onChange={(e) => setEditingItemData(prev => ({ ...prev, notes: e.target.value }))}
                                      placeholder="Notes (optional)"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEditItem}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel Edit
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">{item.name}</h4>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                          {item.qty} × {formatCurrency(item.unitPriceCents)}
                                        </span>
                                        <span className="font-bold">
                                          {formatCurrency(calculateLineItemTotal(item))}
                                        </span>
                                      </div>
                                    </div>
                                    {item.url && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <ExternalLink className="h-3 w-3 text-gray-500" />
                                        <a 
                                          href={item.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-xs"
                                        >
                                          View Link
                                        </a>
                                      </div>
                                    )}
                                    {item.notes && (
                                      <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStartEditItem(item)}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteLineItem(item.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No line items yet</p>
                        <p className="text-sm">Add your first line item to get started</p>
                      </div>
                    )}

                    {taskBudget?.mode === 'lines' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-800">Subtotal:</span>
                            <span className="text-blue-800">
                              {formatCurrency(taskBudget.lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item), 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-800">Tax:</span>
                            <span className="text-blue-800">{formatCurrency(taskBudget.taxCents)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-800">Shipping:</span>
                            <span className="text-blue-800">{formatCurrency(taskBudget.shippingCents)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-blue-300 pt-2">
                            <span className="text-blue-900">Total:</span>
                            <span className="text-blue-900">{formatCurrency(calculateTotal())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Budget History</CardTitle>
                    <CardDescription>
                      Track changes to your budget over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No history available yet</p>
                      <p className="text-sm">Budget changes will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={updateBudgetMutation.isPending || updateLineItemMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
