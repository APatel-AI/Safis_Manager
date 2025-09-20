// Structured logging system following 12-factor methodology
// Factor XI: Logs - Treat logs as event streams

import { CONFIG } from '../config/constants.js';

// Log levels in order of severity
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

export class Logger {
  constructor(context = 'APP') {
    this.context = context;
    this.logLevel = LOG_LEVELS[CONFIG.LOG_LEVEL] || LOG_LEVELS.INFO;
  }

  /**
   * Check if a log level should be output
   */
  shouldLog(level) {
    return LOG_LEVELS[level] >= this.logLevel;
  }

  /**
   * Format log message with context and timestamp
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    
    if (Object.keys(data).length > 0) {
      return `${prefix} ${message}`;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Generic logging method
   */
  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);
    const consoleMethod = this.getConsoleMethod(level);
    
    if (Object.keys(data).length > 0) {
      consoleMethod(formattedMessage, data);
    } else {
      consoleMethod(formattedMessage);
    }

    // In production, could send to external logging service
    if (CONFIG.isProduction && level === 'ERROR') {
      this.sendToExternalService(level, message, data);
    }
  }

  /**
   * Get appropriate console method for log level
   */
  getConsoleMethod(level) {
    switch (level) {
      case 'DEBUG':
        return console.debug;
      case 'INFO':
        return console.info;
      case 'WARN':
        return console.warn;
      case 'ERROR':
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Send logs to external service (placeholder for production)
   */
  sendToExternalService(level, message, data) {
    // In a real implementation, this would send to external logging service
    // For now, we'll just ensure the error is captured
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Could send to background script for centralized logging
    }
  }

  // Convenience methods
  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, error = null, data = {}) {
    const errorData = { ...data };
    
    if (error instanceof Error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (error) {
      errorData.error = error;
    }
    
    this.log('ERROR', message, errorData);
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, data = {}) {
    this.info(`Performance: ${operation} took ${duration}ms`, data);
  }

  /**
   * Log user interactions
   */
  userAction(action, data = {}) {
    this.info(`User Action: ${action}`, data);
  }

  /**
   * Log API calls
   */
  apiCall(method, endpoint, duration = null, data = {}) {
    const message = duration 
      ? `API: ${method} ${endpoint} (${duration}ms)`
      : `API: ${method} ${endpoint}`;
    this.info(message, data);
  }
}

// Create default logger instances for different contexts
export const appLogger = new Logger('APP');
export const apiLogger = new Logger('API');
export const uiLogger = new Logger('UI');
export const backgroundLogger = new Logger('BACKGROUND');

// Export convenience function for quick logging
export function createLogger(context) {
  return new Logger(context);
}