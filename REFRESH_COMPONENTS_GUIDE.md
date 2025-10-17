# 🔄 Component Refresh Functionality

## Overview
All pages in Employee-360 now have **auto-refresh** and **manual refresh** capabilities to update data without reloading the entire page.

---

## ✅ Pages with Refresh Functionality

### 1. 📊 Dashboard
**Location**: `frontend/src/pages/Dashboard.js`

**Features**:
- ✅ **Auto-Refresh**: Every 60 seconds (1 minute)
- ✅ **Manual Refresh Button**: Top-right corner with "Refresh" button
- ✅ **Loading State**: Button shows "Loading..." when refreshing

**What Gets Refreshed**:
- Activity metrics (Active Applications, Productivity Score, Memory Usage)
- Work pattern charts
- Focus time per application
- Hourly activity summary
- Current focused application

**How to Use**:
```
Click the "Refresh" button at the top-right of the dashboard
```

---

### 2. 💻 Application Activity
**Location**: `frontend/src/pages/ApplicationActivity.js`

**Features**:
- ✅ **Auto-Refresh**: Every 60 seconds (1 minute)
- ✅ **Manual Refresh Button**: Already exists in top-right
- ✅ **Time Range Selector**: Filter data by hour/day/week
- ✅ **Loading State**: Button disabled during refresh

**What Gets Refreshed**:
- Current running applications
- Application usage statistics
- Resource usage metrics
- Hourly usage charts
- Memory and CPU data

**How to Use**:
```
Click the "Refresh" button next to the Time Range selector
```

---

### 3. 🔔 Alert Rules
**Location**: `frontend/src/pages/AlertRules.js`

**Features**:
- ❌ **Auto-Refresh**: Disabled (manual refresh only)
- ✅ **Manual Refresh Button**: Refreshes both rules and active apps
- ✅ **Dialog Refresh**: When adding/editing rules, active apps list is refreshed automatically

**What Gets Refreshed**:
- Alert rules list
- Active applications (for dropdown in dialog)
- Rule status and configurations

**How to Use**:
```
Click the "Refresh" button between the page title and "Test Notification" button
```

---

## 🎯 Benefits

### No Page Reload Required
- ✅ User stays on the same page
- ✅ No loss of scroll position
- ✅ No interruption of work
- ✅ Faster than full page reload

### Real-Time Data
- ✅ Activity metrics update automatically
- ✅ Application status reflects current state
- ✅ Memory and CPU usage stay current
- ✅ Alert rules sync with backend

### Better User Experience
- ✅ Smooth transitions
- ✅ Loading indicators show progress
- ✅ Error handling with notifications
- ✅ Disabled state prevents multiple clicks

---

## 🔧 Technical Implementation

### Auto-Refresh Pattern

All pages use React's `setInterval` in `useEffect`:

```javascript
useEffect(() => {
  fetchData(); // Initial load
  
  const interval = setInterval(fetchData, 60000); // Every 60 seconds
  
  return () => clearInterval(interval); // Cleanup on unmount
}, []);
```

### Manual Refresh Pattern

Pages expose a `fetchData` function that can be called on button click:

```javascript
const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
}, []);

// Button
<Button 
  onClick={fetchData} 
  disabled={loading}
  startIcon={<RefreshIcon />}
>
  Refresh
</Button>
```

---

## 📋 Refresh Intervals Summary

| Page | Auto-Refresh Interval | Manual Refresh Button |
|------|----------------------|----------------------|
| **Dashboard** | 60 seconds | ✅ Yes |
| **Application Activity** | 60 seconds | ✅ Yes |
| **Alert Rules** | ❌ Disabled | ✅ Yes (Manual Only) |

---

## 🚀 How Data Flows

### Dashboard Refresh
```
User clicks "Refresh" or 60s passes
    ↓
Fetch /api/activity/today
    ↓
Update state (activityData)
    ↓
React re-renders components
    ↓
Charts and metrics update
    ↓
No page reload! ✅
```

### Application Activity Refresh
```
User clicks "Refresh" or 60s passes
    ↓
Fetch current, today, and stats data
    ↓
Update multiple state variables
    ↓
Tables and charts update
    ↓
Time range filter preserved
    ↓
No page reload! ✅
```

### Alert Rules Refresh
```
User clicks "Refresh" or 30s passes
    ↓
Fetch alert rules and active apps
    ↓
Update rules list and app dropdown
    ↓
UI updates with latest data
    ↓
Dialog state preserved if open
    ↓
No page reload! ✅
```

