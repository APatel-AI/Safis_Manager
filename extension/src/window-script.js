// Safis Window Script - Bookmark Manager Window
console.log('=== SAFIS WINDOW SCRIPT LOADED ===');

// Global variables
let allBookmarks = [];
let filteredBookmarks = [];
let currentCategory = 'all';
let currentView = 'grid';
let currentSort = 'date';
let customFolders = [];
let currentMode = 'categories'; // 'categories' or 'folders'
let currentFolderId = null;
let editingFolderId = null;

const categories = new Map([
  ['Work', { icon: '💼', count: 0 }],
  ['Personal', { icon: '👤', count: 0 }],
  ['Learning', { icon: '📚', count: 0 }],
  ['Entertainment', { icon: '🎬', count: 0 }],
  ['Shopping', { icon: '🛒', count: 0 }],
  ['News', { icon: '📰', count: 0 }],
  ['Social', { icon: '👥', count: 0 }]
]);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  setupEventListeners();
  setTimeout(() => {
    loadBookmarks();
    loadCustomFolders();
  }, 100);
});

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCategoryColor(category) {
  const colors = {
    'Work': '#667eea',
    'Personal': '#22C55E', 
    'Learning': '#3B82F6',
    'Entertainment': '#F59E0B',
    'Shopping': '#EC4899',
    'News': '#EF4444',
    'Social': '#8B5CF6'
  };
  return colors[category] || '#667eea';
}

function detectCategory(title, url) {
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Development & Learning
  if (urlLower.includes('github.com') || urlLower.includes('stackoverflow.com') || 
      urlLower.includes('codepen.io') || urlLower.includes('developer.mozilla.org') ||
      titleLower.includes('tutorial') || titleLower.includes('documentation') ||
      urlLower.includes('coursera.com') || urlLower.includes('udemy.com')) {
    return 'Learning';
  }
  
  // Work & Professional
  else if (urlLower.includes('linkedin.com') || urlLower.includes('slack.com') || 
           urlLower.includes('notion.so') || urlLower.includes('trello.com') ||
           titleLower.includes('meeting') || titleLower.includes('work')) {
    return 'Work';
  }
  
  // Entertainment & Media
  else if (urlLower.includes('youtube.com') || urlLower.includes('netflix.com') || 
           urlLower.includes('spotify.com') || urlLower.includes('twitch.tv') ||
           titleLower.includes('video') || titleLower.includes('movie')) {
    return 'Entertainment';
  }
  
  // Shopping & E-commerce
  else if (urlLower.includes('amazon.com') || urlLower.includes('ebay.com') ||
           urlLower.includes('shop') || titleLower.includes('buy')) {
    return 'Shopping';
  }
  
  // News & Information
  else if (urlLower.includes('news') || urlLower.includes('bbc.com') || 
           urlLower.includes('cnn.com') || titleLower.includes('breaking')) {
    return 'News';
  }
  
  // Social & Communication
  else if (urlLower.includes('facebook.com') || urlLower.includes('twitter.com') || 
           urlLower.includes('instagram.com') || urlLower.includes('reddit.com')) {
    return 'Social';
  }
  
  return 'Personal';
}

function getFaviconUrl(url) {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return null;
    }
    
    const domain = new URL(url).hostname;
    if (!domain || domain === '') {
      return null;
    }
    
    if (navigator.onLine) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } else {
      return null;
    }
  } catch (error) {
    console.log('Invalid URL for favicon:', url, error);
    return null;
  }
}

