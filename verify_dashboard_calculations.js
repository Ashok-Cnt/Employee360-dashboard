/**
 * Dashboard Calculations Verification Script
 * This script verifies that all Dashboard calculations are correct
 */

// Sample activity data from the API
const activityData = {
  "timestamp": "2025-10-15T07:48:44.452005Z",
  "system": {
    "cpuUsage": 37,
    "memoryUsageMB": 13781,
    "batteryPercent": 100,
    "isCharging": true,
    "uptimeSec": 38580,
    "idleTimeSec": 4,
    "isIdle": false,
    "aggregates": {
      "overallMonitoringHours": 0.05,
      "productiveHours": 0.03,
      "communicationHours": 0,
      "idleHours": 0,
      "avgCPU": 22.8
    }
  },
  "apps": [
    {
      "name": "chrome.exe",
      "title": "Google Chrome",
      "category": "Browsers",
      "isFocused": false,
      "runningTimeSec": 210,
      "focusDurationSec": 0,
      "cpuUsage": 0,
      "memoryUsageMB": 2270.7
    },
    {
      "name": "Code.exe",
      "title": "Visual Studio Code",
      "category": "Productive",
      "isFocused": true,
      "runningTimeSec": 210,
      "focusDurationSec": 120,
      "cpuUsage": 0,
      "memoryUsageMB": 3391
    },
    {
      "name": "msedge.exe",
      "title": "Microsoft Edge",
      "category": "Browsers",
      "isFocused": false,
      "runningTimeSec": 210,
      "focusDurationSec": 90,
      "cpuUsage": 0,
      "memoryUsageMB": 1035
    },
    {
      "name": "notepad++.exe",
      "title": "Notepad++",
      "category": "Productive",
      "isFocused": false,
      "runningTimeSec": 210,
      "focusDurationSec": 0,
      "cpuUsage": 0,
      "memoryUsageMB": 45.3
    },
    {
      "name": "background_apps",
      "title": "Other Background Apps (47 apps)",
      "category": "Background",
      "isFocused": false,
      "runningTimeSec": 210,
      "focusDurationSec": 0,
      "cpuUsage": 0,
      "memoryUsageMB": 6956.9
    }
  ],
  "hourlySummary": [
    {
      "hour": "07:00",
      "productiveFocusSec": 120,
      "communicationFocusSec": 0,
      "idleSec": 0
    }
  ]
};

