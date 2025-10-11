import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

const HealthMetrics = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Health & Wellness Metrics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sleep Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sleep quality, duration, and patterns
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Steps, workouts, and physical activity
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stress Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stress levels and mindfulness tracking
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Health-Productivity Correlation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              How your health metrics impact your productivity
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HealthMetrics;