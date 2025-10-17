# Active Applications in Alert Rules - Feature Documentation

## Overview

The Alert Rules page now shows **only active applications** from the taskbar in the Target Application dropdown. This makes it easier to select running applications for monitoring instead of typing names manually.

---

## ✅ What Changed

### Before
- Target Application was a text input field
- Users had to manually type exact process names
- No visibility into which apps are running
- Easy to make typos or incorrect names

### After
- ✅ Target Application is now a **dropdown menu**
- ✅ Shows **only currently active applications** from taskbar
- ✅ Auto-refreshes every 30 seconds
- ✅ Manual refresh button available
- ✅ Shows count of active apps available
- ✅ Easy to select without typing

---

## 🎯 Features

### 1. Active Applications Dropdown
- **Source**: Fetches from `/api/apps/current` endpoint
- **Filter**: Shows only applications with `is_active: true`
- **Unique**: Removes duplicate app names
- **Sorted**: Alphabetically ordered for easy finding

### 2. Auto-Refresh
- Automatically refreshes active apps every **30 seconds**
- Keeps the list current as you open/close applications
- Runs in background while dialog is open

### 3. Manual Refresh
- **Refresh icon** in the dropdown field
- Click to instantly update the active apps list
- Useful if you just launched a new application

### 4. Visual Feedback
- Shows count: "X active applications available"
- Empty state: "No active applications found"
- Helper text: Clear instructions

### 5. System-Wide Option
- **"None (System-wide)"** option at top
- Use this for alerts that apply to all apps
- Default for memory/system alerts

---

## 🚀 How to Use

### Creating an Alert with Target App

1. **Open Alert Rules Page**
   - Navigate to Alert Rules from sidebar
   - Click **"Add Alert Rule"** button

2. **Fill in Alert Details**
   - Enter rule name (e.g., "Chrome High Memory")
   - Select condition type (e.g., "Memory Usage")
   - Set threshold (e.g., 500 MB)
   - Set duration (e.g., 5 minutes)

3. **Select Target Application**
   - Click on the **"Target Application"** dropdown
   - See list of all active applications
   - Select the app you want to monitor (e.g., "Google Chrome")
   - Or leave as "None (System-wide)" for all apps

4. **Save the Rule**
   - Click **"Create"** button
   - Alert rule is now active!

### Refreshing Active Apps

**Auto-refresh:**
- List updates automatically every 30 seconds
- No action needed

**Manual refresh:**
- Click the **refresh icon** (↻) in the dropdown
- Instantly updates the list
- Useful after launching new apps

---

## 📋 Example Use Cases

### Use Case 1: Monitor Specific Browser
```
Name: Chrome Memory Warning
Condition: Memory Usage
Threshold: 1000 MB
Duration: 10 minutes
Target App: Google Chrome ← Selected from dropdown
```

### Use Case 2: Monitor IDE
```
Name: VS Code Running Idle
Condition: Application Overrun
Threshold: 120 minutes
Duration: 120 minutes
Target App: Visual Studio Code ← Selected from dropdown
```

### Use Case 3: System-Wide Alert
```
Name: High System Memory
Condition: System Overrun
Threshold: 90%
Duration: 5 minutes
Target App: None (System-wide) ← Default option
```

---

## 🔧 Technical Details

### API Endpoint Used
```
GET /api/apps/current
```

**Response Format:**
```json
[
  {
    "application": "Google Chrome",
    "is_active": true,
    "is_focused": false,
    "memory_usage_mb": 450.2,
    "cpu_usage_percent": 5.3
  },
  {
    "application": "Visual Studio Code",
    "is_active": true,
    "is_focused": true,
    "memory_usage_mb": 320.5,
    "cpu_usage_percent": 8.1
  }
]
```

### Data Processing
1. Fetch active apps from API
2. Extract unique application names
3. Sort alphabetically
4. Display in dropdown
5. Refresh every 30 seconds

### State Management
```javascript
const [activeApps, setActiveApps] = useState([]);

// Fetch on component mount
useEffect(() => {
  fetchActiveApplications();
  const interval = setInterval(fetchActiveApplications, 30000);
  return () => clearInterval(interval);
}, []);

// Fetch on dialog open
const handleOpenDialog = () => {
  fetchActiveApplications();
  setOpenDialog(true);
};
```

---

## 📊 UI Components

### Dropdown Field
```javascript
<TextField
  label="Target Application (optional)"
  select
  value={formData.targetApp}
  onChange={(e) => setFormData({ ...formData, targetApp: e.target.value })}
  helperText="{activeApps.length} active applications available"
  InputProps={{
    endAdornment: (
      <IconButton onClick={fetchActiveApplications}>
        <RefreshIcon />
      </IconButton>
    )
  }}
>
  <MenuItem value="">None (System-wide)</MenuItem>
  {activeApps.map(app => (
    <MenuItem key={app} value={app}>{app}</MenuItem>
  ))}
</TextField>
```

