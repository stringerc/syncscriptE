# 🗺️ COMPLETE NAVIGATION MAP - SYNCSCRIPT

## 📍 **ALL ROUTES & NAVIGATION PATHS**

---

## 🏠 **PUBLIC ROUTES** (No Login Required)

```
/                    → Landing Page
/design-system       → Design System Showcase
/showcase/progress   → Progress Animation Demo
/login               → Login Page
/signup              → Signup Page
```

---

## 🔐 **AUTHENTICATED ROUTES** (Login Required)

### **Main Dashboard:**
```
/dashboard           → Main Dashboard
├─ Today's Overview
├─ Energy Stats
├─ Quick Actions
├─ AI Focus Section
└─ Resource Hub
```

### **Core Pages:**
```
/tasks               → Tasks & Goals
├─ Task Management (44,000 lines)
├─ Goal Tracking
├─ Kanban Boards
└─ Timeline Views

/calendar            → Calendar & Events
├─ Day View
├─ Week View
├─ Month View
└─ Timeline View

/energy              → Energy & Focus
├─ Current Readiness
├─ Energy Logs
├─ Circadian Rhythm
└─ Optimization

/resonance-engine    → Resonance Engine (ARA)
├─ Resonance Scoring
├─ Harmonic Alignment
├─ Phase Locking
└─ Advanced Metrics

/ai                  → AI Assistant
├─ Chat Interface
├─ Contextual Insights
├─ Recommendations
└─ Smart Suggestions
```

---

## 👥 **TEAM & COLLABORATION** (⭐ Your Profile!)

```
/team                → Team & Collaboration Page
│
├─ ?view=teams (DEFAULT)
│  ├─ Grid View
│  ├─ List View
│  ├─ Create Team
│  ├─ Team Cards
│  └─ Team Stats
│
├─ ?view=collaboration
│  ├─ Activity Feed
│  ├─ Shared Goals
│  ├─ Team Metrics
│  └─ Communication
│
└─ ?view=individual ⭐ ← YOUR PROFILE!
   ├─ Profile Picture Upload
   ├─ Bio & Status
   ├─ Personal Stats
   ├─ Achievements
   └─ Preferences
```

### **💡 HOW TO ACCESS YOUR PROFILE:**

```
┌────────────────────────────────────────┐
│  METHOD 1: Profile Menu (Recommended)  │
└────────────────────────────────────────┘

1. Click Avatar (top-right corner)
2. Dropdown opens
3. Click "My Profile"
4. → Auto-navigates to /team?view=individual
5. → Individual tab opens
6. → Customize your profile!

┌────────────────────────────────────────┐
│  METHOD 2: Direct URL                  │
└────────────────────────────────────────┘

1. Type in browser: /team?view=individual
2. Press Enter
3. → Individual tab opens directly

┌────────────────────────────────────────┐
│  METHOD 3: Bookmark                    │
└────────────────────────────────────────┘

1. Navigate to /team?view=individual
2. Bookmark the page
3. Click bookmark anytime to access profile
```

---

## 📊 **ANALYTICS & INSIGHTS**

```
/analytics           → Analytics & Insights
├─ Energy Analytics
├─ Productivity Metrics
├─ Goal Progress
├─ Team Performance
└─ Custom Reports
```

---

## 🎮 **GAMIFICATION & PROGRESSION**

```
/gaming              → Gamification Hub (Original)
/gaming-v2           → Gamification Hub V2 (Enhanced)
├─ Classes & Progression
├─ Achievements
├─ Leaderboards
├─ Quests & Missions
└─ Rewards
```

---

## 🔌 **INTEGRATIONS & TOOLS**

```
/integrations        → Integrations Page
├─ OAuth Setup (Google, Microsoft, Slack)
├─ Stripe Payments
├─ Make.com Automation
├─ Discord Bot
└─ Email Systems

/scripts             → Scripts & Templates
├─ Marketplace
├─ My Scripts
├─ Create Script
└─ Browse Templates

/team-scripts        → Team Scripts
├─ Shared Templates
├─ Team Automation
└─ Collaboration Scripts
```

---

## 🏢 **ENTERPRISE & ADMIN**

```
/enterprise          → Enterprise Tools
├─ Admin Dashboard
├─ Security Settings
├─ Analytics
└─ Team Management
```

---

## ⚙️ **SETTINGS & PROFILE**

```
/settings            → Settings Page
├─ Account Settings
├─ Preferences
├─ Notifications
├─ Privacy
└─ Integrations

/onboarding          → Onboarding Wizard
├─ Step 1: Profile Setup
├─ Step 2: Work Hours
├─ Step 3: Energy Peaks
└─ Step 4: Integrations
```

---

## 🔄 **PROFILE NAVIGATION FLOW**

### **Complete User Journey:**

```
        START: User on Dashboard
              │
              ▼
    ┌─────────────────────┐
    │  Click Avatar       │  (Top-right corner)
    │  (Animated ring)    │
    └──────────┬──────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  Profile Dropdown Opens      │
    │                              │
    │  👤 Alex Johnson             │
    │  alex@example.com            │
    │  🟢 Active                   │
    │                              │
    │  ⚡ Energy: 67%              │
    │  🔥 Streak: 6 days           │
    │  ⭐ Level 5                  │
    │  ────────────────────────    │
    │  👤 My Profile               │ ← Click here!
    │  💳 Billing & Plans          │
    │  ❓ Help & Support           │
    │  🚪 Sign Out                 │
    └──────────┬───────────────────┘
               │
               │ Click "My Profile"
               ▼
    ┌──────────────────────────────┐
    │  Navigate to:                │
    │  /team?view=individual       │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  TeamPage.tsx receives route │
    │  • Reads ?view=individual    │
    │  • setActiveTab('individual')│
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  Individual Tab Opens        │
    │                              │
    │  ✅ Profile Picture Upload   │
    │  ✅ Bio & Status             │
    │  ✅ Personal Preferences     │
    │  ✅ Stats & Achievements     │
    │  ✅ Customization Options    │
    └──────────────────────────────┘
```

---

## 🎯 **URL PARAMETER REFERENCE**

### **Team & Collaboration Tabs:**

| URL | Tab Opened | Use Case |
|-----|------------|----------|
| `/team` | Teams | Default view |
| `/team?view=teams` | Teams | Explicit teams view |
| `/team?view=collaboration` | Collaboration | Team activity |
| `/team?view=individual` | Individual | Your profile ⭐ |

### **Other URL Parameters:**

| Page | Parameter | Example |
|------|-----------|---------|
| Calendar | `date` | `/calendar?date=2026-02-05` |
| Tasks | `filter` | `/tasks?filter=urgent` |
| Analytics | `view` | `/analytics?view=energy` |

---

## 🧭 **NAVIGATION COMPONENTS**

### **Primary Navigation:**

**Sidebar (Left):**
```
┌────────────────────┐
│  🏠 Dashboard      │
│  ✓ Tasks           │
│  📅 Calendar       │
│  🤖 AI Assistant   │
│  ⚡ Energy         │
│  🎵 Resonance      │
│  👥 Team           │ ← Leads to /team
│  📊 Analytics      │
│  🎮 Gamification   │
│  🔌 Integrations   │
│  📜 Scripts        │
│  🏢 Enterprise     │
│  ─────────────     │
│  ⚙️ Settings       │
└────────────────────┘
```

**Header (Top):**
```
┌────────────────────────────────────────────────────┐
│  🎵 SyncScript  [Search]  🔔  👤                   │
│                                    ↑               │
│                                    │               │
│                            Click for profile!      │
└────────────────────────────────────────────────────┘
```

---

## 🔍 **SEARCH & COMMANDS**

### **Universal Search:**

Type in search bar:
```
"tasks"          → Navigate to /tasks
"calendar"       → Navigate to /calendar
"my profile"     → Navigate to /team?view=individual
"team"           → Navigate to /team
"settings"       → Navigate to /settings
"create task"    → Open task creation modal
"help"           → Open help modal
```

### **AI Questions:**

Type questions starting with:
```
"how do I..."    → Navigate to AI Assistant
"what is..."     → Navigate to AI Assistant
"why should..."  → Navigate to AI Assistant
"help me..."     → Navigate to AI Assistant
```

---

## 📱 **MOBILE NAVIGATION**

