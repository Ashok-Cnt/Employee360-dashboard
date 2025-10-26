# Udemy Tracker Extension - Backend Integration Guide

## 🎯 Overview

The Udemy Tracker extension backend logic has been **successfully integrated** into the main Employee360 backend server (`backend-express/server-json.js`). This eliminates the need for a separate server and consolidates all backend operations into a single Express.js server.

## 🏗️ Architecture Changes

### Before Integration
```
┌─────────────────────────┐
│  Chrome Extension       │
│  (Port: N/A)           │
└───────────┬─────────────┘
            │
            ├──────────────────┐
            │                  │
            ▼                  ▼
┌─────────────────────┐  ┌─────────────────────┐
│  Udemy Tracker      │  │  Employee360        │
│  Server (5001)      │  │  Backend (8001)     │
│  - Separate Node.js │  │  - Express.js       │
└─────────────────────┘  └─────────────────────┘
```

### After Integration
```
┌─────────────────────────┐
│  Chrome Extension       │
│  (Port: N/A)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Employee360 Backend (8001)         │
│  ┌─────────────────────────────┐   │
│  │  Existing Routes            │   │
│  │  - /api/users               │   │
│  │  - /api/apps                │   │
│  │  - /api/activity            │   │
│  │  - /api/health              │   │
│  │  - /api/learning-progress   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Udemy Tracker Routes       │   │
│  │  - /api/udemy-tracker       │   │
│  │  - /api/udemy-tracker/stats │   │
│  │  - /api/udemy-tracker/files │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 📂 File Structure

### Extension Files (Keep in `udemy-tracker-extension/`)
```
udemy-tracker-extension/
├── manifest.json              ✅ Updated (port changed to 8001)
├── content-script.js          ✅ Updated (endpoint changed)
├── background.js              ✅ No changes needed
├── popup.html                 ✅ No changes needed
├── popup.js                   ✅ No changes needed
├── README.md                  ✅ Updated (all references)
├── INTEGRATION_GUIDE.md       ✅ New file (this document)
└── icons/                     ✅ No changes needed
```

### Backend Files (in `backend-express/`)
```
backend-express/
├── server-json.js             ✅ Updated (Udemy endpoints added)
├── package.json               ✅ No changes needed
├── data/
│   ├── users.json
│   ├── application_activity.json
│   └── udemy_activity/        ✅ New directory (auto-created)
│       └── udemy_enhanced_YYYY-MM-DD_USERNAME.jsonl
```

### Removed Files (No Longer Needed)
```
❌ udemy-tracker-extension/server.js (integrated into server-json.js)
❌ udemy-tracker-extension/package.json (not needed for extension)
❌ udemy-tracker-extension/start-server.bat (use start-backend-json.bat)
```

## 🔧 Key Changes Made

### 1. Backend Server (`server-json.js`)

#### Added Data Directory
```javascript
const UDEMY_DATA_DIR = path.join(DATA_DIR, 'udemy_activity');
```

#### Added Udemy Tracker Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/udemy-tracker/health` | GET | Health check for Udemy tracker |
| `/api/udemy-tracker` | POST | Receive and store course data |
| `/api/udemy-tracker/stats` | GET | Get statistics for today's data |
| `/api/udemy-tracker/files` | GET | List all JSONL files |
| `/api/udemy-tracker/file/:filename` | GET | Get data from specific file |

#### Added Helper Functions
- `getUdemyTodayFilename()` - Generate daily JSONL filename
- `getLogTimestamp()` - Format timestamps for logging

### 2. Chrome Extension (`content-script.js`)

```javascript
// Changed from:
collectorEndpoint: 'http://localhost:5001/api/udemy-tracker'

// To:
collectorEndpoint: 'http://localhost:8001/api/udemy-tracker'
```

### 3. Extension Manifest (`manifest.json`)

```json
// Changed from:
"host_permissions": [
  "*://*.udemy.com/*",
  "http://localhost:5001/*"
]

// To:
"host_permissions": [
  "*://*.udemy.com/*",
  "http://localhost:8001/*"
]
```

## 🚀 How to Use

### Step 1: Start the Backend Server

```bash
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard
start-backend-json.bat
```

You should see:
```
🚀 Employee360 Express server running on http://127.0.0.1:8001
🎓 Udemy Tracker: Data stored in C:\...\backend-express\data\udemy_activity
```

### Step 2: Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\udemy-tracker-extension`

### Step 3: Test on Udemy

1. Navigate to any Udemy course page
2. Extension will automatically start tracking
3. Click extension icon to see status
4. Data is saved every 30 seconds (configurable)

### Step 4: Verify Data Storage

Check the following directory for JSONL files:
```
C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\backend-express\data\udemy_activity\
```

Files are named: `udemy_enhanced_YYYY-MM-DD_USERNAME.jsonl`

## 📊 API Endpoints

### Health Check
```bash
curl http://localhost:8001/api/udemy-tracker/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Udemy Progress Tracker - Integrated with Employee360",
  "version": "1.0.0",
  "timestamp": "2025-10-26T14:30:00.000Z",
  "dataDirectory": "C:\\...\\backend-express\\data\\udemy_activity"
}
```

### Get Today's Statistics
```bash
curl http://localhost:8001/api/udemy-tracker/stats
```

**Response:**
```json
{
  "entries": 5,
  "courses": [
    {
      "id": "java-masterclass",
      "name": "Java Masterclass 2025",
      "lastUpdate": "2025-10-26T14:30:00.000Z",
      "stats": {
        "totalSections": 15,
        "totalLessons": 180,
        "completedLessons": 45
      },
      "url": "https://www.udemy.com/course/java-masterclass/"
    }
  ],
  "file": "udemy_enhanced_2025-10-26_GBS05262.jsonl",
  "lastEntry": "2025-10-26T14:30:00.000Z"
}
```

