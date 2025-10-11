// Content script for additional page tracking
(function() {
  'use strict';
  
  let pageStartTime = Date.now();
  let isVisible = true;
  let lastActivityTime = Date.now();
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', function() {
    isVisible = !document.hidden;
    if (isVisible) {
      lastActivityTime = Date.now();
    }
  });
  
  // Track user interactions to determine engagement
  const interactionEvents = ['click', 'keydown', 'scroll', 'mousemove'];
  
  interactionEvents.forEach(event => {
    document.addEventListener(event, function() {
      lastActivityTime = Date.now();
    }, { passive: true });
  });
  
  // Track focus/blur events
  window.addEventListener('focus', function() {
    isVisible = true;
    lastActivityTime = Date.now();
  });
  
  window.addEventListener('blur', function() {
    isVisible = false;
  });
  
  // Send engagement data periodically
  setInterval(function() {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityTime;
    
    // If user has been inactive for more than 30 seconds, don't count as active time
    if (timeSinceActivity < 30000 && isVisible) {
      chrome.runtime.sendMessage({
        type: 'PAGE_ENGAGEMENT',
        data: {
          url: window.location.href,
          title: document.title,
          isActive: true,
          timestamp: now,
          engagement_score: calculateEngagementScore()
        }
      });
    }
  }, 10000); // Send data every 10 seconds
  
  function calculateEngagementScore() {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityTime;
    
    // Higher score for recent activity
    if (timeSinceActivity < 5000) return 1.0;
    if (timeSinceActivity < 15000) return 0.8;
    if (timeSinceActivity < 30000) return 0.6;
    return 0.0;
  }
  
  // Track specific coding-related activities
  if (isCodeRelatedSite()) {
    trackCodingActivity();
  }
  
  function isCodeRelatedSite() {
    const codingSites = [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stackoverflow.com',
      'codepen.io',
      'repl.it',
      'codesandbox.io',
      'jsbin.com',
      'jsfiddle.net'
    ];
    
    return codingSites.some(site => window.location.hostname.includes(site));
  }
  
  function trackCodingActivity() {
    // Track code editor interactions
    const codeElements = document.querySelectorAll('textarea, .CodeMirror, .monaco-editor, pre code');
    
    codeElements.forEach(element => {
      element.addEventListener('focus', function() {
        chrome.runtime.sendMessage({
          type: 'CODING_SESSION_START',
          data: {
            url: window.location.href,
            element_type: element.className || element.tagName,
            timestamp: Date.now()
          }
        });
      });
      
      element.addEventListener('blur', function() {
        chrome.runtime.sendMessage({
          type: 'CODING_SESSION_END',
          data: {
            url: window.location.href,
            timestamp: Date.now()
          }
        });
      });
    });
  }
  
  // Track learning-related activities
  if (isLearningRelatedSite()) {
    trackLearningActivity();
  }
  
  function isLearningRelatedSite() {
    const learningSites = [
      'coursera.org',
      'edx.org',
      'udemy.com',
      'pluralsight.com',
      'linkedin.com/learning',
      'khanacademy.org',
      'freecodecamp.org',
      'codecademy.com',
      'developer.mozilla.org',
      'w3schools.com'
    ];
    
    return learningSites.some(site => window.location.hostname.includes(site));
  }
  
  function trackLearningActivity() {
    // Track video playback
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.addEventListener('play', function() {
        chrome.runtime.sendMessage({
          type: 'LEARNING_VIDEO_START',
          data: {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
          }
        });
      });
      
      video.addEventListener('pause', function() {
        chrome.runtime.sendMessage({
          type: 'LEARNING_VIDEO_PAUSE',
          data: {
            url: window.location.href,
            timestamp: Date.now()
          }
        });
      });
    });
    
    // Track quiz/exercise completion
    const quizElements = document.querySelectorAll('[data-testid*="quiz"], .quiz, .exercise, .problem');
    quizElements.forEach(element => {
      element.addEventListener('click', function() {
        chrome.runtime.sendMessage({
          type: 'LEARNING_INTERACTION',
          data: {
            url: window.location.href,
            interaction_type: 'quiz_attempt',
            timestamp: Date.now()
          }
        });
      });
    });
  }
  
})();