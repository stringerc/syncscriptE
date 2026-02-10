# 📁 SyncScript - Complete Project Structure

**Comprehensive guide to the project organization and file structure.**

---

## 🗂️ Root Directory

```
syncscript-dashboard/
├── 📄 README.md                    # Project overview (START HERE)
├── 📄 package.json                 # Dependencies & scripts
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 vite.config.ts               # Vite build configuration
├── 📄 vercel.json                  # Vercel deployment config
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .env.example                 # Environment variables template
├── 📄 index.html                   # HTML entry point
├── 📄 App.tsx                      # Main React component
├── 📄 PROJECT_STRUCTURE.md         # This file
│
├── 📁 docs/                        # 📚 COMPLETE DOCUMENTATION (140+ files)
├── 📁 src/                         # Source entry point
├── 📁 components/                  # React components (223 files)
├── 📁 contexts/                    # React contexts (8 files)
├── 📁 hooks/                       # Custom hooks (35 files)
├── 📁 utils/                       # Utility functions (65 files)
├── 📁 types/                       # TypeScript types (7 files)
├── 📁 data/                        # Mock data (10 files)
├── 📁 services/                    # Service layer (5 files)
├── 📁 styles/                      # Global styles
├── 📁 supabase/                    # Backend Edge Functions
├── 📁 imports/                     # Figma imports
└── 📁 examples/                    # Code examples
```

---

## 📚 Documentation Structure (`/docs/`)

### Main Documentation Hub
```
docs/
├── README.md                       # Documentation index (START HERE)
│
├── 📁 deployment/                  # 🚀 Deployment guides (8 files)
│   ├── README.md                  # Deployment overview
│   ├── START_HERE.md              # Guide selector
│   ├── QUICK_DEPLOY.md            # 5-min quick deploy
│   ├── COMPLETE_GUIDE.md          # 20-min step-by-step
│   ├── CHECKLIST.md               # Interactive checklist
│   ├── PRODUCTION_REFERENCE.md    # Full production guide
│   ├── ENVIRONMENT_VARIABLES.md   # All env vars documented
│   └── TROUBLESHOOTING.md         # Common issues & fixes
│
├── 📁 features/                    # ✨ Feature documentation (50+ files)
│   ├── README.md                  # Features overview
│   ├── OPENCLAW_AI.md             # AI system
│   ├── CUSTOMER_SERVICE.md        # CS automation
│   ├── EMAIL_SYSTEM.md            # Email management
│   ├── RESTAURANTS.md             # Restaurant discovery
│   ├── CALENDAR.md                # Calendar system
│   ├── ENERGY.md                  # Energy management
│   ├── TASKS_GOALS.md             # Tasks & goals
│   ├── GAMIFICATION.md            # Gamification
│   ├── TEAM.md                    # Team collaboration
│   └── ANALYTICS.md               # Analytics & insights
│
├── 📁 openclaw/                    # 🤖 OpenClaw AI docs (15+ files)
│   ├── README.md                  # OpenClaw overview
│   ├── PHASE1_COMPLETE.md         # Phase 1 docs
│   ├── PHASE2_COMPLETE.md         # Phase 2 docs
│   ├── PHASE3_COMPLETE.md         # Phase 3 docs
│   ├── PHASE4_EXECUTIVE_SUMMARY.md # Phase 4 docs
│   ├── ALL_PHASES_COMPLETE.md     # Complete summary
│   ├── SKILLS_REFERENCE.md        # All 11 skills
│   ├── SECURITY_GUIDE.md          # Security architecture
│   └── QUICK_START.md             # Quick start guide
│
├── 📁 guides/                      # 📖 Setup & integration guides (30+ files)
│   ├── README.md                  # Guides overview
│   ├── DISCORD_SETUP.md           # Discord OAuth
│   ├── STRIPE_SETUP.md            # Stripe payments
│   ├── FOURSQUARE_SETUP.md        # Restaurant API
│   ├── WEATHER_SETUP.md           # Weather API
│   ├── OAUTH_PROVIDERS.md         # OAuth setup
│   ├── API_KEYS.md                # Where to get all API keys
│   ├── USER_GUIDE.md              # End-user guide
│   ├── ADMIN_GUIDE.md             # Admin guide
│   └── MONITORING.md              # Monitoring setup
│
├── 📁 research/                    # 🔬 Design research (20+ files)
│   ├── README.md                  # Research overview
│   ├── EMPTY_STATE_DESIGN.md      # Empty states research
│   ├── PROGRESS_BAR_OPTIMIZATION.md # Progress bar research
│   ├── TEXT_VISIBILITY.md         # Text visibility
│   ├── BETA_PROGRAM.md            # Beta program research
│   ├── FLOATING_FEEDBACK.md       # Feedback systems
│   ├── PIE_CHART_LABELING.md      # Chart research
│   └── INSIGHTS_TO_ACTION.md      # Action patterns
│
└── 📁 reference/                   # 📋 Technical reference (15+ files)
    ├── README.md                  # Reference overview
    ├── MASTER_GUIDE.md            # 150,000+ word complete guide
    ├── API_REFERENCE.md           # All API endpoints
    ├── COMPONENTS.md              # Component catalog
    ├── DATA_MODELS.md             # Type definitions
    ├── ARCHITECTURE.md            # System architecture
    ├── TROUBLESHOOTING.md         # Common issues
    ├── FAQ.md                     # Frequently asked questions
    ├── CHANGELOG.md               # Version history
    └── FILES_MANIFEST.md          # Complete file listing
```

