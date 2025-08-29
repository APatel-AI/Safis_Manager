// Enhanced Safis bookmark manager with sidebar navigation
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Extension clicked, tab:', tab.url);
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      console.log('Cannot inject into system pages');
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Remove any existing modal
        const existing = document.querySelector('#safis-modal');
        if (existing) {
          existing.remove();
        }

        // Create modal with sidebar design
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
          <!-- Sidebar Navigation -->
          <div id="sidebar" style="width: 280px; background: #2A2826; border-right: 1px solid #3E3A35; display: flex; flex-direction: column;">
            <!-- Header -->
            <div id="modal-header" style="padding: 20px; border-bottom: 1px solid #3E3A35; cursor: grab; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px;">🤓</div>
                <span style="font-size: 16px; font-weight: 600; color: #C2C0B6;">Safis</span>
              </div>
              <button id="safis-close" style="width: 32px; height: 32px; border: none; background: rgba(155, 150, 144, 0.1); color: #9B9690; cursor: pointer; font-size: 20px; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">×</button>
            </div>

            <!-- Search Section -->
            <div style="padding: 20px; border-bottom: 1px solid #3E3A35;">
              <div style="position: relative; margin-bottom: 16px;">
                <input id="search-input" type="text" placeholder="Search bookmarks..." style="width: 100%; padding: 12px 16px 12px 40px; background: #34312D; border: 1px solid #3E3A35; border-radius: 8px; color: #C2C0B6; font-size: 14px; outline: none; transition: all 0.2s;">
                <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9B9690; font-size: 16px;">🔍</div>
              </div>
              <button id="add-bookmark-btn" style="width: 100%; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">+ Add Current Page</button>
            </div>

            <!-- Categories Section -->
            <div style="padding: 20px; flex: 1; overflow-y: auto;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #C2C0B6; text-transform: uppercase; letter-spacing: 0.5px;">Categories</h3>
              <div id="categories-list">
                <div id="category-all" class="category-item active" style="padding: 10px 12px; margin-bottom: 4px; border-radius: 6px; cursor: pointer; transition: all 0.2s; background: #667eea; color: white; display: flex; align-items: center; justify-content: space-between;">
                  <span>All Bookmarks</span>
                  <span id="count-all" style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 11px;">0</span>
                </div>
              </div>
            </div>

            <!-- View Options -->
            <div style="padding: 20px; border-top: 1px solid #3E3A35;">
              <div style="display: flex; background: #34312D; border-radius: 6px; padding: 2px;">
                <button id="grid-view" class="view-btn active" style="flex: 1; padding: 8px; border: none; background: #667eea; color: white; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">Grid</button>
                <button id="list-view" class="view-btn" style="flex: 1; padding: 8px; border: none; background: transparent; color: #9B9690; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">List</button>
              </div>
            </div>
          </div>

          <!-- Main Content Area -->
          <div id="main-content" style="flex: 1; display: flex; flex-direction: column; background: #1F1E1D;">
            <!-- Content Header -->
            <div id="content-header" style="padding: 20px 24px; border-bottom: 1px solid #3E3A35; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h2 id="content-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #C2C0B6;">All Bookmarks</h2>
                <p id="content-subtitle" style="margin: 4px 0 0 0; font-size: 13px; color: #9B9690;">Your bookmark collection</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button id="sort-date" class="sort-btn active" style="padding: 6px 12px; border: none; background: #34312D; color: #C2C0B6; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">Recent</button>
                <button id="sort-name" class="sort-btn" style="padding: 6px 12px; border: none; background: transparent; color: #9B9690; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">A-Z</button>
              </div>
            </div>

            <!-- Bookmarks Container -->
            <div id="bookmarks-container" style="flex: 1; padding: 24px; overflow-y: auto; min-height: 300px;">
              <div id="bookmarks-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px;">
                <div id="bookmarks-loading" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9B9690; font-size: 14px; padding: 60px 0; text-align: center;">
                  <div style="width: 48px; height: 48px; border: 3px solid #3E3A35; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                  <div>Loading your bookmarks...</div>
                </div>
              </div>
              <div id="bookmarks-list" style="display: none;">
                <!-- List view content -->
              </div>
            </div>
          </div>

          <!-- Quick Actions Tooltip -->
          <div id="tooltip" style="position: absolute; background: #2A2826; color: #C2C0B6; padding: 8px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; opacity: 0; transition: opacity 0.2s; z-index: 1000; border: 1px solid #3E3A35; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>
          
          <!-- Bookmark Preview Window -->
          <div id="bookmark-preview" style="position: absolute; width: 320px; height: 240px; background: #2A2826; border: 1px solid #3E3A35; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 1001; opacity: 0; pointer-events: none; transition: all 0.3s ease; overflow: hidden; transform: scale(0.95);">
            <div style="padding: 12px; border-bottom: 1px solid #3E3A35; background: #34312D; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                <div id="preview-favicon" style="width: 16px; height: 16px; flex-shrink: 0;">🌐</div>
                <div style="flex: 1; min-width: 0;">
                  <div id="preview-title" style="font-size: 13px; font-weight: 500; color: #C2C0B6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Loading...</div>
                  <div id="preview-url" style="font-size: 11px; color: #9B9690; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">...</div>
                </div>
              </div>
              <div id="preview-category" style="background: #667eea; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; flex-shrink: 0;"></div>
            </div>
            <div id="preview-content" style="flex: 1; height: calc(100% - 49px); position: relative;">
              <div id="preview-loading" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9B9690; font-size: 12px;">
                <div style="width: 24px; height: 24px; border: 2px solid #3E3A35; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 8px;"></div>
                <div>Loading preview...</div>
              </div>
              <iframe id="preview-iframe" style="width: 100%; height: 100%; border: none; background: white; display: none;" sandbox="allow-same-origin allow-scripts"></iframe>
              <div id="preview-error" style="position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; color: #9B9690; font-size: 12px; text-align: center; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
                <div>Preview not available</div>
                <div style="font-size: 10px; margin-top: 4px; opacity: 0.7;">Some sites block previews</div>
              </div>
            </div>
          </div>
        `;

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          #safis-modal::-webkit-scrollbar {
            width: 8px;
          }
          
          #safis-modal::-webkit-scrollbar-track {
            background: #2A2826;
            border-radius: 4px;
          }
          
          #safis-modal::-webkit-scrollbar-thumb {
            background: #3E3A35;
            border-radius: 4px;
          }
          
          #safis-modal::-webkit-scrollbar-thumb:hover {
            background: #4E4A45;
          }
          
          .bookmark-card:hover .quick-actions {
            opacity: 1 !important;
          }
          
          .bookmark-item:hover {
            transform: translateX(4px) !important;
          }
        `;
        document.head.appendChild(style);

        // State management
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let allBookmarks = [];
        let filteredBookmarks = [];
        let currentCategory = 'all';
        let currentView = 'grid';
        let currentSort = 'date';
        let categories = new Map([
          ['Work', { icon: '💼', count: 0 }],
          ['Personal', { icon: '👤', count: 0 }],
          ['Learning', { icon: '📚', count: 0 }],
          ['Entertainment', { icon: '🎬', count: 0 }],
          ['Shopping', { icon: '🛒', count: 0 }],
          ['News', { icon: '📰', count: 0 }],
          ['Social', { icon: '👥', count: 0 }]
        ]);

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
              urlLower.includes('codepen.io') || urlLower.includes('jsfiddle.net') ||
              urlLower.includes('developer.mozilla.org') || urlLower.includes('docs.') ||
              titleLower.includes('api') || titleLower.includes('documentation') ||
              titleLower.includes('tutorial') || titleLower.includes('learn') || 
              titleLower.includes('guide') || titleLower.includes('reference') ||
              urlLower.includes('coursera.com') || urlLower.includes('udemy.com') ||
              urlLower.includes('khanacademy.org') || urlLower.includes('edx.org') ||
              urlLower.includes('freecodecamp.org') || urlLower.includes('pluralsight.com')) {
            return 'Learning';
          }
          
          // Work & Professional
          else if (urlLower.includes('linkedin.com') || urlLower.includes('slack.com') || 
                   urlLower.includes('notion.so') || urlLower.includes('trello.com') ||
                   urlLower.includes('asana.com') || urlLower.includes('jira.') ||
                   urlLower.includes('confluence.') || urlLower.includes('teams.microsoft') ||
                   urlLower.includes('zoom.us') || urlLower.includes('meet.google') ||
                   urlLower.includes('calendly.com') || urlLower.includes('office.com') ||
                   titleLower.includes('meeting') || titleLower.includes('project') ||
                   titleLower.includes('work') || titleLower.includes('office') ||
                   titleLower.includes('business') || titleLower.includes('corporate')) {
            return 'Work';
          }
          
          // Entertainment & Media
          else if (urlLower.includes('youtube.com') || urlLower.includes('netflix.com') || 
                   urlLower.includes('spotify.com') || urlLower.includes('twitch.tv') ||
                   urlLower.includes('hulu.com') || urlLower.includes('disney') ||
                   urlLower.includes('hbo') || urlLower.includes('amazon.com/prime') ||
                   urlLower.includes('soundcloud.com') || urlLower.includes('vimeo.com') ||
                   urlLower.includes('gaming') || urlLower.includes('steam') ||
                   titleLower.includes('video') || titleLower.includes('movie') ||
                   titleLower.includes('music') || titleLower.includes('podcast') ||
                   titleLower.includes('game') || titleLower.includes('entertainment')) {
            return 'Entertainment';
          }
          
          // Shopping & E-commerce
          else if (urlLower.includes('amazon.com') || urlLower.includes('ebay.com') ||
                   urlLower.includes('etsy.com') || urlLower.includes('walmart.com') ||
                   urlLower.includes('target.com') || urlLower.includes('bestbuy.com') ||
                   urlLower.includes('shop') || urlLower.includes('store') ||
                   urlLower.includes('marketplace') || urlLower.includes('cart') ||
                   titleLower.includes('buy') || titleLower.includes('price') ||
                   titleLower.includes('sale') || titleLower.includes('discount') ||
                   titleLower.includes('shopping') || titleLower.includes('purchase')) {
            return 'Shopping';
          }
          
          // News & Information
          else if (urlLower.includes('news') || urlLower.includes('bbc.com') || 
                   urlLower.includes('cnn.com') || urlLower.includes('reuters.com') ||
                   urlLower.includes('nytimes.com') || urlLower.includes('washingtonpost.com') ||
                   urlLower.includes('guardian.com') || urlLower.includes('wsj.com') ||
                   urlLower.includes('techcrunch.com') || urlLower.includes('ycombinator.com') ||
                   urlLower.includes('medium.com') || urlLower.includes('blog') ||
                   titleLower.includes('breaking') || titleLower.includes('latest') ||
                   titleLower.includes('headlines') || titleLower.includes('article')) {
            return 'News';
          }
          
          // Social & Communication
          else if (urlLower.includes('facebook.com') || urlLower.includes('twitter.com') || 
                   urlLower.includes('instagram.com') || urlLower.includes('tiktok.com') ||
                   urlLower.includes('snapchat.com') || urlLower.includes('whatsapp.com') ||
                   urlLower.includes('telegram.org') || urlLower.includes('discord.com') ||
                   urlLower.includes('reddit.com') || urlLower.includes('pinterest.com') ||
                   titleLower.includes('social') || titleLower.includes('chat') ||
                   titleLower.includes('community') || titleLower.includes('forum')) {
            return 'Social';
          }
          
          return 'Personal';
        }

        function getFaviconUrl(url) {
          try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          } catch {
            return null;
          }
        }

        function getDomainFromUrl(url) {
          try {
            return new URL(url).hostname.replace('www.', '');
          } catch {
            return 'website';
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
          if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
          return `${Math.floor(diffDays / 365)} years ago`;
        }

        // Tooltip system
        function showTooltip(element, text, delay = 800) {
          let timeoutId;
          
          element.addEventListener('mouseenter', () => {
            timeoutId = setTimeout(() => {
              const tooltip = modal.querySelector('#tooltip');
              const rect = element.getBoundingClientRect();
              const modalRect = modal.getBoundingClientRect();
              
              tooltip.textContent = text;
              tooltip.style.left = (rect.left - modalRect.left + rect.width / 2) + 'px';
              tooltip.style.top = (rect.top - modalRect.top - 40) + 'px';
              tooltip.style.transform = 'translateX(-50%)';
              tooltip.style.opacity = '1';
            }, delay);
          });
          
          element.addEventListener('mouseleave', () => {
            clearTimeout(timeoutId);
            modal.querySelector('#tooltip').style.opacity = '0';
          });
        }

        // Notification system
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
          try {
            console.log('Loading bookmarks...');
            const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
            console.log('Bookmarks response:', response);
            
            allBookmarks = [];
            
            function processBookmarkNode(node, level = 0) {
              if (node.url) {
                const category = detectCategory(node.title, node.url);
                allBookmarks.push({
                  id: node.id,
                  title: node.title || 'Untitled',
                  url: node.url,
                  dateAdded: node.dateAdded,
                  category: category,
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
                  node.children.forEach(child => processBookmarkNode(child, 0));
                }
              });
            }

            console.log('Processed bookmarks:', allBookmarks.length);

            // Update category counts
            categories.forEach((value, key) => value.count = 0);
            allBookmarks.forEach(bookmark => {
              if (categories.has(bookmark.category)) {
                categories.get(bookmark.category).count++;
              }
            });

            // Hide loading state
            const loadingDiv = modal.querySelector('#bookmarks-loading');
            if (loadingDiv) {
              loadingDiv.style.display = 'none';
            }

            sortBookmarks();
            updateCategoryList();
            filterBookmarks();
            
          } catch (error) {
            console.error('Failed to load bookmarks:', error);
            const loadingDiv = modal.querySelector('#bookmarks-loading');
            if (loadingDiv) {
              loadingDiv.innerHTML = `
                <div style="color: #e53e3e; text-align: center;">
                  <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                  <div>Failed to load bookmarks</div>
                  <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">${error.message}</div>
                </div>
              `;
            }
            showNotification('Failed to load bookmarks', 'error');
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
        function filterBookmarks() {
          const searchTerm = modal.querySelector('#search-input').value.toLowerCase().trim();
          
          filteredBookmarks = allBookmarks.filter(bookmark => {
            const matchesCategory = currentCategory === 'all' || bookmark.category === currentCategory;
            const matchesSearch = !searchTerm || 
              bookmark.title.toLowerCase().includes(searchTerm) ||
              bookmark.url.toLowerCase().includes(searchTerm) ||
              bookmark.domain.toLowerCase().includes(searchTerm);
            
            return matchesCategory && matchesSearch;
          });
          
          updateContentHeader();
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

        // Update content header
        function updateContentHeader() {
          const title = modal.querySelector('#content-title');
          const subtitle = modal.querySelector('#content-subtitle');
          const count = filteredBookmarks.length;
          
          if (currentCategory === 'all') {
            title.textContent = 'All Bookmarks';
            subtitle.textContent = `${count} bookmark${count !== 1 ? 's' : ''} in your collection`;
          } else {
            const categoryInfo = categories.get(currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1));
            const icon = categoryInfo ? categoryInfo.icon : '📁';
            title.textContent = `${icon} ${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`;
            subtitle.textContent = `${count} bookmark${count !== 1 ? 's' : ''} in this category`;
          }
        }

        // Display bookmarks
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

        // Display grid view
        function displayGridView() {
          console.log('Displaying grid view');
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
            console.log(`Creating grid card ${index + 1}:`, bookmark.title);
            const card = document.createElement('div');
            card.className = 'bookmark-card';
            card.style.cssText = `
              background: #34312D;
              border: 1px solid #3E3A35;
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
              <div style="flex: 1; background: linear-gradient(135deg, #2A2826 0%, #34312D 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; position: relative;">
                ${faviconHtml}
                <div style="font-size: 12px; font-weight: 500; color: #C2C0B6; line-height: 1.3; margin-top: 8px; max-height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  ${escapeHtml(bookmark.title.length > 30 ? bookmark.title.substring(0, 30) + '...' : bookmark.title)}
                </div>
                <div style="font-size: 10px; color: #9B9690; opacity: 0.8; margin-top: 4px;">
                  ${bookmark.domain}
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions" style="position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;">
                  <button onclick="window.open('${escapeHtml(bookmark.url)}', '_blank')" style="width: 28px; height: 28px; border: none; background: rgba(102, 126, 234, 0.9); color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; backdrop-filter: blur(10px);">↗</button>
                  <button onclick="editBookmark('${bookmark.id}')" style="width: 28px; height: 28px; border: none; background: rgba(0, 0, 0, 0.7); color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; backdrop-filter: blur(10px);">⚙</button>
                </div>
              </div>
              
              <!-- Category Badge -->
              <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(102, 126, 234, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 500; backdrop-filter: blur(10px);">
                ${categories.get(bookmark.category)?.icon || '📁'} ${bookmark.category}
              </div>
            `;
            
            // Hover effects with preview
            card.addEventListener('mouseenter', () => {
              console.log('Card mouseenter triggered for:', bookmark.title);
              card.style.transform = 'translateY(-4px) scale(1.02)';
              card.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
              card.style.borderColor = '#667eea';
              showBookmarkPreview(bookmark, card);
            });
            
            card.addEventListener('mouseleave', () => {
              console.log('Card mouseleave triggered for:', bookmark.title);
              card.style.transform = 'translateY(0) scale(1)';
              card.style.boxShadow = 'none';
              card.style.borderColor = '#3E3A35';
              hideBookmarkPreview();
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

        // Display list view with improved layout
        function displayListView() {
          console.log('Displaying list view');
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
            gap: 8px;
            padding: 0 4px;
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
            console.log(`Creating list item ${index + 1}:`, bookmark.title);
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            item.style.cssText = `
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 12px 16px;
              background: #34312D;
              border: 1px solid #3E3A35;
              border-radius: 10px;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              cursor: pointer;
              position: relative;
              min-height: 64px;
            `;
            
            const faviconHtml = bookmark.favicon ? 
              `<img src="${bookmark.favicon}" style="width: 20px; height: 20px; border-radius: 3px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div style="display: none; color: #9B9690; font-size: 16px; width: 20px; height: 20px; align-items: center; justify-content: center;">🌐</div>` :
              `<div style="color: #9B9690; font-size: 16px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">🌐</div>`;

            item.innerHTML = `
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #2A2826 0%, #34312D 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #3E3A35;">
                ${faviconHtml}
              </div>
              
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                  <div style="font-size: 14px; font-weight: 500; color: #C2C0B6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                    ${escapeHtml(bookmark.title)}
                  </div>
                  <div style="background: ${getCategoryColor(bookmark.category)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; flex-shrink: 0;">
                    ${categories.get(bookmark.category)?.icon || '📁'}
                  </div>
                </div>
                
                <div style="font-size: 12px; color: #9B9690; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${bookmark.domain}
                </div>
                
                <div style="font-size: 10px; color: #7A7669; margin-top: 1px;">
                  Added ${formatDate(bookmark.dateAdded)}
                </div>
              </div>
              
              <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
                <button onclick="window.open('${escapeHtml(bookmark.url)}', '_blank')" style="padding: 6px 12px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; background: #667eea; color: white; font-weight: 500; transition: all 0.2s; min-width: 50px;">
                  Open
                </button>
                <button onclick="editBookmark('${bookmark.id}')" style="padding: 6px 10px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; background: #5A5651; color: #C2C0B6; transition: all 0.2s;">
                  Edit
                </button>
                <button onclick="deleteBookmark('${bookmark.id}')" style="padding: 6px 8px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; background: #8B4513; color: #C2C0B6; transition: all 0.2s;">
                  Del
                </button>
              </div>
            `;
            
            // Enhanced hover effects with preview
            item.addEventListener('mouseenter', () => {
              console.log('List item mouseenter triggered for:', bookmark.title);
              item.style.borderColor = '#667eea';
              item.style.background = '#3A372F';
              item.style.transform = 'translateX(4px)';
              item.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              showBookmarkPreview(bookmark, item);
            });
            
            item.addEventListener('mouseleave', () => {
              console.log('List item mouseleave triggered for:', bookmark.title);
              item.style.borderColor = '#3E3A35';
              item.style.background = '#34312D';
              item.style.transform = 'translateX(0)';
              item.style.boxShadow = 'none';
              hideBookmarkPreview();
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

        // Advanced bookmark discovery functions
        function showSearchSuggestions(searchTerm) {
          const searchContainer = modal.querySelector('#search-input').parentNode;
          let suggestionsContainer = modal.querySelector('#search-suggestions');
          
          if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'search-suggestions';
            suggestionsContainer.style.cssText = `
              position: absolute;
              top: calc(100% + 4px);
              left: 0;
              right: 0;
              background: #2A2826;
              border: 1px solid #3E3A35;
              border-radius: 8px;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
              z-index: 1000;
              max-height: 200px;
              overflow-y: auto;
              display: none;
            `;
            searchContainer.appendChild(suggestionsContainer);
          }
          
          // Generate smart suggestions
          const suggestions = generateSmartSuggestions(searchTerm);
          
          if (suggestions.length === 0) {
            hideSearchSuggestions();
            return;
          }
          
          suggestionsContainer.innerHTML = '';
          
          suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.style.cssText = `
              padding: 8px 12px;
              cursor: pointer;
              transition: background 0.2s;
              color: #C2C0B6;
              font-size: 13px;
              display: flex;
              align-items: center;
              gap: 8px;
            `;
            
            suggestionElement.innerHTML = `
              <span style="font-size: 14px;">${suggestion.icon}</span>
              <span>${escapeHtml(suggestion.text)}</span>
              <span style="margin-left: auto; font-size: 11px; color: #9B9690;">${suggestion.count} results</span>
            `;
            
            suggestionElement.addEventListener('mouseenter', () => {
              suggestionElement.style.background = '#3E3A35';
            });
            
            suggestionElement.addEventListener('mouseleave', () => {
              suggestionElement.style.background = 'transparent';
            });
            
            suggestionElement.addEventListener('click', () => {
              modal.querySelector('#search-input').value = suggestion.query;
              hideSearchSuggestions();
              filterBookmarks();
            });
            
            suggestionsContainer.appendChild(suggestionElement);
          });
          
          suggestionsContainer.style.display = 'block';
        }
        
        function hideSearchSuggestions() {
          const suggestionsContainer = modal.querySelector('#search-suggestions');
          if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
          }
        }
        
        function generateSmartSuggestions(searchTerm) {
          const suggestions = [];
          const termLower = searchTerm.toLowerCase();
          
          // Domain-based suggestions
          const domains = new Map();
          allBookmarks.forEach(bookmark => {
            const domain = bookmark.domain;
            if (domain.toLowerCase().includes(termLower)) {
              domains.set(domain, (domains.get(domain) || 0) + 1);
            }
          });
          
          domains.forEach((count, domain) => {
            if (count > 0) {
              suggestions.push({
                text: `${domain}`,
                query: domain,
                icon: '🌐',
                count: count,
                type: 'domain'
              });
            }
          });
          
          // Category-based suggestions
          categories.forEach((info, category) => {
            if (category.toLowerCase().includes(termLower)) {
              const matchingBookmarks = allBookmarks.filter(b => b.category === category);
              if (matchingBookmarks.length > 0) {
                suggestions.push({
                  text: `${info.icon} ${category} bookmarks`,
                  query: '',
                  icon: info.icon,
                  count: matchingBookmarks.length,
                  type: 'category',
                  category: category
                });
              }
            }
          });
          
          // Partial title matches
          const titleMatches = new Set();
          allBookmarks.forEach(bookmark => {
            const words = bookmark.title.toLowerCase().split(/\s+/);
            words.forEach(word => {
              if (word.startsWith(termLower) && word.length > termLower.length && !titleMatches.has(word)) {
                titleMatches.add(word);
                const matchingBookmarks = allBookmarks.filter(b => 
                  b.title.toLowerCase().includes(word)
                );
                suggestions.push({
                  text: `"${word}"`,
                  query: word,
                  icon: '📝',
                  count: matchingBookmarks.length,
                  type: 'title'
                });
              }
            });
          });
          
          // Sort by relevance and count
          suggestions.sort((a, b) => {
            // Prioritize exact domain matches
            if (a.type === 'domain' && b.type !== 'domain') return -1;
            if (a.type !== 'domain' && b.type === 'domain') return 1;
            // Then by count
            return b.count - a.count;
          });
          
          return suggestions.slice(0, 5); // Limit to 5 suggestions
        }
        
        // Bookmark Preview Functions
        let previewTimeout = null;
        let currentPreviewUrl = null;
        const previewCache = new Map(); // Cache for working previews

        function showBookmarkPreview(bookmark, element) {
          console.log('Showing preview for:', bookmark.title);
          
          // Clear any existing timeout
          if (previewTimeout) {
            clearTimeout(previewTimeout);
          }

          previewTimeout = setTimeout(() => {
            const preview = modal.querySelector('#bookmark-preview');
            
            if (!preview) {
              console.error('Preview element not found');
              return;
            }
            
            const rect = element.getBoundingClientRect();
            const modalRect = modal.getBoundingClientRect();
            
            console.log('Element rect:', rect);
            console.log('Modal rect:', modalRect);
            
            // Position preview to the right of the bookmark, or left if not enough space
            const spaceOnRight = window.innerWidth - rect.right;
            const previewWidth = 320;
            
            let left = rect.right - modalRect.left + 12; // 12px gap
            if (spaceOnRight < previewWidth + 50) {
              left = rect.left - modalRect.left - previewWidth - 12;
            }
            
            // Ensure preview doesn't go off screen vertically
            let top = rect.top - modalRect.top;
            const maxTop = modal.offsetHeight - 240 - 20;
            top = Math.min(top, maxTop);
            top = Math.max(top, 20);
            
            console.log('Setting preview position:', { left, top });
            
            preview.style.left = left + 'px';
            preview.style.top = top + 'px';
            preview.style.transform = 'scale(1)';
            
            // Update preview content
            updatePreviewContent(bookmark);
            
            // Show preview
            preview.style.opacity = '1';
            preview.style.pointerEvents = 'auto';
            
            console.log('Preview should now be visible');
          }, 150); // Faster hover response
        }

        function hideBookmarkPreview() {
          console.log('Hiding bookmark preview');
          
          if (previewTimeout) {
            clearTimeout(previewTimeout);
            previewTimeout = null;
          }
          
          const preview = modal.querySelector('#bookmark-preview');
          if (!preview) {
            console.error('Preview element not found for hiding');
            return;
          }
          
          preview.style.opacity = '0';
          preview.style.transform = 'scale(0.95)';
          preview.style.pointerEvents = 'none';
          
          // Reset iframe after animation
          setTimeout(() => {
            const iframe = preview.querySelector('#preview-iframe');
            if (iframe && iframe.src) {
              iframe.src = '';
              iframe.style.display = 'none';
            }
            const loadingEl = preview.querySelector('#preview-loading');
            const errorEl = preview.querySelector('#preview-error');
            if (loadingEl) loadingEl.style.display = 'flex';
            if (errorEl) errorEl.style.display = 'none';
            currentPreviewUrl = null;
          }, 300);
        }

        function updatePreviewContent(bookmark) {
          const preview = modal.querySelector('#bookmark-preview');
          const titleEl = preview.querySelector('#preview-title');
          const urlEl = preview.querySelector('#preview-url');
          const faviconEl = preview.querySelector('#preview-favicon');
          const categoryEl = preview.querySelector('#preview-category');
          const loadingEl = preview.querySelector('#preview-loading');
          const errorEl = preview.querySelector('#preview-error');
          const iframe = preview.querySelector('#preview-iframe');
          
          // Update header info
          titleEl.textContent = bookmark.title;
          urlEl.textContent = bookmark.domain;
          categoryEl.textContent = `${categories.get(bookmark.category)?.icon || '📁'} ${bookmark.category}`;
          categoryEl.style.background = getCategoryColor(bookmark.category);
          
          // Update favicon
          if (bookmark.favicon) {
            faviconEl.innerHTML = `<img src="${bookmark.favicon}" style="width: 16px; height: 16px; border-radius: 2px;" onerror="this.parentNode.innerHTML='🌐'">`;
          } else {
            faviconEl.innerHTML = '🌐';
          }
          
          // Check cache first
          const cacheKey = bookmark.url;
          if (previewCache.has(cacheKey)) {
            const cached = previewCache.get(cacheKey);
            if (cached.success) {
              // Show cached successful preview immediately
              loadingEl.style.display = 'none';
              errorEl.style.display = 'none';
              iframe.style.display = 'block';
              iframe.src = bookmark.url;
              return;
            } else {
              // Show cached error immediately
              loadingEl.style.display = 'none';
              errorEl.style.display = 'flex';
              iframe.style.display = 'none';
              return;
            }
          }

          // Reset states for new preview
          loadingEl.style.display = 'flex';
          errorEl.style.display = 'none';
          iframe.style.display = 'none';
          
          // Skip preview for certain domains that commonly block embedding
          const blockedDomains = [
            'facebook.com', 'twitter.com', 'instagram.com',
            'netflix.com', 'hulu.com', 'disney.com'
          ];
          
          const isBlocked = blockedDomains.some(domain => 
            bookmark.domain.includes(domain) || bookmark.url.toLowerCase().includes(domain)
          );
          
          if (isBlocked || bookmark.url.startsWith('https://chrome') || bookmark.url.startsWith('chrome-extension')) {
            // Cache this as a known blocker
            previewCache.set(cacheKey, { success: false, timestamp: Date.now() });
            setTimeout(() => {
              loadingEl.style.display = 'none';
              errorEl.style.display = 'flex';
            }, 400); // Faster error display
            return;
          }
          
          // Try to load preview
          currentPreviewUrl = bookmark.url;
          
          // Set up iframe load handlers
          iframe.onload = () => {
            if (currentPreviewUrl === bookmark.url) {
              // Cache successful load
              previewCache.set(cacheKey, { success: true, timestamp: Date.now() });
              setTimeout(() => {
                loadingEl.style.display = 'none';
                iframe.style.display = 'block';
              }, 200); // Faster transition
            }
          };
          
          iframe.onerror = () => {
            if (currentPreviewUrl === bookmark.url) {
              // Cache failed load
              previewCache.set(cacheKey, { success: false, timestamp: Date.now() });
              loadingEl.style.display = 'none';
              errorEl.style.display = 'flex';
            }
          };
          
          // Timeout fallback - reduced for faster loading
          setTimeout(() => {
            if (currentPreviewUrl === bookmark.url && loadingEl.style.display !== 'none') {
              // Cache timeout as failed
              previewCache.set(cacheKey, { success: false, timestamp: Date.now() });
              loadingEl.style.display = 'none';
              errorEl.style.display = 'flex';
            }
          }, 2000);
          
          // Load the URL
          try {
            iframe.src = bookmark.url;
          } catch (error) {
            // Cache error
            previewCache.set(cacheKey, { success: false, timestamp: Date.now() });
            loadingEl.style.display = 'none';
            errorEl.style.display = 'flex';
          }
        }

        // Quick access functions for frequently used bookmarks
        function getFrequentlyAccessedBookmarks() {
          // This would require tracking access patterns in storage
          // For now, return recent bookmarks as proxy for frequent
          return allBookmarks.slice(0, 5);
        }
        
        function getRecommendedBookmarks(currentUrl) {
          // Recommend bookmarks based on current page context
          const recommendations = [];
          const currentDomain = getDomainFromUrl(currentUrl);
          
          // Same domain bookmarks
          const sameDomainBookmarks = allBookmarks.filter(b => 
            b.domain === currentDomain && b.url !== currentUrl
          );
          recommendations.push(...sameDomainBookmarks.slice(0, 3));
          
          // Same category as current page
          const currentCategory = detectCategory(document.title, currentUrl);
          const sameCategoryBookmarks = allBookmarks.filter(b => 
            b.category === currentCategory && b.domain !== currentDomain
          );
          recommendations.push(...sameCategoryBookmarks.slice(0, 2));
          
          return recommendations.slice(0, 5);
        }
        
        // Bookmark CRUD operations
        window.editBookmark = function(id) {
          const bookmark = allBookmarks.find(b => b.id === id);
          if (!bookmark) return;
          
          const newCategory = prompt(`Edit category for "${bookmark.title}":`, bookmark.category || 'Personal');
          if (newCategory !== null && newCategory.trim() !== '') {
            const categoryName = newCategory.trim();
            
            // Add to categories if new
            if (!categories.has(categoryName)) {
              categories.set(categoryName, { icon: '📁', count: 0 });
            }
            
            bookmark.category = categoryName;
            showNotification('Category updated successfully!', 'success');
            loadBookmarks(); // Refresh to update counts
          }
        };

        window.deleteBookmark = async function(id) {
          const bookmark = allBookmarks.find(b => b.id === id);
          if (!bookmark) return;
          
          if (!confirm(`Delete "${bookmark.title}"?`)) return;
          
          try {
            const response = await chrome.runtime.sendMessage({
              type: 'REMOVE_BOOKMARK',
              id: id
            });
            
            if (response.success) {
              showNotification('Bookmark deleted successfully!', 'success');
              loadBookmarks();
            }
          } catch (error) {
            console.error('Failed to delete bookmark:', error);
            showNotification('Failed to delete bookmark', 'error');
          }
        };

        // Event listeners
        function setupEventListeners() {
          // Close button
          modal.querySelector('#safis-close').addEventListener('click', () => {
            modal.remove();
          });

          // Drag functionality
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

          // Enhanced search functionality with smart suggestions
          const searchInput = modal.querySelector('#search-input');
          let searchTimeout;
          
          searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
              const searchTerm = e.target.value.trim();
              if (searchTerm.length >= 2) {
                showSearchSuggestions(searchTerm);
              } else {
                hideSearchSuggestions();
              }
              filterBookmarks();
            }, 200);
          });
          
          searchInput.addEventListener('focus', (e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            if (e.target.value.trim().length >= 2) {
              showSearchSuggestions(e.target.value.trim());
            }
          });
          
          searchInput.addEventListener('blur', (e) => {
            e.target.style.borderColor = '#3E3A35';
            e.target.style.boxShadow = 'none';
            setTimeout(() => hideSearchSuggestions(), 200); // Delay to allow clicking suggestions
          });
          
          // Add keyboard navigation for search
          searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              hideSearchSuggestions();
              e.target.blur();
            }
          });

          // Add bookmark button
          modal.querySelector('#add-bookmark-btn').addEventListener('click', async () => {
            try {
              const category = detectCategory(document.title, window.location.href);
              const response = await chrome.runtime.sendMessage({
                type: 'ADD_BOOKMARK',
                title: document.title,
                url: window.location.href,
                category: category
              });
              
              if (response.success) {
                showNotification('Bookmark added successfully!', 'success');
                loadBookmarks();
              }
            } catch (error) {
              console.error('Failed to add bookmark:', error);
              showNotification('Failed to add bookmark', 'error');
            }
          });

          // View toggle buttons
          modal.querySelector('#grid-view').addEventListener('click', () => {
            currentView = 'grid';
            modal.querySelector('#grid-view').style.background = '#667eea';
            modal.querySelector('#grid-view').style.color = 'white';
            modal.querySelector('#list-view').style.background = 'transparent';
            modal.querySelector('#list-view').style.color = '#9B9690';
            displayBookmarks();
          });

          modal.querySelector('#list-view').addEventListener('click', () => {
            currentView = 'list';
            modal.querySelector('#list-view').style.background = '#667eea';
            modal.querySelector('#list-view').style.color = 'white';
            modal.querySelector('#grid-view').style.background = 'transparent';
            modal.querySelector('#grid-view').style.color = '#9B9690';
            displayBookmarks();
          });

          // Sort buttons
          modal.querySelector('#sort-date').addEventListener('click', () => {
            currentSort = 'date';
            modal.querySelector('#sort-date').style.background = '#34312D';
            modal.querySelector('#sort-date').style.color = '#C2C0B6';
            modal.querySelector('#sort-name').style.background = 'transparent';
            modal.querySelector('#sort-name').style.color = '#9B9690';
            sortBookmarks();
            filterBookmarks();
          });

          modal.querySelector('#sort-name').addEventListener('click', () => {
            currentSort = 'name';
            modal.querySelector('#sort-name').style.background = '#34312D';
            modal.querySelector('#sort-name').style.color = '#C2C0B6';
            modal.querySelector('#sort-date').style.background = 'transparent';
            modal.querySelector('#sort-date').style.color = '#9B9690';
            sortBookmarks();
            filterBookmarks();
          });

          // Category selection
          modal.querySelector('#category-all').addEventListener('click', () => selectCategory('all'));

          // Hover effects for buttons
          const buttons = modal.querySelectorAll('button');
          buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
              if (!button.classList.contains('active')) {
                button.style.transform = 'scale(1.02)';
              }
            });
            button.addEventListener('mouseleave', () => {
              button.style.transform = 'scale(1)';
            });
          });

          // Hide preview on scroll
          modal.querySelector('#bookmarks-container').addEventListener('scroll', () => {
            hideBookmarkPreview();
          });

          // Add tooltips
          showTooltip(modal.querySelector('#add-bookmark-btn'), 'Add current page to bookmarks');
          showTooltip(modal.querySelector('#grid-view'), 'Grid view');
          showTooltip(modal.querySelector('#list-view'), 'List view');
          showTooltip(modal.querySelector('#sort-date'), 'Sort by date added');
          showTooltip(modal.querySelector('#sort-name'), 'Sort alphabetically');
          showTooltip(modal.querySelector('#safis-close'), 'Close Safis');
        }

        // Initialize with detailed logging
        console.log('=== SAFIS EXTENSION INITIALIZATION ===');
        console.log('Modal created successfully');
        console.log('Modal dimensions:', modal.style.width, 'x', modal.style.height);
        
        // Append to body first
        document.body.appendChild(modal);
        console.log('Modal appended to body');
        
        // Check if elements exist
        const gridContainer = modal.querySelector('#bookmarks-grid');
        const listContainer = modal.querySelector('#bookmarks-list');
        const previewElement = modal.querySelector('#bookmark-preview');
        
        console.log('Grid container found:', !!gridContainer);
        console.log('List container found:', !!listContainer);
        console.log('Preview element found:', !!previewElement);
        
        // Setup event listeners
        console.log('Setting up event listeners...');
        setupEventListeners();
        console.log('Event listeners set up');
        
        // Load bookmarks with delay to ensure DOM is ready
        console.log('Starting bookmark loading...');
        setTimeout(() => {
          loadBookmarks();
          
          // Add test bookmark if no bookmarks found
          setTimeout(() => {
            if (allBookmarks.length === 0) {
              console.log('No bookmarks found, adding test bookmark');
              allBookmarks = [{
                id: 'test-1',
                title: 'Test Bookmark',
                url: 'https://example.com',
                dateAdded: Date.now(),
                category: 'Personal',
                domain: 'example.com',
                favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=64'
              }];
              filteredBookmarks = [...allBookmarks];
              updateCategoryList();
              displayBookmarks();
              console.log('Test bookmark added and displayed');
            }
          }, 500);
        }, 100);
        
        console.log('=== SAFIS INITIALIZATION COMPLETE ===');
      }
    });

  } catch (error) {
    console.error('Failed to inject modal:', error);
  }
});

// Enhanced message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_BOOKMARKS') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
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
      if (request.category) {
        chrome.storage.local.set({
          [`bookmark_${bookmark.id}_category`]: request.category
        });
      }
      sendResponse({ success: true, bookmark });
    });
    return true;
  }
  
  if (request.type === 'REMOVE_BOOKMARK') {
    chrome.bookmarks.remove(request.id, () => {
      chrome.storage.local.remove(`bookmark_${request.id}_category`);
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.type === 'UPDATE_BOOKMARK_CATEGORY') {
    chrome.storage.local.set({
      [`bookmark_${request.id}_category`]: request.category
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});