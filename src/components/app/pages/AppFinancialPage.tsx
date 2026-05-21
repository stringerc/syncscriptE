import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, FileText, TrendingUp, Zap } from 'lucide-react'
import { Link } from 'react-router'

const HIGHLIGHTS = [
  { icon: FileText, label: 'Invoicing', desc: 'Create, send, and track invoices with Stripe payments.' },
  { icon: TrendingUp, label: 'Revenue Intelligence', desc: 'AI-powered growth projections and revenue analytics.' },
  { icon: Zap, label: 'Budget Awareness', desc: 'Task and calendar scheduling informed by financial context.' },
]

export function AppFinancialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial</h1>
        <p className="text-muted-foreground mt-1">Budget-aware planning with financial intelligence</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Financials</span>
          </CardTitle>
          <CardDescription>
            Full financial tools are available on the dashboard.{' '}
            <Link to="/financials" className="underline text-primary">Open Financials →</Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
