# Safis - Smart Bookmark Manager

A modern bookmark management system with a sleek landing page and browser extension featuring a floating, draggable modal overlay.

## Project Structure

```
Bookmark_Manager/
├── landing-page/          # React landing page
│   ├── src/
│   │   ├── App.jsx       # Main app component
│   │   ├── main.jsx      # React entry point
│   │   └── index.css     # Styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── extension/             # Browser extension
│   ├── src/
│   │   ├── background.js  # Service worker
│   │   ├── content.js     # Content script
│   │   └── content.css    # Modal styles
│   ├── assets/
│   │   └── glasses_emoji.png  # Extension icon
│   └── manifest.json      # Extension manifest
│
└── README.md
```

## Landing Page

### Features
- Modern, responsive design based on the provided mockup
- Hero section with clear value proposition
- Interactive demo section (placeholder)
- Feature highlights with visual elements
- Installation guide with step-by-step instructions
- Professional dark theme matching the design

### Running the Landing Page

1. Navigate to the landing page directory:
   ```bash
   cd landing-page
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Browser Extension

### Features
- **Floating Modal**: Click the extension icon to open a draggable modal overlay
- **Bookmark Management**: View, add, edit, and delete bookmarks
- **Search & Filter**: Find bookmarks quickly with real-time search
- **Drag & Drop**: Reposition the modal anywhere on the page
- **Current Page Addition**: One-click bookmark addition for the current page
- **Click-outside-to-close**: Intuitive modal dismissal

### Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The Safis extension should now appear in your toolbar

### Usage

1. **Open Modal**: Click the Safis icon in the browser toolbar
2. **Add Bookmark**: Click "Add Current Page" or use the bookmark management interface
3. **Search**: Use the search bar to filter bookmarks
4. **Organize**: Edit or delete bookmarks using the action buttons
5. **Drag**: Click and drag the modal header to reposition
6. **Close**: Click outside the modal or use the close button

### Extension Permissions

- `bookmarks`: Access and modify browser bookmarks
- `storage`: Store extension settings and data
- `activeTab`: Access current tab information
- `scripting`: Inject content scripts
- `<all_urls>`: Display modal on any webpage

## Key Features

### Landing Page
- **Professional Design**: Dark theme with gradient accents
- **Responsive Layout**: Works on desktop and mobile devices
- **Clear Call-to-Actions**: Download and installation prompts
- **Feature Showcase**: Highlighting the floating modal concept

### Browser Extension
- **Non-intrusive**: Floating modal doesn't disrupt browsing
- **Draggable Interface**: Position the modal where it's convenient
- **Full Bookmark Access**: Complete bookmark CRUD operations
- **Smart Search**: Filter bookmarks by title or URL
- **Modern UI**: Consistent with contemporary web design

## Development Notes

### Landing Page Technology Stack
- **React 18**: Modern React with hooks
- **Vite**: Fast development and build tooling
- **CSS3**: Custom styling with CSS Grid and Flexbox

### Extension Technology Stack
- **Manifest V3**: Latest Chrome extension format
- **Vanilla JavaScript**: No external dependencies
- **Content Scripts**: Injected into web pages
- **Service Worker**: Background script for bookmark operations

## Browser Compatibility

- **Chrome**: Full support (primary target)
- **Edge**: Compatible with Chromium-based Edge
- **Firefox**: Would require manifest modifications for full compatibility

## Future Enhancements

- Bookmark synchronization across devices
- Custom bookmark categories and tags
- Bookmark import/export functionality
- Keyboard shortcuts
- Theme customization options
- Analytics for bookmark usage patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.