import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  completedCourses: [],
  skillGrowth: [],
  recommendations: [],
  progressMetrics: {},
  loading: false,
  error: null,
};

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setCompletedCourses: (state, action) => {
      state.completedCourses = action.payload;
    },
    setSkillGrowth: (state, action) => {
      state.skillGrowth = action.payload;
    },
    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
    },
    setProgressMetrics: (state, action) => {
      state.progressMetrics = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setCompletedCourses,
  setSkillGrowth,
  setRecommendations,
  setProgressMetrics,
} = learningSlice.actions;

export default learningSlice.reducer;