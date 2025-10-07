# Auto-Plan & Place (APL) Landing Zones

## Overview
This document identifies the key integration points for implementing Auto-Plan & Place (APL) tentative holds functionality in SyncScript.

## Target Files & Integration Points

### 1. UI Anchor Points

#### **EventModal Action Row** (`client/src/components/EventModal.tsx`)
**Location**: Lines 900-925 (action buttons section)
**Current Structure**:
```tsx
<div className="flex items-center space-x-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowConflictResolver(true)}
    className="h-8 w-8 p-0"
    title="Resolve Schedule Conflicts"
  >
    <AlertTriangle className="w-4 h-4" />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowExportModal(true)}
    className="h-8 w-8 p-0"
    title="Export Event"
  >
    <Download className="w-4 h-4" />
  </Button>
</div>
```

**APL Integration Point**:
- Add CalendarPlus chip between AlertTriangle and Download buttons
- Conditional rendering based on `flags.make_it_real` and `/apl/ready` endpoint
- Small, unobtrusive design matching existing action buttons

### 2. Backend Service Extension Points

#### **SchedulingService** (`server/src/services/schedulingService.ts`)
**Current Methods**:
- `analyzeEventScheduling(eventId: string)` - Main scheduling analysis
- `detectConflicts(event, tasks)` - Conflict detection
- `adjustToStoreHours(date, storeHours)` - Time adjustments

**APL Extension Points**:
- Add `suggestTentativeHolds(eventId: string)` method
- Add `confirmTentativeHold(holdId: string)` method
- Add `dismissTentativeHold(holdId: string)` method
- Extend conflict detection to include tentative hold conflicts

#### **TaskSchedulingService** (`server/src/services/taskSchedulingService.ts`)
**Current Methods**:
- `schedulePrepTasks(options)` - Main task scheduling
- `findOptimalTimeSlots()` - Time slot optimization

**APL Extension Points**:
- Add `generateTentativeHolds(eventId: string, maxHolds: number = 3)` method
- Add `validateHoldConflicts(holds: TentativeHold[])` method
- Extend time slot optimization for tentative holds

### 3. Event System Integration

#### **Event Types** (`server/src/services/eventService.ts`)
**Current Events**:
- `TaskCompletedEvent`
- `ScriptAppliedEvent` ✅ **Key Integration Point**
- `CalendarWriteRequestedEvent` ✅ **Key Integration Point**
- `EnergySnapshotCreatedEvent`

**APL New Events**:
```typescript
export interface TentativeHoldSuggestedEvent {
  eventId: string;
  userId: string;
  holdIds: string[];
  suggestedAt: Date;
  maxHolds: number;
}

export interface TentativeHoldConfirmedEvent {
  holdId: string;
  userId: string;
  eventId: string;
  confirmedAt: Date;
  providerEventId?: string;
}

export interface TentativeHoldDismissedEvent {
  holdId: string;
  userId: string;
  eventId: string;
  dismissedAt: Date;
  reason?: string;
}
```

#### **Event Handlers** (`server/src/workers/eventDispatcher.ts`)
**Current Handlers**:
- Task completion handlers
- Script application handlers
- Calendar write handlers

**APL New Handlers**:
- `handleScriptApplied` → trigger `suggestTentativeHolds`
- `handleEventCreated` → trigger `suggestTentativeHolds`
- `handleTentativeHoldConfirmed` → create provider events
- `handleTentativeHoldDismissed` → cleanup

### 4. Database Schema Extensions

#### **New Table: TentativeHold**
```sql
CREATE TABLE TentativeHold (
  id STRING PRIMARY KEY,
  userId STRING NOT NULL,
  eventId STRING NOT NULL,
  taskId STRING, -- Optional: if hold is for specific task
  start DATETIME NOT NULL,
  end DATETIME NOT NULL,
  provider STRING NOT NULL, -- 'google', 'outlook', 'apple'
  status STRING NOT NULL, -- 'suggested', 'confirmed', 'dismissed'
  key STRING UNIQUE NOT NULL, -- Idempotency key: eventId:version:step
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (eventId) REFERENCES Event(id),
  FOREIGN KEY (taskId) REFERENCES Task(id)
);
```

#### **Idempotency Key Format**
- Pattern: `{eventId}:{version}:{step}`
- Examples:
  - `event_123:v1:suggest` - Initial suggestion
  - `event_123:v1:confirm_hold_456` - Confirming specific hold
  - `event_123:v2:suggest` - Re-suggestion after changes

### 5. REST API Endpoints

