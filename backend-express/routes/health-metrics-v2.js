/**
 * Enhanced Health Metrics Routes
 * All business logic handled on backend
 * Frontend only displays data
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const bleService = require('../services/bleService');
const googleFitService = require('../services/googleFitService');
const { 
  generateMockBLEData, 
  generateMockGoogleFitData,
  mockDevices,
  mockGoogleFitAccounts
} = require('../mock-data/health-metrics-mock');

const HEALTH_DATA_FILE = path.join(__dirname, '../data/health_metrics.json');
const USE_MOCK_DATA = process.env.NODE_ENV === 'test' || process.env.USE_MOCK_HEALTH_DATA === 'true';

// Initialize health data file
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

// Initialize Google Fit service if credentials available
if (!USE_MOCK_DATA) {
  googleFitService.initialize();
}

/**
 * GET /api/health/config - Get service configuration
 */
router.get('/config', (req, res) => {
  res.json({
    useMockData: USE_MOCK_DATA,
    googleFitAvailable: googleFitService.isInitialized,
    bleAvailable: true, // BLE is browser-based
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== BLE DEVICE MANAGEMENT ====================

/**
 * POST /api/health/ble/register - Register BLE device connection
 * Called from frontend after browser establishes BLE connection
 */
router.post('/ble/register', async (req, res) => {
  try {
    const { userId, deviceId, deviceInfo } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Register device in backend service
    const device = bleService.registerDevice(deviceId, deviceInfo);

    // Store in database
    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      data.users[userId] = {
        realtimeData: [],
        historicalData: [],
        connectedDevices: []
      };
    }

    // Add or update device
    const existingIndex = data.users[userId].connectedDevices.findIndex(d => d.deviceId === deviceId);
    
    if (existingIndex >= 0) {
      data.users[userId].connectedDevices[existingIndex] = device;
    } else {
      data.users[userId].connectedDevices.push(device);
    }

    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: 'BLE device registered successfully',
      device
    });
  } catch (error) {
    console.error('Error registering BLE device:', error);
    res.status(500).json({ error: 'Failed to register device', details: error.message });
  }
});

/**
 * POST /api/health/ble/unregister - Unregister BLE device
 */
router.post('/ble/unregister', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Unregister from backend service
    const device = bleService.unregisterDevice(deviceId);

    // Update database
    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (data.users[userId]) {
      const deviceIndex = data.users[userId].connectedDevices.findIndex(d => d.deviceId === deviceId);
      
      if (deviceIndex >= 0) {
        data.users[userId].connectedDevices[deviceIndex].status = 'disconnected';
        data.users[userId].connectedDevices[deviceIndex].disconnectedAt = new Date().toISOString();
      }

      await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));
    }

    res.json({
      success: true,
      message: 'BLE device unregistered successfully',
      device
    });
  } catch (error) {
    console.error('Error unregistering BLE device:', error);
    res.status(500).json({ error: 'Failed to unregister device', details: error.message });
  }
});

/**
 * POST /api/health/ble/data - Process BLE data from frontend
 */
router.post('/ble/data', async (req, res) => {
  try {
    const { userId, deviceId, metrics } = req.body;

    if (!deviceId || !metrics) {
      return res.status(400).json({ error: 'deviceId and metrics are required' });
    }

    // Process and validate data through backend service
    const processedData = bleService.processData(deviceId, metrics);

    // Store in database
    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      data.users[userId] = {
        realtimeData: [],
        historicalData: [],
        connectedDevices: []
      };
    }

    data.users[userId].realtimeData.push(processedData);

    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    data.users[userId].realtimeData = data.users[userId].realtimeData
      .filter(d => d.timestamp >= oneDayAgo);

    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: 'BLE data processed and stored',
      data: processedData
    });
  } catch (error) {
    console.error('Error processing BLE data:', error);
    res.status(500).json({ error: 'Failed to process data', details: error.message });
  }
});

/**
 * GET /api/health/ble/devices - Get available BLE devices (mock or real)
 */
router.get('/ble/devices', (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json({
        success: true,
        devices: mockDevices,
        source: 'mock'
      });
    }

    const devices = bleService.getConnectedDevices();
    
    res.json({
      success: true,
      devices,
      source: 'real'
    });
  } catch (error) {
    console.error('Error fetching BLE devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices', details: error.message });
  }
});

