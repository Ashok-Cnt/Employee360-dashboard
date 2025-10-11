import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

const LearningProgress = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Learning Progress
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Completion Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your learning journey and completed courses
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Skill Growth Radar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visual representation of skill development
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personalized Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered learning suggestions based on your progress
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LearningProgress;