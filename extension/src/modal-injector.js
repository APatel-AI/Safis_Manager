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
  let currentMode = 'bookmarks';
  let isProcessing = false;
  
  // Simplified - no preset categories, just folders and bookmarks

  // Create overlay background
  let overlay, modal;
  try {
    overlay = document.createElement('div');
    overlay.id = 'safis-overlay';
    overlay.className = 'safis-overlay';

    // Create modal
    modal = document.createElement('div');
    modal.id = 'safis-modal';
    // Modal styles are now handled by CSS classes

    // Create modal content
    console.log('Creating modal HTML...');
    modal.innerHTML = createModalHTML();
    console.log('Modal HTML created successfully');

    // Add external CSS file with cache busting
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/styles.css') + '?v=' + Date.now();
    document.head.appendChild(link);

    // Assemble and display
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  } catch (error) {
    console.error('Failed to create modal DOM elements:', error);
    if (overlay && overlay.parentNode) overlay.remove();
    return;
  }
  
  console.log('Enhanced overlay created');
  
  // Setup functionality
  try {
    console.log('Setting up event listeners...');
    setupEventListeners();
    console.log('Setting up bidirectional sync...');
    setupBidirectionalSync(); // Enable real-time sync
    
    // Load data asynchronously without blocking initialization
    console.log('Loading bookmarks asynchronously...');
    loadBookmarks().catch(error => {
      console.error('Failed to load bookmarks:', error);
    });
    
    console.log('Loading custom folders asynchronously...');
    // Make sure custom folders load with higher priority and better error handling
    setTimeout(() => {
      loadCustomFolders().catch(error => {
        console.error('Failed to load custom folders:', error);
        // Ensure displayFolders is called even on complete failure
        displayFolders();
      });
    }, 100); // Small delay to ensure DOM is ready
    
    console.log('Safis bookmark modal initialized successfully');
  } catch (error) {
    console.error('Error initializing Safis modal:', error);
    console.error('Error details:', error.stack);
  }

  // Helper function to get the appropriate app icon based on environment
  function getAppIcon() {
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return `<img src="${chrome.runtime.getURL('assets/glasses_emoji.png')}" class="modal-header-icon" alt="Safis">`;
    }
  }

  // HTML template function
  function createModalHTML() {
    return `
      
      <div id="sidebar" class="modal-sidebar">
        <div class="sidebar-content">
          <div id="modal-header" class="modal-header-btn" title="View All Bookmarks">
            ${getAppIcon()}
          </div>
          
          <div id="search-icon" class="sidebar-icon" title="Search Bookmarks">
            <div class="css-icon icon-search"></div>
          </div>
          
          <div id="add-icon" class="sidebar-icon" title="Add Current Page">
            <div class="css-icon icon-plus"></div>
          </div>
          
          <div class="sidebar-divider"></div>
          
          <div id="category-all-icon" class="sidebar-icon active" title="View All Bookmarks">
            <div class="css-icon icon-bookmarks"></div>
          </div>
          
          <div id="my-folders-icon" class="sidebar-icon" title="My Folders">
            <div class="css-icon icon-folder"></div>
          </div>
        </div>
        
        <div class="sidebar-view-controls">
          <div id="grid-view" class="view-icon active" title="Grid View">
            <div class="css-icon icon-grid icon-small"></div>
          </div>
          <div id="list-view" class="view-icon" title="List View">
            <div class="css-icon icon-list icon-small"></div>
          </div>
        </div>
      </div>
      
      <div id="main-content" class="modal-main-content">
        <div id="content-header" class="modal-content-header">
          <div>
            <h2 id="content-title" class="modal-content-title">All Bookmarks</h2>
            <p id="content-subtitle" class="modal-content-subtitle">All your saved bookmarks</p>
          </div>
          <div class="modal-sort-controls">
            <button id="sort-date" class="sort-btn active">Recent</button>
            <button id="sort-name" class="sort-btn">A-Z</button>
          </div>
        </div>
        <div id="bookmarks-container" class="modal-bookmarks-container">
          <div id="bookmarks-grid" class="modal-bookmarks-grid show">
            <div id="bookmarks-loading" class="modal-bookmarks-loading">
              <div class="modal-loading-spinner"></div>
              <div>Loading your bookmarks...</div>
            </div>
          </div>
          <div id="bookmarks-list" class="modal-bookmarks-list"></div>
        </div>
      </div>
      
      <div id="search-popup" class="modal-search-popup">
        <div class="modal-search-input-container">
          <div class="modal-search-input-wrapper">
            <input id="search-input" type="text" placeholder="Search your bookmarks..." class="modal-search-input">
            <div class="modal-search-icon">
              <div class="css-icon icon-search modal-search-icon-inner"></div>
            </div>
          </div>
        </div>
        <div id="search-results" class="modal-search-results">
          <div class="modal-search-placeholder">Start typing to search your bookmarks...</div>
        </div>
      </div>
    `;
  }

  // CSS is now loaded from external file (styles.css)

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

    // Logo click handler - navigate to all bookmarks
    const logoHeader = modal.querySelector('#modal-header');
    if (logoHeader) {
      logoHeader.addEventListener('click', (e) => {
        // Only handle click if not dragging
        if (!e.target.closest('#modal-header').style.cursor.includes('grabbing')) {
          selectCategory('all');
          // Ensure we're showing the main bookmarks view
          hideSearchPopup();
          hideFolderView();
        }
      });
    }

    // Navigation selection
    const categoryAllIcon = modal.querySelector('#category-all-icon');
    const myFoldersIcon = modal.querySelector('#my-folders-icon');
    
    if (categoryAllIcon) categoryAllIcon.addEventListener('click', () => selectCategory('all'));
    if (myFoldersIcon) myFoldersIcon.addEventListener('click', () => toggleFolderView());

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
    const sortDateBtn = modal.querySelector('#sort-date');
    const sortNameBtn = modal.querySelector('#sort-name');
    
    if (sortDateBtn) sortDateBtn.addEventListener('click', () => {
      currentSort = 'date';
      updateSortButtons();
      sortBookmarks();
      displayBookmarks();
    });

    if (sortNameBtn) sortNameBtn.addEventListener('click', () => {
      currentSort = 'name';
      updateSortButtons();
      sortBookmarks();
      displayBookmarks();
    });

    // Search functionality
    const searchIcon = modal.querySelector('#search-icon');
    const searchPopup = modal.querySelector('#search-popup');
    const searchInput = modal.querySelector('#search-input');

    if (!searchIcon || !searchPopup || !searchInput) {
      // Continue with rest of initialization
    } else {

    searchIcon.addEventListener('click', () => {
      const isVisible = searchPopup.classList.contains('show');
      if (isVisible) {
        searchPopup.classList.remove('show');
      } else {
        searchPopup.classList.add('show');
        searchInput.focus();
      }
    });

    searchInput.addEventListener('focus', () => {
      searchPopup.classList.add('show');
    });

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      if (searchPopup) {
        searchPopup.classList.add('show');
      }
      
      const query = e.target.value.toLowerCase().trim();
      
      // Debounce search to improve performance
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (query) {
          const results = searchBookmarks(query);
          displaySearchResults(results);
          // Also filter the main bookmark view
          filterBookmarks(query);
          sortBookmarks();
          displayBookmarks();
        } else {
          const searchResultsContainer = modal.querySelector('#search-results');
          if (searchResultsContainer) {
            searchResultsContainer.innerHTML = '<div class="modal-search-placeholder">Start typing to search your bookmarks...</div>';
          }
          // Reset the main view
          filterBookmarks('');
          sortBookmarks();
          displayBookmarks();
        }
      }, 150); // 150ms debounce
    });

    // Add keyboard navigation for search
    let selectedSearchIndex = -1;
    searchInput.addEventListener('keydown', (e) => {
      const results = modal.querySelectorAll('.search-result-item');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSearchIndex = Math.min(selectedSearchIndex + 1, results.length - 1);
        updateSearchSelection(results);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSearchIndex = Math.max(selectedSearchIndex - 1, -1);
        updateSearchSelection(results);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSearchIndex >= 0 && results[selectedSearchIndex]) {
          results[selectedSearchIndex].click();
          searchPopup.classList.remove('show');
          searchInput.value = '';
        }
      } else if (e.key === 'Escape') {
        searchPopup.classList.remove('show');
        selectedSearchIndex = -1;
      } else {
        selectedSearchIndex = -1; // Reset selection when typing
      }
    });

    
    // Close search popup when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchPopup.contains(e.target) && !searchIcon.contains(e.target)) {
        searchPopup.classList.remove('show');
        selectedSearchIndex = -1;
      }
    });

    function updateSearchSelection(results) {
      results.forEach((item, index) => {
        if (index === selectedSearchIndex) {
          item.style.background = 'rgba(235, 89, 57, 0.2)';
          item.style.transform = 'translateX(4px)';
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.style.background = 'transparent';
          item.style.transform = 'translateX(0)';
        }
      });
    }

    // Close search popup when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchPopup.contains(e.target) && !searchIcon.contains(e.target)) {
        searchPopup.style.display = 'none';
        selectedSearchIndex = -1;
      }
    });

    // Add global keyboard shortcut to open search (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (modal && modal.style.display !== 'none') {
          searchPopup.style.display = 'block';
          searchInput.focus();
        }
      }
    });
    }

    // Add current tab functionality
    const addIcon = modal.querySelector('#add-icon');
    if (addIcon) addIcon.addEventListener('click', addCurrentTab);
  }

  function selectCategory(category) {
    currentCategory = 'all'; // Always show all bookmarks now
    currentMode = 'bookmarks';
    
    // Update active state
    modal.querySelectorAll('.sidebar-icon').forEach(icon => icon.classList.remove('active'));
    modal.querySelector('#category-all-icon').classList.add('active');
    
    // Update title
    modal.querySelector('#content-title').textContent = 'All Bookmarks';
    modal.querySelector('#content-subtitle').textContent = 'All your saved bookmarks in one place';
    
    // Show all bookmarks without category filtering
    filteredBookmarks = allBookmarks;
    displayBookmarks();
  }

  function toggleFolderView() {
    currentMode = 'folders';
    
    // Update active state
    modal.querySelectorAll('.sidebar-icon').forEach(icon => icon.classList.remove('active'));
    modal.querySelector('#my-folders-icon').classList.add('active');
    
    // Update title
    modal.querySelector('#content-title').textContent = 'My Folders';
    modal.querySelector('#content-subtitle').textContent = 'Organize bookmarks into custom folders';
    
    displayFolders();
  }

  function hideSearchPopup() {
    const searchPopup = modal.querySelector('#search-popup');
    const searchInput = modal.querySelector('#search-input');
    if (searchPopup) {
      searchPopup.classList.remove('show');
    }
    if (searchInput) {
      searchInput.value = '';
    }
  }

  function hideFolderView() {
    // Switch back to bookmarks view if currently in folder view
    if (currentMode === 'folders') {
      selectCategory('all');
    }
  }

  function displayFolders() {
    const gridContainer = modal.querySelector('#bookmarks-grid');
    const listContainer = modal.querySelector('#bookmarks-list');
    
    if (!gridContainer) {
      return;
    }
    
    // Always show grid for folders
    if (listContainer) listContainer.classList.remove('show');
    gridContainer.classList.add('show');
    
    if (customFolders.length === 0) {
      gridContainer.innerHTML = `
        <div class="no-folders-container">
          <div class="no-folders-icon">📁</div>
          <h3 class="no-folders-title">No Folders</h3>
          <p class="no-folders-text">Create folders to organize your bookmarks</p>
          <div class="no-folders-buttons">
            <button id="create-folder-btn" class="btn-primary">Create Folder</button>
            <button id="import-chrome-folders-btn" class="btn-secondary">Import from Chrome</button>
          </div>
        </div>
      `;
      
      // Add event listeners
      modal.querySelector('#create-folder-btn')?.addEventListener('click', createNewFolder);
      modal.querySelector('#import-chrome-folders-btn')?.addEventListener('click', showImportChromeFoldersModal);
    } else {
      // Display existing folders
      const foldersHTML = customFolders.map(folder => `
        <div class="folder-card" data-folder-id="${folder.id}">
          <div class="folder-header">
            <div class="folder-icon">📁</div>
            <div class="folder-menu">
              <button class="folder-menu-trigger" data-folder-id="${folder.id}" title="Options">
                <div class="css-icon icon-dots icon-small"></div>
              </button>
              <div class="folder-dropdown">
                <button class="folder-menu-item edit-folder" data-folder-id="${folder.id}">Rename</button>
                <button class="folder-menu-item delete-folder" data-folder-id="${folder.id}">Delete</button>
              </div>
            </div>
          </div>
          <h3 class="folder-name">${escapeHtml(folder.name)}</h3>
          <p class="folder-count">${folder.bookmarks.length} bookmark${folder.bookmarks.length !== 1 ? 's' : ''}</p>
        </div>
      `).join('');
      
      gridContainer.innerHTML = foldersHTML + `
        <div class="new-folder-card">
          <div class="new-folder-icon">+</div>
          <p class="new-folder-text">Create New Folder</p>
        </div>
      `;
      
      // Add event listeners
      modal.querySelectorAll('.folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.folder-menu')) {
            // Open folder view
            const folderId = card.dataset.folderId;
            if (folderId) openFolder(folderId);
          }
        });
        
        card.addEventListener('mouseenter', () => {
          card.querySelector('.folder-menu').style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
          card.querySelector('.folder-menu').style.opacity = '0';
        });
      });

      // Folder menu triggers
      modal.querySelectorAll('.folder-menu-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const dropdown = trigger.nextElementSibling;
          
          // Close all other dropdowns first
          modal.querySelectorAll('.folder-dropdown').forEach(menu => {
            if (menu !== dropdown) {
              menu.classList.remove('folder-dropdown-show');
            }
          });
          
          // Toggle this dropdown
          dropdown.classList.toggle('folder-dropdown-show');
        });
      });

      // Edit folder listeners
      modal.querySelectorAll('.edit-folder').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const folderId = btn.dataset.folderId;
          // Close dropdown
          const dropdown = btn.closest('.folder-dropdown');
          if (dropdown) {
            dropdown.style.display = 'none';
          }
          showFolderModal(folderId);
        });
      });

      // Delete folder listeners
      modal.querySelectorAll('.delete-folder').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const folderId = btn.dataset.folderId;
          const folder = customFolders.find(f => f.id === folderId);
          if (!folder) return;
          
          // Close dropdown
          const dropdown = btn.closest('.folder-dropdown');
          if (dropdown) {
            dropdown.style.display = 'none';
          }
          
          deleteFolder(folderId, folder.name);
        });
      });

      // Click outside to close dropdowns
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.folder-menu')) {
          modal.querySelectorAll('.folder-dropdown').forEach(menu => {
            menu.classList.remove('folder-dropdown-show');
          });
        }
      });
      
      modal.querySelector('.new-folder-card')?.addEventListener('click', createNewFolder);
    }
  }

  function createNewFolder() {
    if (isProcessing) return;
    showFolderModal();
  }

  function showFolderModal(folderId = null) {
    if (isProcessing) return;
    isProcessing = true;
    
    const isEdit = !!folderId;
    const folder = isEdit ? customFolders.find(f => f.id === folderId) : null;
    
    // Remove existing modal if any
    const existingModal = document.querySelector('#folder-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const folderModal = document.createElement('div');
    folderModal.id = 'folder-modal';
    folderModal.className = 'safis-modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'safis-modal-content';

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? 'Edit Folder' : 'Create New Folder'}</h2>
        <button id="close-folder-modal" class="modal-close-btn">×</button>
      </div>
      <div class="modal-field">
        <label class="modal-label">Folder Name</label>
        <input id="folder-name-input" type="text" placeholder="Enter folder name..." value="${isEdit ? folder?.name || '' : ''}" class="modal-input">
      </div>
      <div class="modal-buttons">
        <button id="cancel-folder-modal" class="btn-cancel">Cancel</button>
        <button id="save-folder-btn" class="btn-primary">${isEdit ? 'Save Changes' : 'Create Folder'}</button>
      </div>
    `;

    try {
      folderModal.appendChild(modalContent);
      document.body.appendChild(folderModal);
    } catch (error) {
      console.error('Error appending folder modal to DOM:', error);
      return;
    }

    // Focus input
    const input = folderModal.querySelector('#folder-name-input');
    input.focus();
    input.select();

    // Input focus styles
    input.addEventListener('focus', () => {
      input.style.borderColor = '#eb5939';
      input.style.boxShadow = '0 0 0 3px rgba(235, 89, 57, 0.1)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(235, 89, 57, 0.3)';
      input.style.boxShadow = 'none';
    });

    // Close handlers
    const closeModal = () => {
      try {
        if (folderModal && folderModal.parentNode) {
          folderModal.remove();
        }
        isProcessing = false;
      } catch (error) {
        console.warn('Error closing modal:', error);
        isProcessing = false;
      }
    };

    const closeBtn = folderModal.querySelector('#close-folder-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const cancelBtn = folderModal.querySelector('#cancel-folder-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Click outside to close
    folderModal.addEventListener('click', (e) => {
      if (e.target === folderModal) closeModal();
    });

    // Save handler
    const saveBtn = folderModal.querySelector('#save-folder-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) {
        input.style.borderColor = '#ff6b6b';
        input.focus();
        return;
      }

      if (isEdit) {
        // Edit existing folder
        const folderIndex = customFolders.findIndex(f => f.id === folderId);
        if (folderIndex !== -1) {
          const currentFolder = customFolders[folderIndex];
          const oldName = currentFolder.name;
          
          // Update local folder name
          customFolders[folderIndex].name = name;
          
          // Try to update Chrome bookmark folder name if it exists
          if (currentFolder.chromeBookmarkId) {
            updateChromeBookmarkFolder(currentFolder.chromeBookmarkId, name)
              .then(() => {
                chrome.storage.local.set({ customFolders }, () => {
                  displayFolders();
                  showNotification('Folder renamed in extension and Chrome bookmarks!', 'success');
                  closeModal();
                });
              })
              .catch(error => {
                console.warn('Failed to rename Chrome bookmark folder:', error);
                // Still save locally even if Chrome sync fails
                chrome.storage.local.set({ customFolders }, () => {
                  displayFolders();
                  showNotification('Folder renamed locally (Chrome sync failed)', 'warning');
                  closeModal();
                });
              });
          } else {
            // No Chrome bookmark ID, just save locally
            chrome.storage.local.set({ customFolders }, () => {
              displayFolders();
              showNotification('Folder updated successfully!', 'success');
              closeModal();
            });
          }
        }
      } else {
        // Create new folder
        const newFolder = {
          id: Date.now().toString(),
          name: name,
          bookmarks: [],
          created: Date.now(),
          chromeBookmarkId: null // Will be set after Chrome folder creation
        };
        
        // Try to create folder in Chrome bookmarks first
        createChromeBookmarkFolder(name)
          .then(chromeFolder => {
            newFolder.chromeBookmarkId = chromeFolder.id;
            customFolders.push(newFolder);
            chrome.storage.local.set({ customFolders }, () => {
              displayFolders();
              showNotification('Folder created in extension and Chrome bookmarks!', 'success');
              closeModal();
            });
          })
          .catch(error => {
            console.error('Failed to create Chrome bookmark folder:', error);
            // Still create the folder locally even if Chrome sync fails
            customFolders.push(newFolder);
            chrome.storage.local.set({ customFolders }, () => {
              displayFolders();
              showNotification('Folder created locally (Chrome sync unavailable)', 'warning');
              closeModal();
            });
          });
      }
    });

    // Enter key to save
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        folderModal.querySelector('#save-folder-btn').click();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  function deleteFolder(folderId, folderName) {
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483649;
      backdrop-filter: blur(8px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'safis-modal-content';

    modalContent.innerHTML = `
      <div class="modal-content-center">
        <div class="modal-warning-icon">⚠️</div>
        <h2 class="modal-title">Delete Folder</h2>
        <p class="modal-text">Are you sure you want to delete "<strong>${escapeHtml(folderName)}</strong>"?<br>This action cannot be undone.</p>
      </div>
      <div class="modal-buttons">
        <button id="cancel-delete-folder" class="btn-cancel">Cancel</button>
        <button id="confirm-delete-folder" class="btn-danger">Delete Folder</button>
      </div>
    `;

    confirmModal.appendChild(modalContent);
    document.body.appendChild(confirmModal);

    // Close handlers
    const closeModal = () => {
      confirmModal.remove();
    };

    confirmModal.querySelector('#cancel-delete-folder').addEventListener('click', closeModal);
    
    // Click outside to close
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeModal();
    });

    // Delete handler
    confirmModal.querySelector('#confirm-delete-folder').addEventListener('click', async () => {
      // Find the folder to get its Chrome bookmark ID
      const folderToDelete = customFolders.find(f => f.id === folderId);
      
      // Remove folder from array
      customFolders = customFolders.filter(f => f.id !== folderId);
      
      // Try to delete from Chrome bookmarks if it has a Chrome ID
      if (folderToDelete && folderToDelete.chromeBookmarkId) {
        try {
          await deleteChromeBookmarkFolder(folderToDelete.chromeBookmarkId);
          console.log('Deleted folder from Chrome bookmarks');
        } catch (error) {
          console.warn('Failed to delete folder from Chrome bookmarks:', error);
        }
      }
      
      // Save to storage
      chrome.storage.local.set({ customFolders }, () => {
        displayFolders();
        showNotification('Folder deleted from extension and Chrome bookmarks!', 'success');
        closeModal();
      });
    });

    // ESC key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }

  function showCreateFolderWithBookmarkModal(bookmarkId) {
    if (!bookmarkId || !allBookmarks || !Array.isArray(allBookmarks)) {
      console.warn('Invalid parameters:', { bookmarkId, allBookmarksType: typeof allBookmarks });
      return;
    }
    
    const bookmark = allBookmarks.find(b => b && b.id === bookmarkId);
    if (!bookmark) {
      console.warn('Bookmark not found for id:', bookmarkId);
      return;
    }

    // Remove existing modal if any
    const existingModal = document.querySelector('#folder-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const folderModal = document.createElement('div');
    folderModal.id = 'folder-modal';
    folderModal.className = 'safis-modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'safis-modal-content';

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">Create New Folder</h2>
        <button id="close-folder-modal" class="modal-close-btn">×</button>
      </div>
      <div class="modal-bookmark-preview">
        <div class="modal-bookmark-preview-label">Adding bookmark:</div>
        <div class="modal-bookmark-preview-title">${escapeHtml(bookmark.title)}</div>
      </div>
      <div class="modal-field">
        <label class="modal-label">Folder Name</label>
        <input id="folder-name-input" type="text" placeholder="Enter folder name..." class="modal-input">
      </div>
      <div class="modal-buttons">
        <button id="cancel-folder-modal" class="btn-cancel">Cancel</button>
        <button id="save-folder-btn" class="btn-primary">Create & Add</button>
      </div>
    `;

    try {
      folderModal.appendChild(modalContent);
      document.body.appendChild(folderModal);
    } catch (error) {
      console.error('Error appending folder modal to DOM:', error);
      return;
    }

    // Focus input
    const input = folderModal.querySelector('#folder-name-input');
    input.focus();

    // Input focus styles
    input.addEventListener('focus', () => {
      input.style.borderColor = '#eb5939';
      input.style.boxShadow = '0 0 0 3px rgba(235, 89, 57, 0.1)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(235, 89, 57, 0.3)';
      input.style.boxShadow = 'none';
    });

    // Close handlers
    const closeModal = () => {
      try {
        if (folderModal && folderModal.parentNode) {
          folderModal.remove();
        }
        isProcessing = false;
      } catch (error) {
        console.warn('Error closing modal:', error);
        isProcessing = false;
      }
    };

    const closeBtn = folderModal.querySelector('#close-folder-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const cancelBtn = folderModal.querySelector('#cancel-folder-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Click outside to close
    folderModal.addEventListener('click', (e) => {
      if (e.target === folderModal) closeModal();
    });

    // Save handler
    const saveBtn = folderModal.querySelector('#save-folder-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) {
        input.style.borderColor = '#ff6b6b';
        input.focus();
        return;
      }

      const newFolder = {
        id: Date.now().toString(),
        name: name,
        bookmarks: [bookmark],
        created: Date.now(),
        chromeBookmarkId: null // Will be set after Chrome folder creation
      };
      
      // Try to create folder in Chrome bookmarks and add the bookmark to it
      createChromeBookmarkFolder(name)
        .then(async chromeFolder => {
          newFolder.chromeBookmarkId = chromeFolder.id;
          
          // Also add the bookmark to the Chrome folder
          try {
            await addBookmarkToChromeFolder(chromeFolder.id, bookmark.url, bookmark.title);
          } catch (error) {
            console.warn('Failed to add bookmark to Chrome folder:', error);
          }
          
          customFolders.push(newFolder);
          chrome.storage.local.set({ customFolders }, () => {
            showNotification(`Created "${newFolder.name}" and added bookmark to both extension and Chrome!`, 'success');
            closeModal();
          });
        })
        .catch(error => {
          console.error('Failed to create Chrome bookmark folder:', error);
          // Still create the folder locally even if Chrome sync fails
          customFolders.push(newFolder);
          chrome.storage.local.set({ customFolders }, () => {
            showNotification(`Created "${newFolder.name}" locally (Chrome sync unavailable)`, 'warning');
            closeModal();
          });
        });
    });

    // Enter key to save
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        folderModal.querySelector('#save-folder-btn').click();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
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

  function showCreateFirstFolderModal(bookmarkId) {
    if (!bookmarkId) {
      console.warn('showCreateFirstFolderModal: bookmarkId is required');
      return;
    }
    
    if (!allBookmarks || !Array.isArray(allBookmarks)) {
      console.warn('showCreateFirstFolderModal: allBookmarks is not available');
      return;
    }
    
    const bookmark = allBookmarks.find(b => b && b.id === bookmarkId);
    if (!bookmark) {
      console.warn('showCreateFirstFolderModal: bookmark not found for id:', bookmarkId);
      return;
    }

    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483649;
      backdrop-filter: blur(8px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'safis-modal-content';

    modalContent.innerHTML = `
      <div class="folder-create-content">
        <div class="folder-create-icon">📁</div>
        <h2 class="folder-create-title">Create Your First Folder</h2>
        <p class="folder-create-text">You need to create a folder first before adding bookmarks.<br>Would you like to create one now?</p>
      </div>
      <div class="folder-dialog-actions">
        <button id="cancel-create-first" style="
          padding: 10px 20px;
          border: 2px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #ccc;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Maybe Later</button>
        <button id="confirm-create-first" style="
          padding: 10px 20px;
          border: none;
          background: linear-gradient(135deg, #eb5939 0%, #c13923 100%);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Create Folder</button>
      </div>
    `;

    confirmModal.appendChild(modalContent);
    document.body.appendChild(confirmModal);

    // Close handlers
    const closeModal = () => {
      confirmModal.remove();
    };

    confirmModal.querySelector('#cancel-create-first').addEventListener('click', closeModal);
    
    // Click outside to close
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeModal();
    });

    // Confirm handler - open create folder modal with the bookmark
    confirmModal.querySelector('#confirm-create-first').addEventListener('click', () => {
      closeModal();
      showCreateFolderWithBookmarkModal(bookmarkId);
    });

    // ESC key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }

  function showAddToFolderDialog(bookmarkId) {
    if (!bookmarkId || !allBookmarks || !Array.isArray(allBookmarks)) {
      console.warn('Invalid parameters:', { bookmarkId, allBookmarksType: typeof allBookmarks });
      return;
    }
    
    const bookmark = allBookmarks.find(b => b && b.id === bookmarkId);
    if (!bookmark) {
      console.warn('Bookmark not found for id:', bookmarkId);
      return;
    }
    
    if (customFolders.length === 0) {
      showCreateFirstFolderModal(bookmarkId);
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
    dropdown.className = 'folder-dropdown';
    
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
        <div class="folder-item-content">
          <div class="folder-item-icon">📁</div>
          <div class="folder-item-details">
            <div class="folder-item-name">${escapeHtml(folder.name)}</div>
            <div class="folder-item-count">${folder.bookmarks.length} bookmark${folder.bookmarks.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="folder-item-add-icon">+</div>
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
          background: rgba(235, 89, 57, 0.2);
          border: 1px solid #eb5939;
          border-radius: 8px;
          color: #eb5939;
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
        option.style.background = 'rgba(235, 89, 57, 0.1)';
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
          
          // Also add to Chrome bookmark folder if it exists
          if (folder.chromeBookmarkId) {
            addBookmarkToChromeFolder(folder.chromeBookmarkId, bookmark.url, bookmark.title)
              .then(() => {
                chrome.storage.local.set({ customFolders }, () => {
                  showNotification(`Added to "${folder.name}" in extension and Chrome!`, 'success');
                  dropdown.remove();
                });
              })
              .catch(error => {
                console.warn('Failed to add bookmark to Chrome folder:', error);
                chrome.storage.local.set({ customFolders }, () => {
                  showNotification(`Added to "${folder.name}" locally (Chrome sync failed)`, 'warning');
                  dropdown.remove();
                });
              });
          } else {
            chrome.storage.local.set({ customFolders }, () => {
              showNotification(`Added to "${folder.name}"!`, 'success');
              dropdown.remove();
            });
          }
        }
      });
    });
    
    // Create new folder button
    dropdown.querySelector('#create-new-folder-btn').addEventListener('click', () => {
      dropdown.remove();
      showCreateFolderWithBookmarkModal(bookmarkId);
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

  // Filter bookmarks based on search query
  function filterBookmarks(searchQuery = '') {
    if (!searchQuery || searchQuery.trim() === '') {
      // Reset to appropriate bookmarks based on current mode
      if (currentMode === 'folder') {
        const folder = customFolders.find(f => f.id === currentCategory);
        filteredBookmarks = folder ? [...folder.bookmarks] : [];
      } else {
        filteredBookmarks = [...allBookmarks];
      }
    } else {
      const results = searchBookmarks(searchQuery);
      filteredBookmarks = results;
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
    if (!modal) {
      return;
    }
    
    const container = modal.querySelector('#bookmarks-grid');
    if (!container) {
      console.warn('displayGridView: bookmarks-grid container not found');
      return;
    }
    const listContainer = modal.querySelector('#bookmarks-list');
    
    if (!listContainer) {
      console.warn('displayGridView: list container not found');
    }
    
    // Ensure proper visibility toggle
    if (listContainer) listContainer.classList.remove('show');
    container.classList.add('show');
    container.innerHTML = '';
    
    if (filteredBookmarks.length === 0) {
      container.innerHTML = '<div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 16px; padding: 80px 20px; text-align: center;"><div style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;">📖</div><div style="font-size: 18px; margin-bottom: 8px;">No bookmarks found</div><div style="font-size: 14px; opacity: 0.8;">Try adjusting your search or add some bookmarks</div></div>';
      return;
    }

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    filteredBookmarks.forEach(bookmark => {
      const card = document.createElement('div');
      card.className = 'bookmark-card';
      
      const faviconHtml = bookmark.favicon ? 
        '<img src="' + bookmark.favicon + '" class="bookmark-favicon" onerror="this.classList.add(\'favicon-error\'); this.nextElementSibling.classList.remove(\'hidden\');"><div class="bookmark-favicon-fallback hidden">🌐</div>' :
        '<div class="bookmark-favicon-default">🌐</div>';

      card.innerHTML = 
        '<div class="bookmark-card-content">' +
          '<div class="bookmark-card-header">' +
            '<div class="bookmark-favicon-container">' + faviconHtml + '</div>' +
            '<div class="bookmark-menu">' +
              '<button class="menu-trigger" data-id="' + bookmark.id + '" title="Options"><div class="css-icon icon-dots icon-small"></div></button>' +
              '<div class="menu-dropdown">' +
                '<button class="menu-item edit-bookmark" data-id="' + bookmark.id + '">Edit</button>' +
                '<button class="menu-item add-to-folder" data-id="' + bookmark.id + '">Add to Folder</button>' +
                '<button class="menu-item delete-bookmark" data-id="' + bookmark.id + '">Delete</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="bookmark-card-info">' +
            '<h3 class="bookmark-title">' + escapeHtml(bookmark.title) + '</h3>' +
            '<p class="bookmark-domain">' + bookmark.domain + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="bookmark-card-footer">' +
          '<div class="bookmark-category">' + bookmark.category + '</div>' +
        '</div>';
      
      // Close any open dropdowns when hovering on other bookmarks
      card.addEventListener('mouseenter', () => {
        modal.querySelectorAll('.menu-dropdown').forEach(menu => {
          const menuParent = menu.closest('.bookmark-item');
          // Only close if this is a different bookmark
          if (menuParent !== card) {
            menu.classList.remove('menu-dropdown-show');
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
      
      // Click to open (except on buttons)
      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          window.open(bookmark.url, '_blank');
        }
      });
      
      fragment.appendChild(card);
    });

    // Append all cards at once for better performance
    container.appendChild(fragment);

    // Attach event listeners for bookmark actions
    attachBookmarkActionListeners();
  }

  function displayListView() {
    if (!modal) {
      return;
    }
    
    const container = modal.querySelector('#bookmarks-list');
    const gridContainer = modal.querySelector('#bookmarks-grid');
    
    if (!container || !gridContainer) {
      return;
    }
    
    // Ensure proper visibility toggle
    gridContainer.classList.remove('show');
    container.classList.add('show');
    container.innerHTML = '';
    
    if (!filteredBookmarks || filteredBookmarks.length === 0) {
      container.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 14px; padding: 60px 16px; text-align: center;"><div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📖</div><div style="font-size: 16px; margin-bottom: 6px;">No bookmarks found</div><div style="font-size: 12px; opacity: 0.8;">Try adjusting your search or add some bookmarks</div></div>';
      return;
    }

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    filteredBookmarks.forEach(bookmark => {
      
      const item = document.createElement('div');
      item.className = 'bookmark-list-item bookmark-item';
      
      // Ensure bookmark has all required properties
      let safeDomain = bookmark.domain || 'Unknown';
      let safeFavicon = bookmark.favicon;
      
      if (!bookmark.domain && bookmark.url) {
        try {
          safeDomain = new URL(bookmark.url).hostname;
        } catch (e) {
          safeDomain = 'Unknown';
        }
      }
      
      if (!bookmark.favicon && bookmark.url) {
        try {
          const hostname = new URL(bookmark.url).hostname;
          safeFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
        } catch (e) {
          safeFavicon = null;
        }
      }
      
      const faviconHtml = safeFavicon ? 
        '<img src="' + safeFavicon + '" class="bookmark-list-favicon-img" onerror="this.classList.add(\'favicon-error\'); this.nextElementSibling.classList.remove(\'hidden\');"><div class="bookmark-list-favicon-fallback hidden">🌐</div>' :
        '<div class="bookmark-list-favicon-default">🌐</div>';

      item.innerHTML = 
        '<div class="bookmark-list-content">' +
          '<div class="bookmark-list-favicon">' + faviconHtml + '</div>' +
          '<div class="bookmark-list-info">' +
            '<h3 class="bookmark-list-title">' + escapeHtml(bookmark.title || 'Untitled') + '</h3>' +
            '<div class="bookmark-list-domain">' + safeDomain + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="bookmark-menu bookmark-list-menu" data-id="' + bookmark.id + '">' +
          '<button class="menu-trigger" title="Options">⋮</button>' +
          '<div class="action-buttons">' +
            '<button class="action-btn add-folder" title="Add to Folder" data-action="add-folder" data-id="' + bookmark.id + '">+</button>' +
            '<button class="action-btn edit" title="Edit" data-action="edit" data-id="' + bookmark.id + '">✎</button>' +
            '<button class="action-btn delete" title="Delete" data-action="delete" data-id="' + bookmark.id + '">−</button>' +
          '</div>' +
          '<button class="menu-collapse" title="Hide menu">×</button>' +
        '</div>';
      
      
      // Hover effects for list items
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = '#444';
        item.style.background = 'linear-gradient(135deg, #252525 0%, #1a1a1a 100%)';
        const menu = item.querySelector('.bookmark-menu, .bookmark-list-menu');
        if (menu) menu.style.opacity = '1';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = '#333';
        item.style.background = 'linear-gradient(135deg, #222 0%, #111 100%)';
        const menu = item.querySelector('.bookmark-menu, .bookmark-list-menu');
        if (menu) menu.style.opacity = '0';
      });
      
      // Click to open (except on buttons)
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          window.open(bookmark.url, '_blank');
        }
      });
      
      fragment.appendChild(item);
    });
    
    // Append all items at once for better performance
    container.appendChild(fragment);
    
    console.log('List view rendered successfully. Fragment children:', fragment.children?.length || 0);
    console.log('Container after append:', container.children?.length || 0);

    // Attach event listeners for bookmark actions
    attachBookmarkActionListeners();
  }

  function attachBookmarkActionListeners() {
    // Remove existing listeners first to prevent duplicates
    modal.querySelectorAll('.menu-trigger').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    // Menu trigger listeners (3-dot button)
    modal.querySelectorAll('.menu-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        try {
          e.stopPropagation();
          
          const menuContainer = btn.closest('.bookmark-list-menu') || btn.closest('.bookmark-menu');
          
          if (!menuContainer) {
            console.warn('Menu container not found for button:', btn, 'Parent elements:', btn.parentElement, btn.parentElement?.parentElement);
            return;
          }
          
          // Close all other expanded menus
          modal.querySelectorAll('.bookmark-list-menu.expanded, .bookmark-menu.expanded').forEach(menu => {
            if (menu !== menuContainer) {
              menu.classList.remove('expanded');
            }
          });
          
          // Close all dropdown menus
          modal.querySelectorAll('.menu-dropdown.menu-dropdown-show').forEach(dropdown => {
            dropdown.classList.remove('menu-dropdown-show');
          });
          
          // Handle both new expandable menu and old dropdown menu
          const dropdown = menuContainer.querySelector('.menu-dropdown');
          if (dropdown) {
            // Old grid view dropdown system
            dropdown.classList.toggle('menu-dropdown-show');
          } else {
            // New list view expandable system
            menuContainer.classList.toggle('expanded');
          }
        } catch (error) {
          console.error('Error in menu trigger click handler:', error, 'Button:', btn);
        }
      });
    });

    // Action button listeners
    modal.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const action = btn.dataset.action;
        const bookmarkId = btn.dataset.id;
        const menuContainer = btn.closest('.bookmark-list-menu');
        
        // Close the expanded menu
        menuContainer.classList.remove('expanded');
        
        // Handle the action
        if (action === 'add-folder') {
          handleAddToFolder(bookmarkId);
        } else if (action === 'edit') {
          handleEditBookmark(bookmarkId);
        } else if (action === 'delete') {
          handleDeleteBookmark(bookmarkId);
        }
      });
    });

    // Menu collapse button listeners
    modal.querySelectorAll('.menu-collapse').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuContainer = btn.closest('.bookmark-list-menu');
        menuContainer.classList.remove('expanded');
      });
    });

    // Close expanded menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.bookmark-list-menu') && !e.target.closest('.bookmark-menu')) {
        // Close expandable menus
        modal.querySelectorAll('.bookmark-list-menu.expanded').forEach(menu => {
          menu.classList.remove('expanded');
        });
        // Close dropdown menus
        modal.querySelectorAll('.menu-dropdown.menu-dropdown-show').forEach(dropdown => {
          dropdown.classList.remove('menu-dropdown-show');
        });
      }
    });

    // Handler functions
    function handleAddToFolder(bookmarkId) {
      // For now, show a simple notification - can be enhanced later
      showNotification('Add to folder functionality coming soon!', 'info');
    }

    function handleEditBookmark(bookmarkId) {
      // Call the edit function directly
      editBookmark(bookmarkId);
    }

    function handleDeleteBookmark(bookmarkId) {
      // Call the delete function directly
      deleteBookmark(bookmarkId);
    }

    // Edit bookmark listeners
    modal.querySelectorAll('.edit-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        // Close menu
        const menuDropdown = btn.closest('.menu-dropdown');
        if (menuDropdown) {
          menuDropdown.classList.remove('menu-dropdown-show');
        }
        editBookmark(bookmarkId);
      });
    });

    // Delete bookmark listeners  
    modal.querySelectorAll('.delete-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        // Close menu
        const menuDropdown = btn.closest('.menu-dropdown');
        if (menuDropdown) {
          menuDropdown.classList.remove('menu-dropdown-show');
        }
        deleteBookmark(bookmarkId);
      });
    });

    // Add to folder listeners
    modal.querySelectorAll('.add-to-folder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        // Close menu
        const menuDropdown = btn.closest('.menu-dropdown');
        if (menuDropdown) {
          menuDropdown.classList.remove('menu-dropdown-show');
        }
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
      container.innerHTML = '<div style="padding: 20px; color: #666; font-size: 14px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px;"><div style="font-size: 28px; opacity: 0.4;">🔍</div><div style="font-weight: 500;">No bookmarks found</div><div style="font-size: 12px; opacity: 0.7;">Try a different search term</div></div>';
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create result items
    results.slice(0, 6).forEach((bookmark, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.dataset.url = bookmark.url;
      resultItem.dataset.index = index;
      resultItem.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; min-height: 68px;';
      
      const faviconHtml = bookmark.favicon ? 
        `<img src="${bookmark.favicon}" style="width: 20px; height: 20px; border-radius: 4px; margin-right: 12px; flex-shrink: 0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display: none; font-size: 16px; opacity: 0.6; margin-right: 12px; flex-shrink: 0;">🌐</div>` :
        '<div style="font-size: 16px; opacity: 0.6; margin-right: 12px; flex-shrink: 0;">🌐</div>';
      
      resultItem.innerHTML = faviconHtml +
        '<div style="flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">' +
          `<div style="font-size: 14px; font-weight: 500; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(bookmark.title)}</div>` +
          `<div style="font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8;">${bookmark.url}</div>` +
        '</div>' +
        `<div style="background: rgba(235, 89, 57, 0.15); color: #eb5939; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; margin-left: 12px; flex-shrink: 0;">${bookmark.category || 'All Bookmarks'}</div>`;
      
      // Add click event listener
      resultItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(bookmark.url, '_blank');
        hideSearchPopup();
      });
      
      // CSS handles hover effects
      
      container.appendChild(resultItem);
    });
    
    // Add count indicator if there are more results
    const moreCount = results.length > 6 ? results.length - 6 : 0;
    if (moreCount > 0) {
      const moreIndicator = document.createElement('div');
      moreIndicator.style.cssText = 'padding: 10px 16px; color: #eb5939; font-size: 12px; text-align: center; font-weight: 500; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(235, 89, 57, 0.03);';
      moreIndicator.textContent = `+ ${moreCount} more bookmark${moreCount !== 1 ? 's' : ''}`;
      container.appendChild(moreIndicator);
    }
  }

  function searchBookmarks(query) {
    // Determine which bookmarks to search based on current mode
    let searchSource = allBookmarks;
    if (currentMode === 'folder') {
      const folder = customFolders.find(f => f.id === currentCategory);
      searchSource = folder ? folder.bookmarks : [];
    }
    
    if (!searchSource || !Array.isArray(searchSource)) {
      return [];
    }
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    const results = searchSource.map(bookmark => {
      let score = 0;
      const title = bookmark.title.toLowerCase();
      const domain = bookmark.domain.toLowerCase();
      const url = bookmark.url.toLowerCase();
      const category = bookmark.category ? bookmark.category.toLowerCase() : '';
      
      // Exact matches get highest score
      if (title.includes(query)) score += 100;
      if (domain.includes(query)) score += 80;
      if (url.includes(query)) score += 60;
      if (category.includes(query)) score += 40;
      
      // Individual word matches
      searchTerms.forEach(term => {
        if (title.includes(term)) score += 20;
        if (domain.includes(term)) score += 15;
        if (url.includes(term)) score += 10;
        if (category.includes(term)) score += 8;
        
        // Bonus for word starts
        if (title.indexOf(term) === 0) score += 30;
        if (domain.indexOf(term) === 0) score += 25;
      });
      
      return { bookmark, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.bookmark);
    
    return results;
  }

  function editBookmark(bookmarkId) {
    if (!bookmarkId || !allBookmarks || !Array.isArray(allBookmarks)) {
      console.warn('Invalid parameters:', { bookmarkId, allBookmarksType: typeof allBookmarks });
      return;
    }
    
    const bookmark = allBookmarks.find(b => b && b.id === bookmarkId);
    if (!bookmark) {
      console.warn('Bookmark not found for id:', bookmarkId);
      return;
    }
    
    showEditBookmarkModal(bookmarkId);
  }

  function showEditBookmarkModal(bookmarkId) {
    if (!bookmarkId || !allBookmarks || !Array.isArray(allBookmarks)) {
      console.warn('Invalid parameters:', { bookmarkId, allBookmarksType: typeof allBookmarks });
      return;
    }
    
    const bookmark = allBookmarks.find(b => b && b.id === bookmarkId);
    if (!bookmark) {
      console.warn('Bookmark not found for id:', bookmarkId);
      return;
    }

    // Remove existing modal if any
    const existingModal = document.querySelector('#edit-bookmark-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const editModal = document.createElement('div');
    editModal.id = 'edit-bookmark-modal';
    editModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483649;
      backdrop-filter: blur(8px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'safis-modal-content';

    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #fff; font-size: 18px; font-weight: 600;">Edit Bookmark</h2>
        <button id="close-edit-modal" class="btn-close">×</button>
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #ccc; font-size: 14px; margin-bottom: 8px; font-weight: 500;">Bookmark Title</label>
        <input id="bookmark-title-input" type="text" value="${escapeHtml(bookmark.title)}" style="
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(235, 89, 57, 0.3);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        ">
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-edit-modal" style="
          padding: 10px 20px;
          border: 2px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #ccc;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Cancel</button>
        <button id="save-edit-btn" style="
          padding: 10px 20px;
          border: 1px;
          background: #000000;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: white;
          transition: all 0.2s;
        ">Save Changes</button>
      </div>
    `;

    editModal.appendChild(modalContent);
    document.body.appendChild(editModal);

    // Focus input and select all text
    const input = editModal.querySelector('#bookmark-title-input');
    input.focus();
    input.select();

    // Input focus styles
    input.addEventListener('focus', () => {
      input.style.borderColor = '#eb5939';
      input.style.boxShadow = '0 0 0 3px rgba(235, 89, 57, 0.1)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(235, 89, 57, 0.3)';
      input.style.boxShadow = 'none';
    });

    // Close handlers
    const closeModal = () => {
      editModal.remove();
    };

    editModal.querySelector('#close-edit-modal').addEventListener('click', closeModal);
    editModal.querySelector('#cancel-edit-modal').addEventListener('click', closeModal);
    
    // Click outside to close
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeModal();
    });

    // Save handler
    editModal.querySelector('#save-edit-btn').addEventListener('click', () => {
      const newTitle = input.value.trim();
      if (!newTitle) {
        input.style.borderColor = '#ff6b6b';
        input.focus();
        return;
      }

      chrome.runtime.sendMessage({
        type: 'UPDATE_BOOKMARK',
        bookmarkId: bookmarkId,
        title: newTitle
      }).then(response => {
        if (response && response.success) {
          // Update local data
          bookmark.title = newTitle;
          showNotification('Bookmark title updated!', 'success');
          displayBookmarks();
          closeModal();
        } else {
          showNotification('Failed to update bookmark', 'error');
        }
      }).catch(error => {
        console.error('Failed to update bookmark:', error);
        showNotification('Failed to update bookmark', 'error');
      });
    });

    // Enter key to save
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        editModal.querySelector('#save-edit-btn').click();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  function deleteBookmark(bookmarkId) {
    if (!bookmarkId || !allBookmarks || !Array.isArray(allBookmarks)) {
      console.warn('Invalid parameters:', { bookmarkId, allBookmarksType: typeof allBookmarks });
      return;
    }
    
    const bookmark = allBookmarks.find(b => b && b.id === bookmarkId);
    if (!bookmark) {
      console.warn('Bookmark not found for id:', bookmarkId);
      return;
    }

    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483649;
      backdrop-filter: blur(8px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'safis-modal-content';

    modalContent.innerHTML = `
      <div class="delete-dialog-content">
        <div class="delete-dialog-icon">🗑️</div>
        <h2 class="delete-dialog-title">Delete Bookmark</h2>
        <p class="delete-dialog-text">Are you sure you want to delete "<strong>${escapeHtml(bookmark.title)}</strong>"?<br>This action cannot be undone.</p>
      </div>
      <div class="delete-dialog-actions">
        <button id="cancel-delete-bookmark" style="
          padding: 10px 20px;
          border: 2px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #ccc;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Cancel</button>
        <button id="confirm-delete-bookmark" style="
          padding: 10px 20px;
          border: none;
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Delete Bookmark</button>
      </div>
    `;

    confirmModal.appendChild(modalContent);
    document.body.appendChild(confirmModal);

    // Close handlers
    const closeModal = () => {
      confirmModal.remove();
    };

    confirmModal.querySelector('#cancel-delete-bookmark').addEventListener('click', closeModal);
    
    // Click outside to close
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeModal();
    });

    // Delete handler
    confirmModal.querySelector('#confirm-delete-bookmark').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'DELETE_BOOKMARK',
        bookmarkId: bookmarkId
      }).then(response => {
        if (response && response.success) {
          // Remove from local data
          allBookmarks = allBookmarks.filter(b => b.id !== bookmarkId);
          showNotification('Bookmark deleted successfully! 🗑️', 'success');
          filterBookmarks();
          displayBookmarks();
          closeModal();
        }
      }).catch(error => {
        console.error('Failed to delete bookmark:', error);
        showNotification('Failed to delete bookmark', 'error');
        closeModal();
      });
    });

    // ESC key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
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
      console.log('Loading bookmarks from background script...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
      
      if (response && response.bookmarks) {
        allBookmarks = [];
        processBookmarkNodes(response.bookmarks, allBookmarks);
        
        // Process bookmarks and add metadata
        allBookmarks.forEach(bookmark => {
          try {
            bookmark.category = detectCategory(bookmark.title, bookmark.url); // Generic category
            bookmark.domain = new URL(bookmark.url).hostname.replace('www.', '');
            bookmark.favicon = `https://www.google.com/s2/favicons?domain=${bookmark.domain}&sz=64`;
          } catch (urlError) {
            console.warn('Failed to process bookmark:', bookmark, urlError);
            bookmark.category = 'bookmark';
            bookmark.domain = 'unknown';
            bookmark.favicon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTggMTJhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4WiIgZmlsbD0iIzk5OTk5OSIvPjwvc3ZnPg==';
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
      console.log('=== STARTING LOAD CUSTOM FOLDERS ===');
      
      // Check if chrome.storage API is available
      if (!chrome?.storage?.local) {
        console.warn('Chrome storage API not available');
        customFolders = [];
        displayFolders();
        return;
      }

      // First, load existing folders from extension storage with retry mechanism
      console.log('Loading existing folders from extension storage...');
      let result;
      try {
        result = await chrome.storage.local.get(['customFolders']);
      } catch (storageError) {
        console.warn('First storage read failed, retrying...', storageError);
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 200));
        result = await chrome.storage.local.get(['customFolders']);
      }
      
      customFolders = result.customFolders || [];
      console.log('Loaded custom folders from extension storage:', customFolders.length);
      
      // Display folders immediately to show what's already saved
      if (customFolders.length > 0) {
        console.log('Displaying saved folders immediately');
        displayFolders();
      }
      
      // Then sync any new folders from Chrome bookmarks via background script
      console.log('Starting Chrome bookmarks sync...');
      try {
        await syncFromChromeBookmarks();
        console.log('Total folders after Chrome sync:', customFolders.length);
      } catch (syncError) {
        console.warn('Chrome bookmarks sync failed, continuing with saved folders:', syncError);
      }
      
      // Final display of all folders (saved + synced)
      console.log('Displaying all folders in UI...');
      displayFolders();
      console.log('=== LOAD CUSTOM FOLDERS COMPLETE ===');
      
    } catch (error) {
      console.error('Failed to load custom folders:', error);
      // Initialize with empty array but still try to load from storage one more time
      try {
        const fallbackResult = await chrome.storage.local.get(['customFolders']);
        customFolders = fallbackResult.customFolders || [];
        console.log('Fallback storage read successful:', customFolders.length, 'folders');
      } catch (fallbackError) {
        console.error('Fallback storage read also failed:', fallbackError);
        customFolders = [];
      }
      // Always display folders, even if empty
      displayFolders();
    }
  }

  // Chrome Bookmarks API Integration
  async function createChromeBookmarkFolder(folderName, parentId = null) {
    try {
      const targetParentId = parentId || '1'; // Default to bookmarks bar
      
      // Create the custom folder via background script
      const response = await sendMessageToBackground({
        type: 'CREATE_BOOKMARK_FOLDER',
        folderName,
        parentId: targetParentId
      });
      
      if (response.success) {
        console.log('Created Chrome bookmark folder:', response.folder);
        return response.folder;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to create Chrome bookmark folder:', error);
      throw error;
    }
  }


  async function findBookmarkFolderByName(folderName, parentId = null) {
    try {
      if (!folderName) {
        console.warn('findBookmarkFolderByName: folderName is required');
        return null;
      }

      let searchResults;
      if (parentId) {
        // Get children of specific folder
        const response = await sendMessageToBackground({
          type: 'GET_FOLDER_CHILDREN',
          folderId: parentId
        });
        if (!response.success) {
          return null;
        }
        searchResults = response.children;
      } else {
        // Search by title
        const response = await sendMessageToBackground({
          type: 'SEARCH_BOOKMARKS',
          query: folderName
        });
        if (!response.success) {
          return null;
        }
        searchResults = response.results;
      }
      
      if (!searchResults || !Array.isArray(searchResults)) {
        console.warn('Invalid search results:', searchResults);
        return null;
      }

      return searchResults.find(node => 
        node && node.title === folderName && node.url === undefined // folder has no URL
      ) || null;
    } catch (error) {
      console.error('Error searching for bookmark folder:', error);
      return null;
    }
  }

  async function deleteChromeBookmarkFolder(chromeBookmarkId) {
    try {
      if (chromeBookmarkId) {
        const response = await sendMessageToBackground({
          type: 'DELETE_BOOKMARK_FOLDER',
          folderId: chromeBookmarkId
        });
        
        if (response.success) {
          console.log('Deleted Chrome bookmark folder:', chromeBookmarkId);
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      console.error('Failed to delete Chrome bookmark folder:', error);
      throw error;
    }
  }

  async function updateChromeBookmarkFolder(chromeBookmarkId, newTitle) {
    try {
      if (chromeBookmarkId) {
        const response = await sendMessageToBackground({
          type: 'UPDATE_BOOKMARK_FOLDER',
          folderId: chromeBookmarkId,
          newTitle
        });
        
        if (response.success) {
          console.log('Updated Chrome bookmark folder:', response.folder);
          return response.folder;
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      console.error('Failed to update Chrome bookmark folder:', error);
      throw error;
    }
  }

  async function addBookmarkToChromeFolder(chromeBookmarkId, bookmarkUrl, bookmarkTitle) {
    try {
      if (chromeBookmarkId) {
        const bookmark = await chrome.bookmarks.create({
          parentId: chromeBookmarkId,
          title: bookmarkTitle,
          url: bookmarkUrl
        });
        console.log('Added bookmark to Chrome folder:', bookmark);
        return bookmark;
      }
    } catch (error) {
      console.error('Failed to add bookmark to Chrome folder:', error);
      throw error;
    }
  }

  async function syncFromChromeBookmarks() {
    try {
      console.log('Starting Chrome → Extension bidirectional folder sync...');

      // Get ALL Chrome bookmark folders from everywhere (not just Safis Folders)
      const allChromeFolders = await getAllChromeBookmarkFolders();
      if (!allChromeFolders || allChromeFolders.length === 0) {
        console.log('No Chrome bookmark folders found to sync');
        return;
      }
      
      console.log(`Found ${allChromeFolders.length} Chrome bookmark folders to sync`);
      const bookmarkFolders = allChromeFolders;
      
      // Track which folders we need to merge/add
      const existingFolderIds = new Set(customFolders.map(f => f.chromeBookmarkId));
      const newFoldersFromChrome = [];
      
      // Process each Chrome bookmark folder
      for (const chromeFolder of bookmarkFolders) {
        if (!chromeFolder || !chromeFolder.id || !chromeFolder.title) {
          console.warn('Invalid Chrome folder data:', chromeFolder);
          continue;
        }

        // Skip if we already have this folder
        if (existingFolderIds.has(chromeFolder.id)) {
          console.log(`Folder "${chromeFolder.title}" already synced`);
          continue;
        }
        
        try {
          // Get bookmarks within this Chrome folder via message passing
          const response = await sendMessageToBackground({
            type: 'GET_FOLDER_CHILDREN',
            folderId: chromeFolder.id
          });
          
          if (!response.success) {
            console.warn(`Failed to get bookmarks for folder "${chromeFolder.title}":`, response.error);
            continue;
          }
          
          const chromeBookmarks = response.children;
          if (!chromeBookmarks || !Array.isArray(chromeBookmarks)) {
            console.warn(`Invalid bookmarks data for folder "${chromeFolder.title}":`, chromeBookmarks);
            continue;
          }

          const folderBookmarks = chromeBookmarks
            .filter(node => node && node.url !== undefined && node.title) // Only valid bookmarks
            .map(bookmark => {
              try {
                return {
                  id: bookmark.id,
                  title: bookmark.title,
                  url: bookmark.url,
                  category: detectCategory(bookmark.title, bookmark.url),
                  domain: new URL(bookmark.url).hostname.replace('www.', ''),
                  favicon: `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname.replace('www.', '')}&sz=64`,
                  dateAdded: bookmark.dateAdded || Date.now()
                };
              } catch (urlError) {
                console.warn('Failed to process bookmark:', bookmark, urlError);
                return null;
              }
            })
            .filter(bookmark => bookmark !== null);
        
          // Create extension folder from Chrome folder
          const extensionFolder = {
            id: `chrome_${chromeFolder.id}_${Date.now()}`, // Unique ID for extension
            name: chromeFolder.title,
            bookmarks: folderBookmarks,
            created: chromeFolder.dateAdded || Date.now(),
            chromeBookmarkId: chromeFolder.id // Link to Chrome folder
          };
          
          newFoldersFromChrome.push(extensionFolder);
          console.log(`Synced folder "${chromeFolder.title}" with ${folderBookmarks.length} bookmarks`);
        } catch (folderError) {
          console.error(`Failed to sync folder "${chromeFolder.title}":`, folderError);
        }
      }
      
      // Add new folders to customFolders array
      if (newFoldersFromChrome.length > 0) {
        customFolders.push(...newFoldersFromChrome);
        
        // Save to extension storage
        await saveCustomFolders();
        console.log(`Synced ${newFoldersFromChrome.length} new folders from Chrome bookmarks`);
      } else {
        console.log('No new folders to sync from Chrome bookmarks');
      }
      
    } catch (error) {
      console.error('Failed to sync from Chrome bookmarks:', error);
    }
  }

  // Enhanced bidirectional sync - monitors Chrome bookmark changes via messages
  function setupBidirectionalSync() {
    try {
      if (!chrome?.runtime?.onMessage) {
        console.warn('Chrome runtime onMessage API not available - skipping bidirectional sync setup');
        return;
      }

      // Listen for messages from background script about bookmark changes
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'BOOKMARK_CREATED') {
        console.log('Chrome bookmark created:', message.bookmark);
        if (!message.bookmark.url && message.bookmark.title) { // It's a folder
          syncFromChromeBookmarks();
          displayFolders(); // Refresh the UI
        }
      }
      
      if (message.type === 'BOOKMARK_REMOVED') {
        console.log('Chrome bookmark removed:', message.id);
        // Remove from extension if it was synced
        const folderIndex = customFolders.findIndex(f => f.chromeBookmarkId === message.id);
        if (folderIndex > -1) {
          customFolders.splice(folderIndex, 1);
          saveCustomFolders();
          displayFolders(); // Refresh the UI
          console.log('Removed synced folder from extension');
        }
      }
      
      if (message.type === 'BOOKMARK_CHANGED') {
        console.log('Chrome bookmark changed:', message.id, message.changeInfo);
        // Update extension if it was synced
        const folder = customFolders.find(f => f.chromeBookmarkId === message.id);
        if (folder && message.changeInfo.title) {
          folder.name = message.changeInfo.title;
          saveCustomFolders();
          displayFolders(); // Refresh the UI
          console.log('Updated synced folder name in extension');
        }
      }
      });

      console.log('Bidirectional sync listeners established');
    } catch (error) {
      console.error('Failed to setup bidirectional sync:', error);
    }
  }

  // Helper function to send messages to background script
  async function sendMessageToBackground(message) {
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

  // Helper function to save custom folders to storage
  async function saveCustomFolders() {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ customFolders });
        console.log('Saved custom folders to storage');
      } else {
        console.warn('Chrome storage API not available');
      }
    } catch (error) {
      console.error('Failed to save custom folders:', error);
    }
  }

  // Manual sync function for full refresh
  async function performFullSync() {
    try {
      console.log('Performing full bidirectional sync...');
      await syncFromChromeBookmarks();
      displayFolders();
      showNotification('Sync completed successfully!', 'success');
    } catch (error) {
      console.error('Full sync failed:', error);
      showNotification('Sync failed. Please try again.', 'error');
    }
  }

  async function showImportChromeFoldersModal() {
    if (isProcessing) return;
    isProcessing = true;
    
    // Get all Chrome bookmark folders
    const chromeFolders = await getAllChromeBookmarkFolders();
    
    if (chromeFolders.length === 0) {
      showNotification('No Chrome bookmark folders found to import', 'info');
      isProcessing = false;
      return;
    }
    
    // Remove existing modal if any
    const existingModal = document.querySelector('#import-folders-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const importModal = document.createElement('div');
    importModal.id = 'import-folders-modal';
    importModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483649;
      backdrop-filter: blur(8px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: linear-gradient(135deg, rgba(26, 26, 26, 0.98), rgba(34, 34, 34, 0.98));
      border: 1px solid #444;
      border-radius: 16px;
      padding: 24px;
      width: 500px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.9);
      backdrop-filter: blur(24px);
    `;

    const foldersListHTML = chromeFolders.map(folder => `
      <div class="import-folder-item" data-folder-id="${folder.id}" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border: 1px solid rgba(235, 89, 57, 0.3);
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
        background: rgba(255,255,255,0.02);
      ">
        <div style="flex: 1;">
          <div style="color: #fff; font-weight: 500; font-size: 14px;">${escapeHtml(folder.title)}</div>
          <div style="color: #888; font-size: 12px; margin-top: 2px;">${folder.path || 'Root level'} • ${folder.children?.filter(c => c.url).length || 0} bookmarks</div>
        </div>
        <button class="import-btn" data-folder-id="${folder.id}" data-folder-name="${escapeHtml(folder.title)}" style="
          padding: 6px 12px;
          border: 2px solid #eb5939;
          background: rgba(235, 89, 57, 0.2);
          color: #eb5939;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        ">Import</button>
      </div>
    `).join('');

    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #fff; font-size: 18px; font-weight: 600;">Import Chrome Bookmark Folders</h2>
        <button id="close-import-modal" style="width: 28px; height: 28px; border: none; background: rgba(255,255,255,0.1); color: #999; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; color: #ccc; font-size: 14px;">Select Chrome bookmark folders to import into the extension:</p>
        <div style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
          ${foldersListHTML}
        </div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-import-modal" style="
          padding: 10px 20px;
          border: 2px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #ccc;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Cancel</button>
      </div>
    `;

    try {
      importModal.appendChild(modalContent);
      document.body.appendChild(importModal);
    } catch (error) {
      console.error('Error appending import modal to DOM:', error);
      isProcessing = false;
      return;
    }

    // Close handlers
    const closeModal = () => {
      try {
        if (importModal && importModal.parentNode) {
          importModal.remove();
        }
        isProcessing = false;
      } catch (error) {
        console.warn('Error closing import modal:', error);
        isProcessing = false;
      }
    };

    const closeBtn = importModal.querySelector('#close-import-modal');
    const cancelBtn = importModal.querySelector('#cancel-import-modal');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Click outside to close
    importModal.addEventListener('click', (e) => {
      if (e.target === importModal) closeModal();
    });

    // Import button handlers
    importModal.querySelectorAll('.import-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const folderId = btn.dataset.folderId;
        const folderName = btn.dataset.folderName;
        
        btn.textContent = 'Importing...';
        btn.disabled = true;
        
        try {
          await importSpecificChromeFolder(folderId, folderName);
          btn.textContent = '✓ Imported';
          btn.style.background = 'rgba(34, 197, 94, 0.2)';
          btn.style.borderColor = '#22c55e';
          btn.style.color = '#22c55e';
          
          // Wait for storage to be saved before refreshing display
          setTimeout(async () => {
            try {
              // Verify the folder was saved
              const result = await chrome.storage.local.get(['customFolders']);
              const savedFolders = result.customFolders || [];
              console.log('Verifying saved folders after import:', savedFolders.length);
              
              // Update local state to match storage
              customFolders = savedFolders;
              
              // Refresh the folder display
              displayFolders();
              
              showNotification(`Successfully imported "${folderName}"! Folder will persist after extension restart.`, 'success');
              
              // Auto-close after successful import and verification
              setTimeout(() => {
                closeModal();
              }, 1500);
            } catch (verifyError) {
              console.error('Error verifying import:', verifyError);
              // Still show the folders even if verification fails
              displayFolders();
              setTimeout(() => {
                closeModal();
              }, 1000);
            }
          }, 300);
          
        } catch (error) {
          btn.textContent = 'Error';
          btn.style.background = 'rgba(239, 68, 68, 0.2)';
          btn.style.borderColor = '#ef4444';
          btn.style.color = '#ef4444';
          btn.disabled = false; // Re-enable for retry
          showNotification(`Failed to import "${folderName}": ${error.message}`, 'error');
          console.error('Import error details:', error);
          
          // Reset button after 3 seconds to allow retry
          setTimeout(() => {
            btn.textContent = 'Import';
            btn.style.background = 'rgba(235, 89, 57, 0.2)';
            btn.style.borderColor = '#eb5939';
            btn.style.color = '#eb5939';
          }, 3000);
        }
      });
    });

    // ESC key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }

  async function getAllChromeBookmarkFolders() {
    try {
      console.log('Requesting Chrome bookmark folders from background script...');
      
      const response = await sendMessageToBackground({
        type: 'GET_ALL_BOOKMARK_FOLDERS'
      });
      
      if (response && response.success) {
        console.log(`Retrieved ${response.folders.length} Chrome bookmark folders`);
        return response.folders;
      } else {
        console.error('Failed to get Chrome bookmark folders:', response?.error || 'Unknown error');
        return [];
      }
    } catch (error) {
      console.error('Failed to get Chrome bookmark folders:', error);
      return [];
    }
  }

  async function importSpecificChromeFolder(chromeFolderId, folderName) {
    try {
      // Check if folder is already imported
      const existingFolder = customFolders.find(f => f.chromeBookmarkId === chromeFolderId);
      if (existingFolder) {
        console.log(`Folder "${folderName}" already imported`);
        return existingFolder;
      }
      
      // Get bookmarks from the Chrome folder via message passing
      const response = await sendMessageToBackground({
        type: 'GET_FOLDER_CHILDREN',
        folderId: chromeFolderId
      });
      
      if (!response || !response.success) {
        throw new Error(`Failed to get folder children: ${response?.error || 'Unknown error'}`);
      }
      
      const chromeBookmarks = response.children;
      const folderBookmarks = chromeBookmarks
        .filter(node => node.url !== undefined) // Only actual bookmarks
        .map(bookmark => ({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          category: detectCategory(bookmark.title, bookmark.url),
          domain: new URL(bookmark.url).hostname.replace('www.', ''),
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname.replace('www.', '')}&sz=64`,
          dateAdded: bookmark.dateAdded || Date.now()
        }));
      
      // Create extension folder
      const extensionFolder = {
        id: `chrome_${chromeFolderId}_${Date.now()}`,
        name: folderName,
        bookmarks: folderBookmarks,
        created: Date.now(),
        chromeBookmarkId: chromeFolderId
      };
      
      // Add to customFolders
      customFolders.push(extensionFolder);
      
      // Save to storage with error handling and retry mechanism
      try {
        await chrome.storage.local.set({ customFolders });
        console.log('Custom folders saved to storage successfully');
      } catch (storageError) {
        console.error('Failed to save to storage, retrying...', storageError);
        // Retry once after a short delay
        setTimeout(async () => {
          try {
            await chrome.storage.local.set({ customFolders });
            console.log('Custom folders saved to storage on retry');
          } catch (retryError) {
            console.error('Failed to save to storage even on retry', retryError);
          }
        }, 500);
      }
      
      // Force a refresh of the folders display to ensure persistence
      setTimeout(() => {
        console.log('Refreshing folders display after import');
        displayFolders();
      }, 100);
      
      console.log(`Imported folder "${folderName}" with ${folderBookmarks.length} bookmarks`);
      return extensionFolder;
      
    } catch (error) {
      console.error(`Failed to import Chrome folder "${folderName}":`, error);
      throw error;
    }
  }

  // Utility functions
  // Simplified - no category detection needed
  function detectCategory(title, url) {
    return 'bookmark'; // Generic category for all bookmarks
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