// Sample Job Manager - Handles sample job applications and bookmarks
// This works alongside the backend data to provide a seamless experience

interface SampleJobApplication {
  id: string;
  userId: string; // Add user ID to tie applications to specific accounts
  jobId: string;
  appliedAt: string;
  status: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  type: string;
}

interface SampleJobBookmark {
  id: string;
  userId: string; // Add user ID to tie bookmarks to specific accounts
  jobId: string;
  createdAt: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  type: string;
  folder?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

class SampleJobManager {
  private static instance: SampleJobManager;
  private applications: SampleJobApplication[] = [];
  private bookmarks: SampleJobBookmark[] = [];
  private listeners: Array<() => void> = [];
  private currentUserId: string | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): SampleJobManager {
    if (!SampleJobManager.instance) {
      SampleJobManager.instance = new SampleJobManager();
    }
    return SampleJobManager.instance;
  }

  // Set current user ID - call this when user logs in
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    // Clear data if user logs out
    if (!userId) {
      this.applications = [];
      this.bookmarks = [];
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Add listener for updates
  addListener(callback: () => void) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: () => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  private loadFromStorage() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const storedApplications = localStorage.getItem('sampleJobApplications');
      const storedBookmarks = localStorage.getItem('sampleJobBookmarks');
      
      if (storedApplications) {
        this.applications = JSON.parse(storedApplications);
      }
      if (storedBookmarks) {
        this.bookmarks = JSON.parse(storedBookmarks);
      }
    } catch (error) {
      console.error('Error loading sample job data from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      localStorage.setItem('sampleJobApplications', JSON.stringify(this.applications));
      localStorage.setItem('sampleJobBookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Error saving sample job data to storage:', error);
    }
  }

