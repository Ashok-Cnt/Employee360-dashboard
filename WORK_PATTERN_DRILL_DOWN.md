# Work Pattern Analysis - Multi-Level Drill-Down Feature

## Overview
The Work Pattern Analysis chart now supports **3-level drill-down** functionality, allowing users to explore their focus work in detail:
1. **Level 1**: Category (Focus Work, Communication, Browsing, Breaks)
2. **Level 2**: Applications
3. **Level 3**: Projects/Workspaces
4. **Level 4**: Modules/Files

## How It Works

### Level 1: Click on "Focus Work"
When you click on the "🎯 Focus Work" segment in the Work Pattern Analysis doughnut chart, you'll see a list of all productive applications you used today.

**Example:**
- Visual Studio Code - 120 minutes
- IntelliJ IDEA - 45 minutes
- Notepad++ - 15 minutes

### Level 2: Click on an Application
Applications with detailed activity (focus switches) will show a **"Click for details"** chip. Clicking on these apps reveals the projects/workspaces you worked on.

**Example - Visual Studio Code:**
- 📁 Employee360-dashboard - 90 minutes (5 modules)
- 📁 No Project - 30 minutes (2 modules)

### Level 3: Click on a Project
Clicking on a project shows all the files/modules you worked on within that project.

**Example - Employee360-dashboard:**
- 📄 ApplicationActivity.js - 45 minutes (12 switches)
- 📄 WorkPatterns.js - 30 minutes (8 switches)
- 📄 server-json.js - 15 minutes (4 switches)

## Window Title Parsing Logic

The system automatically extracts project and module information from window titles using multiple patterns:

### Pattern 1: File - Project - Application
**Example:** `"ApplicationActivity.js - Employee360-dashboard - Visual Studio Code"`
- **Module:** ApplicationActivity.js
- **Project:** Employee360-dashboard
- **Application:** Visual Studio Code

### Pattern 2: File - Application
**Example:** `"new 342 - Notepad++"`
- **Module:** new 342
- **Project:** No Project
- **Application:** Notepad++

### Pattern 3: Project – Module (with en-dash or backslash)
**Example:** `"Branch_6360809_SwiftCommission – SwiftCommissionBatchContabile.java"`
- **Module:** SwiftCommissionBatchContabile.java
- **Project:** Branch_6360809_SwiftCommission
- **Application:** (detected from app name)

### Pattern 4: Browser Tabs
**Example:** `"Employee360 and 10 more pages - Work - Microsoft Edge"`
- **Module:** Employee360 and 10 more pages
- **Project:** Work
- **Application:** Microsoft Edge

## UI Components

### 1. Application List Dialog
- **Trigger:** Click "🎯 Focus Work" in Work Pattern Analysis chart
- **Shows:** List of applications with focus time
- **Indicators:** 
  - "Click for details" chip for apps with focus switches
  - Hover effect on clickable apps
  - Total focus time per app

### 2. Project List Dialog
- **Trigger:** Click on an application with focus switches
- **Shows:** List of projects/workspaces
- **Displays:**
  - 📁 Project icon
  - Project name
  - Total time spent
  - Number of modules (chip)
  - Clickable to drill into modules

### 3. Module List Dialog
- **Trigger:** Click on a project
- **Shows:** List of files/modules worked on
- **Displays:**
  - 📄 Module icon
  - File/module name
  - Time spent
  - Number of focus switches (chip)
  - Parent application name at top

## Data Structure

### Focus Switches Format
```json
{
  "focusSwitches": [
    {
      "from": "2025-10-15T20:21:59.723324",
      "to": "2025-10-15T20:23:08.742465",
      "window_title": "ApplicationActivity.js - Employee360-dashboard - Visual Studio Code"
    }
  ]
}
```

### Parsed Data Structure
```javascript
{
  projects: [
    {
      name: "Employee360-dashboard",
      totalTime: 5400,  // seconds
      modules: [
        {
          name: "ApplicationActivity.js",
          time: 2700,  // seconds
          switchCount: 12
        }
      ]
    }
  ]
}
```

## Key Functions

### 1. parseWindowTitle(windowTitle)
Extracts project and module information from window titles using regex patterns.

**Returns:**
```javascript
{
  module: "ApplicationActivity.js",
  project: "Employee360-dashboard",
  application: "Visual Studio Code"
}
```

### 2. groupFocusSwitches(focusSwitches)
Groups focus switches by project and module, calculating time spent on each.

**Returns:** Array of projects with nested modules

### 3. handleAppClick(app)
Opens the project dialog with grouped project data.

### 4. handleProjectClick(project, appName)
Opens the module dialog showing all files in the project.

## Visual Indicators

### Chips
- **"Click for details"** (Blue, Outlined) - App has focus switch data
- **"X modules"** (Info, Outlined) - Number of modules in project
- **"X switches"** (Secondary, Outlined) - Number of focus switches to module

### Icons
- 📁 - Project/Workspace
- 📄 - Module/File
- 🎯 - Focus Work
- 📞 - Communication
- 🌐 - Browsing
- ☕ - Breaks

