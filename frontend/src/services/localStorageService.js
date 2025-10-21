/**
 * Local Storage Service for Health Metrics
 * Stores data in: C:\Users\GBS09538\AppData\Local\Employee360
 * 
 * Directory Structure:
 * Employee360/
 *   ├── devices/
 *   │   ├── {deviceId}/
 *   │   │   ├── daily/
 *   │   │   │   └── YYYY-MM-DD.json
 *   │   │   ├── weekly/
 *   │   │   │   └── YYYY-WW.json
 *   │   │   └── monthly/
 *   │   │       └── YYYY-MM.json
 *   └── google-fit/
 *       ├── {accountId}/
 *       │   ├── daily/
 *       │   ├── weekly/
 *       │   └── monthly/
 */

class LocalStorageService {
  constructor() {
    this.baseDir = 'C:\\Users\\GBS09538\\AppData\\Local\\Employee360';
    this.initialized = false;
  }

  /**
   * Initialize local storage (create directories if needed)
   */
  async initialize() {
    if (this.initialized) return { success: true };

    try {
      // Request directory access via backend API
      const response = await fetch('http://localhost:8001/api/local-storage/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseDir: this.baseDir })
      });

      const result = await response.json();
      
      if (result.success) {
        this.initialized = true;
        console.log('✅ Local storage initialized:', this.baseDir);
      } else {
        console.error('❌ Failed to initialize local storage:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error initializing local storage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store daily BLE device data
   */
  async storeBLEData(deviceId, deviceName, metrics) {
    await this.initialize();

    const now = new Date();
    const dateKey = this.formatDate(now);
    
    const data = {
      deviceId,
      deviceName,
      date: dateKey,
      timestamp: now.toISOString(),
      metrics: {
        heartRate: metrics.heartRate || null,
        steps: metrics.steps || null,
        calories: metrics.calories || null,
        distance: metrics.distance || null,
        bloodOxygen: metrics.bloodOxygen || null,
        skinTemperature: metrics.skinTemperature || null,
        stressLevel: metrics.stressLevel || null
      }
    };

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/ble/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (error) {
      console.error('Error storing BLE data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store daily Google Fit data
   */
  async storeGoogleFitData(accountId, accountEmail, dailyData) {
    await this.initialize();

    const data = {
      accountId,
      accountEmail,
      dailyData, // Array of daily summaries
      syncedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/google-fit/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (error) {
      console.error('Error storing Google Fit data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get daily data for a device
   */
  async getDailyData(source, sourceId, date) {
    await this.initialize();

    const dateKey = date ? this.formatDate(new Date(date)) : this.formatDate(new Date());

    try {
      const response = await fetch(
        `http://localhost:8001/api/local-storage/daily?source=${source}&sourceId=${sourceId}&date=${dateKey}`
      );

      return await response.json();
    } catch (error) {
      console.error('Error getting daily data:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Get weekly summary for a device
   */
  async getWeeklySummary(source, sourceId, weekKey) {
    await this.initialize();

    try {
      const response = await fetch(
        `http://localhost:8001/api/local-storage/weekly?source=${source}&sourceId=${sourceId}&week=${weekKey}`
      );

      return await response.json();
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Get monthly summary for a device
   */
  async getMonthlySummary(source, sourceId, monthKey) {
    await this.initialize();

    try {
      const response = await fetch(
        `http://localhost:8001/api/local-storage/monthly?source=${source}&sourceId=${sourceId}&month=${monthKey}`
      );

      return await response.json();
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Summarize daily data into weekly
   */
  async summarizeWeekly(source, sourceId, weekKey) {
    await this.initialize();

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/summarize/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, sourceId, weekKey })
      });

      return await response.json();
    } catch (error) {
      console.error('Error summarizing weekly:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Summarize weekly data into monthly
   */
  async summarizeMonthly(source, sourceId, monthKey) {
    await this.initialize();

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/summarize/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, sourceId, monthKey })
      });

      return await response.json();
    } catch (error) {
      console.error('Error summarizing monthly:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up old data (older than 1 month)
   */
  async cleanupOldData() {
    await this.initialize();

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      return await response.json();
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all devices with stored data
   */
  async getDeviceList() {
    await this.initialize();

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/devices');
      return await response.json();
    } catch (error) {
      console.error('Error getting device list:', error);
      return { success: false, devices: [] };
    }
  }

  /**
   * Get all Google Fit accounts with stored data
   */
  async getGoogleFitAccountList() {
    await this.initialize();

    try {
      const response = await fetch('http://localhost:8001/api/local-storage/google-fit/accounts');
      return await response.json();
    } catch (error) {
      console.error('Error getting Google Fit accounts:', error);
      return { success: false, accounts: [] };
    }
  }

  // Helper methods

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const weekNum = this.getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

// Export singleton instance
const localStorageService = new LocalStorageService();
export default localStorageService;
