const express = require('express');
const router = express.Router();

// Helper function to get the most recent active user
async function getCurrentActiveUser(db) {
  try {
    // Get the user with the most recent activity (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentActivity = await db.collection('application_activity')
      .findOne(
        { timestamp: { $gte: fiveMinutesAgo } },
        { sort: { timestamp: -1 } }
      );
    
    if (recentActivity) {
      return recentActivity.user_id;
    }
    
    // If no recent activity, get the user with the most recent data overall
    const latestActivity = await db.collection('application_activity')
      .findOne({}, { sort: { timestamp: -1 } });
    
    return latestActivity ? latestActivity.user_id : 'Admin';
  } catch (error) {
    console.error('Error getting current active user:', error);
    return 'Admin'; // fallback to Admin
  }
}

// Get current active user endpoint
router.get('/current-user', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const currentUser = await getCurrentActiveUser(db);
    res.json({ user_id: currentUser });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// Get current application activity
router.get('/current', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db);
    
    // Get only the most recent record for each unique application
    // This prevents duplicates when the page refreshes
    const pipeline = [
      { 
        $match: { 
          user_id: userId, 
          is_active: true 
        } 
      },
      // Sort by timestamp to get the most recent
      { $sort: { timestamp: -1 } },
      // Group by application name and take the first (most recent) document
      {
        $group: {
          _id: '$application',
          doc: { $first: '$$ROOT' }
        }
      },
      // Replace root with the document
      { $replaceRoot: { newRoot: '$doc' } },
      // Sort again - focused apps first, then by timestamp
      { $sort: { is_focused: -1, timestamp: -1 } },
      { $limit: 50 }
    ];
    
    const currentApps = await db.collection('application_activity')
      .aggregate(pipeline)
      .toArray();
    
    res.json(currentApps);
  } catch (error) {
    console.error('Error fetching current applications:', error);
    res.status(500).json({ error: 'Failed to fetch current applications' });
  }
});

// Get application activity summary
router.get('/summary', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db);
    const period = req.query.period || 'today';
    const hours = parseInt(req.query.hours) || 24;
    
    let dateFilter = {};
    const now = new Date();
    
    // Handle both period and hours parameters
    if (req.query.hours) {
      // Use hours parameter when provided
      const hoursAgo = new Date(now.getTime() - hours * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: hoursAgo } };
    } else {
      // Use period parameter
      switch (period) {
        case 'today':
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateFilter = { timestamp: { $gte: startOfDay } };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { timestamp: { $gte: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = { timestamp: { $gte: monthAgo } };
          break;
      }
    }
    
    const pipeline = [
      { $match: { user_id: userId, ...dateFilter } },
      {
        $group: {
          _id: '$application',
          total_time_seconds: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },
                '$duration_seconds',
                60  // Default to 60 seconds (1 minute) if duration_seconds is null or 0
              ]
            }
          },
          total_time_minutes: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },
                { $divide: ['$duration_seconds', 60] },
                1  // Default to 1 minute if duration_seconds is null or 0
              ]
            }
          },
          total_usage_count: { $sum: 1 },
          avg_memory: { $avg: '$memory_usage_mb' },
          avg_cpu: { $avg: '$cpu_usage_percent' },
          last_used: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          application_name: '$_id',
          total_time: '$total_time_seconds',  // Add this for frontend compatibility
          total_time_seconds: { $round: ['$total_time_seconds', 0] },
          total_time_minutes: { $round: ['$total_time_minutes', 1] },
          total_usage: '$total_usage_count',  // Rename for frontend compatibility
          total_usage_count: 1,
          avg_memory: { $round: ['$avg_memory', 2] },
          avg_cpu: { $round: ['$avg_cpu', 2] },
          last_used: 1
        }
      },
      { $sort: { total_time_minutes: -1 } },
      { $limit: 10 }
    ];
    
    const summary = await db.collection('application_activity').aggregate(pipeline).toArray();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching application summary:', error);
    res.status(500).json({ error: 'Failed to fetch application summary' });
  }
});

