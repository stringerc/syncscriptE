# SyncScript

**The AI-driven operating system for your life**

SyncScript is an intelligent planner that merges your calendar, tasks, finances, and lifestyle logistics into one seamless, AI-driven system. It's like if Google Calendar, Notion, and Mint had a child — but rebuilt with agents that actually help you make better decisions in real time.

## 🎯 What SyncScript Does

At its heart, SyncScript answers the question: **"What should I be doing right now, given my commitments, my energy, my budget, and my goals?"**

### Core Features

- **🤖 Multi-Agent AI System**: Conversation extraction, prioritization, energy adaptation, and calendar orchestration
- **📅 Calendar Integration**: Syncs with Google Calendar, Outlook, and Apple Calendar
- **💰 Financial Awareness**: Integrates with Plaid for budget-aware planning
- **📍 Location Intelligence**: Weather and route optimization via location APIs
- **🎮 Gamification**: Streaks, rewards, and progress tracking
- **💬 Conversation-First**: Extracts tasks from ChatGPT conversations and in-app chat

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd syncscript
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/env.example client/.env
   
   # Edit server/.env with your API keys and database URL
   # Edit client/.env if needed
   ```

3. **Set up database:**
   ```bash
   # Install PostgreSQL and create a database
   # Update DATABASE_URL in server/.env
   cd server
   npx prisma db push
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🏗️ Architecture

```
syncscript/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared types and utilities
└── docs/            # Documentation
```

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Integrations**: Plaid, Google Calendar API, Weather APIs
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (frontend), Railway (backend)

## 📋 Development Roadmap

- [x] Project setup and architecture
- [x] Authentication system
- [ ] Calendar integration
- [ ] Financial integration
- [ ] AI conversation extraction
- [ ] Prioritization agent
- [ ] Energy adaptive agent
- [ ] Calendar orchestration
- [ ] Budget-aware planning
- [ ] Notification system
- [ ] Gamification features
- [ ] Location and weather integration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
