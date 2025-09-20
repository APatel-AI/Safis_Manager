// Error handling utilities following 12-factor methodology
// Factor IX: Disposability - Maximize robustness with fast startup and graceful shutdown

import { appLogger } from './logger.js';
import { CONFIG } from '../config/constants.js';

/**
 * Centralized error handling for the extension
 */
export class ErrorHandler {
  static instance = null;
  
  constructor() {
    this.retryAttempts = new Map();
    this.errorCallbacks = new Map();
  }

  static getInstance() {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle errors with proper logging and recovery
   */
  handleError(error, context = 'Unknown', options = {}) {
    const {
      showToUser = false,
      allowRetry = false,
      retryKey = null,
      fallbackValue = null,
      severity = 'ERROR'
    } = options;

    // Log the error with context
    appLogger.error(`Error in ${context}`, error, {
      context,
      options,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Handle retry logic
    if (allowRetry && retryKey) {
      const attempts = this.retryAttempts.get(retryKey) || 0;
      if (attempts < CONFIG.MAX_RETRY_ATTEMPTS) {
        this.retryAttempts.set(retryKey, attempts + 1);
        appLogger.info(`Retry attempt ${attempts + 1}/${CONFIG.MAX_RETRY_ATTEMPTS} for ${retryKey}`);
        return { shouldRetry: true, fallbackValue };
      } else {
        appLogger.error(`Max retry attempts exceeded for ${retryKey}`);
        this.retryAttempts.delete(retryKey);
      }
    }

    // Show user-friendly error if requested
    if (showToUser) {
      this.showUserError(error, context);
    }

    // Execute registered error callbacks
    const callbacks = this.errorCallbacks.get(context) || [];
    callbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (callbackError) {
        appLogger.error('Error in error callback', callbackError);
      }
    });

    return { shouldRetry: false, fallbackValue };
  }

  /**
   * Show user-friendly error notification
   */
  showUserError(error, context) {
    const userMessage = this.getUserFriendlyMessage(error, context);
    
    // Try to show notification via Chrome API
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/glasses_emoji.png',
        title: 'Safis Error',
        message: userMessage
      });
    } else {
      // Fallback to alert or custom modal
      console.error('User Error:', userMessage);
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  getUserFriendlyMessage(error, context) {
    const errorMessage = error?.message || error || 'Unknown error';
    
    // Map common errors to user-friendly messages
    const errorMappings = {
      'Chrome runtime API not available': 'Extension is not properly loaded. Please reload the page.',
      'No response from background script': 'Extension background service is not responding. Please reload the extension.',
      'Cannot inject on this URL': 'Cannot open Safis on this page. Try opening it on a regular website.',
      'Failed to load bookmarks': 'Could not load your bookmarks. Please try again.',
      'Network error': 'Network connection issue. Please check your internet connection.',
      'Permission denied': 'Extension does not have permission to access this resource.'
    };

    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (errorMessage.includes(pattern)) {
        return message;
      }
    }

    // Context-specific fallbacks
    switch (context) {
      case 'bookmark_load':
        return 'Could not load bookmarks. Please try refreshing the page.';
      case 'bookmark_save':
        return 'Could not save bookmark. Please try again.';
      case 'bookmark_delete':
        return 'Could not delete bookmark. Please try again.';
      case 'modal_creation':
        return 'Could not open Safis interface. Please reload the page.';
      case 'search':
        return 'Search is temporarily unavailable. Please try again.';
      default:
        return 'Something went wrong. Please try again or reload the page.';
    }
  }

  /**
   * Register error callback for specific context
   */
  registerErrorCallback(context, callback) {
    if (!this.errorCallbacks.has(context)) {
      this.errorCallbacks.set(context, []);
    }
    this.errorCallbacks.get(context).push(callback);
  }

  /**
   * Clear retry attempts for a specific key
   */
  clearRetryAttempts(retryKey) {
    this.retryAttempts.delete(retryKey);
  }

  /**
   * Async wrapper with automatic error handling
   */
  async withErrorHandling(asyncFn, context, options = {}) {
    try {
      const result = await asyncFn();
      // Clear retry attempts on success
      if (options.retryKey) {
        this.clearRetryAttempts(options.retryKey);
      }
      return result;
    } catch (error) {
      const result = this.handleError(error, context, options);
      
      if (result.shouldRetry) {
        // Wait before retry
        await this.delay(CONFIG.RETRY_DELAY);
        return this.withErrorHandling(asyncFn, context, options);
      }
      
      // Return fallback value or re-throw
      if (result.fallbackValue !== null) {
        return result.fallbackValue;
      }
      
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance and convenience functions
export const errorHandler = ErrorHandler.getInstance();

/**
 * Convenience function for handling async operations with error recovery
 */
export async function withErrorHandling(asyncFn, context, options = {}) {
  return errorHandler.withErrorHandling(asyncFn, context, options);
}

/**
 * Convenience function for safe async operations that return fallback values
 */
export async function safeAsync(asyncFn, fallbackValue = null, context = 'Unknown') {
  try {
    return await asyncFn();
  } catch (error) {
    errorHandler.handleError(error, context, { 
      fallbackValue,
      severity: 'WARN' 
    });
    return fallbackValue;
  }
}

/**
 * Convenience function for handling Chrome API calls
 */
export function safeChromeAPI(apiCall, fallbackValue = null, context = 'Chrome API') {
  return new Promise((resolve) => {
    try {
      apiCall((result) => {
        if (chrome.runtime.lastError) {
          errorHandler.handleError(
            new Error(chrome.runtime.lastError.message), 
            context,
            { fallbackValue }
          );
          resolve(fallbackValue);
        } else {
          resolve(result);
        }
      });
    } catch (error) {
      errorHandler.handleError(error, context, { fallbackValue });
      resolve(fallbackValue);
    }
  });
}