/**
 * GET /api/health/ble/mock-stream/:deviceId - Start mock BLE data stream
 */
router.post('/ble/mock-stream/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userId, interval = 5000 } = req.body;

    // Register mock device if not already registered
    const existingDevice = bleService.getDevice(deviceId);
    
    if (!existingDevice) {
      const mockDevice = mockDevices.find(d => d.deviceId === deviceId);
      if (!mockDevice) {
        return res.status(404).json({ error: 'Mock device not found' });
      }
      bleService.registerDevice(deviceId, mockDevice);
    }

    // Start mock data stream
    bleService.startMockDataStream(deviceId, interval);

    // Listen to mock data and store it
    bleService.on('mockDataGenerated', async ({ deviceId: generatedDeviceId, data }) => {
      if (generatedDeviceId === deviceId) {
        const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
        const fileData = JSON.parse(fileContent);

        if (!fileData.users[userId]) {
          fileData.users[userId] = {
            realtimeData: [],
            historicalData: [],
            connectedDevices: []
          };
        }

        fileData.users[userId].realtimeData.push(data);

        // Keep only last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        fileData.users[userId].realtimeData = fileData.users[userId].realtimeData
          .filter(d => d.timestamp >= oneDayAgo);

        await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(fileData, null, 2));
      }
    });

    res.json({
      success: true,
      message: 'Mock BLE data stream started',
      deviceId,
      interval
    });
  } catch (error) {
    console.error('Error starting mock stream:', error);
    res.status(500).json({ error: 'Failed to start mock stream', details: error.message });
  }
});

/**
 * POST /api/health/ble/mock-stream/:deviceId/stop - Stop mock BLE data stream
 */
router.post('/ble/mock-stream/:deviceId/stop', (req, res) => {
  try {
    const { deviceId } = req.params;
    bleService.stopDataStream(deviceId);

    res.json({
      success: true,
      message: 'Mock BLE data stream stopped',
      deviceId
    });
  } catch (error) {
    console.error('Error stopping mock stream:', error);
    res.status(500).json({ error: 'Failed to stop mock stream', details: error.message });
  }
});

// ==================== GOOGLE FIT MANAGEMENT ====================

/**
 * GET /api/health/google-fit/auth-url - Get Google OAuth URL
 */
router.get('/google-fit/auth-url', (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json({
        success: true,
        authUrl: '/api/health/google-fit/mock-auth',
        mock: true
      });
    }

    if (!googleFitService.isInitialized) {
      return res.status(503).json({ 
        error: 'Google Fit service not initialized',
        message: 'Please configure Google Fit credentials in .env'
      });
    }

    const authUrl = googleFitService.getAuthUrl();
    
    res.json({
      success: true,
      authUrl,
      mock: false
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
});

/**
 * GET /api/health/google-fit/callback - OAuth callback
 */
router.get('/google-fit/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    const tokens = await googleFitService.getTokenFromCode(code);
    
    // In production, you'd store these tokens securely (database, session, etc.)
    // For now, redirect to frontend with success message
    res.redirect(`http://localhost:3000/health?google_fit_connected=true`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`http://localhost:3000/health?google_fit_error=true`);
  }
});

/**
 * GET /api/health/google-fit/mock-auth - Mock Google Fit authentication
 */
router.get('/google-fit/mock-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Mock authentication successful',
    account: mockGoogleFitAccounts[0]
  });
});

/**
 * POST /api/health/google-fit/fetch - Fetch Google Fit data
 */
