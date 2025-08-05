// Configuration utilities for backend

// Server Configuration
const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT) || 3000,
  BASE_URL: process.env.BASE_URL || `http://localhost:${parseInt(process.env.PORT) || 3000}`,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Database Configuration
const DATABASE_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT) || 5433,
  NAME: process.env.DB_NAME || 'project_management',
  USER: process.env.DB_USER || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'root',
  URL: process.env.DATABASE_URL,
};

// JWT Configuration
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

// CORS Configuration
const CORS_CONFIG = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CREDENTIALS: true,
};

// Rate Limiting Configuration
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (SERVER_CONFIG.NODE_ENV === 'development' ? 1000 : 100),
  MAX_AUTH_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS) || (SERVER_CONFIG.NODE_ENV === 'development' ? 1000 : 10),
};

// Email Configuration
const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@projectmanagement.com',
  ETHEREAL_USER: process.env.ETHEREAL_USER || 'test@ethereal.email',
  ETHEREAL_PASS: process.env.ETHEREAL_PASS || 'test123',
};

// File Upload Configuration
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
};

// Security Configuration
const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
};

// Logging Configuration
const LOGGING_CONFIG = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Environment validation
const validateEnvironment = () => {
  const requiredVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingVars);
    console.warn('Using default values. Check your .env file.');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Log configuration (only in development)
if (SERVER_CONFIG.NODE_ENV === 'development') {
  console.log('🌍 Environment Configuration:', {
    SERVER: SERVER_CONFIG,
    DATABASE: { ...DATABASE_CONFIG, PASSWORD: '***' },
    JWT: { ...JWT_CONFIG, SECRET: '***' },
    CORS: CORS_CONFIG,
    RATE_LIMIT: RATE_LIMIT_CONFIG,
    EMAIL: { ...EMAIL_CONFIG, SMTP_PASS: '***', ETHEREAL_PASS: '***' },
    UPLOAD: UPLOAD_CONFIG,
    SECURITY: SECURITY_CONFIG,
    LOGGING: LOGGING_CONFIG,
  });
}

module.exports = {
  SERVER_CONFIG,
  DATABASE_CONFIG,
  JWT_CONFIG,
  CORS_CONFIG,
  RATE_LIMIT_CONFIG,
  EMAIL_CONFIG,
  UPLOAD_CONFIG,
  SECURITY_CONFIG,
  LOGGING_CONFIG,
  validateEnvironment,
}; 