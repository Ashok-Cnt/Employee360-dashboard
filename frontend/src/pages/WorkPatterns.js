import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

const WorkPatterns = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Work Pattern Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Focus Time Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deep work sessions and concentration patterns
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Switching Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Context switching frequency and impact
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Meeting Load Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Calendar analysis and meeting productivity metrics
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkPatterns;