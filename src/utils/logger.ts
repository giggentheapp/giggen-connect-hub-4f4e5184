/**
 * Centralized logging utility for the application
 * Logs are only shown in development mode to prevent production console spam
 */

export const logger = {
  /**
   * General information logs - shown in development only
   */
  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`ℹ️ ${message}`, data ? data : '');
    }
  },

  /**
   * Error logs - always important, shown in development
   * In production, these could be sent to error tracking service
   */
  error: (message: string, error?: unknown) => {
    if (import.meta.env.DEV) {
      console.error(`❌ ${message}`, error ? error : '');
    }
    // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  },

  /**
   * Warning logs - potential issues that should be monitored
   */
  warn: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ ${message}`, data ? data : '');
    }
  },

  /**
   * Debug logs - detailed information for debugging
   */
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(`🐛 ${message}`, data ? data : '');
    }
  },

  /**
   * Business events - important application events
   */
  business: (event: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`🎯 ${event}`, data ? data : '');
    }
    // TODO: In production, send to analytics service
  }
};

/**
 * Development-only logger for temporary debugging
 * These should be removed before production
 */
export const devLog = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    console.log(`🔧 DEV: ${message}`, data ? data : '');
  }
};