#### **New Routes** (`server/src/routes/apl.ts`)
```typescript
// Check if APL is ready for an event
GET /apl/ready?eventId={eventId}

// Suggest tentative holds for an event
POST /apl/suggest?eventId={eventId}
// Response: { holds: TentativeHold[], maxHolds: number }

// Confirm a tentative hold
POST /apl/confirm/:holdId
// Response: { status: 'enqueued', providerEventId?: string }

// Dismiss a tentative hold
POST /apl/dismiss/:holdId
// Response: { status: 'dismissed' }

// Get holds for an event
GET /apl/holds/:eventId
// Response: { holds: TentativeHold[] }
```

### 6. Nearby Tests to Clone

#### **Scheduling Tests** (`server/src/tests/scheduling.test.ts`)
**Existing Patterns**:
- Event scheduling analysis tests
- Conflict detection tests
- Time slot optimization tests

**APL Test Patterns**:
- Clone scheduling analysis tests for tentative holds
- Clone conflict detection tests for hold conflicts
- Clone time slot tests for hold generation

#### **Idempotency Tests** (`server/src/tests/idempotency.test.ts`)
**Existing Patterns**:
- Script application idempotency
- Calendar write idempotency
- Task creation idempotency

**APL Test Patterns**:
- Clone script application tests for hold suggestion
- Clone calendar write tests for hold confirmation
- Clone task creation tests for hold generation

#### **Event Handler Tests** (`server/src/tests/eventHandlers.test.ts`)
**Existing Patterns**:
- ScriptApplied event handling
- CalendarWriteRequested event handling
- TaskCompleted event handling

**APL Test Patterns**:
- Clone ScriptApplied tests for hold suggestion triggers
- Clone CalendarWriteRequested tests for hold confirmation
- Clone TaskCompleted tests for hold status updates

### 7. Feature Flag Integration

#### **Feature Flags** (`server/src/routes/featureFlags.ts`)
**Current Flags**:
- `new_ui` - New UI shell
- `cmd_palette` - Command palette
- `templates` - Template system

**APL New Flag**:
- `make_it_real` - Enable APL functionality
- Default: `false` (disabled)
- Admin-only in staging
- Gradual rollout: 5% → 20% → 100%

### 8. Metrics & Observability

#### **Metrics Service** (`server/src/services/metricsService.ts`)
**Current Metrics**:
- `http_request_duration_ms`
- `feature_used_total`
- `calendar_dup_write_count`

**APL New Metrics**:
```typescript
// APL performance metrics
apl_suggest_duration_ms: Histogram
apl_confirm_success_total: Counter
apl_confirm_error_total: Counter
apl_holds_generated_total: Counter
apl_holds_confirmed_total: Counter
apl_holds_dismissed_total: Counter
```

#### **SLOs**:
- p95 suggest < 400ms
- confirm success ≥ 99%
- hold generation success ≥ 95%

### 9. Outbox Integration

#### **Outbox Pattern** (`server/src/services/eventService.ts`)
**Current Usage**:
- All domain events go through outbox
- Idempotency keys for all writes
- Retry logic with exponential backoff

**APL Integration**:
- All hold operations use outbox
- Idempotency keys: `eventId:version:step`
- Retry logic for provider calendar writes
- Dead letter queue for failed holds

### 10. Security & Privacy

#### **Access Control**:
- User can only manage their own holds
- Event ownership validation
- Provider calendar permission checks

#### **Data Privacy**:
- Hold data encrypted at rest
- PII scrubbing in logs
- GDPR compliance for hold data

## Implementation Order

1. **Step 0**: Landing zone analysis ✅
2. **Step 1**: Contract-first stubs (events, DB, REST)
3. **Step 2**: Shadow wiring (event subscriptions, no-op handlers)
4. **Step 3**: Ghost UI (CalendarPlus chip, conditional rendering)
5. **Step 4**: Golden tests (E2E scenarios)
6. **Step 5**: Metrics & SLOs (observability)
7. **Rollout**: Feature flag gradual enablement

## Risk Mitigation

### **Zero Behavior Changes**:
- All new functionality behind `make_it_real` flag
- No changes to existing scheduling logic
- Additive database schema only

### **Idempotency Safety**:
- All writes use idempotency keys
- Outbox pattern for all operations
- Retry logic with exponential backoff

### **Rollback Strategy**:
- Feature flag instant disable
- No code changes required
- Database schema is additive (safe to leave)

### **Testing Strategy**:
- Unit tests for all new components
- E2E tests for critical flows
- Integration tests for event handling
- Performance tests for SLO validation
