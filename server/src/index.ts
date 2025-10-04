import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import taskRoutes from './routes/tasks';
import calendarRoutes from './routes/calendar';
import googleCalendarRoutes from './routes/googleCalendar';
// import outlookCalendarRoutes from './routes/outlookCalendar';
// import exchangeCalendarRoutes from './routes/exchangeCalendar';
// import iCloudCalendarRoutes from './routes/iCloudCalendar';
// import multiCalendarRoutes from './routes/multiCalendar';
import budgetRoutes from './routes/budget';
import exportRoutes from './routes/export';
// import financialRoutes from './routes/financial';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';
import locationRoutes from './routes/location';
// import searchRoutes from './routes/search';
import gamificationRoutes from './routes/gamification';
import taskSchedulingRoutes from './routes/taskScheduling';
import feedbackRoutes from './routes/feedback';
// import energyEngineRoutes from './routes/energyEngine';
import enhancedAchievementsRoutes from './routes/enhancedAchievements';
// import resourcesRoutes from './routes/resources';
import featureFlagsRoutes from './routes/featureFlags';
// import analyticsRoutes from './routes/analytics';
// import privacyRoutes from './routes/privacy';
// import suggestionsRoutes from './routes/suggestions';
// import schedulingRoutes from './routes/scheduling';
// import pinnedEventsRoutes from './routes/pinnedEvents';
import scriptsRoutes from './routes/scripts';
import templateRoutes from './routes/templates';
// import priorityRoutes from './routes/priority';
// import friendsRoutes from './routes/friends';
// import templateGalleryRoutes from './routes/templateGallery';
import projectsRoutes from './routes/projects';
import projectResourcesRoutes from './routes/projectResources';
// import aiSuggestionsRoutes from './routes/aiSuggestions';
// import budgetingRoutes from './routes/budgeting';
// import briefRoutes from './routes/brief';
import calendarAuthRoutes from './routes/calendarAuth';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { idempotencyMiddleware } from './middleware/idempotency';
import { generalAPIRateLimit } from './middleware/rateLimitMiddleware';
import { logger } from './utils/logger';

// Import jobs
import { startBudgetMonitoring } from './jobs/budgetMonitoringJob';
import { startEventDispatcher, stopEventDispatcher } from './workers/eventDispatcher';
import { startDailyEnergyResetCron, stopDailyEnergyResetCron } from './jobs/dailyEnergyResetCron';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://stringerc.github.io",
      "https://stringerc.github.io/syncscriptE",
      "http://localhost:3000",
      "https://syncscript-e-qlwn.vercel.app",
      "https://syncscript-e-qlwn-o4qi2mzmc-christopher-stringers-projects.vercel.app",
      /^https:\/\/.*\.vercel\.app$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3002', 10);

// Log the port being used
logger.info(`🔧 Using port: ${PORT}`);
logger.info(`🔧 Environment variables:`, {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
});

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://syncscripte.onrender.com"],
    },
  },
}));

// CORS configuration for multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://stringerc.github.io",
  "https://stringerc.github.io/syncscriptE",
  "http://localhost:3000",
  "https://syncscript-local.loca.lt", // LocalTunnel
  "https://syncscript-e-qlwn.vercel.app", // Vercel production
  "https://syncscript-e-qlwn-o4qi2mzmc-christopher-stringers-projects.vercel.app", // Vercel preview
  /^https:\/\/.*\.vercel\.app$/ // All Vercel domains
];

// Allow all Cloudflare tunnel domains
const isCloudflareTunnel = (origin: string) => {
  return origin.includes('.trycloudflare.com');
};

// CORS configuration - temporarily allow all origins for debugging
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Rate limiting - Temporarily disabled for development
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50000'), // Increased to 50000 for development
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Apply global middleware
app.use(generalAPIRateLimit); // Rate limiting
app.use(idempotencyMiddleware); // Idempotency for write operations

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SyncScript API Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      tasks: '/api/tasks',
      calendar: '/api/calendar',
      ai: '/api/ai',
      googleCalendar: '/api/google-calendar',
      search: '/api/search',
      notifications: '/api/notifications',
      location: '/api/location',
      gamification: '/api/gamification',
      taskScheduling: '/api/task-scheduling',
      feedback: '/api/feedback',
      energyEngine: '/api/energy-engine',
      achievements: '/api/achievements'
    },
    documentation: 'https://github.com/stringerc/syncscriptE'
  });
});

// Simple health check endpoint (no database dependency)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Detailed health check endpoint (includes database check)
app.get('/health/detailed', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'syncscript-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static files from client build
app.use(express.static('client/dist'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
// app.use('/api/outlook-calendar', outlookCalendarRoutes);
// app.use('/api/exchange-calendar', exchangeCalendarRoutes);
// app.use('/api/icloud-calendar', iCloudCalendarRoutes);
// app.use('/api/multi-calendar', multiCalendarRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/export', exportRoutes);
// app.use('/api/financial', financialRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/location', locationRoutes);
// app.use('/api/search', searchRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/task-scheduling', taskSchedulingRoutes);
app.use('/api/feedback', feedbackRoutes);
// app.use('/api/energy-engine', energyEngineRoutes);
app.use('/api/achievements', enhancedAchievementsRoutes);
// app.use('/api/resources', resourcesRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/privacy', privacyRoutes);
// app.use('/api/suggestions', suggestionsRoutes);
// app.use('/api/scheduling', schedulingRoutes);
// app.use('/api/pinned', pinnedEventsRoutes);
app.use('/api/scripts', scriptsRoutes);
// app.use('/api/priority', priorityRoutes);
// app.use('/api/friends', friendsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects', projectResourcesRoutes);
// app.use('/api/ai-suggestions', aiSuggestionsRoutes);
// app.use('/api/budgeting', budgetingRoutes);
// app.use('/api/brief', briefRoutes);
app.use('/api/calendar-auth', calendarAuthRoutes);

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'client/dist' });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });
  
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info('User joined room', { userId, socketId: socket.id });
  });
  
  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id });
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop background workers
  if ((global as any).eventDispatcherInterval) {
    stopEventDispatcher((global as any).eventDispatcherInterval);
  }
  if ((global as any).energyResetInterval) {
    stopDailyEnergyResetCron((global as any).energyResetInterval);
  }
  
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Stop background workers
  if ((global as any).eventDispatcherInterval) {
    stopEventDispatcher((global as any).eventDispatcherInterval);
  }
  if ((global as any).energyResetInterval) {
    stopDailyEnergyResetCron((global as any).energyResetInterval);
  }
  
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 SyncScript server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.info(`✅ Server ready for health checks at /health`);
  logger.info(`🌐 Server listening on 0.0.0.0:${PORT}`);
  logger.info(`🔧 Railway PORT environment: ${process.env.PORT}`);
  logger.info(`🔧 Actual listening port: ${PORT}`);
  
  // Give the server a moment to fully initialize
  setTimeout(() => {
    logger.info(`🎯 Server fully initialized and ready to serve requests`);
    
    // Start background jobs
    startBudgetMonitoring();
    logger.info(`📊 Budget monitoring started`);
    
    // Start event dispatcher
    const eventDispatcherInterval = startEventDispatcher(5000); // Every 5 seconds
    logger.info(`📡 Event dispatcher started`);
    
    // Start daily energy reset cron
    const energyResetInterval = startDailyEnergyResetCron();
    logger.info(`⚡ Daily energy reset cron started`);
    
    // Store interval IDs for graceful shutdown
    (global as any).eventDispatcherInterval = eventDispatcherInterval;
    (global as any).energyResetInterval = energyResetInterval;
  }, 2000);
});

// Handle server errors
server.on('error', (error: any) => {
  logger.error('Server error:', error);
  process.exit(1);
});

export { app, server, io, prisma };
