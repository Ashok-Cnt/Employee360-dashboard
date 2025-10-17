const express = require('express');
const router = express.Router();

// Helper function to get the most recent active user
async function getCurrentActiveUser(readJSONFile, activityFile) {
  try {
    const activities = await readJSONFile(activityFile);
    
    if (activities.length === 0) {
      return 'Admin';
    }
    
    // Get the user with the most recent activity (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentActivity = activities
      .filter(a => new Date(a.timestamp) >= fiveMinutesAgo)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (recentActivity) {
      return recentActivity.user_id;
    }
    
    // If no recent activity, get the user with the most recent data overall
    const latestActivity = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    return latestActivity ? latestActivity.user_id : 'Admin';
  } catch (error) {
    console.error('Error getting current active user:', error);
    return 'Admin'; // fallback to Admin
  }
}

// Get current active user endpoint
router.get('/current-user', async (req, res) => {
  try {
    const currentUser = await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    res.json({ user_id: currentUser });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// Get current application activity
router.get('/current', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    
    // Get only the most recent record for each unique application
    const currentApps = activities
      .filter(a => a.user_id === userId && a.is_active)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Remove duplicates by application name, keeping most recent
    const uniqueApps = [];
    const seenApps = new Set();
    
    for (const app of currentApps) {
      if (!seenApps.has(app.application)) {
        uniqueApps.push(app);
        seenApps.add(app.application);
      }
    }
    
    // Sort: focused apps first, then by timestamp
    uniqueApps.sort((a, b) => {
      if (a.is_focused && !b.is_focused) return -1;
      if (!a.is_focused && b.is_focused) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    res.json(uniqueApps.slice(0, 50));
  } catch (error) {
    console.error('Error fetching current applications:', error);
    res.status(500).json({ error: 'Failed to fetch current applications' });
  }
});

// Get application activity summary
router.get('/summary', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    const period = req.query.period || 'today';
    const hours = parseInt(req.query.hours) || 24;
    
    let dateFilter;
    const now = new Date();
    
    // Handle both period and hours parameters
    if (req.query.hours) {
      const hoursAgo = new Date(now.getTime() - hours * 60 * 60 * 1000);
      dateFilter = hoursAgo;
    } else {
      switch (period) {
        case 'today':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }
    
    // Filter activities
    const filteredActivities = activities.filter(a => 
      a.user_id === userId && new Date(a.timestamp) >= dateFilter
    );
    
    // Group by application
    const appGroups = {};
    filteredActivities.forEach(activity => {
      const appName = activity.application;
      if (!appGroups[appName]) {
        appGroups[appName] = {
          activities: [],
          total_time_seconds: 0,
          memory_sum: 0,
          cpu_sum: 0,
          count: 0
        };
      }
      
      const duration = activity.duration_seconds || 60;
      appGroups[appName].total_time_seconds += duration;
      appGroups[appName].memory_sum += activity.memory_usage_mb || 0;
      appGroups[appName].cpu_sum += activity.cpu_usage_percent || 0;
      appGroups[appName].count++;
      appGroups[appName].last_used = activity.timestamp;
    });
    
    // Convert to summary array
    const summary = Object.entries(appGroups).map(([appName, data]) => ({
      application_name: appName,
      total_time: data.total_time_seconds,
      total_time_seconds: Math.round(data.total_time_seconds),
      total_time_minutes: Math.round(data.total_time_seconds / 60 * 10) / 10,
      total_usage: data.count,
      total_usage_count: data.count,
      avg_memory: Math.round(data.memory_sum / data.count * 100) / 100,
      avg_cpu: Math.round(data.cpu_sum / data.count * 100) / 100,
      last_used: data.last_used
    }));
    
    // Sort by time and limit to top 10
    summary.sort((a, b) => b.total_time_minutes - a.total_time_minutes);
    
    res.json(summary.slice(0, 10));
  } catch (error) {
    console.error('Error fetching application summary:', error);
    res.status(500).json({ error: 'Failed to fetch application summary' });
  }
});

// Get application statistics
router.get('/stats', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    const hours = parseInt(req.query.hours) || 24;
    
    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Filter by user and time
    const filteredActivities = activities.filter(a => 
      a.user_id === userId && new Date(a.timestamp) >= timeAgo
    );
    
    // Count currently active apps
    const activeAppsCount = new Set(
      activities
        .filter(a => a.user_id === userId && a.is_active)
        .map(a => a.application)
    ).size;
    
    // Calculate stats
    const uniqueApps = new Set(filteredActivities.map(a => a.application));
    const totalTime = filteredActivities.reduce((sum, a) => sum + (a.duration_seconds || 60), 0);
    const totalSessions = filteredActivities.length;
    
    const avgMemory = filteredActivities.reduce((sum, a) => sum + (a.memory_usage_mb || 0), 0) / filteredActivities.length || 0;
    const avgCpu = filteredActivities.reduce((sum, a) => sum + (a.cpu_usage_percent || 0), 0) / filteredActivities.length || 0;
    const peakMemory = Math.max(...filteredActivities.map(a => a.memory_usage_mb || 0), 0);
    
    // Get most used app
    const appCounts = {};
    filteredActivities.forEach(a => {
      appCounts[a.application] = (appCounts[a.application] || 0) + 1;
    });
    const mostUsedApp = Object.entries(appCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    // Calculate average concurrent apps by grouping by minute
    const minuteGroups = {};
    filteredActivities.forEach(a => {
      const minute = new Date(a.timestamp).toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
      if (!minuteGroups[minute]) minuteGroups[minute] = new Set();
      minuteGroups[minute].add(a.application);
    });
    
    const avgConcurrent = Object.values(minuteGroups).reduce((sum, set) => sum + set.size, 0) / Object.keys(minuteGroups).length || 0;
    
    const result = {
      unique_applications: uniqueApps.size,
      total_monitoring_time_hours: Math.round(totalTime / 3600 * 100) / 100,
      total_time_hours: Math.round(totalTime / 3600 * 100) / 100,
      total_sessions: totalSessions,
      avg_memory_mb: Math.round(avgMemory * 100) / 100,
      avg_cpu_percent: Math.round(avgCpu * 100) / 100,
      peak_memory_usage_gb: Math.round(peakMemory / 1024 * 100) / 100,
      most_used_app: mostUsedApp,
      currently_active_apps: activeAppsCount,
      average_applications_running: Math.round(avgConcurrent * 100) / 100
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ error: 'Failed to fetch application statistics' });
  }
});

