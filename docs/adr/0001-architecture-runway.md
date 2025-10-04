# ADR-0001: Architecture Runway

## Status
Accepted

## Context

SyncScript has grown from a simple task management app to a comprehensive life management platform with multiple domains: task/event management, budgeting, gamification, calendar sync, AI assistance, collaboration, and export capabilities. The current architecture has evolved organically, leading to:

1. **Cross-module coupling**: Direct imports between domains
2. **Inconsistent data access**: Some modules bypass APIs to access other domains' data
3. **Event handling gaps**: No centralized event system for cross-domain communication
4. **Energy system confusion**: Mixed daily reset vs cumulative energy models
5. **Feature flag inconsistencies**: Different flag systems across frontend and backend
6. **Navigation sprawl**: Provider-specific pages scattered across the app

## Decision

We will implement a **bounded context architecture** with the following principles:

### 1. Module Boundaries
- **Hard boundaries**: No direct imports between domains
- **API-only communication**: All cross-context interactions through REST/GraphQL APIs
- **Event-driven architecture**: Typed event bus for loose coupling
- **Shared kernel**: Common utilities, types, and cross-cutting concerns

### 2. Event Bus Architecture
- **Centralized event registry**: All events defined in `packages/shared-kernel/src/events.ts`
- **Outbox pattern**: Reliable event delivery with retry logic
- **Idempotency keys**: Prevent duplicate event processing
- **Event versioning**: Backward compatibility for event schema changes

### 3. Energy System Specification
- **Daily meter model**: Energy resets to 0 at local midnight
- **EP to Energy conversion**: Energy Points (EP) convert to Energy (0-100 scale)
- **Display mapping**: Energy 0-100 maps to UI display 0-10
- **Persistent achievements**: Levels and achievements persist across days
- **Snapshot system**: Daily energy snapshots for historical tracking

### 4. Time Policy
- **UTC storage**: All timestamps stored in UTC in database
- **Local rendering**: Frontend converts to user's timezone for display
- **Timezone handling**: User timezone stored in profile, used for daily resets
- **Event scheduling**: Calendar events respect user's timezone

### 5. Idempotency Strategy
- **Operation keys**: All external API calls use idempotency keys
- **Key format**: `{userId}_{operation}_{timestamp}_{hash}`
- **Expiration**: Keys expire after 24 hours
- **Storage**: Idempotency table tracks processed operations

### 6. Navigation Policy
- **Core navigation**: Dashboard, Tasks, Calendar
- **Plan navigation**: Projects, Playbooks (Templates/Scripts)
- **People navigation**: People/Friends
- **Me navigation**: Progress, Notifications, Profile, Settings
- **Provider pages**: Move to Settings → Integrations (document only, no code changes)

## Bounded Contexts

### 1. Identity & Access
- **Owns**: User authentication, profile, feature flags
- **Database**: `users`, `user_settings`, `user_feature_flags`, `audit_logs`
- **API**: `/api/auth/*`, `/api/user/*`, `/api/feature-flags/*`

### 2. Planning Core
- **Owns**: Tasks, events, conversations
- **Database**: `tasks`, `subtasks`, `events`, `conversations`
- **API**: `/api/tasks/*`, `/api/events/*`

### 3. Scripts
- **Owns**: Templates, script applications, user scripts
- **Database**: `scripts`, `script_applications`, `template_catalog`, `user_scripts`
- **API**: `/api/scripts/*`, `/api/templates/*`

### 4. Scheduling/Sync
- **Owns**: Calendar integrations, external calendar links
- **Database**: `calendar_integrations`, `external_calendar_accounts`, `external_calendar_links`
- **API**: `/api/calendar/*`, `/api/google-calendar/*`, `/api/outlook-calendar/*`, `/api/apple-calendar/*`

### 5. Budgeting
- **Owns**: Budgets, transactions, financial accounts
- **Database**: `budgets`, `budget_categories`, `transactions`, `financial_accounts`
- **API**: `/api/budget/*`, `/api/financial/*`

### 6. Gamification
- **Owns**: Energy system, achievements, challenges
- **Database**: `energy_points`, `achievements`, `daily_challenges`, `user_energy_profiles`
- **API**: `/api/gamification/*`, `/api/energy/*`

### 7. Collaboration
- **Owns**: Friends, projects, resource sharing
- **Database**: `friendships`, `projects`, `project_members`, `project_resources`
- **API**: `/api/friends/*`, `/api/projects/*`

### 8. Exports
- **Owns**: Export jobs, templates, analytics
- **Database**: `export_jobs`, `export_templates`, `export_analytics`
- **API**: `/api/export/*`

### 9. Search/AI
- **Owns**: AI assistant, search, voice input
- **Database**: `analytics_events` (for search analytics)
- **API**: `/api/ai/*`, `/api/search/*`

