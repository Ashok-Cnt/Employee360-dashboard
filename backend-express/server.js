const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8001;

// MongoDB connection configuration
// Determine which database to use based on USE_LOCAL_DB flag
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';

let MONGODB_URI;
let DATABASE_NAME;

if (USE_LOCAL_DB) {
  MONGODB_URI = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/';
  DATABASE_NAME = process.env.LOCAL_DATABASE_NAME || 'employee360';
  console.log('🏠 Using LOCAL MongoDB connection');
} else {
  MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
  DATABASE_NAME = process.env.ATLAS_DATABASE_NAME || process.env.DATABASE_NAME || 'employee360';
  console.log('☁️  Using ATLAS MongoDB connection');
}

console.log(`📊 Database: ${DATABASE_NAME}`);
console.log(`🔗 Connection: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Hide password in logs

// MongoDB connection
let db;
const mongoClient = new MongoClient(MONGODB_URI);

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(','),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
async function connectToDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(DATABASE_NAME);
    console.log(`✅ Connected to MongoDB: ${DATABASE_NAME} (${USE_LOCAL_DB ? 'Local' : 'Atlas'})`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💡 Tip: Check your .env file and ensure USE_LOCAL_DB is set correctly');
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    database: db ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Employee360 Express API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      apps: '/api/apps',
      alerts: '/api/alerts'
    }
  });
});

// Import route handlers
const userRoutes = require('./routes/users');
const appRoutes = require('./routes/applications');
const aiSuggestionsRoutes = require('./routes/ai-suggestions');
const activityLocalRoutes = require('./routes/activity-local');
const alertsRoutes = require('./routes/alerts');
const categoriesRoutes = require('./routes/categories');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/ai-suggestions', aiSuggestionsRoutes);
app.use('/api/activity', activityLocalRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api', categoriesRoutes);

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
    await connectToDatabase();
    
    app.listen(PORT, '127.0.0.1', () => {
      const bootTime = Date.now() - startTime;
      console.log(`🚀 Employee360 Express server running on http://127.0.0.1:${PORT}`);
      console.log(`⚡ Server started in ${bootTime}ms`);
      console.log(`📊 Dashboard available at http://localhost:3000`);
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
  await mongoClient.close();
  process.exit(0);
});

// Make db available to routes
app.locals.db = () => db;

startServer().catch((error) => {
  console.error('❌ Unhandled error during startup:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

module.exports = app;