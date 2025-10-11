# Quick Start Guide

Get your Employee360 up and running in minutes!

## Prerequisites

Before you begin, ensure you have:
- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **Python** (3.8+) - [Download here](https://python.org/)
- **MongoDB** - [Local install](https://mongodb.com/try/download/community) or [MongoDB Atlas](https://mongodb.com/cloud/atlas)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Setup Project
```bash
# Clone the repository
git clone <your-repo-url>
cd Employee360-dashboard

# Or if you created it locally, navigate to the folder
cd Employee360-dashboard
```

### 2. Setup Backend (2 minutes)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env file with your settings (MongoDB URL, etc.)
```

### 3. Setup Frontend (2 minutes)
```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install
```

### 4. Setup Database (1 minute)
```bash
# Start MongoDB (if using local installation)
mongod

# Initialize database (in a new terminal)
mongosh
# Copy and paste the contents of database/init_db.js
# Or: mongosh < database/init_db.js

# Optional: Add sample data
# Copy and paste the contents of database/sample_data.js
```

### 5. Start the Application
```bash
# Terminal 1: Start Backend
cd backend
python main.py
# Backend runs on http://localhost:8000

# Terminal 2: Start Frontend
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### 6. Install Browser Extension
1. Open Chrome/Edge
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `browser-extension` folder

## 🎯 First Steps

### 1. Create Account
- Visit http://localhost:3000
- Click "Register" to create your account
- Or use sample credentials: `demo@example.com` / `demo123`

### 2. Configure Extension
- Click the extension icon in your browser
- Go to Settings
- Enter API endpoint: `http://localhost:8000/api`
- Login with your credentials

### 3. Start Tracking
- The extension automatically starts tracking
- Visit different websites to see data populate
- Use the dashboard to view your productivity metrics

## 📊 What You'll See

### Dashboard Overview
- **Focus Hours**: Time spent on productive activities
- **Productivity Score**: Overall productivity percentage
- **Learning Progress**: Courses and skills tracking
- **Health Metrics**: Sleep, activity, and wellness data

### Real-time Tracking
- Browser extension tracks your activity automatically
- Categorizes websites and applications
- Syncs data every 5 minutes

## 🔧 Configuration Options

### Backend Configuration (.env)
```bash
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=employee360

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# Security (change these!)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# Optional: AI Integration
OPENAI_API_KEY=your-openai-key
```

### Frontend Configuration
```bash
# Create frontend/.env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

## 🎮 Demo Mode

Want to see the dashboard in action immediately?

1. Use the sample data from `database/sample_data.js`
2. Login with demo credentials: `demo@example.com`
3. Explore all features with pre-populated data

## 📱 Mobile Access

The dashboard is responsive and works on mobile devices:
- Visit http://localhost:3000 on your phone
- All charts and metrics are mobile-optimized
- Touch-friendly interface

## 🔒 Privacy & Security

### Data Collection
- Only tracks URL hostnames (not full URLs)
- No sensitive content is recorded
- Data stays on your device until synced

### Security Features
- JWT authentication
- Password hashing with bcrypt
- CORS protection
- Input validation

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Check MongoDB connection
mongosh --eval "db.runCommand('ping')"
```

### Frontend Won't Start
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version
```

### Extension Not Working
1. Check if extension is enabled
2. Reload extension in Chrome/Edge
3. Check console for errors (F12)
4. Verify API endpoint in extension settings

### Database Issues
```bash
# Check MongoDB status
mongosh --eval "db.stats()"

# Reset database
mongosh employee360 --eval "db.dropDatabase()"
# Then run init_db.js again
```

## 🚀 Production Deployment

### Quick Deploy Options

**Frontend (Netlify)**
```bash
npm run build
# Upload build/ folder to Netlify
```

**Backend (Heroku)**
```bash
# Install Heroku CLI
heroku create your-app-name
git push heroku main
```

**Database (MongoDB Atlas)**
- Create free cluster at mongodb.com
- Update MONGODB_URL in .env
- Import your data

## 📈 Next Steps

### Enhance Your Setup
1. **Add Integrations**: Connect calendar, Slack, GitHub
2. **Customize Categories**: Edit website categorization
3. **Set Goals**: Define productivity targets
4. **Export Data**: Backup your productivity data

### Advanced Features
1. **AI Insights**: Add OpenAI key for intelligent recommendations
2. **Team Dashboard**: Share insights with your team
3. **Mobile App**: Build React Native companion app
4. **Wearable Integration**: Connect fitness trackers

## 💡 Tips for Best Results

### Productivity Tracking
- Let the extension run for a week to establish patterns
- Review weekly reports for insights
- Adjust categories to match your workflow
- Set realistic productivity goals

### Data Quality
- Regularly sync your data
- Keep extension updated
- Review and clean categorizations
- Backup your data periodically

## 🤝 Getting Help

### Documentation
- [Frontend Guide](frontend/README.md)
- [Backend API Docs](backend/README.md)
- [Extension Guide](browser-extension/README.md)
- [Database Schema](database/README.md)

### Community
- GitHub Issues for bugs
- Discussions for questions
- Feature requests welcome

### Support
- Check logs for error details
- Include system info in bug reports
- Test with sample data first

## 🌟 Success Metrics

After setup, you should see:
- ✅ Dashboard loads with your data
- ✅ Extension tracks browser activity
- ✅ Charts show productivity trends
- ✅ API responses are fast (<200ms)
- ✅ Data syncs automatically

## 🎉 You're Ready!

Your Employee360 is now running! Start browsing and working normally - the system will automatically track your patterns and provide insights to help you optimize your productivity.

Visit http://localhost:3000 to explore your personalized productivity analytics!