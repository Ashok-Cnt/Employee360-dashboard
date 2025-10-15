# Employee360 Dashboard - New Express.js Architecture

## 🎉 Successfully Implemented New Architecture!

### Architecture Overview
We have successfully transitioned from FastAPI to Express.js for API operations while keeping Python for data collection batch processes. This provides better separation of concerns:

- **Express.js Backend** (Port 8001): Fast API reads and database queries
- **Python Data Collector**: Background service for real-time application monitoring
- **React Frontend** (Port 3000): User interface for dashboard

### 🚀 Quick Start Commands

#### Start All Services
```powershell
# 1. Start Express Backend (in one terminal)
cd "C:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\backend-express"
node server.js

# 2. Start Data Collector (in another terminal) 
cd "C:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\data-collector"
python collector.py

# 3. Start React Frontend (in third terminal)
cd "C:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\frontend"
npm start
```

#### Or Use Batch Files
- `start-express-backend.bat` - Starts Express.js API server
- `start-data-collector.bat` - Starts Python background data collection
- `start-frontend.bat` - Starts React dashboard

### 📊 Available API Endpoints

#### Express.js API (http://127.0.0.1:8001)
- `GET /health` - Health check
- `GET /api/apps/current` - Current running applications
- `GET /api/apps/summary?period={today|week|month}` - Usage summary
- `GET /api/apps/stats` - Application statistics
- `GET /api/apps/top-memory-usage?limit=10` - Top memory consumers
- `GET /api/apps/focused-window` - Currently focused application
- `GET /api/apps/timeline?hours=24` - Application activity timeline

### 🔧 Data Collection Features

The Python data collector now includes:
- **Real-time Application Monitoring**: Tracks currently focused windows
- **Resource Usage Tracking**: Memory and CPU usage for each application
- **Realistic Data Generation**: Work hour patterns and usage variations
- **Windows API Integration**: Gets actual foreground window information
- **Automatic Cleanup**: Removes data older than 30 days

### 🎯 Key Improvements

1. **Performance**: Express.js provides faster API responses
2. **Separation of Concerns**: API reads vs. data collection are separated
3. **Real-time Data**: Python collector runs continuously in background
4. **Better Resource Tracking**: More accurate memory and CPU monitoring
5. **Windows Integration**: Uses Windows APIs for accurate window detection

### 📁 Project Structure
```
backend-express/          # Express.js API server
├── server.js            # Main server file
├── routes/
│   ├── applications.js  # App activity endpoints
│   └── users.js         # User management endpoints
├── package.json         # Dependencies
└── .env                 # Configuration

data-collector/          # Python background service
├── collector.py         # Main data collection logic
├── requirements.txt     # Python dependencies
└── .env                 # Collection configuration

frontend/                # React dashboard
├── src/pages/ApplicationActivity.js  # Updated for Express API
└── package.json         # React dependencies
```

### ✅ Working Features

- ✅ Express.js backend serving API requests
- ✅ Python data collector running in background
- ✅ React frontend displaying real application data
- ✅ MongoDB integration with both services
- ✅ Real-time application monitoring (VS Code, Edge, etc.)
- ✅ Memory and CPU usage tracking
- ✅ Application usage statistics and summaries

### 🌐 Access Points

- **Dashboard**: http://localhost:3000
- **API Health**: http://127.0.0.1:8001/health  
- **Current Apps**: http://127.0.0.1:8001/api/apps/current
- **MongoDB**: mongodb://localhost:27017 (employee360 database)

### 📝 Next Steps

1. The dashboard is now running with the new architecture
2. Data collector is gathering real application activity
3. All APIs are working with Express.js backend
4. You can monitor real application usage in the dashboard

### 🛠️ Troubleshooting

If any service fails to start:
1. Check MongoDB is running on localhost:27017
2. Ensure all dependencies are installed (npm install, pip install)
3. Verify environment files (.env) have correct configuration
4. Check port availability (3000 for frontend, 8001 for backend)

The new architecture is now successfully running! 🎊