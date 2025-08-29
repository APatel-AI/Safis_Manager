// Safis Complete Modal Injector - Full featured bookmark manager
console.log('=== SAFIS COMPLETE MODAL INJECTOR LOADED ===');

// Check if modal already exists
if (document.querySelector('#safis-modal')) {
  console.log('Modal already exists, toggling visibility');
  const existingModal = document.querySelector('#safis-modal');
  existingModal.style.display = existingModal.style.display === 'none' ? 'block' : 'none';
} else {
  console.log('Creating new modal');
  createSafisModal();
}

function createSafisModal() {
  // Global variables
  let isDragging = false;
  let startX, startY, initialX, initialY;
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

  // Create modal element
  const modal = document.createElement('div');
  modal.id = 'safis-modal';
  modal.style.cssText = `
    position: fixed !important;
    top: 40px !important;
    right: 40px !important;
    width: 800px !important;
    height: 600px !important;
    background: #1F1E1D !important;
    border: 1px solid #3E3A35 !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
    color: #C2C0B6 !important;
    display: flex !important;
    overflow: hidden !important;
    backdrop-filter: blur(20px) !important;
  `;

  modal.innerHTML = `
    <!-- Slim Sidebar Navigation -->
    <div id="sidebar" style="width: 60px; background: #000; border-right: 1px solid #222; display: flex; flex-direction: column; border-radius: 16px 0 0 16px; transition: all 0.3s ease;">
      <!-- Sidebar Icons -->
      <div style="display: flex; flex-direction: column; align-items: center; padding: 16px 0; flex: 1;">
        <!-- Logo -->
        <div id="modal-header" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; cursor: grab; border-radius: 8px; transition: all 0.2s;">
          <div style="font-size: 24px;">🤓</div>
        </div>
        
        <!-- Search Icon -->
        <div id="search-icon" class="sidebar-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; cursor: pointer; border-radius: 8px; transition: all 0.2s; color: #666;" title="Search bookmarks">
          <div style="font-size: 20px;">🔍</div>
        </div>
        
        <!-- Add Bookmark Icon -->
        <div id="add-icon" class="sidebar-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; cursor: pointer; border-radius: 8px; transition: all 0.2s; color: #666;" title="Add current page">
          <div style="font-size: 20px;">➕</div>
        </div>
        
        <!-- Categories -->
        <div style="width: 2px; height: 20px; background: #333; margin: 16px 0; border-radius: 1px;"></div>
        
        <div id="category-all-icon" class="sidebar-icon active" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; cursor: pointer; border-radius: 8px; transition: all 0.2s; color: #fff; background: #222;" title="All bookmarks">
          <div style="font-size: 18px;">📚</div>
        </div>
        
        <div id="category-work-icon" class="sidebar-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; cursor: pointer; border-radius: 8px; transition: all 0.2s; color: #666;" title="Work">
          <div style="font-size: 18px;">💼</div>
        </div>
        
        <div id="category-personal-icon" class="sidebar-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; cursor: pointer; border-radius: 8px; transition: all 0.2s; color: #666;" title="Personal">
          <div style="font-size: 18px;">👤</div>
        </div>
        
        <div id="category-learning-icon" class="sidebar-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; cursor: pointer; border-radius: 8px; transition: all 0.2s; color: #666;" title="Learning">
          <div style="font-size: 18px;">🎓</div>
        </div>
      </div>
      
      <!-- View Toggle at Bottom -->
      <div style="padding: 16px; border-top: 1px solid #222;">
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
          <div id="grid-view" class="view-icon active" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; transition: all 0.2s; background: #222; color: #fff;" title="Grid view">
            <div style="font-size: 16px;">⊞</div>
          </div>
          <div id="list-view" class="view-icon" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; transition: all 0.2s; color: #666;" title="List view">
            <div style="font-size: 16px;">☰</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div id="main-content" style="flex: 1; display: flex; flex-direction: column; background: #111; border-radius: 0 16px 16px 0; position: relative;">
      <!-- Close Button -->
      <button id="safis-close" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border: none; background: #222; color: #666; cursor: pointer; font-size: 18px; border-radius: 8px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center;">×</button>
      
      <!-- Content Header -->
      <div id="content-header" style="padding: 20px 24px 20px 24px; border-bottom: 1px solid #222; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 id="content-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #fff;">All Bookmarks</h2>
          <p id="content-subtitle" style="margin: 4px 0 0 0; font-size: 13px; color: #666;">Your bookmark collection</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="sort-date" class="sort-btn active" style="padding: 6px 12px; border: none; background: #222; color: #fff; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">Recent</button>
          <button id="sort-name" class="sort-btn" style="padding: 6px 12px; border: none; background: transparent; color: #666; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">A-Z</button>
        </div>
      </div>

      <!-- Bookmarks Container -->
      <div id="bookmarks-container" style="flex: 1; padding: 24px; overflow-y: auto; min-height: 300px;">
        <div id="bookmarks-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px;">
          <div id="bookmarks-loading" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 14px; padding: 60px 0; text-align: center;">
            <div style="width: 48px; height: 48px; border: 3px solid #333; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
            <div>Loading your bookmarks...</div>
          </div>
        </div>
        <div id="bookmarks-list" style="display: none; min-height: 200px;">
          <!-- List view content -->
        </div>
      </div>
    </div>

    <!-- Search Popup -->
    <div id="search-popup" style="position: absolute; top: 70px; left: 80px; width: 350px; background: #000; border: 1px solid #333; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.8); z-index: 200; display: none; overflow: hidden;">
      <div style="padding: 16px;">
        <div style="position: relative;">
          <input id="search-input" type="text" placeholder="Search bookmarks..." style="width: 100%; padding: 12px 16px 12px 40px; background: #111; border: 1px solid #333; border-radius: 8px; color: #fff; font-size: 14px; outline: none; transition: all 0.2s;">
          <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #666; font-size: 16px;">🔍</div>
        </div>
      </div>
      <div id="search-results" style="max-height: 300px; overflow-y: auto; border-top: 1px solid #333;">
        <div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">Start typing to search...</div>
      </div>
    </div>

  `;

  // Add CSS animations and responsive styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Scrollbar styling */
    #safis-modal::-webkit-scrollbar {
      width: 6px;
    }
    
    #safis-modal::-webkit-scrollbar-track {
      background: #111;
      border-radius: 3px;
    }
    
    #safis-modal::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 3px;
    }
    
    #safis-modal::-webkit-scrollbar-thumb:hover {
      background: #444;
    }
    
    /* Sidebar icon hover effects */
    .sidebar-icon:hover {
      background: #222 !important;
      color: #fff !important;
      transform: scale(1.05);
    }
    
    .sidebar-icon.active {
      background: #333 !important;
      color: #fff !important;
    }
    
    /* View icon hover effects */
    .view-icon:hover {
      background: #333 !important;
      color: #fff !important;
    }
    
    .view-icon.active {
      background: #444 !important;
      color: #fff !important;
    }
    
    /* Sort button hover effects */
    .sort-btn:hover {
      background: #333 !important;
      color: #fff !important;
    }
    
    .sort-btn.active {
      background: #444 !important;
      color: #fff !important;
    }
    
    /* Close button hover */
    #safis-close:hover {
      background: #333 !important;
      color: #fff !important;
      transform: scale(1.1);
    }
    
    /* Search input focus */
    #search-input:focus {
      border-color: #444 !important;
      box-shadow: 0 0 0 2px rgba(255,255,255,0.1) !important;
    }
    
    /* Search popup animation */
    #search-popup.show {
      display: block !important;
      animation: slideIn 0.2s ease-out;
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0; 
        transform: translateY(-10px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    
    /* Responsive design */
    @media (max-width: 900px) {
      #safis-modal {
        width: 90vw !important;
        height: 80vh !important;
        top: 10vh !important;
        right: 5vw !important;
      }
      
      #bookmarks-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
      }
    }
    
    @media (max-width: 600px) {
      #safis-modal {
        width: 95vw !important;
        height: 85vh !important;
        top: 7.5vh !important;
        right: 2.5vw !important;
      }
      
      #sidebar {
        width: 50px !important;
      }
      
      #search-popup {
        width: 280px !important;
        left: 60px !important;
      }
      
      #bookmarks-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
        gap: 12px !important;
      }
      
      #bookmarks-container {
        padding: 16px !important;
      }
      
      #content-header {
        padding: 16px !important;
      }
    }
    
    /* Bookmark card hover effects */
    .bookmark-card {
      transition: all 0.2s ease !important;
    }
    
    .bookmark-card:hover {
      transform: translateY(-2px) scale(1.02) !important;
      box-shadow: 0 8px 25px rgba(0,0,0,0.4) !important;
    }
    
    .bookmark-list-item {
      transition: all 0.2s ease !important;
    }
    
    .bookmark-list-item:hover {
      background: #222 !important;
      transform: translateX(4px) !important;
    }
  `;
  document.head.appendChild(style);

  // Add modal to page
  document.body.appendChild(modal);
  
  console.log('Complete modal HTML created and added to page');
  console.log('Modal dimensions:', modal.style.width, 'x', modal.style.height);
  
  // Check if elements exist
  const gridContainer = modal.querySelector('#bookmarks-grid');
  const listContainer = modal.querySelector('#bookmarks-list');
  
  console.log('Grid container found:', !!gridContainer);
  console.log('List container found:', !!listContainer);

  // Initialize functionality with delay to ensure DOM is ready
  setTimeout(() => {
    setupEventListeners();
    loadBookmarks();
  }, 50);

  // Complete event listeners setup
  function setupEventListeners() {
    console.log('Setting up complete event listeners...');
    
    // Close button
    modal.querySelector('#safis-close').addEventListener('click', () => {
      modal.remove();
    });

    // Dragging functionality
    const header = modal.querySelector('#modal-header');
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = modal.offsetLeft;
      initialY = modal.offsetTop;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = Math.max(0, Math.min(initialX + deltaX, window.innerWidth - modal.offsetWidth));
      const newY = Math.max(0, Math.min(initialY + deltaY, window.innerHeight - modal.offsetHeight));
      
      modal.style.left = newX + 'px';
      modal.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      header.style.cursor = 'grab';
    });

    // Search functionality
    const searchInput = modal.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterBookmarks(e.target.value);
      });
    }

    // Search icon functionality
    const searchIcon = modal.querySelector('#search-icon');
    if (searchIcon) {
      searchIcon.addEventListener('click', () => {
        const popup = modal.querySelector('#search-popup');
        const input = modal.querySelector('#search-input');
      
      if (popup.style.display === 'none' || !popup.style.display) {
        popup.style.display = 'block';
        popup.classList.add('show');
        input.focus();
      } else {
        popup.style.display = 'none';
        popup.classList.remove('show');
        input.value = '';
        // Reset search results
        displayBookmarks(allBookmarks);
        }
      });
    }

    // Close search popup when clicking outside
    document.addEventListener('click', (e) => {
      const popup = modal.querySelector('#search-popup');
      const searchIcon = modal.querySelector('#search-icon');
      
      if (!popup.contains(e.target) && !searchIcon.contains(e.target)) {
        popup.style.display = 'none';
        popup.classList.remove('show');
      }
    });

    // Search input functionality (inside popup)
    const searchInputPopup = modal.querySelector('#search-input');
    if (searchInputPopup) {
      searchInputPopup.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const resultsContainer = modal.querySelector('#search-results');
      
      if (searchTerm === '') {
        resultsContainer.innerHTML = '<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">Start typing to search...</div>';
        displayBookmarks(allBookmarks);
        return;
      }
      
      const filteredBookmarks = allBookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchTerm) ||
        bookmark.url.toLowerCase().includes(searchTerm) ||
        bookmark.domain.toLowerCase().includes(searchTerm) ||
        bookmark.category.toLowerCase().includes(searchTerm)
      );
      
      displayBookmarks(filteredBookmarks);
      
      // Update search results popup
      if (filteredBookmarks.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">No bookmarks found</div>';
      } else {
        resultsContainer.innerHTML = `<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">Found ${filteredBookmarks.length} bookmark${filteredBookmarks.length !== 1 ? 's' : ''}</div>`;
      }
      });
    }

    // Add bookmark icon functionality
    const addIcon = modal.querySelector('#add-icon');
    if (addIcon) {
      addIcon.addEventListener('click', async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'ADD_BOOKMARK',
          title: document.title,
          url: window.location.href
        });
        
        if (response && response.success) {
          console.log('Bookmark added successfully');
          showNotification('Bookmark added successfully!', 'success');
          loadBookmarks();
        }
      } catch (error) {
        console.error('Failed to add bookmark:', error);
        showNotification('Failed to add bookmark', 'error');
      }
      });
    }

    // Category icon event listeners
    const categoryAllIcon = modal.querySelector('#category-all-icon');
    if (categoryAllIcon) {
      categoryAllIcon.addEventListener('click', () => {
        currentCategory = 'all';
        updateCategorySelection();
        filterAndDisplayBookmarks();
      });
    }

    const categoryWorkIcon = modal.querySelector('#category-work-icon');
    if (categoryWorkIcon) {
      categoryWorkIcon.addEventListener('click', () => {
        currentCategory = 'Work';
        updateCategorySelection();
        filterAndDisplayBookmarks();
      });
    }

    const categoryPersonalIcon = modal.querySelector('#category-personal-icon');
    if (categoryPersonalIcon) {
      categoryPersonalIcon.addEventListener('click', () => {
        currentCategory = 'Personal';
        updateCategorySelection();
        filterAndDisplayBookmarks();
      });
    }

    const categoryLearningIcon = modal.querySelector('#category-learning-icon');
    if (categoryLearningIcon) {
      categoryLearningIcon.addEventListener('click', () => {
        currentCategory = 'Learning';
        updateCategorySelection();
        filterAndDisplayBookmarks();
      });
    }

    // View toggle icons
    const gridViewBtn = modal.querySelector('#grid-view');
    console.log('Grid view button found:', !!gridViewBtn);
    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        const gridContainer = modal.querySelector('#bookmarks-grid');
        const listContainer = modal.querySelector('#bookmarks-list');
        const listViewBtnRef = modal.querySelector('#list-view');
        if (gridContainer) gridContainer.style.display = 'grid';
        if (listContainer) listContainer.style.display = 'none';
        gridViewBtn.classList.add('active');
        if (listViewBtnRef) listViewBtnRef.classList.remove('active');
      });
    }

    const listViewBtn = modal.querySelector('#list-view');
    console.log('List view button found:', !!listViewBtn);
    if (listViewBtn) {
      listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        const gridContainer = modal.querySelector('#bookmarks-grid');
        const listContainer = modal.querySelector('#bookmarks-list');
        const gridViewBtn = modal.querySelector('#grid-view');
        if (gridContainer) gridContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        if (gridViewBtn) gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
        displayBookmarks(filteredBookmarks);
      });
    }

    // Sort buttons
    const sortDateBtn = modal.querySelector('#sort-date');
    if (sortDateBtn) {
      sortDateBtn.addEventListener('click', () => {
        currentSort = 'date';
        sortDateBtn.style.background = '#34312D';
        sortDateBtn.style.color = '#C2C0B6';
        const sortNameBtn = modal.querySelector('#sort-name');
        if (sortNameBtn) {
          sortNameBtn.style.background = 'transparent';
          sortNameBtn.style.color = '#9B9690';
        }
        sortBookmarks();
        displayBookmarks();
      });
    }

    const sortNameBtn = modal.querySelector('#sort-name');
    if (sortNameBtn) {
      sortNameBtn.addEventListener('click', () => {
        currentSort = 'name';
        sortNameBtn.style.background = '#34312D';
        sortNameBtn.style.color = '#C2C0B6';
        const sortDateBtn = modal.querySelector('#sort-date');
        if (sortDateBtn) {
          sortDateBtn.style.background = 'transparent';
          sortDateBtn.style.color = '#9B9690';
        }
        sortBookmarks();
        displayBookmarks();
      });
    }

    // This line is removed as #category-all doesn't exist in this modal structure

    // Hide preview on scroll
    const bookmarksContainer = modal.querySelector('#bookmarks-container');
    if (bookmarksContainer) {
      bookmarksContainer.addEventListener('scroll', () => {
        // hideBookmarkPreview(); // Function not needed in this version
      });
    }
    
    console.log('Complete event listeners attached');
  }

  // Load bookmarks function with enhanced processing
  async function loadBookmarks() {
    console.log('Loading bookmarks with enhanced processing...');
    try {
      // Check if chrome.runtime is available
      if (!chrome || !chrome.runtime) {
        throw new Error('Chrome extension runtime not available');
      }
      
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
        const loadingDiv = modal.querySelector('#bookmarks-loading');
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
      const loadingDiv = modal.querySelector('#bookmarks-loading');
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
      
      sortBookmarks();
      filterBookmarks();
      
      console.log('Bookmark loading completed successfully');
      
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      const loadingDiv = modal.querySelector('#bookmarks-loading');
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

  // Enhanced category detection
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

  // Utility functions
  function getFaviconUrl(url) {
    try {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return null;
      }
      
      const domain = new URL(url).hostname;
      if (!domain || domain === '') {
        return null;
      }
      
      // Only try to load favicons if we're online
      if (navigator.onLine) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } else {
        // Return null when offline to avoid network requests
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

  // Update category list
  function updateCategoryList() {
    const container = modal.querySelector('#categories-list');
    const allCount = allBookmarks.length;
    
    // Update "All" category count
    modal.querySelector('#count-all').textContent = allCount;
    
    // Add category items
    categories.forEach((info, category) => {
      if (info.count > 0) {
        let categoryEl = modal.querySelector(`#category-${category.toLowerCase()}`);
        if (!categoryEl) {
          categoryEl = document.createElement('div');
          categoryEl.id = `category-${category.toLowerCase()}`;
          categoryEl.className = 'category-item';
          categoryEl.style.cssText = `
            padding: 10px 12px;
            margin-bottom: 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: transparent;
            color: #9B9690;
            display: flex;
            align-items: center;
            justify-content: space-between;
          `;
          
          categoryEl.innerHTML = `
            <span>${info.icon} ${category}</span>
            <span style="background: #3E3A35; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${info.count}</span>
          `;
          
          categoryEl.addEventListener('click', () => selectCategory(category.toLowerCase()));
          container.appendChild(categoryEl);
        } else {
          categoryEl.querySelector('span:last-child').textContent = info.count;
        }
      }
    });
  }

  // Select category
  function selectCategory(category) {
    currentCategory = category;
    
    // Update active state
    modal.querySelectorAll('.category-item').forEach(el => {
      el.style.background = 'transparent';
      el.style.color = '#9B9690';
    });
    
    const activeEl = modal.querySelector(`#category-${category}`);
    if (activeEl) {
      activeEl.style.background = '#667eea';
      activeEl.style.color = 'white';
    }
    
    filterBookmarks();
  }

  // Display bookmarks with proper rendering
  function displayBookmarks() {
    console.log('Displaying bookmarks, filtered count:', filteredBookmarks.length);
    console.log('Current view:', currentView);
    
    const gridContainer = modal.querySelector('#bookmarks-grid');
    const listContainer = modal.querySelector('#bookmarks-list');
    
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
      listContainer.style.display = 'block';
      displayListView();
    }
  }

  // Display enhanced grid view with preview
  function displayGridView() {
    console.log('Displaying enhanced grid view');
    const container = modal.querySelector('#bookmarks-grid');
    
    if (!container) {
      console.error('Grid container not found');
      return;
    }
    
    container.innerHTML = '';
    console.log('Filtered bookmarks for grid:', filteredBookmarks.length);
    
    if (filteredBookmarks.length === 0) {
      const emptyMessage = allBookmarks.length === 0 ? 'No bookmarks saved yet' : 'No bookmarks found';
      const emptySubtext = allBookmarks.length === 0 ? 'Click "+ Add Current Page" to save your first bookmark' : 'Try adjusting your search or category filter';
      
      container.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9B9690; font-size: 14px; padding: 60px 20px; text-align: center;">
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
      });
      
      card.addEventListener('mouseleave', () => {
        console.log('Grid card mouseleave triggered for:', bookmark.title);
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = 'none';
        card.style.borderColor = '#3E3A35';
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

  // Display enhanced list view with preview
  function displayListView() {
    console.log('Displaying enhanced list view');
    const container = modal.querySelector('#bookmarks-list');
    
    if (!container) {
      console.error('List container not found');
      return;
    }
    
    container.innerHTML = '';
    console.log('Filtered bookmarks for list:', filteredBookmarks.length);
    
    // Set proper styling for list container
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      height: 100%;
      overflow-y: auto;
    `;
    
    if (filteredBookmarks.length === 0) {
      const emptyMessage = allBookmarks.length === 0 ? 'No bookmarks saved yet' : 'No bookmarks found';
      const emptySubtext = allBookmarks.length === 0 ? 'Click "+ Add Current Page" to save your first bookmark' : 'Try adjusting your search or category filter';
      
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9B9690; font-size: 14px; padding: 60px 20px; text-align: center;">
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
         <div style="display: none; color: #9B9690; font-size: 16px; width: 20px; height: 20px; align-items: center; justify-content: center;">🌐</div>` :
        `<div style="color: #9B9690; font-size: 16px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">🌐</div>`;

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
    const categoryIcons = modal.querySelectorAll('.sidebar-icon');
    categoryIcons.forEach(icon => {
      if (icon.id.includes('category-')) {
        icon.classList.remove('active');
        icon.style.background = 'transparent';
        icon.style.color = '#666';
      }
    });

    // Activate selected category
    let activeIconId = 'category-all-icon';
    if (currentCategory === 'Work') activeIconId = 'category-work-icon';
    else if (currentCategory === 'Personal') activeIconId = 'category-personal-icon';
    else if (currentCategory === 'Learning') activeIconId = 'category-learning-icon';

    const activeIcon = modal.querySelector(`#${activeIconId}`);
    if (activeIcon) {
      activeIcon.classList.add('active');
      activeIcon.style.background = '#333';
      activeIcon.style.color = '#fff';
    }

    // Update content title
    const title = currentCategory === 'all' ? 'All Bookmarks' : `${currentCategory} Bookmarks`;
    modal.querySelector('#content-title').textContent = title;
  }

  function filterAndDisplayBookmarks() {
    filteredBookmarks = currentCategory === 'all' 
      ? allBookmarks 
      : allBookmarks.filter(bookmark => bookmark.category === currentCategory);
    
    displayBookmarks(filteredBookmarks);
  }

  // Helper function to get category icon
  function getCategoryIcon(category) {
    const icons = {
      'Work': '💼',
      'Personal': '👤', 
      'Learning': '📚',
      'Entertainment': '🎬',
      'Shopping': '🛒',
      'News': '📰',
      'Social': '👥'
    };
    return icons[category] || '📁';
  }

  // Smart metadata generation for website previews
  function generateSmartMetadata(bookmark) {
    const domain = bookmark.domain.toLowerCase();
    
    // Smart descriptions based on popular domains
    const domainInfo = {
      'github.com': {
        description: 'Code repository and collaboration platform. Find open source projects, contribute to development, and manage your code with version control.',
        tags: ['Development', 'Git', 'Code', 'Open Source'],
        color: '#333'
      },
      'stackoverflow.com': {
        description: 'Programming Q&A community. Get help with coding problems, share knowledge, and learn from developers worldwide.',
        tags: ['Programming', 'Q&A', 'Development', 'Help'],
        color: '#f48024'
      },
      'youtube.com': {
        description: 'Video sharing platform. Watch, upload, and share videos on any topic from entertainment to education.',
        tags: ['Video', 'Entertainment', 'Learning', 'Content'],
        color: '#ff0000'
      },
      'wikipedia.org': {
        description: 'Free online encyclopedia. Access millions of articles on every topic, written collaboratively by volunteers.',
        tags: ['Knowledge', 'Reference', 'Education', 'Facts'],
        color: '#000'
      },
      'medium.com': {
        description: 'Publishing platform for writers and readers. Discover stories, thinking, and expertise from writers on any topic.',
        tags: ['Articles', 'Writing', 'Publishing', 'Stories'],
        color: '#00ab6c'
      },
      'linkedin.com': {
        description: 'Professional networking platform. Build your career, connect with professionals, and discover opportunities.',
        tags: ['Professional', 'Networking', 'Career', 'Business'],
        color: '#0077b5'
      },
      'google.com': {
        description: 'Search engine and technology services. Find information, use productivity tools, and access Google services.',
        tags: ['Search', 'Tools', 'Information', 'Technology'],
        color: '#4285f4'
      },
      'amazon.com': {
        description: 'Online marketplace and cloud services. Shop for products, use AWS services, and access digital content.',
        tags: ['Shopping', 'E-commerce', 'Cloud', 'Products'],
        color: '#ff9900'
      }
    };
    
    // Check for domain match
    const matchedDomain = Object.keys(domainInfo).find(d => domain.includes(d));
    if (matchedDomain) {
      return domainInfo[matchedDomain];
    }
    
    // Category-based fallback
    const categoryInfo = {
      'Learning': {
        description: 'Educational content and learning resources to expand your knowledge and skills.',
        tags: ['Education', 'Learning', 'Knowledge', 'Skills'],
        color: '#00b5d8'
      },
      'Work': {
        description: 'Professional tools and resources to boost productivity and manage work tasks.',
        tags: ['Business', 'Professional', 'Tools', 'Productivity'],
        color: '#667eea'
      },
      'Entertainment': {
        description: 'Entertainment content including videos, games, music, and media.',
        tags: ['Fun', 'Media', 'Entertainment', 'Content'],
        color: '#e53e3e'
      },
      'Shopping': {
        description: 'Online shopping destinations for products, deals, and e-commerce.',
        tags: ['Shopping', 'Products', 'Commerce', 'Deals'],
        color: '#9f7aea'
      },
      'News': {
        description: 'Latest news, current events, and information from reliable sources.',
        tags: ['News', 'Current Events', 'Updates', 'Information'],
        color: '#d69e2e'
      },
      'Social': {
        description: 'Social media platforms for connecting, sharing, and communicating.',
        tags: ['Social', 'Communication', 'Community', 'Sharing'],
        color: '#38a169'
      }
    };
    
    return categoryInfo[bookmark.category] || {
      description: `Visit ${bookmark.domain} - ${bookmark.title}`,
      tags: ['Website', bookmark.category || 'General'],
      color: '#667eea'
    };
  }

  function showMetadataPreview(metadata, bookmark, loadingEl) {
    const preview = modal.querySelector('#bookmark-preview');
    const contentInfo = preview.querySelector('#preview-content-info');
    const description = preview.querySelector('#preview-description');
    const tags = preview.querySelector('#preview-tags');
    
    // Update content
    description.textContent = metadata.description;
    
    // Clear and add tags
    tags.innerHTML = '';
    metadata.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.style.cssText = `
        background: rgba(255,255,255,0.2);
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 9px;
        white-space: nowrap;
      `;
      tagEl.textContent = tag;
      tags.appendChild(tagEl);
    });
    
    // Update gradient color
    if (metadata.color) {
      contentInfo.style.background = `linear-gradient(135deg, ${metadata.color}dd 0%, #764ba2 100%)`;
    }
    
    // Show the preview
    loadingEl.style.display = 'none';
    contentInfo.style.display = 'block';
    
    // Add click handler to open site
    contentInfo.onclick = (e) => {
      e.stopPropagation();
      window.open(bookmark.url, '_blank');
    };
  }

  // Get category color
  function getCategoryColor(category) {
    const colors = {
      work: '#667eea',
      personal: '#38a169',
      learning: '#00b5d8',
      entertainment: '#e53e3e',
      shopping: '#9f7aea',
      news: '#d69e2e',
      social: '#38a169'
    };
    return colors[category.toLowerCase()] || colors.personal;
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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  console.log('=== SAFIS COMPLETE MODAL SETUP COMPLETE ===');
}