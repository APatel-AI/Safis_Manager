// Configuration constants following 12-factor methodology
// Factor III: Config - Store config in the environment

export const CONFIG = {
  // Favicon service configuration
  FAVICON_SERVICE: process.env.FAVICON_SERVICE || 'https://www.google.com/s2/favicons',
  FAVICON_SIZE: process.env.FAVICON_SIZE || '64',
  
  // Extension behavior
  DEFAULT_PARENT_ID: process.env.DEFAULT_PARENT_ID || '1',
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
  ENABLE_DEBUG: process.env.NODE_ENV === 'development',
  
  // URL restrictions
  RESTRICTED_PROTOCOLS: [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'edge-extension://',
    'about:',
    'chrome-search://',
    'chrome-native://',
    'data:',
    'file://'
  ],
  
  RESTRICTED_DOMAINS: [
    'chrome.google.com/webstore',
    'addons.mozilla.org',
    'microsoftedge.microsoft.com/addons'
  ],
  
  // UI Configuration
  MODAL_Z_INDEX: process.env.MODAL_Z_INDEX || '2147483647',
  ANIMATION_DURATION: process.env.ANIMATION_DURATION || '300',
  
  // Error handling
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 1000,
  
  // Performance
  DEBOUNCE_DELAY: parseInt(process.env.DEBOUNCE_DELAY) || 300,
  MAX_SEARCH_RESULTS: parseInt(process.env.MAX_SEARCH_RESULTS) || 100
};

// Environment detection
export const ENVIRONMENT = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isExtension: typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
};