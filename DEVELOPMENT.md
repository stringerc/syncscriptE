# SyncScript Development Guide

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Set up your environment:**
   - Copy `server/env.example` to `server/.env`
   - Copy `client/env.example` to `client/.env`
   - Update the environment variables with your API keys

3. **Set up the database:**
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

## 🏗️ Architecture Overview

### Backend (Node.js + Express + TypeScript)
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based authentication
- **AI Integration:** OpenAI GPT-4 for conversation extraction and task generation
- **Real-time:** Socket.IO for live updates
- **API Design:** RESTful APIs with comprehensive error handling

### Frontend (React + TypeScript + Vite)
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and building
- **Styling:** Tailwind CSS with custom design system
- **State Management:** Zustand for client state
- **Data Fetching:** TanStack Query for server state
- **UI Components:** Radix UI primitives with custom styling
- **Routing:** React Router v6

### Shared Types
- TypeScript types shared between frontend and backend
- Ensures type safety across the entire application

## 📁 Project Structure

```
syncscript/
├── server/                 # Backend application
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── stores/       # Zustand stores
│   │   ├── lib/          # Utility functions
│   │   └── main.tsx      # App entry point
│   └── package.json
├── shared/               # Shared types and utilities
│   └── types.ts
└── package.json          # Root package.json
```

## 🔧 Development Commands

### Root Level
```bash
npm run dev          # Start both server and client
npm run build        # Build client for production
npm run start        # Start production server
npm run test         # Run all tests
npm run install:all  # Install all dependencies
```

### Server
```bash
cd server
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

### Client
```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
```

## 🗄️ Database Schema

The database uses Prisma ORM with PostgreSQL. Key models include:

- **User:** User accounts and profiles
- **Task:** Tasks with AI-generated metadata
- **Event:** Calendar events with budget awareness
- **Notification:** System notifications and alerts
- **Achievement:** Gamification achievements
- **Streak:** Progress tracking streaks
- **EnergyLevel:** Daily energy level tracking
- **CalendarIntegration:** External calendar connections
- **FinancialAccount:** Bank account connections

## 🤖 AI Features

### Conversation Extraction
- Extracts tasks and events from ChatGPT conversations
- Uses OpenAI GPT-4 for intelligent parsing
- Automatically creates tasks with proper metadata

### Task Prioritization
- Implements Eisenhower Matrix (Urgent/Important)
- Considers user energy levels and budget constraints
- AI-powered priority assignment with reasoning

### Energy Adaptation
- Tracks daily energy levels (1-10 scale)
- Adapts task scheduling based on energy
- Suggests optimal times for different task types

## 🔌 API Integrations

### Planned Integrations
- **Google Calendar API:** Calendar synchronization
- **Plaid API:** Financial account connections
- **OpenWeather API:** Weather-based scheduling
- **Location APIs:** Location-aware recommendations

### Current Integrations
- **OpenAI API:** AI conversation processing
- **Socket.IO:** Real-time updates

## 🎨 UI/UX Design

### Design System
- **Colors:** Semantic color system with dark mode support
- **Typography:** Consistent font scales and weights
- **Spacing:** 8px grid system
- **Components:** Reusable component library
- **Animations:** Smooth transitions and micro-interactions

### Key Features
- **Responsive Design:** Mobile-first approach
- **Dark Mode:** System preference detection
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** Optimized loading and rendering

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests:** Jest for individual functions
- **Integration Tests:** API endpoint testing
- **Database Tests:** Prisma integration testing

### Frontend Testing
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright for user flows
- **Visual Tests:** Storybook for component documentation

## 🚀 Deployment

### Development
- **Local:** `npm run dev` starts both servers
- **Database:** PostgreSQL with Prisma migrations
- **Environment:** `.env` files for configuration

### Production
- **Frontend:** Vercel or Netlify
- **Backend:** Railway or Heroku
- **Database:** PostgreSQL (managed service)
- **CDN:** For static assets

## 🔐 Security

### Authentication
- **JWT Tokens:** Secure token-based authentication
- **Password Hashing:** bcrypt with salt rounds
- **Rate Limiting:** API request throttling
- **CORS:** Configured for production domains

### Data Protection
- **Input Validation:** Zod schemas for all inputs
- **SQL Injection:** Prisma ORM protection
- **XSS Prevention:** React's built-in protection
- **HTTPS:** Required for production

## 📊 Monitoring & Analytics

### Logging
- **Winston:** Structured logging
- **Error Tracking:** Comprehensive error handling
- **Performance:** Request timing and metrics

### Analytics
- **User Behavior:** Task completion patterns
- **AI Performance:** Conversation extraction accuracy
- **System Health:** API response times and errors

## 🤝 Contributing

### Code Style
- **TypeScript:** Strict mode enabled
- **ESLint:** Airbnb configuration
- **Prettier:** Consistent code formatting
- **Conventional Commits:** Standardized commit messages

### Git Workflow
- **Feature Branches:** `feature/description`
- **Pull Requests:** Required for all changes
- **Code Review:** Peer review process
- **CI/CD:** Automated testing and deployment

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Socket.IO](https://socket.io/docs)

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL in server/.env
   - Ensure PostgreSQL is running
   - Run `npx prisma db push`

2. **API Key Issues**
   - Verify OpenAI API key in server/.env
   - Check API key permissions and billing

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version (18+ required)
   - Verify TypeScript configuration

4. **Port Conflicts**
   - Server runs on port 3001
   - Client runs on port 3000
   - Update ports in environment files if needed

For more help, check the issues section or create a new issue with detailed information about your problem.
