# SyncScript Bounded Contexts

## Context Overview

SyncScript is organized into bounded contexts that own specific domains of functionality. Each context has clear ownership boundaries, database tables, and event flows.

## Bounded Contexts

### 1. Identity & Access
**Owner**: Core Platform Team  
**Database Tables**: `users`, `user_settings`, `user_feature_flags`, `audit_logs`  
**Public API**: `/api/auth/*`, `/api/user/*`, `/api/feature-flags/*`  
**Events Emitted**: `user.created`, `user.updated`, `user.deleted`, `feature_flag.changed`  
**Events Consumed**: None (source of truth for user identity)  
**External Integrations**: OAuth providers (Google, Microsoft, Apple)  
**Invariants**:
- User identity is immutable once created
- Feature flags are user-scoped
- Audit logs are append-only
- Authentication tokens expire and refresh

### 2. Planning Core
**Owner**: Productivity Team  
**Database Tables**: `tasks`, `subtasks`, `events`, `conversations`  
**Public API**: `/api/tasks/*`, `/api/events/*`  
**Events Emitted**: `task.created`, `task.completed`, `task.updated`, `event.created`, `event.updated`  
**Events Consumed**: `user.created` (for user initialization)  
**External Integrations**: None  
**Invariants**:
- Tasks must belong to a user
- Events have valid time ranges
- Subtasks belong to parent tasks
- Task completion triggers energy points

### 3. Scripts
**Owner**: Automation Team  
**Database Tables**: `scripts`, `script_applications`, `template_catalog`, `template_stats`, `user_scripts`  
**Public API**: `/api/scripts/*`, `/api/templates/*`  
**Events Emitted**: `script.applied`, `template.used`, `script.created`  
**Events Consumed**: `event.created` (for template recommendations)  
**External Integrations**: None  
**Invariants**:
- Scripts are versioned and immutable
- Application is idempotent
- PII detection is mandatory
- Template catalog is curated

### 4. Scheduling/Sync
**Owner**: Integration Team  
**Database Tables**: `calendar_integrations`, `external_calendar_accounts`, `external_calendar_links`  
**Public API**: `/api/calendar/*`, `/api/google-calendar/*`, `/api/outlook-calendar/*`, `/api/apple-calendar/*`  
**Events Emitted**: `calendar.synced`, `calendar.conflict_detected`, `calendar.integration_added`  
**Events Consumed**: `event.created`, `event.updated` (for sync triggers)  
**External Integrations**: Google Calendar API, Microsoft Graph API, CalDAV  
**Invariants**:
- OAuth tokens are securely stored
- Sync is bidirectional with conflict resolution
- External events are linked to canonical events
- Rate limiting is enforced

### 5. Budgeting
**Owner**: Financial Team  
**Database Tables**: `budgets`, `budget_categories`, `budget_line_items`, `task_budgets`, `event_budget_items`, `budget_envelopes`, `budget_history`  
**Public API**: `/api/budget/*`  
**Events Emitted**: `budget.created`, `budget.updated`, `budget.alert_triggered`  
**Events Consumed**: `task.created`, `event.created` (for budget initialization)  
**External Integrations**: Plaid (financial data), Stripe (payments)  
**Invariants**:
- Budgets are scoped to users
- Line items support pricing and URLs
- Budget history is immutable
- Alerts are user-configurable

### 6. Gamification
**Owner**: Engagement Team  
**Database Tables**: `energy_points`, `daily_challenges`, `challenge_sessions`, `energy_conversions`, `energy_emblems`, `user_energy_profiles`, `achievements`, `badges`, `points`, `streaks`, `user_stats`  
**Public API**: `/api/gamification/*`, `/api/energy/*`  
**Events Emitted**: `energy.earned`, `achievement.unlocked`, `challenge.completed`, `energy.reset`  
**Events Consumed**: `task.completed`, `event.completed` (for EP awards)  
**External Integrations**: None  
**Invariants**:
- Energy resets daily at midnight
- EP to energy conversion has diminishing returns
- Achievements are domain-specific
- Daily challenges are generated per user

