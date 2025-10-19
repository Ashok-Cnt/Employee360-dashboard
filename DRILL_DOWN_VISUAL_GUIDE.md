# Work Pattern Drill-Down Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│           WORK PATTERN ANALYSIS - DOUGHNUT CHART            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         🎯 Focus Work (60%)                                 │
│         📞 Communication (20%)                              │
│         🌐 Browsing (15%)                                   │
│         ☕ Breaks (5%)                                       │
│                                                             │
│              [Click on any segment]                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (User clicks "Focus Work")
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              🎯 FOCUS WORK - APPLICATION LIST                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 💻 Visual Studio Code          [Click for details]│     │
│  │ Focus time: 120 minutes                           │ ◄───┼─ CLICKABLE
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ ☕ IntelliJ IDEA                [Click for details]│     │
│  │ Focus time: 45 minutes                            │ ◄───┼─ CLICKABLE
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📝 Notepad++                                       │     │
│  │ Focus time: 15 minutes                            │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│                        [Close]                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (User clicks "Visual Studio Code")
                            ▼
┌─────────────────────────────────────────────────────────────┐
│       💻 VISUAL STUDIO CODE - PROJECT LIST                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📁 Employee360-dashboard     [5 modules]          │     │
│  │ Total time: 90 minutes                            │ ◄───┼─ CLICKABLE
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📁 SwiftCommission           [3 modules]          │     │
│  │ Total time: 25 minutes                            │ ◄───┼─ CLICKABLE
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📁 No Project                [2 modules]          │     │
│  │ Total time: 5 minutes                             │ ◄───┼─ CLICKABLE
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│                        [Back]                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (User clicks "Employee360-dashboard")
                            ▼
┌─────────────────────────────────────────────────────────────┐
│     📁 EMPLOYEE360-DASHBOARD - MODULE LIST                  │
├─────────────────────────────────────────────────────────────┤
│  Application: Visual Studio Code                           │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📄 ApplicationActivity.js    [12 switches]        │     │
│  │ Time spent: 45 minutes (2700 seconds)            │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📄 WorkPatterns.js           [8 switches]         │     │
│  │ Time spent: 30 minutes (1800 seconds)            │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📄 server-json.js            [4 switches]         │     │
│  │ Time spent: 15 minutes (900 seconds)             │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│                       [Close]                               │
└─────────────────────────────────────────────────────────────┘
```

## Window Title Parsing Examples

### Example 1: VS Code
```
INPUT:  "ApplicationActivity.js - Employee360-dashboard - Visual Studio Code"
        ↓ [Parse with Pattern 1: file - project - app]
OUTPUT: Module:  "ApplicationActivity.js"
        Project: "Employee360-dashboard"
        App:     "Visual Studio Code"
```

### Example 2: Notepad++
```
INPUT:  "new 342 - Notepad++"
        ↓ [Parse with Pattern 2: file - app]
OUTPUT: Module:  "new 342"
        Project: "No Project"
        App:     "Notepad++"
```

### Example 3: IntelliJ
```
INPUT:  "Branch_6360809_SwiftCommission – SwiftCommissionBatchContabile.java"
        ↓ [Parse with Pattern 3: project – module]
OUTPUT: Module:  "SwiftCommissionBatchContabile.java"
        Project: "Branch_6360809_SwiftCommission"
        App:     (from app.name)
```

### Example 4: Browser
```
INPUT:  "Employee360 and 10 more pages - Work - Microsoft Edge"
        ↓ [Parse with Pattern 1: title - workspace - app]
OUTPUT: Module:  "Employee360 and 10 more pages"
        Project: "Work"
        App:     "Microsoft Edge"
```

## Data Flow

```
┌──────────────────────┐
│   /api/activity/     │
│      /today          │
└──────────────────────┘
           │
           │ JSON Response
           ▼
┌──────────────────────┐
│   activityData       │
│   {                  │
│     apps: [...],     │
│     hourlySummary    │
│   }                  │
└──────────────────────┘
           │
           │ Filter by category
           ▼
┌──────────────────────┐
│  Productive Apps     │
│  [VS Code, IntelliJ, │
│   Notepad++]         │
└──────────────────────┘
           │
           │ Extract focusSwitches
           ▼
┌──────────────────────┐
│  Focus Switches      │
│  [{                  │
│    from: "...",      │
│    to: "...",        │
│    window_title: ""  │
│  }]                  │
└──────────────────────┘
           │
           │ parseWindowTitle()
           ▼
┌──────────────────────┐
│  Parsed Data         │
│  {                   │
│    module: "...",    │
│    project: "...",   │
│    app: "..."        │
│  }                   │
└──────────────────────┘
           │
           │ groupFocusSwitches()
           ▼
