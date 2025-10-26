const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Get data directory
const UDEMY_DATA_DIR = path.join(__dirname, '../data/udemy_activity');

/**
 * Get the current logged-in username
 */
function getLoggedInUsername() {
  return process.env.USER_ID || os.userInfo().username.toUpperCase() || 'Admin';
}

/**
 * Parse all JSONL entries from a file and merge course data
 */
async function parseUdemyJSONL(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const lines = data.trim().split('\n').filter(l => l.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    // Map to store courses by ID with progressive data merging
    const coursesMap = new Map();
    
    // Process each JSON entry (they are incremental updates)
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        
        if (!entry.course || !entry.course.id) continue;
        
        const courseId = entry.course.id;
        const courseName = entry.course.name;
        const courseUrl = entry.course.url;
        
        // Get or create course entry
        if (!coursesMap.has(courseId)) {
          coursesMap.set(courseId, {
            courseId,
            courseName,
            courseUrl,
            platform: 'Udemy',
            timestamp: entry.timestamp,
            sections: new Map(),
            stats: {
              totalSections: 0,
              totalLessons: 0,
              completedLessons: 0,
              percentComplete: 0
            },
            metadata: entry.course.metadata || {},
            alternateNames: new Set() // Track all course name variations
          });
        }
        
        const course = coursesMap.get(courseId);
        
        // Track all course name variations
        if (courseName && courseName !== course.courseName) {
          course.alternateNames.add(courseName);
          
          // Prefer shorter, more concise names (likely the actual title)
          // Avoid names that start with action words or are too long
          const currentLength = course.courseName.length;
          const newLength = courseName.length;
          
          // Rules for better course name selection:
          // 1. Names with exclamation marks are likely promotional
          // 2. Names starting with action words ("Go From", "Learn", "Master") are promotional
          // 3. Prefer shorter names without promotional indicators
          // 4. "The Complete Guide to..." is a valid title format (not promotional)
          const isCurrentPromotional = (
            course.courseName.includes('!') || 
            /^(Go From|Learn (?!The)|Master (?!The))/i.test(course.courseName)
          );
          const isNewPromotional = (
            courseName.includes('!') || 
            /^(Go From|Learn (?!The)|Master (?!The))/i.test(courseName)
          );
          const isNewBetter = (!isNewPromotional && isCurrentPromotional) || 
                             (newLength < currentLength && !courseName.includes('!') && !isNewPromotional);
          
          if (isNewBetter) {
            course.courseName = courseName;
          }
        }
        
        // Update timestamp to latest
        if (new Date(entry.timestamp) > new Date(course.timestamp)) {
          course.timestamp = entry.timestamp;
        }
        
        // Merge sections data (each entry may have different sections expanded)
        if (entry.sections && Array.isArray(entry.sections)) {
          for (const section of entry.sections) {
            const sectionKey = `${section.sectionIndex}_${section.sectionTitle}`;
            
            if (!course.sections.has(sectionKey)) {
              course.sections.set(sectionKey, {
                sectionIndex: section.sectionIndex,
                sectionTitle: section.sectionTitle,
                totalLessons: section.totalLessons || 0,
                completedLessons: section.completedLessons || 0,
                isExpanded: section.isExpanded || false,
                lessons: []
              });
            }
            
            const existingSection = course.sections.get(sectionKey);
            
            // Update section with more complete data
            if (section.totalLessons > existingSection.totalLessons) {
              existingSection.totalLessons = section.totalLessons;
            }
            if (section.completedLessons > existingSection.completedLessons) {
              existingSection.completedLessons = section.completedLessons;
            }
            
            // Merge lessons (later entries may have more lesson details)
            if (section.lessons && section.lessons.length > 0) {
              const lessonsMap = new Map(
                existingSection.lessons.map(l => [`${l.lessonIndex}_${l.lessonTitle}`, l])
              );
              
              for (const lesson of section.lessons) {
                const lessonKey = `${lesson.lessonIndex}_${lesson.lessonTitle}`;
                if (!lessonsMap.has(lessonKey)) {
                  lessonsMap.set(lessonKey, {
                    lessonIndex: lesson.lessonIndex,
                    lessonTitle: lesson.lessonTitle,
                    isCompleted: lesson.isCompleted || false
                  });
                } else {
                  // Update completion status if it changed
                  const existing = lessonsMap.get(lessonKey);
                  if (lesson.isCompleted && !existing.isCompleted) {
                    existing.isCompleted = true;
                  }
                }
              }
              
              existingSection.lessons = Array.from(lessonsMap.values())
                .sort((a, b) => a.lessonIndex - b.lessonIndex);
            }
          }
        }
        
        // Update stats from entry if available
        if (entry.stats) {
          if (entry.stats.totalSections > course.stats.totalSections) {
            course.stats.totalSections = entry.stats.totalSections;
          }
          if (entry.stats.totalLessons > course.stats.totalLessons) {
            course.stats.totalLessons = entry.stats.totalLessons;
          }
          if (entry.stats.completedLessons > course.stats.completedLessons) {
            course.stats.completedLessons = entry.stats.completedLessons;
          }
        }
      } catch (parseError) {
        console.error('Error parsing JSONL line:', parseError);
        continue;
      }
    }
    
    // Convert Map to Array and calculate final stats
    const courses = Array.from(coursesMap.values()).map(course => {
      const sectionsArray = Array.from(course.sections.values())
        .sort((a, b) => a.sectionIndex - b.sectionIndex);
      
      // Recalculate stats from sections
      let totalLessons = 0;
      let completedLessons = 0;
      
      for (const section of sectionsArray) {
        totalLessons += section.totalLessons;
        completedLessons += section.completedLessons;
      }
      
      // Update stats if section data is more complete
      if (totalLessons > course.stats.totalLessons) {
        course.stats.totalLessons = totalLessons;
      }
      if (completedLessons > course.stats.completedLessons) {
        course.stats.completedLessons = completedLessons;
      }
      
      // Calculate percentage
      course.stats.percentComplete = course.stats.totalLessons > 0
        ? Math.round((course.stats.completedLessons / course.stats.totalLessons) * 100)
        : 0;
      
      // Convert alternateNames Set to Array for JSON serialization
      const alternateNames = Array.from(course.alternateNames || []);
      
      return {
        ...course,
        alternateNames: alternateNames.length > 0 ? alternateNames : undefined,
        sections: sectionsArray
      };
    });
    
    return courses;
  } catch (error) {
    console.error('Error parsing Udemy JSONL:', error);
    return [];
  }
}