  // Initialize with user data from localStorage (call this on app startup)
  initializeFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user && user.id) {
            this.currentUserId = user.id;
            // Filter applications and bookmarks to only show current user's data
            this.applications = this.applications.filter(app => app.userId === user.id);
            this.bookmarks = this.bookmarks.filter(book => book.userId === user.id);
            this.saveToStorage();
            this.notifyListeners();
          }
        }
      }
    } catch (error) {
      console.error('Error initializing sample job manager from storage:', error);
    }
  }

  // Application methods
  addApplication(jobData: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    location: string;
    salary: string;
    type: string;
  }): SampleJobApplication | null {
    // Only allow applications if user is logged in
    if (!this.currentUserId) {
      console.warn('Cannot add application: No user logged in');
      return null;
    }

    const application: SampleJobApplication = {
      id: `sample-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUserId,
      ...jobData,
      appliedAt: new Date().toISOString(),
      status: 'applied'
    };

    // Check if already applied by this user
    const existingIndex = this.applications.findIndex(
      app => app.jobId === jobData.jobId && app.userId === this.currentUserId
    );
    if (existingIndex >= 0) {
      this.applications[existingIndex] = application;
    } else {
      this.applications.push(application);
    }

    this.saveToStorage();
    this.notifyListeners(); // Notify listeners of the change
    return application;
  }

  getApplications(): SampleJobApplication[] {
    // Only return applications for current user
    if (!this.currentUserId) {
      return [];
    }
    return this.applications.filter(app => app.userId === this.currentUserId);
  }

  hasApplied(jobId: string): boolean {
    // Only check if current user has applied
    if (!this.currentUserId) {
      return false;
    }
    return this.applications.some(
      app => app.jobId === jobId && app.userId === this.currentUserId
    );
  }

  removeApplication(jobId: string): boolean {
    if (!this.currentUserId) {
      return false;
    }
    
    const initialLength = this.applications.length;
    this.applications = this.applications.filter(
      app => !(app.jobId === jobId && app.userId === this.currentUserId)
    );
    const removed = this.applications.length < initialLength;
    if (removed) {
      this.saveToStorage();
      this.notifyListeners(); // Notify listeners of the change
    }
    return removed;
  }

  // Bookmark methods
  addBookmark(jobData: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    location: string;
    salary: string;
    type: string;
  }): SampleJobBookmark | null {
    // Only allow bookmarks if user is logged in
    if (!this.currentUserId) {
      console.warn('Cannot add bookmark: No user logged in');
      return null;
    }

    const bookmark: SampleJobBookmark = {
      id: `sample-book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUserId,
      ...jobData,
      createdAt: new Date().toISOString(),
      folder: 'General',
      notes: '',
      priority: 'medium'
    };

    // Check if already bookmarked by this user
    const existingIndex = this.bookmarks.findIndex(
      book => book.jobId === jobData.jobId && book.userId === this.currentUserId
    );
    if (existingIndex >= 0) {
      this.bookmarks[existingIndex] = bookmark;
    } else {
      this.bookmarks.push(bookmark);
    }

    this.saveToStorage();
    this.notifyListeners();
    return bookmark;
  }

  removeBookmark(jobId: string): boolean {
    if (!this.currentUserId) {
      return false;
    }
    
    const initialLength = this.bookmarks.length;
    this.bookmarks = this.bookmarks.filter(
      book => !(book.jobId === jobId && book.userId === this.currentUserId)
    );
    const removed = this.bookmarks.length < initialLength;
    if (removed) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return removed;
  }

  getBookmarks(): SampleJobBookmark[] {
    // Only return bookmarks for current user
    if (!this.currentUserId) {
      return [];
    }
    return this.bookmarks.filter(book => book.userId === this.currentUserId);
  }

  isBookmarked(jobId: string): boolean {
    // Only check if current user has bookmarked
    if (!this.currentUserId) {
      return false;
    }
    return this.bookmarks.some(
      book => book.jobId === jobId && book.userId === this.currentUserId
    );
  }

  updateBookmark(bookmarkId: string, updates: Partial<SampleJobBookmark>): boolean {
    if (!this.currentUserId) {
      return false;
    }
    
    const index = this.bookmarks.findIndex(
      book => book.id === bookmarkId && book.userId === this.currentUserId
    );
    if (index >= 0) {
      this.bookmarks[index] = { ...this.bookmarks[index], ...updates };
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteBookmark(bookmarkId: string): boolean {
    if (!this.currentUserId) {
      return false;
    }
    
    const initialLength = this.bookmarks.length;
    this.bookmarks = this.bookmarks.filter(
      book => !(book.id === bookmarkId && book.userId === this.currentUserId)
    );
    const deleted = this.bookmarks.length < initialLength;
    if (deleted) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return deleted;
  }

  // Clear all data for current user (useful for logout)
  clearUserData() {
    if (this.currentUserId) {
      this.applications = this.applications.filter(app => app.userId !== this.currentUserId);
      this.bookmarks = this.bookmarks.filter(book => book.userId !== this.currentUserId);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // Get all applications (for admin purposes)
  getAllApplications(): SampleJobApplication[] {
    return [...this.applications];
  }

  // Get all bookmarks (for admin purposes)
  getAllBookmarks(): SampleJobBookmark[] {
    return [...this.bookmarks];
  }
}

// Export singleton instance - lazy initialization to avoid SSR issues
export const sampleJobManager = (() => {
  if (typeof window === 'undefined') {
    // Return a mock object during SSR
    return {
      getApplications: () => [],
      getBookmarks: () => [],
      addApplication: () => false,
      addBookmark: () => false,
      removeApplication: () => false,
      removeBookmark: () => false,
      hasApplied: () => false,
      hasBookmarked: () => false,
      updateBookmark: () => false,
      deleteBookmark: () => false,
      addListener: () => {},
      removeListener: () => {},
      setCurrentUser: () => {},
      initializeFromStorage: () => {}
    };
  }
  return SampleJobManager.getInstance();
})();
export type { SampleJobApplication, SampleJobBookmark };