function getDomainFromUrl(url) {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return 'unknown-site';
    }
    
    const hostname = new URL(url).hostname;
    if (!hostname || hostname === '') {
      return 'unknown-site';
    }
    
    return hostname.replace('www.', '');
  } catch (error) {
    console.log('Invalid URL for domain extraction:', url, error);
    return 'unknown-site';
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : '#3B82F6'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 2147483648;
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.transform = 'translateY(-20px)';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Load bookmarks
async function loadBookmarks() {
  console.log('Loading bookmarks...');
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
    console.log('Bookmarks response received:', response);
    
    if (!response) {
      throw new Error('No response from background script');
    }
    
    if (response.error) {
      throw new Error('Background script error: ' + response.error);
    }
    
    allBookmarks = [];
    
    function processBookmarkNode(node, level = 0) {
      if (node.url && node.title) {
        const category = detectCategory(node.title, node.url);
        const domain = getDomainFromUrl(node.url);
        const favicon = getFaviconUrl(node.url);
        
        console.log(`Processing bookmark: ${node.title} -> ${domain}`);
        
        allBookmarks.push({
          id: node.id,
          title: node.title || 'Untitled',
          url: node.url,
          dateAdded: node.dateAdded,
          category: category,
          domain: domain,
          favicon: favicon
        });
      } else if (node.children && node.children.length > 0) {
        node.children.forEach(child => processBookmarkNode(child, level + 1));
      }
    }
    
    if (response && response.bookmarks) {
      console.log('Processing bookmark tree...');
      response.bookmarks.forEach(node => {
        if (node.children) {
          node.children.forEach(child => processBookmarkNode(child, 0));
        }
      });
    } else {
      console.warn('No bookmarks found in response');
    }

    console.log(`Processed ${allBookmarks.length} bookmarks`);

    if (allBookmarks.length === 0) {
      console.warn('No bookmarks were processed');
      const loadingDiv = document.querySelector('#bookmarks-loading');
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div style="color: #d69e2e; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">📚</div>
            <div>No bookmarks found</div>
            <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">Add some bookmarks to see them here</div>
          </div>
        `;
      }
      return;
    }

    // Update category counts
    categories.forEach((value, key) => value.count = 0);
    allBookmarks.forEach(bookmark => {
      if (categories.has(bookmark.category)) {
        categories.get(bookmark.category).count++;
      }
    });
    
    // Hide loading
    const loadingDiv = document.querySelector('#bookmarks-loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
    
    sortBookmarks();
    filterBookmarks();
    
    console.log('Bookmark loading completed successfully');
    
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    const loadingDiv = document.querySelector('#bookmarks-loading');
    if (loadingDiv) {
      loadingDiv.innerHTML = `
        <div style="color: #e53e3e; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
          <div>Failed to load bookmarks</div>
          <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">${error.message}</div>
          <button onclick="location.reload()" style="margin-top: 8px; padding: 4px 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Retry</button>
        </div>
      `;
    }
  }
}

// Sort bookmarks
function sortBookmarks() {
  if (currentSort === 'date') {
    allBookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
  } else {
    allBookmarks.sort((a, b) => a.title.localeCompare(b.title));
  }
}

// Filter bookmarks
function filterBookmarks(searchTerm = '') {
  const searchLower = searchTerm.toLowerCase();
  
  filteredBookmarks = allBookmarks.filter(bookmark => {
    const matchesCategory = currentCategory === 'all' || bookmark.category === currentCategory;
    const matchesSearch = !searchTerm || 
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower) ||
      bookmark.domain.toLowerCase().includes(searchLower);
    
    return matchesCategory && matchesSearch;
  });
  
  console.log('Filtered bookmarks:', filteredBookmarks.length);
  displayBookmarks();
}

// Display bookmarks
function displayBookmarks() {
  console.log('Displaying bookmarks, filtered count:', filteredBookmarks.length);
  console.log('Current view:', currentView);
  
  const gridContainer = document.querySelector('#bookmarks-grid');
  const listContainer = document.querySelector('#bookmarks-list');
  
  if (!gridContainer || !listContainer) {
    console.error('Bookmark containers not found');
    return;
  }
  
  if (currentView === 'grid') {
    gridContainer.style.display = 'grid';
    listContainer.style.display = 'none';
    displayGridView();
  } else {
    gridContainer.style.display = 'none';
    listContainer.style.display = 'flex';
    displayListView();
  }
}

// Display grid view
function displayGridView() {
  console.log('Displaying enhanced grid view');
  const container = document.querySelector('#bookmarks-grid');
  
  if (!container) {
    console.error('Grid container not found');
    return;
  }
  
  container.innerHTML = '';
  console.log('Filtered bookmarks for grid:', filteredBookmarks.length);
  
  if (filteredBookmarks.length === 0) {
    const emptyMessage = allBookmarks.length === 0 ? 'No bookmarks saved yet' : 'No bookmarks found';
    const emptySubtext = allBookmarks.length === 0 ? 'Add bookmarks to see them here' : 'Try adjusting your search or category filter';
    
    container.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 14px; padding: 60px 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📖</div>
        <div style="font-size: 16px; margin-bottom: 8px;">${emptyMessage}</div>
        <div style="font-size: 13px; opacity: 0.8;">${emptySubtext}</div>
      </div>
    `;
    return;
  }

  filteredBookmarks.forEach((bookmark, index) => {
    console.log(`Creating enhanced grid card ${index + 1}:`, bookmark.title);
    const card = document.createElement('div');
    card.className = 'bookmark-card';
    card.style.cssText = `
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 0;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    const faviconHtml = bookmark.favicon ? 
      `<img src="${bookmark.favicon}" style="width: 32px; height: 32px; border-radius: 6px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
       <div style="display: none; font-size: 24px;">🌐</div>` :
      `<div style="font-size: 24px;">🌐</div>`;

    // Make card draggable
    card.draggable = true;
    card.dataset.bookmarkId = bookmark.id;
    
    card.innerHTML = `
      <div style="flex: 1; background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; position: relative;">
        ${faviconHtml}
        <div style="font-size: 12px; font-weight: 500; color: #fff; line-height: 1.3; margin-top: 8px; max-height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
          ${escapeHtml(bookmark.title.length > 30 ? bookmark.title.substring(0, 30) + '...' : bookmark.title)}
        </div>
        <div style="font-size: 10px; color: #666; opacity: 0.8; margin-top: 4px;">
          ${bookmark.domain}
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions" style="position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;">
          <button onclick="addToFolder('${bookmark.id}')" style="width: 28px; height: 28px; border: none; background: #667eea; color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;" title="Add to folder">📁</button>
          <button onclick="window.open('${escapeHtml(bookmark.url)}', '_blank')" style="width: 28px; height: 28px; border: none; background: #333; color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">↗</button>
        </div>
      </div>
      
      <!-- Category Badge -->
      <div style="position: absolute; bottom: 8px; left: 8px; background: #222; color: #ccc; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 500;">
        ${categories.get(bookmark.category)?.icon || '📁'} ${bookmark.category}
      </div>
    `;
    
    // Enhanced hover effects
    card.addEventListener('mouseenter', () => {
      console.log('Grid card mouseenter triggered for:', bookmark.title);
      card.style.transform = 'translateY(-4px) scale(1.02)';
      card.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
      card.style.borderColor = '#667eea';
      card.querySelector('.quick-actions').style.opacity = '1';
    });
    
    card.addEventListener('mouseleave', () => {
      console.log('Grid card mouseleave triggered for:', bookmark.title);
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = 'none';
      card.style.borderColor = '#222';
      card.querySelector('.quick-actions').style.opacity = '0';
    });
    
    // Click to open
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.open(bookmark.url, '_blank');
      }
    });
    
    // Drag and drop events
    setupDragDropForBookmark(card, bookmark);
    
    container.appendChild(card);
  });
}

// Display list view
function displayListView() {
  console.log('Displaying enhanced list view');
  const container = document.querySelector('#bookmarks-list');
  
  if (!container) {
    console.error('List container not found');
    return;
  }
  
  container.innerHTML = '';
  console.log('Filtered bookmarks for list:', filteredBookmarks.length);
  
  if (filteredBookmarks.length === 0) {
    const emptyMessage = allBookmarks.length === 0 ? 'No bookmarks saved yet' : 'No bookmarks found';
    const emptySubtext = allBookmarks.length === 0 ? 'Add bookmarks to see them here' : 'Try adjusting your search or category filter';
    
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 14px; padding: 60px 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📖</div>
        <div style="font-size: 16px; margin-bottom: 8px;">${emptyMessage}</div>
        <div style="font-size: 13px; opacity: 0.8;">${emptySubtext}</div>
      </div>
    `;
    return;
  }

  filteredBookmarks.forEach((bookmark, index) => {
    console.log(`Creating enhanced list item ${index + 1}:`, bookmark.title);
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      min-height: 72px;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 8px;
    `;
    
    const faviconHtml = bookmark.favicon ? 
      `<img src="${bookmark.favicon}" style="width: 24px; height: 24px; border-radius: 4px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div style="display: none; color: #666; font-size: 20px; width: 24px; height: 24px; align-items: center; justify-content: center;">🌐</div>` :
      `<div style="color: #666; font-size: 20px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">🌐</div>`;

    item.innerHTML = `
      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #222 0%, #333 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #333; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        ${faviconHtml}
      </div>
      
      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; overflow: hidden;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 2px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; max-width: 320px; line-height: 1.2;">
            ${escapeHtml(bookmark.title)}
          </h3>
          <div style="background: linear-gradient(135deg, ${getCategoryColor(bookmark.category)}20 0%, ${getCategoryColor(bookmark.category)}40 100%); border: 1px solid ${getCategoryColor(bookmark.category)}60; color: ${getCategoryColor(bookmark.category)}; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; flex-shrink: 0;">
            ${categories.get(bookmark.category)?.icon || '📁'} ${bookmark.category}
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="font-size: 13px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;">
            ${bookmark.domain}
          </div>
          <div style="color: #666; font-size: 11px;">•</div>
          <div style="color: #666; font-size: 11px; white-space: nowrap;">
            ${formatDate(bookmark.dateAdded)}
          </div>
        </div>
        
        <div style="font-size: 12px; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px; line-height: 1.3;">
          ${escapeHtml(bookmark.url)}
        </div>
      </div>
      
      <div style="position: relative; flex-shrink: 0;">
        <button class="bookmark-menu-btn" data-bookmark-id="${bookmark.id}" style="
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: #222;
          color: #999;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 16px;
          position: relative;
        " title="More actions">
          ⋯
        </button>
        
        <div class="bookmark-menu" data-bookmark-id="${bookmark.id}" style="
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          z-index: 1000;
          display: none;
          min-width: 160px;
          overflow: hidden;
        ">
          <button class="menu-item" onclick="openBookmark('${bookmark.id}')" style="
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 14px;">🔗</span>
            Open Bookmark
          </button>
          <button class="menu-item" onclick="copyBookmarkUrl('${bookmark.id}')" style="
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 14px;">📋</span>
            Copy URL
          </button>
          <button class="menu-item" onclick="editBookmark('${bookmark.id}')" style="
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 14px;">✏️</span>
            Edit Title
          </button>
          <button class="menu-item" onclick="addToFolder('${bookmark.id}')" style="
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 14px;">📁</span>
            Add to Folder
          </button>
          <div style="border-top: 1px solid #333; margin: 4px 0;"></div>
          <button class="menu-item delete-item" onclick="deleteBookmark('${bookmark.id}')" style="
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #f87171;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 14px;">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    `;
    
    // Enhanced hover effects
    item.addEventListener('mouseenter', () => {
      console.log('List item mouseenter triggered for:', bookmark.title);
      item.style.borderColor = '#667eea';
      item.style.background = '#1a1a1a';
      item.style.transform = 'translateY(-2px)';
      item.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
      
      const menuBtn = item.querySelector('.bookmark-menu-btn');
      if (menuBtn) {
        menuBtn.style.background = '#333';
        menuBtn.style.color = '#fff';
      }
    });
    
    item.addEventListener('mouseleave', () => {
      console.log('List item mouseleave triggered for:', bookmark.title);
      item.style.borderColor = '#222';
      item.style.background = '#111';
      item.style.transform = 'translateY(0)';
      item.style.boxShadow = 'none';
      
      const menuBtn = item.querySelector('.bookmark-menu-btn');
      if (menuBtn) {
        menuBtn.style.background = '#222';
        menuBtn.style.color = '#999';
      }
    });
    
    // Click to open (except on buttons and menu)
    item.addEventListener('click', (e) => {
      if (!e.target.closest('button') && !e.target.closest('.bookmark-menu')) {
        window.open(bookmark.url, '_blank');
      }
    });
    
    // Setup menu functionality
    setupBookmarkMenu(item, bookmark);
    
    container.appendChild(item);
  });
}

function updateCategorySelection() {
  // Reset all category icons
  const categoryIcons = document.querySelectorAll('.sidebar-icon');
  categoryIcons.forEach(icon => {
    if (icon.id.includes('category-')) {
      icon.classList.remove('active');
    }
  });

  // Activate selected category
  let activeIconId = 'category-all-icon';
  if (currentCategory === 'Work') activeIconId = 'category-work-icon';
  else if (currentCategory === 'Personal') activeIconId = 'category-personal-icon';
  else if (currentCategory === 'Learning') activeIconId = 'category-learning-icon';

  const activeIcon = document.querySelector(`#${activeIconId}`);
  if (activeIcon) {
    activeIcon.classList.add('active');
  }

  // Update content title
  const title = currentCategory === 'all' ? 'All Bookmarks' : `${currentCategory} Bookmarks`;
  document.querySelector('#content-title').textContent = title;
}

function filterAndDisplayBookmarks() {
  filteredBookmarks = currentCategory === 'all' 
    ? allBookmarks 
    : allBookmarks.filter(bookmark => bookmark.category === currentCategory);
  
  displayBookmarks();
}

// Event listeners setup
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Search icon functionality
  const searchIcon = document.querySelector('#search-icon');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      const popup = document.querySelector('#search-popup');
      const input = document.querySelector('#search-input');
      
      if (popup.style.display === 'none' || !popup.style.display) {
        popup.style.display = 'block';
        if (input) input.focus();
      } else {
        popup.style.display = 'none';
        if (input) input.value = '';
        displayBookmarks();
      }
    });
  }

  // Close search popup when clicking outside
  document.addEventListener('click', (e) => {
    const popup = document.querySelector('#search-popup');
    const searchIcon = document.querySelector('#search-icon');
    
    if (popup && searchIcon && !popup.contains(e.target) && !searchIcon.contains(e.target)) {
      popup.style.display = 'none';
    }
  });

  // Search input functionality
  const searchInput = document.querySelector('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const resultsContainer = document.querySelector('#search-results');
      
      if (searchTerm === '') {
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">Start typing to search...</div>';
        }
        displayBookmarks();
        return;
      }
      
      const filteredResults = allBookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchTerm) ||
        bookmark.url.toLowerCase().includes(searchTerm) ||
        bookmark.domain.toLowerCase().includes(searchTerm) ||
        bookmark.category.toLowerCase().includes(searchTerm)
      );
      
      filteredBookmarks = filteredResults;
      displayBookmarks();
      
      // Update search results popup
      if (resultsContainer) {
        if (filteredResults.length === 0) {
          resultsContainer.innerHTML = '<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">No bookmarks found</div>';
        } else {
          resultsContainer.innerHTML = `<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">Found ${filteredResults.length} bookmark${filteredResults.length !== 1 ? 's' : ''}</div>`;
        }
      }
    });
  }

  // Add bookmark icon functionality
  const addIcon = document.querySelector('#add-icon');
  if (addIcon) {
    addIcon.addEventListener('click', async () => {
      try {
        // Get current tab info from background script
        const response = await chrome.runtime.sendMessage({
          type: 'ADD_CURRENT_TAB_BOOKMARK'
        });
        
        if (response && response.success) {
          console.log('Bookmark added successfully');
          showNotification('Bookmark added successfully!', 'success');
          loadBookmarks();
        } else {
          throw new Error(response?.error || 'Failed to add bookmark');
        }
      } catch (error) {
        console.error('Failed to add bookmark:', error);
        showNotification('Failed to add bookmark', 'error');
      }
    });
  }

  // Category icon event listeners
  const categoryAllIcon = document.querySelector('#category-all-icon');
  if (categoryAllIcon) {
    categoryAllIcon.addEventListener('click', () => {
      currentCategory = 'all';
      updateCategorySelection();
      filterAndDisplayBookmarks();
    });
  }

  const categoryWorkIcon = document.querySelector('#category-work-icon');
  if (categoryWorkIcon) {
    categoryWorkIcon.addEventListener('click', () => {
      currentCategory = 'Work';
      updateCategorySelection();
      filterAndDisplayBookmarks();
    });
  }

  const categoryPersonalIcon = document.querySelector('#category-personal-icon');
  if (categoryPersonalIcon) {
    categoryPersonalIcon.addEventListener('click', () => {
      currentCategory = 'Personal';
      updateCategorySelection();
      filterAndDisplayBookmarks();
    });
  }

  const categoryLearningIcon = document.querySelector('#category-learning-icon');
  if (categoryLearningIcon) {
    categoryLearningIcon.addEventListener('click', () => {
      currentCategory = 'Learning';
      updateCategorySelection();
      filterAndDisplayBookmarks();
    });
  }

  // View toggle icons
  const gridViewBtn = document.querySelector('#grid-view');
  if (gridViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      currentView = 'grid';
      const gridContainer = document.querySelector('#bookmarks-grid');
      const listContainer = document.querySelector('#bookmarks-list');
      const listViewBtn = document.querySelector('#list-view');
      if (gridContainer) gridContainer.style.display = 'grid';
      if (listContainer) listContainer.style.display = 'none';
      gridViewBtn.classList.add('active');
      if (listViewBtn) listViewBtn.classList.remove('active');
    });
  }

  const listViewBtn = document.querySelector('#list-view');
  if (listViewBtn) {
    listViewBtn.addEventListener('click', () => {
      currentView = 'list';
      const gridContainer = document.querySelector('#bookmarks-grid');
      const listContainer = document.querySelector('#bookmarks-list');
      const gridViewBtn = document.querySelector('#grid-view');
      if (gridContainer) gridContainer.style.display = 'none';
      if (listContainer) listContainer.style.display = 'flex';
      if (gridViewBtn) gridViewBtn.classList.remove('active');
      listViewBtn.classList.add('active');
      displayBookmarks();
    });
  }

  // Sort buttons
  const sortDateBtn = document.querySelector('#sort-date');
  if (sortDateBtn) {
    sortDateBtn.addEventListener('click', () => {
      currentSort = 'date';
      sortDateBtn.classList.add('active');
      const sortNameBtn = document.querySelector('#sort-name');
      if (sortNameBtn) sortNameBtn.classList.remove('active');
      sortBookmarks();
      displayBookmarks();
    });
  }

  const sortNameBtn = document.querySelector('#sort-name');
  if (sortNameBtn) {
    sortNameBtn.addEventListener('click', () => {
      currentSort = 'name';
      sortNameBtn.classList.add('active');
      const sortDateBtn = document.querySelector('#sort-date');
      if (sortDateBtn) sortDateBtn.classList.remove('active');
      sortBookmarks();
      displayBookmarks();
    });
  }
  
  // My Folders icon functionality
  const myFoldersIcon = document.querySelector('#my-folders-icon');
  if (myFoldersIcon) {
    myFoldersIcon.addEventListener('click', () => {
      toggleFoldersPanel();
    });
  }

  // Folders panel event listeners
  setupFolderEventListeners();
  setupAddToFolderEventListeners();
  setupFolderSidebarDropZone();
  
  console.log('Event listeners set up successfully');
}

