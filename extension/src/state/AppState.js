// Application state management following 12-factor methodology
// Factor VI: Processes - Execute the app as stateless processes

import { appLogger } from '../utils/logger.js';

/**
 * Centralized state management for the extension
 * Encapsulates all application state to avoid global variables
 */
export class AppState {
  constructor() {
    this.reset();
    appLogger.debug('AppState initialized');
  }

  /**
   * Reset state to initial values
   */
  reset() {
    // Extension state
    this.activeTabId = null;
    this.isOverlayVisible = false;
    
    // Bookmark data
    this.allBookmarks = [];
    this.filteredBookmarks = [];
    this.customFolders = [];
    
    // UI state
    this.currentCategory = 'all';
    this.currentView = 'grid';
    this.currentSort = 'date';
    this.currentMode = 'bookmarks';
    this.searchQuery = '';
    
    // Processing state
    this.isProcessing = false;
    this.isLoading = false;
    this.error = null;
    
    // Modal state
    this.modalElement = null;
    this.overlayElement = null;
    
    appLogger.debug('AppState reset to initial values');
  }

  /**
   * Update multiple state properties at once
   */
  updateState(updates) {
    const oldState = { ...this.getState() };
    
    Object.keys(updates).forEach(key => {
      if (this.hasOwnProperty(key)) {
        this[key] = updates[key];
      } else {
        appLogger.warn(`Attempted to update unknown state property: ${key}`);
      }
    });
    
    appLogger.debug('State updated', { 
      changed: Object.keys(updates),
      oldValues: Object.keys(updates).reduce((acc, key) => {
        acc[key] = oldState[key];
        return acc;
      }, {}),
      newValues: updates
    });
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      activeTabId: this.activeTabId,
      isOverlayVisible: this.isOverlayVisible,
      allBookmarks: this.allBookmarks,
      filteredBookmarks: this.filteredBookmarks,
      customFolders: this.customFolders,
      currentCategory: this.currentCategory,
      currentView: this.currentView,
      currentSort: this.currentSort,
      currentMode: this.currentMode,
      searchQuery: this.searchQuery,
      isProcessing: this.isProcessing,
      isLoading: this.isLoading,
      error: this.error,
      modalElement: this.modalElement,
      overlayElement: this.overlayElement
    };
  }

  /**
   * Set processing state
   */
  setProcessing(isProcessing, operation = null) {
    this.isProcessing = isProcessing;
    
    if (isProcessing && operation) {
      appLogger.info(`Started processing: ${operation}`);
    } else if (!isProcessing && operation) {
      appLogger.info(`Completed processing: ${operation}`);
    }
  }

  /**
   * Set loading state
   */
  setLoading(isLoading, operation = null) {
    this.isLoading = isLoading;
    
    if (isLoading && operation) {
      appLogger.info(`Started loading: ${operation}`);
    } else if (!isLoading && operation) {
      appLogger.info(`Completed loading: ${operation}`);
    }
  }

  /**
   * Set error state
   */
  setError(error, context = null) {
    this.error = error;
    
    if (error) {
      const message = context ? `Error in ${context}` : 'Application error';
      appLogger.error(message, error instanceof Error ? error : new Error(error));
    } else {
      appLogger.debug('Error state cleared');
    }
  }

  /**
   * Clear error state
   */
  clearError() {
    this.setError(null);
  }

  /**
   * Update bookmarks data
   */
  setBookmarks(bookmarks) {
    this.allBookmarks = bookmarks || [];
    this.filteredBookmarks = [...this.allBookmarks];
    
    appLogger.info(`Bookmarks updated: ${this.allBookmarks.length} total`);
  }

  /**
   * Update filtered bookmarks based on current filters
   */
  updateFilteredBookmarks(filtered) {
    this.filteredBookmarks = filtered || [];
    
    appLogger.debug(`Filtered bookmarks updated: ${this.filteredBookmarks.length} results`);
  }

  /**
   * Update custom folders
   */
  setCustomFolders(folders) {
    this.customFolders = folders || [];
    
    appLogger.info(`Custom folders updated: ${this.customFolders.length} folders`);
  }

  /**
   * Set active tab
   */
  setActiveTab(tabId) {
    this.activeTabId = tabId;
    appLogger.debug(`Active tab set: ${tabId}`);
  }

  /**
   * Toggle overlay visibility
   */
  toggleOverlay() {
    this.isOverlayVisible = !this.isOverlayVisible;
    appLogger.debug(`Overlay visibility toggled: ${this.isOverlayVisible}`);
    return this.isOverlayVisible;
  }

  /**
   * Set modal DOM elements
   */
  setModalElements(overlay, modal) {
    this.overlayElement = overlay;
    this.modalElement = modal;
    appLogger.debug('Modal DOM elements set');
  }

  /**
   * Clear modal DOM elements
   */
  clearModalElements() {
    this.overlayElement = null;
    this.modalElement = null;
    appLogger.debug('Modal DOM elements cleared');
  }

  /**
   * Update search query and trigger filtering
   */
  setSearchQuery(query) {
    this.searchQuery = query || '';
    appLogger.debug(`Search query updated: "${this.searchQuery}"`);
  }

  /**
   * Update current view mode
   */
  setCurrentView(view) {
    if (['grid', 'list'].includes(view)) {
      this.currentView = view;
      appLogger.debug(`View mode changed to: ${view}`);
    } else {
      appLogger.warn(`Invalid view mode attempted: ${view}`);
    }
  }

  /**
   * Update current sort method
   */
  setCurrentSort(sort) {
    if (['date', 'title', 'domain'].includes(sort)) {
      this.currentSort = sort;
      appLogger.debug(`Sort method changed to: ${sort}`);
    } else {
      appLogger.warn(`Invalid sort method attempted: ${sort}`);
    }
  }

  /**
   * Update current category
   */
  setCurrentCategory(category) {
    this.currentCategory = category;
    appLogger.debug(`Category changed to: ${category}`);
  }

  /**
   * Update current mode
   */
  setCurrentMode(mode) {
    if (['bookmarks', 'folders'].includes(mode)) {
      this.currentMode = mode;
      appLogger.debug(`Mode changed to: ${mode}`);
    } else {
      appLogger.warn(`Invalid mode attempted: ${mode}`);
    }
  }
}

// Export singleton instance
export const appState = new AppState();