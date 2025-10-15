# Employee360 Database Schema

## Overview
This document describes the MongoDB database schema for the Employee360 application tracking system.

---

## Collections

### 1. `application_activity` (Real-time Activity)
**Purpose**: Stores real-time snapshots of running applications  
**Retention**: Last 24 hours  
**Update Frequency**: Every 30 seconds (configurable)

```javascript
{
  _id: ObjectId,
  user_id: String,                    // Username of the tracked user
  application: String,                // Friendly app name (e.g., "Visual Studio Code")
  process_name: String,               // Original process name (e.g., "code")
  window_title: String,               // Current window title
  category: String,                   // App category: productivity, development, communication, etc.
  is_focus_app: Boolean,              // True if this is a focus/productivity app
  is_distraction_app: Boolean,        // True if this is a distraction app
  timestamp: ISODate,                 // When this snapshot was taken
  duration_seconds: Number,           // Collection interval (typically 30 seconds)
  memory_usage_mb: Number,            // Memory usage in MB
  cpu_usage_percent: Number,          // CPU usage percentage
  is_active: Boolean,                 // True if currently running
  is_focused: Boolean,                // True if this app has focus
  last_seen: ISODate,                 // Last time this app was seen
  process_count: Number,              // Number of processes for this app
  pids: [Number]                      // Array of process IDs
}
```

**Indexes**:
- `{ user_id: 1, timestamp: -1 }`
- `{ user_id: 1, application: 1 }`
- `{ timestamp: 1 }` (for cleanup)

---

### 2. `app_time_tracking` (Hourly Time Tracking)
**Purpose**: Aggregates time spent per application per hour  
**Retention**: 90 days  
**Update Frequency**: Real-time incremental updates

```javascript
{
  _id: ObjectId,
  user_id: String,                    // Username
  application: String,                // Application name
  category: String,                   // App category
  is_focus_app: Boolean,              // Focus app indicator
  is_distraction_app: Boolean,        // Distraction app indicator
  date: ISODate,                      // Date (midnight UTC)
  hour: Number,                       // Hour of day (0-23)
  total_time_seconds: Number,         // Total time app was running
  focused_time_seconds: Number,       // Time when app had focus
  background_time_seconds: Number,    // Time when app ran in background
  last_updated: ISODate               // Last update timestamp
}
```

**Indexes**:
- `{ user_id: 1, date: 1, hour: 1, application: 1 }` (unique)
- `{ user_id: 1, date: -1 }`

**Example Queries**:
```javascript
// Get all apps used today
db.app_time_tracking.find({
  user_id: "john_doe",
  date: ISODate("2025-10-14T00:00:00Z")
})

// Get focused time for Visual Studio Code today
db.app_time_tracking.aggregate([
  {
    $match: {
      user_id: "john_doe",
      application: "Visual Studio Code",
      date: ISODate("2025-10-14T00:00:00Z")
    }
  },
  {
    $group: {
      _id: null,
      total_focused_hours: { $sum: { $divide: ["$focused_time_seconds", 3600] } }
    }
  }
])
```

---

### 3. `daily_summary` (Daily Aggregated Summary)
**Purpose**: Daily rollup of all activity metrics  
**Retention**: 1 year  
**Update Frequency**: Updated every collection cycle (continuously updated)

```javascript
{
  _id: ObjectId,
  user_id: String,                    // Username
  date: ISODate,                      // Date (midnight UTC)
  total_time_seconds: Number,         // Total tracked time for the day
  total_focused_time_seconds: Number, // Total time with any app focused
  focus_time_seconds: Number,         // Time spent on focus apps
  distraction_time_seconds: Number,   // Time spent on distraction apps
  category_breakdown: {               // Time per category
    productivity: Number,
    development: Number,
    communication: Number,
    browsers: Number,
    media: Number,
    utilities: Number,
    "non-work": Number,
    uncategorized: Number
  },
  top_apps: [                         // Top 10 apps by time
    {
      application: String,
      total_time_seconds: Number,
      focused_time_seconds: Number,
      category: String,
      is_focus_app: Boolean,
      is_distraction_app: Boolean
    }
  ],
  avg_cpu_usage_percent: Number,      // Average CPU usage for the day
  avg_memory_usage_mb: Number,        // Average memory usage for the day
  last_updated: ISODate               // Last update timestamp
}
```

**Indexes**:
- `{ user_id: 1, date: -1 }` (unique)

**Example Queries**:
```javascript
// Get focus vs distraction time for last 7 days
db.daily_summary.find({
  user_id: "john_doe",
  date: { $gte: ISODate("2025-10-07T00:00:00Z") }
}).sort({ date: 1 })

// Calculate productivity score
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
      }
    }
  }
])
```

---

### 4. `hourly_summary` (Hourly Aggregated Summary)
**Purpose**: Hourly rollup for time-of-day analysis  
**Retention**: 30 days  
**Update Frequency**: Updated every collection cycle

```javascript
{
  _id: ObjectId,
  user_id: String,                    // Username
  date: ISODate,                      // Date (midnight UTC)
  hour: Number,                       // Hour of day (0-23)
  total_time_seconds: Number,         // Total tracked time for the hour
  focus_time_seconds: Number,         // Time on focus apps
  distraction_time_seconds: Number,   // Time on distraction apps
  app_count: Number,                  // Number of different apps used
  last_updated: ISODate               // Last update timestamp
}
```

**Indexes**:
- `{ user_id: 1, date: 1, hour: 1 }` (unique)
- `{ date: 1, hour: 1 }`

**Example Queries**:
```javascript
// Get productivity pattern by hour of day (average over last 30 days)
db.hourly_summary.aggregate([
  {
    $match: {
      user_id: "john_doe",
      date: { $gte: ISODate("2025-09-14T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: "$hour",
      avg_focus_minutes: { $avg: { $divide: ["$focus_time_seconds", 60] } },
      avg_distraction_minutes: { $avg: { $divide: ["$distraction_time_seconds", 60] } }
    }
  },
  { $sort: { _id: 1 } }
])
```

---

### 5. `system_metrics` (System Resource Metrics)
**Purpose**: Track system-level CPU and memory usage  
**Retention**: 7 days  
**Update Frequency**: Every 30 seconds

```javascript
{
  _id: ObjectId,
  user_id: String,                    // Username
  timestamp: ISODate,                 // Metric timestamp
  date: ISODate,                      // Date (midnight UTC)
  hour: Number,                       // Hour of day (0-23)
  cpu_usage_percent: Number,          // System CPU usage %
  memory_usage_mb: Number             // System memory usage in MB
}
```

**Indexes**:
- `{ user_id: 1, timestamp: -1 }`
- `{ timestamp: 1 }` (for cleanup)

**Example Queries**:
```javascript
// Get CPU usage trend for today
db.system_metrics.find({
  user_id: "john_doe",
  date: ISODate("2025-10-14T00:00:00Z")
}).sort({ timestamp: 1 })

// Calculate average system load by hour
db.system_metrics.aggregate([
  {
    $match: {
      user_id: "john_doe",
      date: ISODate("2025-10-14T00:00:00Z")
    }
  },
  {
    $group: {
      _id: "$hour",
      avg_cpu: { $avg: "$cpu_usage_percent" },
      avg_memory_mb: { $avg: "$memory_usage_mb" }
    }
  },
  { $sort: { _id: 1 } }
])
```

---

## Application Categories

### Category Definitions

1. **productivity**: Microsoft Office apps, note-taking, document editors
2. **development**: IDEs, code editors, database tools, API clients
3. **communication**: Email, chat, video conferencing
4. **media**: Music players, video players, image/video editors
5. **browsers**: Web browsers (may contain work or non-work activity)
6. **utilities**: System tools, file managers, compression tools
7. **non-work**: Gaming, social media, entertainment
8. **uncategorized**: Apps not in predefined categories

### Focus vs Distraction Classification

**Focus Apps** (Productivity-oriented):
- Development tools (VS Code, IDEs)
- Microsoft Office (Word, Excel, PowerPoint)
- Design tools (Photoshop, Illustrator)
- Database/API tools (MongoDB Compass, Postman)

**Distraction Apps** (Non-work-oriented):
- Social media (Facebook, Instagram, Twitter, Reddit, TikTok)
- Entertainment (YouTube, Netflix, gaming platforms)
- Messaging (Discord, WhatsApp, Telegram - when not work-related)

---

## Data Collection Flow

```
1. Every 30 seconds:
   ├─ Detect foreground (focused) application
   ├─ Scan all running applications
   ├─ Calculate system metrics (CPU, Memory)
   │
   ├─ Store in `application_activity` (real-time snapshot)
   │
   ├─ Update `app_time_tracking` (hourly aggregation)
   │   ├─ Increment total_time_seconds
   │   ├─ Increment focused_time_seconds (if focused)
   │   └─ Increment background_time_seconds (if not focused)
   │
   ├─ Store in `system_metrics`
   │
   ├─ Update `daily_summary` (rollup calculation)
   │   ├─ Aggregate all apps for the day
   │   ├─ Calculate focus vs distraction time
   │   ├─ Calculate category breakdown
   │   └─ Calculate system averages
   │
   └─ Update `hourly_summary` (hourly rollup)
       ├─ Aggregate apps for current hour
       └─ Calculate focus vs distraction time

2. Cleanup tasks:
   ├─ `application_activity`: Delete records older than 24 hours
   ├─ `system_metrics`: Delete records older than 7 days
   ├─ `app_time_tracking`: Delete records older than 90 days (configurable)
   └─ `daily_summary`: Keep 1 year (configurable)
```

---

## API Query Examples

### Get Daily Focus Report
```javascript
db.daily_summary.findOne({
  user_id: "john_doe",
  date: ISODate("2025-10-14T00:00:00Z")
}, {
  focus_time_seconds: 1,
  distraction_time_seconds: 1,
  category_breakdown: 1,
  top_apps: 1
})
```

### Get Week Productivity Trend
```javascript
db.daily_summary.aggregate([
  {
    $match: {
      user_id: "john_doe",
      date: { 
        $gte: ISODate("2025-10-07T00:00:00Z"),
        $lte: ISODate("2025-10-14T00:00:00Z")
      }
    }
  },
  {
    $project: {
      date: 1,
      productivity_percentage: {
        $multiply: [
          { $divide: ["$focus_time_seconds", "$total_time_seconds"] },
          100
        ]
      },
      focus_hours: { $divide: ["$focus_time_seconds", 3600] },
      distraction_hours: { $divide: ["$distraction_time_seconds", 3600] }
    }
  },
  { $sort: { date: 1 } }
])
```

### Get Most Used Apps This Week
```javascript
db.app_time_tracking.aggregate([
  {
    $match: {
      user_id: "john_doe",
      date: { $gte: ISODate("2025-10-07T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: "$application",
      total_hours: { $sum: { $divide: ["$total_time_seconds", 3600] } },
      category: { $first: "$category" }
    }
  },
  { $sort: { total_hours: -1 } },
  { $limit: 10 }
])
```

### Get Real-time Currently Active Apps
```javascript
db.application_activity.find({
  user_id: "john_doe",
  is_active: true,
  timestamp: { 
    $gte: new Date(Date.now() - 60000) // Last 60 seconds
  }
}).sort({ is_focused: -1, memory_usage_mb: -1 })
```

---

## Performance Considerations

1. **Indexes**: All queries use compound indexes for optimal performance
2. **Aggregation**: Daily/hourly summaries prevent expensive real-time aggregations
3. **Data Retention**: Automatic cleanup prevents unbounded growth
4. **Batch Updates**: `app_time_tracking` uses incremental updates ($inc) for efficiency
5. **Sharding Ready**: All collections include `user_id` for horizontal scaling

---

## Migration Notes

If migrating from the old schema:
1. Old `application_activity` records can be used to backfill `app_time_tracking`
2. Run aggregation pipeline to create historical `daily_summary` and `hourly_summary`
3. System metrics are new - no historical data available
4. Category and focus/distraction fields are new - will be assigned based on app name

