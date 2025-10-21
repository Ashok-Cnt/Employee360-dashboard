/**
 * Local Storage Routes - Backend API
 * Handles file system operations for health metrics data
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Base directory for local storage
const BASE_DIR = 'C:\\Users\\GBS09538\\AppData\\Local\\Employee360';

// Helper: Ensure directory exists
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
}

// Helper: Read JSON file
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Helper: Write JSON file
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
}

// Helper: Append to daily data file
async function appendToDailyFile(filePath, newEntry) {
  let existingData = await readJSONFile(filePath);
  
  if (!existingData) {
    existingData = {
      entries: [],
      summary: {
        totalReadings: 0,
        avgHeartRate: null,
        totalSteps: 0,
        totalCalories: 0,
        totalDistance: 0
      }
    };
  }

  existingData.entries.push(newEntry);
  existingData.summary.totalReadings = existingData.entries.length;

  // Calculate averages
  const metrics = existingData.entries.filter(e => e.metrics);
  if (metrics.length > 0) {
    const heartRates = metrics.filter(e => e.metrics.heartRate).map(e => e.metrics.heartRate);
    if (heartRates.length > 0) {
      existingData.summary.avgHeartRate = Math.round(
        heartRates.reduce((a, b) => a + b, 0) / heartRates.length
      );
    }

    // Get latest values for cumulative metrics
    const latest = metrics[metrics.length - 1].metrics;
    existingData.summary.totalSteps = latest.steps || 0;
    existingData.summary.totalCalories = latest.calories || 0;
    existingData.summary.totalDistance = latest.distance || 0;
  }

  await writeJSONFile(filePath, existingData);
  return existingData;
}

// Initialize local storage
router.post('/initialize', async (req, res) => {
  try {
    const { baseDir } = req.body;
    const actualBaseDir = baseDir || BASE_DIR;

    // Create main directories
    const devicesDir = path.join(actualBaseDir, 'devices');
    const googleFitDir = path.join(actualBaseDir, 'google-fit');

    await ensureDirectory(devicesDir);
    await ensureDirectory(googleFitDir);

    res.json({
      success: true,
      baseDir: actualBaseDir,
      message: 'Local storage initialized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store BLE device data
router.post('/ble/store', async (req, res) => {
  try {
    const { deviceId, deviceName, date, timestamp, metrics } = req.body;

    // Create device directory structure
    const deviceDir = path.join(BASE_DIR, 'devices', deviceId);
    const dailyDir = path.join(deviceDir, 'daily');
    
    await ensureDirectory(dailyDir);

    // Store device info
    const deviceInfoPath = path.join(deviceDir, 'device-info.json');
    await writeJSONFile(deviceInfoPath, {
      deviceId,
      deviceName,
      lastUpdated: timestamp,
      type: 'BLE'
    });

    // Append to daily file
    const dailyFilePath = path.join(dailyDir, `${date}.json`);
    const dailyData = await appendToDailyFile(dailyFilePath, {
      timestamp,
      metrics
    });

    res.json({
      success: true,
      message: 'BLE data stored successfully',
      dailyData: dailyData.summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store Google Fit data
router.post('/google-fit/store', async (req, res) => {
  try {
    const { accountId, accountEmail, dailyData, syncedAt } = req.body;

    // Create account directory structure
    const accountDir = path.join(BASE_DIR, 'google-fit', accountId);
    const dailyDir = path.join(accountDir, 'daily');
    
    await ensureDirectory(dailyDir);

    // Store account info
    const accountInfoPath = path.join(accountDir, 'account-info.json');
    await writeJSONFile(accountInfoPath, {
      accountId,
      accountEmail,
      lastSynced: syncedAt,
      type: 'GoogleFit'
    });

    // Store each daily data point
    for (const dayData of dailyData) {
      const dailyFilePath = path.join(dailyDir, `${dayData.date}.json`);
      await writeJSONFile(dailyFilePath, {
        date: dayData.date,
        syncedAt,
        summary: {
          steps: dayData.steps || 0,
          calories: dayData.calories || 0,
          distance: dayData.distance || 0,
          activeMinutes: dayData.activeMinutes || 0
        }
      });
    }

    res.json({
      success: true,
      message: 'Google Fit data stored successfully',
      daysStored: dailyData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get daily data
router.get('/daily', async (req, res) => {
  try {
    const { source, sourceId, date } = req.query;

    const sourceDir = source === 'GoogleFit' ? 'google-fit' : 'devices';
    const dailyFilePath = path.join(BASE_DIR, sourceDir, sourceId, 'daily', `${date}.json`);

    const data = await readJSONFile(dailyFilePath);

    if (data) {
      res.json({ success: true, data });
    } else {
      res.json({ success: false, data: null, message: 'No data found for this date' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Summarize weekly data
router.post('/summarize/weekly', async (req, res) => {
  try {
    const { source, sourceId, weekKey } = req.body;

    const sourceDir = source === 'GoogleFit' ? 'google-fit' : 'devices';
    const dailyDir = path.join(BASE_DIR, sourceDir, sourceId, 'daily');
    const weeklyDir = path.join(BASE_DIR, sourceDir, sourceId, 'weekly');
    
    await ensureDirectory(weeklyDir);

    // Read all daily files
    const files = await fs.readdir(dailyDir);
    const dailyFiles = files.filter(f => f.endsWith('.json'));

    let totalSteps = 0;
    let totalCalories = 0;
    let totalDistance = 0;
    let avgHeartRate = 0;
    let heartRateCount = 0;
    let daysCount = 0;

    for (const file of dailyFiles) {
      const filePath = path.join(dailyDir, file);
      const dayData = await readJSONFile(filePath);

      if (dayData && dayData.summary) {
        totalSteps += dayData.summary.totalSteps || dayData.summary.steps || 0;
        totalCalories += dayData.summary.totalCalories || dayData.summary.calories || 0;
        totalDistance += dayData.summary.totalDistance || dayData.summary.distance || 0;
        
        if (dayData.summary.avgHeartRate) {
          avgHeartRate += dayData.summary.avgHeartRate;
          heartRateCount++;
        }
        
        daysCount++;
      }
    }

    const weeklySummary = {
      weekKey,
      period: {
        start: dailyFiles[0]?.replace('.json', ''),
        end: dailyFiles[dailyFiles.length - 1]?.replace('.json', '')
      },
      summary: {
        totalSteps,
        totalCalories,
        totalDistance,
        avgHeartRate: heartRateCount > 0 ? Math.round(avgHeartRate / heartRateCount) : null,
        daysTracked: daysCount
      },
      createdAt: new Date().toISOString()
    };

    const weeklyFilePath = path.join(weeklyDir, `${weekKey}.json`);
    await writeJSONFile(weeklyFilePath, weeklySummary);

    res.json({
      success: true,
      message: 'Weekly summary created',
      summary: weeklySummary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Summarize monthly data
router.post('/summarize/monthly', async (req, res) => {
  try {
    const { source, sourceId, monthKey } = req.body;

    const sourceDir = source === 'GoogleFit' ? 'google-fit' : 'devices';
    const weeklyDir = path.join(BASE_DIR, sourceDir, sourceId, 'weekly');
    const monthlyDir = path.join(BASE_DIR, sourceDir, sourceId, 'monthly');
    
    await ensureDirectory(monthlyDir);

    // Read all weekly files for this month
    const files = await fs.readdir(weeklyDir);
    const weeklyFiles = files.filter(f => f.startsWith(monthKey.substring(0, 7))); // YYYY-MM

    let totalSteps = 0;
    let totalCalories = 0;
    let totalDistance = 0;
    let avgHeartRate = 0;
    let heartRateCount = 0;
    let weeksCount = 0;

    for (const file of weeklyFiles) {
      const filePath = path.join(weeklyDir, file);
      const weekData = await readJSONFile(filePath);

      if (weekData && weekData.summary) {
        totalSteps += weekData.summary.totalSteps || 0;
        totalCalories += weekData.summary.totalCalories || 0;
        totalDistance += weekData.summary.totalDistance || 0;
        
        if (weekData.summary.avgHeartRate) {
          avgHeartRate += weekData.summary.avgHeartRate;
          heartRateCount++;
        }
        
        weeksCount++;
      }
    }

    const monthlySummary = {
      monthKey,
      summary: {
        totalSteps,
        totalCalories,
        totalDistance,
        avgHeartRate: heartRateCount > 0 ? Math.round(avgHeartRate / heartRateCount) : null,
        weeksTracked: weeksCount
      },
      createdAt: new Date().toISOString()
    };

    const monthlyFilePath = path.join(monthlyDir, `${monthKey}.json`);
    await writeJSONFile(monthlyFilePath, monthlySummary);

    res.json({
      success: true,
      message: 'Monthly summary created',
      summary: monthlySummary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cleanup old data (older than 1 month)
router.post('/cleanup', async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const cutoffDate = oneMonthAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    let deletedCount = 0;

    // Clean up devices
    const devicesDir = path.join(BASE_DIR, 'devices');
    try {
      const devices = await fs.readdir(devicesDir);

      for (const deviceId of devices) {
        const dailyDir = path.join(devicesDir, deviceId, 'daily');
        try {
          const files = await fs.readdir(dailyDir);
          
          for (const file of files) {
            const dateStr = file.replace('.json', '');
            if (dateStr < cutoffDate) {
              await fs.unlink(path.join(dailyDir, file));
              deletedCount++;
            }
          }
        } catch (err) {
          // Directory doesn't exist or no files
        }
      }
    } catch (err) {
      // Devices directory doesn't exist
    }

    // Clean up Google Fit accounts
    const googleFitDir = path.join(BASE_DIR, 'google-fit');
    try {
      const accounts = await fs.readdir(googleFitDir);

      for (const accountId of accounts) {
        const dailyDir = path.join(googleFitDir, accountId, 'daily');
        try {
          const files = await fs.readdir(dailyDir);
          
          for (const file of files) {
            const dateStr = file.replace('.json', '');
            if (dateStr < cutoffDate) {
              await fs.unlink(path.join(dailyDir, file));
              deletedCount++;
            }
          }
        } catch (err) {
          // Directory doesn't exist or no files
        }
      }
    } catch (err) {
      // Google Fit directory doesn't exist
    }

    res.json({
      success: true,
      message: `Cleanup completed: ${deletedCount} old files deleted`,
      deletedCount,
      cutoffDate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get device list
router.get('/devices', async (req, res) => {
  try {
    const devicesDir = path.join(BASE_DIR, 'devices');
    const devices = [];

    try {
      const deviceIds = await fs.readdir(devicesDir);

      for (const deviceId of deviceIds) {
        const infoPath = path.join(devicesDir, deviceId, 'device-info.json');
        const info = await readJSONFile(infoPath);
        if (info) {
          devices.push(info);
        }
      }
    } catch (err) {
      // Directory doesn't exist
    }

    res.json({
      success: true,
      devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Google Fit account list
router.get('/google-fit/accounts', async (req, res) => {
  try {
    const googleFitDir = path.join(BASE_DIR, 'google-fit');
    const accounts = [];

    try {
      const accountIds = await fs.readdir(googleFitDir);

      for (const accountId of accountIds) {
        const infoPath = path.join(googleFitDir, accountId, 'account-info.json');
        const info = await readJSONFile(infoPath);
        if (info) {
          accounts.push(info);
        }
      }
    } catch (err) {
      // Directory doesn't exist
    }

    res.json({
      success: true,
      accounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
