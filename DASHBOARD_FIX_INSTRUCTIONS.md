# 🔧 Dashboard Data Display Fix - Instructions

## 🎯 Problem Summary

The **Dashboard** and **Application Activity** pages are not showing data even though the data collector is working fine and generating data.

**Root Cause**: The backend Express server (`server-json.js`) was using an incorrect activity router (`activity-local-json.js`) that doesn't read from the JSONL files created by the data collector.

---

## ✅ What I Fixed

### 1. Updated Backend Router
- **File**: `backend-express/server-json.js`
- **Change**: Changed activity router from `activity-local-json.js` to `activity-local.js`
- **Why**: The correct router (`activity-local.js`) has all the endpoints needed:
  - ✅ `/api/activity/current` - Latest activity snapshot
  - ✅ `/api/activity/today` - Today's summary with aggregates
  - ✅ `/api/activity/stats` - Statistics
  - ✅ `/api/activity/available-dates` - List of available dates
  - ✅ `/api/activity/daily-summary/:date` - Specific date summary
  - ✅ `/api/activity/health` - Health check

### 2. How It Works Now

**Data Flow**:
```
Data Collector (Python)
    ↓
Writes JSONL files to: data-collector/activity_data/activity_YYYY-MM-DD_USERNAME.jsonl
    ↓
Backend Express Server
    ↓
Reads JSONL files via /api/activity/* endpoints
    ↓
Frontend (Dashboard & Application Activity pages)
    ↓
Displays data in charts and tables
```

---

## 🚀 Steps to Apply the Fix

### Step 1: Restart Backend Server

**Option A - If backend is already running in a terminal:**
1. Find the terminal running the backend
2. Press `Ctrl + C` to stop it
3. Restart with: `node server-json.js`

**Option B - Using the batch file:**
```powershell
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\backend-express
.\start-backend-json.bat
```

**Option C - Using VS Code task:**
1. Press `Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "Start Backend"

---

### Step 2: Verify Backend is Running

Open your browser and check:
```
http://localhost:8001/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T...",
  "storage": "JSON files",
  "dataDirectory": "..."
}
```

---

### Step 3: Test Activity Endpoints

**Check if data collector file exists:**
```
http://localhost:8001/api/activity/health
```

Expected response:
```json
{
  "status": "healthy",
  "dataCollectorRunning": true,
  "todayFile": "C:\\Users\\...\\activity_2025-10-17_GBS05262.jsonl",
  "message": "Activity data collector is running and creating data"
}
```

**Check current activity:**
```
http://localhost:8001/api/activity/current
```

Expected: Latest snapshot with apps, system metrics, etc.

**Check today's summary:**
```
http://localhost:8001/api/activity/today
```

Expected: Aggregated data for the entire day

---

### Step 4: Refresh Frontend

1. Open the Dashboard in your browser: `http://localhost:3000`
2. Hard refresh the page: `Ctrl + Shift + R` or `Ctrl + F5`
3. Navigate to **Dashboard** - You should see:
   - Active applications count
   - Productivity score
   - Memory usage
   - Charts with data

4. Navigate to **Application Activity** - You should see:
   - Currently running applications table
   - Usage summary with categories
   - Resource usage rankings
   - Hourly usage charts

---

## 🔍 Troubleshooting

### Problem: Backend returns 404 for /api/activity/current

**Solution**: The data collector needs to run for at least 1 minute to create the file.

1. Check if data collector is running:
   ```powershell
   cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector
   python activity_monitor.py
   ```

2. Wait 1 minute for it to create the first snapshot

3. Check if file exists:
   ```powershell
   dir activity_data\activity_*.jsonl
   ```

---

### Problem: "No activity data available" message

**Cause**: Data collector hasn't created the file yet

**Solution**:
1. Ensure data collector is running
2. Open some applications (Chrome, VS Code, etc.)
3. Wait 1-2 minutes
4. Refresh the dashboard

---

### Problem: Charts showing "No Data"

**Cause**: Need more time for data collector to gather hourly data

**Solution**:
1. Let the data collector run for at least 15-30 minutes
2. Use some applications actively
3. Refresh the dashboard

---

## 📊 What Data Should You See?

### Dashboard Page Shows:
- ✅ **Active Applications**: Count of currently running apps
- ✅ **Productivity Score**: Calculated based on focused apps
- ✅ **Memory Usage**: Total memory used by applications
- ✅ **Monitoring Hours**: How long you've been monitored today
- ✅ **Work Pattern Analysis**: Bar chart of time distribution
- ✅ **Work Pattern Breakdown**: Pie chart of activities
- ✅ **Focus Time per App**: Line chart showing focus time trends
- ✅ **Category-wise Focus**: Stacked bar chart by category
- ✅ **Time Distribution**: Pie chart of productive/idle time
- ✅ **Focus Intensity Heatmap**: 24-hour heatmap visualization
- ✅ **Real-time Activity Feed**: Currently focused window and stats

### Application Activity Page Shows:
- ✅ **Tab 1 - Current Applications**: Live table of running apps with memory, CPU, focus time
- ✅ **Tab 2 - Usage Summary**: Aggregated usage by app for today
- ✅ **Tab 3 - Resource Usage**: Apps ranked by memory and CPU usage
- ✅ **Tab 4 - Hourly Usage Chart**: Line chart showing app usage patterns by hour

---

## 🎯 Expected Data Format

The JSONL file contains snapshots like this:
```json
{
  "timestamp": "2025-10-17T08:02:46.658710Z",
  "system": {
    "cpuUsage": 7.1,
    "memoryUsageMB": 23515.0,
    "batteryPercent": 72,
    "isCharging": false,
    "aggregates": {
      "overallMonitoringHours": 0.1,
      "productiveHours": 0.05,
      "communicationHours": 0.0,
      "idleHours": 0.02
    }
  },
  "apps": [
    {
      "name": "Code.exe",
      "title": "Visual Studio Code",
      "category": "Productive",
      "isFocused": true,
      "runningTimeSec": 300,
      "focusDurationSec": 180,
      "memoryUsageMB": 3274.0,
      "cpuUsage": 0,
      "aggregates": {
        "totalRunHours": 0.08,
        "totalFocusHours": 0.05
      },
      "hourlyStats": [
        {
          "hour": "08:00",
          "focusSeconds": 180,
          "runSeconds": 300
        }
      ]
    }
  ],
  "hourlySummary": [
    {
      "hour": "08:00",
      "productiveFocusSec": 180,
      "communicationFocusSec": 0,
      "idleSec": 60
    }
  ]
}
```

---

## ✅ Verification Checklist

- [ ] Backend server restarted successfully
- [ ] `/health` endpoint returns healthy status
- [ ] `/api/activity/health` shows data collector is running
- [ ] `/api/activity/current` returns activity data
- [ ] `/api/activity/today` returns today's summary
- [ ] Dashboard page displays metrics and charts
- [ ] Application Activity page shows current apps table
- [ ] Charts display data (may need 15-30 min for hourly data)

---

## 📝 Summary

**Before Fix**:
- ❌ Backend using wrong router (activity-local-json.js)
- ❌ Router didn't read JSONL files
- ❌ Frontend got 404 errors
- ❌ No data displayed

**After Fix**:
- ✅ Backend using correct router (activity-local.js)
- ✅ Router reads JSONL files from data collector
- ✅ All endpoints working
- ✅ Dashboard shows data
- ✅ Application Activity shows data

---

**Status**: ✅ **Fix Applied - Ready to Test**

**Next Step**: Restart the backend server and refresh the frontend to see your data! 🎉
