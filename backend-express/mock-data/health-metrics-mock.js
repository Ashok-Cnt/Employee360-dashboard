/**
 * Mock Health Metrics Data
 * Used when NODE_ENV=test or when real devices are not available
 */

const generateMockBLEData = (deviceId = 'MOCK_DEVICE_001', count = 24) => {
  const data = [];
  const now = Date.now();
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * 60 * 60 * 1000)); // Hourly data points
    
    data.push({
      timestamp: timestamp.toISOString(),
      deviceId,
      source: 'BLE_MOCK',
      heartRate: Math.floor(Math.random() * (85 - 60 + 1)) + 60, // 60-85 bpm
      steps: Math.floor(Math.random() * (500 - 100 + 1)) + 100, // 100-500 per hour
      calories: Math.floor(Math.random() * (80 - 30 + 1)) + 30, // 30-80 per hour
      distance: parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2)), // 0.1-0.5 km
      bloodOxygen: Math.floor(Math.random() * (100 - 95 + 1)) + 95, // 95-100%
      skinTemperature: parseFloat((Math.random() * (37.5 - 36.5) + 36.5).toFixed(1)), // 36.5-37.5°C
      stressLevel: Math.floor(Math.random() * (50 - 10 + 1)) + 10, // 10-50
      sleepData: null
    });
  }
  
  return data;
};

const generateMockGoogleFitData = (accountId = 'mock@gmail.com', days = 30) => {
  const data = [];
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - (i * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    
    data.push({
      date: dateStr,
      summary: {
        steps: Math.floor(Math.random() * (12000 - 5000 + 1)) + 5000,
        calories: Math.floor(Math.random() * (2500 - 1800 + 1)) + 1800,
        distance: parseFloat((Math.random() * (10 - 4) + 4).toFixed(2)),
        activeMinutes: Math.floor(Math.random() * (90 - 30 + 1)) + 30,
        heartRateAvg: Math.floor(Math.random() * (80 - 65 + 1)) + 65,
        heartRateMin: Math.floor(Math.random() * (60 - 50 + 1)) + 50,
        heartRateMax: Math.floor(Math.random() * (140 - 100 + 1)) + 100
      },
      activities: [
        {
          type: 'walking',
          duration: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
          calories: Math.floor(Math.random() * (200 - 100 + 1)) + 100
        },
        {
          type: 'running',
          duration: Math.floor(Math.random() * (30 - 10 + 1)) + 10,
          calories: Math.floor(Math.random() * (300 - 150 + 1)) + 150
        }
      ],
      sleep: {
        duration: Math.floor(Math.random() * (480 - 360 + 1)) + 360, // 6-8 hours in minutes
        deepSleep: Math.floor(Math.random() * (120 - 60 + 1)) + 60,
        lightSleep: Math.floor(Math.random() * (240 - 180 + 1)) + 180,
        remSleep: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
        awake: Math.floor(Math.random() * (40 - 20 + 1)) + 20
      }
    });
  }
  
  return data;
};

const mockDevices = [
  {
    deviceId: 'MOCK_DEVICE_001',
    deviceName: 'Mock Fitness Tracker Pro',
    deviceType: 'Fitness Tracker',
    manufacturer: 'MockTech Inc.',
    batteryLevel: 85,
    status: 'connected',
    capabilities: ['heart_rate', 'steps', 'calories', 'blood_oxygen', 'temperature']
  },
  {
    deviceId: 'MOCK_DEVICE_002',
    deviceName: 'Mock Smart Watch',
    deviceType: 'Smartwatch',
    manufacturer: 'MockWare Ltd.',
    batteryLevel: 62,
    status: 'available',
    capabilities: ['heart_rate', 'steps', 'calories', 'gps', 'sleep_tracking']
  }
];

const mockGoogleFitAccounts = [
  {
    id: 'mock_account_001',
    email: 'test@gmail.com',
    name: 'Test User',
    imageUrl: 'https://via.placeholder.com/150',
    authenticated: true,
    lastSync: new Date().toISOString()
  }
];

module.exports = {
  generateMockBLEData,
  generateMockGoogleFitData,
  mockDevices,
  mockGoogleFitAccounts
};