// Custom Folders Functions
async function loadCustomFolders() {
  try {
    const result = await chrome.storage.local.get(['customFolders']);
    customFolders = result.customFolders || [];
    console.log('Loaded custom folders:', customFolders);
  } catch (error) {
    console.error('Failed to load custom folders:', error);
  }
}

async function saveCustomFolders() {
  try {
    await chrome.storage.local.set({ customFolders: customFolders });
    console.log('Custom folders saved');
  } catch (error) {
    console.error('Failed to save custom folders:', error);
  }
}

function toggleFoldersPanel() {
  const foldersPanel = document.querySelector('#folders-panel');
  const mainContent = document.querySelector('#main-content');
  
  if (!foldersPanel || !mainContent) return;
  
  if (foldersPanel.style.display === 'none' || !foldersPanel.style.display) {
    // Show folders panel
    foldersPanel.style.display = 'flex';
    mainContent.style.display = 'none';
    currentMode = 'folders';
    
    // Update sidebar active state
    updateSidebarActiveState('my-folders-icon');
    
    displayFolders();
  } else {
    // Hide folders panel
    foldersPanel.style.display = 'none';
    mainContent.style.display = 'flex';
    currentMode = 'categories';
    currentFolderId = null;
    
    // Return to all bookmarks view
    currentCategory = 'all';
    updateSidebarActiveState('category-all-icon');
    filterBookmarks();
  }
}

