// Environment variable utilities for frontend

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  PORT: parseInt(import.meta.env.VITE_PORT) || 5173,
};

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Project Management System',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
  DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
};

// Feature Flags
export const FEATURE_FLAGS = {
  REAL_TIME_UPDATES: import.meta.env.VITE_ENABLE_REAL_TIME_UPDATES === 'true',
  NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  FILE_UPLOADS: import.meta.env.VITE_ENABLE_FILE_UPLOADS === 'true',
};

// Environment validation
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_API_BASE_URL',
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
    console.warn('Using default values. Check your .env file.');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Log environment configuration (only in development)
if (import.meta.env.DEV) {
  console.log('🌍 Environment Configuration:', {
    API: API_CONFIG,
    APP: APP_CONFIG,
    FEATURES: FEATURE_FLAGS,
  });
} 