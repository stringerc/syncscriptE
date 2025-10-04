# SyncScript Codebase Inventory Report

## Executive Summary

SyncScript is a comprehensive life management platform with 10 bounded contexts, 1750+ lines of Prisma schema, and extensive feature coverage. The codebase has evolved organically and requires architectural refactoring to implement proper bounded context separation and event-driven communication.

## Feature & Route Inventory

### Implemented Features (Status: implemented)

| Feature Key | Title | Domain | Routes | UI Components | Feature Flag |
|-------------|-------|--------|--------|---------------|--------------|
| tasks | Task Management | planning-core | /tasks, /dashboard | TaskModal, TaskItem, TaskList | null |
| events | Event Management | planning-core | /calendar, /dashboard | EventModal, EventItem, CalendarView | null |
| calendar-sync | Calendar Synchronization | scheduling-sync | /calendar, /multi-calendar | CalendarPage, MultiCalendarPage | null |
| ai-assistant | AI Assistant | search-ai | /ai-assistant | AIAssistantPage, AISearchPanel | askAI |
| voice-input | Voice Input | search-ai | /tasks, /ai-assistant | SpeechToTextInput | mic |
| manual-budgeting | Manual Budgeting | budgeting | /tasks, /events | BudgetModal, BudgetChip, BudgetDrawer | null |
| energy-engine | Energy Engine | gamification | /dashboard, /gamification | EnergyEngine, EnergyLevelChart | energyHUD |
| achievements | Achievement System | gamification | /gamification | EnhancedAchievements, AchievementToast | null |
| templates | Template Gallery | scripts | /templates | TemplateGalleryPage, TemplateRecommendations | templates |
| user-scripts | My Scripts | scripts | /templates | UserScriptGallery | null |
| friends | Friends System | collaboration | /friends | FriendsPage, FriendsPicker | friends |
| projects | ShareScript Projects | collaboration | /projects | ProjectsPage, ProjectDetailPage | shareScript |
| google-calendar | Google Calendar | scheduling-sync | /google-calendar, /multi-calendar | GoogleCalendarPage | googleCalendar |
| export-system | Export System | exports | /export | ExportModal, ExportPage | null |
| search | Global Search | search-ai | /search | SearchPage, SearchResults | null |
| profile | User Profile | identity-access | /profile | ProfilePage | null |
| settings | Settings | identity-access | /settings | SettingsPage | null |

### Coming Soon Features (Status: coming_soon)

| Feature Key | Title | Domain | Routes | UI Components | Feature Flag |
|-------------|-------|--------|--------|---------------|--------------|
| financial-analytics | Financial Analytics | budgeting | /financial | FinancialPage, BudgetOverview | financial |
| energy-analysis | Energy Analysis | gamification | /energy-analysis | EnergyAnalysisPage | energyAnalysis |
| outlook-calendar | Outlook Calendar | scheduling-sync | /outlook-calendar | OutlookCalendarPage | outlookCalendar |
| apple-calendar | Apple Calendar | scheduling-sync | /apple-calendar | AppleCalendarPage | appleCalendar |
| focus-lock | Focus Lock | planning-core | /tasks | FocusLockModal | focusLock |
| priority-hierarchy | Priority Hierarchy | planning-core | /tasks | PriorityHierarchyView | priorityHierarchy |
| morning-brief | Morning Brief | planning-core | /dashboard | BriefModal | brief |
| evening-journal | Evening Journal | planning-core | /dashboard | EveningJournal | endDay |
| notifications | Notification System | collaboration | /notifications | NotificationCenter | notifications |

### Navigation Structure

**Current Navigation:**
- Core: Dashboard, Tasks, Calendar
- Plan: Projects, Templates
- People: Friends
- Me: Progress, Notifications, Profile, Settings

**Planned Navigation Changes:**
- Move provider-specific pages to Settings → Integrations:
  - /google-calendar → /settings/integrations/google-calendar
  - /outlook-calendar → /settings/integrations/outlook-calendar
  - /apple-calendar → /settings/integrations/apple-calendar
  - /multi-calendar → /settings/integrations/calendar-overview

## Data & Schema Analysis

### Database Models by Context

#### Identity & Access Context
- `users` (123 fields) - Core user data, authentication, profile
- `user_settings` (15 fields) - User preferences and configuration
- `user_feature_flags` (15 fields) - Feature flag overrides per user
- `audit_logs` (10 fields) - Admin action tracking

#### Planning Core Context
- `tasks` (25 fields) - Task management with subtasks, priorities, event linking
- `subtasks` (5 fields) - Task breakdown
- `events` (15 fields) - Event management with preparation tasks
- `conversations` (6 fields) - AI conversation history

#### Scripts Context
- `scripts` (12 fields) - Template and script definitions
- `script_applications` (10 fields) - Script application tracking
- `template_catalog` (6 fields) - Template marketplace
- `user_scripts` (12 fields) - User-created scripts

