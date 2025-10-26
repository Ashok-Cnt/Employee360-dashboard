// Udemy Progress Tracker - Express.js Server
// Replaces Python Flask collector

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create data directory if it doesn't exist
const ACTIVITY_DATA_DIR = path.join(__dirname, 'activity_data');
if (!fs.existsSync(ACTIVITY_DATA_DIR)) {
  fs.mkdirSync(ACTIVITY_DATA_DIR, { recursive: true });
  console.log(`✅ Created directory: ${ACTIVITY_DATA_DIR}`);
}

// Get current username
const USERNAME = os.userInfo().username.toUpperCase();

// Get today's filename
function getTodayFilename() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `udemy_enhanced_${today}_${USERNAME}.jsonl`;
}

// Format log timestamp
function getLogTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${getLogTimestamp()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/udemy-tracker/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Udemy Progress Tracker - Express Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dataDirectory: ACTIVITY_DATA_DIR
  });
});

// Main tracking endpoint
app.post('/api/udemy-tracker', (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data || !data.courseId || !data.courseName) {
      console.log(`❌ Invalid data received - missing required fields`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: courseId, courseName'
      });
    }

    // Log received data summary
    const stats = data.stats || {};
    console.log(`✅ Received Udemy data: ${data.courseName} - ${stats.totalSections || 0} sections, ${stats.totalLessons || 0} lessons, ${stats.completedLessons || 0} completed`);

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
    const filename = getTodayFilename();
    const filepath = path.join(ACTIVITY_DATA_DIR, filename);
    const jsonLine = JSON.stringify(enhancedData) + '\n';

    fs.appendFileSync(filepath, jsonLine, 'utf8');
    console.log(`💾 Data saved to: ${filename}`);

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
    console.error(`❌ Error processing request:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get statistics endpoint
app.get('/api/udemy-tracker/stats', (req, res) => {
  try {
    const filename = getTodayFilename();
    const filepath = path.join(ACTIVITY_DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.json({
        entries: 0,
        courses: [],
        file: filename,
        message: 'No data captured today'
      });
    }

    // Read JSONL file
    const fileContent = fs.readFileSync(filepath, 'utf8');
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
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all data files
app.get('/api/udemy-tracker/files', (req, res) => {
  try {
    const files = fs.readdirSync(ACTIVITY_DATA_DIR)
      .filter(file => file.endsWith('.jsonl'))
      .map(file => {
        const filepath = path.join(ACTIVITY_DATA_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.modified - a.modified);

    res.json({
      count: files.length,
      files: files,
      directory: ACTIVITY_DATA_DIR
    });

  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific file data
app.get('/api/udemy-tracker/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(ACTIVITY_DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileContent = fs.readFileSync(filepath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(line => line.trim());
    const entries = lines.map(line => JSON.parse(line));

    res.json({
      filename: filename,
      entries: entries.length,
      data: entries
    });

  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/udemy-tracker/health',
      'POST /api/udemy-tracker',
      'GET /api/udemy-tracker/stats',
      'GET /api/udemy-tracker/files',
      'GET /api/udemy-tracker/file/:filename'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎓 Udemy Progress Tracker - Express Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${ACTIVITY_DATA_DIR}`);
  console.log(`👤 Username: ${USERNAME}`);
  console.log(`📝 Today's file: ${getTodayFilename()}`);
  console.log('\n📊 Available endpoints:');
  console.log(`   Health Check: http://localhost:${PORT}/api/udemy-tracker/health`);
  console.log(`   Track Data:   POST http://localhost:${PORT}/api/udemy-tracker`);
  console.log(`   Statistics:   http://localhost:${PORT}/api/udemy-tracker/stats`);
  console.log(`   List Files:   http://localhost:${PORT}/api/udemy-tracker/files`);
  console.log('\n🔄 Waiting for data from browser extension...\n');
  console.log('Press Ctrl+C to stop the server');
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down server gracefully...');
  process.exit(0);
});