function updateSidebarActiveState(activeIconId) {
  // Remove active class from all sidebar icons
  const sidebarIcons = document.querySelectorAll('.sidebar-icon');
  sidebarIcons.forEach(icon => icon.classList.remove('active'));
  
  // Add active class to specified icon
  const activeIcon = document.querySelector(`#${activeIconId}`);
  if (activeIcon) {
    activeIcon.classList.add('active');
  }
}

function displayFolders() {
  const foldersGrid = document.querySelector('#folders-grid');
  const foldersLoading = document.querySelector('#folders-loading');
  
  if (!foldersGrid || !foldersLoading) return;
  
  if (customFolders.length === 0) {
    foldersLoading.style.display = 'flex';
    foldersGrid.innerHTML = '';
    return;
  }
  
  foldersLoading.style.display = 'none';
  foldersGrid.innerHTML = '';
  
  customFolders.forEach(folder => {
    const folderCard = document.createElement('div');
    folderCard.className = 'folder-card';
    folderCard.style.cssText = `
      background: #222;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    `;
    
    const bookmarkCount = folder.bookmarks ? folder.bookmarks.length : 0;
    
    folderCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="font-size: 32px;">${folder.icon}</div>
        <div>
          <h3 style="margin: 0; color: #fff; font-size: 16px; font-weight: 600;">${escapeHtml(folder.name)}</h3>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">${bookmarkCount} bookmark${bookmarkCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: #888;">
          Created ${formatDate(folder.createdAt)}
        </div>
        <div class="folder-actions" style="display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;">
          <button onclick="editFolder('${folder.id}')" style="
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            background: #333;
            color: #ccc;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s;
          ">Edit</button>
          <button onclick="deleteFolder('${folder.id}')" style="
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            background: #444;
            color: #f87171;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s;
          ">Delete</button>
        </div>
      </div>
    `;
    
    // Hover effects
    folderCard.addEventListener('mouseenter', () => {
      folderCard.style.transform = 'translateY(-2px)';
      folderCard.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
      folderCard.style.borderColor = '#667eea';
      folderCard.querySelector('.folder-actions').style.opacity = '1';
    });
    
    folderCard.addEventListener('mouseleave', () => {
      folderCard.style.transform = 'translateY(0)';
      folderCard.style.boxShadow = 'none';
      folderCard.style.borderColor = '#333';
      folderCard.querySelector('.folder-actions').style.opacity = '0';
    });
    
    // Click to open folder
    folderCard.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        openFolder(folder.id);
      }
    });
    
    // Make folder a drop zone
    setupDropZoneForFolder(folderCard, folder);
    
    foldersGrid.appendChild(folderCard);
  });
}

function openFolder(folderId) {
  const folder = customFolders.find(f => f.id === folderId);
  if (!folder) return;
  
  currentFolderId = folderId;
  
  // Switch to main content view showing folder contents
  const foldersPanel = document.querySelector('#folders-panel');
  const mainContent = document.querySelector('#main-content');
  
  if (foldersPanel && mainContent) {
    foldersPanel.style.display = 'none';
    mainContent.style.display = 'flex';
  }
  
  // Update content title
  const contentTitle = document.querySelector('#content-title');
  const contentSubtitle = document.querySelector('#content-subtitle');
  
  if (contentTitle && contentSubtitle) {
    contentTitle.textContent = `${folder.icon} ${folder.name}`;
    contentSubtitle.textContent = `${folder.bookmarks ? folder.bookmarks.length : 0} bookmarks`;
  }
  
  // Filter bookmarks to show only those in this folder
  filteredBookmarks = folder.bookmarks || [];
  displayBookmarks();
}

function setupFolderEventListeners() {
  // Close folders panel button
  const closeFoldersBtn = document.querySelector('#close-folders-btn');
  if (closeFoldersBtn) {
    closeFoldersBtn.addEventListener('click', () => {
      toggleFoldersPanel();
    });
  }
  
  // Create folder button
  const createFolderBtn = document.querySelector('#create-folder-btn');
  if (createFolderBtn) {
    createFolderBtn.addEventListener('click', () => {
      showFolderModal();
    });
  }
  
  // Folder modal event listeners
  setupFolderModalEventListeners();
}

function setupFolderModalEventListeners() {
  // Cancel button
  const cancelBtn = document.querySelector('#cancel-folder-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideFolderModal();
    });
  }
  
  // Save button
  const saveBtn = document.querySelector('#save-folder-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveFolder();
    });
  }
  
  // Icon selector
  const iconOptions = document.querySelectorAll('.icon-option');
  iconOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove active class from all options
      iconOptions.forEach(opt => {
        opt.classList.remove('active');
        opt.style.borderColor = '#333';
      });
      
      // Add active class to clicked option
      option.classList.add('active');
      option.style.borderColor = '#667eea';
    });
  });
  
  // Close modal when clicking outside
  const modal = document.querySelector('#folder-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideFolderModal();
      }
    });
  }
  
  // Enter key to save
  const nameInput = document.querySelector('#folder-name-input');
  if (nameInput) {
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveFolder();
      }
    });
  }
}

function showFolderModal(folderId = null) {
  const modal = document.querySelector('#folder-modal');
  const modalTitle = document.querySelector('#folder-modal-title');
  const nameInput = document.querySelector('#folder-name-input');
  const saveBtn = document.querySelector('#save-folder-btn');
  
  if (!modal || !modalTitle || !nameInput || !saveBtn) return;
  
  editingFolderId = folderId;
  
  if (folderId) {
    // Edit mode
    const folder = customFolders.find(f => f.id === folderId);
    if (folder) {
      modalTitle.textContent = 'Edit Folder';
      nameInput.value = folder.name;
      saveBtn.textContent = 'Save Changes';
      
      // Select the correct icon
      const iconOptions = document.querySelectorAll('.icon-option');
      iconOptions.forEach(option => {
        option.classList.remove('active');
        option.style.borderColor = '#333';
        if (option.dataset.icon === folder.icon) {
          option.classList.add('active');
          option.style.borderColor = '#667eea';
        }
      });
    }
  } else {
    // Create mode
    modalTitle.textContent = 'Create New Folder';
    nameInput.value = '';
    saveBtn.textContent = 'Create Folder';
    
    // Reset to default icon
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
      option.classList.remove('active');
      option.style.borderColor = '#333';
    });
    
    const defaultIcon = document.querySelector('.icon-option[data-icon="📁"]');
    if (defaultIcon) {
      defaultIcon.classList.add('active');
      defaultIcon.style.borderColor = '#667eea';
    }
  }
  
  modal.style.display = 'flex';
  nameInput.focus();
}

function hideFolderModal() {
  const modal = document.querySelector('#folder-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  editingFolderId = null;
}

async function saveFolder() {
  const nameInput = document.querySelector('#folder-name-input');
  const selectedIcon = document.querySelector('.icon-option.active');
  
  if (!nameInput || !selectedIcon) return;
  
  const name = nameInput.value.trim();
  if (!name) {
    showNotification('Please enter a folder name', 'error');
    return;
  }
  
  const icon = selectedIcon.dataset.icon;
  
  if (editingFolderId) {
    // Update existing folder
    const folderIndex = customFolders.findIndex(f => f.id === editingFolderId);
    if (folderIndex !== -1) {
      customFolders[folderIndex].name = name;
      customFolders[folderIndex].icon = icon;
      customFolders[folderIndex].updatedAt = Date.now();
    }
    showNotification('Folder updated successfully!', 'success');
  } else {
    // Create new folder
    const newFolder = {
      id: Date.now().toString(),
      name: name,
      icon: icon,
      bookmarks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    customFolders.push(newFolder);
    showNotification('Folder created successfully!', 'success');
  }
  
  await saveCustomFolders();
  displayFolders();
  hideFolderModal();
}

// Global functions for folder actions (called from HTML)
window.editFolder = function(folderId) {
  showFolderModal(folderId);
};

window.deleteFolder = async function(folderId) {
  if (confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
    customFolders = customFolders.filter(f => f.id !== folderId);
    await saveCustomFolders();
    displayFolders();
    showNotification('Folder deleted successfully!', 'success');
  }
};

window.addToFolder = function(bookmarkId) {
  showAddToFolderModal(bookmarkId);
};

// Add to folder functionality
let selectedBookmarkForFolder = null;

function showAddToFolderModal(bookmarkId) {
  const bookmark = allBookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return;
  
  selectedBookmarkForFolder = bookmark;
  
  const modal = document.querySelector('#add-to-folder-modal');
  const titlePreview = document.querySelector('#bookmark-title-preview');
  const folderList = document.querySelector('#folder-list');
  const noFoldersMessage = document.querySelector('#no-folders-message');
  
  if (!modal || !titlePreview || !folderList || !noFoldersMessage) return;
  
  titlePreview.textContent = `"${bookmark.title}"`;
  
  if (customFolders.length === 0) {
    noFoldersMessage.style.display = 'block';
    folderList.innerHTML = '';
    folderList.appendChild(noFoldersMessage);
  } else {
    noFoldersMessage.style.display = 'none';
    folderList.innerHTML = '';
    
    customFolders.forEach(folder => {
      const folderItem = document.createElement('div');
      folderItem.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 1px solid #222;
      `;
      
      const isBookmarkInFolder = folder.bookmarks && folder.bookmarks.some(b => b.id === bookmark.id);
      
      folderItem.innerHTML = `
        <div style="font-size: 20px;">${folder.icon}</div>
        <div style="flex: 1;">
          <div style="color: #fff; font-size: 14px; font-weight: 500;">${escapeHtml(folder.name)}</div>
          <div style="color: #666; font-size: 12px;">${folder.bookmarks ? folder.bookmarks.length : 0} bookmarks</div>
        </div>
        <div style="color: ${isBookmarkInFolder ? '#22C55E' : '#666'}; font-size: 12px;">
          ${isBookmarkInFolder ? '✓ Added' : 'Add'}
        </div>
      `;
      
      folderItem.addEventListener('mouseenter', () => {
        folderItem.style.background = '#333';
      });
      
      folderItem.addEventListener('mouseleave', () => {
        folderItem.style.background = 'transparent';
      });
      
      if (!isBookmarkInFolder) {
        folderItem.addEventListener('click', () => {
          addBookmarkToFolder(bookmark, folder.id);
        });
      }
      
      folderList.appendChild(folderItem);
    });
  }
  
  modal.style.display = 'flex';
}

function hideAddToFolderModal() {
  const modal = document.querySelector('#add-to-folder-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  selectedBookmarkForFolder = null;
}

async function addBookmarkToFolder(bookmark, folderId) {
  const folderIndex = customFolders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) return;
  
  const folder = customFolders[folderIndex];
  
  // Initialize bookmarks array if it doesn't exist
  if (!folder.bookmarks) {
    folder.bookmarks = [];
  }
  
  // Check if bookmark is already in folder
  const bookmarkExists = folder.bookmarks.some(b => b.id === bookmark.id);
  if (bookmarkExists) {
    showNotification('Bookmark is already in this folder', 'info');
    return;
  }
  
  // Add bookmark to folder
  folder.bookmarks.push({
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    dateAdded: bookmark.dateAdded,
    category: bookmark.category,
    domain: bookmark.domain,
    favicon: bookmark.favicon,
    addedToFolderAt: Date.now()
  });
  
  folder.updatedAt = Date.now();
  
  await saveCustomFolders();
  
  showNotification(`Added to "${folder.name}" folder!`, 'success');
  hideAddToFolderModal();
  
  // Refresh folder display if currently viewing folders
  if (currentMode === 'folders') {
    displayFolders();
  }
}

function setupAddToFolderEventListeners() {
  // Cancel button
  const cancelBtn = document.querySelector('#cancel-add-to-folder-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideAddToFolderModal();
    });
  }
  
  // Close modal when clicking outside
  const modal = document.querySelector('#add-to-folder-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideAddToFolderModal();
      }
    });
  }
}

