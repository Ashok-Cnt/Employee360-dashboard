import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = 'http://localhost:8001/api/health';

// Async thunks for API calls

// Store BLE real-time data
export const storeBLEData = createAsyncThunk(
  'health/storeBLEData',
  async ({ userId, deviceId, metrics }) => {
    const response = await fetch(`${API_BASE_URL}/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        deviceId,
        metrics,
        timestamp: new Date().toISOString()
      })
    });
    if (!response.ok) throw new Error('Failed to store BLE data');
    return response.json();
  }
);

// Fetch real-time BLE data
export const fetchRealtimeData = createAsyncThunk(
  'health/fetchRealtimeData',
  async (userId) => {
    const response = await fetch(`${API_BASE_URL}/realtime?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch realtime data');
    return response.json();
  }
);

// Store Google Fit data
export const storeGoogleFitData = createAsyncThunk(
  'health/storeGoogleFitData',
  async ({ userId, data, dateRange }) => {
    const response = await fetch(`${API_BASE_URL}/google-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data, dateRange })
    });
    if (!response.ok) throw new Error('Failed to store Google Fit data');
    return response.json();
  }
);

// Fetch historical data
export const fetchHistoricalData = createAsyncThunk(
  'health/fetchHistoricalData',
  async ({ userId, startDate, endDate }) => {
    const url = `${API_BASE_URL}/historical?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch historical data');
    return response.json();
  }
);

// Register connected device
export const registerDevice = createAsyncThunk(
  'health/registerDevice',
  async ({ userId, deviceId, deviceName, deviceType }) => {
    const response = await fetch(`${API_BASE_URL}/device/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deviceId, deviceName, deviceType })
    });
    if (!response.ok) throw new Error('Failed to register device');
    return response.json();
  }
);

// Disconnect device
export const disconnectDevice = createAsyncThunk(
  'health/disconnectDevice',
  async ({ userId, deviceId }) => {
    const response = await fetch(`${API_BASE_URL}/device/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deviceId })
    });
    if (!response.ok) throw new Error('Failed to disconnect device');
    return response.json();
  }
);

// Fetch connected devices
export const fetchConnectedDevices = createAsyncThunk(
  'health/fetchConnectedDevices',
  async (userId) => {
    const response = await fetch(`${API_BASE_URL}/devices?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch devices');
    return response.json();
  }
);

// Fetch health summary
export const fetchHealthSummary = createAsyncThunk(
  'health/fetchHealthSummary',
  async (userId) => {
    const response = await fetch(`${API_BASE_URL}/summary?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch health summary');
    return response.json();
  }
);

const initialState = {
  // Real-time BLE data
  realtimeData: [],
  currentMetrics: {
    heartRate: null,
    steps: null,
    calories: null,
    distance: null,
    bloodOxygen: null,
    skinTemperature: null,
    stressLevel: null,
    lastUpdated: null
  },

  // Historical Google Fit data
  historicalData: [],
  sleepData: [],
  activityData: [],
  stressLevels: [],
  healthTrends: {},
  
  // Device management
  connectedDevices: [],
  activeDevice: null,
  dataSource: null, // 'BLE' or 'GoogleFit'
  wearableConnections: [],

  // Google Fit state
  googleFitAuthenticated: false,
  
  // UI state
  loading: false,
  error: null,
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    setDataSource: (state, action) => {
      state.dataSource = action.payload;
    },
    setGoogleFitAuth: (state, action) => {
      state.googleFitAuthenticated = action.payload;
    },
    setActiveDevice: (state, action) => {
      state.activeDevice = action.payload;
    },
    updateCurrentMetrics: (state, action) => {
      state.currentMetrics = {
        ...state.currentMetrics,
        ...action.payload,
        lastUpdated: new Date().toISOString()
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSleepData: (state, action) => {
      state.sleepData = action.payload;
    },
    setActivityData: (state, action) => {
      state.activityData = action.payload;
    },
    setStressLevels: (state, action) => {
      state.stressLevels = action.payload;
    },
    setHealthTrends: (state, action) => {
      state.healthTrends = action.payload;
    },
    setWearableConnections: (state, action) => {
      state.wearableConnections = action.payload;
    },
    resetHealthState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Store BLE Data
      .addCase(storeBLEData.pending, (state) => {
        state.loading = true;
      })
      .addCase(storeBLEData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.realtimeData.unshift(action.payload.dataPoint);
          // Keep only last 100 data points in state
          if (state.realtimeData.length > 100) {
            state.realtimeData = state.realtimeData.slice(0, 100);
          }
        }
      })
      .addCase(storeBLEData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Realtime Data
      .addCase(fetchRealtimeData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRealtimeData.fulfilled, (state, action) => {
        state.loading = false;
        state.realtimeData = action.payload.realtimeData || [];
        if (state.realtimeData.length > 0) {
          const latest = state.realtimeData[0];
          state.currentMetrics = {
            heartRate: latest.heartRate,
            steps: latest.steps,
            calories: latest.calories,
            distance: latest.distance,
            bloodOxygen: latest.bloodOxygen,
            skinTemperature: latest.skinTemperature,
            stressLevel: latest.stressLevel,
            lastUpdated: latest.timestamp
          };
        }
      })
      .addCase(fetchRealtimeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Store Google Fit Data
      .addCase(storeGoogleFitData.pending, (state) => {
        state.loading = true;
      })
      .addCase(storeGoogleFitData.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(storeGoogleFitData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Historical Data
      .addCase(fetchHistoricalData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHistoricalData.fulfilled, (state, action) => {
        state.loading = false;
        state.historicalData = action.payload.historicalData || [];
      })
      .addCase(fetchHistoricalData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Register Device
      .addCase(registerDevice.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.activeDevice = action.payload.device;
          state.dataSource = 'BLE';
        }
      })
      .addCase(registerDevice.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Disconnect Device
      .addCase(disconnectDevice.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.activeDevice = null;
          state.dataSource = state.googleFitAuthenticated ? 'GoogleFit' : null;
        }
      })

      // Fetch Connected Devices
      .addCase(fetchConnectedDevices.fulfilled, (state, action) => {
        state.connectedDevices = action.payload.devices || [];
        state.wearableConnections = action.payload.devices || [];
      })

      // Fetch Health Summary
      .addCase(fetchHealthSummary.fulfilled, (state, action) => {
        if (action.payload.summary) {
          state.dataSource = action.payload.summary.dataSource;
          state.activeDevice = action.payload.summary.activeDevice;
        }
      });
  }
});

export const {
  setDataSource,
  setGoogleFitAuth,
  setActiveDevice,
  updateCurrentMetrics,
  clearError,
  setLoading,
  setError,
  setSleepData,
  setActivityData,
  setStressLevels,
  setHealthTrends,
  setWearableConnections,
  resetHealthState
} = healthSlice.actions;

export default healthSlice.reducer;