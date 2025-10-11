import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  achievementSummary: {},
  feedbackAnalysis: [],
  improvementAreas: [],
  recommendations: [],
  productivityScore: 0,
  loading: false,
  error: null,
};

const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setAchievementSummary: (state, action) => {
      state.achievementSummary = action.payload;
    },
    setFeedbackAnalysis: (state, action) => {
      state.feedbackAnalysis = action.payload;
    },
    setImprovementAreas: (state, action) => {
      state.improvementAreas = action.payload;
    },
    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
    },
    setProductivityScore: (state, action) => {
      state.productivityScore = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setAchievementSummary,
  setFeedbackAnalysis,
  setImprovementAreas,
  setRecommendations,
  setProductivityScore,
} = insightsSlice.actions;

export default insightsSlice.reducer;