// Drag and Drop functionality
let draggedBookmark = null;

function setupDragDropForBookmark(element, bookmark) {
  element.addEventListener('dragstart', (e) => {
    draggedBookmark = bookmark;
    element.style.opacity = '0.5';
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', bookmark.id);
    
    console.log('Started dragging bookmark:', bookmark.title);
  });
  
  element.addEventListener('dragend', (e) => {
    element.style.opacity = '1';
    draggedBookmark = null;
    
    console.log('Finished dragging bookmark');
  });
}

function setupDropZoneForFolder(element, folder) {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Visual feedback
    element.style.borderColor = '#667eea';
    element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)';
  });
  
  element.addEventListener('dragleave', (e) => {
    // Only reset if we're actually leaving the folder card
    const rect = element.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      element.style.borderColor = '#333';
      element.style.boxShadow = 'none';
    }
  });
  
  element.addEventListener('drop', async (e) => {
    e.preventDefault();
    
    // Reset visual feedback
    element.style.borderColor = '#333';
    element.style.boxShadow = 'none';
    
    if (draggedBookmark) {
      console.log('Dropping bookmark into folder:', draggedBookmark.title, '->', folder.name);
      
      // Add bookmark to folder
      await addBookmarkToFolder(draggedBookmark, folder.id);
      
      // Visual feedback
      element.style.transform = 'scale(1.02)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
  });
}

