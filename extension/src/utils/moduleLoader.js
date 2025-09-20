// Module loader for Chrome extension compatibility
// Handles dynamic imports in extension context

/**
 * Safely import modules in extension context
 */
export async function importModule(modulePath) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // In extension context, use chrome.runtime.getURL
      const moduleUrl = chrome.runtime.getURL(modulePath);
      return await import(moduleUrl);
    } else {
      // In regular web context
      return await import(modulePath);
    }
  } catch (error) {
    console.error(`Failed to import module: ${modulePath}`, error);
    throw error;
  }
}

/**
 * Load configuration constants
 */
export async function loadConfig() {
  try {
    const { CONFIG, ENVIRONMENT } = await importModule('./config/constants.js');
    return { CONFIG, ENVIRONMENT };
  } catch (error) {
    // Fallback configuration if module fails to load
    return {
      CONFIG: {
        FAVICON_SERVICE: 'https://www.google.com/s2/favicons',
        FAVICON_SIZE: '64',
        LOG_LEVEL: 'INFO',
        RESTRICTED_PROTOCOLS: ['chrome://', 'chrome-extension://'],
        RESTRICTED_DOMAINS: ['chrome.google.com/webstore'],
        MAX_RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
      },
      ENVIRONMENT: {
        isDevelopment: false,
        isProduction: true,
        isExtension: typeof chrome !== 'undefined'
      }
    };
  }
}

/**
 * Load logger utilities
 */
export async function loadLogger() {
  try {
    const { appLogger, apiLogger, backgroundLogger } = await importModule('./utils/logger.js');
    return { appLogger, apiLogger, backgroundLogger };
  } catch (error) {
    // Fallback logger
    const fallbackLogger = {
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };
    return {
      appLogger: fallbackLogger,
      apiLogger: fallbackLogger,
      backgroundLogger: fallbackLogger
    };
  }
}