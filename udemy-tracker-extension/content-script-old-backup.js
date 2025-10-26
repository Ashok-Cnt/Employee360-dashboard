// Udemy Progress Tracker - Content Script
// Captures detailed course structure, sections, and lesson progress

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    collectorEndpoint: 'http://localhost:5001/api/udemy-tracker',
    updateInterval: 30000, // 30 seconds
    debug: true,
    retryAttempts: 3,
    retryDelay: 2000
  };

  let lastSentData = null;
  let monitoringActive = false;
  let captureIntervalId = null;
  let domObserver = null;

  function isExtensionContextValid() {
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
    } catch (error) {
      return false;
    }
  }

  function handleInvalidContext(reason = '') {
    const message = reason ? `⚠️ Extension context invalidated: ${reason}` : '⚠️ Extension context invalidated.';
    console.log(message);

    monitoringActive = false;

    if (captureIntervalId) {
      clearInterval(captureIntervalId);
      captureIntervalId = null;
    }

    if (domObserver) {
      try {
        domObserver.disconnect();
      } catch (error) {
        // Ignore disconnect issues
      }
      domObserver = null;
    }
  }

  // Utility: Deep compare objects
  function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  // Extract course ID from URL
  function extractCourseId() {
    const match = window.location.pathname.match(/\/course\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // Extract course name
  function extractCourseName() {
    const selectors = [
      'h1[data-purpose="course-header-title"]',
      '.course-title',
      'h1.ud-heading-serif-xxl',
      'h1.ud-heading-xl',
      '[data-purpose="lead-title"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    // Fallback to document title
    const title = document.title.split('|')[0].trim();
    return title.replace(/^Course:\s*/i, '');
  }

  // Determine lesson type from element
  function determineLessonType(lessonElement) {
    // Check for type indicators in the element
    const text = lessonElement.textContent.toLowerCase();
    const html = lessonElement.innerHTML.toLowerCase();

    if (html.includes('play-circle') || html.includes('video') || text.includes('video')) return 'video';
    if (html.includes('quiz') || html.includes('question') || text.includes('quiz')) return 'quiz';
    if (html.includes('article') || html.includes('description') || text.includes('article')) return 'article';
    if (html.includes('code') || text.includes('coding exercise')) return 'coding-exercise';
    if (text.includes('assignment')) return 'assignment';
    if (text.includes('practice')) return 'practice';
    
    return 'video'; // Default
  }

  function resolveLessonContainer(lessonElement) {
    if (!lessonElement) {
      return null;
    }

    const containerSelectors = [
      'li[data-purpose="curriculum-item"]',
      'div[data-purpose="curriculum-item-container"]',
      'li[class*="curriculum-item"]',
      'div[class*="curriculum-item-container"]'
    ];

    for (const selector of containerSelectors) {
      if (lessonElement.matches?.(selector)) {
        return lessonElement;
      }
    }

    for (const selector of containerSelectors) {
      const container = lessonElement.closest?.(selector);
      if (container) {
        return container;
      }
    }

    if (lessonElement.parentElement?.matches('li')) {
      return lessonElement.parentElement;
    }

    return lessonElement.parentElement?.closest('li') || null;
  }

  // Expand all collapsed sections to make them visible
  async function expandAllSections() {
    // First, try to find and click "Expand all sections" button
    const expandAllSelectors = [
      'button[data-purpose="expand-all-sections"]',
      'button:has-text("Expand all sections")',
      '[aria-label*="Expand all"]',
      'button:contains("Expand all")'
    ];

    for (const selector of expandAllSelectors) {
      try {
        const expandAllBtn = document.querySelector(selector);
        if (expandAllBtn) {
          console.log('🔄 Found "Expand All" button, clicking...');
          expandAllBtn.click();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for all to expand
          console.log('✅ All sections expanded via "Expand All" button');
          return;
        }
      } catch (error) {
        // Continue to manual expansion
      }
    }

    // Manual expansion fallback
    const expandButtonSelectors = [
      'button[data-purpose="expand-toggle"]',
      'button[class*="section-title"]',
      'button[class*="accordion-panel-module--panel-title"]',
      '[class*="section-title-wrapper"] button',
      '.section--section-title button',
      'button[aria-expanded="false"]'
    ];

    let expandButtons = [];
    for (const selector of expandButtonSelectors) {
      const buttons = Array.from(document.querySelectorAll(selector));
      if (buttons.length > 0) {
        expandButtons = buttons;
        console.log(`🔍 Using selector: ${selector}, found ${buttons.length} buttons`);
        break;
      }
    }

    if (expandButtons.length === 0) {
      console.log('ℹ️ No expand buttons found - sections might already be expanded');
      return;
    }

    console.log(`🔄 Expanding ${expandButtons.length} sections manually...`);

    // Expand all buttons at once (so they all stay expanded)
    const buttonsToExpand = [];
    for (let i = 0; i < expandButtons.length; i++) {
      const button = expandButtons[i];
      const isCollapsed = button.getAttribute('aria-expanded') === 'false' ||
                         button.getAttribute('aria-checked') === 'false';
      
      if (isCollapsed) {
        buttonsToExpand.push({button, index: i});
      }
    }

    console.log(`  Found ${buttonsToExpand.length} collapsed sections to expand`);

    // Click all at once to keep them all expanded
    for (const {button, index} of buttonsToExpand) {
      try {
        console.log(`  Expanding section ${index + 1}/${expandButtons.length}`);
        button.click();
      } catch (error) {
        console.error(`Error expanding section ${index + 1}:`, error);
      }
    }

    // Wait longer for all lessons to load in all sections
    console.log('⏳ Waiting for all lessons to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ All sections expanded manually');
  }

  // Extract all sections and their lessons
  async function extractSections() {
    const sections = [];
    
    console.log('📋 Extracting all sections from page (expanded or collapsed)...');

    // First, try to find all section containers (accordion panels)
    const sectionSelectors = [
      'div[data-purpose="curriculum-section-container"]',
      'section[data-purpose="curriculum-section"]',
      '.curriculum-section',
      '[class*="accordion-panel-module--panel"]',
      'div[class*="accordion-panel"]'
    ];

    let sectionElements = null;
    for (const selector of sectionSelectors) {
      sectionElements = document.querySelectorAll(selector);
      if (CONFIG.debug) {
        console.log(`Trying selector: ${selector}, found: ${sectionElements.length}`);
      }
      if (sectionElements.length > 0) break;
    }

    if (!sectionElements || sectionElements.length === 0) {
      console.log('⚠️ No sections found on page. Make sure you are on the course curriculum page.');
      console.log('Current URL:', window.location.href);
      return sections;
    }
    
    console.log(`✅ Found ${sectionElements.length} total sections (expanded and collapsed)`);

    sectionElements.forEach((sectionEl, sectionIndex) => {
      try {
        // Extract section title from h3.ud-accordion-panel-heading or similar
        const titleSelectors = [
          'h3.ud-accordion-panel-heading',
          'h3[class*="accordion-panel-heading"]',
          '[data-purpose="curriculum-section-title"]',
          '.ud-accordion-panel-heading',
          'button[class*="accordion-panel-title"]',
          '.section-title',
          'button[class*="section-title"]',
          '[class*="section-heading"]'
        ];

        let sectionTitle = null;
        for (const selector of titleSelectors) {
          const titleEl = sectionEl.querySelector(selector);
          if (titleEl && titleEl.textContent.trim()) {
            sectionTitle = titleEl.textContent.trim();
            // Clean up the title - remove extra info like "4 lectures • 15min"
            sectionTitle = sectionTitle.split(/\d+\s+(lecture|lesson)/i)[0].trim();
            break;
          }
        }

        if (!sectionTitle) {
          sectionTitle = `Section ${sectionIndex + 1}`;
        }

        // Extract section number if it's in format "Section X: Title"
        const sectionMatch = sectionTitle.match(/^Section\s+(\d+):\s*(.+)/i);
        const sectionNumber = sectionMatch ? parseInt(sectionMatch[1]) : sectionIndex + 1;
        const cleanSectionTitle = sectionMatch ? sectionMatch[2] : sectionTitle;

        console.log(`  Processing Section ${sectionNumber}: ${cleanSectionTitle.substring(0, 50)}...`);

        // Check if section is expanded by looking for aria-expanded attribute
        const expandButton = sectionEl.querySelector('button[aria-expanded]');
        const isExpanded = expandButton ? expandButton.getAttribute('aria-expanded') === 'true' : false;
        
        console.log(`    Section is ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);

        const lessons = [];
        
        // Only extract lesson details if section is expanded
        if (isExpanded) {
          // Extract lessons in this section - use more specific selectors to avoid duplicates
          const lessonSelectors = [
            'li[data-purpose="curriculum-item"]',
            'div[data-purpose="curriculum-item-container"]',
            'button[data-purpose="curriculum-item-link"]',
            'a[data-purpose="curriculum-item-link"]',
            '.curriculum-item-link'
          ];

          let lessonElements = null;
          for (const selector of lessonSelectors) {
            lessonElements = sectionEl.querySelectorAll(selector);
            if (lessonElements.length > 0) {
              console.log(`    Found ${lessonElements.length} lessons using selector: ${selector}`);
              break;
            }
          }

          const seenLessons = new Set(); // Track unique lessons by title to avoid duplicates

          if (lessonElements && lessonElements.length > 0) {
            lessonElements.forEach((lessonEl, lessonIndex) => {
            try {
              // Extract lesson title
              const titleSelectors = [
                '.item-title',
                '[data-purpose="item-title"]',
                '[class*="item-title"]',
                'span[class*="title"]'
              ];

              let lessonTitle = null;
              for (const selector of titleSelectors) {
                const titleEl = lessonEl.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                  lessonTitle = titleEl.textContent.trim();
                  break;
                }
              }

              if (!lessonTitle) {
                lessonTitle = lessonEl.textContent.trim().split('\n')[0] || `Lesson ${lessonIndex + 1}`;
              }

              // Skip if we've already seen this lesson (avoid duplicates)
              if (seenLessons.has(lessonTitle)) {
                console.log(`      Skipping duplicate lesson: ${lessonTitle.substring(0, 30)}...`);
                return;
              }
              seenLessons.add(lessonTitle);

              // Extract duration
              const durationSelectors = [
                '.item-duration',
                '[data-purpose="item-duration"]',
                '[class*="duration"]',
                'span[class*="time"]'
              ];

              let duration = '';
              for (const selector of durationSelectors) {
                const durationEl = lessonEl.querySelector(selector);
                if (durationEl && durationEl.textContent.trim()) {
                  duration = durationEl.textContent.trim();
                  break;
                }
              }

              // Check if completed - rely primarily on checkbox state
              let isCompleted = false;
              let completionDetermined = false;

              const lessonContainer = resolveLessonContainer(lessonEl) || lessonEl.parentElement;

              let toggleInput = null;
              if (lessonEl instanceof HTMLElement) {
                toggleInput = lessonEl.querySelector('input.ud-real-toggle-input[type="checkbox"]');
              }

              if (!toggleInput && lessonContainer instanceof HTMLElement) {
                toggleInput = lessonContainer.querySelector('input.ud-real-toggle-input[type="checkbox"]');
              }

              if (toggleInput instanceof HTMLInputElement) {
                const ariaCheckedValue = toggleInput.getAttribute('aria-checked');

                if (ariaCheckedValue === 'true') {
                  isCompleted = true;
                  completionDetermined = true;
                } else if (ariaCheckedValue === 'false') {
                  isCompleted = false;
                  completionDetermined = true;
                } else {
                  isCompleted = toggleInput.checked || toggleInput.hasAttribute('checked');
                  completionDetermined = true;
                }
              }

              if (!completionDetermined) {
                const completionToggle = (lessonContainer || lessonEl)
                  .querySelector('[data-purpose="curriculum-item-completion-toggle"]');
                if (completionToggle) {
                  const ariaChecked = completionToggle.getAttribute('aria-checked');
                  const ariaPressed = completionToggle.getAttribute('aria-pressed');
                  const dataChecked = completionToggle.getAttribute('data-checked');

                  if (ariaChecked === 'true' || ariaPressed === 'true' || dataChecked === 'true') {
                    isCompleted = true;
                    completionDetermined = true;
                  } else if (ariaChecked === 'false' || ariaPressed === 'false' || dataChecked === 'false') {
                    isCompleted = false;
                    completionDetermined = true;
                  }
                }
              }

              const containerStatus = lessonContainer ? (lessonContainer.getAttribute('data-status') || lessonContainer.dataset?.status || null) : null;
              const containerCompletionAttr = lessonContainer ? (lessonContainer.getAttribute('data-complete') || lessonContainer.dataset?.complete || null) : null;
              const containerClassListRaw = (lessonContainer?.className || lessonEl.className || '').trim();
              const containerClassList = containerClassListRaw.toLowerCase();

              if (!completionDetermined && containerStatus) {
                const normalizedStatus = containerStatus.toLowerCase();
                if (normalizedStatus === 'completed' || normalizedStatus === 'complete' || normalizedStatus === 'done') {
                  isCompleted = true;
                  completionDetermined = true;
                } else if (normalizedStatus.includes('incomplete') || normalizedStatus === 'not_completed' || normalizedStatus === 'not-completed' || normalizedStatus === 'inprogress') {
                  isCompleted = false;
                  completionDetermined = true;
                }
              }

              if (!completionDetermined && containerCompletionAttr) {
                const normalized = containerCompletionAttr.toLowerCase();
                if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
                  isCompleted = true;
                  completionDetermined = true;
                } else if (normalized === 'false' || normalized === '0' || normalized === 'no') {
                  isCompleted = false;
                  completionDetermined = true;
                }
              }

              if (!completionDetermined) {
                const completionModifierMatch = containerClassList.match(/--complete--(true|false)/);
                if (completionModifierMatch) {
                  isCompleted = completionModifierMatch[1] === 'true';
                  completionDetermined = true;
                }

                if (!completionDetermined && containerClassList) {
                  if (/--complete--true|--completed--true/.test(containerClassList)) {
                    isCompleted = true;
                    completionDetermined = true;
                  } else if (/--complete--false|--completed--false/.test(containerClassList)) {
                    isCompleted = false;
                    completionDetermined = true;
                  }

                  if (!completionDetermined) {
                    if (/\bcompleted\b|\bis-complete\b|\bis-completed\b/.test(containerClassList)) {
                      isCompleted = true;
                      completionDetermined = true;
                    }
                  }

                  if (/--incomplete--|\bincomplete\b|\bnot-started\b|\bnot_started\b|\bnot-completed\b/.test(containerClassList)) {
                    isCompleted = false;
                    completionDetermined = true;
                  }
                }
              }

              if (CONFIG.debug) {
                const toggleContainer = (lessonContainer || lessonEl)
                  .querySelector('[data-purpose="curriculum-item-completion-toggle"]');
                const debugToggleInput = (lessonEl instanceof HTMLElement ? lessonEl.querySelector('.ud-real-toggle-input') : null)
                  || (lessonContainer instanceof HTMLElement ? lessonContainer.querySelector('.ud-real-toggle-input') : null);
                console.log('      Lesson completion debug:', {
                  lessonTitle,
                  isCompleted,
                  completionDetermined,
                  toggleContainerAriaChecked: toggleContainer?.getAttribute('aria-checked') || null,
                  toggleContainerAriaPressed: toggleContainer?.getAttribute('aria-pressed') || null,
                  toggleContainerDataChecked: toggleContainer?.getAttribute('data-checked') || null,
                  toggleInputAriaChecked: debugToggleInput ? debugToggleInput.getAttribute('aria-checked') : null,
                  toggleInputDataState: debugToggleInput ? (debugToggleInput.getAttribute('data-state') || debugToggleInput.getAttribute('data-checked')) : null,
                  toggleInputCheckedProperty: debugToggleInput instanceof HTMLInputElement ? debugToggleInput.checked : null,
                  toggleInputHasCheckedAttribute: debugToggleInput ? debugToggleInput.hasAttribute('checked') : null,
                  lessonContainerClass: containerClassListRaw,
                  lessonContainerDataStatus: containerStatus,
                  lessonContainerDataComplete: containerCompletionAttr,
                  lessonContainerAttributes: lessonContainer ? Object.fromEntries(Array.from(lessonContainer.attributes).map(attr => [attr.name, attr.value])) : null,
                  toggleInputAttributes: toggleInput ? Object.fromEntries(Array.from(toggleInput.attributes).map(attr => [attr.name, attr.value])) : null
                });
              }

              const lessonType = determineLessonType(lessonEl);
              const lessonUrl = lessonEl.href || '';

              lessons.push({
                lessonIndex: lessons.length + 1, // Use actual array length for correct indexing
                lessonTitle: lessonTitle.substring(0, 200), // Limit length
                duration,
                isCompleted,
                type: lessonType,
                url: lessonUrl
              });
            } catch (error) {
              console.error('Error extracting lesson:', error);
            }
          });
          } else {
            console.log(`    No lesson elements found in expanded section`);
          }
        } else {
          console.log(`    Section is collapsed - skipping lesson extraction`);
        }

        sections.push({
          sectionIndex: sectionNumber,
          sectionTitle: cleanSectionTitle.substring(0, 200), // Limit length
          totalLessons: lessons.length,
          completedLessons: lessons.filter(l => l.isCompleted).length,
          lessons,
          isExpanded: isExpanded
        });
      } catch (error) {
        console.error('Error extracting section:', error);
      }
    });

    return sections;
  }

  // Extract current lesson being watched
  function extractCurrentLesson() {
    // Check if we're on a lecture page
    const lectureSelectors = [
      '[data-purpose="curriculum-item-viewer"]',
      '.lecture-viewer',
      '[class*="lecture-view"]'
    ];

    let isLecturePage = false;
    for (const selector of lectureSelectors) {
      if (document.querySelector(selector)) {
        isLecturePage = true;
        break;
      }
    }

    if (!isLecturePage) return null;

    // Extract lecture title
    const titleSelectors = [
      '[data-purpose="lecture-title"]',
      '.lecture-title',
      'h1.ud-heading-serif-xl',
      'h1[class*="heading"]'
    ];

    let lessonTitle = null;
    for (const selector of titleSelectors) {
      const titleEl = document.querySelector(selector);
      if (titleEl && titleEl.textContent.trim()) {
        lessonTitle = titleEl.textContent.trim();
        break;
      }
    }

    // Extract video progress if available
    const videoElement = document.querySelector('video');
    let videoProgress = null;

    if (videoElement) {
      const currentTime = videoElement.currentTime || 0;
      const duration = videoElement.duration || 0;
      const percentComplete = duration > 0 ? (currentTime / duration * 100).toFixed(2) : 0;

      videoProgress = {
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        percentComplete: parseFloat(percentComplete),
        isPlaying: !videoElement.paused
      };
    }

    return {
      lessonTitle,
      videoProgress,
      timestamp: new Date().toISOString()
    };
  }

  // Extract overall course progress
  function extractProgress() {
    const progressSelectors = [
      '[data-purpose="progress-indicator"]',
      '.progress-indicator',
      '[class*="progress"]',
      '[aria-label*="progress"]'
    ];

    let progressText = null;
    for (const selector of progressSelectors) {
      const progressEl = document.querySelector(selector);
      if (progressEl && progressEl.textContent.trim()) {
        progressText = progressEl.textContent.trim();
        break;
      }
    }

    if (!progressText) {
      return {
        percentComplete: null,
        completedLectures: null,
        totalLectures: null,
        rawText: null
      };
    }

    // Parse "X% complete" or "X of Y lectures"
    const percentMatch = progressText.match(/(\d+)%/);
    const lecturesMatch = progressText.match(/(\d+)\s+of\s+(\d+)/);

    return {
      percentComplete: percentMatch ? parseInt(percentMatch[1]) : null,
      completedLectures: lecturesMatch ? parseInt(lecturesMatch[1]) : null,
      totalLectures: lecturesMatch ? parseInt(lecturesMatch[2]) : null,
      rawText: progressText
    };
  }

  // Extract additional metadata
  function extractMetadata() {
    const instructorSelectors = [
      '[data-purpose="instructor-name"]',
      '.instructor-name',
      '[class*="instructor"]'
    ];

    let instructor = null;
    for (const selector of instructorSelectors) {
      const instructorEl = document.querySelector(selector);
      if (instructorEl && instructorEl.textContent.trim()) {
        instructor = instructorEl.textContent.trim();
        break;
      }
    }

    const ratingSelectors = [
      '[data-purpose="rating"]',
      '.star-rating',
      '[class*="rating"]'
    ];

    let rating = null;
    for (const selector of ratingSelectors) {
      const ratingEl = document.querySelector(selector);
      if (ratingEl && ratingEl.textContent.trim()) {
        rating = ratingEl.textContent.trim();
        break;
      }
    }

    return {
      instructor,
      rating,
      lastUpdated: new Date().toISOString(),
      userAgent: navigator.userAgent,
      pageUrl: window.location.href
    };
  }

  // Extract complete course data
  async function extractCourseData() {
    const courseId = extractCourseId();
    if (!courseId) {
      console.log('Not on a course page');
      return null;
    }

    const courseName = extractCourseName();
    const sections = await extractSections(); // Now async
    const currentLesson = extractCurrentLesson();
    const progress = extractProgress();
    const metadata = extractMetadata();

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      courseId,
      courseName,
      sections,
      currentLesson,
      progress,
      metadata,
      stats: {
        totalSections: sections.length,
        totalLessons: sections.reduce((sum, s) => sum + s.totalLessons, 0),
        completedLessons: sections.reduce((sum, s) => sum + s.completedLessons, 0)
      }
    };
  }

  // Send data to Python collector
  async function sendToCollector(data, attempt = 1) {
    try {
      // Check if extension context is still valid
      if (!isExtensionContextValid()) {
        handleInvalidContext('during send');
        return false;
      }

      const response = await fetch(CONFIG.collectorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (CONFIG.debug) {
        console.log('✅ Data sent to collector successfully:', {
          course: data.courseName,
          sections: data.stats.totalSections,
          lessons: data.stats.totalLessons,
          completed: data.stats.completedLessons
        });
      }

      // Update badge (with error handling)
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({
            action: 'updateBadge',
            text: '✓',
            color: '#4CAF50'
          });
        }
      } catch (e) {
        // Silently ignore badge update errors
      }

      return true;
    } catch (error) {
      console.error(`❌ Failed to send data (attempt ${attempt}/${CONFIG.retryAttempts}):`, error);

      // Check if error is due to extension context
      if (error.message?.includes('Extension context invalidated')) {
        handleInvalidContext('during send (catch)');
        return false;
      }

      // Retry logic
      if (attempt < CONFIG.retryAttempts) {
        console.log(`Retrying in ${CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        return sendToCollector(data, attempt + 1);
      }

      // Store locally as fallback
      storeLocally(data);
      
      // Update badge to show error (with error handling)
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({
            action: 'updateBadge',
            text: '!',
            color: '#F44336'
          });
        }
      } catch (e) {
        // Silently ignore badge update errors
      }

      return false;
    }
  }

  // Store data locally as fallback
  function storeLocally(data) {
    if (!isExtensionContextValid()) {
      handleInvalidContext('before storing locally');
      return;
    }

    try {
      chrome.storage.local.get(['cachedData'], (result) => {
        if (!isExtensionContextValid()) {
          handleInvalidContext('during storage read');
          return;
        }

        if (chrome.runtime?.lastError) {
          console.log('⚠️ Storage access failed:', chrome.runtime.lastError);
          return;
        }

        const cached = result.cachedData || [];
        cached.push({
          ...data,
          cachedAt: new Date().toISOString()
        });

        if (cached.length > 50) {
          cached.shift();
        }

        try {
          chrome.storage.local.set({ cachedData: cached }, () => {
            if (!isExtensionContextValid()) {
              handleInvalidContext('during storage write');
              return;
            }

            if (chrome.runtime?.lastError) {
              console.log('⚠️ Failed to cache data:', chrome.runtime.lastError);
              return;
            }
            console.log('📦 Data cached locally');
          });
        } catch (error) {
          if (error.message?.includes('Extension context invalidated')) {
            handleInvalidContext('storage set throw');
          } else {
            console.log('⚠️ Error during chrome.storage.local.set:', error.message);
          }
        }
      });
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        handleInvalidContext('storage get throw');
      } else {
        console.log('⚠️ Error storing data locally:', error.message);
      }
    }
  }

  // Capture and send data
  async function captureAndSend() {
    try {
      // Check if extension context is still valid
      if (!isExtensionContextValid()) {
        handleInvalidContext('before capture');
        return;
      }

      const data = await extractCourseData(); // Now awaiting async function
      
      if (!data || !data.courseId) {
        console.log('No valid course data to capture');
        return;
      }

      // Only send if data has changed
      if (lastSentData && deepEqual(data.sections, lastSentData.sections)) {
        if (CONFIG.debug) {
          console.log('⏭️ No changes detected, skipping send');
        }
        return;
      }

      lastSentData = data;
      
      // Save the latest captured data for the popup to display
      try {
        chrome.storage.local.set({ lastCapturedData: data }, () => {
          if (!isExtensionContextValid()) {
            handleInvalidContext('during lastCapturedData save');
            return;
          }

          if (chrome.runtime?.lastError) {
            console.log('⚠️ Extension context invalidated during save');
            return;
          }
          console.log('💾 Latest data saved for popup display');
        });
      } catch (error) {
        if (error.message?.includes('Extension context invalidated')) {
          handleInvalidContext('save throw');
          return;
        }
        console.error('Error saving last captured data:', error);
      }
      
      await sendToCollector(data);
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        handleInvalidContext('capture exception');
      } else {
        console.error('Error in captureAndSend:', error);
      }
    }
  }

  // Main monitoring function
  function startMonitoring() {
    // Check if extension context is valid
    if (!isExtensionContextValid()) {
      handleInvalidContext('during startMonitoring');
      return;
    }

    if (monitoringActive) {
      console.log('Monitoring already active');
      return;
    }

    monitoringActive = true;
    console.log('🎓 Udemy Progress Tracker started');

    // Initial capture after short delay (let page fully load)
    setTimeout(() => {
      if (!isExtensionContextValid()) {
        handleInvalidContext('initial capture timeout');
        return;
      }
      captureAndSend();
    }, 3000);

    // Periodic updates
    captureIntervalId = setInterval(() => {
      if (!isExtensionContextValid()) {
        handleInvalidContext('during interval');
        return;
      }
      captureAndSend();
    }, CONFIG.updateInterval);

    // Watch for DOM changes (lesson completion, navigation)
    domObserver = new MutationObserver(() => {
      // Check if extension context is still valid
      if (!isExtensionContextValid()) {
        handleInvalidContext('during mutation observer');
        return;
      }
      
      // Debounce to avoid excessive calls
      clearTimeout(window.udemyTrackerTimeout);
      window.udemyTrackerTimeout = setTimeout(() => {
        captureAndSend();
      }, 2000);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-checked'] // Watch for completion changes
    });

    // Listen for video completion events
    document.addEventListener('ended', (event) => {
      if (!isExtensionContextValid()) {
        handleInvalidContext('video ended listener');
        return;
      }

      if (event.target.tagName === 'VIDEO') {
        console.log('Video ended, capturing progress...');
        setTimeout(() => {
          captureAndSend();
        }, 1000);
      }
    }, true);
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMonitoring);
  } else {
    startMonitoring();
  }

  if (isExtensionContextValid() && chrome.runtime?.onMessage?.addListener) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!isExtensionContextValid()) {
        handleInvalidContext('message listener');
        try {
          sendResponse({ success: false, error: 'Extension context invalidated. Please refresh the page.' });
        } catch (error) {
          // Ignore sendResponse errors when context gone
        }
        return false;
      }

      if (request.action === 'captureNow') {
        captureAndSend().then(() => {
          try {
            sendResponse({ success: true });
          } catch (error) {
            // Ignore response errors
          }
        }).catch((error) => {
          try {
            sendResponse({ success: false, error: error.message });
          } catch (responseError) {
            // Ignore
          }
        });
        return true; // Keep channel open for async response
      }

      if (request.action === 'getStatus') {
        try {
          sendResponse({
            active: monitoringActive,
            lastCapture: lastSentData ? lastSentData.timestamp : null,
            courseName: lastSentData ? lastSentData.courseName : null
          });
        } catch (error) {
          // Ignore sendResponse errors
        }
      }
    });
  } else {
    handleInvalidContext('unable to register message listener');
  }
})();
