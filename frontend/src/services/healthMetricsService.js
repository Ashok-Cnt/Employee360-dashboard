/**
 * Simplified Health Metrics Service
 * All logic handled by backend - frontend only makes API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

class HealthMetricsService {
  constructor() {
    this.userId = 'Admin'; // Default user
  }

  /**
   * Get service configuration
   */
  async getConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/config`);
      if (!response.ok) throw new Error('Failed to fetch config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching config:', error);
      return { useMockData: false, googleFitAvailable: false, bleAvailable: true };
    }
  }

  // ==================== BLE METHODS ====================

  /**
   * Get available BLE devices (mock or real)
   */
  async getBLEDevices() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ble/devices`);
      if (!response.ok) throw new Error('Failed to fetch devices');
      return await response.json();
    } catch (error) {
      console.error('Error fetching BLE devices:', error);
      throw error;
    }
  }

  /**
   * Register BLE device connection (after browser connects)
   */
  async registerBLEDevice(deviceId, deviceInfo) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ble/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          deviceId,
          deviceInfo
        })
      });
      
      if (!response.ok) throw new Error('Failed to register device');
      return await response.json();
    } catch (error) {
      console.error('Error registering BLE device:', error);
      throw error;
    }
  }

  /**
   * Unregister BLE device
   */
  async unregisterBLEDevice(deviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ble/unregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          deviceId
        })
      });
      
      if (!response.ok) throw new Error('Failed to unregister device');
      return await response.json();
    } catch (error) {
      console.error('Error unregistering BLE device:', error);
      throw error;
    }
  }

  /**
   * Send BLE data to backend for processing
   */
  async sendBLEData(deviceId, metrics) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ble/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          deviceId,
          metrics
        })
      });
      
      if (!response.ok) throw new Error('Failed to send BLE data');
      return await response.json();
    } catch (error) {
      console.error('Error sending BLE data:', error);
      throw error;
    }
  }

  /**
   * Start mock BLE data stream
   */
  async startMockBLEStream(deviceId, interval = 5000) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ble/mock-stream/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          interval
        })
      });
      
      if (!response.ok) throw new Error('Failed to start mock stream');
      return await response.json();
    } catch (error) {
      console.error('Error starting mock stream:', error);
      throw error;
    }
  }

  /**
   * Stop mock BLE data stream
   */
  async stopMockBLEStream(deviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ble/mock-stream/${deviceId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to stop mock stream');
      return await response.json();
    } catch (error) {
      console.error('Error stopping mock stream:', error);
      throw error;
    }
  }

  // ==================== GOOGLE FIT METHODS ====================

  /**
   * Get Google OAuth URL
   */
  async getGoogleFitAuthUrl() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/google-fit/auth-url`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      return await response.json();
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  }

  /**
   * Fetch Google Fit data
   */
  async fetchGoogleFitData(startDate, endDate, accessToken = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/google-fit/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          startDate,
          endDate,
          accessToken
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch Google Fit data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Google Fit data:', error);
      throw error;
    }
  }

  /**
   * Get Google Fit user profile
   */
  async getGoogleFitProfile(accessToken = null) {
    try {
      const url = new URL(`${API_BASE_URL}/api/health/google-fit/profile`);
      if (accessToken) {
        url.searchParams.append('accessToken', accessToken);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Google Fit profile:', error);
      throw error;
    }
  }

  // ==================== DATA RETRIEVAL ====================

  /**
   * Get real-time BLE data
   */
  async getRealtimeData(limit = 100) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/health/realtime?user_id=${this.userId}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch realtime data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching realtime data:', error);
      throw error;
    }
  }

  /**
   * Get historical Google Fit data
   */
  async getHistoricalData(startDate = null, endDate = null) {
    try {
      const url = new URL(`${API_BASE_URL}/api/health/historical`);
      url.searchParams.append('user_id', this.userId);
      if (startDate) url.searchParams.append('start_date', startDate);
      if (endDate) url.searchParams.append('end_date', endDate);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Get health metrics summary
   */
  async getSummary() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/health/summary?user_id=${this.userId}`
      );
      if (!response.ok) throw new Error('Failed to fetch summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId() {
    return this.userId;
  }
}

// Export singleton instance
export default new HealthMetricsService();
