import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sleepData: [],
  activityData: [],
  stressLevels: [],
  healthTrends: {},
  wearableConnections: [],
  loading: false,
  error: null,
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
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
  },
});

export const {
  setLoading,
  setError,
  setSleepData,
  setActivityData,
  setStressLevels,
  setHealthTrends,
  setWearableConnections,
} = healthSlice.actions;

export default healthSlice.reducer;