#### Scheduling/Sync Context
- `calendar_integrations` (8 fields) - OAuth calendar connections
- `external_calendar_accounts` (12 fields) - External calendar accounts
- `external_calendar_links` (15 fields) - Event synchronization links

#### Budgeting Context
- `budgets` (15 fields) - Budget definitions
- `budget_categories` (15 fields) - Budget category management
- `budget_line_items` (10 fields) - Task/event budget items
- `task_budgets` (10 fields) - Task-level budgeting
- `event_budget_items` (10 fields) - Event-level budgeting
- `transactions` (25 fields) - Financial transaction tracking
- `financial_accounts` (10 fields) - Bank account connections

#### Gamification Context
- `energy_points` (8 fields) - Energy point tracking
- `daily_challenges` (12 fields) - Daily challenge system
- `challenge_sessions` (10 fields) - Challenge completion tracking
- `energy_conversions` (8 fields) - EP to energy conversion history
- `energy_emblems` (8 fields) - Energy emblem system
- `user_energy_profiles` (10 fields) - User energy state
- `achievements` (15 fields) - Achievement system
- `badges` (8 fields) - Badge system
- `points` (8 fields) - Point system
- `streaks` (6 fields) - Streak tracking
- `user_stats` (15 fields) - User statistics

#### Collaboration Context
- `friendships` (10 fields) - Friend relationships
- `friend_prefs` (5 fields) - Friend preferences
- `privacy_settings` (5 fields) - Privacy controls
- `projects` (10 fields) - Project management
- `project_members` (8 fields) - Project membership
- `project_items` (8 fields) - Project item associations

#### Exports Context
- `export_jobs` (20 fields) - Export job tracking
- `export_templates` (15 fields) - Export template definitions
- `export_analytics` (10 fields) - Export usage analytics

#### Search/AI Context
- `analytics_events` (6 fields) - Search and AI analytics

#### Shared Kernel Context
- `notifications` (15 fields) - Notification system
- `notification_preferences` (8 fields) - Notification preferences
- `resources` (15 fields) - Resource management
- `resource_sets` (8 fields) - Resource collections

### Cross-Context Dependencies

**High Churn Tables:**
- `users` - Referenced by all contexts
- `tasks` - Referenced by gamification, budgeting, shared-kernel
- `events` - Referenced by scripts, scheduling-sync, budgeting, shared-kernel
- `energy_points` - Referenced by gamification for daily calculations

**Foreign Key Hotspots:**
- `userId` appears in 25+ tables
- `taskId` appears in 5 tables
- `eventId` appears in 6 tables
- `budgetId` appears in 4 tables

## Cross-Module Coupling Analysis

### Direct Import Violations

| Importer | Imported Symbol | File Path | Violation Type |
|----------|-----------------|-----------|----------------|
| client/src/components/TaskModal.tsx | BudgetModal | client/src/components/budget/BudgetModal.tsx | Cross-context UI import |
| client/src/components/EventModal.tsx | BudgetModal | client/src/components/budget/BudgetModal.tsx | Cross-context UI import |
| client/src/pages/DashboardPage.tsx | EnergyEngine | client/src/components/EnergyEngine.tsx | Cross-context UI import |
| server/src/routes/tasks.ts | prisma | server/src/index.ts | Direct DB access |
| server/src/routes/events.ts | prisma | server/src/index.ts | Direct DB access |
| server/src/services/energyEngineService.ts | prisma | server/src/index.ts | Direct DB access |

### Recommended Strangler Adapters

1. **Budget Context Adapter**: Create adapter for task/event budget access
2. **Energy Context Adapter**: Create adapter for energy point access
3. **Notification Context Adapter**: Create adapter for notification sending
4. **Resource Context Adapter**: Create adapter for resource management

## Event Flows & Idempotency

### Current Event Emission

**Task Events:**
- `task.created` - Emitted when task is created
- `task.completed` - Emitted when task is completed
- `task.updated` - Emitted when task is updated

**Event Events:**
- `event.created` - Emitted when event is created
- `event.updated` - Emitted when event is updated

**Energy Events:**
- `energy.earned` - Emitted when EP is earned
- `energy.reset` - Emitted during daily reset

### Idempotency Gaps

**Missing Idempotency Keys:**
- Task creation/updates
- Event creation/updates
- Energy point awards
- Calendar sync operations
- Export job creation

**Recommended Implementation:**
- Add idempotency keys to all external API calls
- Implement outbox pattern for reliable event delivery
- Add retry logic with exponential backoff

## Energy Engine Audit

### Current Implementation

**Energy Initialization:**
- New users start with `energyLevel: 5` (1-10 scale)
- Energy profile created with `currentEnergy: 50` (0-100 scale)

