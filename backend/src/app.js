const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import configuration
const {
  SERVER_CONFIG,
  CORS_CONFIG,
  RATE_LIMIT_CONFIG,
  UPLOAD_CONFIG,
  validateEnvironment
} = require('./utils/config');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const milestoneRoutes = require('./routes/milestones');
const teamRoutes = require('./routes/team');
const commentRoutes = require('./routes/comments');
const timeRoutes = require('./routes/time');
const timeLogsRoutes = require('./routes/time-logs');
const notificationRoutes = require('./routes/notifications');
const invitationRoutes = require('./routes/invitations');

// Import middleware
const logger = require('./utils/logger');

// Validate environment variables
validateEnvironment();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_CONFIG.FRONTEND_URL,
  credentials: CORS_CONFIG.CREDENTIALS
}));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_AUTH_REQUESTS,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Only apply rate limiting in production
if (SERVER_CONFIG.NODE_ENV === 'production') {
  app.use('/api/', limiter);
  app.use('/api/auth', authLimiter);
}

// Body parsing middleware
app.use(express.json({ limit: UPLOAD_CONFIG.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: UPLOAD_CONFIG.MAX_FILE_SIZE }));

// Compression middleware
app.use(compression());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', UPLOAD_CONFIG.UPLOAD_PATH)));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Development endpoints (only in development)
if (SERVER_CONFIG.NODE_ENV === 'development') {
  app.post('/api/dev/reset-limits', (req, res) => {
    // Reset rate limit counters
    limiter.resetKey(req.ip);
    authLimiter.resetKey(req.ip);
    res.status(200).json({
      success: true,
      message: 'Rate limits reset for development'
    });
  });

  app.get('/api/dev/rate-limit-status', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Rate limiting is DISABLED in development mode',
      environment: SERVER_CONFIG.NODE_ENV,
      rateLimitingActive: false
    });
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/comments', commentRoutes);
// app.use('/api/time', timeRoutes); // Temporarily disabled to fix route conflicts
app.use('/api/time-logs', timeLogsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: SERVER_CONFIG.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// WebSocket setup (if needed)
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: CORS_CONFIG.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: CORS_CONFIG.CREDENTIALS
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    logger.info(`User joined project: ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    logger.info(`User left project: ${projectId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = SERVER_CONFIG.PORT || 3000;
const BASE_URL = SERVER_CONFIG.BASE_URL || `http://localhost:${PORT}`;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Base URL: ${BASE_URL}`);
  logger.info(`Environment: ${SERVER_CONFIG.NODE_ENV || 'development'}`);
  logger.info(`Frontend URL: ${CORS_CONFIG.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app; 