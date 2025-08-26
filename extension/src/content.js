let safisModal = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

window.addEventListener('message', (event) => {
  if (event.data.type === 'SAFIS_TOGGLE_MODAL') {
    toggleModal();
  }
});

function toggleModal() {
  if (safisModal) {
    safisModal.style.display = safisModal.style.display === 'none' ? 'block' : 'none';
  } else {
    createModal();
  }
}

function createModal() {
  if (safisModal) return;

  safisModal = document.createElement('div');
  safisModal.id = 'safis-modal';
  safisModal.className = 'safis-modal';
  
  safisModal.innerHTML = `
    <div class="safis-modal-content">
      <div class="safis-header">
        <div class="safis-header-left">
          <div class="safis-logo-icon">🤓</div>
          <h2>Safis</h2>
        </div>
        <div class="safis-header-actions">
          <button class="safis-minimize-btn" title="Minimize">−</button>
          <button class="safis-close-btn" title="Close">×</button>
        </div>
      </div>
      
      <div class="safis-body">
        <div class="safis-toolbar">
          <div class="safis-search-container">
            <input type="text" class="safis-search" placeholder="Search bookmarks...">
            <button class="safis-search-btn">🔍</button>
          </div>
          <button class="safis-add-current-btn">+ Add Current Page</button>
        </div>
        
        <div class="safis-content">
          <div class="safis-bookmark-list">
            <div class="safis-loading">Loading bookmarks...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(safisModal);
  
  setupModalEvents();
  loadBookmarks();
  
  safisModal.style.display = 'block';
}

function setupModalEvents() {
  const header = safisModal.querySelector('.safis-header');
  const closeBtn = safisModal.querySelector('.safis-close-btn');
  const minimizeBtn = safisModal.querySelector('.safis-minimize-btn');
  const addCurrentBtn = safisModal.querySelector('.safis-add-current-btn');
  const searchInput = safisModal.querySelector('.safis-search');

  header.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);

  closeBtn.addEventListener('click', () => {
    safisModal.style.display = 'none';
  });

  minimizeBtn.addEventListener('click', () => {
    safisModal.classList.toggle('minimized');
  });

  addCurrentBtn.addEventListener('click', addCurrentPage);

  searchInput.addEventListener('input', (e) => {
    filterBookmarks(e.target.value);
  });

  document.addEventListener('click', (e) => {
    if (!safisModal.contains(e.target)) {
      safisModal.style.display = 'none';
    }
  });

  safisModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

function startDragging(e) {
  isDragging = true;
  const rect = safisModal.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  safisModal.style.cursor = 'grabbing';
}

function drag(e) {
  if (!isDragging) return;
  
  e.preventDefault();
  
  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;
  
  const maxX = window.innerWidth - safisModal.offsetWidth;
  const maxY = window.innerHeight - safisModal.offsetHeight;
  
  const clampedX = Math.max(0, Math.min(x, maxX));
  const clampedY = Math.max(0, Math.min(y, maxY));
  
  safisModal.style.left = clampedX + 'px';
  safisModal.style.top = clampedY + 'px';
}

function stopDragging() {
  isDragging = false;
  if (safisModal) {
    safisModal.style.cursor = 'default';
  }
}

async function loadBookmarks() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
    displayBookmarks(response.bookmarks);
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    const loadingDiv = safisModal.querySelector('.safis-loading');
    if (loadingDiv) {
      loadingDiv.textContent = 'Failed to load bookmarks';
    }
  }
}

function displayBookmarks(bookmarkTree) {
  const container = safisModal.querySelector('.safis-bookmark-list');
  container.innerHTML = '';
  
  function renderBookmarkNode(node, level = 0) {
    if (node.url) {
      const bookmarkElement = document.createElement('div');
      bookmarkElement.className = 'safis-bookmark-item';
      bookmarkElement.style.paddingLeft = (level * 20) + 'px';
      
      bookmarkElement.innerHTML = `
        <div class="safis-bookmark-content">
          <div class="safis-bookmark-info">
            <div class="safis-bookmark-title">${escapeHtml(node.title || 'Untitled')}</div>
            <div class="safis-bookmark-url">${escapeHtml(node.url)}</div>
          </div>
          <div class="safis-bookmark-actions">
            <button class="safis-bookmark-open" data-url="${escapeHtml(node.url)}">Open</button>
            <button class="safis-bookmark-edit" data-id="${node.id}">Edit</button>
            <button class="safis-bookmark-delete" data-id="${node.id}">Delete</button>
          </div>
        </div>
      `;
      
      container.appendChild(bookmarkElement);
      
      bookmarkElement.querySelector('.safis-bookmark-open').addEventListener('click', () => {
        window.open(node.url, '_blank');
      });
      
      bookmarkElement.querySelector('.safis-bookmark-delete').addEventListener('click', () => {
        deleteBookmark(node.id);
      });
      
    } else if (node.children) {
      if (level > 0) {
        const folderElement = document.createElement('div');
        folderElement.className = 'safis-bookmark-folder';
        folderElement.style.paddingLeft = (level * 20) + 'px';
        folderElement.innerHTML = `<div class="safis-folder-title">📁 ${escapeHtml(node.title || 'Untitled Folder')}</div>`;
        container.appendChild(folderElement);
      }
      
      node.children.forEach(child => {
        renderBookmarkNode(child, level + 1);
      });
    }
  }
  
  bookmarkTree.forEach(node => {
    if (node.children) {
      node.children.forEach(child => {
        renderBookmarkNode(child, 0);
      });
    }
  });
}

async function addCurrentPage() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_BOOKMARK',
      title: document.title,
      url: window.location.href
    });
    
    if (response.success) {
      loadBookmarks();
      showNotification('Bookmark added successfully!');
    }
  } catch (error) {
    console.error('Failed to add bookmark:', error);
    showNotification('Failed to add bookmark', 'error');
  }
}

async function deleteBookmark(id) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REMOVE_BOOKMARK',
      id: id
    });
    
    if (response.success) {
      loadBookmarks();
      showNotification('Bookmark deleted successfully!');
    }
  } catch (error) {
    console.error('Failed to delete bookmark:', error);
    showNotification('Failed to delete bookmark', 'error');
  }
}

function filterBookmarks(searchTerm) {
  const bookmarkItems = safisModal.querySelectorAll('.safis-bookmark-item, .safis-bookmark-folder');
  
  bookmarkItems.forEach(item => {
    const title = item.querySelector('.safis-bookmark-title, .safis-folder-title')?.textContent?.toLowerCase() || '';
    const url = item.querySelector('.safis-bookmark-url')?.textContent?.toLowerCase() || '';
    
    const matches = title.includes(searchTerm.toLowerCase()) || url.includes(searchTerm.toLowerCase());
    item.style.display = matches ? 'block' : 'none';
  });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `safis-notification safis-notification-${type}`;
  notification.textContent = message;
  
  safisModal.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Safis content script loaded');
  });
} else {
  console.log('Safis content script loaded');
}