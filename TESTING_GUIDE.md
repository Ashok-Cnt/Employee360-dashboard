# Quick Start: Testing the Enhanced Collector

## Prerequisites
- MongoDB running on localhost:27017
- Python 3.8+ installed
- Required packages: `motor`, `psutil`, `python-dotenv`

---

## Step 1: Install Dependencies

```powershell
cd "c:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\data-collector"
pip install motor psutil python-dotenv
```

---

## Step 2: Start the Collector

```powershell
cd "c:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\data-collector"
python collector.py
```

Expected output:
```
2025-10-14 10:30:00 - INFO - Loaded configuration from C:\...\config.ini
2025-10-14 10:30:00 - INFO - Connected to MongoDB: employee360
2025-10-14 10:30:00 - INFO - Starting application data collector for user: YourUsername
2025-10-14 10:30:00 - INFO - Collection interval: 30 seconds
2025-10-14 10:30:30 - INFO - Focused: Visual Studio Code (development) | Running: 25 | CPU: 15.2% | Memory: 8192MB
```

---

## Step 3: Verify Data Collection

### Check Real-Time Activity
```javascript
// In MongoDB Compass or mongosh
use employee360

// See currently tracked apps
db.application_activity.find({
  timestamp: { $gte: new Date(Date.now() - 60000) }
}).sort({ is_focused: -1 })

// Expected: List of running apps with categories
```

### Check Time Tracking
```javascript
// See hourly time tracking
db.app_time_tracking.find({
  date: new Date(new Date().toDateString())
}).sort({ total_time_seconds: -1 })

// Expected: Apps with accumulated time
```

### Check Daily Summary
```javascript
// See today's summary
db.daily_summary.findOne({
  date: new Date(new Date().toDateString())
})

// Expected: Daily statistics with focus/distraction breakdown
```

### Check System Metrics
```javascript
// See recent system metrics
db.system_metrics.find().sort({ timestamp: -1 }).limit(10)

// Expected: CPU and memory usage samples
```

---

## Step 4: Test Focus Time Tracking

1. **Open a Focus App** (e.g., Visual Studio Code)
2. **Use it actively for 2-3 minutes**
3. **Switch to a different app**
4. **Query the database**:

```javascript
db.app_time_tracking.find({
  application: "Visual Studio Code",
  date: new Date(new Date().toDateString())
})
```

Expected result:
```javascript
{
  application: "Visual Studio Code",
  category: "development",
  is_focus_app: true,
  total_time_seconds: 180,      // 3 minutes
  focused_time_seconds: 180,    // All focused
  background_time_seconds: 0
}
```

---

## Step 5: Test Category Tracking

Open apps from different categories and verify categorization:

```javascript
db.application_activity.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date(Date.now() - 300000) } // Last 5 minutes
    }
  },
  {
    $group: {
      _id: "$category",
      apps: { $addToSet: "$application" },
      count: { $sum: 1 }
    }
  }
])
```

Expected output:
```javascript
[
  { _id: "development", apps: ["Visual Studio Code"], count: 10 },
  { _id: "browsers", apps: ["Google Chrome"], count: 8 },
  { _id: "communication", apps: ["Microsoft Teams"], count: 5 }
]
```

---

## Step 6: Test Daily Summary Generation

After running for a few minutes:

```javascript
db.daily_summary.findOne({
  date: new Date(new Date().toDateString())
})
```

Expected output:
```javascript
{
  user_id: "YourUsername",
  date: ISODate("2025-10-14T00:00:00Z"),
  total_time_seconds: 600,
  focus_time_seconds: 400,
  distraction_time_seconds: 50,
  category_breakdown: {
    development: 400,
    browsers: 150,
    communication: 50
  },
  top_apps: [
    {
      application: "Visual Studio Code",
      total_time_seconds: 400,
      category: "development"
    }
  ],
  avg_cpu_usage_percent: 25.3,
  avg_memory_usage_mb: 8192
}
```

---

## Step 7: Test Distraction Detection

1. **Open a distraction app** (e.g., YouTube, Facebook)
2. **Use it for 1-2 minutes**
3. **Check the summary**:

```javascript
db.daily_summary.findOne(
  { date: new Date(new Date().toDateString()) },
  { distraction_time_seconds: 1, focus_time_seconds: 1 }
)
```

Should show increased distraction_time_seconds.

---

## Step 8: Verify Data Cleanup

### Check Retention Policies

