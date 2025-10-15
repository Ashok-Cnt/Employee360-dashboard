import { configureStore } from '@reduxjs/toolkit';
import workPatternReducer from './slices/workPatternSlice';
import learningReducer from './slices/learningSlice';
import healthReducer from './slices/healthSlice';
import insightsReducer from './slices/insightsSlice';
import userReducer from './slices/userSlice';
import applicationActivityReducer from './slices/applicationActivitySlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    workPattern: workPatternReducer,
    learning: learningReducer,
    health: healthReducer,
    insights: insightsReducer,
    applicationActivity: applicationActivityReducer,
  },
});