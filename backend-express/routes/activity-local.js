const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const fs_stream = require('fs');

// Get data directory from environment or use default
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data-collector/activity_data');

/**
 * Get list of available dates with activity data
 */
router.get('/available-dates', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    
    // Extract dates from JSONL activity files
    const dates = files
      .filter(f => f.startsWith('activity_') && f.endsWith('.jsonl'))
      .map(f => {
        const match = f.match(/activity_(\d{4}-\d{2}-\d{2})_/);
        return match ? match[1] : null;
      })
      .filter(d => d !== null)
      .sort()
      .reverse();
    
    res.json({ dates });
  } catch (error) {
    console.error('Error reading available dates:', error);
    res.status(500).json({ error: 'Failed to read available dates' });
  }
});

/**
 * Get daily summary report (aggregated from JSONL snapshots)
 */
router.get('/daily-summary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.query.user_id || process.env.USER_ID || 'Admin';
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const jsonlFile = path.join(DATA_DIR, `activity_${date}_${userId}.jsonl`);
    
    try {
      // Read and use last snapshot from JSONL file as the daily summary
      const data = await fs.readFile(jsonlFile, 'utf-8');
      const lines = data.trim().split('\n').filter(l => l.trim());
      
      if (lines.length === 0) {
        return res.status(404).json({ error: 'No data available for this date' });
      }
      
      // The last snapshot contains cumulative data for the entire day
      const dailySummary = JSON.parse(lines[lines.length - 1]);
      res.json(dailySummary);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({ error: 'No data available for this date' });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error reading daily summary:', error);
    res.status(500).json({ error: 'Failed to read daily summary' });
  }
});

/**
 * Get today's live data (aggregated from JSONL snapshots)
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.query.user_id || process.env.USER_ID || 'Admin';
    
    const jsonlFile = path.join(DATA_DIR, `activity_${today}_${userId}.jsonl`);
    
    try {
      // Read and aggregate all snapshots from today's JSONL file
      const data = await fs.readFile(jsonlFile, 'utf-8');
      const lines = data.trim().split('\n').filter(l => l.trim());
      
      if (lines.length === 0) {
        return res.json({
          timestamp: new Date().toISOString(),
          system: {
            cpuUsage: 0,
            memoryUsageMB: 0,
            batteryPercent: null,
            isCharging: null,
            uptimeSec: 0,
            idleTimeSec: 0,
            isIdle: false,
            aggregates: {
              overallMonitoringHours: 0,
              productiveHours: 0,
              communicationHours: 0,
              idleHours: 0,
              avgCPU: 0
            }
          },
          apps: [],
          hourlySummary: []
        });
      }
      
      // Use the last snapshot as the current state
      const lastSnapshot = JSON.parse(lines[lines.length - 1]);
      
      res.json(lastSnapshot);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        // If no JSONL file exists yet, return empty structure
        res.json({
          timestamp: new Date().toISOString(),
          system: {
            cpuUsage: 0,
            memoryUsageMB: 0,
            batteryPercent: null,
            isCharging: null,
            uptimeSec: 0,
            idleTimeSec: 0,
            isIdle: false,
            aggregates: {
              overallMonitoringHours: 0,
              productiveHours: 0,
              communicationHours: 0,
              idleHours: 0,
              avgCPU: 0
            }
          },
          apps: [],
          hourlySummary: []
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error reading today\'s data:', error);
    res.status(500).json({ error: 'Failed to read today\'s data' });
  }
});

/**
 * Get raw JSONL data for a specific date (paginated)
 */
