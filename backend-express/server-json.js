const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8001;

// Data directory configuration
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'application_activity.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'ai_suggestions.json');
const UDEMY_DATA_DIR = path.join(DATA_DIR, 'udemy_activity');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UDEMY_DATA_DIR, { recursive: true });
    console.log('📁 Data directory ready');
    
    // Initialize empty JSON files if they don't exist
    const files = [
      { path: USERS_FILE, data: [] },
      { path: ACTIVITY_FILE, data: [] },
      { path: SUGGESTIONS_FILE, data: [] }
    ];
    
    for (const file of files) {
      try {
        await fs.access(file.path);
      } catch {
        await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
        console.log(`📄 Created ${path.basename(file.path)}`);
      }
    }
  } catch (error) {
    console.error('❌ Error setting up data directory:', error);
  }
}

// Helper function to read JSON file
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Helper function to write JSON file
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Make file operations available to routes
app.locals.dataDir = DATA_DIR;
app.locals.readJSONFile = readJSONFile;
app.locals.writeJSONFile = writeJSONFile;
app.locals.files = {
  users: USERS_FILE,
  activity: ACTIVITY_FILE,
  suggestions: SUGGESTIONS_FILE
};

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration - allow Udemy domains and local origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8001',
      'http://127.0.0.1:8001'
    ];
    
    // Also allow all Udemy domains
    if (origin.includes('udemy.com')) {
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Check environment variable for additional origins
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins && envOrigins.split(',').indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    return callback(null, true); // Allow all for development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    storage: 'JSON files',
    dataDirectory: DATA_DIR
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Employee360 Express API is running',
    version: '2.0.0',
    storage: 'Local JSON Files',
    endpoints: {
      health: '/health',
      users: '/api/users',
      apps: '/api/apps',
      alerts: '/api/alerts',
      activity: '/api/activity',
      aiSuggestions: '/api/ai-suggestions',
      healthMetrics: '/api/health',
      learningProgress: '/api/learning-progress',
      udemyTracker: {
        health: '/api/udemy-tracker/health',
        track: 'POST /api/udemy-tracker',
        stats: '/api/udemy-tracker/stats',
        files: '/api/udemy-tracker/files',
        fileData: '/api/udemy-tracker/file/:filename'
      },
       goals: '/api/goals' // New goals endpoint
    }
  });
});

// Import route handlers
const userRoutes = require('./routes/users-json');
const appRoutes = require('./routes/applications-json');
const aiSuggestionsRoutes = require('./routes/ai-suggestions-json');
const activityLocalRoutes = require('./routes/activity-local'); // Use the JSONL reader router
const alertsRoutes = require('./routes/alerts');
const notificationsRoutes = require('./routes/notifications');
const healthMetricsRoutes = require('./routes/health-metrics-v2'); // Enhanced version with backend logic
const localStorageRoutes = require('./routes/local-storage');
const learningProgressRoutes = require('./routes/learning-progress');
const categoriesRoutes = require('./routes/categories');
const holidaysRoutes = require('./routes/holidays');
const udemyCoursesRoutes = require('./routes/udemy-courses'); // New Udemy course details
const goalsRoutes = require('./routes/goals'); // New goals route
const userPreferencesRoutes = require('./routes/user-preferences'); // User preferences (display name, reminders)

// ========================================
// Udemy Tracker Extension Endpoints
// ========================================
const os = require('os');

// Get current username
const USERNAME = os.userInfo().username.toUpperCase();

// Get today's filename for Udemy tracker
function getUdemyTodayFilename() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `udemy_enhanced_${today}_${USERNAME}.jsonl`;
}

// Format log timestamp
function getLogTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Udemy Tracker: Health check endpoint
app.get('/api/udemy-tracker/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Udemy Progress Tracker - Integrated with Employee360',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dataDirectory: UDEMY_DATA_DIR
  });
});

