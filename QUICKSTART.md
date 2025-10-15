# Quick Start Guide - Express.js Architecture

Get your Employee360 up and running in minutes with the new Express.js + Python architecture!

## Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18+) - [Download here](https://nodejs.org/)
- **Python** (3.8+) - [Download here](https://python.org/)
- **MongoDB** - [Local install](https://mongodb.com/try/download/community) or [MongoDB Atlas](https://mongodb.com/cloud/atlas)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Setup (5 minutes)

**⭐ REMINDER: After setup, use the .bat files to start all services easily!**

### 1. Clone and Setup Project
```bash
# Clone the repository
git clone <your-repo-url>
cd Employee360-dashboard

# Or if you created it locally, navigate to the folder
cd Employee360-dashboard
```

### 2. Setup Express.js Backend (2 minutes)
```bash
# Navigate to Express backend
cd backend-express

# Install dependencies
npm install

# Setup environment
# .env file should contain:
# PORT=8001
# MONGODB_URI=mongodb://localhost:27017
# DATABASE_NAME=employee360
# ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
# NODE_ENV=development
```

### 3. Setup Python Data Collector (2 minutes)
```bash
# Navigate to data collector (in a new terminal)
cd data-collector

# Install Python dependencies
pip install motor pymongo psutil python-dotenv schedule requests

# Setup environment
# .env file should contain:
# MONGODB_URI=mongodb://localhost:27017
# DATABASE_NAME=employee360
# COLLECTION_INTERVAL_SECONDS=30
# USER_ID=john_doe
# LOG_LEVEL=INFO
```

### 4. Setup Frontend (2 minutes)
```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install
```

### 5. Setup Database (1 minute)
```bash
# Start MongoDB (if using local installation)
mongod

# Optional: Initialize with sample data
cd Employee360-dashboard
python add_realistic_app_data.py
```

### 6. Start the Application (3 Services) - Use Batch Files! 🚀

**IMPORTANT: Use the provided batch files for easy startup:**

```bash
# Method 1: Use Batch Files (RECOMMENDED)
# Simply double-click or run these batch files:
start-express-backend.bat     # Starts Express.js Backend on port 8001
start-data-collector.bat      # Starts Python Data Collector
start-frontend.bat           # Starts React Frontend on port 3000
```

**Alternative Manual Method:**
```bash
# Terminal 1: Start Express.js Backend
cd backend-express
npm start
# Backend API runs on http://127.0.0.1:8001

# Terminal 2: Start Python Data Collector
cd data-collector
python collector.py
# Data collector runs in background, collecting real app activity

# Terminal 3: Start React Frontend
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

**💡 Pro Tip: The batch files handle all the directory navigation and commands automatically!**

## 🎯 Architecture Overview

### New Express.js + Python Architecture
- **Express.js Backend** (Port 8001): Fast API reads and database queries
- **Python Data Collector**: Background service for real-time application monitoring
- **React Frontend** (Port 3000): User interface with proxy to Express API
- **MongoDB**: Centralized data storage for all services

### API Endpoints (Express.js)
- `GET /health` - Health check
- `GET /api/apps/current` - Current running applications
- `GET /api/apps/summary?period={today|week|month}` - Usage summary
- `GET /api/apps/stats` - Application statistics
- `GET /api/apps/top-memory-usage?limit=10` - Top memory consumers
- `GET /api/apps/focused-window` - Currently focused application
- `GET /api/apps/timeline?hours=24` - Application activity timeline

## 📊 What You'll See

### Dashboard Features
- **Current Applications**: Real-time view of running applications
- **Usage Summary**: Daily, weekly, and monthly application usage
- **Memory Usage**: Top memory-consuming applications
- **Productivity Metrics**: Focus time and activity patterns
- **Application Statistics**: Comprehensive usage analytics

### Real-time Data Collection
- Python collector tracks actual Windows applications
- Monitors focused windows using Windows APIs
- Records memory and CPU usage per application
- Automatic data cleanup (keeps 30 days)

## 🔧 Configuration Options

### Express.js Backend Configuration (.env)
```bash
# Server Configuration
PORT=8001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=employee360

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Python Data Collector Configuration (.env)
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=employee360

# Data Collection Configuration
COLLECTION_INTERVAL_SECONDS=30
USER_ID=john_doe

# Logging Configuration
LOG_LEVEL=INFO
```

### Frontend Configuration
```bash
# Proxy is configured in package.json
"proxy": "http://localhost:8001"

# Create frontend/.env for custom settings
REACT_APP_ENV=development
```

## 🎮 Demo Mode

Want to see the dashboard in action immediately?

1. Start all three services (Express, Python collector, React)
2. Let the Python collector run for a few minutes to gather real data
3. Navigate to Application Activity page to see live monitoring
4. The system tracks actual Windows applications in real-time

## 🔧 Batch Files for Easy Startup ⭐ RECOMMENDED

**Use these batch files for quick and easy startup:**

```bash
# RECOMMENDED: Use these batch files instead of manual commands
start-express-backend.bat    # Starts Express.js backend (port 8001)
start-data-collector.bat     # Starts Python data collector 
start-frontend.bat           # Starts React frontend (port 3000)
```

**How to use:**
1. **Double-click** each .bat file in Windows Explorer, OR
2. **Run from command prompt:** `start-express-backend.bat`
3. **Each service starts in its own terminal window**

**Benefits of using batch files:**
- ✅ No need to navigate directories manually
- ✅ Automatic error handling and setup
- ✅ Consistent startup process every time
- ✅ Each service runs in its own terminal window

## � Data Collection Features

### Real-time Monitoring
- Tracks currently focused Windows applications
- Records memory and CPU usage per application
- Monitors window titles and application activity
- Uses Windows APIs for accurate window detection

### Data Storage
- All data stored in MongoDB
- Automatic cleanup of old data (30+ days)
- Structured collections for efficient querying
- Real-time aggregation for dashboard metrics

### Privacy & Security
- Only tracks application names and window titles
- No content or sensitive data is recorded
- Data stays on your local system
- Configurable collection intervals

## 🐛 Troubleshooting

### Express Backend Won't Start
```bash
# Check Node.js version
node --version

# Reinstall dependencies
cd backend-express
npm install

# Check if port 8001 is available
netstat -an | findstr ":8001"
```

### Python Data Collector Issues
```bash
# Check Python version
python --version

# Install missing dependencies
pip install motor pymongo psutil python-dotenv schedule requests

# Check MongoDB connection
python -c "import pymongo; print(pymongo.MongoClient('mongodb://localhost:27017').admin.command('ping'))"
```

### Frontend Won't Start
```bash
# Clear node modules
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version

# Verify proxy configuration in package.json
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
mongosh --eval "db.runCommand('ping')"

# Start MongoDB service
net start MongoDB

# Check MongoDB logs
# Windows: C:\Program Files\MongoDB\Server\7.0\log\mongod.log
```

## 🚀 Production Deployment

### Express.js Backend
```bash
# Build for production
cd backend-express
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name employee360-api
```

### Python Data Collector
```bash
# Run as Windows service or use task scheduler
cd data-collector
python collector.py

# Or use nssm to create Windows service
nssm install Employee360Collector python collector.py
```

### React Frontend
```bash
# Build for production
cd frontend
npm run build

# Deploy to static hosting (Netlify, Vercel, etc.)
# Or serve with nginx/Apache
```

### Database (MongoDB Atlas)
- Create free cluster at mongodb.com
- Update MONGODB_URI in all .env files
- Configure network access and authentication

## 📈 Next Steps

### Enhance Your Setup
1. **Customize Data Collection**: Adjust collection intervals and monitored applications
2. **Add More Metrics**: Extend Python collector to track additional system metrics
3. **Create Reports**: Build custom analytics and reporting features
4. **Integration**: Connect with other productivity tools and APIs

### Advanced Features
1. **AI Insights**: Add intelligent recommendations based on usage patterns
2. **Team Dashboard**: Share productivity insights across teams
3. **Mobile Companion**: Build React Native mobile app
4. **Real-time Alerts**: Set up notifications for productivity goals

## 💡 Tips for Best Results

### Data Collection Optimization
- Let the Python collector run continuously for best results
- Review application categorization and adjust as needed
- Monitor system resources to ensure smooth operation
- Regular database maintenance for optimal performance

### Dashboard Usage
- Use different time ranges to identify patterns
- Focus on memory usage trends to optimize system performance
- Track focused window patterns to understand work habits
- Export data for deeper analysis if needed

## 🤝 Getting Help

### Documentation
- [Express Backend Guide](backend-express/README.md)
- [Data Collector Guide](data-collector/README.md)
- [Frontend Guide](frontend/README.md)
- [Migration Success Notes](EXPRESS_MIGRATION_SUCCESS.md)

### Community
- GitHub Issues for bugs and feature requests
- Discussions for questions and improvements
- Pull requests welcome for enhancements

### Support
- Check logs in each service for error details
- Include system info and steps to reproduce in bug reports
- Test with fresh data if experiencing issues

## 🌟 Success Metrics

After setup, you should see:
- ✅ Express API responding at http://127.0.0.1:8001/health
- ✅ Python collector gathering real application data
- ✅ React dashboard displaying live activity at http://localhost:3000
- ✅ MongoDB collections populated with activity data
- ✅ Real-time updates every 30 seconds (configurable)

## 🎉 You're Ready!

Your Employee360 with Express.js architecture is now running! The system will automatically:

- **Track** your actual Windows application usage
- **Monitor** memory and CPU consumption
- **Record** focused window activity
- **Display** real-time productivity metrics

Visit http://localhost:3000 and navigate to "Application Activity" to see your live productivity analytics!

### Test Your Setup

**🚀 Quick Start Method (RECOMMENDED):**
1. **Run batch files**: Double-click `start-express-backend.bat`, `start-data-collector.bat`, and `start-frontend.bat`
2. **API Test**: Visit http://127.0.0.1:8001/health
3. **Current Apps**: Check http://127.0.0.1:8001/api/apps/current
4. **Dashboard**: Open http://localhost:3000
5. **Live Data**: Switch between applications and see real-time updates

**Manual Verification:**
1. **API Test**: Visit http://127.0.0.1:8001/health
2. **Current Apps**: Check http://127.0.0.1:8001/api/apps/current
3. **Dashboard**: Open http://localhost:3000
4. **Live Data**: Switch between applications and see real-time updates

The new architecture provides better performance, cleaner separation of concerns, and more robust real-time data collection! 🚀