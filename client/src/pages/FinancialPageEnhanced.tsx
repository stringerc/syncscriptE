import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, RefreshCw, TrendingUp, BarChart3, Target, List, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { usePlaidLink } from 'react-plaid-link';
import { BudgetOverview } from '@/components/budgeting/BudgetOverview';
import { TransactionList } from '@/components/budgeting/TransactionList';
import { SavingsGoals } from '@/components/budgeting/SavingsGoals';

export function FinancialPageEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch financial accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['financial-accounts'],
    queryFn: async () => {
      const response = await api.get('/financial/accounts');
      return response.data.data;
    }
  });

  // Create link token for Plaid
  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/financial/plaid/link-token');
      return response.data.data.linkToken;
    },
    onSuccess: (token) => {
      if (token) {
        setLinkToken(token);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create link token",
        variant: "destructive"
      });
    }
  });

  // Exchange Plaid public token
  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await api.post('/financial/plaid/exchange-token', {
        publicToken
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
      toast({
        title: "Success",
        description: "Bank accounts connected successfully!"
      });
      // Auto-sync transactions after connecting
      setTimeout(() => {
        syncTransactionsMutation.mutate();
      }, 1000);
    }
  });

  // Sync transactions mutation
  const syncTransactionsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/budgeting/transactions/sync', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Sync Complete!",
        description: `Synced ${data.data.created} new transactions`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.response?.data?.error || "Failed to sync transactions",
        variant: "destructive"
      });
    }
  });

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => {
      exchangeTokenMutation.mutate(publicToken);
      setLinkToken(null);
    },
    onExit: (err) => {
      setLinkToken(null);
      if (err) {
        toast({
          title: "Error",
          description: "Failed to connect bank account",
          variant: "destructive"
        });
      }
    }
  });

  // Auto-open Plaid Link when ready
  if (ready && linkToken && linkToken !== 'undefined') {
    open();
  }

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Financial
          </h1>
          <p className="text-muted-foreground mt-1">
            Budget-aware planning with intelligent financial insights
          </p>
        </div>
        <div className="flex gap-2">
          {hasAccounts && (
            <Button
              variant="outline"
              onClick={() => syncTransactionsMutation.mutate()}
              disabled={syncTransactionsMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncTransactionsMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Transactions
            </Button>
          )}
          <Button
            onClick={() => createLinkTokenMutation.mutate()}
            disabled={createLinkTokenMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {!hasAccounts ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <DollarSign className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Connect Your Bank Accounts</h3>
                <p className="text-muted-foreground mt-1">
                  Link your bank accounts via Plaid to start automatic budget tracking
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => createLinkTokenMutation.mutate()}
                disabled={createLinkTokenMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createLinkTokenMutation.isPending ? 'Connecting...' : 'Connect Bank Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <List className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="w-4 h-4 mr-2" />
              Savings Goals
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <BudgetOverview onCreateBudget={() => setActiveTab('settings')} />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>

          {/* Savings Goals Tab */}
          <TabsContent value="goals">
            <SavingsGoals />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Spending Analytics</CardTitle>
                <CardDescription>
                  Insights and trends from your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Analytics Coming Soon</h3>
                    <p className="text-muted-foreground mt-1">
                      Advanced spending analytics and forecasting will be available here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Connected Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>
                    Manage your linked bank accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accountsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    </div>
                  ) : accounts && accounts.length > 0 ? (
                    <div className="space-y-3">
                      {accounts.map((account: any) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{account.accountName}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {account.accountType}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {account.balance !== null ? formatCurrency(account.balance) : 'N/A'}
                            </div>
                            {account.isActive ? (
                              <Badge variant="default" className="mt-1">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="mt-1">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No accounts connected yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Budget Settings Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Settings</CardTitle>
                  <CardDescription>
                    Configure your budget preferences and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Budget configuration wizard coming soon</p>
                    <p className="text-xs mt-2">Create budgets, set categories, and configure alerts</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