### Features in UI
- ✅ Dropdown select (no manual typing)
- ✅ Active app count in helper text
- ✅ Refresh button on the right
- ✅ System-wide option
- ✅ Empty state handling
- ✅ Alphabetical sorting

---

## 🎨 User Experience Improvements

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Input Type** | Text field | Dropdown |
| **App Discovery** | Manual typing | Visual selection |
| **Accuracy** | Prone to typos | 100% accurate |
| **Visibility** | No list of apps | See all active apps |
| **Refresh** | Manual page reload | Auto + manual refresh |
| **User Effort** | Remember exact names | Just click to select |

### Benefits
1. **Faster**: No typing required
2. **Accurate**: No typos or wrong names
3. **Discoverable**: See what's running
4. **Current**: Auto-refreshes list
5. **Easy**: Point and click

---

## 🔍 Troubleshooting

### No Apps Showing in Dropdown

**Cause**: No active applications or backend not running

**Solutions**:
1. Check backend is running: `curl http://localhost:8001/health`
2. Ensure some applications are open
3. Click refresh button to reload
4. Check console for errors

### Apps Not Updating

**Cause**: Auto-refresh interval issue

**Solutions**:
1. Click manual refresh button
2. Close and reopen the dialog
3. Refresh the page
4. Check backend is responding

### Wrong App Names

**Cause**: Different process names vs display names

**Solutions**:
- Apps appear as their process names (e.g., "chrome.exe" or "Google Chrome")
- This is normal - select what you see
- The alert will match the exact process name

---

## 📝 Code Changes Summary

### Files Modified
1. **`frontend/src/pages/AlertRules.js`**
   - Added `activeApps` state
   - Added `fetchActiveApplications()` function
   - Changed Target App field from TextField to Select dropdown
   - Added auto-refresh (30s interval)
   - Added manual refresh button
   - Added active app count display

### New Imports
```javascript
import { Refresh as RefreshIcon } from '@mui/icons-material';
```

### New State
```javascript
const [activeApps, setActiveApps] = useState([]);
```

### New Function
```javascript
const fetchActiveApplications = async () => {
  try {
    const response = await fetch('http://localhost:8001/api/apps/current');
    if (response.ok) {
      const data = await response.json();
      const uniqueApps = [...new Set(data.map(app => app.application))].sort();
      setActiveApps(uniqueApps);
    }
  } catch (error) {
    console.error('Error fetching active applications:', error);
    setActiveApps([]);
  }
};
```

---

## 🎯 Testing Checklist

- [x] Dropdown shows active applications
- [x] Auto-refresh works (30s)
- [x] Manual refresh button works
- [x] System-wide option available
- [x] Empty state handled
- [x] App count displayed
- [x] Selection saves correctly
- [x] Edit mode loads correct app
- [x] No console errors

---

## 🔗 Related Features

- **Alert Rules**: Main alert management system
- **Desktop Notifications**: Alert notification display
- **Application Monitoring**: Source of active apps data
- **Activity Tracking**: Data collector integration

---

## 💡 Future Enhancements

### Possible Improvements
1. **App Icons**: Show application icons in dropdown
2. **Memory Info**: Display current memory usage next to app name
3. **Grouping**: Group apps by category (browsers, editors, etc.)
4. **Favorites**: Pin frequently monitored apps to top
5. **Search**: Filter apps by typing in dropdown
6. **Multi-Select**: Monitor multiple apps in one rule

---

## 📖 Example Scenarios

### Scenario 1: Monitor Browser Memory
```
1. Open Chrome, Firefox, Edge
2. Create alert rule
3. Open Target Application dropdown
4. See all three browsers listed
5. Select "Google Chrome"
6. Set threshold to 1000 MB
7. Save rule
```

### Scenario 2: Track IDE Usage
```
1. Open Visual Studio Code
2. Create alert rule for app overrun
3. Select "Visual Studio Code" from dropdown
4. Set threshold to 60 minutes idle
5. Save rule
6. Get notified if VS Code runs without focus for 1 hour
```

### Scenario 3: System-Wide Alert
```
1. Create alert for system memory
2. Leave Target Application as "None (System-wide)"
3. Set system threshold to 85%
4. Monitors entire system, not specific app
```

---

**Status**: ✅ **Feature Complete & Working**  
**UI Type**: Dropdown with active apps  
**Refresh**: Auto (30s) + Manual  
**Source**: /api/apps/current  

**Try it now**: Open Alert Rules and create a new alert! 🎯

---

*Last Updated: October 17, 2025*  
*Feature: Active Applications Dropdown in Alert Rules*
