# Interactive Metrics Guide

## Overview
Three additional metric cards on the Dashboard are now interactive with detailed drill-down dialogs: **Productivity Score**, **Memory Usage**, and **Monitoring Hours**.

## New Interactive Metrics

### 1. 🎯 Productivity Score

**Click to view:**
- **Score Breakdown** - Detailed calculation with 4 components:
  - **Current Focus** (20 points max) - Whether you have an app in focus
  - **Productive Apps Ratio** (30 points max) - Percentage of productive apps
  - **Focus Time Efficiency** (30 points max) - Focus time vs running time ratio
  - **Monitoring Duration** (20 points max) - Hours tracked today
  
- **Visual Progress Bars** - Color-coded bars showing contribution of each component
- **Top Productive Applications** - List of top 5 productive apps by focus time
- **Performance Feedback** - Dynamic message based on your score:
  - ≥75%: Excellent productivity! 🎉
  - 50-74%: Good progress! 👍
  - <50%: Room for improvement 💪

**Calculation Formula:**
```
Productivity Score = Focus Score + Productivity Ratio + Focus Time Ratio + Monitoring Score
```

---

### 2. 💾 Memory Usage

**Click to view:**
- **Total Memory Usage** - Combined memory of all active apps
- **Applications by Memory** - Sorted list from highest to lowest
- **Memory Breakdown** - Visual bars showing each app's percentage
- **Color-Coded Indicators**:
  - 🔴 Red: >500 MB (High usage)
  - 🟠 Orange: 200-500 MB (Medium usage)
  - 🟢 Green: <200 MB (Low usage)

**Additional Information:**
- Category tags for each application
- Focus indicator for active app
- Percentage of total memory per app
- Memory optimization tips
- Highest memory consumer highlight

**Features:**
- Real-time memory tracking
- Focused app indicator with badge
- Category classification
- Interactive progress bars

---

### 3. ⏱️ Monitoring Hours

**Click to view:**
- **Total Monitoring Time** - Hours and minutes tracked
- **Time Breakdown** with visual bars:
  - 🎯 **Productive Time** - Time on productive apps (green)
  - ☕ **Idle Time** - Time with no activity (orange)
  - 📞 **Communication Time** - Time on communication apps (blue)
  
- **Hourly Activity Timeline** - Interactive chips showing activity per hour
  - Hover to see detailed breakdown
  - Color-coded by activity level:
    - Green: >30 minutes
    - Blue: 15-30 minutes
    - Grey: <15 minutes

**Summary Statistics:**
- Percentage distribution of time categories
- Total minutes in each category
- Activity pattern throughout the day

---

### 4. ☕ Idle Hours

**Click to view:**
- **Total Idle Time** - Hours and minutes of idle/away time
- **Idle Time Analysis** with visual comparison:
  - Idle Time percentage (orange)
  - Active Time percentage (green)
  
- **Hourly Idle Time Breakdown** - Interactive chips per hour
  - Color-coded by idle amount:
    - Warning: >30 minutes idle
    - Default: 15-30 minutes
    - Success: <15 minutes
  
- **Helpful Tips**:
  - Understanding idle time
  - Break recommendations
  - Workstation security reminders

**Contextual Feedback:**
- <20% idle: Very active, remember breaks
- 20-40%: Good work-break balance
- 40-60%: Moderate idle, typical workday
- >60%: High idle, review schedule

---

### 5. 📚 Courses Completed

**Click to view:**
- **Total Courses** - Number of completed courses
- **Recent Completions** - List of last 5 courses with:
  - Course title
  - Completion date
  - Category
  - Certificate status
  
- **Learning Statistics**:
  - Progress toward quarterly goal (visual bar)
  - Total learning hours
  - Certificates earned
  - Average score
  
- **Motivational Content**:
  - Progress percentage
  - Courses remaining to goal
  - Encouragement messages

**Features:**
- Mock data showing typical learning journey
- Certificate badges
- Goal tracking with progress bar
- Category-wise course breakdown

---

### 6. 🔋 Battery / 💪 Health Score

**Click to view:**

**For Laptops (Battery Available):**
- **Current Battery Level** - Large visual display
- **Charging Status** - Plugged in or on battery
- **Battery Health Tips**:
  - Optimal charging range (20-80%)
  - Current charging recommendations
  - Battery health assessment
  
- **Visual Battery Bar** - Color-coded progress
- **Smart Alerts**:
  - Low battery warning (<20%)
  - Good level confirmation (>80%)
  - Normal status (20-80%)

**For Desktops (No Battery):**
- **System Health Score** - Overall score (78%)
- **Health Breakdown** with 4 components:
  - 💻 System Performance (85%)
  - 💾 Memory Management (70%)
  - 📊 Resource Usage (82%)
  - 🎯 Application Efficiency (75%)
  
- **System Recommendations**:
  - Performance feedback
  - Optimization suggestions
  - Resource management tips

**Features:**
- Adaptive display based on system type
- Color-coded status indicators
- Actionable recommendations
- Visual progress bars

---

## Complete List of Interactive Metrics

