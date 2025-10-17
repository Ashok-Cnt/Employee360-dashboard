import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

/**
 * Memoized Chart Components - Only re-render when data changes
 * This prevents unnecessary re-renders when parent component updates
 */

// Memoized Bar Chart Component
export const MemoizedBarChart = React.memo(({ title, subtitle, data, options }) => {
  console.log('🔄 BarChart re-render:', title);
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      <Bar data={data} options={options} />
    </Paper>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if data actually changed
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

// Memoized Line Chart Component
export const MemoizedLineChart = React.memo(({ title, subtitle, data, options }) => {
  console.log('🔄 LineChart re-render:', title);
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      <Line data={data} options={options} />
    </Paper>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

// Memoized Doughnut Chart Component
export const MemoizedDoughnutChart = React.memo(({ title, subtitle, data, options }) => {
  console.log('🔄 DoughnutChart re-render:', title);
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      <Doughnut data={data} options={options} />
    </Paper>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

// Memoized Stats Section
export const MemoizedStatsSection = React.memo(({ children, title }) => {
  console.log('🔄 StatsSection re-render:', title || 'Metrics');
  return <Box>{children}</Box>;
});

// Memoized Alert Component
export const MemoizedAlertCard = React.memo(({ severity, icon, title, message }) => {
  console.log('🔄 AlertCard re-render:', title);
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <strong>{title}</strong>
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  return prevProps.title === nextProps.title && prevProps.message === nextProps.message;
});

MemoizedBarChart.displayName = 'MemoizedBarChart';
MemoizedLineChart.displayName = 'MemoizedLineChart';
MemoizedDoughnutChart.displayName = 'MemoizedDoughnutChart';
MemoizedStatsSection.displayName = 'MemoizedStatsSection';
MemoizedAlertCard.displayName = 'MemoizedAlertCard';
