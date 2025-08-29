# Safis Extension Testing Guide

## Installation & Setup

1. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the `/extension` folder
   - The Safis extension icon should appear in your toolbar

2. **Test Landing Page**:
   - Navigate to `/landing-page` folder
   - Run `npm install` (if not done already)
   - Run `npm run dev` to start the development server
   - Open the displayed URL to view the landing page

## Extension Features to Test

### 1. Basic Modal Functionality
- Click the Safis extension icon in Chrome toolbar
- **Expected**: 800x600px modal appears with sidebar navigation
- **Expected**: Modal is draggable by the header
- **Expected**: Close button (×) closes the modal
- **Expected**: Clicking outside modal closes it

### 2. Sidebar Navigation
- **Categories Section**: 
  - Verify "All Bookmarks" is selected by default
  - Check category counts are displayed correctly
  - Click different categories (Work, Personal, Learning, etc.)
  - **Expected**: Content area updates to show filtered bookmarks

### 3. Search Functionality
- Type in the search box (minimum 2 characters)
- **Expected**: Smart suggestions dropdown appears with:
  - Domain suggestions (🌐 icon)
  - Category suggestions (category emoji)
  - Title word suggestions (📝 icon)
- **Expected**: Search results update in real-time
- **Expected**: ESC key closes suggestions

### 4. View Modes
- Toggle between "Grid" and "List" view buttons
- **Expected**: Layout changes appropriately
- **Expected**: Active button is highlighted in blue

### 5. Sorting Options
- Test "Recent" vs "A-Z" sorting
- **Expected**: Bookmarks reorder correctly
- **Expected**: Active sort button is highlighted

### 6. Bookmark Management

#### Add Bookmark
- Click "+ Add Current Page" button
- **Expected**: Current page added to bookmarks
- **Expected**: Success notification appears
- **Expected**: Bookmark appears in appropriate auto-detected category

#### View Bookmark Details
- **Grid View**: Hover over bookmark cards
  - **Expected**: Card lifts with hover effect
  - **Expected**: Quick action buttons appear (↗ and ⚙)
  - **Expected**: Category badge visible in bottom left
- **List View**: 
  - **Expected**: Favicon, title, domain, and category visible
  - **Expected**: Action buttons (Open, Edit, Delete) on right
  - **Expected**: Improved compact layout with proper spacing

#### Bookmark Preview on Hover (NEW FEATURE)
- Hover over any bookmark (grid or list view) for 600ms
- **Expected**: Preview window appears to the right (or left if no space)
- **Expected**: Preview shows:
  - Header with favicon, title, domain, and category badge
  - Live webpage preview in iframe (if site allows embedding)
  - Loading spinner while loading
  - "Preview not available" message for blocked sites (Google, Facebook, etc.)
- **Expected**: Preview disappears when mouse leaves bookmark
- **Expected**: Preview hides when scrolling bookmark list
- **Expected**: Only one preview visible at a time

#### Edit Bookmark
- Click edit button (⚙ in grid, "Edit" in list)
- **Expected**: Prompt appears for category editing
- **Expected**: Category updates after confirmation

#### Delete Bookmark
- Click delete button
- **Expected**: Confirmation dialog appears
- **Expected**: Bookmark removed after confirmation
- **Expected**: Success notification shows

### 7. Auto-Categorization
Test by adding bookmarks from different types of sites:
- **GitHub/StackOverflow** → Should categorize as "Learning"
- **LinkedIn/Slack** → Should categorize as "Work"  
- **YouTube/Netflix** → Should categorize as "Entertainment"
- **Amazon/eBay** → Should categorize as "Shopping"
- **BBC/CNN** → Should categorize as "News"
- **Twitter/Facebook** → Should categorize as "Social"
- **Other sites** → Should categorize as "Personal"

### 8. UI Polish & Responsiveness
- **Animations**: Smooth transitions and hover effects
- **Icons**: Proper favicon loading with fallback
- **Typography**: Readable fonts and proper hierarchy
- **Colors**: Consistent warm theme (#1F1E1D, #C2C0B6, #667eea)
- **Loading States**: Spinner shows while loading bookmarks

### 9. Improved List View Layout (NEW)
- **Compact Design**: Better space utilization with 64px minimum height
- **Consistent Spacing**: 8px gaps between items, proper padding
- **Enhanced Information Hierarchy**: 
  - Title and category badge on first line
  - Domain on second line
  - "Added [date]" on third line in subtle color
- **Improved Actions**: Smaller, more consistent button sizing
- **Better Hover Effects**: Smooth slide-right animation with shadow

## Known Limitations & Expected Behavior

1. **System Pages**: Extension won't work on `chrome://` or `chrome-extension://` pages
2. **Favicon Loading**: Some favicons may not load; fallback icons (🌐) will show
3. **Category Detection**: New categories can be created through editing
4. **Search Suggestions**: Require minimum 2 characters to appear

## Troubleshooting

### Extension Not Appearing
- Check Chrome Extensions page for errors
- Ensure manifest.json is valid
- Try reloading the extension

### Modal Not Opening
- Check browser console for JavaScript errors
- Verify you're not on a restricted page (chrome://, etc.)
- Try refreshing the current tab

### Bookmarks Not Loading
- Check if bookmarks permission is granted
- Verify Chrome bookmarks API is accessible
- Check background script console for errors

### Search Not Working
- Verify bookmarks have loaded successfully
- Check console for JavaScript errors
- Try refreshing the extension

## Performance Testing

1. **Large Bookmark Collections**: Test with 100+ bookmarks
2. **Search Performance**: Type quickly and verify smooth updates
3. **Memory Usage**: Check Chrome Task Manager for memory leaks
4. **Responsiveness**: Verify UI remains smooth during interactions

## Success Criteria

✅ Extension loads without errors  
✅ Modal appears and functions correctly  
✅ All CRUD operations work  
✅ Auto-categorization assigns correct categories  
✅ Search with suggestions works smoothly  
✅ Both view modes display properly  
✅ Sorting functions correctly  
✅ UI is polished and responsive  
✅ No console errors during normal usage  
✅ Notifications appear for user actions  
✅ **NEW**: Bookmark preview on hover works smoothly  
✅ **NEW**: List view layout is clean and compact  
✅ **NEW**: Preview shows/hides at appropriate times  
✅ **NEW**: Preview handles blocked sites gracefully  

## Reporting Issues

If you encounter any issues:
1. Note the specific steps to reproduce
2. Check browser console for error messages
3. Include screenshots if UI issues
4. Test in incognito mode to rule out conflicts
5. Verify the issue persists after refreshing the extension