# Employee360 - Real-time Application Activity Dashboard

A comprehensive productivity tracking and analysis platform with Express.js + Python architecture that provides real-time insights into application usage, work patterns, and performance analytics.

## 🚀 New Architecture (Express.js + Python)

### Express.js Backend
- **Fast API Operations**: Optimized for quick database reads and dashboard queries
- **RESTful Endpoints**: Clean API design for frontend integration
- **MongoDB Integration**: Efficient aggregation and data retrieval
- **CORS & Security**: Production-ready security middleware

### Python Data Collector
- **Real-time Monitoring**: Continuous background collection of application activity
- **Windows API Integration**: Accurate focused window detection
- **Resource Tracking**: Memory and CPU usage per application
- **Intelligent Categorization**: Automatic application type detection

### React Frontend
- **Live Dashboard**: Real-time application activity visualization
- **Responsive Design**: Modern Material-UI components
- **Performance Metrics**: Comprehensive usage analytics
- **Interactive Charts**: Dynamic data visualization

## Features

### � Real-time Application Monitoring
- Track currently running applications
- Monitor focused window activity
- Memory and CPU usage analytics
- Application usage timeline and patterns

### 💻 System Performance Insights
- Top memory-consuming applications
- CPU usage trends and optimization recommendations
- Application launch frequency analysis
- Work pattern identification

### 📈 Productivity Analytics
- Daily, weekly, and monthly usage summaries
- Focus time analysis based on application categories
- Productivity score calculations
- Historical trend analysis

### 🎯 Work Pattern Analysis
- Intelligent categorization of daily activities (Focus, Meetings, Breaks)
- Smart application classification based on work patterns
- Visual breakdown of time distribution across different work types
- Productivity scoring based on activity patterns
- Real-time balance analysis between focused work, collaboration, and rest
- Work pattern optimization recommendations

### 🔍 Advanced Analytics
- Application category-based insights
- Time-based usage patterns
- Correlation between applications and productivity
- Customizable reporting and data export

## Technology Stack

### Backend Services
- **Express.js**: Fast API server for database operations
- **Python**: Background data collection and system monitoring
- **MongoDB**: Flexible document database for activity storage
- **Node.js**: Runtime environment for Express server

### Frontend
- **React.js**: Modern component-based UI framework
- **Material-UI**: Professional UI component library
- **Chart.js**: Interactive data visualization
- **Redux Toolkit**: State management for complex data flows

### Data Collection
- **Windows APIs**: Native system integration for accurate monitoring
- **psutil**: Cross-platform system and process utilities
- **Real-time Processing**: Continuous monitoring with configurable intervals
- **Automatic Cleanup**: Intelligent data retention and cleanup

## Project Structure

```
Employee360-dashboard/
├── backend-express/          # Express.js API server
│   ├── server.js            # Main server file
│   ├── routes/              # API route handlers
│   │   ├── applications.js  # Application activity endpoints
│   │   └── users.js         # User management endpoints
│   ├── package.json         # Node.js dependencies
│   └── .env                 # Server configuration
├── data-collector/          # Python background service
│   ├── collector.py         # Main data collection logic
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Collection configuration
├── frontend/               # React dashboard application
│   ├── src/
│   │   ├── pages/           # Dashboard pages
│   │   ├── components/      # Reusable UI components
│   │   └── store/           # Redux state management
│   ├── package.json         # React dependencies
│   └── public/              # Static assets
├── browser-extension/      # Chrome/Edge extension (legacy)
├── database/               # MongoDB schemas and utilities
├── docs/                   # Documentation and guides
├── *.bat                   # Windows startup scripts
└── api-test.html          # API testing utilities
```

## Quick Start

### Prerequisites
- **Node.js** (v18+) for Express.js backend
- **Python** (3.8+) for data collection
- **MongoDB** (local or Atlas) for data storage

### 1. Install Dependencies
```bash
# Express.js backend
cd backend-express
npm install

# Python data collector
cd ../data-collector
pip install motor pymongo psutil python-dotenv schedule requests

# React frontend
cd ../frontend
npm install
```

### 2. Start Services
```bash
# Terminal 1: Express.js API (Port 8001)
cd backend-express
npm start

# Terminal 2: Python Data Collector
cd data-collector
python collector.py

# Terminal 3: React Frontend (Port 3000)
cd frontend
npm start
```

### 3. Access Dashboard
- **Frontend**: http://localhost:3000
- **API Health**: http://127.0.0.1:8001/health
- **API Endpoints**: http://127.0.0.1:8001/api/apps/*

### 4. Quick Setup Scripts
Use the provided batch files for easy startup:
```bash
start-express-backend.bat    # Express.js API server
start-data-collector.bat     # Python background collector
start-frontend.bat           # React dashboard
```

## API Endpoints

### Application Activity
- `GET /api/apps/current` - Currently running applications
- `GET /api/apps/summary?period={today|week|month}` - Usage summary
- `GET /api/apps/stats` - Application statistics
- `GET /api/apps/top-memory-usage?limit=10` - Memory usage leaders
- `GET /api/apps/focused-window` - Currently focused application
- `GET /api/apps/timeline?hours=24` - Activity timeline
- `GET /api/apps/work-patterns?hours=24` - Work pattern analysis (Focus, Meetings, Breaks)

