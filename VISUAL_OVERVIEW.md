# Enhanced Data Collector: Visual Overview

## 🎯 Key Features Summary

### 1️⃣ **Time Tracking**
```
┌─────────────────────────────────────────────────┐
│  Application Time Tracking                     │
├─────────────────────────────────────────────────┤
│  Visual Studio Code                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━ 5h 30m               │
│  ├─ Focused: 4h 45m (86%)                       │
│  └─ Background: 45m (14%)                       │
│                                                  │
│  Google Chrome                                   │
│  ━━━━━━━━━━━━ 2h 15m                            │
│  ├─ Focused: 1h 30m (67%)                       │
│  └─ Background: 45m (33%)                       │
└─────────────────────────────────────────────────┘
```

### 2️⃣ **Focus vs Distraction**
```
┌─────────────────────────────────────────────────┐
│  Daily Productivity Analysis                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Focus Time:        █████████████░ 6h 30m (81%) │
│  Distraction Time:  ██░            1h 30m (19%) │
│                                                  │
│  Productivity Score: 81% 📈                      │
└─────────────────────────────────────────────────┘
```

### 3️⃣ **Category Breakdown**
```
┌─────────────────────────────────────────────────┐
│  Time by Category                                │
├─────────────────────────────────────────────────┤
│  Development      ██████████████████ 45%         │
│  Browsers         ████████ 20%                   │
│  Communication    ██████ 15%                     │
│  Productivity     █████ 12%                      │
│  Media            ███ 8%                         │
└─────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Architecture

```
┌──────────────────┐
│  User Activity   │
│  (Every 30 sec)  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│         Data Collector (collector.py)      │
├────────────────────────────────────────────┤
│  1. Detect focused application              │
│  2. Scan all running applications           │
│  3. Measure CPU & Memory                    │
│  4. Categorize applications                 │
│  5. Calculate focus/distraction             │
└────────┬───────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼
┌────────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ application_   │  │ app_time_     │  │ daily_       │  │ system_      │
│ activity       │  │ tracking      │  │ summary      │  │ metrics      │
├────────────────┤  ├───────────────┤  ├──────────────┤  ├──────────────┤
│ Real-time      │  │ Hourly time   │  │ Daily rollup │  │ CPU/Memory   │
│ snapshots      │  │ per app       │  │ & analytics  │  │ samples      │
│ (24h)          │  │ (90 days)     │  │ (1 year)     │  │ (7 days)     │
└────────────────┘  └───────────────┘  └──────────────┘  └──────────────┘
         │                  │                  │                  │
         └──────────────────┴──────────────────┴──────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │   Backend API          │
                        │   (Express/FastAPI)    │
                        └────────┬───────────────┘
                                 │
                                 ▼
                        ┌────────────────────────┐
                        │   Frontend Dashboard   │
                        │   (React)              │
                        └────────────────────────┘
```

---

## 🗄️ Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB Database: employee360                                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ application_activity │  │  app_time_tracking   │  │   daily_summary      │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ • user_id            │  │ • user_id            │  │ • user_id            │
│ • application        │  │ • application        │  │ • date               │
│ • category           │  │ • date + hour        │  │ • total_time         │
│ • is_focused         │  │ • total_time         │  │ • focus_time         │
│ • memory_usage       │  │ • focused_time       │  │ • distraction_time   │
│ • cpu_usage          │  │ • background_time    │  │ • category_breakdown │
│ • timestamp          │  │ • category           │  │ • top_apps[]         │
│                      │  │ • is_focus_app       │  │ • avg_cpu            │
│ Retention: 24 hours  │  │ • is_distraction     │  │ • avg_memory         │
│                      │  │                      │  │                      │
│ Purpose: Real-time   │  │ Retention: 90 days   │  │ Retention: 1 year    │
│ display & streaming  │  │                      │  │                      │
│                      │  │ Purpose: Time series │  │ Purpose: Historical  │
│                      │  │ & hourly analysis    │  │ trends & reporting   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  hourly_summary      │  │   system_metrics     │
├──────────────────────┤  ├──────────────────────┤
│ • user_id            │  │ • user_id            │
│ • date + hour        │  │ • timestamp          │
│ • total_time         │  │ • cpu_usage_percent  │
│ • focus_time         │  │ • memory_usage_mb    │
│ • distraction_time   │  │                      │
│ • app_count          │  │ Retention: 7 days    │
│                      │  │                      │
│ Retention: 30 days   │  │ Purpose: System      │
│                      │  │ performance tracking │
│ Purpose: Hour-of-day │  │ & correlation        │
│ patterns             │  │ analysis             │
└──────────────────────┘  └──────────────────────┘
```

---

## 🎨 Recommended Dashboard Widgets

