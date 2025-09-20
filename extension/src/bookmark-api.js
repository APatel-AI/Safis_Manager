// Bookmark API - Chrome bookmarks API interactions
// This file handles all communication with Chrome's bookmark system

// Configuration constants (inline for compatibility)
const CONFIG = {
  FAVICON_SERVICE: 'https://www.google.com/s2/favicons',
  FAVICON_SIZE: '64',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Simple logging with context
function logWithContext(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [API]`;
  console[level.toLowerCase()](`${prefix} ${message}`, data);
}

// Error handling with retry logic
async function withErrorHandling(asyncFn, context, options = {}) {
  const { allowRetry = false, retryKey = null, showToUser = false, fallbackValue = null } = options;
  let attempts = 0;
  
  while (attempts <= CONFIG.MAX_RETRY_ATTEMPTS) {
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      attempts++;
      logWithContext('error', `Error in ${context} (attempt ${attempts})`, { error: error.message });
      
      if (attempts <= CONFIG.MAX_RETRY_ATTEMPTS && allowRetry) {
        logWithContext('info', `Retrying ${context} in ${CONFIG.RETRY_DELAY}ms`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        continue;
      }
      
      if (showToUser && typeof chrome !== 'undefined' && chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/glasses_emoji.png',
          title: 'Safis Error',
          message: `Error in ${context}. Please try again.`
        });
      }
      
      if (fallbackValue !== null) {
        return fallbackValue;
      }
      
      throw error;
    }
  }
}

export async function sendMessageToBackground(message) {
  return withErrorHandling(async () => {
    if (!chrome?.runtime?.sendMessage) {
      throw new Error('Chrome runtime API not available');
    }
    
    logWithContext('debug', 'Sending message to background', { type: message.type });
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const duration = Date.now() - startTime;
        
        if (chrome.runtime.lastError) {
          logWithContext('error', 'Runtime error', { error: chrome.runtime.lastError.message });
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response) {
          logWithContext('error', 'No response from background script', { messageType: message.type });
          reject(new Error('No response from background script'));
        } else {
          logWithContext('debug', 'Background message successful', { type: message.type, duration });
          resolve(response);
        }
      });
    });
  }, 'sendMessageToBackground', {
    allowRetry: true,
    showToUser: true
  });
}

export async function loadBookmarks() {
  return withErrorHandling(async () => {
    logWithContext('info', 'Loading bookmarks via background script');
    const startTime = Date.now();
    
    const response = await sendMessageToBackground({ type: 'GET_BOOKMARKS' });
    logWithContext('debug', 'Bookmarks response received', { bookmarkCount: response?.bookmarks?.length || 0 });
    
    const allBookmarks = [];
    
    function processBookmarkNode(node, level = 0) {
      if (node.url) {
        allBookmarks.push({
          id: node.id,
          title: node.title || 'Untitled',
          url: node.url,
          dateAdded: node.dateAdded,
          domain: getDomainFromUrl(node.url),
          favicon: getFaviconUrl(node.url)
        });
      } else if (node.children) {
        node.children.forEach(child => processBookmarkNode(child, level + 1));
      }
    }
    
    if (response && response.bookmarks) {
      response.bookmarks.forEach(node => {
        if (node.children) {
          node.children.forEach(child => processBookmarkNode(child));
        }
      });
    }

    const duration = Date.now() - startTime;
    logWithContext('info', `loadBookmarks completed in ${duration}ms`, { count: allBookmarks.length });
    return allBookmarks;
  }, 'bookmark_load', {
    allowRetry: true,
    showToUser: true,
    fallbackValue: []
  });
}

export async function addCurrentTabBookmark() {
  return withErrorHandling(async () => {
    logWithContext('info', 'Adding current tab as bookmark');
    
    const response = await sendMessageToBackground({
      type: 'ADD_CURRENT_TAB_BOOKMARK'
    });
    
    if (response.success) {
      logWithContext('info', 'Current tab bookmark added successfully', { bookmarkId: response.bookmark?.id });
      return response.bookmark;
    } else {
      throw new Error(response.error || 'Failed to add bookmark');
    }
  }, 'bookmark_save', {
    allowRetry: true,
    showToUser: true
  });
}

export async function deleteBookmark(bookmarkId) {
  try {
    console.log('Deleting bookmark:', bookmarkId);
    const response = await sendMessageToBackground({
      type: 'DELETE_BOOKMARK',
      bookmarkId: bookmarkId
    });
    
    if (response.success) {
      console.log('Bookmark deleted successfully');
      return true;
    } else {
      throw new Error(response.error || 'Failed to delete bookmark');
    }
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
}

export async function updateBookmark(bookmarkId, updates) {
  try {
    console.log('Updating bookmark:', bookmarkId, updates);
    const response = await sendMessageToBackground({
      type: 'UPDATE_BOOKMARK',
      bookmarkId: bookmarkId,
      ...updates
    });
    
    if (response.success) {
      console.log('Bookmark updated successfully:', response.bookmark);
      return response.bookmark;
    } else {
      throw new Error(response.error || 'Failed to update bookmark');
    }
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
}

export async function createBookmarkFolder(folderName, parentId = '1') {
  try {
    console.log('Creating bookmark folder:', folderName);
    const response = await sendMessageToBackground({
      type: 'CREATE_BOOKMARK_FOLDER',
      folderName: folderName,
      parentId: parentId
    });
    
    if (response.success) {
      console.log('Folder created successfully:', response.folder);
      return response.folder;
    } else {
      throw new Error(response.error || 'Failed to create folder');
    }
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

export async function getAllBookmarkFolders() {
  try {
    console.log('Getting all bookmark folders...');
    const response = await sendMessageToBackground({
      type: 'GET_ALL_BOOKMARK_FOLDERS'
    });
    
    if (response.success) {
      console.log('Retrieved folders:', response.folders?.length || 0);
      return response.folders || [];
    } else {
      throw new Error(response.error || 'Failed to get folders');
    }
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
}

export async function searchBookmarks(query) {
  try {
    console.log('Searching bookmarks:', query);
    const response = await sendMessageToBackground({
      type: 'SEARCH_BOOKMARKS',
      query: query
    });
    
    if (response.success) {
      console.log('Search results:', response.results?.length || 0);
      return response.results || [];
    } else {
      throw new Error(response.error || 'Search failed');
    }
  } catch (error) {
    console.error('Error searching bookmarks:', error);
    return [];
  }
}

// Utility functions
export function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `${CONFIG.FAVICON_SERVICE}?domain=${domain}&sz=${CONFIG.FAVICON_SIZE}`;
  } catch (error) {
    logWithContext('warn', 'Invalid URL for favicon', { url, error: error.message });
    return null;
  }
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}