**Total:** 140+ documentation files, 180,000+ words

---

## 🎨 Components Directory (`/components/`)

### Component Organization
```
components/
├── 📁 admin/                       # Admin dashboard components (10 files)
│   ├── AIObservatoryDashboard.tsx
│   ├── AdminEmailDashboard.tsx
│   ├── CustomerIntelligence.tsx
│   ├── FeedbackIntelligenceDashboard.tsx
│   ├── PerformanceAnalytics.tsx
│   ├── ProactiveSupportEngine.tsx
│   ├── SmartResponseSystem.tsx
│   └── TestEmailGenerator.tsx
│
├── 📁 analytics/                   # Analytics components (3 files)
│   ├── AnalyticsTestPanel.tsx
│   ├── BehaviorInsightsPanel.tsx
│   └── CompletionAnalyticsDashboard.tsx
│
├── 📁 auth/                        # Authentication components
│   ├── AuthPageNavigation.tsx
│   └── README.md
│
├── 📁 billing/                     # Billing components
│   └── BillingSettings.tsx
│
├── 📁 calendar/                    # Calendar system (9 files)
│   ├── CalendarZoomControls.tsx
│   ├── ContextualInsightsPanel.tsx
│   ├── CurrentTimeLine.tsx
│   ├── EventAgendaView.tsx
│   ├── InfiniteTimelineCalendar.tsx
│   ├── MonthView.tsx
│   ├── TimelineView.tsx
│   └── WeekView.tsx
│
├── 📁 calendar-cards/              # Calendar card system (20 files)
│   ├── 📁 core/                   # Base card components
│   ├── 📁 features/               # Feature enhancements
│   ├── 📁 composed/               # Composed cards
│   └── 📁 utils/                  # Card utilities
│
├── 📁 card-enhancements/           # Card enhancement features
│   ├── EnhancedEventCard.tsx
│   ├── NaturalTime.tsx
│   ├── ProgressWithMomentum.tsx
│   └── SmartActions.tsx
│
├── 📁 charts/                      # Chart components
│   └── ResearchBackedCharts.tsx
│
├── 📁 design-system/               # Design system (8 files)
│   ├── DSAppShell.tsx
│   ├── DSButton.tsx
│   ├── DSCard.tsx
│   ├── DSHeader.tsx
│   ├── DSInput.tsx
│   ├── DSNav.tsx
│   └── DSSidebar.tsx
│
├── 📁 energy/                      # Energy management (8 files)
│   ├── EnergyAnalyticsDashboard.tsx
│   ├── EnergyDisplay.tsx
│   ├── EnergyPointsDisplay.tsx
│   ├── EnergyPredictionCard.tsx
│   ├── EnergySettings.tsx
│   └── ResonanceHarmonyDetector.tsx
│
├── 📁 figma/                       # Figma integration
│   └── ImageWithFallback.tsx      # (Protected file)
│
├── 📁 gamification/                # Gamification system (11 files)
│   ├── ClassSelection.tsx
│   ├── EventCalendar.tsx
│   ├── FriendSystem.tsx
│   ├── GiftTradingSystem.tsx
│   ├── GuildDashboard.tsx
│   ├── LeagueStandings.tsx
│   ├── MasteryTrees.tsx
│   ├── PetCollection.tsx
│   ├── PrestigeSystem.tsx
│   ├── QuestBoard.tsx
│   └── SeasonPassTracker.tsx
│
├── 📁 goals/                       # Goals management (6 files)
│   ├── GoalAnalyticsTab.tsx
│   ├── GoalTemplateLibrary.tsx
│   ├── GoalTimelineView.tsx
│   └── RoleManagementModal.tsx
│
├── 📁 guest/                       # Guest mode
│   └── GuestModeBanner.tsx
│
├── 📁 hooks/                       # Component hooks
│   └── useAgendaManagement.tsx
│
├── 📁 integrations/                # Integration components (6 files)
│   ├── CalendarImportDialog.tsx
│   ├── EnhancedOAuthConnector.tsx
│   ├── IntegrationMarketplace.tsx
│   ├── MakeComSetup.tsx
│   └── OAuthConnector.tsx
│
├── 📁 layout/                      # Layout components
│   └── DashboardLayout.tsx
│
├── 📁 onboarding/                  # Onboarding flow (4 files)
│   ├── EnhancedWelcomeModal.tsx
│   ├── OnboardingChecklist.tsx
│   ├── ProductTour.tsx
│   └── SampleDataBanner.tsx
│
├── 📁 pages/                       # Page components (30 files)
│   ├── AIAssistantPage.tsx
│   ├── AnalyticsInsightsPage.tsx
│   ├── CalendarEventsPage.tsx
│   ├── DashboardPage.tsx
│   ├── EnergyFocusPage.tsx
│   ├── GamificationHubPage.tsx
│   ├── IntegrationsPage.tsx
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── OnboardingPage.tsx
│   ├── PricingPage.tsx
│   ├── ResonanceEnginePage.tsx
│   ├── ScriptsTemplatesPage.tsx
│   ├── SettingsPage.tsx
│   ├── SignupPage.tsx
│   ├── TasksGoalsPage.tsx
│   └── TeamCollaborationPage.tsx
│   └── [15+ more page files]
│
├── 📁 shared/                      # Shared components
│   └── RoleBadge.tsx
│
├── 📁 team/                        # Team collaboration (25 files)
│   ├── AutomationRulesPanel.tsx
│   ├── BulkTaskActions.tsx
│   ├── CollaborationView.tsx
│   ├── CreateTeamDialog.tsx
│   ├── InviteMemberDialog.tsx
│   ├── TeamAnalyticsTab.tsx
│   ├── TeamCard.tsx
│   ├── TeamDashboard.tsx
│   ├── TeamEnergyDashboard.tsx
│   ├── TeamEventAssignment.tsx
│   ├── TeamGamificationDashboard.tsx
│   ├── TeamResonanceChart.tsx
│   └── [13+ more team files]
│
├── 📁 ui/                          # UI primitives (40 files)
│   ├── accordion.tsx
│   ├── alert-dialog.tsx
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   └── [28+ more UI components]
│
├── 📁 user/                        # User components
│   ├── CurrentUserCard.tsx
│   ├── UserAvatar.tsx
│   └── UserBadge.tsx
│
└── [100+ individual component files at root level]
    ├── AIAssistantPanel.tsx
    ├── AIInsightsPanel.tsx
    ├── CalendarWidget.tsx
    ├── DashboardHeader.tsx
    ├── EnergyBadge.tsx
    ├── FloatingFeedbackButton.tsx
    ├── MobileNav.tsx
    ├── Sidebar.tsx
    ├── TaskModal.tsx
    └── [90+ more components]
```

