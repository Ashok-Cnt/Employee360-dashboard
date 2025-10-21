/**
 * Web Bluetooth API Service for Health Device Integration
 * Supports: Fitness trackers, smartwatches, heart rate monitors
 * 
 * Supported browsers: Chrome, Edge, Opera
 * Required: HTTPS or localhost
 */

// Standard Bluetooth GATT Services for health devices
const SERVICES = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  FITNESS: '0000183e-0000-1000-8000-00805f9b34fb',
  BODY_COMPOSITION: '0000181b-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
  BATTERY: '0000180f-0000-1000-8000-00805f9b34fb'
};

const CHARACTERISTICS = {
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BODY_SENSOR_LOCATION: '00002a38-0000-1000-8000-00805f9b34fb',
  DEVICE_NAME: '00002a00-0000-1000-8000-00805f9b34fb',
  MANUFACTURER_NAME: '00002a29-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb'
};

class BLEService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristics = new Map();
    this.isConnected = false;
    this.dataCallbacks = [];
    this.connectionCallbacks = [];
  }

  /**
   * Check if Web Bluetooth is supported in this browser
   */
  isSupported() {
    if (!navigator.bluetooth) {
      console.warn('Web Bluetooth API is not supported in this browser.');
      return false;
    }
    return true;
  }

  /**
   * Scan for and connect to a BLE health device
   */
  async scanAndConnect() {
    try {
      if (!this.isSupported()) {
        throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
      }

      console.log('🔍 Scanning for BLE health devices...');

      // Request device with health-related services
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SERVICES.HEART_RATE] }
        ],
        optionalServices: [
          SERVICES.HEART_RATE,
          SERVICES.FITNESS,
          SERVICES.BODY_COMPOSITION,
          SERVICES.DEVICE_INFO,
          SERVICES.BATTERY
        ]
      });

      console.log('✅ Device selected:', this.device.name);

      // Connect to GATT server
      console.log('🔗 Connecting to GATT server...');
      this.server = await this.device.gatt.connect();
      console.log('✅ Connected to GATT server');

      this.isConnected = true;

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Get device information
      const deviceInfo = await this.getDeviceInfo();

      // Notify connection callbacks
      this.notifyConnectionCallbacks(true, deviceInfo);

      return {
        success: true,
        device: {
          id: this.device.id,
          name: this.device.name,
          ...deviceInfo
        }
      };
    } catch (error) {
      console.error('❌ Error connecting to BLE device:', error);
      this.isConnected = false;
      return {
        success: false,
        error: error.message || 'Failed to connect to device'
      };
    }
  }

  /**
   * Get device information (name, manufacturer, battery level)
   */
  async getDeviceInfo() {
    const info = {
      deviceName: this.device.name,
      deviceType: 'Fitness Tracker',
      manufacturer: 'Unknown',
      batteryLevel: null
    };

    try {
      // Try to read device information service
      const deviceInfoService = await this.server.getPrimaryService(SERVICES.DEVICE_INFO);
      
      // Read device name
      try {
        const nameChar = await deviceInfoService.getCharacteristic(CHARACTERISTICS.DEVICE_NAME);
        const nameValue = await nameChar.readValue();
        info.deviceName = new TextDecoder().decode(nameValue);
      } catch (e) {
        console.log('Could not read device name');
      }

      // Read manufacturer
      try {
        const mfgChar = await deviceInfoService.getCharacteristic(CHARACTERISTICS.MANUFACTURER_NAME);
        const mfgValue = await mfgChar.readValue();
        info.manufacturer = new TextDecoder().decode(mfgValue);
      } catch (e) {
        console.log('Could not read manufacturer');
      }
    } catch (error) {
      console.log('Device info service not available');
    }

    // Try to read battery level
    try {
      const batteryService = await this.server.getPrimaryService(SERVICES.BATTERY);
      const batteryChar = await batteryService.getCharacteristic(CHARACTERISTICS.BATTERY_LEVEL);
      const batteryValue = await batteryChar.readValue();
      info.batteryLevel = batteryValue.getUint8(0);
      console.log(`🔋 Battery level: ${info.batteryLevel}%`);
    } catch (error) {
      console.log('Battery service not available');
    }

    return info;
  }

  /**
   * Start monitoring heart rate (real-time notifications)
   */
  async startHeartRateMonitoring(callback) {
    try {
      console.log('❤️  Starting heart rate monitoring...');
      
      const service = await this.server.getPrimaryService(SERVICES.HEART_RATE);
      const characteristic = await service.getCharacteristic(
        CHARACTERISTICS.HEART_RATE_MEASUREMENT
      );

      // Store characteristic for later use
      this.characteristics.set('heartRate', characteristic);

      // Start notifications
      await characteristic.startNotifications();
      console.log('✅ Heart rate notifications enabled');

      // Listen for value changes
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        
        // Parse heart rate measurement (standard BLE format)
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate;
        
        if (rate16Bits) {
          heartRate = value.getUint16(1, true); // Little-endian
        } else {
          heartRate = value.getUint8(1);
        }

        const data = {
          heartRate,
          timestamp: new Date().toISOString()
        };

        console.log(`💓 Heart Rate: ${heartRate} bpm`);
        
        // Call provided callback
        if (callback) {
          callback(data);
        }
        
        // Notify all registered callbacks
        this.notifyDataCallbacks(data);
      });

      return { success: true, message: 'Heart rate monitoring started' };
    } catch (error) {
      console.error('❌ Error starting heart rate monitoring:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to start heart rate monitoring'
      };
    }
  }

  /**
   * Stop heart rate monitoring
   */
  async stopHeartRateMonitoring() {
    try {
      const characteristic = this.characteristics.get('heartRate');
      if (characteristic) {
        await characteristic.stopNotifications();
        console.log('✅ Heart rate monitoring stopped');
        return { success: true };
      }
      return { success: false, error: 'Heart rate monitoring not active' };
    } catch (error) {
      console.error('Error stopping heart rate monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register callback for data updates
   */
  onData(callback) {
    this.dataCallbacks.push(callback);
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Notify all registered data callbacks
   */
  notifyDataCallbacks(data) {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data callback:', error);
      }
    });
  }

  /**
   * Notify all registered connection callbacks
   */
  notifyConnectionCallbacks(isConnected, deviceInfo = null) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected, deviceInfo);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  /**
   * Handle device disconnection
   */
  onDisconnected() {
    console.log('❌ Device disconnected');
    this.isConnected = false;
    this.characteristics.clear();
    this.notifyConnectionCallbacks(false);
  }

  /**
   * Manually disconnect from device
   */
  async disconnect() {
    try {
      if (this.device && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
        console.log('✅ Manually disconnected from device');
      }
      this.isConnected = false;
      this.characteristics.clear();
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceName: this.device ? this.device.name : null,
      deviceId: this.device ? this.device.id : null,
      hasDevice: this.device !== null
    };
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks() {
    this.dataCallbacks = [];
    this.connectionCallbacks = [];
  }
}

// Export singleton instance
export default new BLEService();
