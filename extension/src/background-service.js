// Safis Extension Service Worker
console.log('Safis service worker loaded');

let windowId = null;

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked for tab:', tab.url);
  
  try {
    // Check if window already exists
    if (windowId) {
      try {
        const existingWindow = await chrome.windows.get(windowId);
        if (existingWindow) {
          // Focus existing window
          await chrome.windows.update(windowId, { focused: true });
          console.log('Focused existing window');
          return;
        }
      } catch (error) {
        console.log('Window no longer exists, creating new one');
        windowId = null;
      }
    }

    // Get screen dimensions
    const displays = await chrome.system.display.getInfo();
    const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
    
    const screenWidth = primaryDisplay.workArea.width;
    const screenHeight = primaryDisplay.workArea.height;
    
    // Calculate mini window size and position (compact initial size)
    const windowWidth = 400; // Compact width
    const windowHeight = 500; // Compact height
    const left = screenWidth - windowWidth - 50; // Position near right edge with margin
    const top = 80; // Position near top with margin

    // Create new window
    const window = await chrome.windows.create({
      url: 'window.html',
      type: 'popup',
      width: windowWidth,
      height: windowHeight,
      left: left,
      top: top,
      focused: true
    });
    
    windowId = window.id;
    console.log('Bookmark manager window opened:', windowId);

  } catch (error) {
    console.error('Failed to open window:', error);
  }
});

// Handle window closed event
chrome.windows.onRemoved.addListener((closedWindowId) => {
  if (closedWindowId === windowId) {
    console.log('Bookmark manager window closed');
    windowId = null;
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Service worker received message:', request.type);
  
  if (request.type === 'GET_BOOKMARKS') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      console.log('Sending bookmarks to content script');
      sendResponse({ bookmarks: bookmarkTreeNodes });
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
  
  if (request.type === 'REMOVE_BOOKMARK') {
    chrome.bookmarks.remove(request.id, () => {
      console.log('Bookmark removed:', request.id);
      sendResponse({ success: true });
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
});

console.log('Safis service worker initialized');