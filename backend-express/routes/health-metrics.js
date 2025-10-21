const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

const HEALTH_DATA_FILE = path.join(__dirname, '../data/health_metrics.json');

// Initialize health data file if it doesn't exist
async function initHealthDataFile() {
  try {
    await fs.access(HEALTH_DATA_FILE);
  } catch {
    const initialData = {
      users: {},
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('📄 Created health_metrics.json');
  }
}

initHealthDataFile();

/**
 * POST /api/health/realtime - Store real-time BLE data
 */
router.post('/realtime', async (req, res) => {
  try {
    const { userId, deviceId, metrics, timestamp } = req.body;
    
    // Validate required fields
    if (!userId || !metrics) {
      return res.status(400).json({ error: 'Missing required fields: userId and metrics' });
    }

    // Read existing data
    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Initialize user data if needed
    if (!data.users[userId]) {
      data.users[userId] = {
        realtimeData: [],
        historicalData: [],
        connectedDevices: []
      };
    }

    // Add new real-time data point
    const dataPoint = {
      timestamp: timestamp || new Date().toISOString(),
      deviceId: deviceId || 'unknown',
      source: 'BLE',
      heartRate: metrics.heartRate || null,
      steps: metrics.steps || null,
      calories: metrics.calories || null,
      distance: metrics.distance || null,
      bloodOxygen: metrics.bloodOxygen || null,
      skinTemperature: metrics.skinTemperature || null,
      stressLevel: metrics.stressLevel || null,
      sleepData: metrics.sleepData || null
    };

    data.users[userId].realtimeData.push(dataPoint);

    // Keep only last 24 hours of real-time data (optimize storage)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    data.users[userId].realtimeData = data.users[userId].realtimeData
      .filter(d => d.timestamp >= oneDayAgo);

    // Update last updated timestamp
    data.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ 
      success: true, 
      message: 'Real-time data stored successfully',
      dataPoint 
    });
  } catch (error) {
    console.error('Error storing real-time health data:', error);
    res.status(500).json({ error: 'Failed to store health data', details: error.message });
  }
});

/**
 * GET /api/health/realtime - Get latest real-time data
 */
router.get('/realtime', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';
    const limit = parseInt(req.query.limit) || 100;

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.users[userId] || !data.users[userId].realtimeData) {
      return res.json({ 
        userId,
        realtimeData: [], 
        message: 'No BLE data available. Connect a device to start monitoring.',
        dataPoints: 0
      });
    }

    // Return most recent data points
    const realtimeData = data.users[userId].realtimeData
      .slice(-limit)
      .reverse(); // Most recent first

    res.json({
      userId,
      realtimeData,
      lastUpdated: data.lastUpdated,
      dataPoints: realtimeData.length
    });
  } catch (error) {
    console.error('Error fetching real-time health data:', error);
    res.status(500).json({ error: 'Failed to fetch health data', details: error.message });
  }
});

/**
 * POST /api/health/google-fit - Store Google Fit historical data
 */
router.post('/google-fit', async (req, res) => {
  try {
    const { userId, data: googleFitData, dateRange } = req.body;

    if (!userId || !googleFitData) {
      return res.status(400).json({ error: 'Missing required fields: userId and data' });
    }

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      data.users[userId] = {
        realtimeData: [],
        historicalData: [],
        connectedDevices: []
      };
    }

    // Process and store Google Fit data
    const historicalEntry = {
      source: 'GoogleFit',
      dateRange: dateRange || { start: new Date().toISOString(), end: new Date().toISOString() },
      data: googleFitData,
      syncedAt: new Date().toISOString(),
      entriesCount: Array.isArray(googleFitData) ? googleFitData.length : 0
    };

    data.users[userId].historicalData.push(historicalEntry);
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ 
      success: true, 
      message: 'Google Fit data stored successfully',
      entriesStored: historicalEntry.entriesCount,
      syncedAt: historicalEntry.syncedAt
    });
  } catch (error) {
    console.error('Error storing Google Fit data:', error);
    res.status(500).json({ error: 'Failed to store Google Fit data', details: error.message });
  }
});