### List All Data Files
```bash
curl http://localhost:8001/api/udemy-tracker/files
```

**Response:**
```json
{
  "count": 3,
  "files": [
    {
      "filename": "udemy_enhanced_2025-10-26_GBS05262.jsonl",
      "size": 12345,
      "modified": "2025-10-26T14:30:00.000Z",
      "created": "2025-10-26T10:00:00.000Z"
    }
  ],
  "directory": "C:\\...\\backend-express\\data\\udemy_activity"
}
```

### Get Specific File Data
```bash
curl http://localhost:8001/api/udemy-tracker/file/udemy_enhanced_2025-10-26_GBS05262.jsonl
```

## 🔍 Data Format

Each line in the JSONL file contains:

```json
{
  "timestamp": "2025-10-26T14:30:00.000Z",
  "type": "udemy_extension",
  "course": {
    "id": "java-masterclass",
    "name": "Java Masterclass 2025",
    "url": "https://www.udemy.com/course/java-masterclass/",
    "progress": {
      "percentComplete": 25,
      "completedLectures": 45,
      "totalLectures": 180
    },
    "metadata": {
      "instructor": "Tim Buchalka",
      "rating": "4.6",
      "lastUpdated": "2025-10-26T14:30:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "pageUrl": "https://www.udemy.com/course/java-masterclass/"
    }
  },
  "sections": [
    {
      "sectionIndex": 1,
      "sectionTitle": "Introduction to Java",
      "totalLessons": 12,
      "completedLessons": 8,
      "isExpanded": true,
      "lessons": [
        {
          "lessonIndex": 1,
          "lessonTitle": "Welcome to the Course",
          "isCompleted": true
        }
      ]
    }
  ],
  "currentLesson": null,
  "stats": {
    "totalSections": 15,
    "totalLessons": 180,
    "completedLessons": 45
  },
  "captureMethod": "browser_extension"
}
```

## 🐛 Troubleshooting

### Extension Not Sending Data

**Check 1: Backend Running?**
```bash
# Terminal should show:
Employee360 Express server running on http://127.0.0.1:8001
```

**Check 2: Test Health Endpoint**
```bash
curl http://localhost:8001/api/udemy-tracker/health
```

**Check 3: Check Chrome Console**
- Right-click → Inspect → Console
- Look for: "🚀 Udemy Tracker Content Script Loaded"
- Check for any error messages

**Check 4: Verify Extension URL**
- Open `content-script.js`
- Confirm: `collectorEndpoint: 'http://localhost:8001/api/udemy-tracker'`

### Data Not Being Saved

**Check 1: Directory Exists**
```
C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\backend-express\data\udemy_activity\
```

**Check 2: Backend Terminal Logs**
Look for:
```
✅ [2025-10-26 14:30:00] Udemy: Java Masterclass - 15 sections, 180 lessons, 45 completed
💾 [2025-10-26 14:30:00] Udemy data saved to: udemy_enhanced_2025-10-26_GBS05262.jsonl
```

**Check 3: File Permissions**
- Ensure Node.js has write permissions to the `data` folder

### CORS Errors

**Solution:**
The backend already has CORS enabled. If you still see CORS errors:

1. Restart the backend server
2. Clear browser cache
3. Reload the extension
4. Check `manifest.json` has correct host_permissions

## 🎯 Benefits of Integration

### Before
- ❌ Two separate servers to manage
- ❌ Different ports (5001, 8001)
- ❌ Separate package.json and dependencies
- ❌ More complex deployment

### After
- ✅ Single unified backend server
- ✅ One port (8001) for all APIs
- ✅ Shared dependencies and configuration
- ✅ Simpler deployment and maintenance
- ✅ Centralized logging and monitoring
- ✅ Easier to add new features

## 📝 Configuration

### Change Data Capture Frequency

Edit `content-script.js`:
```javascript
// Change from 30 seconds to 60 seconds
const CONFIG = {
  collectorEndpoint: 'http://localhost:8001/api/udemy-tracker',
  updateInterval: 60000,  // 60 seconds
  debug: true
};
```

### Enable/Disable Debug Logging

Edit `content-script.js`:
```javascript
const CONFIG = {
  collectorEndpoint: 'http://localhost:8001/api/udemy-tracker',
  debug: false  // Disable console logs
};
```

## 🔐 Security Notes

- All data is stored locally on your machine
- No external services or API calls
- CORS is configured for localhost only
- Data files are plain text JSONL format
- Extension only works on Udemy.com domain

## 📈 Next Steps

1. **Frontend Integration**: Create a dashboard component to display Udemy progress
2. **Analytics**: Add aggregation and reporting features
3. **Notifications**: Alert when courses are completed
4. **Export**: Add CSV/JSON export functionality
5. **Multi-User**: Support multiple users tracking different courses

## 🆘 Need Help?

**Common Issues:**
- Backend not running → Run `start-backend-json.bat`
- Port 8001 in use → Change PORT in `.env` file
- Extension not loading → Check `chrome://extensions/` for errors
- Data not saving → Check file permissions

**Check Logs:**
- Backend: Terminal running `start-backend-json.bat`
- Extension: Chrome DevTools Console
- Files: Check `backend-express\data\udemy_activity\`

---

## ✅ Integration Checklist

- [x] Backend endpoints added to `server-json.js`
- [x] Udemy data directory configured
- [x] Extension endpoints updated to port 8001
- [x] Manifest permissions updated
- [x] README documentation updated
- [x] Integration guide created
- [x] Tested health endpoint
- [x] Tested data capture
- [x] Verified file storage

**Status: ✅ Integration Complete!**

Enjoy your unified Employee360 backend with integrated Udemy tracking! 🎓
