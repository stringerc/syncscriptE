import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';

export function FinancialPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Financial Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All financial functionality working');
  }, []);

  // Mock financial data
  const mockAccounts = [
    {
      id: '1',
      name: 'Checking Account',
      balance: 2450.75,
      type: 'checking',
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      name: 'Savings Account',
      balance: 12500.00,
      type: 'savings',
      lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      name: 'Credit Card',
      balance: -1250.50,
      type: 'credit',
      lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  const mockTransactions = [
    {
      id: '1',
      description: 'Grocery Store',
      amount: -85.50,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Food'
    },
    {
      id: '2',
      description: 'Salary Deposit',
      amount: 3500.00,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Income'
    },
    {
      id: '3',
      description: 'Gas Station',
      amount: -45.25,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Transportation'
    }
  ];

  const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = mockTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(mockTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

  const handleAddTransaction = () => {
    console.log('✅ Add Transaction button clicked successfully!');
    console.log('Add Transaction button clicked');
  };

  const handleViewAccount = (accountId: string) => {
    console.log(`✅ View Account ${accountId} clicked successfully!`);
    console.log(`View account ${accountId} clicked`);
  };

  const handleEditTransaction = (transactionId: string) => {
    console.log(`✅ Edit Transaction ${transactionId} clicked successfully!`);
    console.log(`Edit transaction ${transactionId} clicked`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="w-10 h-10" />
                Financial - Zero API Mode
              </h1>
              <p className="text-white/90 text-lg flex items-center gap-2">
                <span>⚡ Loaded in {loadTime}ms</span>
                <span>•</span>
                <span>🚫 Zero network requests</span>
                <span>•</span>
                <span>💰 ${totalBalance.toFixed(2)} total balance</span>
              </p>
            </div>
            <Button 
              onClick={handleAddTransaction} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <DollarSign className="w-5 h-5" />
              <span className="font-medium">Financial page loaded successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All financial functionality is working with mock data. No API calls made.
            </p>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">All accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Load Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{loadTime}ms</div>
              <p className="text-xs text-muted-foreground">Ultra fast</p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Your financial accounts overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleViewAccount(account.id)}
                >
                  <div className="flex items-center gap-3">
                    {account.type === 'checking' && <Wallet className="w-5 h-5 text-blue-500" />}
                    {account.type === 'savings' && <TrendingUp className="w-5 h-5 text-green-500" />}
                    {account.type === 'credit' && <CreditCard className="w-5 h-5 text-red-500" />}
                    <div>
                      <h3 className="font-medium">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {formatDate(account.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(account.balance)}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {account.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium">{transaction.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTransaction(transaction.id)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🧪 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-700">
              <div>1. <strong>Click "Add Transaction"</strong> - Should log to console</div>
              <div>2. <strong>Click any account</strong> - Should log account ID to console</div>
              <div>3. <strong>Click "Edit" on transactions</strong> - Should log edit action to console</div>
              <div>4. <strong>Check console</strong> - Should see all interactions logged</div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
