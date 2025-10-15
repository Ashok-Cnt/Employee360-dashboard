# Data Collector Upgrade Guide

## Overview
The Employee360 data collector has been completely redesigned to provide comprehensive application usage tracking with focus time analysis, category-based insights, and system resource monitoring.

---

## What's New

### 1. **Enhanced Time Tracking**
- **Per-Application Time Tracking**: Track exact time spent on each application
- **Focus vs Background Time**: Distinguish between when apps have focus vs running in background
- **Hourly Granularity**: Track usage patterns by hour of day
- **Daily Aggregation**: Automatic daily summaries with category breakdowns

### 2. **Application Categorization**
Applications are now automatically categorized into:
- **Productivity**: Office apps, note-taking, document editors
- **Development**: IDEs, code editors, database tools
- **Communication**: Email, chat, video conferencing
- **Media**: Music, video players, design tools
- **Browsers**: Web browsers
- **Utilities**: System tools, file managers
- **Non-Work**: Gaming, social media, entertainment

### 3. **Focus vs Distraction Analysis**
- **Focus Apps**: Development tools, office apps, professional tools
- **Distraction Apps**: Social media, entertainment, gaming
- Calculate productivity scores based on focus time percentage

### 4. **System Resource Monitoring**
- **CPU Usage**: Track system-wide CPU usage over time
- **Memory Usage**: Monitor memory consumption patterns
- **Correlation Analysis**: See how system load relates to app usage

### 5. **Multi-Level Data Storage**

#### Real-Time Layer (24-hour retention)
- `application_activity`: Snapshots every 30 seconds
- Live view of what's currently running
- Used for dashboard real-time display

#### Hourly Aggregation (30-day retention)
- `app_time_tracking`: Time spent per app per hour
- `hourly_summary`: Hourly rollups for pattern analysis
- Used for time-of-day productivity patterns

#### Daily Summaries (1-year retention)
- `daily_summary`: Complete daily rollup
- Focus vs distraction breakdown
- Category-based analysis
- Top apps list
- System resource averages

---

## Key Features

### 1. Time Tracking
```javascript
// Each app tracked with:
{
  total_time_seconds: 3600,        // 1 hour total running
  focused_time_seconds: 2400,      // 40 minutes with focus
  background_time_seconds: 1200    // 20 minutes in background
}
```

### 2. Focus Time Calculation
- Only counts time when app has window focus
- Distinguishes productive focus (coding) from distraction (social media)
- Provides productivity score = (focus_time / total_time) × 100

### 3. Category Insights
- See time breakdown by category
- Identify which categories dominate your day
- Compare productivity categories vs non-work categories

### 4. Hourly Patterns
- Identify most productive hours of day
- See when distractions are highest
- Optimize work schedule based on patterns

### 5. System Performance Correlation
- See if productivity drops when system is slow
- Identify resource-intensive applications
- Optimize system for better performance

---

## Database Collections

### New Collections Created

1. **`app_time_tracking`**
   - Tracks time per application per hour
   - Incremental updates (efficient)
   - Includes focus/background breakdown

2. **`daily_summary`**
   - One document per user per day
   - Complete productivity analysis
   - Category breakdown
   - Top apps list

3. **`hourly_summary`**
   - One document per user per hour
   - Focus vs distraction by hour
   - App count tracking

4. **`system_metrics`**
   - CPU and memory samples
   - Every 30 seconds
   - 7-day retention

### Modified Collections

- **`application_activity`**: Now includes category, focus indicators, and is used for real-time display only (24-hour retention)

---

## Usage Scenarios

### Scenario 1: Daily Productivity Report
**Question**: How productive was I today?

**Query**:
```javascript
db.daily_summary.findOne({
  user_id: "john_doe",
  date: ISODate("2025-10-14T00:00:00Z")
})

// Returns:
{
  total_time_seconds: 28800,        // 8 hours
  focus_time_seconds: 21600,        // 6 hours on focus apps
  distraction_time_seconds: 3600,   // 1 hour on distractions
  category_breakdown: {
    development: 18000,             // 5 hours coding
    communication: 3600,            // 1 hour on Teams/Email
    "non-work": 3600               // 1 hour on social media
  }
}
```

### Scenario 2: Time Spent on Specific App
**Question**: How much time did I spend in VS Code this week?

**Query**:
```javascript
db.app_time_tracking.aggregate([
  {
    $match: {
      user_id: "john_doe",
      application: "Visual Studio Code",
      date: { $gte: ISODate("2025-10-07T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: null,
      total_hours: { $sum: { $divide: ["$total_time_seconds", 3600] } },
      focused_hours: { $sum: { $divide: ["$focused_time_seconds", 3600] } }
    }
  }
])
```

### Scenario 3: Best Hours for Focus
**Question**: When am I most productive during the day?

**Query**:
```javascript
db.hourly_summary.aggregate([
  {
    $match: {
      user_id: "john_doe",
      date: { $gte: ISODate("2025-09-14T00:00:00Z") } // Last 30 days
    }
  },
  {
    $group: {
      _id: "$hour",
      avg_focus_minutes: { $avg: { $divide: ["$focus_time_seconds", 60] } }
    }
  },
  { $sort: { avg_focus_minutes: -1 } },
  { $limit: 5 }
])

// Example result: Most productive at 9 AM, 10 AM, 2 PM
```

### Scenario 4: Category Distribution
**Question**: What percentage of my time is spent on different activities?

**Query**:
```javascript
db.daily_summary.findOne({
  user_id: "john_doe",
  date: ISODate("2025-10-14T00:00:00Z")
})

// Calculate percentages from category_breakdown
```

### Scenario 5: System Performance Impact
**Question**: Does system performance affect my productivity?