// Enhanced folder sidebar interaction
function setupFolderSidebarDropZone() {
  const myFoldersIcon = document.querySelector('#my-folders-icon');
  
  if (!myFoldersIcon) return;
  
  myFoldersIcon.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Visual feedback
    myFoldersIcon.style.background = '#667eea';
    myFoldersIcon.style.transform = 'scale(1.1)';
  });
  
  myFoldersIcon.addEventListener('dragleave', (e) => {
    myFoldersIcon.style.background = '';
    myFoldersIcon.style.transform = 'scale(1)';
  });
  
  myFoldersIcon.addEventListener('drop', (e) => {
    e.preventDefault();
    
    // Reset visual feedback
    myFoldersIcon.style.background = '';
    myFoldersIcon.style.transform = 'scale(1)';
    
    if (draggedBookmark) {
      // Open folders panel and show add to folder modal
      if (currentMode !== 'folders') {
        toggleFoldersPanel();
      }
      
      // Small delay to ensure panel is open
      setTimeout(() => {
        showAddToFolderModal(draggedBookmark.id);
      }, 100);
    }
  });
}

// Override the existing updateCategorySelection function to handle folders mode
function updateCategorySelection() {
  if (currentMode === 'folders') {
    updateSidebarActiveState('my-folders-icon');
    return;
  }
  
  // Reset all category icons
  const categoryIcons = document.querySelectorAll('.sidebar-icon');
  categoryIcons.forEach(icon => {
    if (icon.id.includes('category-')) {
      icon.classList.remove('active');
    }
  });

  // Activate selected category
  let activeIconId = 'category-all-icon';
  if (currentCategory === 'Work') activeIconId = 'category-work-icon';
  else if (currentCategory === 'Personal') activeIconId = 'category-personal-icon';
  else if (currentCategory === 'Learning') activeIconId = 'category-learning-icon';

  const activeIcon = document.querySelector(`#${activeIconId}`);
  if (activeIcon) {
    activeIcon.classList.add('active');
  }

  // Update content title
  const title = currentCategory === 'all' ? 'All Bookmarks' : `${currentCategory} Bookmarks`;
  const contentTitle = document.querySelector('#content-title');
  const contentSubtitle = document.querySelector('#content-subtitle');
  
  if (contentTitle) contentTitle.textContent = title;
  if (contentSubtitle) contentSubtitle.textContent = 'Your bookmark collection';
}