**Energy Updates:**
- `updateUserEnergyInRealtime()` in `server/src/jobs/energyResetJob.ts`
- EP to energy conversion with diminishing returns
- Real-time energy updates on task completion

**Energy Display:**
- UI shows 0-10 scale (energyLevel)
- Engine uses 0-100 scale (currentEnergy)
- Conversion: `energyLevel = Math.round(currentEnergy / 10)`

### Daily Reset Implementation

**Current Reset Logic:**
- `runDailyEnergyReset()` in `server/src/jobs/energyResetJob.ts`
- Resets `currentEnergy: 0` and `energyLevel: 0`
- Converts yesterday's EP to energy
- No timezone handling for user-specific midnight

**Missing Components:**
- User timezone-based reset scheduling
- Daily energy snapshots
- Race condition prevention
- Idempotency for reset operations

### Required Fixes

1. **Timezone Handling**: Reset at user's local midnight
2. **Snapshot System**: Store daily energy snapshots
3. **Idempotency**: Prevent duplicate reset operations
4. **Race Conditions**: Handle concurrent reset attempts

## Scheduling/Sync Analysis

### Calendar Integrations

**Google Calendar:**
- OAuth 2.0 implementation
- Two-way sync with conflict resolution
- Rate limiting and token refresh

**Outlook Calendar (Coming Soon):**
- Microsoft Graph API integration planned
- Enterprise calendar support
- Recurring event handling

**Apple Calendar (Coming Soon):**
- CalDAV protocol support planned
- iCloud calendar integration
- Privacy-focused implementation

### Sync Reliability

**Current Issues:**
- No idempotency keys for sync operations
- Limited retry logic
- No dead letter queue for failed syncs
- Conflict resolution is basic

**Recommended Improvements:**
- Implement idempotency keys for all sync operations
- Add exponential backoff retry logic
- Implement dead letter queue for failed syncs
- Enhance conflict resolution with user preferences

## Scripts/Playbooks Analysis

### Script System

**Script Models:**
- `scripts` - Script definitions with versioning
- `script_applications` - Application tracking
- `template_catalog` - Marketplace integration
- `user_scripts` - User-created scripts

**Idempotent Apply Path:**
- Script applications are tracked by `scriptId`, `eventId`, `scriptVersion`
- Duplicate applications are prevented
- Variable substitution is supported

**PII Detection:**
- `containsPII` field in scripts table
- PII detection is required before script application
- User consent for PII-containing scripts

### Template System

**Template Features:**
- Versioned templates
- Category-based organization
- Quality scoring system
- Usage tracking and analytics

**Template Application:**
- Idempotent application to events
- Variable substitution support
- Task and event generation
- Progress tracking

## Budgeting & Resources Analysis

### Budget System

**Budget Models:**
- `budgets` - Budget definitions with periods
- `budget_categories` - Category management
- `budget_line_items` - Task-level budgeting
- `event_budget_items` - Event-level budgeting
- `task_budgets` - Task budget tracking

**Budget Features:**
- Line item support with URLs and pricing
- Budget history tracking
- Rollover between periods
- Category-based organization

### Resource Management

**Resource Models:**
- `resources` - Individual resources
- `resource_sets` - Resource collections
- `decision_logs` - Resource selection tracking

**Resource Features:**
- URL, image, file, and note support
- Merchant and pricing information
- Tag-based organization
- Selection tracking

## Exports Analysis

### Export System

**Export Models:**
- `export_jobs` - Export job tracking
- `export_templates` - Template definitions
- `export_analytics` - Usage analytics

**Export Features:**
- Multiple formats: PDF, CSV, XLSX, ICS, Markdown, JSON
- RBAC-based redaction
- Professional document templates
- Template selection system
- Preview functionality

**Export Formats:**
- **Tasks**: PDF (Checklist Pack, Procurement Sheet), CSV/XLSX, ICS, Markdown, JSON
- **Events**: PDF (Run-of-Show, Vendor Packets, Attendee Pass), CSV/XLSX, ICS
- **Scripts**: DOCX, JSON, PDF, Markdown
- **Projects**: PDF (Briefing Pack), PPTX, CSV/XLSX, ICS

## Performance & A11y Analysis

### Bundle Size Analysis

**Largest Components:**
- `DashboardPage.tsx` - 450+ lines, multiple hooks
- `TaskModal.tsx` - 350+ lines, complex state management
- `EventModal.tsx` - 300+ lines, multiple tabs
- `ExportModal.tsx` - 200+ lines, template system

**Performance Issues:**
- Multiple React Query hooks in DashboardPage
- Complex state management in modals
- Large component files with multiple responsibilities

### Accessibility Features

**Implemented:**
- Screen reader support
- Keyboard navigation
- Focus management
- Skip links
- ARIA labels

**Missing:**
- Color contrast validation
- Motion reduction support
- High contrast mode
- Voice control support

