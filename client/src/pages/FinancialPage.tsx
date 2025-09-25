import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Plus, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { usePlaidLink } from 'react-plaid-link'

interface FinancialAccount {
  id: string
  accountName: string
  accountType: string
  balance: number
  isActive: boolean
  createdAt: string
}

interface BudgetStatus {
  totalBalance: number
  monthlyBudget: number
  spentThisMonth: number
  remainingBudget: number
  upcomingExpenses: number
  alerts: Array<{
    type: string
    message: string
    amount: number
    severity: 'low' | 'medium' | 'high'
  }>
}

export function FinancialPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [linkToken, setLinkToken] = useState<string | null>(null)

  // Fetch financial accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery<FinancialAccount[]>({
    queryKey: ['financial-accounts'],
    queryFn: async () => {
      const response = await api.get('/financial/accounts')
      return response.data.data
    }
  })

  // Fetch budget status
  const { data: budgetStatus, isLoading: budgetLoading } = useQuery<BudgetStatus>({
    queryKey: ['budget-status'],
    queryFn: async () => {
      const response = await api.get('/financial/budget-status')
      return response.data.data
    }
  })

  // Create link token mutation
  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/financial/plaid/link-token')
      console.log('Full API response:', response.data)
      console.log('Data object:', response.data.data)
      console.log('LinkToken property:', response.data.data.linkToken)
      return response.data.data.linkToken
    },
    onSuccess: (token) => {
      console.log('Link token created:', token)
      if (token) {
        setLinkToken(token)
      } else {
        toast({
          title: "Error",
          description: "Failed to get link token from server",
          variant: "destructive"
        })
      }
    },
    onError: (error: any) => {
      console.error('Link token creation error:', error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create link token. Please check your Plaid configuration.",
        variant: "destructive"
      })
    }
  })

  // Exchange token mutation
  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await api.post('/financial/plaid/exchange-token', {
        publicToken
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['budget-status'] })
      toast({
        title: "Success",
        description: "Bank accounts connected successfully!"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to connect accounts",
        variant: "destructive"
      })
    }
  })

  // Update balances mutation
  const updateBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/financial/plaid/update-balances')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['budget-status'] })
      toast({
        title: "Success",
        description: "Account balances updated successfully!"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update balances",
        variant: "destructive"
      })
    }
  })

  // Plaid Link configuration
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => {
      console.log('Plaid Link success:', publicToken)
      exchangeTokenMutation.mutate(publicToken)
      setLinkToken(null) // Close the modal
    },
    onExit: (err, metadata) => {
      console.log('Plaid Link exit:', err, metadata)
      setLinkToken(null) // Close the modal
      if (err) {
        toast({
          title: "Error",
          description: "Failed to connect bank account",
          variant: "destructive"
        })
      }
    }
  })

  // Debug Plaid Link state (only log when values change)
  useEffect(() => {
    if (linkToken || ready) {
      console.log('Plaid Link state:', { linkToken: linkToken ? 'present' : 'null', ready })
    }
  }, [linkToken, ready])

  const handleConnectAccount = () => {
    createLinkTokenMutation.mutate()
  }

  // Auto-open Plaid Link when token is ready
  useEffect(() => {
    if (ready && linkToken && linkToken !== 'undefined') {
      console.log('Plaid Link ready, opening...', { ready, linkToken: linkToken.substring(0, 20) })
      open()
    }
  }, [ready, linkToken, open])

  const handleUpdateBalances = () => {
    updateBalancesMutation.mutate()
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial</h1>
          <p className="text-muted-foreground mt-1">
            Budget-aware planning with financial intelligence
          </p>
        </div>
        <div className="flex space-x-2">
          {accounts && accounts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleUpdateBalances}
              disabled={updateBalancesMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${updateBalancesMutation.isPending ? 'animate-spin' : ''}`} />
              Update Balances
            </Button>
          )}
          <Button 
            onClick={handleConnectAccount} 
            disabled={createLinkTokenMutation.isPending || exchangeTokenMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {createLinkTokenMutation.isPending ? 'Creating Link...' : 'Connect Account'}
          </Button>
        </div>
      </div>

      {/* Budget Status */}
      {budgetStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Budget Status</span>
            </CardTitle>
            <CardDescription>
              Your current financial overview and budget alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(budgetStatus.totalBalance)}
                </div>
                <div className="text-sm text-muted-foreground">Total Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(budgetStatus.monthlyBudget)}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Budget</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(budgetStatus.spentThisMonth)}
                </div>
                <div className="text-sm text-muted-foreground">Spent This Month</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${budgetStatus.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(budgetStatus.remainingBudget)}
                </div>
                <div className="text-sm text-muted-foreground">Remaining Budget</div>
              </div>
            </div>

            {/* Budget Alerts */}
            {budgetStatus.alerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Budget Alerts</h4>
                {budgetStatus.alerts.map((alert, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                    <Badge variant={getAlertColor(alert.severity)}>
                      {formatCurrency(alert.amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Connected Accounts</span>
          </CardTitle>
          <CardDescription>
            Your connected bank accounts and their current balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading accounts...</p>
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <h4 className="font-medium">{account.accountName}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {account.accountType} Account
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(account.balance)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Connected {new Date(account.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Connected Accounts
              </h3>
              <p className="text-muted-foreground mb-6">
                Connect your bank accounts to get started with budget-aware planning
                and financial intelligence.
              </p>
              <Button 
                onClick={handleConnectAccount} 
                disabled={createLinkTokenMutation.isPending || exchangeTokenMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createLinkTokenMutation.isPending ? 'Creating Link...' : 'Connect Bank Account'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug info */}
      {linkToken && (
        <div className="fixed bottom-4 right-4 bg-blue-100 text-blue-800 p-2 rounded text-xs">
          Link token: {linkToken.substring(0, 20)}...
          <br />
          Ready: {ready ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  )
}
