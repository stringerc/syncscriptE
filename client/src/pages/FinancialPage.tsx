import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Plus } from 'lucide-react'

export function FinancialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial</h1>
          <p className="text-muted-foreground mt-1">
            Budget-aware planning with financial intelligence
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Financial Integration</span>
          </CardTitle>
          <CardDescription>
            Connect your bank accounts and get budget-aware recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Financial Integration Coming Soon
            </h3>
            <p className="text-muted-foreground mb-6">
              This feature is under development. You'll be able to connect your 
              bank accounts via Plaid and get AI-powered budget recommendations.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Connect Bank Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
