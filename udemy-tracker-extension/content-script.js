// Enhanced Udemy Course Tracker Content Script
(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    collectorEndpoint: 'http://localhost:8001/api/udemy-tracker',
    badgeColor: '#1C1D1F',
    debug: true
  };

  console.log('🚀 Udemy Tracker Content Script Loaded');

  // Store previously collected section data to preserve lesson details
  let previousSectionsData = {};

  // Extract all sections and their lessons based on the actual Udemy HTML structure
  async function extractSections() {
    const sections = [];
    
    console.log('📋 Starting section extraction...');

    // Wait for the curriculum to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the main curriculum container
    const curriculumContainer = document.querySelector('div[data-purpose="curriculum-section-container"]');
    
    if (!curriculumContainer) {
      console.error('❌ Curriculum container not found. Are you on a course curriculum page?');
      return sections;
    }

    // Get all section panels - these use data-purpose="section-panel-X"
    const sectionPanels = curriculumContainer.querySelectorAll('div[data-purpose^="section-panel-"]');
    
    if (sectionPanels.length === 0) {
      console.error('❌ No section panels found');
      return sections;
    }

    console.log(`✅ Found ${sectionPanels.length} sections in curriculum`);

    sectionPanels.forEach((panel, index) => {
      try {
        // Find the h3 heading with section title
        const headingH3 = panel.querySelector('h3.ud-accordion-panel-heading');
        if (!headingH3) {
          console.warn(`⚠️ Section ${index + 1}: No h3 heading found`);
          return;
        }

        // Get the expand/collapse button to check aria-expanded
        const toggleButton = headingH3.querySelector('button[aria-expanded]');
        const isExpanded = toggleButton ? toggleButton.getAttribute('aria-expanded') === 'true' : false;

        // Get section title from the span inside the button
        const titleSpan = headingH3.querySelector('span.ud-accordion-panel-title span');
        let fullTitle = titleSpan ? titleSpan.textContent.trim() : `Section ${index + 1}`;

        // Parse "Section X: Title" format
        const match = fullTitle.match(/^Section\s+(\d+):\s*(.+)$/i);
        const sectionNumber = match ? parseInt(match[1]) : index + 1;
        const sectionTitle = match ? match[2].trim() : fullTitle;

        console.log(`📦 Section ${sectionNumber}: "${sectionTitle}" (${isExpanded ? 'EXPANDED' : 'COLLAPSED'})`);

        // Create section object
        const sectionData = {
          sectionIndex: sectionNumber,
          sectionTitle: sectionTitle,
          totalLessons: 0,
          completedLessons: 0,
          lessons: [],
          isExpanded: isExpanded
        };

        // Only extract lessons if the section is expanded
        if (isExpanded) {
          // Find the accordion content wrapper for this section
          const contentWrapper = panel.querySelector('.accordion-panel-module--content-wrapper--TkHqe');
          
          if (contentWrapper) {
            // Get all lesson items
            const lessonItems = contentWrapper.querySelectorAll('li.curriculum-item-link--curriculum-item--OVP5S');
            sectionData.totalLessons = lessonItems.length;

            console.log(`  → Found ${lessonItems.length} lessons`);

            lessonItems.forEach((item, lessonIndex) => {
              // Get lesson title from [data-purpose="item-title"]
              const titleElement = item.querySelector('[data-purpose="item-title"]');
              let lessonTitle = titleElement ? titleElement.textContent.trim() : `Lesson ${lessonIndex + 1}`;

              // Remove leading numbers like "1. ", "2. ", etc.
              lessonTitle = lessonTitle.replace(/^\d+\.\s*/, '');

              // Check completion status from checkbox
              const checkbox = item.querySelector('input[type="checkbox"][data-purpose="progress-toggle-button"]');
              const isCompleted = checkbox ? checkbox.checked : false;

              if (isCompleted) {
                sectionData.completedLessons++;
              }

              sectionData.lessons.push({
                lessonIndex: lessonIndex + 1,
                lessonTitle: lessonTitle,
                isCompleted: isCompleted
              });
            });

            console.log(`  → Completed: ${sectionData.completedLessons}/${sectionData.totalLessons}`);

            // Store this section's data for future use
            previousSectionsData[sectionNumber] = {
              totalLessons: sectionData.totalLessons,
              completedLessons: sectionData.completedLessons,
              lessons: [...sectionData.lessons]
            };
          }
        } else {
          // Section is collapsed - check if we have previous data for this section
          if (previousSectionsData[sectionNumber]) {
            console.log(`  → Section collapsed - using cached data (${previousSectionsData[sectionNumber].totalLessons} lessons)`);
            sectionData.totalLessons = previousSectionsData[sectionNumber].totalLessons;
            sectionData.completedLessons = previousSectionsData[sectionNumber].completedLessons;
            sectionData.lessons = [...previousSectionsData[sectionNumber].lessons];
          } else {
            console.log(`  → Section collapsed - no cached data available`);
          }
        }

        sections.push(sectionData);

      } catch (error) {
        console.error(`❌ Error processing section ${index + 1}:`, error);
      }
    });

    console.log(`📊 Extraction complete: ${sections.length} sections total`);
    return sections;
  }

  // Extract course information
  async function extractCourseData() {
    console.log('📚 Extracting course data...');

    // Extract course name from URL or title
    const urlMatch = window.location.pathname.match(/\/course\/([^/]+)/);
    const courseId = urlMatch ? urlMatch[1] : 'unknown-course';

    // Extract course title from the page - try multiple selectors
    let courseTitle = document.querySelector('span.curriculum-item-view--course-title--s5jCa')?.textContent.trim() ||
                      document.querySelector('.ud-text-xl[data-purpose="title"]')?.textContent.trim() ||
                      document.querySelector('.course-lead--course-title--neX4I')?.textContent.trim() ||
                      document.title.split('|')[0].trim();

    // Extract sections
    const sections = await extractSections();

    // Calculate statistics
    const totalLessons = sections.reduce((sum, section) => sum + section.totalLessons, 0);
    const completedLessons = sections.reduce((sum, section) => sum + section.completedLessons, 0);

    const courseData = {
      courseId: courseId,
      courseName: courseTitle,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sections: sections,
      stats: {
        totalSections: sections.length,
        totalLessons: totalLessons,
        completedLessons: completedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      }
    };

    console.log('📊 Course Data Summary:', {
      course: courseTitle,
      sections: sections.length,
      lessons: totalLessons,
      completed: completedLessons,
      progress: courseData.stats.progress + '%'
    });

    return courseData;
  }

  // Send data to backend
  async function sendToBackend(data) {
    try {
      console.log('📤 Sending data to backend...');
      
      const response = await fetch(CONFIG.collectorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Data sent successfully:', result);
      
      // Store last captured data for popup display
      chrome.storage.local.set({ 
        lastCapturedData: data,
        lastCaptureTime: new Date().toISOString()
      });
      
      // Update badge
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'updateBadge',
          text: `${data.stats.progress}%`,
          color: CONFIG.badgeColor
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send data to backend:', error);
      throw error;
    }
  }

  // Main function to collect and send data
  async function collectAndSend() {
    try {
      console.log('🔄 Starting data collection...');
      
      // Check if we're on a course page
      if (!window.location.pathname.includes('/course/')) {
        console.log('ℹ️ Not on a course page, skipping');
        return;
      }

      const courseData = await extractCourseData();
      
      if (courseData.sections.length === 0) {
        console.warn('⚠️ No sections found, skipping send');
        return;
      }

      await sendToBackend(courseData);
      
    } catch (error) {
      console.error('❌ Error in collectAndSend:', error);
    }
  }

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Received message:', request);
    
    if (request.action === 'captureNow') {
      collectAndSend()
        .then(() => {
          // Store the last captured data
          extractCourseData().then(courseData => {
            chrome.storage.local.set({ 
              lastCapturedData: courseData,
              lastCaptureTime: new Date().toISOString()
            });
            sendResponse({ success: true, data: courseData });
          });
        })
        .catch(error => {
          console.error('❌ Capture error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open for async response
    }
    
    if (request.action === 'getStatus') {
      extractCourseData().then(courseData => {
        sendResponse({
          active: true,
          courseName: courseData.courseName,
          courseId: courseData.courseId,
          lastCapture: new Date().toISOString(),
          stats: courseData.stats
        });
      }).catch(error => {
        sendResponse({
          active: false,
          error: error.message
        });
      });
      return true; // Keep channel open for async response
    }
    
    sendResponse({ success: false, message: 'Unknown action' });
  });

  // Initialize when page is ready
  function initialize() {
    console.log('🎯 Initializing Udemy Tracker...');
    
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(collectAndSend, 2000);
        setupSectionObserver();
      });
    } else {
      setTimeout(collectAndSend, 2000);
      setupSectionObserver();
    }

    console.log('✅ Udemy Tracker initialized - Auto-capture enabled');
  }

  // Observe section expand/collapse and auto-fetch
  function setupSectionObserver() {
    // Wait for curriculum to be ready
    setTimeout(() => {
      const curriculumContainer = document.querySelector('div[data-purpose="curriculum-section-container"]');
      if (!curriculumContainer) {
        console.warn('⚠️ Could not find curriculum container for MutationObserver, retrying...');
        setTimeout(setupSectionObserver, 2000); // Retry after 2 seconds
        return;
      }

      console.log('� Setting up section expand/collapse observer...');

      // Use event delegation instead of MutationObserver for better reliability
      curriculumContainer.addEventListener('click', (event) => {
        // Check if the click was on a section toggle button
        const button = event.target.closest('button[aria-expanded]');
        if (button && button.closest('h3.ud-accordion-panel-heading')) {
          console.log('🔄 Section clicked, auto-updating in 500ms...');
          // Wait a bit for the section to expand/collapse
          setTimeout(() => {
            collectAndSend();
          }, 500);
        }
      }, true);

      console.log('✅ Section observer is active - will auto-update on expand/collapse');
    }, 3000);
  }

  // Start the extension
  initialize();

})();
