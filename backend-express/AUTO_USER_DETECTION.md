# 🎯 Auto-Detection of Logged-In User

## ✅ Enhancement Applied

Your Employee360 backend now **automatically detects the logged-in Windows username** instead of requiring it to be hardcoded in the `.env` file!

---

## 🔧 How It Works

### Previous Behavior (Manual Configuration)
```env
# Had to manually set this in .env
USER_ID=GBS05262
```

**Problem:** 
- Required manual configuration for each user
- Needed to be updated if deployed on different machines
- Error-prone if username didn't match

### New Behavior (Auto-Detection)
```javascript
// Automatically detects from OS
const userId = os.userInfo().username;  // Returns "GBS05262" on your machine
```

**Benefits:**
- ✅ **Zero Configuration** - Works out of the box
- ✅ **Cross-Platform** - Works on Windows, Linux, and Mac
- ✅ **Multi-User Support** - Each user automatically gets their own data
- ✅ **Portable** - No changes needed when deploying to different machines

---

## 🚀 Technical Implementation

### Code Changes

#### 1. Added Auto-Detection Function
```javascript
// backend-express/routes/activity-local.js

const os = require('os');

/**
 * Get the current logged-in username
 * This will automatically detect the Windows/Linux/Mac username
 */
function getLoggedInUsername() {
  // Try environment variable first (for override), then use OS username
  return process.env.USER_ID || os.userInfo().username || 'Admin';
}
```

#### 2. Updated All Endpoints
Replaced all instances of:
```javascript
const userId = req.query.user_id || process.env.USER_ID || 'Admin';
```

With:
```javascript
const userId = req.query.user_id || getLoggedInUsername();
```

**Affected Endpoints:**
- `/api/activity/today`
- `/api/activity/current`
- `/api/activity/daily-summary/:date`
- `/api/activity/raw-data/:date`
- `/api/activity/stats`

---

## 📝 Configuration Options

### Option 1: Auto-Detection (Recommended)
**No configuration needed!** The backend automatically uses `os.userInfo().username`

**Your detected username:** `GBS05262`

### Option 2: Manual Override (Optional)
If you need to override the auto-detected username, uncomment in `.env`:

```env
# Uncomment to override auto-detection
USER_ID=CustomUsername
```

### Option 3: Per-Request Override (Advanced)
You can still override per API request using query parameters:

```
GET /api/activity/today?user_id=AnotherUser
```

---

## 🎯 Priority Order

The system checks for the username in this order:

1. **Query Parameter** - `?user_id=SomeUser` (highest priority)
2. **Environment Variable** - `USER_ID=SomeUser` in `.env`
3. **OS Auto-Detection** - `os.userInfo().username` (your login name)
4. **Fallback** - `'Admin'` (if all else fails)

---

## 🧪 Testing

### Verify Auto-Detection
Run this command to see what username is detected:
```powershell
node -e "console.log('Detected Username:', require('os').userInfo().username)"
```

**Expected output:** `Detected Username: GBS05262`

### Test API Endpoints
```powershell
# Should automatically use GBS05262
Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/activity/today"

# Manual override
Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/activity/today?user_id=AnotherUser"
```

---

## 🌍 Cross-Platform Support

### Windows
```javascript
os.userInfo().username  // Returns: "GBS05262"
```

### Linux
```javascript
os.userInfo().username  // Returns: "john_doe"
```

### macOS
```javascript
os.userInfo().username  // Returns: "johndoe"
```

---

## 📊 File Naming Convention

The system automatically looks for files matching this pattern:
```
activity_{DATE}_{USERNAME}.jsonl
```

**Examples:**
- Windows: `activity_2025-10-15_GBS05262.jsonl`
- Linux: `activity_2025-10-15_john_doe.jsonl`
- Mac: `activity_2025-10-15_johndoe.jsonl`

---

## 🔐 Multi-User Scenarios

### Scenario 1: Single Machine, Single User
✅ **Works automatically** - Uses your Windows username

### Scenario 2: Single Machine, Multiple Users
✅ **Works automatically** - Each Windows user gets their own data files
- User A logs in → Reads `activity_2025-10-15_UserA.jsonl`
- User B logs in → Reads `activity_2025-10-15_UserB.jsonl`

### Scenario 3: Shared Data Collector
If you need multiple users to share the same data collector:
1. Set `USER_ID=SharedUser` in data collector
2. Set `USER_ID=SharedUser` in backend `.env` (to override auto-detection)

---

## 🎨 Updated `.env` File

```env
# MongoDB Configuration
USE_LOCAL_DB=false
MONGODB_ATLAS_URI=mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/
ATLAS_DATABASE_NAME=employee360

# Server Configuration
PORT=8001
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# User ID - NOW AUTO-DETECTED!
# NOTE: This is automatically detected from your Windows/Linux/Mac username
# You can override it here if needed
# Leave commented out to use auto-detection (recommended)
# USER_ID=GBS05262

# Data directory
DATA_DIR=../data-collector/activity_data
```

---

## ⚡ Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **Setup** | Manual config required | Zero config |
| **Portability** | Machine-specific | Works anywhere |
| **Multi-User** | Manual per user | Automatic |
| **Maintenance** | Update for each user | None needed |
| **Flexibility** | Fixed username | Auto + Override option |

---

## 🎯 Use Cases

### ✅ Personal Use
- Works out of the box with your Windows username
- No configuration needed

### ✅ Team Deployment
- Each team member automatically tracked separately
- No need to configure usernames per machine

### ✅ Enterprise Deployment
- Can override with company employee IDs via `.env`
- Supports centralized configuration

### ✅ Testing/Development
- Can use query parameters to test different user scenarios
- Easy to switch between test users

---

## 📚 API Documentation Updated

### GET /api/activity/today

**Auto-detected behavior:**
```bash
# Uses logged-in username (GBS05262)
curl http://127.0.0.1:8001/api/activity/today
```

**Override with query parameter:**
```bash
# Uses specific username
curl http://127.0.0.1:8001/api/activity/today?user_id=AnotherUser
```

**Response:**
```json
{
  "timestamp": "2025-10-15T12:31:31.655542Z",
  "system": { /* system metrics */ },
  "apps": [ /* application list */ ]
}
```

---

## 🐛 Troubleshooting

### Issue: "No data available"

**Check 1: Verify detected username**
```powershell
node -e "console.log(require('os').userInfo().username)"
```

**Check 2: Verify file exists**
```powershell
$username = node -e "console.log(require('os').userInfo().username)"
$today = Get-Date -Format "yyyy-MM-dd"
Test-Path "c:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector\activity_data\activity_${today}_${username}.jsonl"
```

**Check 3: Check data collector configuration**
- Data collector should create files with the same username
- Verify data collector is using the correct username

---

## ✨ Summary

### What Changed
- ✅ Backend now auto-detects Windows username using `os.userInfo().username`
- ✅ No need to set `USER_ID` in `.env` file
- ✅ Still supports manual override if needed
- ✅ All API endpoints updated to use auto-detection

### What to Do
- ✅ **Nothing!** It works automatically
- ✅ Backend will automatically use `GBS05262` on your machine
- ✅ Files will be correctly matched: `activity_2025-10-15_GBS05262.jsonl`

### Result
**Your dashboard now works out of the box without any username configuration! 🎉**

---

**Last Updated:** October 15, 2025  
**Status:** ✅ Implemented and Tested
