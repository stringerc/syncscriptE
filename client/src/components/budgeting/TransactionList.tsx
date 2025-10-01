import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  ArrowUpDown,
  Calendar,
  Link as LinkIcon,
  DollarSign,
  Store
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function TransactionList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', searchQuery, selectedCategory, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('merchantName', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/budgeting/transactions?${params}`);
      return response.data.data;
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ transactionId, category, subcategory }: any) => {
      const response = await api.patch(`/budgeting/transactions/${transactionId}/category`, {
        category,
        subcategory
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      toast({
        title: 'Category Updated',
        description: 'Transaction category has been updated'
      });
    }
  });

  const transactions = transactionsData?.transactions || [];
  const totalPages = transactionsData?.pages || 1;

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Personal Care',
    'Home',
    'Travel',
    'Gifts & Donations',
    'Income',
    'Savings',
    'Uncategorized'
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Bills & Utilities': 'bg-gray-100 text-gray-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Income': 'bg-green-100 text-green-800',
      'Savings': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              {transactions.length} transactions found
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sync your accounts to see transactions
                </p>
              </div>
            ) : (
              transactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {transaction.merchantName || transaction.description}
                        </span>
                        {transaction.pending && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                        {transaction.isRecurring && (
                          <Badge variant="secondary" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        {transaction.financialAccount && (
                          <span>{transaction.financialAccount.accountName}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Select
                          value={transaction.category || ''}
                          onValueChange={(value) => {
                            updateCategoryMutation.mutate({
                              transactionId: transaction.id,
                              category: value
                            });
                          }}
                        >
                          <SelectTrigger className="w-[200px] h-8">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {transaction.category && (
                          <Badge className={getCategoryColor(transaction.category)}>
                            {transaction.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        transaction.amount < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount < 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      {transaction.confidence && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {(transaction.confidence * 100).toFixed(0)}% confidence
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