// Get application statistics
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db);
    const hours = parseInt(req.query.hours) || 24;
    
    // Calculate time range based on hours parameter
    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // First get count of currently active applications
    const activeAppsCount = await db.collection('application_activity')
      .countDocuments({ user_id: userId, is_active: true });
    
    console.log('Active apps count:', activeAppsCount);
    
    // Get stats for the specified time period
    const pipeline = [
      { $match: { user_id: userId, timestamp: { $gte: timeAgo } } },
      {
        $group: {
          _id: null,
          unique_applications: { $addToSet: '$application' },
          total_time: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },
                '$duration_seconds',
                60  // Default to 60 seconds (1 minute) if duration_seconds is null or 0
              ]
            }
          },
          total_sessions: { $sum: 1 },
          avg_memory: { $avg: '$memory_usage_mb' },
          avg_cpu: { $avg: '$cpu_usage_percent' },
          peak_memory: { $max: '$memory_usage_mb' },
          most_used_app: { $first: '$application' }
        }
      },
      {
        $project: {
          _id: 0,
          unique_applications: { $size: '$unique_applications' },
          total_monitoring_time_hours: { $divide: ['$total_time', 3600] },
          total_time_hours: { $divide: ['$total_time', 3600] },  // Add this for frontend compatibility
          total_sessions: 1,
          avg_memory_mb: { $round: ['$avg_memory', 2] },
          avg_cpu_percent: { $round: ['$avg_cpu', 2] },
          peak_memory_usage_gb: { $divide: [{ $round: ['$peak_memory', 2] }, 1024] },
          most_used_app: 1
        }
      }
    ];
    
    const stats = await db.collection('application_activity').aggregate(pipeline).toArray();
    console.log('Stats from aggregation:', stats);
    
    // Calculate average applications running (approximation based on sessions and time)
    const totalSessions = stats[0]?.total_sessions || 0;
    const totalTimeHours = stats[0]?.total_monitoring_time_hours || 0;
    const averageAppsRunning = totalTimeHours > 0 ? Math.round((totalSessions / totalTimeHours) * 100) / 100 : 0;
    
    const result = stats[0] || {
      unique_applications: 0,
      total_monitoring_time_hours: 0,
      total_sessions: 0,
      avg_memory_mb: 0,
      avg_cpu_percent: 0,
      peak_memory_usage_gb: 0,
      most_used_app: 'None'
    };
    
    // Add calculated fields with correct names expected by frontend
    result.currently_active_apps = activeAppsCount;
    result.average_applications_running = averageAppsRunning;
    
    // For better average calculation, let's get actual concurrent apps data
    try {
      const concurrentAppsPipeline = [
        { $match: { user_id: userId, timestamp: { $gte: timeAgo } } },
        {
          $group: {
            _id: { 
              timestamp: {
                $dateToString: {
                  format: "%Y-%m-%d %H:%M",
                  date: "$timestamp"
                }
              }
            },
            concurrent_apps: { $addToSet: '$application' }
          }
        },
        {
          $project: {
            concurrent_count: { $size: '$concurrent_apps' }
          }
        },
        {
          $group: {
            _id: null,
            avg_concurrent: { $avg: '$concurrent_count' }
          }
        }
      ];
      
      const concurrentStats = await db.collection('application_activity').aggregate(concurrentAppsPipeline).toArray();
      if (concurrentStats[0]?.avg_concurrent) {
        result.average_applications_running = Math.round(concurrentStats[0].avg_concurrent * 100) / 100;
      }
    } catch (concurrentError) {
      console.warn('Could not calculate concurrent apps average, using fallback:', concurrentError.message);
    }
    
    console.log('Final result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ error: 'Failed to fetch application statistics' });
  }
});

// Get focused window information
router.get('/focused-window', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db);
    
    // Get the currently focused application (most recent with is_focused: true)
    const focusedApp = await db.collection('application_activity')
      .findOne(
        { 
          user_id: userId, 
          is_active: true,
          is_focused: true 
        },
        { sort: { timestamp: -1 } }
      );
    
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
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db);
    const limit = parseInt(req.query.limit) || 10;
    
    // Get unique applications sorted by memory usage (prevent duplicates)
    const pipeline = [
      { 
        $match: { 
          user_id: userId, 
          is_active: true 
        } 
      },
      // Sort by timestamp to get most recent
      { $sort: { timestamp: -1 } },
      // Group by application and take the most recent record
      {
        $group: {
          _id: '$application',
          doc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
      // Sort by memory usage descending
      { $sort: { memory_usage_mb: -1 } },
      { $limit: limit },
      {
        $project: {
          application: 1,
          memory_usage_mb: 1,
          cpu_usage_percent: 1,
          is_focused: 1,
          timestamp: 1,
          _id: 0
        }
      }
    ];
    
    const topMemoryApps = await db.collection('application_activity')
      .aggregate(pipeline)
      .toArray();
    
    // Format the response
    const formattedApps = topMemoryApps.map(app => ({
      application: app.application,
      current_memory_mb: Math.round(app.memory_usage_mb * 100) / 100,
      cpu_usage_percent: Math.round(app.cpu_usage_percent * 100) / 100,
      is_focused: app.is_focused || false,
      last_updated: app.timestamp
    }));
    
    res.json(formattedApps);
  } catch (error) {
    console.error('Error fetching top memory usage:', error);
    res.status(500).json({ error: 'Failed to fetch top memory usage applications' });
  }
});