| Metric Card | Interactive | Details Shown |
|-------------|-------------|---------------|
| Active Applications | ✅ Yes | List of all running apps with details |
| Productivity Score | ✅ Yes | Score breakdown, calculation, top apps |
| Memory Usage | ✅ Yes | Memory per app, usage tips, rankings |
| Monitoring Hours | ✅ Yes | Time breakdown, hourly timeline |
| Productive Hours | ✅ Yes | Productive apps breakdown, hourly data |
| Idle Hours | ✅ Yes | Idle analysis, hourly breakdown, tips |
| Courses Completed | ✅ Yes | Learning progress, recent courses, stats |
| Battery/Health Score | ✅ Yes | Battery status or system health breakdown |

---

## User Experience Features

### Visual Indicators
- **Hover Effect** - Cards lift up on hover (clickable metrics only)
- **Cursor Change** - Pointer cursor for clickable metrics
- **Smooth Animations** - Transition effects on all interactions

### Dialog Features
- **Full Width** - Maximum width for detailed content
- **Scrollable** - Auto-scroll for long content
- **Responsive** - Adapts to screen size
- **Close Options** - Click outside or use Close button

### Data Visualization
- **Progress Bars** - Visual representation of percentages
- **Color Coding** - Intuitive color schemes (green=good, orange=warning, red=alert)
- **Tooltips** - Additional context on hover
- **Chips & Badges** - Quick status indicators

---

## Technical Implementation

### State Management
```javascript
const [productivityScoreDialogOpen, setProductivityScoreDialogOpen] = React.useState(false);
const [memoryUsageDialogOpen, setMemoryUsageDialogOpen] = React.useState(false);
const [monitoringHoursDialogOpen, setMonitoringHoursDialogOpen] = React.useState(false);
const [idleHoursDialogOpen, setIdleHoursDialogOpen] = React.useState(false);
const [coursesDialogOpen, setCoursesDialogOpen] = React.useState(false);
const [batteryDialogOpen, setBatteryDialogOpen] = React.useState(false);
```

### Click Handlers
```javascript
onClick={() => setProductivityScoreDialogOpen(true)}
onClick={() => setMemoryUsageDialogOpen(true)}
onClick={() => setMonitoringHoursDialogOpen(true)}
onClick={() => setIdleHoursDialogOpen(true)}
onClick={() => setCoursesDialogOpen(true)}
onClick={() => setBatteryDialogOpen(true)}
```

### Dialog Components
- Material-UI Dialog component
- DialogTitle, DialogContent, DialogActions
- List, ListItem, ListItemText for data display
- Box, Typography for layout and text
- Chip, Tooltip for enhanced UI

---

## Benefits

### 1. **Enhanced Transparency**
- Users understand how their productivity score is calculated
- Clear visibility into memory consumption
- Detailed time tracking breakdown

### 2. **Actionable Insights**
- Identify memory-heavy applications
- See which apps contribute to productivity
- Track activity patterns throughout the day

### 3. **Better Decision Making**
- Close high-memory apps not in use
- Focus on productive applications
- Optimize work patterns based on hourly data

### 4. **Improved User Engagement**
- Interactive elements make the dashboard more engaging
- Drill-down capabilities satisfy curiosity
- Visual feedback encourages exploration

---

## Usage Tips

### For Users:
1. **Click any highlighted metric** to see detailed information
2. **Review your productivity score breakdown** to understand what affects it
3. **Check memory usage regularly** to identify resource-heavy apps
4. **Monitor your time distribution** to optimize your work patterns
5. **Track idle time** to maintain healthy work-break balance
6. **Review learning progress** to stay on track with course goals
7. **Check battery/health status** for system optimization tips

### For Developers:
1. All dialogs follow the same pattern for consistency
2. Data is fetched from `activityData` state
3. Real-time updates every 60 seconds
4. Calculations are performed in helper functions
5. Battery dialog adapts to laptop vs desktop systems
6. Courses data uses mock data (ready for API integration)

---

## Future Enhancements

### Potential Additions:
- [ ] Export data to CSV/PDF
- [ ] Historical comparison (today vs yesterday)
- [ ] Customizable productivity score weights
- [ ] Memory usage alerts when threshold exceeded
- [ ] Goal setting for monitoring hours
- [ ] Weekly/monthly trends

---

## Testing Checklist

- [x] Productivity Score dialog opens and displays correctly
- [x] Memory Usage dialog shows all apps with memory data
- [x] Monitoring Hours dialog displays time breakdown
- [x] Idle Hours dialog shows idle analysis
- [x] Courses Completed dialog displays learning progress
- [x] Battery dialog adapts to laptop/desktop systems
- [x] All progress bars animate smoothly
- [x] Hover effects work on clickable cards
- [x] Dialogs close properly
- [x] No console errors
- [x] Responsive design works on all screen sizes
- [x] Data updates in real-time
- [x] Color coding is intuitive
- [x] Battery card shows hover effect
- [x] Health Score (desktop) is interactive

---

## Update Date
**Date:** October 18, 2025 (Updated)

## File Modified
- `frontend/src/pages/Dashboard.js` - Added 6 new dialogs with comprehensive details

## Lines Added
- ~1000 lines of dialog components and interactive features (3 additional dialogs)
