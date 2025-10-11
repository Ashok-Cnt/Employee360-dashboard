// Background service worker for productivity tracking
class ProductivityTracker {
  constructor() {
    this.isTracking = false;
    this.currentSession = null;
    this.lastActiveTime = Date.now();
    this.API_BASE = 'http://localhost:8000/api';
    
    this.init();
  }
  
  init() {
    // Listen for tab changes
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabChange(tabId);
      }
    });
    
    // Listen for idle state changes
    chrome.idle.onStateChanged.addListener((newState) => {
      this.handleIdleStateChange(newState);
    });
    
    // Set up periodic data sync
    chrome.alarms.create('syncData', { periodInMinutes: 5 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'syncData') {
        this.syncDataToAPI();
      }
    });
    
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.initializeStorage();
    });
  }
  
  async initializeStorage() {
    const defaultSettings = {
      trackingEnabled: true,
      syncInterval: 5, // minutes
      apiEndpoint: this.API_BASE,
      categories: {
        'github.com': 'development',
        'stackoverflow.com': 'development',
        'developer.mozilla.org': 'learning',
        'youtube.com': 'entertainment',
        'twitter.com': 'social',
        'linkedin.com': 'professional',
        'gmail.com': 'email',
        'outlook.com': 'email',
        'zoom.us': 'meeting',
        'teams.microsoft.com': 'meeting'
      }
    };
    
    await chrome.storage.local.set(defaultSettings);
  }
  
  async handleTabChange(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url || tab.url.startsWith('chrome://')) return;
      
      const settings = await chrome.storage.local.get(['trackingEnabled', 'categories']);
      if (!settings.trackingEnabled) return;
      
      // End current session if exists
      if (this.currentSession) {
        await this.endSession();
      }
      
      // Start new session
      await this.startSession(tab);
      
    } catch (error) {
      console.error('Error handling tab change:', error);
    }
  }
  
  async startSession(tab) {
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    const settings = await chrome.storage.local.get(['categories']);
    const category = this.categorizeActivity(domain, settings.categories);
    
    this.currentSession = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      url: tab.url,
      title: tab.title,
      domain: domain,
      category: category,
      timeSpent: 0
    };
    
    // Store session start in local storage
    const sessions = await this.getStoredSessions();
    sessions.push(this.currentSession);
    await chrome.storage.local.set({ sessions });
  }
  
  async endSession() {
    if (!this.currentSession) return;
    
    const endTime = new Date();
    const duration = (endTime - new Date(this.currentSession.startTime)) / 1000 / 60; // minutes
    
    this.currentSession.endTime = endTime.toISOString();
    this.currentSession.duration = Math.round(duration);
    
    // Update stored sessions
    const sessions = await this.getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === this.currentSession.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = this.currentSession;
      await chrome.storage.local.set({ sessions });
    }
    
    this.currentSession = null;
  }
  
  categorizeActivity(domain, categories) {
    // Check exact domain match
    if (categories[domain]) {
      return categories[domain];
    }
    
    // Check subdomain matches
    for (const [categoryDomain, category] of Object.entries(categories)) {
      if (domain.includes(categoryDomain)) {
        return category;
      }
    }
    
    // Default categorization based on common patterns
    if (domain.includes('github') || domain.includes('gitlab') || domain.includes('bitbucket')) {
      return 'development';
    }
    if (domain.includes('docs') || domain.includes('documentation')) {
      return 'learning';
    }
    if (domain.includes('mail') || domain.includes('email')) {
      return 'email';
    }
    if (domain.includes('meet') || domain.includes('zoom') || domain.includes('teams')) {
      return 'meeting';
    }
    
    return 'other';
  }
  
  async getStoredSessions() {
    const result = await chrome.storage.local.get(['sessions']);
    return result.sessions || [];
  }
  
  async syncDataToAPI() {
    try {
      const sessions = await this.getStoredSessions();
      const unsynced = sessions.filter(session => !session.synced && session.endTime);
      
      if (unsynced.length === 0) return;
      
      const settings = await chrome.storage.local.get(['apiEndpoint', 'userToken']);
      if (!settings.userToken) return;
      
      for (const session of unsynced) {
        try {
          const response = await fetch(`${settings.apiEndpoint}/work-patterns/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.userToken}`
            },
            body: JSON.stringify({
              start_time: session.startTime,
              end_time: session.endTime,
              duration_minutes: session.duration,
              task_type: this.mapCategoryToTaskType(session.category),
              website_url: session.url,
              application_name: session.domain,
              productivity_score: this.calculateProductivityScore(session)
            })
          });
          
          if (response.ok) {
            session.synced = true;
          }
        } catch (error) {
          console.error('Error syncing session:', error);
        }
      }
      
      // Update sessions with sync status
      await chrome.storage.local.set({ sessions });
      
    } catch (error) {
      console.error('Error during data sync:', error);
    }
  }
  
  mapCategoryToTaskType(category) {
    const mapping = {
      'development': 'deep_work',
      'learning': 'learning',
      'email': 'email',
      'meeting': 'meeting',
      'social': 'break',
      'entertainment': 'break',
      'professional': 'planning',
      'other': 'other'
    };
    
    return mapping[category] || 'other';
  }
  
  calculateProductivityScore(session) {
    // Simple productivity scoring based on category and duration
    const categoryScores = {
      'development': 0.9,
      'learning': 0.85,
      'planning': 0.75,
      'email': 0.6,
      'meeting': 0.7,
      'break': 0.4,
      'other': 0.5
    };
    
    const baseScore = categoryScores[session.category] || 0.5;
    
    // Adjust based on duration (longer sessions might be more or less productive)
    let durationMultiplier = 1.0;
    if (session.duration > 120) { // More than 2 hours
      durationMultiplier = 0.8; // Might indicate distraction
    } else if (session.duration > 30) { // 30 minutes to 2 hours
      durationMultiplier = 1.1; // Good focus duration
    } else if (session.duration < 5) { // Less than 5 minutes
      durationMultiplier = 0.6; // Too short to be productive
    }
    
    return Math.min(1.0, baseScore * durationMultiplier);
  }
  
  handleIdleStateChange(newState) {
    if (newState === 'idle' || newState === 'locked') {
      this.endSession();
    }
  }
}

// Initialize the tracker
const tracker = new ProductivityTracker();