### System Health
- `GET /health` - Service health check
- `GET /api/users` - User management (future enhancement)

## Configuration

### Express.js Backend (.env)
```bash
PORT=8001
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=employee360
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NODE_ENV=development
```

### Python Data Collector (.env)
```bash
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=employee360
COLLECTION_INTERVAL_SECONDS=30
USER_ID=john_doe
LOG_LEVEL=INFO
```

## Architecture Benefits

### Separation of Concerns
- **Express.js**: Handles API requests and database queries efficiently
- **Python**: Manages system monitoring and data collection in background
- **React**: Provides responsive, real-time dashboard interface
- **MongoDB**: Centralized data storage with optimized queries

### Performance Advantages
- **Fast API Responses**: Express.js optimized for quick database operations
- **Non-blocking Collection**: Python collector runs independently
- **Real-time Updates**: Live data refresh without interrupting user experience
- **Scalable Architecture**: Easy to scale each service independently

### Development Benefits
- **Technology Specialization**: Each service uses optimal technology stack
- **Independent Deployment**: Services can be deployed and updated separately
- **Clear Boundaries**: Well-defined responsibilities for easier maintenance
- **Future-proof**: Easy to extend with additional services or features

## Data Collection Features

### Real-time Monitoring
- **Windows API Integration**: Native system calls for accurate data
- **Focused Window Tracking**: Identifies currently active applications
- **Resource Usage**: Memory and CPU consumption per application
- **Automatic Categorization**: Smart application type detection

### Data Quality
- **Configurable Intervals**: Adjustable collection frequency (default 30s)
- **Data Validation**: Ensures data integrity and consistency
- **Error Handling**: Robust error recovery and logging
- **Privacy Focused**: Only collects application names and usage metrics

### Storage Optimization
- **Efficient Schema**: Optimized MongoDB document structure
- **Automatic Cleanup**: Removes data older than 30 days
- **Indexed Queries**: Fast retrieval for dashboard operations
- **Aggregated Insights**: Pre-calculated metrics for performance

## Dashboard Features

### Real-time Monitoring
- **Live Application List**: Currently running applications with resource usage
- **Focused Window Display**: Shows currently active application
- **Memory Usage Charts**: Visual representation of resource consumption
- **CPU Utilization Graphs**: Track processor usage patterns

### Analytics & Insights
- **Usage Summaries**: Daily, weekly, and monthly application usage
- **Productivity Metrics**: Time spent in different application categories
- **Trend Analysis**: Historical patterns and productivity insights
- **Top Consumers**: Applications using most system resources

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Data refreshes automatically every minute
- **Interactive Charts**: Click and explore data with dynamic visualizations
- **Export Capabilities**: Download data for external analysis

## Contributing

We welcome contributions to Employee360! Here's how you can help:

### Development Setup
1. Fork the repository
2. Set up the development environment using the Quick Start guide
3. Create a feature branch for your changes
4. Test your changes across all services
5. Submit a pull request with detailed description

### Areas for Contribution
- **New API Endpoints**: Extend Express.js backend with additional features
- **Enhanced Monitoring**: Improve Python data collection capabilities
- **UI/UX Improvements**: Enhance React frontend design and functionality
- **Documentation**: Improve guides, add tutorials, create video walkthroughs
- **Performance Optimization**: Optimize database queries and data processing
- **Cross-platform Support**: Extend to macOS and Linux systems

### Code Standards
- **JavaScript/Node.js**: Follow ESLint configuration
- **Python**: Adhere to PEP 8 style guidelines
- **React**: Use functional components with hooks
- **Commit Messages**: Use conventional commit format
- **Testing**: Include unit tests for new features

## Deployment

### Development
```bash
# All services running locally
npm start          # Express backend on port 8001
python collector.py # Python collector in background
npm start          # React frontend on port 3000
```

### Production
```bash
# Express.js with PM2
pm2 start server.js --name employee360-api

# Python as system service
# Use systemd (Linux) or Windows Service Manager

# React build for static hosting
npm run build
# Deploy to Netlify, Vercel, or serve with nginx
```

### Cloud Deployment
- **Backend**: Deploy Express.js to Heroku, AWS, or Azure
- **Database**: Use MongoDB Atlas for managed database
- **Frontend**: Static hosting on Netlify, Vercel, or AWS S3
- **Monitoring**: Set up logging and monitoring for production

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Port Conflicts**: Check if ports 3000 and 8001 are available
3. **Python Dependencies**: Install all required packages with pip
4. **Windows Permissions**: Some monitoring features may require admin rights

### Getting Help
- **Documentation**: Check [QUICKSTART.md](QUICKSTART.md) for detailed setup
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and tips
- **Logs**: Check service logs for detailed error information

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Express.js Community**: For the robust web framework
- **React Team**: For the excellent frontend library
- **MongoDB**: For flexible document database capabilities
- **Python Community**: For system monitoring libraries and tools
- **Open Source Contributors**: For the amazing ecosystem of tools and libraries

---

**Get started now**: Follow the [Quick Start Guide](QUICKSTART.md) to set up your Employee360 dashboard in under 5 minutes! 🚀