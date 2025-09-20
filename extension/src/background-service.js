// Safis Extension Service Worker
console.log('Safis service worker loaded');

// Global state for the background script
let activeTabId = null;

// Configuration constants (inline for compatibility)
const CONFIG = {
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
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Simple logging with context
function logWithContext(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [BACKGROUND]`;
  console[level.toLowerCase()](`${prefix} ${message}`, data);
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  logWithContext('info', 'Extension icon clicked', { tabId: tab.id, url: tab.url });
  
  // Check if URL is injectable
  if (!isInjectableUrl(tab.url)) {
    logWithContext('warn', 'Cannot inject on this URL', { url: tab.url });
    showNotificationToUser('Cannot open Safis on this page. Try opening it on a regular website.');
    return;
  }
  
  try {
    // Inject the overlay into the current tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/modal-injector.js']
    });
    
    activeTabId = tab.id;
    logWithContext('info', 'Overlay injected successfully', { tabId: tab.id });
  } catch (error) {
    logWithContext('error', 'Failed to inject overlay', { error: error.message, tabId: tab.id });
    showNotificationToUser('Could not open Safis on this page. Try a different website.');
  }
});

// Check if URL allows content script injection
function isInjectableUrl(url) {
  if (!url) return false;
  
  // Check restricted protocols
  for (const protocol of CONFIG.RESTRICTED_PROTOCOLS) {
    if (url.startsWith(protocol)) {
      logWithContext('debug', 'URL blocked by protocol restriction', { url, protocol });
      return false;
    }
  }
  
  // Check restricted domains
  for (const domain of CONFIG.RESTRICTED_DOMAINS) {
    if (url.includes(domain)) {
      logWithContext('debug', 'URL blocked by domain restriction', { url, domain });
      return false;
    }
  }
  
  return true;
}

// Show notification to user when injection fails
function showNotificationToUser(message) {
  logWithContext('info', 'Showing user notification', { message });
  
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/glasses_emoji.png',
      title: 'Safis Bookmark Manager',
      message: message
    }, () => {
      if (chrome.runtime.lastError) {
        logWithContext('error', 'Failed to show notification', { error: chrome.runtime.lastError.message });
      }
    });
  } catch (error) {
    logWithContext('error', 'Error creating notification', { error: error.message });
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logWithContext('debug', 'Service worker received message', { type: request.type, senderId: sender.tab?.id });
  
  if (request.type === 'GET_BOOKMARKS') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        logWithContext('error', 'Failed to get bookmarks', { error: chrome.runtime.lastError.message });
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        logWithContext('info', 'Sending bookmarks to content script', { nodeCount: bookmarkTreeNodes?.length || 0 });
        sendResponse({ bookmarks: bookmarkTreeNodes });
      }
    });
    return true;
  }
  
  if (request.type === 'ADD_BOOKMARK') {
    chrome.bookmarks.create({
      parentId: request.parentId || '1',
      title: request.title,
      url: request.url
    }, (bookmark) => {
      console.log('Bookmark created:', bookmark);
      sendResponse({ success: true, bookmark });
    });
    return true;
  }
  
  if (request.type === 'DELETE_BOOKMARK') {
    chrome.bookmarks.remove(request.bookmarkId, () => {
      if (chrome.runtime.lastError) {
        console.error('Error deleting bookmark:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Bookmark removed:', request.bookmarkId);
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.type === 'UPDATE_BOOKMARK') {
    const updateData = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.url !== undefined) updateData.url = request.url;
    
    chrome.bookmarks.update(request.bookmarkId, updateData, (bookmark) => {
      if (chrome.runtime.lastError) {
        console.error('Error updating bookmark:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Bookmark updated:', bookmark);
        sendResponse({ success: true, bookmark });
      }
    });
    return true;
  }
  
  if (request.type === 'ADD_CURRENT_TAB_BOOKMARK') {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        chrome.bookmarks.create({
          parentId: request.parentId || '1',
          title: currentTab.title,
          url: currentTab.url
        }, (bookmark) => {
          console.log('Current tab bookmark created:', bookmark);
          sendResponse({ success: true, bookmark });
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }
  
  // New handlers for bidirectional sync
  if (request.type === 'CREATE_BOOKMARK_FOLDER') {
    const parentId = request.parentId || '1'; // Default to bookmarks bar
    chrome.bookmarks.create({
      parentId: parentId,
      title: request.folderName
    }, (folder) => {
      if (chrome.runtime.lastError) {
        console.error('Error creating folder:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Folder created:', folder);
        sendResponse({ success: true, folder });
      }
    });
    return true;
  }
  
  if (request.type === 'DELETE_BOOKMARK_FOLDER') {
    chrome.bookmarks.removeTree(request.folderId, () => {
      if (chrome.runtime.lastError) {
        console.error('Error deleting folder:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Folder deleted:', request.folderId);
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.type === 'UPDATE_BOOKMARK_FOLDER') {
    chrome.bookmarks.update(request.folderId, { title: request.newTitle }, (folder) => {
      if (chrome.runtime.lastError) {
        console.error('Error updating folder:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Folder updated:', folder);
        sendResponse({ success: true, folder });
      }
    });
    return true;
  }
  
  if (request.type === 'GET_ALL_BOOKMARK_FOLDERS') {
    chrome.bookmarks.getTree((bookmarkTree) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting bookmark tree:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        const allFolders = [];
        
        function traverseTree(nodes, path = []) {
          for (const node of nodes) {
            // Skip root nodes and system folders
            if (node.id === '0' || node.title === '' || 
                node.title === 'Bookmarks bar' || 
                node.title === 'Other bookmarks' ||
                node.title === 'Mobile bookmarks') {
              if (node.children) {
                traverseTree(node.children, path);
              }
              continue;
            }
            
            // If it's a folder (no url), add it
            if (!node.url && node.children) {
              allFolders.push({
                ...node,
                path: [...path, node.title].join(' / ')
              });
              
              // Recursively check children
              traverseTree(node.children, [...path, node.title]);
            }
          }
        }
        
        traverseTree(bookmarkTree);
        console.log(`Found ${allFolders.length} bookmark folders`);
        sendResponse({ success: true, folders: allFolders });
      }
    });
    return true;
  }
  
  if (request.type === 'GET_FOLDER_CHILDREN') {
    chrome.bookmarks.getChildren(request.folderId, (children) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting folder children:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log(`Got ${children.length} children for folder ${request.folderId}`);
        sendResponse({ success: true, children });
      }
    });
    return true;
  }
  
  if (request.type === 'SEARCH_BOOKMARKS') {
    chrome.bookmarks.search({ title: request.query }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('Error searching bookmarks:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log(`Found ${results.length} search results`);
        sendResponse({ success: true, results });
      }
    });
    return true;
  }
});

// Setup bookmark change listeners for bidirectional sync
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  console.log('Bookmark created:', bookmark);
  // Broadcast to all content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'BOOKMARK_CREATED',
        id,
        bookmark
      }).catch(() => {}); // Ignore errors for tabs without content scripts
    });
  });
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log('Bookmark removed:', id);
  // Broadcast to all content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'BOOKMARK_REMOVED',
        id,
        removeInfo
      }).catch(() => {}); // Ignore errors for tabs without content scripts
    });
  });
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  console.log('Bookmark changed:', id, changeInfo);
  // Broadcast to all content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'BOOKMARK_CHANGED',
        id,
        changeInfo
      }).catch(() => {}); // Ignore errors for tabs without content scripts
    });
  });
});

console.log('Safis service worker initialized');