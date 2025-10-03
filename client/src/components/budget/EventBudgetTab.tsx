import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  PieChart,
  BarChart3
} from 'lucide-react';

interface EventBudgetTabProps {
  eventId: string;
}

interface BudgetEnvelope {
  id: string;
  eventId: string;
  currency: string;
  capCents?: number;
  createdAt: string;
  updatedAt: string;
  eventItems: EventBudgetItem[];
}

interface EventBudgetItem {
  id: string;
  eventId: string;
  name: string;
  url?: string;
  estimatedCents: number;
  actualCents?: number;
  categoryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export function EventBudgetTab({ eventId }: EventBudgetTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    url: '',
    estimatedCents: 0,
    categoryId: '',
    notes: ''
  });

  // Fetch budget envelope
  const { data: budgetEnvelope, isLoading } = useQuery({
    queryKey: ['event-budget-envelope', eventId],
    queryFn: async () => {
      const response = await api.get(`/budget/events/${eventId}/envelope`);
      return response.data.data;
    },
    enabled: !!eventId
  });

  // Fetch budget categories
  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const response = await api.get('/budget/categories');
      return response.data.data || [];
    }
  });

  // Create/update budget envelope mutation
  const updateEnvelopeMutation = useMutation({
    mutationFn: async (data: Partial<BudgetEnvelope>) => {
      const response = await api.put(`/budget/events/${eventId}/envelope`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-budget-envelope', eventId] });
      toast({
        title: "Budget Updated",
        description: "Event budget envelope has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update budget envelope",
        variant: "destructive"
      });
    }
  });

  // Add event budget item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: Partial<EventBudgetItem>) => {
      const response = await api.post(`/budget/events/${eventId}/items`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-budget-envelope', eventId] });
      setNewItem({
        name: '',
        url: '',
        estimatedCents: 0,
        categoryId: '',
        notes: ''
      });
      toast({
        title: "Item Added",
        description: "Budget item has been added successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Add Failed",
        description: error.response?.data?.error || "Failed to add budget item",
        variant: "destructive"
      });
    }
  });

  // Update event budget item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<EventBudgetItem> }) => {
      const response = await api.put(`/budget/event-items/${itemId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-budget-envelope', eventId] });
      setEditingItemId(null);
      toast({
        title: "Item Updated",
        description: "Budget item has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update budget item",
        variant: "destructive"
      });
    }
  });

  // Delete event budget item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/budget/event-items/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-budget-envelope', eventId] });
      toast({
        title: "Item Deleted",
        description: "Budget item has been deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete budget item",
        variant: "destructive"
      });
    }
  });

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateEstimatedTotal = () => {
    if (!budgetEnvelope?.eventItems) return 0;
    return budgetEnvelope.eventItems.reduce((sum, item) => sum + item.estimatedCents, 0);
  };

  const calculateActualTotal = () => {
    if (!budgetEnvelope?.eventItems) return 0;
    return budgetEnvelope.eventItems.reduce((sum, item) => sum + (item.actualCents || 0), 0);
  };

  const getCategoryById = (categoryId: string) => {
    return Array.isArray(categories) ? categories.find(cat => cat.id === categoryId) : undefined;
  };

  const getCategoryTotals = () => {
    if (!budgetEnvelope?.eventItems || !Array.isArray(categories)) return {};
    
    const totals: Record<string, { estimated: number; actual: number; count: number }> = {};
    
    budgetEnvelope.eventItems.forEach(item => {
      const categoryId = item.categoryId || 'uncategorized';
      if (!totals[categoryId]) {
        totals[categoryId] = { estimated: 0, actual: 0, count: 0 };
      }
      totals[categoryId].estimated += item.estimatedCents;
      totals[categoryId].actual += item.actualCents || 0;
      totals[categoryId].count += 1;
    });
    
    return totals;
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Item name is required",
        variant: "destructive"
      });
      return;
    }

    addItemMutation.mutate({
      name: newItem.name,
      url: newItem.url || undefined,
      estimatedCents: Math.round(newItem.estimatedCents * 100),
      categoryId: newItem.categoryId || undefined,
      notes: newItem.notes || undefined
    });
  };

  const handleUpdateItem = (itemId: string, data: Partial<EventBudgetItem>) => {
    updateItemMutation.mutate({ itemId, data });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this budget item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleSetActual = (itemId: string, actualCents: number) => {
    handleUpdateItem(itemId, { actualCents });
  };

  const categoryTotals = getCategoryTotals();
  const estimatedTotal = calculateEstimatedTotal();
  const actualTotal = calculateActualTotal();
  const isOverBudget = budgetEnvelope?.capCents && actualTotal > budgetEnvelope.capCents;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget Summary
              </CardTitle>
              <CardDescription>
                Overview of event budget and spending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Budget Cap */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <Label htmlFor="budget-cap">Budget Cap</Label>
                  <p className="text-sm text-gray-600">Maximum budget for this event</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="budget-cap"
                    type="number"
                    step="0.01"
                    value={budgetEnvelope?.capCents ? budgetEnvelope.capCents / 100 : 0}
                    onChange={(e) => updateEnvelopeMutation.mutate({ 
                      capCents: Math.round((parseFloat(e.target.value) || 0) * 100) 
                    })}
                    className="w-32"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-600">USD</span>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800">Estimated Total:</span>
                    <span className="font-bold text-green-900">
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {budgetEnvelope?.eventItems?.length || 0} items
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">Actual Total:</span>
                    <span className="font-bold text-blue-900">
                      {formatCurrency(actualTotal)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {budgetEnvelope?.eventItems?.filter(item => item.actualCents).length || 0} items recorded
                  </p>
                </div>
              </div>

              {/* Budget Status */}
              {budgetEnvelope?.capCents && (
                <div className={`p-4 border rounded-lg ${
                  isOverBudget 
                    ? 'bg-red-50 border-red-200' 
                    : actualTotal > budgetEnvelope.capCents * 0.8 
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {isOverBudget ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : actualTotal > budgetEnvelope.capCents * 0.8 ? (
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className={`font-medium ${
                      isOverBudget ? 'text-red-800' : 
                      actualTotal > budgetEnvelope.capCents * 0.8 ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {isOverBudget ? 'Over Budget' : 
                       actualTotal > budgetEnvelope.capCents * 0.8 ? 'Approaching Budget Limit' : 'Within Budget'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Spent: {formatCurrency(actualTotal)}</span>
                      <span>Budget: {formatCurrency(budgetEnvelope.capCents)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-red-500' : 
                          actualTotal > budgetEnvelope.capCents * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (actualTotal / budgetEnvelope.capCents) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {/* Add New Item */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Budget Item
              </CardTitle>
              <CardDescription>
                Add a new budget item for this event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input
                    id="item-name"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Catering, Venue, Equipment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-url">URL (Optional)</Label>
                  <Input
                    id="item-url"
                    value={newItem.url}
                    onChange={(e) => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://vendor.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-estimated">Estimated Cost</Label>
                  <Input
                    id="item-estimated"
                    type="number"
                    step="0.01"
                    value={newItem.estimatedCents / 100}
                    onChange={(e) => setNewItem(prev => ({ 
                      ...prev, 
                      estimatedCents: Math.round((parseFloat(e.target.value) || 0) * 100) 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category</Label>
                  <Select value={newItem.categoryId} onValueChange={(value) => setNewItem(prev => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(categories) && categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon && <span className="mr-2">{category.icon}</span>}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-notes">Notes (Optional)</Label>
                <Textarea
                  id="item-notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this budget item"
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Budget Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Items</CardTitle>
              <CardDescription>
                Manage individual budget items for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgetEnvelope?.eventItems && budgetEnvelope.eventItems.length > 0 ? (
                <div className="space-y-4">
                  {budgetEnvelope.eventItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          {editingItemId === item.id ? (
                            <div className="space-y-3">
                              <Input
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                                placeholder="Item name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.estimatedCents / 100}
                                  onChange={(e) => handleUpdateItem(item.id, { 
                                    estimatedCents: Math.round((parseFloat(e.target.value) || 0) * 100) 
                                  })}
                                  placeholder="Estimated"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={(item.actualCents || 0) / 100}
                                  onChange={(e) => handleSetActual(item.id, Math.round((parseFloat(e.target.value) || 0) * 100))}
                                  placeholder="Actual"
                                />
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
                                value={item.notes || ''}
                                onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                                placeholder="Notes (optional)"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setEditingItemId(null)}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingItemId(null)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{item.name}</h4>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">
                                      Est: {formatCurrency(item.estimatedCents)}
                                    </div>
                                    {item.actualCents && (
                                      <div className="text-sm font-medium">
                                        Act: {formatCurrency(item.actualCents)}
                                      </div>
                                    )}
                                  </div>
                                  {getCategoryById(item.categoryId || '') && (
                                    <Badge variant="secondary">
                                      {getCategoryById(item.categoryId || '')?.icon} {getCategoryById(item.categoryId || '')?.name}
                                    </Badge>
                                  )}
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
                                  onClick={() => setEditingItemId(item.id)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteItem(item.id)}
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
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No budget items yet</p>
                  <p className="text-sm">Add your first budget item to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget by Category</CardTitle>
              <CardDescription>
                View budget breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(categoryTotals).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(categoryTotals).map(([categoryId, totals]) => {
                    const category = getCategoryById(categoryId);
                    return (
                      <Card key={categoryId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {category?.icon && <span className="text-lg">{category.icon}</span>}
                            <div>
                              <h4 className="font-medium">
                                {category?.name || 'Uncategorized'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {totals.count} item{totals.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              Est: {formatCurrency(totals.estimated)}
                            </div>
                            {totals.actual > 0 && (
                              <div className="text-sm font-medium">
                                Act: {formatCurrency(totals.actual)}
                              </div>
                            )}
                          </div>
                        </div>
                        {totals.actual > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{Math.round((totals.actual / totals.estimated) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (totals.actual / totals.estimated) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No categories yet</p>
                  <p className="text-sm">Add budget items with categories to see the breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}