router.get('/raw-data/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.query.user_id || process.env.USER_ID || 'Admin';
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const jsonlFile = path.join(DATA_DIR, `activity_${date}_${userId}.jsonl`);
    
    try {
      const records = [];
      let lineNumber = 0;
      
      const fileStream = fs_stream.createReadStream(jsonlFile);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      for await (const line of rl) {
        if (lineNumber >= offset && lineNumber < offset + limit) {
          try {
            const record = JSON.parse(line);
            records.push(record);
          } catch (parseError) {
            console.warn(`Failed to parse line ${lineNumber}:`, parseError.message);
          }
        }
        lineNumber++;
        
        if (lineNumber >= offset + limit) {
          break;
        }
      }
      
      res.json({
        date,
        offset,
        limit,
        count: records.length,
        total: lineNumber,
        records
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({ error: 'No raw data available for this date' });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error reading raw data:', error);
    res.status(500).json({ error: 'Failed to read raw data' });
  }
});

/**
 * Get current activity (last snapshot from today's JSONL)
 */
router.get('/current', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.query.user_id || process.env.USER_ID || 'Admin';
    
    const jsonlFile = path.join(DATA_DIR, `activity_${today}_${userId}.jsonl`);
    
    try {
      // Read last line of JSONL file
      const data = await fs.readFile(jsonlFile, 'utf-8');
      const lines = data.trim().split('\n');
      
      if (lines.length === 0) {
        return res.json({ error: 'No data available yet' });
      }
      
      const lastLine = lines[lines.length - 1];
      const lastSnapshot = JSON.parse(lastLine);
      
      res.json(lastSnapshot);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({ error: 'No activity data available for today yet' });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Error reading current activity:', error);
    res.status(500).json({ error: 'Failed to read current activity' });
  }
});

/**
 * Get statistics for a date range
 */
router.get('/stats', async (req, res) => {
  try {
    const startDate = req.query.start_date || new Date().toISOString().split('T')[0];
    const endDate = req.query.end_date || startDate;
    const userId = req.query.user_id || process.env.USER_ID || 'Admin';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const stats = {
      totalDays: 0,
      totalMonitoringHours: 0,
      totalProductiveHours: 0,
      totalCommunicationHours: 0,
      totalIdleHours: 0,
      avgCPU: 0,
      avgMemoryMB: 0,
      topApps: {}
    };
    
    let cpuSum = 0;
    let memorySum = 0;
    let daysWithData = 0;
    
    // Iterate through date range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const jsonlFile = path.join(DATA_DIR, `activity_${dateStr}_${userId}.jsonl`);
      
      try {
        // Read last snapshot from JSONL file as the daily summary
        const data = await fs.readFile(jsonlFile, 'utf-8');
        const lines = data.trim().split('\n').filter(l => l.trim());
        
        if (lines.length === 0) continue;
        
        const summary = JSON.parse(lines[lines.length - 1]);
        
        daysWithData++;
        stats.totalMonitoringHours += summary.system.aggregates.overallMonitoringHours || 0;
        stats.totalProductiveHours += summary.system.aggregates.productiveHours || 0;
        stats.totalCommunicationHours += summary.system.aggregates.communicationHours || 0;
        stats.totalIdleHours += summary.system.aggregates.idleHours || 0;
        
        cpuSum += summary.system.aggregates.avgCPU || 0;
        memorySum += summary.system.memoryUsageMB || 0;
        
        // Aggregate top apps
        for (const app of summary.apps) {
          if (!stats.topApps[app.title]) {
            stats.topApps[app.title] = {
              name: app.title,
              category: app.category,
              totalRunHours: 0,
              totalFocusHours: 0
            };
          }
          stats.topApps[app.title].totalRunHours += app.aggregates.totalRunHours || 0;
          stats.topApps[app.title].totalFocusHours += app.aggregates.totalFocusHours || 0;
        }
      } catch (fileError) {
        // File doesn't exist for this date, skip
        continue;
      }
    }
    
    stats.totalDays = daysWithData;
    stats.avgCPU = daysWithData > 0 ? cpuSum / daysWithData : 0;
    stats.avgMemoryMB = daysWithData > 0 ? memorySum / daysWithData : 0;
    
    // Convert topApps to array and sort
    stats.topApps = Object.values(stats.topApps)
      .sort((a, b) => b.totalFocusHours - a.totalFocusHours)
      .slice(0, 10);
    
    res.json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

/**
 * Health check
 */
router.get('/health', async (req, res) => {
  try {
    // Check if data directory exists
    await fs.access(DATA_DIR);
    
    // Count files
    const files = await fs.readdir(DATA_DIR);
    const summaryFiles = files.filter(f => f.startsWith('summary_')).length;
    const jsonlFiles = files.filter(f => f.startsWith('activity_')).length;
    
    res.json({
      status: 'healthy',
      dataDirectory: DATA_DIR,
      summaryFiles,
      jsonlFiles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
