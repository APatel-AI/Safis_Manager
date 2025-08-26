// Simple background script that injects a basic modal
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Extension clicked, tab:', tab.url);
    
    // Check if we can access the tab
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      console.log('Cannot inject into system pages');
      return;
    }

    // Inject the modal creation script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Remove any existing modal
        const existing = document.querySelector('#safis-modal');
        if (existing) {
          existing.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'safis-modal';
        modal.style.cssText = `
          position: fixed !important;
          top: 50px !important;
          right: 50px !important;
          width: 400px !important;
          height: 500px !important;
          background: #1a1a1a !important;
          border: 1px solid #333 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
          color: #ffffff !important;
          display: block !important;
        `;

        modal.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #222; border-bottom: 1px solid #333; border-radius: 12px 12px 0 0; cursor: grab;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="font-size: 18px;">🤓</div>
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">Safis</h2>
              </div>
              <button id="safis-close" style="width: 28px; height: 28px; border: none; background: #333; color: #ffffff; border-radius: 6px; cursor: pointer; font-size: 14px;">×</button>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; padding: 16px;">
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                <input type="text" placeholder="Search bookmarks..." style="flex: 1; padding: 8px 12px; background: #222; border: 1px solid #333; border-radius: 6px; color: #ffffff; font-size: 14px;">
                <button style="padding: 8px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 6px; color: #ffffff; cursor: pointer; font-size: 14px; font-weight: 500;">+ Add Current Page</button>
              </div>
              <div style="flex: 1; overflow: hidden;">
                <div style="height: 100%; overflow-y: auto;">
                  <div style="text-align: center; color: #888; padding: 20px; font-size: 14px;">
                    🎉 Safis Modal Working!<br><br>
                    This floating modal can be dragged around and contains your bookmark management interface.
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        // Add close functionality
        modal.querySelector('#safis-close').addEventListener('click', () => {
          modal.remove();
        });

        // Add drag functionality
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const header = modal.querySelector('div[style*="cursor: grab"]');
        
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

        // Append to body
        document.body.appendChild(modal);
        
        console.log('Safis modal created successfully');
      }
    });

  } catch (error) {
    console.error('Failed to inject modal:', error);
  }
});

// Keep the bookmark management functions for later use
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
      sendResponse({ success: true, bookmark });
    });
    return true;
  }
});