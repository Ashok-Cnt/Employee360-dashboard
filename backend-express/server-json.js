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

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
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
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(','),
  credentials: true
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
      aiSuggestions: '/api/ai-suggestions'
    }
  });
});

// Import route handlers
const userRoutes = require('./routes/users-json');
const appRoutes = require('./routes/applications-json');
const aiSuggestionsRoutes = require('./routes/ai-suggestions-json');
const activityLocalRoutes = require('./routes/activity-local'); // Use the JSONL reader router
const alertsRoutes = require('./routes/alerts');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/ai-suggestions', aiSuggestionsRoutes);
app.use('/api/activity', activityLocalRoutes);
app.use('/api/alerts', alertsRoutes);

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