### 10. Shared Kernel
- **Owns**: Notifications, resources, common utilities
- **Database**: `notifications`, `resources`, `resource_sets`
- **API**: `/api/notifications/*`, `/api/resources/*`

## Energy Daily Reset Specification

### Daily Reset Process
1. **Trigger**: Cron job runs at user's local midnight
2. **Snapshot**: Create daily energy snapshot with final EP and energy values
3. **Reset**: Set current energy to 0, reset EP counter
4. **Conversion**: Convert yesterday's EP to energy using diminishing returns formula
5. **Persistence**: Store conversion in `energy_conversions` table
6. **Achievements**: Check for daily achievement unlocks

### Energy Conversion Formula
```typescript
const DIMINISHING_RETURNS_THRESHOLD = 50; // EP
const BASE_CONVERSION_RATE = 1.0; // 1 EP = 1 Energy

function convertEPToEnergy(totalEP: number): number {
  if (totalEP <= DIMINISHING_RETURNS_THRESHOLD) {
    return totalEP * BASE_CONVERSION_RATE;
  } else {
    const baseEnergy = DIMINISHING_RETURNS_THRESHOLD * BASE_CONVERSION_RATE;
    const excess = totalEP - DIMINISHING_RETURNS_THRESHOLD;
    const diminishedEnergy = excess * (BASE_CONVERSION_RATE * 0.5);
    return Math.min(baseEnergy + diminishedEnergy, 100);
  }
}
```

### Data Model
```sql
-- Daily energy snapshots
CREATE TABLE energy_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  final_ep INTEGER NOT NULL,
  final_energy INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- EP to energy conversions
CREATE TABLE energy_conversions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ep_earned INTEGER NOT NULL,
  energy_gained INTEGER NOT NULL,
  conversion_rate REAL NOT NULL,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Plan

### Phase A: Documentation & Analysis (Current)
- [x] Create feature catalog and roadmap
- [x] Document bounded contexts and contracts
- [x] Define architecture runway and energy specification
- [x] Create navigation registry
- [x] Write golden flow tests (skipped initially)

### Phase B: Event System & Energy Reset
1. **Event Registry**: Create `packages/shared-kernel/src/events.ts`
2. **Outbox Pattern**: Implement reliable event delivery
3. **Energy Reset Job**: Daily cron job with proper timezone handling
4. **Energy Tests**: End-to-end tests for daily reset flow

### Phase C: Navigation & Provider Pages
1. **Navigation Registry**: Implement typed sidebar registry
2. **Provider Page Migration**: Move Google/Outlook/Apple pages to Settings → Integrations
3. **Route Updates**: Update all navigation links and breadcrumbs

### Phase D: Strangler Adapters
1. **Cross-Import Analysis**: Identify worst coupling violations
2. **Anti-Corruption Layers**: Create adapters for legacy code
3. **Gradual Migration**: Move functionality behind bounded context APIs

## Consequences

### Positive
- **Clear boundaries**: Each domain has well-defined responsibilities
- **Scalability**: Teams can work independently on different contexts
- **Testability**: Each context can be tested in isolation
- **Maintainability**: Changes in one context don't affect others
- **Energy clarity**: Daily reset model is intuitive and consistent

### Negative
- **Initial complexity**: More moving parts and indirection
- **Migration effort**: Significant refactoring required
- **Learning curve**: Team needs to understand bounded context patterns
- **Performance**: Additional API calls and event processing overhead

### Risks
- **Migration timeline**: Risk of incomplete migration leaving system in inconsistent state
- **Event reliability**: Risk of lost events if outbox pattern not implemented correctly
- **Energy bugs**: Risk of incorrect daily reset logic affecting user experience
- **Team coordination**: Risk of teams working in isolation without proper communication

## Mitigation Strategies

1. **Gradual migration**: Implement strangler adapters to gradually move functionality
2. **Comprehensive testing**: Golden flow tests ensure critical paths work end-to-end
3. **Monitoring**: Event processing and energy reset monitoring with alerts
4. **Documentation**: Clear contracts and examples for each bounded context
5. **Team training**: Workshops on bounded context patterns and event-driven architecture

## Success Criteria

1. **Zero cross-imports**: No direct imports between bounded contexts
2. **Event reliability**: 99.9% event delivery success rate
3. **Energy accuracy**: Daily reset works correctly for all users across timezones
4. **Navigation consistency**: All provider pages moved to Settings → Integrations
5. **Test coverage**: Golden flow tests pass for all critical user journeys
6. **Performance**: No degradation in API response times
7. **Team productivity**: Teams can work independently without conflicts

## References

- [Domain-Driven Design](https://martinfowler.com/bliki/BoundedContext.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Strangler Fig Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)
