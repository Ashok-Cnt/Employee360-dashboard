const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8001;

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

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
    db = mongoClient.db(process.env.DATABASE_NAME);
    console.log(`Connected to MongoDB: ${process.env.DATABASE_NAME}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
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
      apps: '/api/apps'
    }
  });
});

// Import route handlers
const userRoutes = require('./routes/users');
const appRoutes = require('./routes/applications');
const aiSuggestionsRoutes = require('./routes/ai-suggestions');
const activityLocalRoutes = require('./routes/activity-local');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/ai-suggestions', aiSuggestionsRoutes);
app.use('/api/activity', activityLocalRoutes);

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
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoClient.close();
  process.exit(0);
});

// Make db available to routes
app.locals.db = () => db;

startServer().catch(console.error);

module.exports = app;