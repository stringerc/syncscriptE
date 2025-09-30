import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart3, TrendingUp, Users, Activity } from 'lucide-react'
import { useState } from 'react'

interface EventCounts {
  [key: string]: number
}

interface FunnelData {
  shown: number
  converted: number
  rate: number
}

export function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')

  const startDate = new Date()
  if (timeRange === 'week') startDate.setDate(startDate.getDate() - 7)
  else if (timeRange === 'month') startDate.setMonth(startDate.getMonth() - 1)
  else startDate.setFullYear(startDate.getFullYear() - 1)

  // Fetch event counts
  const { data: countsData, isLoading: countsLoading } = useQuery({
    queryKey: ['analytics-counts', timeRange],
    queryFn: async () => {
      const response = await api.get('/analytics/counts', {
        params: { startDate: startDate.toISOString() }
      })
      return response.data.data as EventCounts
    }
  })

  // Fetch key funnels
  const { data: suggestionFunnel } = useQuery({
    queryKey: ['analytics-funnel-suggestion', timeRange],
    queryFn: async () => {
      const response = await api.get('/analytics/funnel', {
        params: {
          fromEvent: 'suggestion_shown',
          toEvent: 'suggestion_accepted',
          startDate: startDate.toISOString()
        }
      })
      return response.data.data as FunnelData
    }
  })

  const { data: challengeFunnel } = useQuery({
    queryKey: ['analytics-funnel-challenge', timeRange],
    queryFn: async () => {
      const response = await api.get('/analytics/funnel', {
        params: {
          fromEvent: 'challenge_start',
          toEvent: 'challenge_complete',
          startDate: startDate.toISOString()
        }
      })
      return response.data.data as FunnelData
    }
  })

  const { data: templateFunnel } = useQuery({
    queryKey: ['analytics-funnel-template', timeRange],
    queryFn: async () => {
      const response = await api.get('/analytics/funnel', {
        params: {
          fromEvent: 'template_save',
          toEvent: 'template_apply',
          startDate: startDate.toISOString()
        }
      })
      return response.data.data as FunnelData
    }
  })

  if (countsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const topEvents = countsData ? Object.entries(countsData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) : []

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            User behavior insights and conversion metrics
          </p>
        </div>
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData ? Object.values(countsData).reduce((a, b) => a + b, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Events tracked in {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Actions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(countsData?.task_create || 0) + (countsData?.task_complete || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Creates + Completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData?.suggestion_shown || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {suggestionFunnel ? `${suggestionFunnel.rate.toFixed(1)}% accepted` : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData?.feedback_submitted || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              User submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggestion Funnel</CardTitle>
            <CardDescription>Shown → Accepted</CardDescription>
          </CardHeader>
          <CardContent>
            {suggestionFunnel ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Shown</span>
                  <span className="font-bold">{suggestionFunnel.shown}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${suggestionFunnel.rate}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Accepted</span>
                  <span className="font-bold">{suggestionFunnel.converted}</span>
                </div>
                <div className="text-center text-2xl font-bold text-blue-600 mt-4">
                  {suggestionFunnel.rate.toFixed(1)}%
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Challenge Funnel</CardTitle>
            <CardDescription>Started → Completed</CardDescription>
          </CardHeader>
          <CardContent>
            {challengeFunnel ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Started</span>
                  <span className="font-bold">{challengeFunnel.shown}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${challengeFunnel.rate}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Completed</span>
                  <span className="font-bold">{challengeFunnel.converted}</span>
                </div>
                <div className="text-center text-2xl font-bold text-green-600 mt-4">
                  {challengeFunnel.rate.toFixed(1)}%
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template Funnel</CardTitle>
            <CardDescription>Saved → Applied</CardDescription>
          </CardHeader>
          <CardContent>
            {templateFunnel ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Saved</span>
                  <span className="font-bold">{templateFunnel.shown}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${templateFunnel.rate}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Applied</span>
                  <span className="font-bold">{templateFunnel.converted}</span>
                </div>
                <div className="text-center text-2xl font-bold text-purple-600 mt-4">
                  {templateFunnel.rate.toFixed(1)}%
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
          <CardDescription>Most frequent user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topEvents.map(([event, count], index) => (
              <div key={event} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <span className="text-sm font-medium">{event.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
