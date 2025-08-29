# Extension Debug Instructions

## Quick Debug Steps

1. **Load the Extension**:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the `/extension` folder
   - Look for any red error messages

2. **Check Extension Icon**:
   - Extension icon should appear in Chrome toolbar
   - If not visible, click the puzzle piece icon and pin Safis

3. **Test Basic Functionality**:
   - Click the Safis extension icon
   - **Expected**: Modal should appear (800x600px)
   - Check browser console (F12) for error messages

4. **Debug Console Output**:
   Open Chrome DevTools Console (F12 → Console) and look for these messages:
   - "Loading bookmarks..."
   - "Bookmarks response:" (with data)
   - "Processed bookmarks: [number]"
   - "Displaying bookmarks, filtered count: [number]"

5. **Test Adding a Bookmark**:
   - Visit any website (e.g., google.com)
   - Click Safis extension icon
   - Click "+ Add Current Page" button
   - **Expected**: Success notification should appear
   - **Expected**: Bookmark should appear in the list

6. **Check for Common Issues**:

### Issue 1: No Bookmarks Showing
**Symptoms**: Empty bookmark area or only loading spinner
**Debug Steps**:
- Check console for "Processed bookmarks: 0" - means no bookmarks in Chrome
- Try adding a bookmark manually in Chrome first
- Check for JavaScript errors in console

### Issue 2: Preview Not Showing  
**Symptoms**: Hover over bookmarks but no preview appears
**Debug Steps**:
- Check console for "Showing preview for: [title]" messages
- Check console for "Preview element not found" errors
- Hover for at least 300ms (reduced from 600ms for testing)
- Try both grid and list view

### Issue 3: Modal Not Appearing
**Symptoms**: Clicking extension icon does nothing
**Debug Steps**:
- Check if page is a chrome:// page (extensions don't work there)
- Check console for injection errors
- Try refreshing the page and clicking again

## Console Debug Commands

Open browser console and run these to debug:

```javascript
// Check if modal exists
document.querySelector('#safis-modal')

// Check if bookmark containers exist  
document.querySelector('#bookmarks-grid')
document.querySelector('#bookmarks-list')

// Check if preview element exists
document.querySelector('#bookmark-preview')

// Check global variables (if modal is open)
window.allBookmarks
window.filteredBookmarks
```

## Expected Console Output (Normal Operation)

```
Loading bookmarks...
Bookmarks response: {bookmarks: Array(2)}
Processed bookmarks: [number]
Displaying bookmarks, filtered count: [number]
Displaying grid view
Creating grid card 1: [bookmark title]
Creating grid card 2: [bookmark title]
```

When hovering over bookmarks:
```
Showing preview for: [bookmark title]
Element rect: DOMRect {...}
Modal rect: DOMRect {...}
Setting preview position: {left: 123, top: 45}
Preview should now be visible
```

## Troubleshooting Steps

1. **If no bookmarks show**: Add some bookmarks in Chrome first
2. **If preview doesn't work**: Check for JavaScript errors
3. **If modal doesn't appear**: Check if you're on a restricted page
4. **If extension icon missing**: Check extensions page for errors

## Quick Test Bookmarks

To test, create these bookmarks manually in Chrome:
- https://google.com (should categorize as "Personal")
- https://github.com (should categorize as "Learning") 
- https://youtube.com (should categorize as "Entertainment")
- https://linkedin.com (should categorize as "Work")