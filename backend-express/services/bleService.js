/**
 * Backend BLE Service (Simulation/Proxy)
 * 
 * Note: Web Bluetooth API only works in browser context.
 * This service provides:
 * 1. Mock BLE data generation for testing
 * 2. Session management for BLE connections initiated from frontend
 * 3. Data validation and processing
 */

const EventEmitter = require('events');

class BLEBackendService extends EventEmitter {
  constructor() {
    super();
    this.connectedDevices = new Map();
    this.dataStreams = new Map();
  }

  /**
   * Register a BLE device connection (initiated from frontend)
   */
  registerDevice(deviceId, deviceInfo) {
    const device = {
      id: deviceId,
      name: deviceInfo.name || 'Unknown Device',
      type: deviceInfo.type || 'Fitness Tracker',
      manufacturer: deviceInfo.manufacturer || 'Unknown',
      batteryLevel: deviceInfo.batteryLevel || 100,
      connectedAt: new Date().toISOString(),
      status: 'connected',
      lastDataReceived: null
    };

    this.connectedDevices.set(deviceId, device);
    this.emit('deviceConnected', device);
    
    console.log(`✅ BLE Device registered: ${device.name} (${deviceId})`);
    return device;
  }

  /**
   * Unregister a BLE device
   */
  unregisterDevice(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    
    if (device) {
      device.status = 'disconnected';
      device.disconnectedAt = new Date().toISOString();
      
      this.connectedDevices.delete(deviceId);
      this.stopDataStream(deviceId);
      
      this.emit('deviceDisconnected', device);
      console.log(`❌ BLE Device unregistered: ${device.name} (${deviceId})`);
      
      return device;
    }
    
    return null;
  }

  /**
   * Process incoming BLE data from frontend
   */
  processData(deviceId, rawData) {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not registered`);
    }

    // Validate and normalize data
    const processedData = {
      timestamp: new Date().toISOString(),
      deviceId,
      source: 'BLE',
      heartRate: this.validateMetric(rawData.heartRate, 40, 200), // Valid range: 40-200 bpm
      steps: this.validateMetric(rawData.steps, 0, 1000000, true),
      calories: this.validateMetric(rawData.calories, 0, 10000, true),
      distance: this.validateMetric(rawData.distance, 0, 1000),
      bloodOxygen: this.validateMetric(rawData.bloodOxygen, 70, 100),
      skinTemperature: this.validateMetric(rawData.skinTemperature, 30, 42),
      stressLevel: this.validateMetric(rawData.stressLevel, 0, 100, true),
      sleepData: rawData.sleepData || null
    };

    // Update device last data received
    device.lastDataReceived = processedData.timestamp;
    
    this.emit('dataReceived', { deviceId, data: processedData });
    
    return processedData;
  }

  /**
   * Validate metric value is within acceptable range
   */
  validateMetric(value, min, max, allowNull = false) {
    if (value === null || value === undefined) {
      return allowNull ? null : min;
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return allowNull ? null : min;
    }
    
    // Clamp value to valid range
    return Math.max(min, Math.min(max, numValue));
  }

  /**
   * Generate mock BLE data stream (for testing)
   */
  startMockDataStream(deviceId, interval = 5000) {
    if (this.dataStreams.has(deviceId)) {
      console.warn(`Data stream already active for device ${deviceId}`);
      return;
    }

    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not registered`);
    }

    console.log(`🔄 Starting mock data stream for ${device.name}`);

    const intervalId = setInterval(() => {
      const mockData = this.generateMockData();
      const processedData = this.processData(deviceId, mockData);
      
      // Emit event for any listeners
      this.emit('mockDataGenerated', { deviceId, data: processedData });
    }, interval);

    this.dataStreams.set(deviceId, intervalId);
  }

  /**
   * Stop mock data stream
   */
  stopDataStream(deviceId) {
    const intervalId = this.dataStreams.get(deviceId);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.dataStreams.delete(deviceId);
      console.log(`⏹️ Stopped data stream for device ${deviceId}`);
    }
  }

  /**
   * Generate realistic mock health data
   */
  generateMockData() {
    return {
      heartRate: Math.floor(Math.random() * (85 - 60 + 1)) + 60,
      steps: Math.floor(Math.random() * 50), // Steps in 5 second interval
      calories: parseFloat((Math.random() * 2).toFixed(2)),
      distance: parseFloat((Math.random() * 0.01).toFixed(3)),
      bloodOxygen: Math.floor(Math.random() * (100 - 95 + 1)) + 95,
      skinTemperature: parseFloat((Math.random() * (37.5 - 36.5) + 36.5).toFixed(1)),
      stressLevel: Math.floor(Math.random() * (50 - 10 + 1)) + 10,
      sleepData: null
    };
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices() {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Get specific device info
   */
  getDevice(deviceId) {
    return this.connectedDevices.get(deviceId) || null;
  }

  /**
   * Update device battery level
   */
  updateBatteryLevel(deviceId, level) {
    const device = this.connectedDevices.get(deviceId);
    
    if (device) {
      device.batteryLevel = this.validateMetric(level, 0, 100, false);
      this.emit('batteryUpdated', { deviceId, level: device.batteryLevel });
      return device.batteryLevel;
    }
    
    return null;
  }
}

// Export singleton instance
module.exports = new BLEBackendService();
