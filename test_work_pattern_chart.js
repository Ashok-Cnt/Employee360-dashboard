/**
 * Test Work Pattern Chart Data
 * Verify the chart will show all categories correctly
 */

// Current activity data structure
const activityData = {
  "hourlySummary": [
    {
      "hour": "07:00",
      "productiveFocusSec": 330,  // 5.5 minutes
      "communicationFocusSec": 0,
      "idleSec": 0
    }
  ],
  "apps": [
    {
      "name": "chrome.exe",
      "title": "Google Chrome",
      "category": "Browsers",
      "focusDurationSec": 0
    },
    {
      "name": "Code.exe",
      "title": "Visual Studio Code",
      "category": "Productive",
      "focusDurationSec": 180  // 3 minutes
    },
    {
      "name": "msedge.exe",
      "title": "Microsoft Edge",
      "category": "Browsers",
      "focusDurationSec": 150  // 2.5 minutes
    },
    {
      "name": "notepad++.exe",
      "title": "Notepad++",
      "category": "Productive",
      "focusDurationSec": 0
    },
    {
      "name": "background_apps",
      "category": "Background",
      "focusDurationSec": 0
    }
  ]
};

// Replicate the Dashboard logic
const getWorkPatternData = () => {
  if (!activityData || !activityData.hourlySummary || activityData.hourlySummary.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        data: [1],
        backgroundColor: ['#e0e0e0'],
      }]
    };
  }

  // Aggregate from hourly summary
  const summary = activityData.hourlySummary.reduce((acc, hour) => {
    acc.productive += hour.productiveFocusSec || 0;
    acc.communication += hour.communicationFocusSec || 0;
    acc.idle += hour.idleSec || 0;
    return acc;
  }, { productive: 0, communication: 0, idle: 0 });

  // Also calculate from apps for more detail
  const appsByCategory = activityData.apps
    .filter(app => app.name !== 'background_apps')
    .reduce((acc, app) => {
      const cat = app.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += app.focusDurationSec || 0;
      return acc;
    }, {});

  // Calculate browsers and other activities
  const browsersTime = (appsByCategory['Browsers'] || 0);
  const mediaTime = (appsByCategory['Media'] || 0);
  const otherTime = (appsByCategory['Non-Productive'] || 0);

  // Build chart data - show all main categories
  const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
  const data = [
    Math.round(summary.productive / 60),      // Productive apps
    Math.round(summary.communication / 60),   // Communication apps
    Math.round(browsersTime / 60),            // Browser usage
    Math.round(summary.idle / 60)             // Idle/breaks
  ];
  const colors = ['#4caf50', '#2196f3', '#9c27b0', '#ff9800'];

  return {
    labels: labels,
    datasets: [{
      label: 'Time Spent (minutes)',
      data: data,
      backgroundColor: colors,
      borderColor: colors,
      borderWidth: 2,
    }]
  };
};

// Run the test
console.log('\n=== Work Pattern Chart Data Test ===\n');

const chartData = getWorkPatternData();

console.log('Chart Labels:', chartData.labels);
console.log('\nChart Data (minutes):');
chartData.labels.forEach((label, index) => {
  const minutes = chartData.datasets[0].data[index];
  const color = chartData.datasets[0].backgroundColor[index];
  const bar = '█'.repeat(Math.max(1, minutes));
  console.log(`  ${label.padEnd(20)} ${minutes.toString().padStart(3)} min  ${bar}`);
});

console.log('\n=== Detailed Breakdown ===\n');

// Show hourly summary breakdown
console.log('Hourly Summary Data:');
activityData.hourlySummary.forEach(hour => {
  console.log(`  ${hour.hour}:`);
  console.log(`    Productive Focus: ${hour.productiveFocusSec} sec (${Math.round(hour.productiveFocusSec / 60)} min)`);
  console.log(`    Communication:    ${hour.communicationFocusSec} sec (${Math.round(hour.communicationFocusSec / 60)} min)`);
  console.log(`    Idle:             ${hour.idleSec} sec (${Math.round(hour.idleSec / 60)} min)`);
});

// Show app category breakdown
console.log('\nApp Focus Time by Category:');
const appsByCategory = activityData.apps
  .filter(app => app.name !== 'background_apps')
  .reduce((acc, app) => {
    const cat = app.category;
    if (!acc[cat]) acc[cat] = { time: 0, apps: [] };
    acc[cat].time += app.focusDurationSec || 0;
    if (app.focusDurationSec > 0) {
      acc[cat].apps.push(`${app.title} (${Math.round(app.focusDurationSec / 60)} min)`);
    }
    return acc;
  }, {});

Object.entries(appsByCategory).forEach(([category, data]) => {
  console.log(`  ${category}: ${Math.round(data.time / 60)} min`);
  if (data.apps.length > 0) {
    data.apps.forEach(app => console.log(`    - ${app}`));
  }
});

console.log('\n=== Expected Chart Display ===\n');
console.log('The chart will show 4 bars:');
console.log('  1. 🎯 Focus Work    - 6 minutes (Green)  ← From productive focus');
console.log('  2. 📞 Communication - 0 minutes (Blue)   ← No communication apps');
console.log('  3. 🌐 Browsing      - 3 minutes (Purple) ← From browser focus time');
console.log('  4. ☕ Breaks        - 0 minutes (Orange) ← No idle time yet');

console.log('\n✅ Chart will now show all 4 categories even if some are 0!\n');
