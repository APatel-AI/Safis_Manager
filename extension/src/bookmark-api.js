// Bookmark API - Chrome bookmarks API interactions
// This file handles all communication with Chrome's bookmark system

export async function sendMessageToBackground(message) {
  try {
    if (!chrome?.runtime?.sendMessage) {
      throw new Error('Chrome runtime API not available');
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response) {
          console.error('No response from background script for:', message.type);
          reject(new Error('No response from background script'));
        } else {
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.error('Failed to send message to background:', error);
    throw error;
  }
}

export async function loadBookmarks() {
  try {
    console.log('Loading bookmarks via background script...');
    const response = await sendMessageToBackground({ type: 'GET_BOOKMARKS' });
    console.log('Bookmarks response:', response);
    
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

    console.log('Processed bookmarks:', allBookmarks.length);
    return allBookmarks;
    
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    throw error;
  }
}

export async function addCurrentTabBookmark() {
  try {
    console.log('Adding current tab as bookmark...');
    const response = await sendMessageToBackground({
      type: 'ADD_CURRENT_TAB_BOOKMARK'
    });
    
    if (response.success) {
      console.log('Current tab bookmark added:', response.bookmark);
      return response.bookmark;
    } else {
      throw new Error(response.error || 'Failed to add bookmark');
    }
  } catch (error) {
    console.error('Error adding current tab bookmark:', error);
    throw error;
  }
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
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}