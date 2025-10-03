import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  Upload
} from 'lucide-react';

interface BudgetLineItem {
  id?: string;
  name: string;
  url?: string;
  qty: number;
  unitPriceCents: number;
  categoryId?: string;
  notes?: string;
  isActual?: boolean;
}

interface TaskBudget {
  id: string;
  mode: 'total' | 'lines';
  taxCents: number;
  shippingCents: number;
  estimatedCents: number;
  actualCents?: number;
  includeInEvent: boolean;
  lineItems: BudgetLineItem[];
}

interface BudgetTotals {
  estimatedCents: number;
  actualCents: number;
  varianceCents: number;
  variancePercentage: number;
}

interface TaskBudgetDrawerProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TaskBudgetDrawer: React.FC<TaskBudgetDrawerProps> = ({ taskId, isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'total' | 'lines'>('total');
  const [budgetData, setBudgetData] = useState<TaskBudget | null>(null);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);

  // Fetch task budget
  const { data: budgetResponse, isLoading } = useQuery({
    queryKey: ['task-budget', taskId],
    queryFn: async () => {
      const response = await api.get(`/budget/tasks/${taskId}/budget`);
      return response.data;
    },
    enabled: isOpen && !!taskId,
  });

  // Fetch budget categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const response = await api.get('/budget/categories');
      return response.data;
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/budget/tasks/${taskId}/budget`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      queryClient.invalidateQueries({ queryKey: ['event-budget'] });
      toast({
        title: "Budget Updated",
        description: "Task budget has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update budget",
        variant: "destructive"
      });
    }
  });

  // Parse list mutation
  const parseListMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post('/budget/parse-list', { text });
      return response.data;
    },
    onSuccess: (data) => {
      setLineItems(data.data.items);
      setShowPasteModal(false);
      setPasteText('');
      toast({
        title: "List Parsed",
        description: `${data.data.items.length} items parsed successfully`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Parse Error",
        description: error.response?.data?.error || "Failed to parse list",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (budgetResponse?.data?.budget) {
      const budget = budgetResponse.data.budget;
      setMode(budget.mode);
      setBudgetData(budget);
      setLineItems(budget.lineItems || []);
    }
  }, [budgetResponse]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const calculateLineItemTotal = (item: BudgetLineItem) => {
    return item.qty * item.unitPriceCents;
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = budgetData?.taxCents || 0;
    const shipping = budgetData?.shippingCents || 0;
    return subtotal + tax + shipping;
  };

  const handleSave = () => {
    const data: any = {
      mode,
      taxCents: budgetData?.taxCents || 0,
      shippingCents: budgetData?.shippingCents || 0,
      includeInEvent: budgetData?.includeInEvent ?? true,
    };

    if (mode === 'total') {
      data.estimatedCents = budgetData?.estimatedCents || 0;
    } else {
      data.lineItems = lineItems;
    }

    updateBudgetMutation.mutate(data);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      name: '',
      qty: 1,
      unitPriceCents: 0,
    }]);
  };

  const updateLineItem = (index: number, field: keyof BudgetLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const categories = categoriesResponse?.data?.categories || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Task Budget</h2>
            <p className="text-sm text-muted-foreground">Manage budget for this task</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <Label>Budget Mode:</Label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={mode === 'total' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('total')}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Quick Total
              </Button>
              <Button
                variant={mode === 'lines' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('lines')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Line Items
              </Button>
            </div>
          </div>

          {/* Quick Total Mode */}
          {mode === 'total' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated">Estimated Total</Label>
                  <Input
                    id="estimated"
                    type="number"
                    step="0.01"
                    value={budgetData?.estimatedCents ? budgetData.estimatedCents / 100 : ''}
                    onChange={(e) => setBudgetData(prev => ({
                      ...prev!,
                      estimatedCents: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="actual">Actual Total (Optional)</Label>
                  <Input
                    id="actual"
                    type="number"
                    step="0.01"
                    value={budgetData?.actualCents ? budgetData.actualCents / 100 : ''}
                    onChange={(e) => setBudgetData(prev => ({
                      ...prev!,
                      actualCents: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    value={budgetData?.taxCents ? budgetData.taxCents / 100 : ''}
                    onChange={(e) => setBudgetData(prev => ({
                      ...prev!,
                      taxCents: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping">Shipping</Label>
                  <Input
                    id="shipping"
                    type="number"
                    step="0.01"
                    value={budgetData?.shippingCents ? budgetData.shippingCents / 100 : ''}
                    onChange={(e) => setBudgetData(prev => ({
                      ...prev!,
                      shippingCents: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Line Items Mode */}
          {mode === 'lines' && (
            <div className="space-y-4">
              {/* Paste List Button */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPasteModal(true)}
                  className="flex items-center"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Paste List
                </Button>
                <Button
                  variant="outline"
                  onClick={addLineItem}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Actual</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>
                <div className="divide-y">
                  {lineItems.map((item, index) => (
                    <div key={index} className="px-4 py-3">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <Input
                            value={item.name}
                            onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                            placeholder="Item name"
                          />
                          {item.url && (
                            <div className="flex items-center mt-1">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                Link
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPriceCents / 100}
                            onChange={(e) => updateLineItem(index, 'unitPriceCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(calculateLineItemTotal(item))}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={item.categoryId || ''}
                            onValueChange={(value) => updateLineItem(index, 'categoryId', value || undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Switch
                            checked={item.isActual || false}
                            onCheckedChange={(checked) => updateLineItem(index, 'isActual', checked)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(budgetData?.taxCents || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(budgetData?.shippingCents || 0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Include in Event Toggle */}
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              checked={budgetData?.includeInEvent ?? true}
              onCheckedChange={(checked) => setBudgetData(prev => ({
                ...prev!,
                includeInEvent: checked
              }))}
            />
            <Label>Include in event total</Label>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateBudgetMutation.isPending}>
            {updateBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
          </Button>
        </div>
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Paste Budget List</CardTitle>
              <CardDescription>
                Paste a list of items with quantities and prices. Supports formats like:
                <br />• "2 x Masking Tape - 3.49"
                <br />• "Paper Cups | 50 | 4.99 | https://..."
                <br />• "https://amazon.com/..." (URL only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your list here..."
                rows={8}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPasteModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => parseListMutation.mutate(pasteText)}
                  disabled={!pasteText.trim() || parseListMutation.isPending}
                >
                  {parseListMutation.isPending ? 'Parsing...' : 'Parse List'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TaskBudgetDrawer;
