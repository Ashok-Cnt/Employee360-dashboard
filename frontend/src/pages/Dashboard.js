import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  School,
  FitnessCenter,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MetricCard = ({ title, value, icon, color = '#1976d2' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 1 }}>{icon}</Box>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="div" sx={{ color, fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = ({ currentUser }) => {
  const dispatch = useDispatch();
  
  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Sample data for demonstration
  const productivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Focus Hours',
        data: [6, 7, 5, 8, 6, 4, 3],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const taskDistributionData = {
    labels: ['Deep Work', 'Meetings', 'Email', 'Planning', 'Learning'],
    datasets: [
      {
        data: [40, 25, 15, 10, 10],
        backgroundColor: [
          '#1976d2',
          '#dc004e',
          '#9c27b0',
          '#ff9800',
          '#4caf50',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
  <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '100%', pl: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {currentUser?.full_name || currentUser?.username || 'User'}! 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome to your Employee360 Dashboard
        </Typography>
      </Box>
      
      {/* Metric Cards */}
  <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Today's Focus Hours"
            value="6.5h"
            icon={<Schedule />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Productivity Score"
            value="85%"
            icon={<TrendingUp />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Courses Completed"
            value="12"
            icon={<School />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Health Score"
            value="78%"
            icon={<FitnessCenter />}
            color="#e91e63"
          />
        </Grid>
      </Grid>

      {/* Charts */}
  <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Productivity Trends
            </Typography>
            <Line data={productivityData} options={chartOptions} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Distribution
            </Typography>
            <Doughnut 
              data={taskDistributionData} 
              options={{ 
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • Completed "Advanced React Patterns" course
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 2.5 hours of deep work on project documentation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Morning workout: 45 minutes cardio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Sleep quality: 8.2/10 (7.5 hours)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;