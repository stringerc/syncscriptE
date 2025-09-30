# ✅ LT-1: Wire What's Built — IMPLEMENTATION GUIDE

**Launch Train:** 1  
**Goal:** Connect "90% ready" components  
**Time:** 24-48 hours (or follow quick path: 4-6 hours)  
**Status:** 🔧 **READY TO IMPLEMENT**  

---

## 🎯 OVERVIEW

All components are built and ready. This LT wires them into the existing UI so users can access them.

---

## 📋 IMPLEMENTATION CHECKLIST

### **1. Speech-to-Text Integration** ⏱️ 1 hour

**Component:** `SpeechToTextInput.tsx` ✅ Built  
**Hook:** `useSpeechToText.ts` ✅ Built  

**What to Do:**

#### **1.1: TaskModal Notes Field (15 min)**
**File:** `client/src/components/TaskModal.tsx`

**Find:**
```typescript
<Textarea
  value={formData.notes}
  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
  placeholder="Add notes..."
/>
```

**Replace with:**
```typescript
import { SpeechToTextInput } from '@/components/SpeechToTextInput'

<SpeechToTextInput
  value={formData.notes || ''}
  onChange={(value) => setFormData({ ...formData, notes: value })}
  placeholder="Type or hold mic to speak..."
  label="Notes"
  multiline
  rows={4}
/>
```

#### **1.2: EventModal Description Field (15 min)**
**File:** `client/src/components/EventModal.tsx`

**Find description Textarea, replace similarly**

#### **1.3: Challenge Message Field (15 min)**
**File:** Look for challenge message inputs (if implemented)

**Test:**
- Click mic button
- Hold and speak
- Release to stop
- Edit transcript
- Click Apply

---

### **2. Conflict Dialog** ⏱️ 1.5 hours

**Component:** `ConflictDialog.tsx` (needs creation)  

#### **2.1: Create Conflict Dialog Component (30 min)**
**File:** `client/src/components/ConflictDialog.tsx` (create new)

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Conflict {
  id: string
  description: string
  affectedItems: any[]
  suggestedActions: Array<{
    action: string
    description: string
    impact: string
  }>
}

interface ConflictDialogProps {
  isOpen: boolean
  onClose: () => void
  conflicts: Conflict[]
}

export function ConflictDialog({ isOpen, onClose, conflicts }: ConflictDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const resolveMutation = useMutation({
    mutationFn: async ({ conflictId, action }: any) => {
      const response = await api.post(`/scheduling/conflicts/${conflictId}/resolve`, { action })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Conflict Resolved',
        description: 'Schedule has been updated'
      })
      onClose()
    }
  })

  if (conflicts.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Scheduling Conflicts Detected
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="border rounded-lg p-4 space-y-3">
              <p className="font-medium">{conflict.description}</p>
              
              <div className="space-y-2">
                {conflict.suggestedActions?.map((action: any) => (
                  <Button
                    key={action.action}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => resolveMutation.mutate({ 
                      conflictId: conflict.id, 
                      action: action.action 
                    })}
                  >
                    <div>
                      <div className="font-medium">{action.description}</div>
                      <div className="text-xs text-muted-foreground">{action.impact}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Ignore for Now
          </Button>
          <Button 
            variant="default"
            onClick={() => {
              // Fix all conflicts with default actions
              conflicts.forEach(c => {
                const firstAction = c.suggestedActions[0]
                if (firstAction) {
                  resolveMutation.mutate({ conflictId: c.id, action: firstAction.action })
                }
              })
            }}
          >
            Fix All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### **2.2: Hook to Scheduling Engine (30 min)**
**File:** `client/src/pages/CalendarPage.tsx` or `DashboardPage.tsx`

```typescript
import { ConflictDialog } from '@/components/ConflictDialog'

const { data: conflictsData } = useQuery({
  queryKey: ['calendar-conflicts'],
  queryFn: async () => {
    const response = await api.get('/scheduling/conflicts')
    return response.data
  },
  refetchInterval: 60000 // Check every minute
})

const [showConflicts, setShowConflicts] = useState(false)

// Show dialog when conflicts detected
useEffect(() => {
  if (conflictsData?.data?.conflicts?.length > 0) {
    setShowConflicts(true)
  }
}, [conflictsData])

// In JSX:
<ConflictDialog
  isOpen={showConflicts}
  onClose={() => setShowConflicts(false)}
  conflicts={conflictsData?.data?.conflicts || []}
/>
```

---

### **3. Daily Challenges UI** ⏱️ 2 hours

**Location:** Energy Engine tab  

#### **3.1: Enhanced Challenge Card (60 min)**
**File:** `client/src/components/DailyChallengeCard.tsx` (create new)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Square, AlertCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

export function DailyChallengeCard({ challenge }: any) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Start challenge
  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/energy