/**
 * GET /api/health/historical - Get historical data
 */
router.get('/historical', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      return res.json({ 
        userId,
        historicalData: [], 
        message: 'No historical data available. Connect to Google Fit to sync past data.',
        totalEntries: 0
      });
    }

    let historicalData = data.users[userId].historicalData || [];

    // Filter by date range if provided
    if (startDate && endDate) {
      historicalData = historicalData.filter(entry => {
        const entryDate = new Date(entry.syncedAt);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
      });
    }

    res.json({
      userId,
      historicalData,
      totalEntries: historicalData.length
    });
  } catch (error) {
    console.error('Error fetching historical health data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data', details: error.message });
  }
});

/**
 * POST /api/health/device/connect - Register connected BLE device
 */
router.post('/device/connect', async (req, res) => {
  try {
    const { userId, deviceId, deviceName, deviceType } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({ error: 'Missing required fields: userId and deviceId' });
    }

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      data.users[userId] = {
        realtimeData: [],
        historicalData: [],
        connectedDevices: []
      };
    }

    // Check if device already connected
    const existingDeviceIndex = data.users[userId].connectedDevices
      .findIndex(d => d.deviceId === deviceId);

    const deviceInfo = {
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      deviceType: deviceType || 'Fitness Tracker',
      lastConnected: new Date().toISOString(),
      status: 'connected'
    };

    if (existingDeviceIndex >= 0) {
      // Update existing device
      data.users[userId].connectedDevices[existingDeviceIndex] = {
        ...data.users[userId].connectedDevices[existingDeviceIndex],
        ...deviceInfo
      };
    } else {
      // Add new device
      deviceInfo.connectedAt = new Date().toISOString();
      data.users[userId].connectedDevices.push(deviceInfo);
    }

    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ 
      success: true, 
      message: 'Device connected successfully',
      device: deviceInfo
    });
  } catch (error) {
    console.error('Error connecting device:', error);
    res.status(500).json({ error: 'Failed to connect device', details: error.message });
  }
});

/**
 * POST /api/health/device/disconnect - Disconnect BLE device
 */
router.post('/device/disconnect', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({ error: 'Missing required fields: userId and deviceId' });
    }

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deviceIndex = data.users[userId].connectedDevices
      .findIndex(d => d.deviceId === deviceId);

    if (deviceIndex >= 0) {
      data.users[userId].connectedDevices[deviceIndex].status = 'disconnected';
      data.users[userId].connectedDevices[deviceIndex].lastDisconnected = new Date().toISOString();
      
      await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));
      
      res.json({ 
        success: true, 
        message: 'Device disconnected successfully'
      });
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (error) {
    console.error('Error disconnecting device:', error);
    res.status(500).json({ error: 'Failed to disconnect device', details: error.message });
  }
});

/**
 * GET /api/health/devices - Get connected devices
 */
router.get('/devices', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      return res.json({ 
        userId,
        devices: [],
        message: 'No devices connected'
      });
    }

    res.json({
      userId,
      devices: data.users[userId].connectedDevices || [],
      totalDevices: (data.users[userId].connectedDevices || []).length
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices', details: error.message });
  }
});

/**
 * GET /api/health/summary - Get health summary for dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      return res.json({ 
        userId,
        summary: null,
        message: 'No health data available'
      });
    }

    const userData = data.users[userId];
    const latestRealtime = userData.realtimeData[userData.realtimeData.length - 1];
    const connectedDevice = userData.connectedDevices.find(d => d.status === 'connected');

    const summary = {
      dataSource: connectedDevice ? 'BLE' : 'GoogleFit',
      activeDevice: connectedDevice || null,
      latestMetrics: latestRealtime || null,
      totalRealtimeDataPoints: userData.realtimeData.length,
      totalHistoricalEntries: userData.historicalData.length,
      lastUpdated: latestRealtime ? latestRealtime.timestamp : data.lastUpdated
    };

    res.json({
      userId,
      summary
    });
  } catch (error) {
    console.error('Error fetching health summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary', details: error.message });
  }
});

module.exports = router;
