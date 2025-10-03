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
  Sparkles,
  Camera,
  Upload,
  Receipt
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
  
  // Receipt scanning state
  const [isScanningReceipt, setIsScanningReceipt] = useState<boolean>(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState<boolean>(false);

  // Fetch task budget
  const { data: budgetData, isLoading, refetch } = useQuery({
    queryKey: ['task-budget', taskId],
    queryFn: async () => {
      const response = await api.get(`/budget/tasks/${taskId}`);
      return response.data.data;
    },
    enabled: isOpen && !!taskId
  });

  // Fetch budget history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['budget-history', taskId],
    queryFn: async () => {
      const response = await api.get(`/budget/tasks/${taskId}/history`);
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
    
    console.log('🔍 Save All Changes Debug:', {
      mode: taskBudget?.mode,
      quickTotalValue,
      currentEstimatedCents: taskBudget?.estimatedCents,
      currentEstimatedDollars: (taskBudget?.estimatedCents || 0) / 100,
      isDifferent: quickTotalValue !== (taskBudget?.estimatedCents || 0) / 100
    });
    
    // Save quick total if it's different from the current value
    if (taskBudget?.mode === 'total' && quickTotalValue !== (taskBudget.estimatedCents || 0) / 100) {
      console.log('💾 Saving total mode budget');
      updateBudgetMutation.mutate({
        mode: 'total',
        estimatedCents: Math.round(quickTotalValue * 100)
      });
      hasChanges = true;
    }
    
    // Save estimated total in lines mode if it's different from the current value
    if (taskBudget?.mode === 'lines' && quickTotalValue > 0 && quickTotalValue !== (taskBudget.estimatedCents || 0) / 100) {
      console.log('💾 Saving lines mode budget with estimated total');
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
    
    console.log('🔍 Final hasChanges:', hasChanges);
    
    if (hasChanges) {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['task-budget', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: "Budget Saved",
        description: "All budget changes have been saved successfully",
      });
    } else {
      console.log('❌ No changes detected - showing no changes toast');
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

  // Receipt scanning functions
  const handleTakePhoto = async () => {
    setIsScanningReceipt(true);
    
    try {
      // Try to access the camera directly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Create a video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(void 0);
        };
      });
      
      // Create a modal for camera interface
      const modal = document.createElement('div');
      modal.className = 'camera-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.95);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      const videoContainer = document.createElement('div');
      videoContainer.style.cssText = `
        position: relative;
        max-width: 90vw;
        max-height: 70vh;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      `;
      
      video.style.cssText = `
        width: 100%;
        height: auto;
        display: block;
        border-radius: 12px;
      `;
      
      const controls = document.createElement('div');
      controls.style.cssText = `
        display: flex;
        gap: 20px;
        margin-top: 30px;
        align-items: center;
      `;
      
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📷 Capture Receipt';
      captureBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 16px 32px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
        transition: all 0.2s ease;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      `;
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.style.cssText = `
        background: #6b7280;
        color: white;
        border: none;
        padding: 16px 32px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 14px 0 rgba(107, 114, 128, 0.4);
        transition: all 0.2s ease;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      `;
      
      // Add hover effects
      captureBtn.onmouseenter = () => {
        captureBtn.style.background = '#2563eb';
        captureBtn.style.transform = 'translateY(-2px)';
      };
      captureBtn.onmouseleave = () => {
        captureBtn.style.background = '#3b82f6';
        captureBtn.style.transform = 'translateY(0)';
      };
      
      cancelBtn.onmouseenter = () => {
        cancelBtn.style.background = '#4b5563';
        cancelBtn.style.transform = 'translateY(-2px)';
      };
      cancelBtn.onmouseleave = () => {
        cancelBtn.style.background = '#6b7280';
        cancelBtn.style.transform = 'translateY(0)';
      };
      
      const capturePhoto = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Capture button clicked');
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
            handleReceiptImage(file);
          }
        }, 'image/jpeg', 0.8);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        setIsScanningReceipt(false);
      };
      
      const cancelCapture = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Cancel button clicked');
        
        stream.getTracks().forEach(track => track.stop());
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        setIsScanningReceipt(false);
      };
      
      // Use both onclick and addEventListener for better compatibility
      captureBtn.onclick = capturePhoto;
      captureBtn.addEventListener('click', capturePhoto, true);
      captureBtn.addEventListener('touchstart', capturePhoto, true);
      
      cancelBtn.onclick = cancelCapture;
      cancelBtn.addEventListener('click', cancelCapture, true);
      cancelBtn.addEventListener('touchstart', cancelCapture, true);
      
      // Add escape key handler
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancelCapture(e);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      // Clean up escape handler when modal is removed
      const originalRemoveChild = document.body.removeChild;
      document.body.removeChild = function(node) {
        if (node === modal) {
          document.removeEventListener('keydown', handleEscape);
        }
        return originalRemoveChild.call(this, node);
      };
      
      controls.appendChild(captureBtn);
      controls.appendChild(cancelBtn);
      
      videoContainer.appendChild(video);
      modal.appendChild(videoContainer);
      modal.appendChild(controls);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Camera access failed:', error);
      setIsScanningReceipt(false);
      
      // Fallback to file input with camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleReceiptImage(file);
        }
      };
      input.click();
    }
  };

  const handleUploadReceipt = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true; // Allow multiple file selection
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleMultipleReceiptImages(Array.from(files));
      }
    };
    input.click();
  };

  const handleReceiptImage = async (file: File) => {
    setIsProcessingReceipt(true);
    
    try {
      // Convert file to base64 for OCR processing
      const base64 = await fileToBase64(file);
      setReceiptImage(base64);
      
      // Call AI endpoint to parse receipt
      const response = await api.post('/ai/receipt/parse', {
        image: base64,
        taskId: taskId
      });
      
      const { lineItems } = response.data.data;
      
      if (lineItems && lineItems.length > 0) {
        // Auto-populate line items
        const newLineItems = lineItems.map((item: any) => ({
          name: item.name,
          qty: item.qty || 1,
          unitPriceCents: Math.round((item.price || 0) * 100),
          categoryId: item.categoryId,
          notes: item.notes || ''
        }));
        
        // Update the budget with new line items
        updateBudgetMutation.mutate({
          mode: 'lines',
          lineItems: [...(taskBudget?.lineItems || []), ...newLineItems]
        });
        
        toast({
          title: "Receipt Processed",
          description: `Found ${lineItems.length} items from your receipt`,
          variant: "default"
        });
      } else {
        toast({
          title: "No Items Found",
          description: "Could not extract line items from the receipt",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Receipt processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.response?.data?.error || "Failed to process receipt",
        variant: "destructive"
      });
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const handleMultipleReceiptImages = async (files: File[]) => {
    setIsProcessingReceipt(true);
    
    try {
      let allLineItems: any[] = [];
      let processedCount = 0;
      let failedCount = 0;
      
      // Process each receipt sequentially to avoid overwhelming the API
      for (const file of files) {
        try {
          const base64 = await fileToBase64(file);
          
          const response = await api.post('/ai/receipt/parse', {
            image: base64,
            taskId: taskId
          });
          
          const { lineItems } = response.data.data;
          
          if (lineItems && lineItems.length > 0) {
            allLineItems = [...allLineItems, ...lineItems];
            processedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          failedCount++;
        }
      }
      
      if (allLineItems.length > 0) {
        // Auto-populate all line items
        const newLineItems = allLineItems.map((item: any) => ({
          name: item.name,
          qty: item.qty || 1,
          unitPriceCents: Math.round((item.price || 0) * 100),
          categoryId: item.categoryId,
          notes: item.notes || ''
        }));
        
        // Update the budget with all new line items
        updateBudgetMutation.mutate({
          mode: 'lines',
          lineItems: [...(taskBudget?.lineItems || []), ...newLineItems]
        });
        
        toast({
          title: "Receipts Processed",
          description: `Processed ${processedCount} receipts, found ${allLineItems.length} items${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
          variant: "default"
        });
      } else {
        toast({
          title: "No Items Found",
          description: `Could not extract items from any of the ${files.length} receipts`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Multiple receipt processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.response?.data?.error || "Failed to process receipts",
        variant: "destructive"
      });
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="z-[60]" />
      <DialogContent className="w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto z-[60] [&>button]:hidden">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Task Budget
          </DialogTitle>
          <DialogDescription>
            Manage budget for this task
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
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
                      <Badge variant={
                        (taskBudget?.mode === 'total') || 
                        (taskBudget?.estimatedCents && taskBudget.estimatedCents > 0) || 
                        (quickTotalValue > 0) 
                        ? 'default' : 'secondary'
                      }>
                        {(taskBudget?.mode === 'total') || 
                         (taskBudget?.estimatedCents && taskBudget.estimatedCents > 0) || 
                         (quickTotalValue > 0) 
                         ? 'Active' : 'Inactive'}
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
                        {taskBudget?.mode === 'lines' && (
                          <Button
                            variant="outline"
                            onClick={() => handleSaveEstimatedTotal()}
                            disabled={quickTotalValue <= 0}
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
                      <div className="flex gap-2">
                        <Button onClick={handleAddLineItem} disabled={addLineItemMutation.isPending}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleTakePhoto}
                          disabled={isScanningReceipt || isProcessingReceipt}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {isScanningReceipt ? 'Taking Photo...' : 'Scan Receipt'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleUploadReceipt}
                          disabled={isProcessingReceipt}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Receipt(s)
                        </Button>
                      </div>
                    </div>

                    {/* Receipt processing indicator */}
                    {isProcessingReceipt && (
                      <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-5 w-5 text-blue-600 animate-pulse" />
                          <span className="text-blue-800 font-medium">
                            {isScanningReceipt ? 'Taking photo...' : 'Processing receipt(s)...'}
                          </span>
                        </div>
                      </div>
                    )}

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
                    {historyLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Loading history...</p>
                      </div>
                    ) : historyData?.history?.length > 0 ? (
                      <div className="space-y-4">
                        {historyData.history.map((entry: any) => (
                          <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {entry.changeType.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                by {entry.user?.name || entry.user?.email || 'Unknown'}
                              </span>
                            </div>
                            {entry.changeReason && (
                              <p className="text-sm text-gray-700 mb-2">{entry.changeReason}</p>
                            )}
                            {entry.oldValue && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Before:</span> {JSON.stringify(entry.oldValue, null, 2)}
                              </div>
                            )}
                            {entry.newValue && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">After:</span> {JSON.stringify(entry.newValue, null, 2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No history available yet</p>
                        <p className="text-sm">Budget changes will appear here</p>
                      </div>
                    )}
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
