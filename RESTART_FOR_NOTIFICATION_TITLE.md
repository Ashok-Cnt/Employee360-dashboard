# 🔄 Restart Data Collector to Update Notification Title

## Problem
The notification alert title still shows "python" instead of "Employee-360".

## ✅ Solution
The code has been updated, but you need to restart the data collector for changes to take effect.

---

## 🚀 Quick Restart

### Option 1: Using PowerShell (Automatic)

Run this command to restart the data collector:

```powershell
# Find and stop the data collector
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Employee360*" } | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Restart data collector
cd data-collector
..\.venv\Scripts\python.exe collector_jsonl.py
```

---

### Option 2: Manual Restart (Recommended)

**Step 1: Stop the Current Data Collector**
1. Find the terminal running the data collector (Python)
2. Press `Ctrl + C` to stop it

**Step 2: Restart with Updated Code**
```powershell
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector
..\.venv\Scripts\python.exe collector_jsonl.py
```

---

### Option 3: Using Task Manager

**Step 1: Stop Python Process**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find "Python" process (PID: 22916 or similar)
3. Right-click → End Task

**Step 2: Restart Data Collector**
```powershell
cd data-collector
..\.venv\Scripts\python.exe collector_jsonl.py
```

---

## 🧪 How to Test After Restart

### Test 1: Using Alert Rules Page
1. Open http://localhost:3000
2. Go to Alert Rules page
3. Click **"Test Notification"** button
4. Check the notification title - should now say **"Employee-360 Alert Test"** ✅

### Test 2: Create a Real Alert
1. Create an alert rule (e.g., Memory Usage > 100 MB)
2. Wait for it to trigger
3. Check the notification - should show **"Employee-360"** as app name ✅

### Test 3: Check Backend Test (Express)
1. Open http://localhost:3000
2. Go to Alert Rules
3. Click "Test Notification"
4. Notification should say **"Employee-360 Alert Test"** ✅

---

## 📋 What Was Changed

### File 1: Data Collector Alert Engine
**File**: `data-collector/alert_engine.py` (line 248)

**Before**:
```python
app_name='Employee360 Monitor',
```

**After**:
```python
app_name='Employee-360',  ✅
```

### File 2: Backend Express Test Notification
**File**: `backend-express/routes/alerts.js`

**Before**:
```javascript
title: 'Employee360 Alert Test',
message: 'This is a test notification from Employee360 Dashboard!',
```

**After**:
```javascript
title: 'Employee-360 Alert Test',  ✅
message: 'This is a test notification from Employee-360 Dashboard!',  ✅
```

### File 3: Backend Python Test Notification
**File**: `backend/app/routers/alerts.py`

**Before**:
```python
title="Employee360 Test Alert",
```

**After**:
```python
title="Employee-360 Test Alert",  ✅
```

---

## 🔍 Verify Changes Are in Code

Check the files to confirm:

```powershell
# Check data collector
Select-String -Path "data-collector\alert_engine.py" -Pattern "Employee-360"

# Check Express backend
Select-String -Path "backend-express\routes\alerts.js" -Pattern "Employee-360"

# Check Python backend
Select-String -Path "backend\app\routers\alerts.py" -Pattern "Employee-360"
```

All three should show matches! ✅

---

## 🎯 Quick Restart Script

Save this as `restart-collector.ps1`:

```powershell
# Stop current data collector
Write-Host "🛑 Stopping data collector..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | 
    Where-Object { $_.Path -like "*Employee360*" } | 
    Stop-Process -Force

# Wait
Start-Sleep -Seconds 2

# Restart
Write-Host "🚀 Starting data collector with updated settings..." -ForegroundColor Green
cd data-collector
Start-Process -FilePath "..\.venv\Scripts\python.exe" -ArgumentList "collector_jsonl.py" -NoNewWindow

Write-Host "✅ Data collector restarted!" -ForegroundColor Green
Write-Host "Test notification title will now show 'Employee-360'" -ForegroundColor Cyan
```

Run it:
```powershell
.\restart-collector.ps1
```

---

## 🎉 Expected Results

After restarting, all notifications will show:

### Test Notification (from Alert Rules page):
```
┌─────────────────────────────────────┐
│ Employee-360 Alert Test             │  ✅
├─────────────────────────────────────┤
│ This is a test notification from    │
│ Employee-360 Dashboard!             │
└─────────────────────────────────────┘
```

### Real Alert Notification:
```
┌─────────────────────────────────────┐
│ High Memory Usage Alert             │  ← Rule name
├─────────────────────────────────────┤
│ Chrome exceeded 1000 MB threshold   │
│                                     │
│ From: Employee-360                  │  ✅
└─────────────────────────────────────┘
```

---

## ✅ Success Checklist

- [ ] Stop data collector (Ctrl+C or Task Manager)
- [ ] Restart data collector from terminal
- [ ] Wait for it to start monitoring
- [ ] Go to Alert Rules page
- [ ] Click "Test Notification"
- [ ] Verify notification title shows "Employee-360" ✅
- [ ] Done! 🎊

---

**Quick Command to Restart:**
```powershell
# In the terminal running data collector:
# Press Ctrl+C to stop, then:
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector
..\.venv\Scripts\python.exe collector_jsonl.py
```

---

**Status**: ✅ Code Updated  
**Action Required**: Restart data collector  
**Expected Result**: Notifications show "Employee-360"  
**Updated**: October 17, 2025
