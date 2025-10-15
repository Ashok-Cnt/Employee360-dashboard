import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchApplicationStats = createAsyncThunk(
  'applicationActivity/fetchStats',
  async (hours = 24, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/apps/stats?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application stats');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCurrentApplications = createAsyncThunk(
  'applicationActivity/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/apps/current');
      if (!response.ok) {
        throw new Error('Failed to fetch current applications');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchApplicationSummary = createAsyncThunk(
  'applicationActivity/fetchSummary',
  async (hours = 24, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/apps/summary?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application summary');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFocusedWindow = createAsyncThunk(
  'applicationActivity/fetchFocusedWindow',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/apps/focused-window');
      if (!response.ok) {
        throw new Error('Failed to fetch focused window');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTopMemoryApps = createAsyncThunk(
  'applicationActivity/fetchTopMemory',
  async ({ hours = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/apps/top-memory-usage?hours=${hours}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch top memory applications');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWorkPatterns = createAsyncThunk(
  'applicationActivity/fetchWorkPatterns',
  async (hours = 24, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/apps/work-patterns?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch work patterns');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  stats: null,
  currentApplications: null,
  applicationSummary: [],
  focusedWindow: null,
  topMemoryApps: [],
  workPatterns: null,
  loading: {
    stats: false,
    current: false,
    summary: false,
    focused: false,
    memory: false,
    workPatterns: false,
  },
  error: {
    stats: null,
    current: null,
    summary: null,
    focused: null,
    memory: null,
    workPatterns: null,
  },
  lastUpdated: null,
};

const applicationActivitySlice = createSlice({
  name: 'applicationActivity',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        stats: null,
        current: null,
        summary: null,
        focused: null,
        memory: null,
      };
    },
    setLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Application Stats
    builder
      .addCase(fetchApplicationStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchApplicationStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchApplicationStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      });

    // Current Applications
    builder
      .addCase(fetchCurrentApplications.pending, (state) => {
        state.loading.current = true;
        state.error.current = null;
      })
      .addCase(fetchCurrentApplications.fulfilled, (state, action) => {
        state.loading.current = false;
        state.currentApplications = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchCurrentApplications.rejected, (state, action) => {
        state.loading.current = false;
        state.error.current = action.payload;
      });

    // Application Summary
    builder
      .addCase(fetchApplicationSummary.pending, (state) => {
        state.loading.summary = true;
        state.error.summary = null;
      })
      .addCase(fetchApplicationSummary.fulfilled, (state, action) => {
        state.loading.summary = false;
        state.applicationSummary = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchApplicationSummary.rejected, (state, action) => {
        state.loading.summary = false;
        state.error.summary = action.payload;
      });

    // Focused Window
    builder
      .addCase(fetchFocusedWindow.pending, (state) => {
        state.loading.focused = true;
        state.error.focused = null;
      })
      .addCase(fetchFocusedWindow.fulfilled, (state, action) => {
        state.loading.focused = false;
        state.focusedWindow = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFocusedWindow.rejected, (state, action) => {
        state.loading.focused = false;
        state.error.focused = action.payload;
      });

    // Top Memory Apps
    builder
      .addCase(fetchTopMemoryApps.pending, (state) => {
        state.loading.memory = true;
        state.error.memory = null;
      })
      .addCase(fetchTopMemoryApps.fulfilled, (state, action) => {
        state.loading.memory = false;
        state.topMemoryApps = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTopMemoryApps.rejected, (state, action) => {
        state.loading.memory = false;
        state.error.memory = action.payload;
      });

    // Work Patterns
    builder
      .addCase(fetchWorkPatterns.pending, (state) => {
        state.loading.workPatterns = true;
        state.error.workPatterns = null;
      })
      .addCase(fetchWorkPatterns.fulfilled, (state, action) => {
        state.loading.workPatterns = false;
        state.workPatterns = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchWorkPatterns.rejected, (state, action) => {
        state.loading.workPatterns = false;
        state.error.workPatterns = action.payload;
      });
  },
});

export const { clearErrors, setLastUpdated } = applicationActivitySlice.actions;

// Selectors
export const selectApplicationStats = (state) => state.applicationActivity.stats;
export const selectCurrentApplications = (state) => state.applicationActivity.currentApplications;
export const selectApplicationSummary = (state) => state.applicationActivity.applicationSummary;
export const selectFocusedWindow = (state) => state.applicationActivity.focusedWindow;
export const selectTopMemoryApps = (state) => state.applicationActivity.topMemoryApps;
export const selectWorkPatterns = (state) => state.applicationActivity.workPatterns;
export const selectApplicationActivityLoading = (state) => state.applicationActivity.loading;
export const selectApplicationActivityError = (state) => state.applicationActivity.error;
export const selectLastUpdated = (state) => state.applicationActivity.lastUpdated;

// Derived selectors
export const selectIsAnyLoading = (state) => {
  const loading = state.applicationActivity.loading;
  return Object.values(loading).some(isLoading => isLoading);
};

export const selectTopAppsForDashboard = (state) => {
  const summary = state.applicationActivity.applicationSummary;
  return summary.slice(0, 5); // Top 5 apps for dashboard
};

export const selectCurrentAppCount = (state) => {
  const current = state.applicationActivity.currentApplications;
  return Array.isArray(current) ? current.length : 0;
};

export const selectTotalMemoryUsage = (state) => {
  const current = state.applicationActivity.currentApplications;
  if (!Array.isArray(current)) return 0;
  
  return current.reduce((total, app) => {
    return total + (app.memory_usage_mb || 0);
  }, 0);
};

export const selectProductivityMetrics = (state) => {
  const stats = state.applicationActivity.stats;
  const focused = state.applicationActivity.focusedWindow;
  const current = state.applicationActivity.currentApplications;
  const currentAppsCount = Array.isArray(current) ? current.length : 0;
  
  return {
    activeApps: stats?.unique_applications || currentAppsCount || 0,
    focusedApp: focused?.application || 'None',
    totalMemoryGB: (stats?.peak_memory_usage_gb || 0),
    monitoringHours: stats?.total_monitoring_time_hours || 0,
    averageAppsRunning: stats?.average_applications_running || 0,
  };
};

export default applicationActivitySlice.reducer;