**Total:** 223 React components

---

## 🔧 Backend Structure (`/supabase/functions/server/`)

```
supabase/functions/server/
├── index.tsx                       # Main server entry point (Hono)
├── kv_store.tsx                   # Key-value store utilities (Protected)
│
├── 🤖 OpenClaw AI System (11 files)
├── openclaw-bridge.tsx            # OpenClaw integration
├── openclaw-security.tsx          # Security layer (7 layers)
├── ai-observatory.tsx             # Monitoring & cost tracking
├── ai-cache.tsx                   # Intelligent semantic cache
├── ai-model-router.tsx            # Multi-model routing
├── ai-streaming.tsx               # Server-Sent Events streaming
├── ai-context-optimizer.tsx       # Context window optimization
├── ai-ab-testing.tsx              # A/B testing framework
├── ai-cross-agent-memory.tsx      # Cross-agent memory
├── ai-predictive-prefetch.tsx     # Predictive pre-fetching
│
├── 📧 Email & CS System (8 files)
├── admin-email-routes.tsx         # Admin dashboard routes
├── email-automation.tsx           # Email automation logic
├── email-system-routes.tsx        # Email API routes
├── email-templates.tsx            # Email templates
├── test-email.tsx                 # Email testing
├── customer_intelligence.ts       # Customer intelligence AI
├── intelligent_auto_responder.ts  # Auto-response system
├── performance_metrics.ts         # Performance tracking
├── proactive_triggers.ts          # Proactive support
│
├── 💬 Feedback System (3 files)
├── feedback-routes.tsx            # Feedback API routes
├── feedback-intelligence.tsx      # Feedback intelligence AI
├── feedback-digest.tsx            # Digest generation
│
├── 🔐 Authentication (2 files)
├── guest-auth-routes.tsx          # Guest authentication
├── beta.ts                        # Beta user management
│
├── 🍽️ Restaurant API (1 file)
├── restaurant-api.tsx             # Foursquare integration
│
├── 💳 Payments (1 file)
├── stripe-routes.tsx              # Stripe integration
│
├── 🔗 OAuth & Integrations (2 files)
├── oauth-routes.tsx               # OAuth (Google, Discord)
└── make-routes.tsx                # Make.com integration
```

