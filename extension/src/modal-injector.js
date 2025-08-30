// Safis Enhanced Overlay - Simplified version
console.log('=== SAFIS ENHANCED OVERLAY LOADED ===');

// Check if modal already exists
if (document.querySelector('#safis-overlay')) {
  console.log('Overlay already exists, toggling visibility');
  const existingOverlay = document.querySelector('#safis-overlay');
  existingOverlay.style.display = existingOverlay.style.display === 'none' ? 'flex' : 'none';
} else {
  console.log('Creating new overlay');
  createSafisOverlay();
}

function createSafisOverlay() {
  // Global variables
  let allBookmarks = [];
  let filteredBookmarks = [];
  let currentCategory = 'all';
  let currentView = 'grid';
  let currentSort = 'date';
  let customFolders = [];
  let currentMode = 'categories';
  
  const categories = new Map([
    ['Work', { icon: '💼', count: 0 }],
    ['Personal', { icon: '🏠', count: 0 }],
    ['Learning', { icon: '🎓', count: 0 }],
    ['Entertainment', { icon: '🎬', count: 0 }],
    ['Shopping', { icon: '🛒', count: 0 }],
    ['News', { icon: '📰', count: 0 }],
    ['Social', { icon: '👥', count: 0 }]
  ]);

  // Create overlay background
  const overlay = document.createElement('div');
  overlay.id = 'safis-overlay';
  overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0, 0, 0, 0.7) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 2147483647 !important; backdrop-filter: blur(8px) !important;';

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'safis-modal';
  modal.style.cssText = 'width: 850px !important; height: 580px !important; max-width: 95vw !important; max-height: 90vh !important; background: #1a1a1a !important; border: 1px solid #333 !important; border-radius: 12px !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif !important; color: #e5e5e5 !important; display: flex !important; overflow: hidden !important; backdrop-filter: blur(20px) !important; position: relative !important;';

  // Create modal content
  modal.innerHTML = createModalHTML();

  // Add styles
  const style = document.createElement('style');
  style.textContent = createModalCSS();
  document.head.appendChild(style);

  // Assemble and display
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  console.log('Enhanced overlay created');
  
  // Setup functionality
  setupEventListeners();
  loadBookmarks();
  loadCustomFolders();

  // HTML template function
  function createModalHTML() {
    return `
      
      <div id="sidebar" style="width: 50px; background: #111; border-right: 1px solid #2a2a2a; display: flex; flex-direction: column; border-radius: 12px 0 0 12px; padding: 12px 0;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <div id="modal-header" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: grab; border-radius: 6px; transition: all 0.2s; background: rgba(102, 126, 234, 0.15); margin-bottom: 10px;">
            <img src="${chrome.runtime.getURL('assets/glasses_emoji.png')}" style="width: 18px; height: 18px;" alt="Safis">
          </div>
          <div id="search-icon" class="sidebar-icon" title="Search">
            <div class="icon-search"></div>
          </div>
          <div id="add-icon" class="sidebar-icon" title="Add page">
            <div class="icon-plus"></div>
          </div>
          <div style="width: 2px; height: 16px; background: #333; margin: 6px 0; border-radius: 1px;"></div>
          <div id="category-all-icon" class="sidebar-icon active" title="All">
            <div class="icon-list"></div>
          </div>
          <div id="my-folders-icon" class="sidebar-icon" title="Folders">
            <div class="icon-folder"></div>
          </div>
          <div id="category-work-icon" class="sidebar-icon" title="Work">
            <div class="icon-briefcase"></div>
          </div>
          <div id="category-personal-icon" class="sidebar-icon" title="Personal">
            <div class="icon-home"></div>
          </div>
          <div id="category-learning-icon" class="sidebar-icon" title="Learning">
            <div class="icon-graduation"></div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #2a2a2a;">
          <div id="grid-view" class="view-icon active" title="Grid">
            <div class="icon-grid"></div>
          </div>
          <div id="list-view" class="view-icon" title="List">
            <div class="icon-list-view"></div>
          </div>
        </div>
      </div>
      
      <div id="main-content" style="flex: 1; display: flex; flex-direction: column; background: #1a1a1a; border-radius: 0 12px 12px 0;">
        <div id="content-header" style="padding: 16px 20px 12px 20px; border-bottom: 1px solid #2a2a2a; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 id="content-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #fff;">All Bookmarks</h2>
            <p id="content-subtitle" style="margin: 2px 0 0 0; font-size: 12px; color: #888;">Organize and access your saved links</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button id="sort-date" class="sort-btn active">Recent</button>
            <button id="sort-name" class="sort-btn">A-Z</button>
          </div>
        </div>
        <div id="bookmarks-container" style="flex: 1; padding: 16px; overflow-y: auto; position: relative;">
          <div id="bookmarks-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding-bottom: 120px;">
            <div id="bookmarks-loading" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 14px; padding: 60px 0; text-align: center;">
              <div style="width: 32px; height: 32px; border: 3px solid #333; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
              <div>Loading your bookmarks...</div>
            </div>
          </div>
          <div id="bookmarks-list" style="display: none; flex-direction: column; gap: 6px; overflow-y: auto; max-height: calc(100% - 20px); padding-bottom: 120px;"></div>
        </div>
      </div>
      
      <div id="search-popup" style="position: absolute; top: 70px; left: 80px; width: 380px; background: linear-gradient(135deg, rgba(26, 26, 26, 0.98), rgba(34, 34, 34, 0.98)); border: 1px solid #444; border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1); z-index: 500; display: none; overflow: hidden; backdrop-filter: blur(24px);">
        <div style="padding: 20px;">
          <div style="position: relative;">
            <input id="search-input" type="text" placeholder="Search your bookmarks..." style="width: 100%; padding: 14px 20px 14px 48px; background: rgba(255, 255, 255, 0.08); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 12px; color: #fff; font-size: 14px; outline: none; transition: all 0.3s ease; font-weight: 400;">
            <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;"><div class="icon-search" style="color: #667eea;"></div></div>
          </div>
        </div>
        <div id="search-results" style="max-height: 320px; overflow-y: auto; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="padding: 24px; color: #888; font-size: 14px; text-align: center; font-weight: 400;">Start typing to search your bookmarks...</div>
        </div>
      </div>
    `;
  }

  function createModalCSS() {
    return `
      @keyframes spin { to { transform: rotate(360deg); } }
      
      /* React-style Icons */
      [class^="icon-"] {
        width: 20px;
        height: 20px;
        position: relative;
        color: #666;
        transition: color 0.2s ease;
      }
      
      /* Search Icon */
      .icon-search::before {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        border: 2px solid currentColor;
        border-radius: 50%;
        top: 1px;
        left: 1px;
      }
      .icon-search::after {
        content: '';
        position: absolute;
        width: 2px;
        height: 6px;
        background: currentColor;
        transform: rotate(45deg);
        top: 9px;
        left: 9px;
        border-radius: 1px;
      }
      
      /* Plus Icon */
      .icon-plus::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 2px;
        background: currentColor;
        top: 7px;
        left: 2px;
        border-radius: 1px;
      }
      .icon-plus::after {
        content: '';
        position: absolute;
        width: 2px;
        height: 12px;
        background: currentColor;
        top: 2px;
        left: 7px;
        border-radius: 1px;
      }
      
      /* List Icon */
      .icon-list::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 2px;
        background: currentColor;
        top: 2px;
        left: 2px;
        border-radius: 1px;
        box-shadow: 0 4px 0 currentColor, 0 8px 0 currentColor, 0 12px 0 currentColor;
      }
      
      /* Folder Icon */
      .icon-folder::before {
        content: '';
        position: absolute;
        width: 4px;
        height: 2px;
        background: currentColor;
        top: 4px;
        left: 2px;
        border-radius: 1px 1px 0 0;
      }
      .icon-folder::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 8px;
        border: 2px solid currentColor;
        border-radius: 0 2px 2px 2px;
        top: 6px;
        left: 2px;
        background: transparent;
      }
      
      /* Briefcase Icon */
      .icon-briefcase::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 8px;
        border: 2px solid currentColor;
        border-radius: 2px;
        top: 6px;
        left: 2px;
        background: transparent;
      }
      .icon-briefcase::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 4px;
        border: 2px solid currentColor;
        border-bottom: none;
        border-radius: 2px 2px 0 0;
        top: 4px;
        left: 5px;
        background: transparent;
      }
      
      /* Home Icon */
      .icon-home::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid currentColor;
        top: 2px;
        left: 2px;
      }
      .icon-home::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 6px;
        background: currentColor;
        top: 8px;
        left: 4px;
        border-radius: 0 0 2px 2px;
      }
      
      /* Graduation Icon */
      .icon-graduation::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 4px solid currentColor;
        top: 4px;
        left: 2px;
      }
      .icon-graduation::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 2px;
        background: currentColor;
        top: 8px;
        left: 2px;
        border-radius: 1px;
      }
      
      /* Grid Icon */
      .icon-grid {
        width: 14px;
        height: 14px;
      }
      .icon-grid::before {
        content: '';
        position: absolute;
        width: 5px;
        height: 5px;
        background: currentColor;
        top: 1px;
        left: 1px;
        border-radius: 1px;
        box-shadow: 8px 0 0 currentColor, 0 8px 0 currentColor, 8px 8px 0 currentColor;
      }
      
      /* List View Icon */
      .icon-list-view {
        width: 14px;
        height: 14px;
      }
      .icon-list-view::before {
        content: '';
        position: absolute;
        width: 10px;
        height: 2px;
        background: currentColor;
        top: 2px;
        left: 2px;
        border-radius: 1px;
        box-shadow: 0 4px 0 currentColor, 0 8px 0 currentColor;
      }
      .icon-list-view::after {
        content: '';
        position: absolute;
        width: 2px;
        height: 2px;
        background: currentColor;
        top: 2px;
        left: 0;
        border-radius: 50%;
        box-shadow: 0 4px 0 currentColor, 0 8px 0 currentColor;
      }
      
      /* Bookmark Icon */
      .icon-bookmark::before {
        content: '';
        position: absolute;
        width: 8px;
        height: 12px;
        background: currentColor;
        top: 2px;
        left: 4px;
        border-radius: 2px 2px 0 0;
      }
      .icon-bookmark::after {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-left: 4px solid currentColor;
        border-right: 4px solid currentColor;
        border-top: 3px solid transparent;
        top: 14px;
        left: 4px;
      }
      
      /* Three Dots Icon */
      .icon-dots {
        width: 12px;
        height: 12px;
      }
      .icon-dots::before {
        content: '';
        position: absolute;
        width: 2px;
        height: 2px;
        background: currentColor;
        border-radius: 50%;
        top: 1px;
        left: 5px;
        box-shadow: 0 4px 0 currentColor, 0 8px 0 currentColor;
      }
      
      .sidebar-icon {
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        border-radius: 6px !important;
        transition: all 0.2s ease !important;
        background: transparent !important;
      }
      
      .sidebar-icon:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }
      
      .sidebar-icon:hover [class^="icon-"] {
        color: #aaa !important;
      }
      
      .sidebar-icon.active {
        background: rgba(102, 126, 234, 0.15) !important;
      }
      
      .sidebar-icon.active [class^="icon-"] {
        color: #667eea !important;
      }
      
      .view-icon {
        width: 28px !important;
        height: 28px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        border-radius: 4px !important;
        transition: all 0.2s ease !important;
        background: transparent !important;
      }
      
      .view-icon:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }
      
      .view-icon:hover [class^="icon-"] {
        color: #aaa !important;
      }
      
      .view-icon.active {
        background: rgba(255, 255, 255, 0.1) !important;
      }
      
      .view-icon.active [class^="icon-"] {
        color: #fff !important;
      }
      
      .sort-btn {
        padding: 6px 12px !important;
        border: none !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        background: rgba(255, 255, 255, 0.05) !important;
        color: #888 !important;
      }
      
      .sort-btn:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ccc !important;
      }
      
      .sort-btn.active {
        background: #333 !important;
        color: #fff !important;
      }
      
      #safis-close:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        color: #fff !important;
      }
      
      #search-input:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
      }
      
      #safis-modal *::-webkit-scrollbar {
        width: 6px !important;
      }
      
      #safis-modal *::-webkit-scrollbar-track {
        background: transparent !important;
      }
      
      #safis-modal *::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 3px !important;
      }
      
      #safis-modal *::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4) !important;
      }
      
      .menu-trigger:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        color: #ccc !important;
      }
      
      .menu-item:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #fff !important;
      }
      
      .menu-item:last-child {
        border-bottom: none !important;
      }

      /* Ensure dropdowns are always on top */
      .menu-dropdown.menu-active {
        z-index: 2147483647 !important;
        position: absolute !important;
        transform: translateZ(0) !important;
      }
      
      /* Force stacking context for active bookmark items */
      .menu-item-active {
        z-index: 2147483647 !important;
        position: relative !important;
        transform: translateZ(0) !important;
      }
      
      /* Override any transforms on active items */
      .menu-item-active .bookmark-menu {
        z-index: 2147483647 !important;
        position: relative !important;
      }

      /* List view action buttons */
      .action-btn:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
      }

      .action-btn.edit-bookmark:hover {
        background: rgba(102, 126, 234, 0.3) !important;
        color: #8fa4f3 !important;
      }

      .action-btn.add-to-folder:hover {
        background: rgba(255, 193, 7, 0.3) !important;
        color: #ffd54f !important;
      }

      .action-btn.delete-bookmark:hover {
        background: rgba(220, 53, 69, 0.3) !important;
        color: #f56565 !important;
      }
    `;
  }

  // Event handlers
  function setupEventListeners() {
    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('#safis-overlay')) {
        overlay.remove();
      }
    });

    // Category selection
    modal.querySelector('#category-all-icon').addEventListener('click', () => selectCategory('all'));
    modal.querySelector('#my-folders-icon').addEventListener('click', () => toggleFolderView());
    modal.querySelector('#category-work-icon').addEventListener('click', () => selectCategory('Work'));
    modal.querySelector('#category-personal-icon').addEventListener('click', () => selectCategory('Personal'));
    modal.querySelector('#category-learning-icon').addEventListener('click', () => selectCategory('Learning'));

    // View toggle
    const gridViewBtn = modal.querySelector('#grid-view');
    const listViewBtn = modal.querySelector('#list-view');
    
    gridViewBtn.addEventListener('click', () => {
      currentView = 'grid';
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      displayBookmarks();
    });
    
    listViewBtn.addEventListener('click', () => {
      currentView = 'list';
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      displayBookmarks();
    });

    // Sort buttons
    modal.querySelector('#sort-date').addEventListener('click', () => {
      currentSort = 'date';
      updateSortButtons();
      sortBookmarks();
      displayBookmarks();
    });

    modal.querySelector('#sort-name').addEventListener('click', () => {
      currentSort = 'name';
      updateSortButtons();
      sortBookmarks();
      displayBookmarks();
    });

    // Search functionality
    const searchIcon = modal.querySelector('#search-icon');
    const searchPopup = modal.querySelector('#search-popup');
    const searchInput = modal.querySelector('#search-input');

    searchIcon.addEventListener('click', () => {
      const isVisible = searchPopup.style.display === 'block';
      searchPopup.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (query) {
        const results = allBookmarks.filter(bookmark => 
          bookmark.title.toLowerCase().includes(query) || 
          bookmark.url.toLowerCase().includes(query)
        );
        displaySearchResults(results);
      } else {
        modal.querySelector('#search-results').innerHTML = '<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">Start typing to search...</div>';
      }
    });

    // Add current tab functionality
    modal.querySelector('#add-icon').addEventListener('click', addCurrentTab);
  }

  function selectCategory(category) {
    currentCategory = category;
    currentMode = 'categories';
    
    // Update active state
    modal.querySelectorAll('.sidebar-icon').forEach(icon => icon.classList.remove('active'));
    if (category === 'all') {
      modal.querySelector('#category-all-icon').classList.add('active');
    } else {
      modal.querySelector(`#category-${category.toLowerCase()}-icon`).classList.add('active');
    }
    
    // Update title
    const title = category === 'all' ? 'All Bookmarks' : category;
    modal.querySelector('#content-title').textContent = title;
    modal.querySelector('#content-subtitle').textContent = 'Organize and access your saved links';
    
    filterBookmarks();
    displayBookmarks();
  }

  function toggleFolderView() {
    currentMode = 'folders';
    
    // Update active state
    modal.querySelectorAll('.sidebar-icon').forEach(icon => icon.classList.remove('active'));
    modal.querySelector('#my-folders-icon').classList.add('active');
    
    // Update title
    modal.querySelector('#content-title').textContent = 'My Folders';
    modal.querySelector('#content-subtitle').textContent = 'Create and manage custom folders';
    
    displayFolders();
  }

  function displayFolders() {
    const gridContainer = modal.querySelector('#bookmarks-grid');
    const listContainer = modal.querySelector('#bookmarks-list');
    
    // Always show grid for folders
    gridContainer.style.display = 'grid';
    listContainer.style.display = 'none';
    
    if (customFolders.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; font-size: 14px; padding: 80px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
          <h3 style="margin: 0 0 8px 0; color: #ccc;">No Custom Folders Yet</h3>
          <p style="margin: 0; opacity: 0.8; line-height: 1.4;">Create custom folders to organize your bookmarks<br>by project, topic, or any way you like.</p>
          <button id="create-folder-btn" style="margin-top: 20px; padding: 10px 20px; background: #667eea; border: none; border-radius: 8px; color: white; font-weight: 500; cursor: pointer; transition: all 0.2s;">Create Your First Folder</button>
        </div>
      `;
      
      // Add event listener for create folder button
      modal.querySelector('#create-folder-btn')?.addEventListener('click', createNewFolder);
    } else {
      // Display existing folders
      const foldersHTML = customFolders.map(folder => `
        <div class="folder-card" style="background: linear-gradient(135deg, #2a2a2a, #333); border: 1px solid #444; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease; position: relative;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 24px;">📁</div>
            <div class="folder-menu" style="position: relative; opacity: 0; transition: opacity 0.2s;">
              <button class="folder-menu-trigger" data-folder-id="${folder.id}" style="width: 24px; height: 24px; border: none; background: rgba(255, 255, 255, 0.1); color: #999; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Options">
                <div class="icon-dots"></div>
              </button>
            </div>
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #fff;">${escapeHtml(folder.name)}</h3>
          <p style="margin: 0; font-size: 12px; color: #888;">${folder.bookmarks.length} bookmark${folder.bookmarks.length !== 1 ? 's' : ''}</p>
        </div>
      `).join('');
      
      gridContainer.innerHTML = foldersHTML + `
        <div class="new-folder-card" style="background: rgba(102, 126, 234, 0.1); border: 2px dashed #667eea; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px; color: #667eea;">+</div>
          <p style="margin: 0; font-size: 13px; color: #667eea; font-weight: 500;">Create New Folder</p>
        </div>
      `;
      
      // Add event listeners
      modal.querySelectorAll('.folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.folder-menu')) {
            // Open folder view
            const folderId = card.querySelector('.folder-menu-trigger')?.dataset.folderId;
            if (folderId) openFolder(folderId);
          }
        });
        
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px) scale(1.02)';
          card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
          card.querySelector('.folder-menu').style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0) scale(1)';
          card.style.boxShadow = 'none';
          card.querySelector('.folder-menu').style.opacity = '0';
        });
      });
      
      modal.querySelector('.new-folder-card')?.addEventListener('click', createNewFolder);
    }
  }

  function createNewFolder() {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: name.trim(),
        bookmarks: [],
        created: Date.now()
      };
      
      customFolders.push(newFolder);
      chrome.storage.local.set({ customFolders }, () => {
        displayFolders();
        showNotification('Folder created successfully!', 'success');
      });
    }
  }

  function openFolder(folderId) {
    const folder = customFolders.find(f => f.id === folderId);
    if (!folder) return;
    
    currentMode = 'folder';
    currentCategory = folderId;
    
    // Update title
    modal.querySelector('#content-title').textContent = folder.name;
    modal.querySelector('#content-subtitle').textContent = `${folder.bookmarks.length} bookmark${folder.bookmarks.length !== 1 ? 's' : ''}`;
    
    // Display folder bookmarks
    filteredBookmarks = folder.bookmarks;
    displayBookmarks();
  }

  function showAddToFolderDialog(bookmarkId) {
    const bookmark = allBookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;
    
    if (customFolders.length === 0) {
      const createFirst = confirm('You need to create a folder first. Would you like to create one now?');
      if (createFirst) {
        createNewFolder();
      }
      return;
    }
    
    // Remove existing folder dropdown if any
    const existingDropdown = document.querySelector('#folder-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    // Create folder dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'folder-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      background: linear-gradient(135deg, rgba(26, 26, 26, 0.98), rgba(34, 34, 34, 0.98));
      border: 1px solid #444;
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1);
      z-index: 2147483648;
      overflow: hidden;
      backdrop-filter: blur(24px);
    `;
    
    // Create dropdown content
    const foldersHTML = customFolders.map(folder => `
      <div class="folder-option" data-folder-id="${folder.id}" style="
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 16px;">📁</div>
          <div>
            <div style="color: #fff; font-size: 14px; font-weight: 500;">${escapeHtml(folder.name)}</div>
            <div style="color: #888; font-size: 11px;">${folder.bookmarks.length} bookmark${folder.bookmarks.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style="color: #667eea; font-size: 20px; opacity: 0; transition: opacity 0.2s;">+</div>
      </div>
    `).join('');
    
    dropdown.innerHTML = `
      <div style="padding: 20px 16px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h3 style="margin: 0 0 4px 0; color: #fff; font-size: 16px; font-weight: 600;">Add to Folder</h3>
        <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.4;">Choose a folder for "${bookmark.title.length > 40 ? bookmark.title.substring(0, 40) + '...' : bookmark.title}"</p>
      </div>
      <div style="max-height: 240px; overflow-y: auto;">
        ${foldersHTML}
      </div>
      <div style="padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px;">
        <button id="create-new-folder-btn" style="
          flex: 1;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.2);
          border: 1px solid #667eea;
          border-radius: 8px;
          color: #667eea;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">+ New Folder</button>
        <button id="cancel-folder-btn" style="
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #666;
          border-radius: 8px;
          color: #ccc;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        ">Cancel</button>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(dropdown);
    
    // Add event listeners
    dropdown.querySelectorAll('.folder-option').forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.background = 'rgba(102, 126, 234, 0.1)';
        option.querySelector('div:last-child').style.opacity = '1';
      });
      
      option.addEventListener('mouseleave', () => {
        option.style.background = 'transparent';
        option.querySelector('div:last-child').style.opacity = '0';
      });
      
      option.addEventListener('click', () => {
        const folderId = option.dataset.folderId;
        const folder = customFolders.find(f => f.id === folderId);
        
        if (folder) {
          // Check if bookmark already exists in folder
          const exists = folder.bookmarks.some(b => b.id === bookmark.id);
          if (exists) {
            showNotification('Bookmark already exists in this folder!', 'info');
            dropdown.remove();
            return;
          }
          
          // Add bookmark to folder
          folder.bookmarks.push(bookmark);
          chrome.storage.local.set({ customFolders }, () => {
            showNotification(`Added to "${folder.name}"!`, 'success');
            dropdown.remove();
          });
        }
      });
    });
    
    // Create new folder button
    dropdown.querySelector('#create-new-folder-btn').addEventListener('click', () => {
      dropdown.remove();
      const name = prompt('Enter folder name:');
      if (name && name.trim()) {
        const newFolder = {
          id: Date.now().toString(),
          name: name.trim(),
          bookmarks: [bookmark],
          created: Date.now()
        };
        
        customFolders.push(newFolder);
        chrome.storage.local.set({ customFolders }, () => {
          showNotification(`Created "${newFolder.name}" and added bookmark!`, 'success');
        });
      }
    });
    
    // Cancel button
    dropdown.querySelector('#cancel-folder-btn').addEventListener('click', () => {
      dropdown.remove();
    });
    
    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      });
    }, 100);
    
    // ESC key to close
    document.addEventListener('keydown', function closeOnEsc(e) {
      if (e.key === 'Escape' && document.querySelector('#folder-dropdown')) {
        dropdown.remove();
        document.removeEventListener('keydown', closeOnEsc);
      }
    });
  }

  function updateSortButtons() {
    modal.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    modal.querySelector(`#sort-${currentSort}`).classList.add('active');
  }

  function filterBookmarks() {
    if (currentCategory === 'all') {
      filteredBookmarks = [...allBookmarks];
    } else {
      filteredBookmarks = allBookmarks.filter(bookmark => bookmark.category === currentCategory);
    }
  }

  function sortBookmarks() {
    if (currentSort === 'date') {
      filteredBookmarks.sort((a, b) => b.dateAdded - a.dateAdded);
    } else {
      filteredBookmarks.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  function displayBookmarks() {
    if (currentView === 'grid') {
      displayGridView();
    } else {
      displayListView();
    }
  }

  function displayGridView() {
    const container = modal.querySelector('#bookmarks-grid');
    const listContainer = modal.querySelector('#bookmarks-list');
    
    container.style.display = 'grid';
    listContainer.style.display = 'none';
    container.innerHTML = '';
    
    if (filteredBookmarks.length === 0) {
      container.innerHTML = '<div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 16px; padding: 80px 20px; text-align: center;"><div style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;">📖</div><div style="font-size: 18px; margin-bottom: 8px;">No bookmarks found</div><div style="font-size: 14px; opacity: 0.8;">Try adjusting your search or add some bookmarks</div></div>';
      return;
    }

    filteredBookmarks.forEach(bookmark => {
      const card = document.createElement('div');
      card.className = 'bookmark-card';
      card.style.cssText = 'background: linear-gradient(135deg, #222 0%, #111 100%); border: 1px solid #333; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; min-height: 130px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;';
      
      const faviconHtml = bookmark.favicon ? 
        '<img src="' + bookmark.favicon + '" style="width: 28px; height: 28px; border-radius: 6px;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';"><div style="display: none; font-size: 24px; opacity: 0.7;">🌐</div>' :
        '<div style="font-size: 24px; opacity: 0.7;">🌐</div>';

      card.innerHTML = 
        '<div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">' +
          '<div style="display: flex; align-items: center; justify-content: space-between;">' +
            '<div>' + faviconHtml + '</div>' +
            '<div class="bookmark-menu" style="position: relative; opacity: 1; transition: opacity 0.2s;">' +
              '<button class="menu-trigger" data-id="' + bookmark.id + '" style="width: 24px; height: 24px; border: none; background: rgba(255, 255, 255, 0.1); color: #999; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Options"><div class="icon-dots"></div></button>' +
              '<div class="menu-dropdown" style="position: absolute; top: 100%; right: 0; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 1000; min-width: 120px; display: none;">' +
                '<button class="menu-item edit-bookmark" data-id="' + bookmark.id + '" style="width: 100%; padding: 8px 12px; border: none; background: transparent; color: #ccc; text-align: left; cursor: pointer; font-size: 12px; border-bottom: 1px solid #333; transition: all 0.2s;">Edit</button>' +
                '<button class="menu-item add-to-folder" data-id="' + bookmark.id + '" style="width: 100%; padding: 8px 12px; border: none; background: transparent; color: #ccc; text-align: left; cursor: pointer; font-size: 12px; border-bottom: 1px solid #333; transition: all 0.2s;">Add to Folder</button>' +
                '<button class="menu-item delete-bookmark" data-id="' + bookmark.id + '" style="width: 100%; padding: 8px 12px; border: none; background: transparent; color: #ff9999; text-align: left; cursor: pointer; font-size: 12px; transition: all 0.2s;">Delete</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3; max-height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">' + escapeHtml(bookmark.title) + '</h3>' +
            '<p style="margin: 8px 0 0 0; font-size: 11px; color: #888; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + bookmark.domain + '</p>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; justify-content: flex-start; align-items: center; margin-top: 10px;">' +
          '<div style="background: rgba(102, 126, 234, 0.12); color: #7a8cff; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 500;">' + bookmark.category + '</div>' +
        '</div>';
      
      // Enhanced hover effects
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
        card.style.borderColor = '#667eea';
        
        // Close any open dropdowns when hovering on other bookmarks
        modal.querySelectorAll('.menu-dropdown').forEach(menu => {
          const menuParent = menu.closest('.bookmark-item');
          // Only close if this is a different bookmark
          if (menuParent !== card) {
            menu.style.display = 'none';
            menu.classList.remove('menu-active');
            // Reset z-index of parent bookmark item
            if (menuParent) {
              menuParent.style.position = '';
              menuParent.style.zIndex = '';
              menuParent.classList.remove('menu-item-active');
            }
          }
        });
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = 'none';
        card.style.borderColor = '#333';
      });
      
      // Click to open (except on buttons)
      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          window.open(bookmark.url, '_blank');
        }
      });
      
      container.appendChild(card);
    });

    // Attach event listeners for bookmark actions
    attachBookmarkActionListeners();
  }

  function displayListView() {
    const container = modal.querySelector('#bookmarks-list');
    const gridContainer = modal.querySelector('#bookmarks-grid');
    
    container.style.display = 'flex';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: calc(100% - 20px); padding-right: 4px;';
    gridContainer.style.display = 'none';
    container.innerHTML = '';
    
    if (filteredBookmarks.length === 0) {
      container.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 14px; padding: 60px 16px; text-align: center;"><div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📖</div><div style="font-size: 16px; margin-bottom: 6px;">No bookmarks found</div><div style="font-size: 12px; opacity: 0.8;">Try adjusting your search or add some bookmarks</div></div>';
      return;
    }

    filteredBookmarks.forEach(bookmark => {
      const item = document.createElement('div');
      item.className = 'bookmark-list-item';
      item.style.cssText = 'display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: linear-gradient(135deg, #222 0%, #111 100%); border: 1px solid #333; border-radius: 10px; transition: all 0.2s ease; cursor: pointer; min-height: 64px; position: relative;';
      
      const faviconHtml = bookmark.favicon ? 
        '<img src="' + bookmark.favicon + '" style="width: 24px; height: 24px; border-radius: 6px;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display: none; color: #888; font-size: 20px; width: 24px; height: 24px; align-items: center; justify-content: center;">🌐</div>' :
        '<div style="color: #888; font-size: 20px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">🌐</div>';

      item.innerHTML = 
        '<div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.08); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">' + faviconHtml + '</div>' +
        '<div style="flex: 1; min-width: 0; margin-right: 12px;">' +
          '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">' +
            '<h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 350px; line-height: 1.2;">' + escapeHtml(bookmark.title) + '</h3>' +
            '<div style="background: rgba(102, 126, 234, 0.12); color: #7a8cff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; flex-shrink: 0;">' + bookmark.category + '</div>' +
          '</div>' +
          '<div style="font-size: 12px; color: #888; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">' + bookmark.domain + '</div>' +
        '</div>' +
        '<div class="bookmark-actions" style="display: flex; align-items: center; gap: 8px; opacity: 1; transition: opacity 0.2s;">' +
          '<button class="action-btn edit-bookmark" data-id="' + bookmark.id + '" style="padding: 6px 12px; border: none; background: rgba(102, 126, 234, 0.2); color: #667eea; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; border: 1px solid rgba(102, 126, 234, 0.3);" title="Edit bookmark">Edit</button>' +
          '<button class="action-btn add-to-folder" data-id="' + bookmark.id + '" style="padding: 6px 12px; border: none; background: rgba(255, 193, 7, 0.2); color: #ffc107; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; border: 1px solid rgba(255, 193, 7, 0.3);" title="Add to folder">Folder</button>' +
          '<button class="action-btn delete-bookmark" data-id="' + bookmark.id + '" style="padding: 6px 12px; border: none; background: rgba(220, 53, 69, 0.2); color: #dc3545; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; border: 1px solid rgba(220, 53, 69, 0.3);" title="Delete bookmark">Delete</button>' +
        '</div>';
      
      // Simple hover effects
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = '#667eea';
        item.style.transform = 'translateX(4px)';
        item.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = '#333';
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

    // Attach event listeners for bookmark actions
    attachBookmarkActionListeners();
  }

  function attachBookmarkActionListeners() {
    // Menu trigger listeners
    modal.querySelectorAll('.menu-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close all other open menus
        modal.querySelectorAll('.menu-dropdown').forEach(menu => {
          if (menu !== btn.nextElementSibling) {
            menu.style.display = 'none';
          }
        });
        
        // Toggle current menu
        const dropdown = btn.nextElementSibling;
        const isOpen = dropdown.style.display === 'block';
        const parentItem = dropdown.closest('.bookmark-item');
        
        if (isOpen) {
          dropdown.style.display = 'none';
        } else {
          dropdown.style.display = 'block';
        }
      });
    });

    // Edit bookmark listeners
    modal.querySelectorAll('.edit-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        // Close menu
        btn.closest('.menu-dropdown').style.display = 'none';
        editBookmark(bookmarkId);
      });
    });

    // Delete bookmark listeners  
    modal.querySelectorAll('.delete-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        // Close menu
        btn.closest('.menu-dropdown').style.display = 'none';
        deleteBookmark(bookmarkId);
      });
    });

    // Add to folder listeners
    modal.querySelectorAll('.add-to-folder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        // Close menu
        btn.closest('.menu-dropdown').style.display = 'none';
        showAddToFolderDialog(bookmarkId);
      });
    });

    // Click outside to close menus
    document.addEventListener('click', () => {
      modal.querySelectorAll('.menu-dropdown').forEach(menu => {
        menu.style.display = 'none';
      });
    });
  }

  function displaySearchResults(results) {
    const container = modal.querySelector('#search-results');
    
    if (results.length === 0) {
      container.innerHTML = '<div style="padding: 16px; color: #666; font-size: 13px; text-align: center;">No bookmarks found</div>';
      return;
    }
    
    const resultHtml = results.slice(0, 5).map(bookmark => 
      '<div style="padding: 12px 16px; border-bottom: 1px solid #333; cursor: pointer; transition: all 0.2s;" onclick="window.open(\'' + bookmark.url + '\', \'_blank\')">' +
        '<div style="font-size: 13px; font-weight: 500; color: #fff; margin-bottom: 4px;">' + escapeHtml(bookmark.title) + '</div>' +
        '<div style="font-size: 11px; color: #888;">' + bookmark.domain + '</div>' +
      '</div>'
    ).join('');
    
    container.innerHTML = resultHtml;
  }

  function editBookmark(bookmarkId) {
    showNotification('Edit bookmark functionality coming soon!', 'info');
  }

  function deleteBookmark(bookmarkId) {
    const bookmark = allBookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    if (confirm(`Are you sure you want to delete "${bookmark.title}"? This action cannot be undone.`)) {
      chrome.runtime.sendMessage({
        type: 'REMOVE_BOOKMARK',
        id: bookmarkId
      }).then(response => {
        if (response && response.success) {
          // Remove from local data
          allBookmarks = allBookmarks.filter(b => b.id !== bookmarkId);
          showNotification('Bookmark deleted successfully! 🗑️', 'success');
          filterBookmarks();
          displayBookmarks();
        }
      }).catch(error => {
        console.error('Failed to delete bookmark:', error);
        showNotification('Failed to delete bookmark', 'error');
      });
    }
  }

  function addCurrentTab() {
    chrome.runtime.sendMessage({
      type: 'ADD_CURRENT_TAB_BOOKMARK'
    }).then(response => {
      if (response && response.success) {
        showNotification('Current page added to bookmarks! ⭐', 'success');
        loadBookmarks();
      } else {
        showNotification('Failed to add current page', 'error');
      }
    }).catch(error => {
      console.error('Failed to add current tab:', error);
      showNotification('Failed to add current page', 'error');
    });
  }

  async function loadBookmarks() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
      
      if (response && response.bookmarks) {
        allBookmarks = [];
        processBookmarkNodes(response.bookmarks, allBookmarks);
        
        // Categorize bookmarks and update counts
        categories.forEach((data, category) => data.count = 0);
        
        allBookmarks.forEach(bookmark => {
          bookmark.category = detectCategory(bookmark.title, bookmark.url);
          bookmark.domain = new URL(bookmark.url).hostname.replace('www.', '');
          bookmark.favicon = `https://www.google.com/s2/favicons?domain=${bookmark.domain}&sz=64`;
          
          if (categories.has(bookmark.category)) {
            categories.get(bookmark.category).count++;
          }
        });
        
        console.log(`Loaded ${allBookmarks.length} bookmarks`);
        filterBookmarks();
        sortBookmarks();
        displayBookmarks();
        
        // Hide loading state
        const loadingElement = modal.querySelector('#bookmarks-loading');
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      showNotification('Failed to load bookmarks', 'error');
    }
  }

  function processBookmarkNodes(nodes, bookmarks) {
    nodes.forEach(node => {
      if (node.children) {
        processBookmarkNodes(node.children, bookmarks);
      } else if (node.url) {
        bookmarks.push({
          id: node.id,
          title: node.title || 'Untitled',
          url: node.url,
          dateAdded: node.dateAdded || Date.now()
        });
      }
    });
  }

  async function loadCustomFolders() {
    try {
      const result = await chrome.storage.local.get(['customFolders']);
      customFolders = result.customFolders || [];
      console.log('Loaded custom folders:', customFolders);
    } catch (error) {
      console.error('Failed to load custom folders:', error);
    }
  }

  // Utility functions
  function detectCategory(title, url) {
    const titleLower = title.toLowerCase();
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('github.com') || urlLower.includes('stackoverflow.com') || 
        urlLower.includes('developer.mozilla.org') || titleLower.includes('tutorial') ||
        urlLower.includes('coursera.com') || urlLower.includes('udemy.com')) {
      return 'Learning';
    }
    else if (urlLower.includes('linkedin.com') || urlLower.includes('slack.com') || 
             urlLower.includes('notion.so') || titleLower.includes('work')) {
      return 'Work';
    }
    else if (urlLower.includes('youtube.com') || urlLower.includes('netflix.com') || 
             urlLower.includes('spotify.com') || titleLower.includes('video')) {
      return 'Entertainment';
    }
    else if (urlLower.includes('amazon.com') || urlLower.includes('shop') || 
             titleLower.includes('buy')) {
      return 'Shopping';
    }
    else if (urlLower.includes('news') || urlLower.includes('bbc.com') || 
             urlLower.includes('cnn.com')) {
      return 'News';
    }
    else if (urlLower.includes('facebook.com') || urlLower.includes('twitter.com') || 
             urlLower.includes('instagram.com') || urlLower.includes('reddit.com')) {
      return 'Social';
    }
    
    return 'Personal';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#2d5a27' : type === 'error' ? '#5a2d2d' : '#2d4a5a'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 2147483648;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    // Add animation styles if not already present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  console.log('=== SAFIS ENHANCED OVERLAY SETUP COMPLETE ===');
}