// Get focused window information
router.get('/focused-window', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    
    // Get the currently focused application (most recent with is_focused: true)
    const focusedApp = activities
      .filter(a => a.user_id === userId && a.is_active && a.is_focused)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (!focusedApp) {
      return res.json({ 
        application: null, 
        window_title: null, 
        timestamp: null,
        is_focused: false 
      });
    }
    
    res.json({
      application: focusedApp.application,
      window_title: focusedApp.window_title || focusedApp.application,
      timestamp: focusedApp.timestamp,
      memory_usage_mb: focusedApp.memory_usage_mb,
      cpu_usage_percent: focusedApp.cpu_usage_percent,
      is_focused: true
    });
  } catch (error) {
    console.error('Error fetching focused window:', error);
    res.status(500).json({ error: 'Failed to fetch focused window information' });
  }
});

// Get top memory usage applications
router.get('/top-memory-usage', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    const limit = parseInt(req.query.limit) || 10;
    
    // Get unique applications sorted by memory usage (prevent duplicates)
    const activeApps = activities
      .filter(a => a.user_id === userId && a.is_active)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Remove duplicates by application name, keeping most recent
    const uniqueApps = [];
    const seenApps = new Set();
    
    for (const app of activeApps) {
      if (!seenApps.has(app.application)) {
        uniqueApps.push(app);
        seenApps.add(app.application);
      }
    }
    
    // Sort by memory and limit
    uniqueApps.sort((a, b) => (b.memory_usage_mb || 0) - (a.memory_usage_mb || 0));
    
    const topMemoryApps = uniqueApps.slice(0, limit).map(app => ({
      application: app.application,
      current_memory_mb: Math.round(app.memory_usage_mb * 100) / 100,
      cpu_usage_percent: Math.round(app.cpu_usage_percent * 100) / 100,
      is_focused: app.is_focused || false,
      last_updated: app.timestamp
    }));
    
    res.json(topMemoryApps);
  } catch (error) {
    console.error('Error fetching top memory usage:', error);
    res.status(500).json({ error: 'Failed to fetch top memory usage applications' });
  }
});

// Get application activity timeline
router.get('/timeline', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity);
    const hours = parseInt(req.query.hours) || 24;
    
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const timeline = activities
      .filter(a => a.user_id === userId && new Date(a.timestamp) >= hoursAgo)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(0, 100);
    
    res.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch application timeline' });
  }
});