**Query**:
```javascript
// Join daily_summary with system_metrics to correlate
db.daily_summary.aggregate([
  {
    $match: {
      user_id: "john_doe",
      date: { $gte: ISODate("2025-10-07T00:00:00Z") }
    }
  },
  {
    $project: {
      date: 1,
      productivity_score: {
        $multiply: [
          { $divide: ["$focus_time_seconds", "$total_time_seconds"] },
          100
        ]
      },
      avg_cpu_usage_percent: 1,
      avg_memory_usage_mb: 1
    }
  }
])
```

---

## Configuration

### Environment Variables
```bash
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=employee360

# Collection interval (seconds)
COLLECTION_INTERVAL_SECONDS=30

# User identification
USER_ID=john_doe  # Or auto-detected from system
```

### Config.ini Settings
```ini
[tracking_enabled]
enabled = true
max_applications = 50

[memory_thresholds]
minimum_memory_mb = 10

[exclusions]
excluded_processes = system,registry,svchost

[specific_applications]
notepad = true
chrome = true
```

---

## API Endpoints to Implement

### Recommended Backend Endpoints

1. **GET /api/activity/daily/:date**
   - Returns daily summary for specified date
   - Includes focus vs distraction breakdown
   - Category distribution
   - Top apps

2. **GET /api/activity/hourly/:date**
   - Returns hourly breakdown for a day
   - Focus patterns by hour
   - App count by hour

3. **GET /api/activity/apps/:appName**
   - Time spent on specific app
   - Focus vs background time
   - Daily/hourly breakdown

4. **GET /api/activity/categories**
   - Time distribution by category
   - Week or month view
   - Trend analysis

5. **GET /api/activity/realtime**
   - Currently running apps
   - Real-time resource usage
   - Current focus app

6. **GET /api/activity/productivity-score**
   - Daily productivity score
   - Weekly trend
   - Comparison with previous periods

7. **GET /api/system/metrics**
   - CPU and memory trends
   - Correlation with productivity
   - Resource usage by app

---

## Visualization Ideas

### Dashboard Widgets

1. **Focus Time Card**
   - Today's focus hours
   - Percentage vs total time
   - Trend indicator (up/down vs yesterday)

2. **Category Pie Chart**
   - Time distribution by category
   - Interactive - click to drill down

3. **Hourly Heatmap**
   - Rows: Days of week
   - Columns: Hours of day
   - Color: Focus intensity

4. **Top Apps Bar Chart**
   - Top 10 apps by time spent
   - Horizontal bars showing hours
   - Color-coded by category

5. **Focus vs Distraction Timeline**
   - Line chart showing both over time
   - 7-day or 30-day view
   - Cumulative or daily

6. **System Performance Gauge**
   - Current CPU/Memory
   - Color-coded (green/yellow/red)
   - Comparison to average

7. **Productivity Score**
   - Big number display
   - Weekly average
   - Trend arrow

---

## Migration from Old Schema

### Step 1: Backup Existing Data
```bash
mongodump --db employee360 --out backup_$(date +%Y%m%d)
```

### Step 2: Run Data Collector
- New collector will create new collections automatically
- Old `application_activity` collection will continue to work
- New data starts accumulating in new schema

### Step 3: Optional - Backfill Historical Data
```javascript
// Script to convert old application_activity to new schema
// Group by user, date, hour, application
// Calculate totals and insert into app_time_tracking
```

### Step 4: Update Frontend
- Update API calls to use new endpoints
- Add new visualization components
- Test with real data

---

## Troubleshooting

### Issue: No data in new collections
**Solution**: Check that collector is running with new code. Verify MongoDB connection.

### Issue: Focus time is always zero
**Solution**: Ensure foreground window detection is working. Check Windows permissions.

### Issue: Categories show as "uncategorized"
**Solution**: Add app to APP_CATEGORIES dictionary in collector.py

### Issue: High database growth
**Solution**: Verify cleanup tasks are running. Check retention settings.

### Issue: System metrics missing
**Solution**: Ensure psutil is installed and has required permissions.

---

## Performance Optimization

### Indexes to Create
```javascript
// app_time_tracking
db.app_time_tracking.createIndex({ user_id: 1, date: 1, hour: 1, application: 1 }, { unique: true })
db.app_time_tracking.createIndex({ user_id: 1, date: -1 })

// daily_summary
db.daily_summary.createIndex({ user_id: 1, date: -1 }, { unique: true })

// hourly_summary
db.hourly_summary.createIndex({ user_id: 1, date: 1, hour: 1 }, { unique: true })

// system_metrics
db.system_metrics.createIndex({ user_id: 1, timestamp: -1 })
db.system_metrics.createIndex({ timestamp: 1 }) // For cleanup

// application_activity
db.application_activity.createIndex({ user_id: 1, timestamp: -1 })
db.application_activity.createIndex({ timestamp: 1 }) // For cleanup
```

### Query Optimization
- Use daily_summary for date range queries (not app_time_tracking)
- Use hourly_summary for hour-of-day analysis (not app_time_tracking)
- Use application_activity only for real-time data (last hour)

---

## Future Enhancements

1. **Smart Categorization**: Use AI to categorize unknown apps
2. **Website Tracking**: Monitor URLs in browsers (requires browser extension)
3. **Goals & Alerts**: Set focus time goals, get alerts when off-track
4. **Team Analytics**: Aggregate data across team (anonymized)
5. **Recommendations**: AI-powered suggestions to improve productivity
6. **Integration**: Export to time tracking tools (Toggl, Harvest, etc.)

---

## Support

For issues or questions:
1. Check DATABASE_SCHEMA.md for collection structures
2. Review logs in collector output
3. Verify MongoDB indexes are created
4. Check system permissions for process monitoring

