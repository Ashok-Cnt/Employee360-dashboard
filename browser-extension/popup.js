// Popup script for browser extension
document.addEventListener('DOMContentLoaded', async function() {
  await loadPopupData();
  setupEventListeners();
});

async function loadPopupData() {
  try {
    // Get current tracking status
    const settings = await chrome.storage.local.get(['trackingEnabled']);
    updateTrackingStatus(settings.trackingEnabled !== false);
    
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    updateCurrentActivity(tab);
    
    // Load today's statistics
    await loadTodayStats();
    
  } catch (error) {
    console.error('Error loading popup data:', error);
  }
}

function updateTrackingStatus(isTracking) {
  const statusElement = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const toggleButton = document.getElementById('toggle-tracking');
  
  if (isTracking) {
    statusElement.className = 'status tracking';
    statusText.textContent = 'Tracking Active';
    toggleButton.textContent = 'Pause';
  } else {
    statusElement.className = 'status paused';
    statusText.textContent = 'Tracking Paused';
    toggleButton.textContent = 'Resume';
  }
}

function updateCurrentActivity(tab) {
  const titleElement = document.getElementById('activity-title');
  const urlElement = document.getElementById('activity-url');
  
  if (tab && tab.url && !tab.url.startsWith('chrome://')) {
    titleElement.textContent = tab.title || 'Untitled';
    urlElement.textContent = new URL(tab.url).hostname;
  } else {
    titleElement.textContent = 'No trackable activity';
    urlElement.textContent = '';
  }
}

async function loadTodayStats() {
  try {
    const sessions = await chrome.storage.local.get(['sessions']);
    const todaySessions = getTodaySessions(sessions.sessions || []);
    
    // Calculate focus time
    const focusTime = calculateFocusTime(todaySessions);
    document.getElementById('focus-time').textContent = formatTime(focusTime);
    
    // Count sessions
    document.getElementById('session-count').textContent = todaySessions.length;
    
    // Calculate productivity score
    const productivityScore = calculateProductivityScore(todaySessions);
    document.getElementById('productivity-score').textContent = 
      productivityScore ? `${Math.round(productivityScore * 100)}%` : '--';
    
  } catch (error) {
    console.error('Error loading today stats:', error);
  }
}

function getTodaySessions(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= today;
  });
}

function calculateFocusTime(sessions) {
  const focusCategories = ['development', 'learning', 'planning'];
  
  return sessions
    .filter(session => focusCategories.includes(session.category))
    .reduce((total, session) => total + (session.duration || 0), 0);
}

function calculateProductivityScore(sessions) {
  if (sessions.length === 0) return 0;
  
  const totalScore = sessions.reduce((sum, session) => {
    return sum + (session.productivityScore || 0.5);
  }, 0);
  
  return totalScore / sessions.length;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

function setupEventListeners() {
  // Toggle tracking
  document.getElementById('toggle-tracking').addEventListener('click', async function() {
    const settings = await chrome.storage.local.get(['trackingEnabled']);
    const newState = !(settings.trackingEnabled !== false);
    
    await chrome.storage.local.set({ trackingEnabled: newState });
    updateTrackingStatus(newState);
  });
  
  // View dashboard
  document.getElementById('view-dashboard').addEventListener('click', function() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
    window.close();
  });
  
  // Sync data
  document.getElementById('sync-data').addEventListener('click', async function() {
    const button = this;
    const originalText = button.textContent;
    
    button.textContent = 'Syncing...';
    button.disabled = true;
    
    try {
      // Trigger background sync
      await chrome.runtime.sendMessage({ type: 'FORCE_SYNC' });
      
      setTimeout(() => {
        button.textContent = 'Synced ✓';
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1000);
      }, 500);
      
    } catch (error) {
      console.error('Sync error:', error);
      button.textContent = 'Sync Failed';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  });
  
  // Start focus session
  document.getElementById('start-focus-session').addEventListener('click', function() {
    chrome.storage.local.set({ 
      focusSessionActive: true,
      focusSessionStart: Date.now()
    });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Session Started',
      message: 'Deep work mode activated. Minimize distractions!'
    });
    
    window.close();
  });
  
  // Take break
  document.getElementById('take-break').addEventListener('click', function() {
    chrome.storage.local.set({ 
      breakTime: true,
      breakStart: Date.now()
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Break Time',
      message: 'Take a well-deserved break!'
    });
    
    window.close();
  });
  
  // Open settings
  document.getElementById('open-settings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
    window.close();
  });
}

// Listen for storage changes to update UI in real-time
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local') {
    if (changes.trackingEnabled) {
      updateTrackingStatus(changes.trackingEnabled.newValue);
    }
    
    if (changes.sessions) {
      loadTodayStats();
    }
  }
});