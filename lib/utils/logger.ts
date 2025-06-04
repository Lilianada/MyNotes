/**
 * Logger utility for NoteIt-down
 * Provides consistent logging with environment-based filtering
 */

// Set to false to disable debug logs in development
const DEBUG_MODE = process.env.NODE_ENV === 'development' && false;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger utility that only logs in development mode
 * and can be globally disabled for specific log levels
 */
export const logger = {
  /**
   * Debug logs - only shown in development with DEBUG_MODE enabled
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' && DEBUG_MODE) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Info logs - only shown in development
   */
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' && DEBUG_MODE) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Warning logs - shown in development, suppressed in production
   */
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Error logs - always shown
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};

/**
 * Safely log errors from Monaco editor
 * Filters out known non-critical errors
 */
export const logEditorError = (error: any) => {
  // Skip logging for known non-critical errors
  const errorStr = String(error);
  
  if (
    errorStr.includes('Canceled:') ||
    errorStr.includes('V is not iterable') ||
    errorStr.includes('Cannot read properties of null')
  ) {
    return; // Suppress these common Monaco errors
  }
  
  logger.error('Editor error:', error);
};