## Mobile Readiness Analysis

### Current State

**Extracted Domain Logic:**
- API layer in `client/src/lib/api.ts`
- Utility functions in `client/src/lib/utils.ts`
- Type definitions in `shared/types.ts`

**Design Tokens:**
- Tailwind CSS for styling
- Custom CSS variables for theming
- Responsive design patterns

**State Management:**
- Zustand for auth state
- React Query for server state
- Local state in components

### React Native Blockers

**Native Modules:**
- No native module dependencies
- Browser APIs used for geolocation
- File system access for exports

**State Management:**
- Zustand is React Native compatible
- React Query is React Native compatible
- No web-specific state management

**Router Assumptions:**
- React Router DOM used
- Browser history API
- URL-based navigation

### Mobile Staging Plan

**Phase 1: Extract Domain Logic**
- Move business logic to packages
- Create typed API client
- Extract shared utilities

**Phase 2: Create REST/GraphQL Client**
- Typed API client for React Native
- Offline support with React Query
- Error handling and retry logic

**Phase 3: Scaffold Expo App**
- Create Expo app with 2 screens
- Tasks screen (read-only)
- Calendar screen (read-only)
- Navigation and basic UI

## Security & Privacy Analysis

### Authentication

**Current Implementation:**
- JWT tokens with 24-hour expiry
- Refresh tokens with 30-day expiry
- OAuth 2.0 for external integrations
- Password hashing with bcrypt

**Security Measures:**
- Rate limiting on auth endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS prevention

### Privacy

**Data Protection:**
- PII detection in scripts
- User consent for data sharing
- Privacy settings enforcement
- Data export/deletion compliance

**Audit Logging:**
- Admin action tracking
- User action logging
- Security event monitoring
- Compliance reporting

### Security Gaps

**Missing Features:**
- Two-factor authentication
- Session management
- IP-based rate limiting
- Security headers
- Content Security Policy

## Risk Assessment

### High Risk

1. **Cross-Context Coupling**: Direct imports between domains create tight coupling
2. **Energy Reset Race Conditions**: No idempotency for daily reset operations
3. **Calendar Sync Reliability**: Limited retry logic and error handling
4. **Export Security**: RBAC redaction may have gaps

### Medium Risk

1. **Performance**: Large components and multiple React Query hooks
2. **Mobile Readiness**: Web-specific dependencies block React Native
3. **Feature Flag Inconsistency**: Different flag systems across frontend/backend
4. **Event Reliability**: No outbox pattern for event delivery

### Low Risk

1. **Accessibility**: Good foundation but missing some features
2. **Documentation**: Comprehensive but needs maintenance
3. **Testing**: Good test coverage but missing integration tests
4. **Monitoring**: Basic logging but no comprehensive monitoring

## Mitigation Strategies

### Immediate Actions

1. **Implement Idempotency Keys**: Add to all external API calls
2. **Fix Energy Reset**: Add timezone handling and race condition prevention
3. **Add Event Outbox**: Implement reliable event delivery
4. **Enhance Error Handling**: Add retry logic and dead letter queues

### Short-term Actions

1. **Create Strangler Adapters**: For worst cross-import violations
2. **Implement Navigation Registry**: Centralized navigation management
3. **Add Performance Monitoring**: Bundle size and runtime performance
4. **Enhance Security**: Add 2FA and security headers

### Long-term Actions

1. **Complete Bounded Context Migration**: Move all functionality behind APIs
2. **Implement Event-Driven Architecture**: Full event bus implementation
3. **Mobile App Development**: React Native app with core features
4. **Comprehensive Monitoring**: Full observability stack

## Success Metrics

### Technical Metrics

- **Zero Cross-Imports**: No direct imports between bounded contexts
- **Event Reliability**: 99.9% event delivery success rate
- **Energy Accuracy**: Daily reset works for all users across timezones
- **Performance**: No degradation in API response times
- **Test Coverage**: 90%+ coverage for critical paths

### Business Metrics

- **User Experience**: No regression in user-facing features
- **Team Productivity**: Teams can work independently without conflicts
- **Feature Velocity**: Faster feature development with clear boundaries
- **System Reliability**: Reduced bugs and improved stability
- **Mobile Readiness**: Core features available on mobile

## Conclusion

SyncScript has a solid foundation with comprehensive feature coverage and good architectural patterns. However, the organic growth has led to cross-context coupling and inconsistent patterns. The proposed bounded context architecture will provide clear separation of concerns, improve maintainability, and enable independent team development.

The energy system requires immediate attention to fix timezone handling and race conditions. The export system is well-implemented but needs security review. The mobile readiness is good with minimal blockers to React Native development.

The migration to bounded contexts should be done gradually using strangler adapters to avoid breaking changes. The event-driven architecture will provide the foundation for scalable, maintainable code.
