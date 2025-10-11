import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  focusHours: [],
  taskSwitching: [],
  meetingLoad: [],
  productivityTrends: [],
  loading: false,
  error: null,
};

const workPatternSlice = createSlice({
  name: 'workPattern',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFocusHours: (state, action) => {
      state.focusHours = action.payload;
    },
    setTaskSwitching: (state, action) => {
      state.taskSwitching = action.payload;
    },
    setMeetingLoad: (state, action) => {
      state.meetingLoad = action.payload;
    },
    setProductivityTrends: (state, action) => {
      state.productivityTrends = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setFocusHours,
  setTaskSwitching,
  setMeetingLoad,
  setProductivityTrends,
} = workPatternSlice.actions;

export default workPatternSlice.reducer;