// Bookmark menu functionality
function setupBookmarkMenu(item, bookmark) {
  const menuBtn = item.querySelector('.bookmark-menu-btn');
  const menu = item.querySelector('.bookmark-menu');
  
  if (!menuBtn || !menu) return;
  
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Close all other menus first
    closeAllBookmarkMenus();
    
    // Toggle this menu
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      menuBtn.style.background = '#333';
      menuBtn.style.color = '#fff';
    }
  });
  
  // Add hover effects to menu items
  const menuItems = menu.querySelectorAll('.menu-item');
  menuItems.forEach(menuItem => {
    menuItem.addEventListener('mouseenter', () => {
      if (menuItem.classList.contains('delete-item')) {
        menuItem.style.background = '#ff4444';
        menuItem.style.color = '#fff';
      } else {
        menuItem.style.background = '#333';
      }
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
      if (menuItem.classList.contains('delete-item')) {
        menuItem.style.color = '#f87171';
      }
    });
  });
}

function closeAllBookmarkMenus() {
  const allMenus = document.querySelectorAll('.bookmark-menu');
  const allMenuBtns = document.querySelectorAll('.bookmark-menu-btn');
  
  allMenus.forEach(menu => {
    menu.style.display = 'none';
  });
  
  allMenuBtns.forEach(btn => {
    btn.style.background = '#222';
    btn.style.color = '#999';
  });
}

// Global bookmark action functions
window.openBookmark = function(bookmarkId) {
  const bookmark = allBookmarks.find(b => b.id === bookmarkId);
  if (bookmark) {
    window.open(bookmark.url, '_blank');
    closeAllBookmarkMenus();
  }
};

window.copyBookmarkUrl = function(bookmarkId) {
  const bookmark = allBookmarks.find(b => b.id === bookmarkId);
  if (bookmark) {
    navigator.clipboard.writeText(bookmark.url).then(() => {
      showNotification('URL copied to clipboard!', 'success');
      closeAllBookmarkMenus();
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      showNotification('Failed to copy URL', 'error');
    });
  }
};

window.editBookmark = function(bookmarkId) {
  const bookmark = allBookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return;
  
  const newTitle = prompt('Edit bookmark title:', bookmark.title);
  if (newTitle && newTitle.trim() !== '') {
    // Send message to background script to update bookmark
    chrome.runtime.sendMessage({
      type: 'UPDATE_BOOKMARK',
      bookmarkId: bookmarkId,
      title: newTitle.trim()
    }).then(response => {
      if (response && response.success) {
        showNotification('Bookmark title updated!', 'success');
        loadBookmarks();
      } else {
        showNotification('Failed to update bookmark', 'error');
      }
    }).catch(error => {
      console.error('Failed to update bookmark:', error);
      showNotification('Failed to update bookmark', 'error');
    });
  }
  closeAllBookmarkMenus();
};

window.deleteBookmark = function(bookmarkId) {
  const bookmark = allBookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return;
  
  if (confirm(`Are you sure you want to delete "${bookmark.title}"?\n\nThis action cannot be undone.`)) {
    chrome.runtime.sendMessage({
      type: 'DELETE_BOOKMARK',
      bookmarkId: bookmarkId
    }).then(response => {
      if (response && response.success) {
        showNotification('Bookmark deleted successfully!', 'success');
        loadBookmarks();
      } else {
        showNotification('Failed to delete bookmark', 'error');
      }
    }).catch(error => {
      console.error('Failed to delete bookmark:', error);
      showNotification('Failed to delete bookmark', 'error');
    });
  }
  closeAllBookmarkMenus();
};

// Close menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.bookmark-menu') && !e.target.closest('.bookmark-menu-btn')) {
    closeAllBookmarkMenus();
  }
});

console.log('=== SAFIS WINDOW SETUP COMPLETE ===');