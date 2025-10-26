const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Get data directory from environment or use default
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data-collector/activity_data');

/**
 * Get the current logged-in username
 */
function getLoggedInUsername() {
  return process.env.USER_ID || os.userInfo().username || 'Admin';
}

/**
 * Extract course information from browser focus switches
 */
function extractCourseFromTitle(windowTitle, focusSwitch) {
  // Check if courseName already exists in focusSwitch
  if (focusSwitch.courseName) {
    return focusSwitch.courseName;
  }
  
  // Extract course name from window title
  // Common patterns: "Course Name | Udemy", "Course Name - Platform", etc.
  const patterns = [
    /^([^|]+)\s*\|\s*Udemy/i,
    /^([^-]+)\s*-\s*Udemy/i,
    /Udemy Business[:\s]*([^-|]+)/i,
    /Course[:\s]*([^-|]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = windowTitle.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If title contains "Udemy", extract first part
  if (windowTitle.toLowerCase().includes('udemy')) {
    const parts = windowTitle.split(/[|-]/);
    if (parts.length > 0 && parts[0].trim()) {
      return parts[0].trim();
    }
  }
  
  return null;
}

/**
 * Parse JSONL file and extract course data
 */
async function parseCoursesFromJSONL(jsonlFile) {
  try {
    const data = await fs.readFile(jsonlFile, 'utf-8');
    const lines = data.trim().split('\n').filter(l => l.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    // Use the last snapshot which contains cumulative data
    const lastSnapshot = JSON.parse(lines[lines.length - 1]);
    
    const coursesMap = {};
    
    // Find browser apps and extract course info from focusSwitches
    if (lastSnapshot.apps && Array.isArray(lastSnapshot.apps)) {
      for (const app of lastSnapshot.apps) {
        // Check if it's a browser app
        if (app.category === 'Browsers' && app.focusSwitches && Array.isArray(app.focusSwitches)) {
          for (const focusSwitch of app.focusSwitches) {
            const courseName = extractCourseFromTitle(focusSwitch.window_title, focusSwitch);
            
            if (courseName) {
              if (!coursesMap[courseName]) {
                coursesMap[courseName] = {
                  courseName,
                  totalHours: 0,
                  sessions: [],
                  status: 'in-progress',
                  category: 'Online Learning',
                  platform: focusSwitch.window_title.toLowerCase().includes('udemy') ? 'Udemy' : 'Other'
                };
              }
              
              coursesMap[courseName].totalHours += focusSwitch.totalHours || 0;
              coursesMap[courseName].sessions.push({
                date: focusSwitch.from,
                duration: focusSwitch.totalHours || 0,
                title: focusSwitch.window_title
              });
            }
          }
        }
      }
    }
    
    // Check background apps as well
    if (lastSnapshot.backgroundApps && lastSnapshot.backgroundApps.apps) {
      for (const app of lastSnapshot.backgroundApps.apps) {
        if (app.category === 'Browsers' && app.focusSwitches && Array.isArray(app.focusSwitches)) {
          for (const focusSwitch of app.focusSwitches) {
            const courseName = extractCourseFromTitle(focusSwitch.window_title, focusSwitch);
            
            if (courseName) {
              if (!coursesMap[courseName]) {
                coursesMap[courseName] = {
                  courseName,
                  totalHours: 0,
                  sessions: [],
                  status: 'in-progress',
                  category: 'Online Learning',
                  platform: focusSwitch.window_title.toLowerCase().includes('udemy') ? 'Udemy' : 'Other'
                };
              }
              
              coursesMap[courseName].totalHours += focusSwitch.totalHours || 0;
              coursesMap[courseName].sessions.push({
                date: focusSwitch.from,
                duration: focusSwitch.totalHours || 0,
                title: focusSwitch.window_title
              });
            }
          }
        }
      }
    }
    
    return Object.values(coursesMap);
  } catch (error) {
    console.error('Error parsing courses from JSONL:', error);
    return [];
  }
}

/**
 * Get learning progress for today
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.query.user_id || getLoggedInUsername();
    
    const jsonlFile = path.join(DATA_DIR, `activity_${today}_${userId}.jsonl`);
    
    try {
      const courses = await parseCoursesFromJSONL(jsonlFile);
      
      const totalHours = courses.reduce((sum, course) => sum + course.totalHours, 0);
      const totalCourses = courses.length;
      
      res.json({
        date: today,
        totalCourses,
        totalHours,
        courses
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.json({
          date: today,
          totalCourses: 0,
          totalHours: 0,
          courses: []
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error fetching today\'s learning progress:', error);
    res.status(500).json({ error: 'Failed to fetch learning progress' });
  }
});

/**
 * Get learning progress for a specific date
 */
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.query.user_id || getLoggedInUsername();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const jsonlFile = path.join(DATA_DIR, `activity_${date}_${userId}.jsonl`);
    
    try {
      const courses = await parseCoursesFromJSONL(jsonlFile);
      
      const totalHours = courses.reduce((sum, course) => sum + course.totalHours, 0);
      const totalCourses = courses.length;
      
      res.json({
        date,
        totalCourses,
        totalHours,
        courses
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.json({
          date,
          totalCourses: 0,
          totalHours: 0,
          courses: []
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error fetching learning progress for date:', error);
    res.status(500).json({ error: 'Failed to fetch learning progress' });
  }
});

/**
 * Get learning progress for a date range
 */
router.get('/range', async (req, res) => {
  try {
    const startDate = req.query.start_date || new Date().toISOString().split('T')[0];
    const endDate = req.query.end_date || startDate;
    const userId = req.query.user_id || getLoggedInUsername();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const allCoursesMap = {};
    const dailyProgress = [];
    
    // Iterate through date range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const jsonlFile = path.join(DATA_DIR, `activity_${dateStr}_${userId}.jsonl`);
      
      try {
        const courses = await parseCoursesFromJSONL(jsonlFile);
        
        const totalHours = courses.reduce((sum, course) => sum + course.totalHours, 0);
        
        dailyProgress.push({
          date: dateStr,
          totalCourses: courses.length,
          totalHours,
          courses
        });
        
        // Aggregate courses across all dates
        for (const course of courses) {
          if (!allCoursesMap[course.courseName]) {
            allCoursesMap[course.courseName] = {
              ...course,
              totalHours: 0,
              sessions: []
            };
          }
          allCoursesMap[course.courseName].totalHours += course.totalHours;
          allCoursesMap[course.courseName].sessions.push(...course.sessions);
        }
      } catch (fileError) {
        // File doesn't exist for this date, skip
        continue;
      }
    }
    
    const allCourses = Object.values(allCoursesMap)
      .sort((a, b) => b.totalHours - a.totalHours);
    
    const totalHours = allCourses.reduce((sum, course) => sum + course.totalHours, 0);
    const totalCourses = allCourses.length;
    
    res.json({
      startDate,
      endDate,
      totalCourses,
      totalHours,
      allCourses,
      dailyProgress
    });
  } catch (error) {
    console.error('Error fetching learning progress range:', error);
    res.status(500).json({ error: 'Failed to fetch learning progress' });
  }
});

/**
 * Get learning statistics summary
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || getLoggedInUsername();
    const days = parseInt(req.query.days) || 7;
    
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const allCoursesMap = {};
    let totalDaysWithLearning = 0;
    let totalLearningHours = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const jsonlFile = path.join(DATA_DIR, `activity_${dateStr}_${userId}.jsonl`);
      
      try {
        const courses = await parseCoursesFromJSONL(jsonlFile);
        
        if (courses.length > 0) {
          totalDaysWithLearning++;
          
          for (const course of courses) {
            totalLearningHours += course.totalHours;
            
            if (!allCoursesMap[course.courseName]) {
              allCoursesMap[course.courseName] = {
                courseName: course.courseName,
                platform: course.platform,
                totalHours: 0,
                daysActive: 0
              };
            }
            allCoursesMap[course.courseName].totalHours += course.totalHours;
            allCoursesMap[course.courseName].daysActive++;
          }
        }
      } catch (fileError) {
        continue;
      }
    }
    
    const topCourses = Object.values(allCoursesMap)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);
    
    res.json({
      period: `Last ${days} days`,
      totalDaysWithLearning,
      totalLearningHours: Math.round(totalLearningHours * 100) / 100,
      avgHoursPerDay: totalDaysWithLearning > 0 ? Math.round((totalLearningHours / totalDaysWithLearning) * 100) / 100 : 0,
      uniqueCourses: Object.keys(allCoursesMap).length,
      topCourses
    });
  } catch (error) {
    console.error('Error calculating learning stats:', error);
    res.status(500).json({ error: 'Failed to calculate learning statistics' });
  }
});

module.exports = router;
