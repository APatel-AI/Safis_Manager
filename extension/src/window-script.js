// Safis Window Script - Bookmark Manager Window
console.log('=== SAFIS WINDOW SCRIPT LOADED ===');

// Global variables
let allBookmarks = [];
let filteredBookmarks = [];
let currentCategory = 'all';
let currentView = 'grid';
let currentSort = 'date';

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
      gap: 12px;
      padding: 12px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      min-height: 56px;
      width: 100%;
      box-sizing: border-box;
    `;
    
    const faviconHtml = bookmark.favicon ? 
      `<img src="${bookmark.favicon}" style="width: 20px; height: 20px; border-radius: 3px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div style="display: none; color: #666; font-size: 16px; width: 20px; height: 20px; align-items: center; justify-content: center;">🌐</div>` :
      `<div style="color: #666; font-size: 16px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">🌐</div>`;

    item.innerHTML = `
      <div style="width: 32px; height: 32px; background: #222; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #333;">
        ${faviconHtml}
      </div>
      
      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; max-width: 280px;">
            ${escapeHtml(bookmark.title)}
          </div>
          <div style="background: #333; color: #ccc; padding: 2px 6px; border-radius: 4px; font-size: 10px; flex-shrink: 0;">
            ${categories.get(bookmark.category)?.icon || '📁'}
          </div>
        </div>
        
        <div style="font-size: 11px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">
          ${bookmark.domain}
        </div>
      </div>
      
      <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
        <button onclick="window.open('${escapeHtml(bookmark.url)}', '_blank')" style="padding: 6px 10px; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; background: #333; color: #fff; font-weight: 500; transition: all 0.2s; min-width: 45px;">
          Open
        </button>
      </div>
    `;
    
    // Enhanced hover effects
    item.addEventListener('mouseenter', () => {
      console.log('List item mouseenter triggered for:', bookmark.title);
      item.style.borderColor = '#444';
      item.style.background = '#222';
      item.style.transform = 'translateX(2px)';
      item.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    });
    
    item.addEventListener('mouseleave', () => {
      console.log('List item mouseleave triggered for:', bookmark.title);
      item.style.borderColor = '#222';
      item.style.background = '#111';
      item.style.transform = 'translateX(0)';
      item.style.boxShadow = 'none';
    });
    
    // Click to open (except on buttons)
    item.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.open(bookmark.url, '_blank');
      }
    });
    
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
  
  console.log('Event listeners set up successfully');
}

console.log('=== SAFIS WINDOW SETUP COMPLETE ===');