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
- SQLite database (for development) or PostgreSQL (for production)
- OpenAI API key
- Gmail account for email service

### Installation

1. **Clone and setup:**
   ```bash
   git clone https://github.com/stringerc/syncscriptE.git
   cd syncscriptE
   ```

2. **Install dependencies:**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/env.example client/.env
   
   # Edit server/.env with your API keys and email configuration
   # See EMAIL_SETUP.md for Gmail configuration
   ```

4. **Set up database:**
   ```bash
   cd server
   npx prisma db push
   ```

5. **Start development:**
   ```bash
   # Terminal 1 - Start server
   cd server
   npm run dev
   
   # Terminal 2 - Start client
   cd client
   npm run dev
   ```

6. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🏗️ Architecture

```
syncscript/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Node.js backend (Express + TypeScript)
├── shared/          # Shared types and utilities
├── EMAIL_SETUP.md   # Email service configuration guide
└── docs/            # Documentation
```

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod) with Prisma ORM
- **AI**: OpenAI GPT-4 for conversation extraction and task management
- **Email**: Nodemailer with Gmail SMTP
- **Authentication**: JWT with bcrypt password hashing
- **UI Components**: Radix UI primitives
- **State Management**: Zustand (client), TanStack Query

## ✨ Current Features

### ✅ Authentication System
- User registration and login
- Email verification
- Password reset via email
- JWT-based session management
- Password strength validation
- Account deletion

### ✅ AI Assistant
- ChatGPT-style conversation interface
- Task extraction from conversations
- Calendar event creation via AI
- Speech-to-text and text-to-speech
- Copy, audio, and feedback buttons
- Chat history persistence

### ✅ Task Management
- Create, complete, and delete tasks
- Priority levels and energy requirements
- Task categorization with tags
- Dashboard integration

### ✅ Calendar Integration
- Create and manage events
- AI-powered event scheduling
- Event deletion and management
- Dashboard calendar view
- **Google Calendar API integration**
- **Bidirectional calendar synchronization**
- **OAuth2 authentication flow**
- **Calendar conflict detection**

### ✅ Email Service
- Professional HTML email templates
- Password reset emails
- Email verification
- Gmail SMTP integration

## 📋 Development Roadmap

- [x] Project setup and architecture
- [x] Authentication system
- [x] Email service implementation
- [x] AI conversation extraction
- [x] Task management
- [x] Calendar event creation
- [x] User-friendly error handling
- [x] Calendar integration (Google Calendar API)
- [ ] Financial integration (Plaid)
- [ ] Prioritization agent
- [ ] Energy adaptive agent
- [ ] Budget-aware planning
- [ ] Notification system
- [ ] Gamification features
- [ ] Location and weather integration

## 🎮 Demo Features

### AI Assistant Capabilities
- **Task Prioritization**: "Help me prioritize my tasks"
- **Event Scheduling**: "Schedule an interview for tomorrow at 2pm"
- **Productivity Tips**: "How can I improve my productivity?"
- **Smart Planning**: "What should I focus on first?"

### User Experience
- **Clean Error Messages**: User-friendly validation and error handling
- **Professional Emails**: Beautiful HTML email templates
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Instant feedback and notifications

## 📧 Email Setup

SyncScript uses Gmail SMTP for sending emails. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed configuration instructions.

Quick setup:
1. Enable 2-Factor Authentication on Gmail
2. Generate an App Password
3. Add credentials to `server/.env`:
   ```env
   EMAIL_USER="your-email@gmail.com"
   EMAIL_APP_PASSWORD="your-app-password"
   ```

## 🔒 Security Features

- **Password Security**: Minimum 8 characters with complexity requirements
- **JWT Tokens**: Secure session management with expiration
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based reset flow
- **Input Validation**: Comprehensive data validation with Zod
- **Error Handling**: No sensitive information leakage

## 🚀 Deployment

### Development
```bash
npm run dev  # Runs both client and server concurrently
```

### Production
- **Frontend**: Deploy to Vercel, Netlify, or similar
- **Backend**: Deploy to Railway, Heroku, or similar
- **Database**: Use PostgreSQL for production
- **Email**: Configure production email service (SendGrid, Mailgun, etc.)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation**: Check the docs/ folder
- **Email Setup**: See EMAIL_SETUP.md
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for productivity enthusiasts who want AI to actually help them get things done.**