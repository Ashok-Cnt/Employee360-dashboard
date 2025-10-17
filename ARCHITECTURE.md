# Employee360 Architecture - JSON Storage

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMPLOYEE360 DASHBOARD                        │
│                         (Frontend - React)                       │
│                      http://localhost:3000                       │
└────────────────────┬────────────────────────────────────────────┘
                     │ REST API Calls
                     │ (Fetch/Axios)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXPRESS.JS API SERVER                           │
│                  (server-json.js)                                │
│                  http://localhost:8001                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API ROUTES                                               │  │
│  │  ├─ /api/users          (users-json.js)                  │  │
│  │  ├─ /api/apps           (applications-json.js)           │  │
│  │  ├─ /api/activity       (activity-local-json.js)         │  │
│  │  ├─ /api/ai-suggestions (ai-suggestions-json.js)         │  │
│  │  └─ /api/alerts         (alerts.js)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MIDDLEWARE                                               │  │
│  │  ├─ CORS                                                  │  │
│  │  ├─ Helmet (Security)                                     │  │
│  │  ├─ Morgan (Logging)                                      │  │
│  │  └─ JSON Parser                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │ File I/O Operations
                     │ (fs.promises)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL JSON STORAGE                            │
│                    backend-express/data/                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  users.json                                               │  │
│  │  └─ User profiles, system info                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  application_activity.json                                │  │
│  │  └─ Activity logs, memory, CPU usage                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ai_suggestions.json                                      │  │
│  │  └─ AI-generated insights & recommendations              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                     ▲
                     │ POST /api/activity
                     │ (Activity data)
                     │
┌─────────────────────────────────────────────────────────────────┐
│                    DATA COLLECTOR                                │
│                    (Python Script)                               │
│                    collector_jsonl.py                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MONITORS                                                 │  │
│  │  ├─ Active Applications                                   │  │
│  │  ├─ Memory Usage                                          │  │
│  │  ├─ CPU Usage                                             │  │
│  │  ├─ Focused Window                                        │  │
│  │  └─ Context Switches                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ALERT ENGINE                                             │  │
│  │  └─ Desktop Notifications (plyer)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                     │
                     │ Reads alert rules from
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              data-collector/alert_rules.json                     │
│              └─ Alert configurations & thresholds               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Activity Tracking Flow
```
User Activity → Data Collector → POST /api/activity → JSON File → Storage
                      ↓
              Alert Engine Check
                      ↓
         Desktop Notification (if triggered)
```

### 2. Dashboard View Flow
```
User Opens Dashboard → API Request → Express Server → Read JSON File
                                                            ↓
                                                      Process Data
                                                            ↓
Frontend ← JSON Response ← Express Server ← Return Data
    ↓
 Display Charts/Stats
```

### 3. Alert Configuration Flow
```
User Creates Alert → Frontend → POST /api/alerts/rules → JSON File
                                                              ↓
                                              data-collector reads rules
                                                              ↓
                                                    Monitors conditions
```

## Component Details

### Frontend (React)
- **Location**: `frontend/src/`
- **Port**: 3000
- **Purpose**: User interface, charts, analytics
- **Key Pages**:
  - Dashboard (overview)
  - Application Activity
  - Work Patterns
  - Health Metrics
  - AI Insights
  - Alert Rules

### Backend (Express.js)
- **Location**: `backend-express/`
- **Port**: 8001
- **Purpose**: REST API, business logic
- **Key Features**:
  - User management
  - Activity analytics
  - Work pattern analysis
  - AI suggestions
  - Alert rule management

### Data Collector (Python)
- **Location**: `data-collector/`
- **Purpose**: System monitoring, data collection
- **Runs**: Background process (60s intervals)
- **Key Features**:
  - Process monitoring
  - Memory/CPU tracking
  - Alert checking
  - Desktop notifications

### JSON Storage
- **Location**: `backend-express/data/`
- **Format**: JSON arrays
- **Persistence**: File system
- **Backup**: Simple file copy

## API Communication

### REST API Endpoints

#### User Management
```
GET    /api/users              → List all users
GET    /api/users/system-user  → Get current system user
GET    /api/users/:id          → Get specific user
POST   /api/users              → Create/update user
```

#### Application Monitoring
```
GET    /api/apps/current       → Currently active apps
GET    /api/apps/summary       → Usage summary
GET    /api/apps/stats         → Statistics
GET    /api/apps/work-patterns → Work analysis
GET    /api/apps/timeline      → Activity timeline
GET    /api/apps/focused-window → Current focus
GET    /api/apps/top-memory    → Top memory apps
```

#### Activity Logging
```
POST   /api/activity           → Log new activity
GET    /api/activity           → Get activity history
```

#### Alert Management
```
GET    /api/alerts/rules       → List alert rules
POST   /api/alerts/rules       → Create rule
PUT    /api/alerts/rules/:id   → Update rule
DELETE /api/alerts/rules/:id   → Delete rule
POST   /api/alerts/test        → Test notification
```

## Future Architecture (with Oracle SQL)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS API SERVER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  QUERY ROUTER                                             │  │
│  │  ├─ Recent data (< 7 days)  → JSON Files (Fast)         │  │
│  │  └─ Historical data          → Oracle SQL (Scalable)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────┬────────────────────────────────────┬───────────────┘
            │                                    │
            ▼                                    ▼
┌────────────────────────┐        ┌──────────────────────────────┐
│   JSON FILES           │◄───────│  ORACLE SQL DATABASE         │
│   (Recent Data)        │ Sync   │  (Historical Data)           │
│   • Fast access        │ Job    │  • Long-term storage         │
│   • Last 7 days        │ Hourly │  • Unlimited capacity        │
└────────────────────────┘        └──────────────────────────────┘
            ▲                                    ▲
            │                                    │
            └────────────┬───────────────────────┘
                         │ Data Collector posts to both
                         │
                ┌────────────────────┐
                │  DATA COLLECTOR    │
                └────────────────────┘
```

### Benefits of Future Architecture
1. **Fast Queries**: Recent data from JSON (instant)
2. **Unlimited Storage**: Old data in Oracle (terabytes)
3. **No Downtime**: Gradual migration
4. **Best of Both**: Speed + Scale
5. **Simple Backup**: Both sources backed up

---

## Technology Stack

### Frontend
- React 18
- Material-UI (MUI)
- Redux Toolkit
- Recharts (visualization)
- Axios (HTTP client)

### Backend
- Node.js
- Express.js 4.x
- File System (fs.promises)
- UUID (ID generation)

### Data Collector
- Python 3.x
- psutil (system monitoring)
- plyer (desktop notifications)
- requests (HTTP client)

### Storage
- JSON Files (current)
- Oracle SQL (planned)

---

## Deployment

### Development
```bash
# Terminal 1: Backend
npm run start:json

# Terminal 2: Frontend
npm start

# Terminal 3: Data Collector
python collector_jsonl.py
```

### Production
```bash
# Backend (with PM2)
pm2 start server-json.js --name employee360-api

# Frontend (build)
npm run build
serve -s build

# Data Collector (as service)
pythonw collector_jsonl.py
```

---

**Architecture Status**: ✅ **Simplified & Optimized**  
**MongoDB**: ❌ **Removed**  
**Storage**: ✅ **JSON Files**  
**Future Ready**: 🔮 **Oracle SQL Integration**
