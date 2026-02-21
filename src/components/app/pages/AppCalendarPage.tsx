import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/railway-api'
import type { Event } from '@/types/syncscript'
import { Plus, Trash2, ChevronUp } from 'lucide-react'

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function AppCalendarPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [budgetImpact, setBudgetImpact] = useState('')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get('/calendar')
      const payload = res.data?.data ?? res.data
      return Array.isArray(payload) ? payload : (payload?.events ?? []) as Event[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/calendar', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowCreateForm(false)
      setTitle('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setLocation('')
      setBudgetImpact('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/calendar/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const handleCreate = () => {
    if (!title.trim() || !startTime || !endTime) return
    createMutation.mutate({
      title,
      description: description || undefined,
      startTime,
      endTime,
      location: location || undefined,
      budgetImpact: budgetImpact ? parseFloat(budgetImpact) : undefined,
      isAllDay: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">Manage your events and schedule</p>
        </div>
        <Button onClick={() => setShowCreateForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>New Event</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Event description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Budget impact ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={budgetImpact}
                onChange={(e) => setBudgetImpact(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending || !title.trim() || !startTime || !endTime}>
                Create Event
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Your calendar events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground py-8">No events yet. Create one above!</p>
          ) : (
            <ul className="space-y-3">
              {events
                .slice()
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-4 p-4 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{event.title}</h3>
                        {event.aiGenerated && (
                          <Badge variant="secondary" className="text-xs">AI</Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(event.startTime)} {formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                        {event.location && <span>📍 {event.location}</span>}
                        {event.budgetImpact != null && event.budgetImpact > 0 && (
                          <span>{formatCurrency(event.budgetImpact)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(event.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