### **Mobile Menu (Hamburger):**

```
☰  →  Opens sidebar
      ├─ Dashboard
      ├─ Tasks
      ├─ Calendar
      ├─ Team
      │  └─ Click → Opens /team (Teams tab)
      │     └─ Switch to Individual tab manually
      └─ More...
```

### **Mobile Profile:**

```
👤  →  Opens profile dropdown
       ├─ My Profile → /team?view=individual
       ├─ Billing
       ├─ Help
       └─ Sign Out
```

---

## 🎊 **QUICK REFERENCE CARD**

### **"I Want To..."**

| Action | Path |
|--------|------|
| View my profile | Avatar → My Profile |
| Edit my photo | Avatar → My Profile → Upload |
| Set my status | Avatar → My Profile → Status |
| See my teams | Sidebar → Team |
| Create a team | /team → Create Team |
| View team activity | /team?view=collaboration |
| Manage billing | Avatar → Billing & Plans |
| Get help | Avatar → Help & Support |
| Change settings | Sidebar → Settings |
| Log energy | Dashboard → Energy Meter |
| Create task | Dashboard → Quick Actions |
| View calendar | Sidebar → Calendar |
| Check analytics | Sidebar → Analytics |

---

## 🚀 **ONBOARDING NAVIGATION**

### **First-Time Users:**

```
Sign Up → Dashboard → Welcome Modal
                │
                ├─→ Quick Start
                │   └─→ Dashboard with hotspots
                │
                └─→ Set Up My Profile First
                    └─→ /onboarding
                        └─→ Dashboard
```

### **Onboarding Steps:**

```
/onboarding
  ├─ Step 1/4: Profile
  │  └─ Upload photo, name, timezone
  ├─ Step 2/4: Work Hours
  │  └─ Set schedule (9am-5pm default)
  ├─ Step 3/4: Energy Peaks
  │  └─ Set peak hours (10am, 2pm default)
  └─ Step 4/4: Integrations
     └─ Connect apps (optional)
```

---

## 🗺️ **SITEMAP**

```
syncscript.com
├── / (Landing)
├── /login
├── /signup
└── /dashboard (Authenticated Area)
    ├── /dashboard
    ├── /tasks
    ├── /calendar
    ├── /energy
    ├── /resonance-engine
    ├── /ai
    ├── /team ⭐
    │   ├── ?view=teams
    │   ├── ?view=collaboration
    │   └── ?view=individual ← YOUR PROFILE
    ├── /analytics
    ├── /gaming
    ├── /integrations
    ├── /scripts
    ├── /team-scripts
    ├── /enterprise
    ├── /settings
    └── /onboarding
```

---

## ✨ **SPECIAL FEATURES**

### **Smart Navigation:**

- **Fuzzy Search:** Type "taks" → Suggests "tasks"
- **Command Palette:** Type "create task" → Opens modal
- **Breadcrumbs:** Shows current location
- **Back Button:** Returns to previous page
- **Deep Linking:** Share URLs with state

### **Keyboard Shortcuts:**

```
Cmd/Ctrl + K       → Open search
Cmd/Ctrl + P       → Open profile (avatar dropdown)
Cmd/Ctrl + ,       → Open settings
Cmd/Ctrl + N       → Create new task
Esc                → Close modal/dropdown
```

---

## 🎯 **YOUR PROFILE SHORTCUTS**

### **Fastest Ways to Access Profile:**

**🥇 Method 1: Click Avatar**
```
Click 👤 (top-right) → "My Profile"
Speed: 2 clicks
```

**🥈 Method 2: Search Bar**
```
Type "my profile" → Press Enter
Speed: ~2 seconds
```

**🥉 Method 3: Direct URL**
```
Type: /team?view=individual
Speed: ~5 seconds
```

**🏅 Method 4: Bookmark**
```
Bookmark /team?view=individual
Speed: 1 click
```

---

## 🎵 **"NAVIGATION TUNED LIKE SOUND!"** 🎵

**Every route is:**
- ✅ Intuitive
- ✅ Fast
- ✅ Accessible
- ✅ Documented
- ✅ User-friendly

---

**Complete Navigation Map**  
**Built February 5, 2026**  
**SyncScript Team** ✨