```javascript
// Real-time activity should only have last 24 hours
db.application_activity.find().sort({ timestamp: 1 }).limit(1)
// Oldest record should be < 24 hours old

// System metrics should only have last 7 days
db.system_metrics.find().sort({ timestamp: 1 }).limit(1)
// Oldest record should be < 7 days old
```

---

## Troubleshooting

### No Data Appearing?

1. **Check MongoDB Connection**
   ```powershell
   # Test MongoDB is running
   mongo --eval "db.adminCommand('ping')"
   ```

2. **Check Collector Logs**
   - Look for connection errors
   - Verify user_id is detected

3. **Check Permissions**
   - Collector needs permission to read process information
   - Run as Administrator if needed

### Apps Not Categorized?

1. **Check Process Name**
   ```python
   # In collector logs, look for:
   # "No focused app | Running apps: X"
   ```

2. **Add App Mapping**
   - Edit `collector.py`
   - Add to `app_name_map` dictionary
   - Restart collector

### Focus Time Always Zero?

1. **Verify Foreground Detection**
   - Check if focused app name appears in logs
   - Windows API might need permissions

2. **Check App Classification**
   - App might not be in FOCUS_APPS list
   - Add it and restart

### High Memory Usage?

1. **Check Collection Interval**
   ```bash
   # In .env file
   COLLECTION_INTERVAL_SECONDS=60  # Increase if needed
   ```

2. **Verify Cleanup Running**
   - Check old data is being deleted
   - Look for cleanup log messages

---

## Sample Queries for Testing

### Get Current Session Summary
```javascript
db.app_time_tracking.aggregate([
  {
    $match: {
      date: new Date(new Date().toDateString())
    }
  },
  {
    $group: {
      _id: "$category",
      total_hours: { $sum: { $divide: ["$total_time_seconds", 3600] } }
    }
  },
  { $sort: { total_hours: -1 } }
])
```

### Get Productivity Score
```javascript
const summary = db.daily_summary.findOne({
  date: new Date(new Date().toDateString())
});

const productivityScore = (summary.focus_time_seconds / summary.total_time_seconds) * 100;
print(`Productivity Score: ${productivityScore.toFixed(1)}%`);
```

### Get Most Used Apps
```javascript
db.app_time_tracking.aggregate([
  {
    $match: {
      date: new Date(new Date().toDateString())
    }
  },
  {
    $group: {
      _id: "$application",
      total_minutes: { $sum: { $divide: ["$total_time_seconds", 60] } },
      category: { $first: "$category" }
    }
  },
  { $sort: { total_minutes: -1 } },
  { $limit: 10 }
])
```

### Get Hourly Pattern
```javascript
db.hourly_summary.find({
  date: new Date(new Date().toDateString())
}).sort({ hour: 1 })
```

### Get System Performance
```javascript
db.system_metrics.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date(Date.now() - 3600000) } // Last hour
    }
  },
  {
    $group: {
      _id: null,
      avg_cpu: { $avg: "$cpu_usage_percent" },
      max_cpu: { $max: "$cpu_usage_percent" },
      avg_memory_mb: { $avg: "$memory_usage_mb" }
    }
  }
])
```

---

## Expected Results After 1 Hour

After running the collector for 1 hour with normal computer use, you should have:

✅ **application_activity**: ~120 documents (30-second intervals)
✅ **app_time_tracking**: 5-15 documents (one per app per hour)
✅ **hourly_summary**: 1 document (current hour)
✅ **daily_summary**: 1 document (today, updated continuously)
✅ **system_metrics**: ~120 documents (30-second intervals)

---

## Next Steps

Once data collection is verified:

1. ✅ **Create Backend API Endpoints**
   - GET /api/activity/daily/:date
   - GET /api/activity/hourly/:date
   - GET /api/activity/realtime

2. ✅ **Build Frontend Visualizations**
   - Focus time dashboard
   - Category breakdown charts
   - Hourly productivity heatmap

3. ✅ **Add Indexes for Performance**
   - See DATABASE_SCHEMA.md for recommended indexes

4. ✅ **Configure Retention Policies**
   - Adjust cleanup intervals if needed
   - Set up automated backups

---

## Success Criteria

✅ Collector runs without errors
✅ All collections have data
✅ Focus time is being tracked for designated apps
✅ Distraction time is detected
✅ Categories are correctly assigned
✅ System metrics are recording
✅ Daily summaries are updating
✅ Data cleanup is working

If all criteria are met, you're ready to build the frontend!

