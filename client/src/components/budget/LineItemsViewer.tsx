import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Package, DollarSign } from 'lucide-react';

interface LineItemsViewerProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BudgetLineItem {
  id: string;
  name: string;
  url?: string;
  qty: number;
  unitPriceCents: number;
  categoryId?: string;
  notes?: string;
  isActual: boolean;
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

export function LineItemsViewer({ taskId, isOpen, onClose }: LineItemsViewerProps) {
  // Fetch task budget
  const { data: taskBudget, isLoading } = useQuery({
    queryKey: ['task-budget', taskId],
    queryFn: async () => {
      const response = await api.get(`/budget/tasks/${taskId}`);
      return response.data.data.budget as TaskBudget;
    },
    enabled: isOpen && !!taskId
  });

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateLineTotal = (item: BudgetLineItem) => {
    return item.qty * item.unitPriceCents;
  };

  const calculateSubtotal = () => {
    if (!taskBudget?.lineItems) return 0;
    return taskBudget.lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = taskBudget?.taxCents || 0;
    const shipping = taskBudget?.shippingCents || 0;
    return subtotal + tax + shipping;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Line Items Budget
          </DialogTitle>
          <DialogDescription>
            View detailed breakdown of budget line items for this task
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !taskBudget || taskBudget.mode !== 'lines' || !taskBudget.lineItems || taskBudget.lineItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No line items found for this task.</p>
            <p className="text-sm">This task uses a quick total budget instead of line items.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Line Items List */}
            <div className="space-y-3">
              {taskBudget.lineItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        {item.isActual && (
                          <Badge variant="secondary" className="text-xs">
                            Actual
                          </Badge>
                        )}
                      </div>
                      
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Link
                        </a>
                      )}
                      
                      {item.notes && (
                        <p className="text-xs text-gray-600">{item.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-500">Qty: </span>
                        <span className="font-medium">{item.qty}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Unit: </span>
                        <span className="font-medium">{formatCurrency(item.unitPriceCents)}</span>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        Total: {formatCurrency(calculateLineTotal(item))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Budget Summary */}
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                {taskBudget.taxCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(taskBudget.taxCents)}</span>
                  </div>
                )}
                
                {taskBudget.shippingCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>{formatCurrency(taskBudget.shippingCents)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Total:
                  </span>
                  <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