/**
 * Get all Udemy JSONL files for a user
 */
async function getUdemyFiles(userId) {
  try {
    const files = await fs.readdir(UDEMY_DATA_DIR);
    return files
      .filter(f => f.startsWith('udemy_enhanced_') && f.endsWith(`_${userId}.jsonl`))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error reading Udemy directory:', error);
    return [];
  }
}

/**
 * Extract date from filename
 */
function extractDateFromFilename(filename) {
  const match = filename.match(/udemy_enhanced_(\d{4}-\d{2}-\d{2})_/);
  return match ? match[1] : null;
}

/**
 * GET /api/udemy-courses/today
 * Get today's courses with complete details
 */
router.get('/today', async (req, res) => {
  try {
    const userId = req.query.user_id || getLoggedInUsername();
    const today = new Date().toISOString().split('T')[0];
    const filename = `udemy_enhanced_${today}_${userId}.jsonl`;
    const filePath = path.join(UDEMY_DATA_DIR, filename);
    
    try {
      await fs.access(filePath);
      const courses = await parseUdemyJSONL(filePath);
      
      res.json({
        success: true,
        date: today,
        totalCourses: courses.length,
        courses
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.json({
          success: true,
          date: today,
          totalCourses: 0,
          courses: [],
          message: 'No Udemy activity recorded for today'
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error fetching today\'s Udemy courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Udemy courses' 
    });
  }
});

/**
 * GET /api/udemy-courses/date/:date
 * Get courses for a specific date
 */
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.query.user_id || getLoggedInUsername();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
    const filename = `udemy_enhanced_${date}_${userId}.jsonl`;
    const filePath = path.join(UDEMY_DATA_DIR, filename);
    
    try {
      await fs.access(filePath);
      const courses = await parseUdemyJSONL(filePath);
      
      res.json({
        success: true,
        date,
        totalCourses: courses.length,
        courses
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.json({
          success: true,
          date,
          totalCourses: 0,
          courses: [],
          message: 'No Udemy activity recorded for this date'
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error fetching Udemy courses for date:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Udemy courses' 
    });
  }
});

/**
 * GET /api/udemy-courses/all
 * Get all courses across all dates
 */
router.get('/all', async (req, res) => {
  try {
    const userId = req.query.user_id || getLoggedInUsername();
    const days = parseInt(req.query.days) || 30; // Default last 30 days
    
    const files = await getUdemyFiles(userId);
    
    // Filter files by date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const filteredFiles = files.filter(filename => {
      const fileDate = extractDateFromFilename(filename);
      if (!fileDate) return false;
      const date = new Date(fileDate);
      return date >= startDate && date <= endDate;
    });
    
    // Aggregate courses across all files
    const allCoursesMap = new Map();
    const dailyData = [];
    
    for (const filename of filteredFiles) {
      const filePath = path.join(UDEMY_DATA_DIR, filename);
      const date = extractDateFromFilename(filename);
      const courses = await parseUdemyJSONL(filePath);
      
      dailyData.push({
        date,
        totalCourses: courses.length,
        courses: courses.map(c => ({
          courseId: c.courseId,
          courseName: c.courseName,
          percentComplete: c.stats.percentComplete,
          completedLessons: c.stats.completedLessons,
          totalLessons: c.stats.totalLessons
        }))
      });
      
      // Merge into all courses (take most recent/complete data)
      for (const course of courses) {
        if (!allCoursesMap.has(course.courseId)) {
          allCoursesMap.set(course.courseId, course);
        } else {
          const existing = allCoursesMap.get(course.courseId);
          // Keep the one with more progress
          if (course.stats.completedLessons > existing.stats.completedLessons) {
            allCoursesMap.set(course.courseId, course);
          }
        }
      }
    }
    
    const allCourses = Array.from(allCoursesMap.values())
      .sort((a, b) => b.stats.percentComplete - a.stats.percentComplete);
    
    res.json({
      success: true,
      period: `Last ${days} days`,
      totalCourses: allCourses.length,
      courses: allCourses,
      dailyData: dailyData.sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (error) {
    console.error('Error fetching all Udemy courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch all Udemy courses' 
    });
  }
});

/**
 * GET /api/udemy-courses/course/:courseId
 * Get detailed information about a specific course
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.query.user_id || getLoggedInUsername();
    const days = parseInt(req.query.days) || 30;
    
    const files = await getUdemyFiles(userId);
    
    // Filter files by date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const filteredFiles = files.filter(filename => {
      const fileDate = extractDateFromFilename(filename);
      if (!fileDate) return false;
      const date = new Date(fileDate);
      return date >= startDate && date <= endDate;
    });
    
    // Find the course and get its most complete data
    let mostCompleteCourse = null;
    const progressHistory = [];
    
    for (const filename of filteredFiles) {
      const filePath = path.join(UDEMY_DATA_DIR, filename);
      const date = extractDateFromFilename(filename);
      const courses = await parseUdemyJSONL(filePath);
      
      const course = courses.find(c => c.courseId === courseId);
      if (course) {
        progressHistory.push({
          date,
          completedLessons: course.stats.completedLessons,
          totalLessons: course.stats.totalLessons,
          percentComplete: course.stats.percentComplete
        });
        
        // Keep the most complete version
        if (!mostCompleteCourse || 
            course.stats.completedLessons > mostCompleteCourse.stats.completedLessons) {
          mostCompleteCourse = course;
        }
      }
    }
    
    if (!mostCompleteCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      course: mostCompleteCourse,
      progressHistory: progressHistory.sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    console.error('Error fetching specific course:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch course details' 
    });
  }
});

/**
 * GET /api/udemy-courses/stats
 * Get learning statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || getLoggedInUsername();
    const days = parseInt(req.query.days) || 7;
    
    const files = await getUdemyFiles(userId);
    
    // Filter files by date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const filteredFiles = files.filter(filename => {
      const fileDate = extractDateFromFilename(filename);
      if (!fileDate) return false;
      const date = new Date(fileDate);
      return date >= startDate && date <= endDate;
    });
    
    const coursesMap = new Map();
    let totalDaysWithLearning = 0;
    
    for (const filename of filteredFiles) {
      const filePath = path.join(UDEMY_DATA_DIR, filename);
      const courses = await parseUdemyJSONL(filePath);
      
      if (courses.length > 0) {
        totalDaysWithLearning++;
      }
      
      for (const course of courses) {
        if (!coursesMap.has(course.courseId)) {
          coursesMap.set(course.courseId, {
            courseId: course.courseId,
            courseName: course.courseName,
            platform: course.platform,
            maxProgress: course.stats.percentComplete,
            daysActive: 0
          });
        }
        coursesMap.get(course.courseId).daysActive++;
        
        // Keep track of max progress
        const existing = coursesMap.get(course.courseId);
        if (course.stats.percentComplete > existing.maxProgress) {
          existing.maxProgress = course.stats.percentComplete;
        }
      }
    }
    
    const topCourses = Array.from(coursesMap.values())
      .sort((a, b) => b.daysActive - a.daysActive || b.maxProgress - a.maxProgress)
      .slice(0, 5);
    
    // Count courses with 100% completion
    const completedCourses = Array.from(coursesMap.values())
      .filter(course => course.maxProgress === 100)
      .length;
    
    res.json({
      success: true,
      period: `Last ${days} days`,
      stats: {
        period: `Last ${days} days`,
        days: days,
        totalCourses: coursesMap.size,
        totalDaysWithLearning,
        completedCourses: completedCourses,
        avgCoursesPerDay: totalDaysWithLearning > 0 
          ? Math.round((coursesMap.size / totalDaysWithLearning) * 10) / 10 
          : 0,
        topCourses
      }
    });
  } catch (error) {
    console.error('Error calculating Udemy stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate statistics' 
    });
  }
});

module.exports = router;