// Udemy Tracker: Main tracking endpoint
app.post('/api/udemy-tracker', async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data || !data.courseId || !data.courseName) {
      console.log(`❌ [${getLogTimestamp()}] Invalid Udemy data received - missing required fields`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: courseId, courseName'
      });
    }

    // Log received data summary
    const stats = data.stats || {};
    console.log(`✅ [${getLogTimestamp()}] Udemy: ${data.courseName} - ${stats.totalSections || 0} sections, ${stats.totalLessons || 0} lessons, ${stats.completedLessons || 0} completed`);

    // Prepare enhanced data structure
    const enhancedData = {
      timestamp: data.timestamp || new Date().toISOString(),
      type: 'udemy_extension',
      course: {
        id: data.courseId,
        name: data.courseName,
        url: data.url || data.metadata?.pageUrl || '',
        progress: data.progress || {
          percentComplete: null,
          completedLectures: null,
          totalLectures: null,
          rawText: null
        },
        metadata: {
          instructor: data.metadata?.instructor || null,
          rating: data.metadata?.rating || null,
          lastUpdated: data.metadata?.lastUpdated || new Date().toISOString(),
          userAgent: data.metadata?.userAgent || req.headers['user-agent'],
          pageUrl: data.metadata?.pageUrl || data.url || ''
        }
      },
      sections: data.sections || [],
      currentLesson: data.currentLesson || null,
      stats: {
        totalSections: stats.totalSections || 0,
        totalLessons: stats.totalLessons || 0,
        completedLessons: stats.completedLessons || 0
      },
      captureMethod: 'browser_extension'
    };

    // Write to JSONL file (one JSON object per line)
    const filename = getUdemyTodayFilename();
    const filepath = path.join(UDEMY_DATA_DIR, filename);
    const jsonLine = JSON.stringify(enhancedData) + '\n';

    await fs.appendFile(filepath, jsonLine, 'utf8');
    console.log(`💾 [${getLogTimestamp()}] Udemy data saved to: ${filename}`);

    // Return success response
    res.json({
      success: true,
      message: 'Data received and saved successfully',
      course: data.courseName,
      stats: enhancedData.stats,
      filename: filename,
      timestamp: enhancedData.timestamp
    });

  } catch (error) {
    console.error(`❌ [${getLogTimestamp()}] Error processing Udemy request:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Udemy Tracker: Get statistics endpoint
app.get('/api/udemy-tracker/stats', async (req, res) => {
  try {
    const filename = getUdemyTodayFilename();
    const filepath = path.join(UDEMY_DATA_DIR, filename);

    try {
      await fs.access(filepath);
    } catch {
      return res.json({
        entries: 0,
        courses: [],
        file: filename,
        message: 'No data captured today'
      });
    }

    // Read JSONL file
    const fileContent = await fs.readFile(filepath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(line => line.trim());
    const entries = lines.map(line => JSON.parse(line));

    // Aggregate by course
    const courseMap = new Map();
    entries.forEach(entry => {
      const courseId = entry.course?.id;
      if (courseId) {
        courseMap.set(courseId, {
          id: courseId,
          name: entry.course?.name,
          lastUpdate: entry.timestamp,
          stats: entry.stats,
          url: entry.course?.url
        });
      }
    });

    res.json({
      entries: entries.length,
      courses: Array.from(courseMap.values()),
      file: filename,
      lastEntry: entries[entries.length - 1]?.timestamp
    });

  } catch (error) {
    console.error(`❌ [${getLogTimestamp()}] Error getting Udemy stats:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Udemy Tracker: List all data files
app.get('/api/udemy-tracker/files', async (req, res) => {
  try {
    const dirFiles = await fs.readdir(UDEMY_DATA_DIR);
    const files = await Promise.all(
      dirFiles
        .filter(file => file.endsWith('.jsonl'))
        .map(async (file) => {
          const filepath = path.join(UDEMY_DATA_DIR, file);
          const stats = await fs.stat(filepath);
          return {
            filename: file,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
          };
        })
    );

    files.sort((a, b) => b.modified - a.modified);

    res.json({
      count: files.length,
      files: files,
      directory: UDEMY_DATA_DIR
    });

  } catch (error) {
    console.error(`❌ [${getLogTimestamp()}] Error listing Udemy files:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Udemy Tracker: Get specific file data
app.get('/api/udemy-tracker/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(UDEMY_DATA_DIR, filename);

    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileContent = await fs.readFile(filepath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(line => line.trim());
    const entries = lines.map(line => JSON.parse(line));

    res.json({
      filename: filename,
      entries: entries.length,
      data: entries
    });

  } catch (error) {
    console.error(`❌ [${getLogTimestamp()}] Error reading Udemy file:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// End of Udemy Tracker Endpoints
// ========================================


// Routes
app.use('/api/users', userRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/ai-suggestions', aiSuggestionsRoutes);
app.use('/api/activity', activityLocalRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/health', healthMetricsRoutes);
app.use('/api/local-storage', localStorageRoutes);
app.use('/api/learning-progress', learningProgressRoutes);
app.use('/api/udemy-courses', udemyCoursesRoutes); // New Udemy course details
app.use('/api/goals', goalsRoutes); 
app.use('/api', categoriesRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/preferences', userPreferencesRoutes); // User preferences API

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    const startTime = Date.now();
    await ensureDataDirectory();
    
    app.listen(PORT, '127.0.0.1', () => {
      const bootTime = Date.now() - startTime;
      console.log(`🚀 Employee360 Express server running on http://127.0.0.1:${PORT}`);
      console.log(`⚡ Server started in ${bootTime}ms`);
      console.log(`📊 Dashboard available at http://localhost:3000`);
      console.log(`💾 Storage: Local JSON Files in ${DATA_DIR}`);
      console.log(`🎓 Udemy Tracker: Data stored in ${UDEMY_DATA_DIR}`);
      console.log(`🔍 API docs available at http://127.0.0.1:${PORT}/health`);
      console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

startServer().catch((error) => {
  console.error('❌ Unhandled error during startup:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

module.exports = app;