┌──────────────────────┐
│  Grouped Projects    │
│  [{                  │
│    name: "...",      │
│    totalTime: 123,   │
│    modules: [...]    │
│  }]                  │
└──────────────────────┘
           │
           │ Display in UI
           ▼
┌──────────────────────┐
│  Interactive         │
│  Dialogs             │
└──────────────────────┘
```

## State Management

```
App State:
├── activityData                  (Raw API data)
├── workPatternDialogOpen         (Level 1: Category → Apps)
├── selectedWorkPatternCategory   (Selected category data)
├── projectDialogOpen             (Level 2: App → Projects)
├── selectedAppProjects           (Selected app's projects)
├── moduleDialogOpen              (Level 3: Project → Modules)
└── selectedProjectModules        (Selected project's modules)
```

## Click Event Flow

```
1. CHART CLICK
   handleWorkPatternClick()
   ├─ Extract clicked category
   ├─ Filter apps by category
   ├─ Map apps with appData & hasFocusSwitches
   ├─ Set selectedWorkPatternCategory
   └─ Open workPatternDialogOpen

2. APP CLICK
   handleAppClick(app)
   ├─ Check if app has focusSwitches
   ├─ Call groupFocusSwitches(app.appData.focusSwitches)
   ├─ Set selectedAppProjects
   └─ Open projectDialogOpen

3. PROJECT CLICK
   handleProjectClick(project, appName)
   ├─ Extract project.modules
   ├─ Set selectedProjectModules
   └─ Open moduleDialogOpen
```

## Time Calculation

```
Focus Switch:
{
  from: "2025-10-15T20:21:59.723324",
  to:   "2025-10-15T20:23:08.742465"
}
           │
           │ Calculate duration
           ▼
const from = new Date(sw.from);
const to = new Date(sw.to);
const duration = (to - from) / 1000;  // 69 seconds
           │
           │ Accumulate per module/project
           ▼
Module time: 69 seconds
Project time: 69 seconds (+ other modules)
           │
           │ Display in UI
           ▼
"Time spent: 1 minutes (69 seconds)"
```

## UI Component Hierarchy

```
WorkPatterns.js
│
├─ Work Pattern Analysis Chart (Doughnut)
│  └─ onClick → handleWorkPatternClick()
│
├─ Dialog 1: Work Pattern Details
│  ├─ List of Apps
│  │  └─ ListItem (clickable if hasFocusSwitches)
│  │     └─ onClick → handleAppClick()
│  └─ Actions: [Close]
│
├─ Dialog 2: Project Details
│  ├─ List of Projects
│  │  └─ ListItem (clickable)
│  │     └─ onClick → handleProjectClick()
│  └─ Actions: [Back]
│
└─ Dialog 3: Module Details
   ├─ List of Modules
   │  └─ ListItem (read-only)
   └─ Actions: [Close]
```

## Visual Indicators Reference

### Chips
```
┌──────────────────────┐
│ Click for details    │  ← Blue, Outlined (Apps with data)
└──────────────────────┘

┌──────────────────────┐
│ 5 modules            │  ← Info, Outlined (Project module count)
└──────────────────────┘

┌──────────────────────┐
│ 12 switches          │  ← Secondary, Outlined (Module switches)
└──────────────────────┘
```

### Icons
```
🎯 → Focus Work (Productive category)
📞 → Communication
🌐 → Browsing  
☕ → Breaks
💻 → Application
📁 → Project/Workspace
📄 → Module/File
```

### Hover Effects
```
Default State:
┌─────────────────────────┐
│ Visual Studio Code      │
│ Focus time: 120 minutes │
└─────────────────────────┘

Hover State (clickable apps):
┌─────────────────────────┐
│ Visual Studio Code      │  ← Background: #f5f5f5
│ Focus time: 120 minutes │  ← Cursor: pointer
└─────────────────────────┘
```

## Summary

This visualization shows:
1. ✅ **4-level hierarchy**: Category → Apps → Projects → Modules
2. ✅ **3 interactive dialogs**: Each with specific data
3. ✅ **Smart parsing**: Automatic extraction from window titles
4. ✅ **Clear navigation**: Back/Close buttons for easy flow
5. ✅ **Visual feedback**: Chips, icons, and hover effects
6. ✅ **Time tracking**: Accurate time calculation per level
7. ✅ **Context switches**: Track how often you switch between files

Users can now answer questions like:
- "How much time did I spend on Employee360 project today?"
- "Which file in my project consumed most time?"
- "How many times did I switch between files?"
- "What was my focus pattern across projects?"