**Total:** 29 Edge Function files

---

## 🎯 Configuration Files

### Root Configuration
```
/
├── package.json                    # Dependencies (68 packages)
├── package-lock.json              # Locked versions
├── tsconfig.json                  # TypeScript config
├── tsconfig.node.json             # TypeScript for Node
├── vite.config.ts                 # Vite build config
├── vercel.json                    # Vercel deployment config ✨ NEW
├── .gitignore                     # Git ignore rules ✨ NEW
├── .env.example                   # Environment variables ✨ NEW
└── index.html                     # HTML entry point
```

### Scripts in package.json
```json
{
  "dev": "vite",                    // Development server
  "build": "tsc && vite build",     // Production build
  "preview": "vite preview",        // Preview build
  "type-check": "tsc --noEmit",     // Check TypeScript
  "lint": "eslint ..."              // Lint code
}
```

---

## 🗄️ Supporting Directories

### Contexts (`/contexts/`)
```
contexts/
├── AIContext.tsx                   # AI state management
├── AuthContext.tsx                 # Authentication
├── CalendarNavigationContext.tsx  # Calendar navigation
├── EnergyContext.tsx              # Energy system
├── GamificationContext.tsx        # Gamification state
├── OpenClawContext.tsx            # OpenClaw integration
├── TasksContext.tsx               # Tasks state
└── TeamContext.tsx                # Team collaboration
```

### Hooks (`/hooks/`)
```
hooks/
├── useAdaptiveDifficulty.ts
├── useAnalytics.tsx
├── useCalendarDrag.ts
├── useCalendarEvents.ts
├── useEnergy.ts
├── useEnergyPrediction.ts
├── useGoals.tsx
├── useTasks.ts
├── useResonance.ts
├── useStripe.ts
├── useWeatherRoute.ts
└── [25+ more hooks]
```
**Total:** 35+ custom React hooks

### Utils (`/utils/`)
```
utils/
├── 📁 supabase/
│   └── info.tsx                   # Supabase configuration
├── adaptation-engine.tsx
├── ai-calendar-layout.ts
├── calendar-intelligence.ts
├── energy-calculations.ts
├── openclaw-client.ts
├── openclaw-websocket.ts
├── resonance-calculus.ts
├── task-event-integration.tsx
├── team-energy-integration.tsx
└── [55+ more utility files]
```
**Total:** 65+ utility functions

### Types (`/types/`)
```
types/
├── analytics.ts                    # Analytics types
├── budget-types.ts                # Budget types
├── data-model.ts                  # Core data models
├── gamification.ts                # Gamification types
├── openclaw.ts                    # OpenClaw types
├── task.ts                        # Task types
├── team.ts                        # Team types
└── unified-types.ts               # Unified type system
```

### Data (`/data/`)
```
data/
├── budget-goals-mock.ts
├── calendar-mock.ts
├── conflict-alerts-mock.ts
├── gamification-data.ts
├── mockTasks.ts
├── planned-events-mock.ts
├── restaurant-alternatives-mock.ts
└── sample-calendar-events.ts
```

### Services (`/services/`)
```
services/
├── ITaskRepository.ts             # Task repository interface
├── MockTaskRepository.ts          # Mock implementation
├── data-service.ts                # Data service layer
└── index.ts                       # Service exports
```

### Styles (`/styles/`)
```
styles/
└── globals.css                    # Global CSS + Tailwind
```

---

## 📦 Build Output (`/dist/` - Generated)