### 7. Collaboration
**Owner**: Social Team  
**Database Tables**: `friendships`, `friend_prefs`, `privacy_settings`, `energy_hidden_from`  
**Public API**: `/api/friends/*`  
**Events Emitted**: `friendship.requested`, `friendship.accepted`, `privacy.changed`  
**Events Consumed**: `user.created` (for privacy initialization)  
**External Integrations**: None  
**Invariants**:
- Friendships require mutual consent
- Privacy settings are respected
- Energy visibility is configurable
- Friend requests can be blocked

### 8. Exports
**Owner**: Platform Team  
**Database Tables**: `export_jobs`, `export_templates`, `export_analytics`  
**Public API**: `/api/export/*`  
**Events Emitted**: `export.started`, `export.completed`, `export.failed`  
**Events Consumed**: `task.created`, `event.created` (for export data)  
**External Integrations**: PDF generation, email delivery  
**Invariants**:
- Exports respect RBAC permissions
- Templates are reusable
- Analytics track usage
- Files expire after download

### 9. Search/AI
**Owner**: AI Team  
**Database Tables**: `analytics_events` (for search analytics)  
**Public API**: `/api/ai/*`, `/api/search/*`  
**Events Emitted**: `search.performed`, `ai.suggestion_shown`  
**Events Consumed**: `task.created`, `event.created` (for indexing)  
**External Integrations**: OpenAI API, search indexing  
**Invariants**:
- Search respects user permissions
- AI responses are contextual
- Analytics are privacy-preserving
- Voice input requires consent

### 10. Shared Kernel
**Owner**: Platform Team  
**Database Tables**: `notifications`, `notification_preferences`, `resources`, `resource_sets`, `decision_logs`  
**Public API**: `/api/notifications/*`, `/api/resources/*`  
**Events Emitted**: `notification.sent`, `resource.added`  
**Events Consumed**: All events (for notification routing)  
**External Integrations**: Email providers, push notification services  
**Invariants**:
- Notifications respect user preferences
- Resources are user-owned
- Decision logs are immutable
- Multi-channel delivery is supported

## Cross-Context Interactions

### Event Bus
All cross-context communication happens through a typed event bus:
- Events are published to the shared kernel
- Each context subscribes to relevant events
- Event handlers are idempotent
- Failed event processing is retried with backoff

### Outbox Pattern
For reliable event delivery:
- Events are written to an outbox table
- Background job processes outbox entries
- Failed events are retried with exponential backoff
- Dead letter queue for permanently failed events

### Idempotency Keys
All external API calls use idempotency keys:
- Generated from user ID + operation + timestamp
- Stored in idempotency table
- Prevents duplicate operations
- Keys expire after 24 hours

## Data Ownership

### User Data
- **Identity & Access**: Owns user identity and authentication
- **Planning Core**: Owns user's tasks and events
- **Gamification**: Owns user's energy and achievements
- **Collaboration**: Owns user's social connections

### Shared Data
- **Resources**: Shared across contexts for task/event resources
- **Notifications**: Shared for cross-context communication
- **Analytics**: Shared for usage tracking and insights

## External Integrations

### Calendar Providers
- **Google**: OAuth 2.0, Calendar API v3
- **Microsoft**: OAuth 2.0, Graph API
- **Apple**: CalDAV protocol

### Financial Services
- **Plaid**: Bank account connections
- **Stripe**: Payment processing

### AI Services
- **OpenAI**: GPT models for AI assistant
- **Speech Recognition**: Browser APIs for voice input

## Security Boundaries

### Authentication
- JWT tokens with 24-hour expiry
- Refresh tokens with 30-day expiry
- OAuth 2.0 for external integrations

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Privacy settings enforcement

### Data Protection
- PII detection in scripts
- Data export/deletion compliance
- Audit logging for admin actions