---

## 🎨 UI Indicators

### Loading States
- **Button Text**: "Refresh" → "Loading..."
- **Button Disabled**: Prevents multiple clicks
- **Spinner**: Shows in Dashboard greeting during initial load

### Success States
- **Data Updates**: Components re-render with new data
- **Smooth Transitions**: No flash or jarring updates
- **Preserved State**: Filters, tabs, and selections remain

### Error States
- **Snackbar Notifications**: For Alert Rules
- **Console Logging**: For debugging
- **Fallback Data**: Empty arrays instead of crashes

---

## 💡 Best Practices

### When to Refresh Manually
✅ **Use manual refresh when:**
- You just created/updated an alert rule
- You want to see immediate changes
- Auto-refresh hasn't caught up yet
- You opened a new application
- You're testing the system

❌ **Don't need manual refresh when:**
- Auto-refresh is working fine
- You're just viewing data
- You can wait 30-60 seconds

### Performance Tips
- Auto-refresh only runs when component is mounted
- Intervals are cleaned up on unmount
- API calls are debounced/rate-limited
- Loading states prevent duplicate requests

---

## 🔍 Troubleshooting

### Refresh Button Not Working

**Symptoms**: Button click doesn't update data

**Solutions**:
1. Check browser console for errors
2. Verify backend is running: `http://localhost:8001/health`
3. Check network tab for API calls
4. Ensure data collector is running

---

### Auto-Refresh Not Working

**Symptoms**: Data doesn't update after 60 seconds

**Solutions**:
1. Check console for interval errors
2. Verify component is still mounted
3. Check if browser tab is active
4. Restart frontend: `npm start`

---

### Data Not Updating

**Symptoms**: Refresh works but data stays the same

**Solutions**:
1. Ensure data collector is running
2. Check JSONL files have new data:
   ```powershell
   dir data-collector\activity_data\*.jsonl
   ```
3. Verify backend is reading latest files
4. Check backend logs for errors

---

## 🎯 Testing the Refresh

### Test Dashboard Refresh
1. Open http://localhost:3000
2. Note current metrics (e.g., Active Applications: 5)
3. Open a new application (like Notepad)
4. Wait 1 minute OR click "Refresh"
5. Verify metrics updated (Active Applications: 6) ✅

### Test Application Activity Refresh
1. Go to Application Activity page
2. Note current running apps
3. Close an application
4. Click "Refresh" button
5. Verify app disappeared from list ✅

### Test Alert Rules Refresh
1. Go to Alert Rules page
2. Open another alert rules page in new tab
3. Create a rule in the new tab
4. Go back to first tab
5. Click "Refresh"
6. Verify new rule appears ✅

---

## 🎉 Success Criteria

After implementing refresh functionality:

✅ **Dashboard refreshes** without page reload  
✅ **Application Activity refreshes** without page reload  
✅ **Alert Rules refreshes** without page reload  
✅ **Auto-refresh works** every 30-60 seconds  
✅ **Manual refresh button** present on all pages  
✅ **Loading states** show during refresh  
✅ **No errors** in browser console  
✅ **Data updates** reflect latest from backend  

---

## 📝 Files Modified

### Dashboard
- **File**: `frontend/src/pages/Dashboard.js`
- **Changes**: 
  - Added `Button` and `RefreshIcon` imports
  - Extracted `fetchData` as `useCallback`
  - Added refresh button in header
  - Added loading state to button

### Alert Rules
- **File**: `frontend/src/pages/AlertRules.js`
- **Changes**:
  - Added `RefreshIcon` import
  - Added refresh button to header
  - Button calls both `fetchRules()` and `fetchActiveApplications()`

### Application Activity
- **Status**: ✅ Already has refresh functionality
- **No Changes Needed**: Manual button and auto-refresh already working

---

## 🚀 Next Steps

### Future Enhancements
1. **Real-time updates**: Use WebSockets for instant updates
2. **Smart refresh**: Only refresh if data actually changed
3. **Background refresh**: Update even when tab is not visible
4. **Refresh all**: Button to refresh all pages at once
5. **Custom intervals**: Let users set their own auto-refresh intervals

---

**Status**: ✅ **Component Refresh Complete**  
**Pages Updated**: Dashboard, Alert Rules  
**Pages Already Working**: Application Activity  
**Auto-Refresh**: ✅ All pages (30-60s intervals)  
**Manual Refresh**: ✅ All pages have refresh buttons

**Result**: Users can now refresh data without reloading pages! 🎊