// Helper functions from Dashboard.js
const formatMemory = (mb) => {
  if (mb > 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb?.toFixed(1) || 0} MB`;
};

const getProductivityScore = () => {
  if (!activityData || !activityData.apps) return 75;
  
  const visibleApps = activityData.apps.filter(app => app.name !== 'background_apps');
  const focusedApp = visibleApps.find(app => app.isFocused);
  const productiveApps = visibleApps.filter(app => app.category === 'Productive');
  const totalFocusTime = visibleApps.reduce((sum, app) => sum + (app.focusDurationSec || 0), 0);
  const totalRunTime = visibleApps.reduce((sum, app) => sum + (app.runningTimeSec || 0), 0);
  
  const focusScore = focusedApp ? 20 : 0;
  const productivityRatio = productiveApps.length > 0 ? (productiveApps.length / visibleApps.length) * 30 : 0;
  const focusTimeRatio = totalRunTime > 0 ? (totalFocusTime / totalRunTime) * 30 : 0;
  const monitoringScore = activityData.system?.aggregates?.overallMonitoringHours 
    ? Math.min(20, activityData.system.aggregates.overallMonitoringHours * 5) 
    : 0;
  
  return Math.round(focusScore + productivityRatio + focusTimeRatio + monitoringScore);
};

const getTotalMemoryUsage = () => {
  if (!activityData || !activityData.apps) return 0;
  
  return activityData.apps
    .filter(app => app.name !== 'background_apps')
    .reduce((total, app) => total + (app.memoryUsageMB || 0), 0);
};

const getCurrentAppsCount = () => {
  if (!activityData || !activityData.apps) return 0;
  return activityData.apps.filter(app => app.name !== 'background_apps').length;
};

const getFocusedWindow = () => {
  if (!activityData || !activityData.apps) return null;
  const focused = activityData.apps.find(app => app.isFocused);
  return focused ? {
    application: focused.name,
    window_title: focused.title,
    is_focused: true,
    memory_usage_mb: focused.memoryUsageMB,
    cpu_usage_percent: focused.cpuUsage
  } : null;
};

const getMonitoringHours = () => {
  return activityData?.system?.aggregates?.overallMonitoringHours || 0;
};

// Run verification tests
console.log('\n=== Dashboard Calculations Verification ===\n');

// Test 1: Current Apps Count
const appsCount = getCurrentAppsCount();
console.log(`✓ Active Applications: ${appsCount}`);
console.log(`  Expected: 4 (Chrome, VS Code, Edge, Notepad++)`);
console.log(`  Status: ${appsCount === 4 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Total Memory Usage
const totalMemory = getTotalMemoryUsage();
const expectedMemory = 2270.7 + 3391 + 1035 + 45.3;
console.log(`✓ Total Memory Usage: ${formatMemory(totalMemory)}`);
console.log(`  Expected: ${formatMemory(expectedMemory)} (${expectedMemory.toFixed(1)} MB)`);
console.log(`  Actual: ${totalMemory.toFixed(1)} MB`);
console.log(`  Status: ${Math.abs(totalMemory - expectedMemory) < 1 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: Productivity Score
const productivityScore = getProductivityScore();
const visibleApps = activityData.apps.filter(app => app.name !== 'background_apps');
const productiveApps = visibleApps.filter(app => app.category === 'Productive');
const totalFocusTime = visibleApps.reduce((sum, app) => sum + (app.focusDurationSec || 0), 0);
const totalRunTime = visibleApps.reduce((sum, app) => sum + (app.runningTimeSec || 0), 0);

console.log(`✓ Productivity Score: ${productivityScore}%`);
console.log(`  Breakdown:`);
console.log(`    - Focus Score: 20 (VS Code is focused)`);
console.log(`    - Productivity Ratio: ${((productiveApps.length / visibleApps.length) * 30).toFixed(1)} (${productiveApps.length}/${visibleApps.length} apps)`);
console.log(`    - Focus Time Ratio: ${((totalFocusTime / totalRunTime) * 30).toFixed(1)} (${totalFocusTime}/${totalRunTime} sec)`);
console.log(`    - Monitoring Score: ${Math.min(20, activityData.system.aggregates.overallMonitoringHours * 5).toFixed(2)} (${activityData.system.aggregates.overallMonitoringHours}h)`);
console.log(`  Expected: ~43%`);
console.log(`  Status: ${productivityScore >= 40 && productivityScore <= 45 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 4: Monitoring Hours
const monitoringHours = getMonitoringHours();
console.log(`✓ Monitoring Hours: ${monitoringHours.toFixed(2)}h`);
console.log(`  Expected: 0.05h (3 minutes)`);
console.log(`  Status: ${monitoringHours === 0.05 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 5: Focused Window
const focusedWindow = getFocusedWindow();
console.log(`✓ Focused Window: ${focusedWindow?.application || 'None'}`);
console.log(`  Title: ${focusedWindow?.window_title || 'N/A'}`);
console.log(`  Memory: ${formatMemory(focusedWindow?.memory_usage_mb || 0)}`);
console.log(`  Expected: Code.exe (Visual Studio Code)`);
console.log(`  Status: ${focusedWindow?.application === 'Code.exe' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 6: Work Pattern Data
const hourlySummary = activityData.hourlySummary[0];
const productiveFocusMinutes = Math.round(hourlySummary.productiveFocusSec / 60);
console.log(`✓ Work Pattern (07:00 hour):`);
console.log(`  Productive Focus: ${productiveFocusMinutes} minutes (${hourlySummary.productiveFocusSec} sec)`);
console.log(`  Communication: ${hourlySummary.communicationFocusSec} sec`);
console.log(`  Idle: ${hourlySummary.idleSec} sec`);
console.log(`  Expected: 2 minutes productive focus`);
console.log(`  Status: ${productiveFocusMinutes === 2 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 7: Category Breakdown
const categories = {
  Productive: visibleApps.filter(a => a.category === 'Productive').length,
  Browsers: visibleApps.filter(a => a.category === 'Browsers').length,
  Communication: visibleApps.filter(a => a.category === 'Communication').length,
  Other: visibleApps.filter(a => !['Productive', 'Browsers', 'Communication'].includes(a.category)).length
};
console.log(`✓ Category Breakdown:`);
console.log(`  Productive: ${categories.Productive} apps (VS Code, Notepad++)`);
console.log(`  Browsers: ${categories.Browsers} apps (Chrome, Edge)`);
console.log(`  Communication: ${categories.Communication} apps`);
console.log(`  Expected: 2 Productive, 2 Browsers`);
console.log(`  Status: ${categories.Productive === 2 && categories.Browsers === 2 ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('=== All Tests Complete ===\n');