router.post('/google-fit/fetch', async (req, res) => {
  try {
    const { userId, startDate, endDate, accessToken } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    let activityData;

    if (USE_MOCK_DATA) {
      // Generate mock data
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      activityData = generateMockGoogleFitData('mock@gmail.com', days);
    } else {
      // Fetch real data
      if (!googleFitService.isInitialized) {
        return res.status(503).json({ error: 'Google Fit service not initialized' });
      }

      if (accessToken) {
        googleFitService.setAccessToken(accessToken);
      }

      activityData = await googleFitService.fetchActivityData(startDate, endDate);
    }

    // Store in database
    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      data.users[userId] = {
        realtimeData: [],
        historicalData: [],
        connectedDevices: []
      };
    }

    const historicalEntry = {
      source: USE_MOCK_DATA ? 'GoogleFit_Mock' : 'GoogleFit',
      dateRange: { start: startDate, end: endDate },
      data: activityData,
      syncedAt: new Date().toISOString(),
      entriesCount: activityData.length
    };

    data.users[userId].historicalData.push(historicalEntry);
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(HEALTH_DATA_FILE, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: 'Google Fit data fetched and stored',
      data: activityData,
      entriesCount: activityData.length,
      source: USE_MOCK_DATA ? 'mock' : 'real'
    });
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
    res.status(500).json({ error: 'Failed to fetch Google Fit data', details: error.message });
  }
});

/**
 * GET /api/health/google-fit/profile - Get user profile
 */
router.get('/google-fit/profile', async (req, res) => {
  try {
    const { accessToken } = req.query;

    if (USE_MOCK_DATA) {
      return res.json({
        success: true,
        profile: mockGoogleFitAccounts[0],
        source: 'mock'
      });
    }

    if (!googleFitService.isInitialized) {
      return res.status(503).json({ error: 'Google Fit service not initialized' });
    }

    if (accessToken) {
      googleFitService.setAccessToken(accessToken);
    }

    const profile = await googleFitService.getUserProfile();
    
    res.json({
      success: true,
      profile,
      source: 'real'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// ==================== DATA RETRIEVAL ====================

/**
 * GET /api/health/realtime - Get real-time BLE data
 */
router.get('/realtime', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';
    const limit = parseInt(req.query.limit) || 100;

    if (USE_MOCK_DATA) {
      const mockData = generateMockBLEData('MOCK_DEVICE_001', limit);
      return res.json({
        userId,
        realtimeData: mockData,
        dataPoints: mockData.length,
        source: 'mock'
      });
    }

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId] || !data.users[userId].realtimeData) {
      return res.json({
        userId,
        realtimeData: [],
        message: 'No real-time data available',
        dataPoints: 0,
        source: 'real'
      });
    }

    const realtimeData = data.users[userId].realtimeData.slice(-limit).reverse();

    res.json({
      userId,
      realtimeData,
      lastUpdated: data.lastUpdated,
      dataPoints: realtimeData.length,
      source: 'real'
    });
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    res.status(500).json({ error: 'Failed to fetch real-time data', details: error.message });
  }
});

/**
 * GET /api/health/historical - Get historical Google Fit data
 */
router.get('/historical', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    if (USE_MOCK_DATA) {
      const mockData = generateMockGoogleFitData('mock@gmail.com', 30);
      return res.json({
        userId,
        historicalData: mockData,
        totalEntries: mockData.length,
        source: 'mock'
      });
    }

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      return res.json({
        userId,
        historicalData: [],
        message: 'No historical data available',
        totalEntries: 0,
        source: 'real'
      });
    }

    let historicalData = data.users[userId].historicalData || [];

    if (startDate && endDate) {
      historicalData = historicalData.filter(entry => {
        const entryDate = new Date(entry.syncedAt);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
      });
    }

    res.json({
      userId,
      historicalData,
      totalEntries: historicalData.length,
      source: 'real'
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data', details: error.message });
  }
});

/**
 * GET /api/health/summary - Get health metrics summary
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';

    if (USE_MOCK_DATA) {
      const mockBLE = generateMockBLEData('MOCK_DEVICE_001', 1);
      const mockGoogleFit = generateMockGoogleFitData('mock@gmail.com', 7);
      
      return res.json({
        userId,
        summary: {
          dataSource: 'Mock',
          activeDevice: mockDevices[0],
          latestMetrics: mockBLE[0],
          recentActivity: mockGoogleFit.slice(0, 7),
          totalRealtimeDataPoints: 24,
          totalHistoricalEntries: 30
        },
        source: 'mock'
      });
    }

    const fileContent = await fs.readFile(HEALTH_DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.users[userId]) {
      return res.json({
        userId,
        summary: null,
        message: 'No health data available',
        source: 'real'
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
      summary,
      source: 'real'
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary', details: error.message });
  }
});

module.exports = router;