// Get work pattern analysis
router.get('/work-patterns', async (req, res) => {
  try {
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    const userId = req.query.user_id || await getCurrentActiveUser(req.app.locals.readJSONFile, req.app.locals.files.activity) || 'Admin';
    const hours = parseInt(req.query.hours) || 24;
    
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    console.log(`Fetching work patterns for user: ${userId}, since: ${hoursAgo.toISOString()}`);
    
    // Filter activities
    let filteredActivities = activities.filter(a => 
      a.user_id === userId && new Date(a.timestamp) >= hoursAgo
    );
    
    // If no recent data, use all available data
    if (filteredActivities.length === 0) {
      filteredActivities = activities.filter(a => a.user_id === userId);
      console.log('No recent data found, using all available data for work pattern analysis');
    }
    
    console.log(`Total records for user ${userId}: ${activities.filter(a => a.user_id === userId).length}, Recent records (${hours}h): ${filteredActivities.length}`);
    
    // Function to categorize application
    const categorizeApplication = (appName) => {
      const app = appName.toLowerCase();
      
      // Focus applications
      if (app.includes('visual studio code') || app.includes('code') || app.includes('intellij') || 
          app.includes('eclipse') || app.includes('sublime') || app.includes('atom') || 
          app.includes('webstorm') || app.includes('pycharm') || app.includes('studio') ||
          app.includes('word') || app.includes('excel') || app.includes('powerpoint') ||
          app.includes('photoshop') || app.includes('illustrator') || app.includes('figma') ||
          app.includes('autocad') || app.includes('blender')) {
        return 'focus';
      }
      
      // Meeting applications
      if (app.includes('teams') || app.includes('zoom') || app.includes('skype') || 
          app.includes('meet') || app.includes('webex') || app.includes('slack') ||
          app.includes('discord') || app.includes('whatsapp') || app.includes('telegram') ||
          app.includes('outlook') || app.includes('gmail')) {
        return 'meetings';
      }
      
      // Break applications
      if (app.includes('chrome') || app.includes('firefox') || app.includes('edge') || 
          app.includes('safari') || app.includes('opera') || app.includes('youtube') ||
          app.includes('netflix') || app.includes('spotify') || app.includes('steam') ||
          app.includes('game') || app.includes('instagram') || app.includes('facebook') ||
          app.includes('twitter') || app.includes('tiktok')) {
        return 'breaks';
      }
      
      return 'other';
    };
    
    // Categorize and aggregate
    const patternGroups = {
      focus: { total_time_minutes: 0, sessions: [], apps: new Set() },
      meetings: { total_time_minutes: 0, sessions: [], apps: new Set() },
      breaks: { total_time_minutes: 0, sessions: [], apps: new Set() },
      other: { total_time_minutes: 0, sessions: [], apps: new Set() }
    };
    
    filteredActivities.forEach(activity => {
      const pattern = categorizeApplication(activity.application);
      const duration = (activity.duration_seconds || 60) / 60; // Convert to minutes
      
      patternGroups[pattern].total_time_minutes += duration;
      patternGroups[pattern].sessions.push(duration);
      patternGroups[pattern].apps.add(activity.application);
    });
    
    // Calculate work patterns
    const totalTime = Object.values(patternGroups).reduce((sum, p) => sum + p.total_time_minutes, 0);
    
    const workPatterns = Object.entries(patternGroups).map(([pattern, data]) => {
      const avgSession = data.sessions.length > 0 
        ? data.sessions.reduce((sum, s) => sum + s, 0) / data.sessions.length 
        : 0;
      
      return {
        pattern,
        total_time_minutes: Math.round(data.total_time_minutes * 10) / 10,
        total_time_hours: Math.round(data.total_time_minutes / 60 * 100) / 100,
        session_count: data.sessions.length,
        avg_session_duration_minutes: Math.round(avgSession * 10) / 10,
        unique_applications: data.apps.size,
        applications: Array.from(data.apps),
        percentage: totalTime > 0 ? Math.round((data.total_time_minutes / totalTime) * 100) : 0,
        productivity_score: pattern === 'focus' ? 100 : 
                           pattern === 'meetings' ? 75 : 
                           pattern === 'breaks' ? 25 : 50
      };
    }).sort((a, b) => b.total_time_minutes - a.total_time_minutes);
    
    // Calculate overall productivity metrics
    const focusTime = workPatterns.find(p => p.pattern === 'focus')?.total_time_minutes || 0;
    const meetingTime = workPatterns.find(p => p.pattern === 'meetings')?.total_time_minutes || 0;
    const breakTime = workPatterns.find(p => p.pattern === 'breaks')?.total_time_minutes || 0;
    const otherTime = workPatterns.find(p => p.pattern === 'other')?.total_time_minutes || 0;
    
    const productivityMetrics = {
      total_active_time_minutes: Math.round(totalTime * 10) / 10,
      focus_time_percentage: totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 0,
      meeting_time_percentage: totalTime > 0 ? Math.round((meetingTime / totalTime) * 100) : 0,
      break_time_percentage: totalTime > 0 ? Math.round((breakTime / totalTime) * 100) : 0,
      other_time_percentage: totalTime > 0 ? Math.round((otherTime / totalTime) * 100) : 0,
      productivity_score: totalTime > 0 ? Math.round(((focusTime * 1.0 + meetingTime * 0.75 + breakTime * 0.25 + otherTime * 0.5) / totalTime) * 100) : 0,
      total_records_analyzed: activities.filter(a => a.user_id === userId).length,
      time_period_analyzed: filteredActivities.length > 0 ? `${hours} hours` : 'All available data'
    };
    
    console.log('Final productivity metrics:', productivityMetrics);
    
    res.json({
      work_patterns: workPatterns,
      metrics: productivityMetrics,
      period_hours: hours,
      data_source: filteredActivities.length > 0 ? 'recent' : 'historical',
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching work patterns:', error);
    res.status(500).json({ error: 'Failed to fetch work pattern analysis' });
  }
});

module.exports = router;
