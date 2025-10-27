// Udemy Progress Tracker - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const lastCapture = document.getElementById('lastCapture');
  const captureBtn = document.getElementById('captureBtn');
  const messageDiv = document.getElementById('message');
  const courseCard = document.getElementById('courseCard');
  const courseName = document.getElementById('courseName');
  const sectionsCount = document.getElementById('sectionsCount');
  const lessonsCount = document.getElementById('lessonsCount');
  const completedCount = document.getElementById('completedCount');
  const progressPercent = document.getElementById('progressPercent');
  const closeBtn = document.getElementById('closeBtn');

  // Close button handler
  closeBtn.addEventListener('click', () => {
    window.close();
  });

  // Show message
  function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }

  // Format timestamp
  function formatTime(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  // Check if on Udemy course page
  async function checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url?.includes('udemy.com/course/')) {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Not on Udemy course page';
      captureBtn.disabled = true;
      courseCard.style.display = 'none';
      return false;
    }
    
    return tab;
  }

  // Update course display
  function updateCourseDisplay(data) {
    if (data && data.courseName) {
      courseCard.style.display = 'block';
      courseName.textContent = data.courseName || 'Unknown Course';
      
      if (data.stats) {
        sectionsCount.textContent = data.stats.totalSections || 0;
        lessonsCount.textContent = data.stats.totalLessons || 0;
        completedCount.textContent = data.stats.completedLessons || 0;
        progressPercent.textContent = data.stats.progress ? `${data.stats.progress}%` : '0%';
      }
    }
  }

  // Get status from content script
  async function updateStatus() {
    const tab = await checkCurrentTab();
    if (!tab) return;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      
      if (response && response.active) {
        statusDot.className = 'status-dot active';
        statusText.textContent = 'Auto-Tracking Active';
        
        // Get last capture time from storage
        chrome.storage.local.get(['lastCaptureTime', 'lastCapturedData'], (result) => {
          if (result.lastCaptureTime) {
            lastCapture.textContent = formatTime(result.lastCaptureTime);
          }
          
          if (result.lastCapturedData) {
            updateCourseDisplay(result.lastCapturedData);
          } else if (response.stats) {
            // Use data from response if no stored data
            updateCourseDisplay({
              courseName: response.courseName,
              stats: response.stats
            });
          }
        });
      } else {
        statusDot.className = 'status-dot inactive';
        statusText.textContent = 'Tracker Initializing...';
      }
    } catch (error) {
      console.error('Status update error:', error);
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Waiting for content script...';
      
      // Try to show last captured data even if content script not ready
      chrome.storage.local.get(['lastCaptureTime', 'lastCapturedData'], (result) => {
        if (result.lastCaptureTime) {
          lastCapture.textContent = formatTime(result.lastCaptureTime);
        }
        if (result.lastCapturedData) {
          updateCourseDisplay(result.lastCapturedData);
        }
      });
    }
  }

  // Capture now button
  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    const originalText = captureBtn.innerHTML;
    captureBtn.innerHTML = '<div class="loader"></div>';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url?.includes('udemy.com/course/')) {
        showMessage('Please navigate to a Udemy course page', 'error');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'captureNow' });
      
      if (response.success) {
        showMessage('✅ Data captured successfully!', 'success');
        
        // Update display with captured data
        if (response.data) {
          updateCourseDisplay(response.data);
        }
        
        setTimeout(updateStatus, 500);
      } else {
        showMessage('Failed to capture data: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Capture error:', error);
      showMessage('Error: ' + error.message, 'error');
    } finally {
      captureBtn.disabled = false;
      captureBtn.innerHTML = originalText;
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.lastCapturedData || changes.lastCaptureTime) {
        updateStatus();
      }
    }
  });

  // Initial updates
  updateStatus();

  // Refresh status every 5 seconds
  setInterval(updateStatus, 5000);
});
