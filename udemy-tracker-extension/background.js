// Udemy Progress Tracker - Background Service Worker

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    // Update extension badge
    chrome.action.setBadgeText({ 
      text: request.text,
      tabId: sender.tab?.id 
    });
    
    chrome.action.setBadgeBackgroundColor({ 
      color: request.color || '#4CAF50',
      tabId: sender.tab?.id
    });
  }
});

// Clear badge when tab is closed or navigated away from Udemy
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && !tab.url?.includes('udemy.com/course/')) {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Udemy Progress Tracker installed');
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://www.udemy.com'
    });
  }
});

console.log('Udemy Progress Tracker background service initialized');
