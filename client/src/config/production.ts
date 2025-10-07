// Production configuration to reduce console noise
export const PRODUCTION_CONFIG = {
  // Disable debug logging in production
  DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  
  // API timeout settings
  API_TIMEOUT: process.env.NODE_ENV === 'development' ? 15000 : 10000,
  
  // Performance monitoring settings
  PERFORMANCE_MONITORING: {
    ENABLED: true,
    MEMORY_CHECK_INTERVAL: process.env.NODE_ENV === 'development' ? 300000 : 600000, // 5 min dev, 10 min prod
    MEMORY_WARNING_THRESHOLD: 200 * 1024 * 1024, // 200MB
  },
  
  // Analytics settings
  ANALYTICS: {
    ENABLED: true,
    DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  },
  
  // Button testing
  BUTTON_TESTING: {
    ENABLED: process.env.NODE_ENV === 'development',
  }
};

// Helper function to log only in development
export const debugLog = (message: string, ...args: any[]) => {
  if (PRODUCTION_CONFIG.DEBUG_LOGGING) {
    console.log(message, ...args);
  }
};

// Helper function to warn only in development
export const debugWarn = (message: string, ...args: any[]) => {
  if (PRODUCTION_CONFIG.DEBUG_LOGGING) {
    console.warn(message, ...args);
  }
};