// Get application activity timeline
router.get('/timeline', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db);
    const hours = parseInt(req.query.hours) || 24;
    
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const activities = await db.collection('application_activity')
      .find({ 
        user_id: userId,
        timestamp: { $gte: hoursAgo }
      })
      .sort({ timestamp: 1 })
      .limit(100)
      .toArray();
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch application timeline' });
  }
});

// Get work pattern analysis
router.get('/work-patterns', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const userId = req.query.user_id || await getCurrentActiveUser(db) || 'Admin';
    const hours = parseInt(req.query.hours) || 24;
    
    // Use a more generous time range to capture all data
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    console.log(`Fetching work patterns for user: ${userId}, since: ${hoursAgo.toISOString()}`);
    
    // First check how many records we have in total
    const totalRecords = await db.collection('application_activity').countDocuments({ user_id: userId });
    const recentRecords = await db.collection('application_activity').countDocuments({ 
      user_id: userId, 
      timestamp: { $gte: hoursAgo } 
    });
    
    console.log(`Total records for user ${userId}: ${totalRecords}, Recent records (${hours}h): ${recentRecords}`);
    
    // If no recent records, use all available data
    let timeFilter = { user_id: userId };
    if (recentRecords > 0) {
      timeFilter.timestamp = { $gte: hoursAgo };
    } else {
      // Use all data if no recent data available
      console.log('No recent data found, using all available data for work pattern analysis');
    }
    
    // Define application categories for work pattern analysis
    const applicationCategories = {
      focus: [
        'Visual Studio Code', 'IntelliJ IDEA', 'Eclipse', 'Sublime Text', 'Atom', 'WebStorm',
        'PyCharm', 'Android Studio', 'Xcode', 'Notepad++', 'Vim', 'Emacs',
        'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Google Docs',
        'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Sketch',
        'AutoCAD', 'SolidWorks', 'Blender', '3ds Max'
      ],
      meetings: [
        'Microsoft Teams', 'Zoom', 'Skype', 'Google Meet', 'WebEx', 'GoToMeeting',
        'Slack', 'Discord', 'WhatsApp', 'Telegram', 'Signal',
        'Microsoft Outlook', 'Gmail', 'Thunderbird'
      ],
      breaks: [
        'Chrome', 'Firefox', 'Edge', 'Safari', 'Opera',
        'YouTube', 'Netflix', 'Spotify', 'iTunes', 'VLC Media Player',
        'Steam', 'Epic Games', 'Origin', 'Uplay',
        'WhatsApp Desktop', 'Telegram Desktop', 'Signal Desktop',
        'Instagram', 'Facebook', 'Twitter', 'TikTok'
      ]
    };
    
    // Function to categorize application
    const categorizeApplication = (appName) => {
      const app = appName.toLowerCase();
      
      for (const [category, apps] of Object.entries(applicationCategories)) {
        if (apps.some(categoryApp => app.includes(categoryApp.toLowerCase()))) {
          return category;
        }
      }
      
      // Additional smart categorization
      if (app.includes('code') || app.includes('studio') || app.includes('ide') || 
          app.includes('editor') || app.includes('development')) {
        return 'focus';
      }
      if (app.includes('meet') || app.includes('zoom') || app.includes('teams') || 
          app.includes('call') || app.includes('conference')) {
        return 'meetings';
      }
      if (app.includes('browser') || app.includes('chrome') || app.includes('firefox') || 
          app.includes('game') || app.includes('music') || app.includes('video')) {
        return 'breaks';
      }
      
      return 'other'; // Default category
    };
    
    // Aggregate work patterns
    const pipeline = [
      { $match: timeFilter },
      {
        $addFields: {
          work_pattern: {
            $switch: {
              branches: [
                // Focus applications
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: { $toLower: '$application' }, regex: /visual studio code|code|intellij|eclipse|sublime|atom|webstorm|pycharm|android studio|xcode|notepad\+\+|vim|emacs|word|excel|powerpoint|google docs|photoshop|illustrator|figma|sketch|autocad|solidworks|blender|3ds max/i } },
                    ]
                  },
                  then: 'focus'
                },
                // Meeting applications
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: { $toLower: '$application' }, regex: /microsoft teams|teams|zoom|skype|google meet|webex|gotomeeting|slack|discord|whatsapp|telegram|signal|outlook|gmail|thunderbird/i } },
                    ]
                  },
                  then: 'meetings'
                },
                // Break applications
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: { $toLower: '$application' }, regex: /chrome|firefox|edge|safari|opera|youtube|netflix|spotify|itunes|vlc|steam|epic games|origin|uplay|instagram|facebook|twitter|tiktok/i } },
                    ]
                  },
                  then: 'breaks'
                }
              ],
              default: 'other'
            }
          }
        }
      },
      {
        $group: {
          _id: '$work_pattern',
          total_time_minutes: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },
                { $divide: ['$duration_seconds', 60] },
                1  // Default to 1 minute if duration_seconds is null or 0
              ]
            }
          },
          session_count: { $sum: 1 },
          avg_session_duration: { 
            $avg: { 
              $cond: [
                { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },
                { $divide: ['$duration_seconds', 60] },
                1  // Default to 1 minute if duration_seconds is null or 0
              ]
            }
          },
          applications: { $addToSet: '$application' }
        }
      },
      {
        $project: {
          _id: 0,
          pattern: '$_id',
          total_time_minutes: { $round: ['$total_time_minutes', 1] },
          total_time_hours: { $round: [{ $divide: ['$total_time_minutes', 60] }, 2] },
          session_count: 1,
          avg_session_duration_minutes: { $round: ['$avg_session_duration', 1] },
          unique_applications: { $size: '$applications' },
          applications: 1
        }
      },
      { $sort: { total_time_minutes: -1 } }
    ];
    
    const workPatterns = await db.collection('application_activity').aggregate(pipeline).toArray();
    
    console.log('Raw work patterns result:', workPatterns);
    
    // Calculate percentages and additional metrics
    const totalTime = workPatterns.reduce((sum, pattern) => sum + pattern.total_time_minutes, 0);
    
    console.log('Total time calculated:', totalTime, 'minutes');
    
    const enrichedPatterns = workPatterns.map(pattern => ({
      ...pattern,
      percentage: totalTime > 0 ? Math.round((pattern.total_time_minutes / totalTime) * 100) : 0,
      productivity_score: pattern.pattern === 'focus' ? 100 : 
                         pattern.pattern === 'meetings' ? 75 : 
                         pattern.pattern === 'breaks' ? 25 : 50
    }));
    
    // Calculate overall productivity metrics
    const focusTime = enrichedPatterns.find(p => p.pattern === 'focus')?.total_time_minutes || 0;
    const meetingTime = enrichedPatterns.find(p => p.pattern === 'meetings')?.total_time_minutes || 0;
    const breakTime = enrichedPatterns.find(p => p.pattern === 'breaks')?.total_time_minutes || 0;
    const otherTime = enrichedPatterns.find(p => p.pattern === 'other')?.total_time_minutes || 0;
    
    const productivityMetrics = {
      total_active_time_minutes: totalTime,
      focus_time_percentage: totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 0,
      meeting_time_percentage: totalTime > 0 ? Math.round((meetingTime / totalTime) * 100) : 0,
      break_time_percentage: totalTime > 0 ? Math.round((breakTime / totalTime) * 100) : 0,
      other_time_percentage: totalTime > 0 ? Math.round((otherTime / totalTime) * 100) : 0,
      productivity_score: totalTime > 0 ? Math.round(((focusTime * 1.0 + meetingTime * 0.75 + breakTime * 0.25 + otherTime * 0.5) / totalTime) * 100) : 0,
      total_records_analyzed: totalRecords,
      time_period_analyzed: recentRecords > 0 ? `${hours} hours` : 'All available data'
    };
    
    console.log('Final productivity metrics:', productivityMetrics);
    
    res.json({
      work_patterns: enrichedPatterns,
      metrics: productivityMetrics,
      period_hours: hours,
      data_source: recentRecords > 0 ? 'recent' : 'historical',
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching work patterns:', error);
    res.status(500).json({ error: 'Failed to fetch work pattern analysis' });
  }
});

module.exports = router;