### Widget Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Employee360 Dashboard                        [User] [Settings]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Focus Time   │  │ Productivity │  │ Active Hours │           │
│  │              │  │  Score       │  │              │           │
│  │   6h 30m     │  │              │  │              │           │
│  │   ▲ 15%     │  │     81%      │  │    8.5h      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Focus vs Distraction Timeline                            │   │
│  │                                                            │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │         ▄▄▄                                         │   │   │
│  │  │  ▄▄▄   ██████   ▄▄▄▄▄                     ▄▄▄      │   │   │
│  │  │ █████ ████████ ███████                   █████     │   │   │
│  │  │ Focus ■  Distraction ■  Neutral ░                 │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │  Top Applications       │  │  Category Breakdown         │   │
│  │                         │  │                             │   │
│  │  1. VS Code     5h 30m  │  │      Development  ████████  │   │
│  │  2. Chrome      2h 15m  │  │      Browsers     ████      │   │
│  │  3. Teams       1h 45m  │  │      Communication ███      │   │
│  │  4. Outlook     1h 20m  │  │      Productivity ██        │   │
│  │  5. Slack       0h 55m  │  │      Media        █         │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Productivity Heatmap (Last 7 Days)                       │   │
│  │                                                            │   │
│  │         Mon  Tue  Wed  Thu  Fri  Sat  Sun                 │   │
│  │  09:00  ███  ███  ██   ███  ███  █    ░                   │   │
│  │  11:00  ███  ███  ███  ███  ██   █    ░                   │   │
│  │  13:00  ██   ██   ██   ██   █    ░    ░                   │   │
│  │  15:00  ███  ███  ███  ██   ███  ░    █                   │   │
│  │  17:00  ██   ██   █    ██   █    ░    ░                   │   │
│  │                                                            │   │
│  │  ███ High Focus  ██ Medium  █ Low  ░ Inactive            │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Sample Data Queries

### 1. Today's Productivity Overview
```javascript
db.daily_summary.findOne({
  user_id: "john_doe",
  date: ISODate("2025-10-14T00:00:00Z")
})
```

**Returns:**
```javascript
{
  total_time_seconds: 28800,        // 8 hours
  focus_time_seconds: 21600,        // 6 hours
  distraction_time_seconds: 3600,   // 1 hour
  category_breakdown: {
    development: 18000,             // 5 hours
    communication: 5400,            // 1.5 hours
    browsers: 3600                  // 1 hour
  },
  productivity_score: 75%           // focus / total
}
```

### 2. Week Productivity Trend
```javascript
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
  },
  { $sort: { date: 1 } }
])
```

**Returns:**
```javascript
[
  { date: "2025-10-07", productivity_score: 78 },
  { date: "2025-10-08", productivity_score: 82 },
  { date: "2025-10-09", productivity_score: 75 },
  { date: "2025-10-10", productivity_score: 80 },
  { date: "2025-10-11", productivity_score: 85 }
]
```

### 3. Best Hours for Focus
```javascript
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
      avg_focus_minutes: {
        $avg: { $divide: ["$focus_time_seconds", 60] }
      }
    }
  },
  { $sort: { avg_focus_minutes: -1 } },
  { $limit: 5 }
])
```

**Returns:**
```javascript
[
  { hour: 10, avg_focus_minutes: 45 },  // 10 AM
  { hour: 11, avg_focus_minutes: 42 },  // 11 AM
  { hour: 14, avg_focus_minutes: 38 },  // 2 PM
  { hour: 9,  avg_focus_minutes: 35 },  // 9 AM
  { hour: 15, avg_focus_minutes: 32 }   // 3 PM
]
```

---

## 🚀 Getting Started Checklist

- [ ] **Install Dependencies**
  ```powershell
  pip install motor psutil python-dotenv
  ```

- [ ] **Start MongoDB**
  ```powershell
  mongod --dbpath C:\data\db
  ```

- [ ] **Configure Environment**
  ```bash
  # .env file
  MONGODB_URI=mongodb://localhost:27017
  DATABASE_NAME=employee360
  COLLECTION_INTERVAL_SECONDS=30
  ```

- [ ] **Run Collector**
  ```powershell
  python data-collector/collector.py
  ```

- [ ] **Verify Data Collection**
  - Check MongoDB collections
  - Verify real-time activity
  - Check daily summary updates

- [ ] **Create Indexes** (for performance)
  ```javascript
  db.app_time_tracking.createIndex({ user_id: 1, date: 1, hour: 1, application: 1 })
  db.daily_summary.createIndex({ user_id: 1, date: -1 })
  db.hourly_summary.createIndex({ user_id: 1, date: 1, hour: 1 })
  ```

- [ ] **Build API Endpoints**
  - GET /api/activity/daily/:date
  - GET /api/activity/hourly/:date
  - GET /api/activity/realtime

- [ ] **Create Frontend Visualizations**
  - Focus time dashboard
  - Category charts
  - Productivity heatmap

---

## 📚 Additional Resources

- **DATABASE_SCHEMA.md**: Complete database schema documentation
- **COLLECTOR_UPGRADE_GUIDE.md**: Detailed upgrade and migration guide
- **APP_CATEGORIES_REFERENCE.md**: Application category definitions
- **TESTING_GUIDE.md**: Step-by-step testing procedures

---

## 🎯 Success Metrics

After implementation, you should be able to answer:

✅ **How much time do I spend on focused work?**
✅ **Which applications consume most of my time?**
✅ **When am I most productive during the day?**
✅ **What percentage of my time is productive vs distracted?**
✅ **How does my productivity trend over time?**
✅ **Does system performance impact my work?**

---

## 💡 Tips for Best Results

1. **Run continuously**: Collector should run all day for accurate data
2. **Regular intervals**: 30-second collection provides good balance
3. **Customize categories**: Add your commonly used apps
4. **Review weekly**: Check productivity trends each week
5. **Set goals**: Use focus time data to set improvement targets

