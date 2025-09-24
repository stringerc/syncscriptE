import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import financialRoutes from './routes/financial';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Log the port being used
logger.info(`🔧 Using port: ${PORT}`);
logger.info(`🔧 Environment variables:`, {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

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
      googleCalendar: '/api/google-calendar'
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

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
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
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
  
  // Give the server a moment to fully initialize
  setTimeout(() => {
    logger.info(`🎯 Server fully initialized and ready to serve requests`);
  }, 2000);
});

// Handle server errors
server.on('error', (error: any) => {
  logger.error('Server error:', error);
  process.exit(1);
});

export { app, server, io, prisma };