```
dist/                               # Production build output
├── index.html                     # HTML entry
├── assets/                        # Optimized assets
│   ├── index-[hash].js           # Main JS bundle
│   ├── react-vendor-[hash].js    # React vendor chunk
│   ├── ui-vendor-[hash].js       # UI vendor chunk
│   ├── chart-vendor-[hash].js    # Chart vendor chunk
│   └── utility-vendor-[hash].js  # Utility vendor chunk
└── [other optimized assets]
```

**Generated by:** `npm run build`  
**Size:** ~2-3 MB total  
**Optimization:** Code splitting, minification, tree shaking

---

## 🎯 Key Files to Know

### Essential for Development
- `/App.tsx` - Main application entry
- `/components/pages/DashboardPage.tsx` - Main dashboard
- `/contexts/OpenClawContext.tsx` - AI state
- `/supabase/functions/server/index.tsx` - Backend entry
- `/utils/supabase/info.tsx` - Supabase config

### Essential for Deployment
- `/vercel.json` - Vercel configuration
- `/.env.example` - Environment variables
- `/.gitignore` - Git security
- `/package.json` - Dependencies
- `/vite.config.ts` - Build config

### Essential for Documentation
- `/README.md` - Project overview
- `/docs/README.md` - Documentation hub
- `/docs/deployment/START_HERE.md` - Deployment guide
- `/docs/reference/MASTER_GUIDE.md` - Complete reference
- `/PROJECT_STRUCTURE.md` - This file

---

## 🔍 Finding What You Need

### By Feature
- Calendar → `/components/calendar/` + `/components/pages/CalendarEventsPage.tsx`
- Tasks & Goals → `/components/pages/TasksGoalsPage.tsx`
- Energy → `/components/energy/` + `/components/pages/EnergyFocusPage.tsx`
- Gamification → `/components/gamification/` + `/components/pages/GamificationHubPage.tsx`
- Team → `/components/team/` + `/components/pages/TeamCollaborationPage.tsx`
- AI → `/contexts/OpenClawContext.tsx` + `/supabase/functions/server/openclaw-*.tsx`

### By Type
- React Components → `/components/`
- State Management → `/contexts/`
- Hooks → `/hooks/`
- Utilities → `/utils/`
- Types → `/types/`
- Backend → `/supabase/functions/server/`
- Documentation → `/docs/`

### By Task
- Deploying → `/docs/deployment/`
- Understanding features → `/docs/features/`
- Setting up integrations → `/docs/guides/`
- Learning AI system → `/docs/openclaw/`
- Technical reference → `/docs/reference/`
- Research background → `/docs/research/`

---

## 📊 Project Statistics

**Code:**
- Total files: 500+
- Lines of code: 80,000+
- React components: 223
- Custom hooks: 35+
- Utility functions: 65+
- Backend files: 29
- TypeScript types: 7 type files

**Documentation:**
- Total docs: 140+
- Total words: 180,000+
- Deployment guides: 8
- Feature docs: 50+
- OpenClaw docs: 15+
- Setup guides: 30+
- Research docs: 20+
- Reference docs: 15+

**Configuration:**
- Config files: 10+
- Environment variables: 24
- Build scripts: 5
- Git ignored patterns: 40+

---

## ✅ Organization Principles

**Why This Structure:**

1. **Clear Separation** - Frontend, backend, docs separate
2. **Logical Grouping** - Related files together
3. **Easy Navigation** - Intuitive folder names
4. **Scalable** - Easy to add new features
5. **Professional** - Industry-standard patterns
6. **Documented** - Every folder has purpose
7. **Searchable** - Clear file naming
8. **Maintainable** - Easy to understand

**Conventions:**

- Component files: PascalCase.tsx
- Utility files: kebab-case.ts
- Hook files: camelCase.ts
- Type files: kebab-case.ts
- Documentation: UPPERCASE.md for important, kebab-case.md for specific

---

## 🚀 Next Steps

**For Developers:**
1. Start with `/README.md`
2. Explore `/components/pages/` for main pages
3. Check `/components/` for reusable components
4. Review `/contexts/` for state management
5. Look at `/supabase/functions/server/` for backend

**For Documentation:**
1. Start with `/docs/README.md`
2. Choose category based on need
3. Each folder has own README
4. Cross-references throughout

**For Deployment:**
1. Read `/docs/deployment/START_HERE.md`
2. Follow chosen deployment guide
3. Reference `/docs/deployment/ENVIRONMENT_VARIABLES.md`
4. Use troubleshooting guides as needed

---

**Last Updated:** February 10, 2026  
**Version:** 2.0  
**Total Files:** 500+  
**Organization:** Professional, scalable, documented

---

🎵 **"We tune your day like sound - organized for perfect harmony!"** 🎵
