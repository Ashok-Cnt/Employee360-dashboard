import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

const AIInsights = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        AI-Powered Performance Insights
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Achievement Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-generated summary of your accomplishments
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Feedback Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sentiment analysis of feedback and reviews
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Improvement Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personalized suggestions for enhancing productivity
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Productivity Predictions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI forecasts based on your patterns and trends
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIInsights;