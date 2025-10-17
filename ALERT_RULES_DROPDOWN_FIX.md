# 🔔 Alert Rules - Active Applications Dropdown Fix

## 🎯 Problem
The Alert Rules page wasn't showing active applications in the "Target Application" dropdown even though apps were running.

## ✅ What Was Fixed

### Changed API Endpoint
- **Before**: Called `/api/apps/current` (old JSON format - doesn't work)
- **After**: Calls `/api/activity/current` (reads from JSONL files - works!)

### Updated Data Extraction
- **Before**: Expected old format with `app.application` field
- **After**: Reads from snapshot format with `app.title` or `app.name` fields
- **Improvement**: Filters out `background_apps` to show only real applications

---

## 🚀 Testing the Fix

### Step 1: Ensure Backend is Running

Make sure your backend server is running:
```powershell
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\backend-express
node server-json.js
```

You should see:
```
🚀 Employee360 Express server running on http://127.0.0.1:8001
```

---

### Step 2: Verify Data Collector is Running

Your data collector needs to be running for active apps to appear:
```powershell
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector
python activity_monitor.py
```

Open a few applications (Chrome, VS Code, Notepad, etc.) so there's something to monitor.

---

### Step 3: Test the Alert Rules Page

1. **Open the Dashboard**: `http://localhost:3000`

2. **Navigate to Alert Rules** (from sidebar)

3. **Click "Add Alert Rule"** button

4. **Check the Target Application dropdown**:
   - You should see a list of your currently running applications
   - Example: "Visual Studio Code", "Google Chrome", "Microsoft Edge", etc.
   - You should also see "None (System-wide)" option

5. **Test the Refresh Button**:
   - Open a new application (like Notepad)
   - Wait 1 minute for data collector to detect it
   - Click the refresh icon (↻) in the dropdown
   - The new app should appear in the list

---

## 📋 What You Should See

### Dropdown Options:
```
None (System-wide)          <-- For system-wide alerts
─────────────────────────
Bruno
Google Chrome
Microsoft Edge
Microsoft Outlook
Microsoft Teams
Notepad
Visual Studio Code
... (and more)
```

### Helper Text:
```
"X active applications available. Select from taskbar apps or choose system-wide monitoring."
```

### Auto-Refresh:
- List updates automatically every **30 seconds**
- Manual refresh available via refresh button (↻)

---

## 🔍 Troubleshooting

### Issue: Dropdown shows "0 active applications available"

**Cause**: Data collector hasn't created activity data yet

**Solutions**:
1. ✅ Ensure data collector is running
2. ✅ Open several applications (Chrome, VS Code, etc.)
3. ✅ Wait 1 minute for collector to create first snapshot
4. ✅ Click the refresh button in the dropdown

---

### Issue: Dropdown shows "No active applications found"

**Cause**: Backend can't read the JSONL file

**Solutions**:
1. Check backend is running: `http://localhost:8001/health`
2. Test activity endpoint: `http://localhost:8001/api/activity/current`
3. Check if activity file exists:
   ```powershell
   dir C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector\activity_data\*.jsonl
   ```

---

### Issue: Only "None (System-wide)" appears

**Cause**: No applications are currently running or data is old

**Solutions**:
1. Open some applications (Chrome, VS Code, Notepad)
2. Wait 1 minute
3. Click refresh button
4. Check data collector console for errors

---

## 📊 Data Flow

```
1. User opens applications (Chrome, VS Code, etc.)
   ↓
2. Data Collector detects and monitors apps
   ↓
3. Writes to JSONL file every minute
   ↓
4. Backend reads latest snapshot from JSONL
   ↓
5. Frontend fetches from /api/activity/current
   ↓
6. Extracts app titles/names
   ↓
7. Displays in Alert Rules dropdown
```

---

## 🎯 Expected API Response

When you call `http://localhost:8001/api/activity/current`, you should get:

```json
{
  "timestamp": "2025-10-17T08:30:00Z",
  "system": {
    "cpuUsage": 5.2,
    "memoryUsageMB": 24000
  },
  "apps": [
    {
      "name": "Code.exe",
      "title": "Visual Studio Code",
      "category": "Productive",
      "isFocused": true,
      "runningTimeSec": 600,
      "focusDurationSec": 450,
      "memoryUsageMB": 3200
    },
    {
      "name": "chrome.exe",
      "title": "Google Chrome",
      "category": "Browsers",
      "isFocused": false,
      "runningTimeSec": 1800,
      "focusDurationSec": 300,
      "memoryUsageMB": 1200
    }
  ]
}
```

The frontend extracts:
- ✅ `app.title` → "Visual Studio Code"
- ✅ `app.title` → "Google Chrome"
- ✅ Filters out `background_apps`
- ✅ Sorts alphabetically

---

## ✅ Verification Checklist

Test these in order:

- [ ] Backend server is running at port 8001
- [ ] Data collector is running
- [ ] Activity file exists in `data-collector/activity_data/`
- [ ] `/api/activity/current` returns data with apps array
- [ ] Alert Rules page loads without errors
- [ ] "Add Alert Rule" button opens dialog
- [ ] Target Application dropdown shows active apps
- [ ] Refresh button updates the list
- [ ] Can select an app from dropdown
- [ ] Can create alert rule with selected app

---

## 🎉 Success Criteria

After the fix, you should be able to:

✅ **See Active Apps**: Dropdown populated with currently running applications  
✅ **Auto-Refresh**: List updates every 30 seconds automatically  
✅ **Manual Refresh**: Click refresh button to update immediately  
✅ **App Count**: See "X active applications available" message  
✅ **Create Rules**: Select app and create alert rules successfully  
✅ **System-Wide**: Option to monitor all apps or specific ones  

---

## 📝 Testing Scenario

### Create a Test Alert:

1. Open Alert Rules page
2. Click "Add Alert Rule"
3. Fill in:
   - **Name**: "Chrome Memory Alert"
   - **Condition**: Memory Usage
   - **Threshold**: 1000 MB
   - **Duration**: 5 minutes
   - **Target App**: Select "Google Chrome" from dropdown ✅
4. Click "Create"
5. Alert rule should be created successfully!

---

**Status**: ✅ **Fix Applied - Ready to Test**  
**Updated File**: `frontend/src/pages/AlertRules.js`  
**Endpoint Change**: `/api/apps/current` → `/api/activity/current`

**Next Step**: Refresh the Alert Rules page in your browser and open the "Add Alert Rule" dialog to see active applications! 🎊