## Time Display Format
All time values are shown in both minutes and seconds:
- **Short duration:** "15 minutes (900 seconds)"
- **Long duration:** "120 minutes (7200 seconds)"

## User Experience Flow

```
1. User sees Work Pattern Analysis doughnut chart
   ↓
2. User clicks "🎯 Focus Work" segment
   ↓
3. Dialog shows list of applications with focus time
   ↓
4. User sees "Visual Studio Code" with "Click for details" chip
   ↓
5. User clicks Visual Studio Code
   ↓
6. New dialog shows projects: "Employee360-dashboard" (5 modules)
   ↓
7. User clicks on "Employee360-dashboard"
   ↓
8. Final dialog shows modules:
   - ApplicationActivity.js - 45 min (12 switches)
   - WorkPatterns.js - 30 min (8 switches)
   - server-json.js - 15 min (4 switches)
```

## Edge Cases Handled

### 1. No Focus Switches
- Apps without focus switches are not clickable
- No "Click for details" chip shown
- Cursor remains default (not pointer)

### 2. No Project Information
- Files without project info grouped under "No Project"
- Still clickable and functional

### 3. Complex Window Titles
- Multiple separators handled (-, –, \, \u2013)
- Long window titles parsed correctly
- Special characters handled

### 4. Multiple Applications
- Each app's data is kept separate
- Projects are grouped per application
- Clear navigation between dialogs

## Benefits

### 1. Detailed Insights
- See exactly which projects you worked on
- Identify which files consumed most time
- Track focus switches between modules

### 2. Better Time Tracking
- Understand time distribution at file level
- Identify context switching patterns
- Find areas for improvement

### 3. Project Management
- See which projects got attention
- Track multi-project work patterns
- Analyze project-specific productivity

### 4. Developer Productivity
- IDE integration through window titles
- File-level time tracking
- Context switch awareness

## Code Changes

### New State Variables
```javascript
const [projectDialogOpen, setProjectDialogOpen] = React.useState(false);
const [selectedAppProjects, setSelectedAppProjects] = React.useState(null);
const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
const [selectedProjectModules, setSelectedProjectModules] = React.useState(null);
```

### New Utility Functions
1. `parseWindowTitle()` - 45 lines
2. `groupFocusSwitches()` - 40 lines
3. `handleAppClick()` - 10 lines
4. `handleProjectClick()` - 8 lines

### New Dialog Components
1. **Project Dialog** - ~50 lines
2. **Module Dialog** - ~50 lines
3. **Updated Work Pattern Dialog** - Enhanced with clickability

### Modified Functions
- `handleWorkPatternClick()` - Now includes `appData` and `hasFocusSwitches`

## Testing Checklist

- [x] Click on Focus Work shows apps
- [x] Apps with focus switches show "Click for details" chip
- [x] Clicking app with focus switches opens project dialog
- [x] Project dialog shows correct number of modules
- [x] Clicking project opens module dialog
- [x] Module dialog shows correct time and switch count
- [x] Window title parsing works for all patterns
- [x] Time calculations are accurate
- [x] Dialogs have proper navigation (Back/Close buttons)
- [x] No errors in console
- [x] Responsive on different screen sizes
- [x] Hover effects work correctly

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Performance Considerations

- **Window title parsing:** O(n) where n = number of focus switches
- **Grouping:** O(n) for each app's focus switches
- **Sorting:** O(n log n) for projects and modules
- **Dialog rendering:** Minimal re-renders with React state

## Future Enhancements

1. **Time Range Filter**
   - Filter by specific hours
   - Date range selection
   - Custom time periods

2. **Search & Filter**
   - Search for specific files
   - Filter by project
   - Filter by time threshold

3. **Visualizations**
   - Timeline view of focus switches
   - Heatmap of module activity
   - Gantt chart of project work

4. **Export Functionality**
   - Export to CSV
   - Generate PDF reports
   - Share insights

5. **Smart Insights**
   - Detect context switching patterns
   - Suggest focus time improvements
   - Identify productive vs. distracted periods

## Related Files

- `frontend/src/pages/WorkPatterns.js` - Main implementation
- `data-collector/activity_data/*.jsonl` - Data source
- `backend/express-server/server-json.js` - API endpoint

## API Integration

**Endpoint:** `GET /api/activity/today`

**Response includes:**
```json
{
  "apps": [
    {
      "name": "Code.exe",
      "title": "Visual Studio Code",
      "category": "Productive",
      "focusDurationSec": 7200,
      "focusSwitches": [...]
    }
  ]
}
```

## Summary

This multi-level drill-down feature transforms the Work Pattern Analysis from a simple time distribution chart into a powerful productivity analysis tool. Users can now:

1. ✅ See which apps they used
2. ✅ Drill into projects they worked on
3. ✅ View specific files/modules
4. ✅ Track focus switches
5. ✅ Analyze time distribution at granular level

The intelligent window title parsing automatically extracts project and module information, making this feature work seamlessly across different applications and platforms.
