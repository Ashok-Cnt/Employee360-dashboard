import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Button,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  School,
  FitnessCenter,
  Computer,
  Memory,
  Apps,
  Visibility,
  Work,
  VideoCall,
  Coffee,
  BatteryChargingFull,
  Battery80,
  Battery50,
  Battery20,
  BatteryAlert,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { fetchSystemUser } from '../store/slices/userSlice';
import AISuggestions from '../components/AISuggestions';
import { 
  MemoizedBarChart, 
  MemoizedLineChart, 
  MemoizedDoughnutChart,
  MemoizedStatsSection 
} from '../components/MemoizedCharts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement
);

// Memoized MetricCard - only re-renders when props change
const MetricCard = React.memo(({ title, value, icon, color = '#1976d2' }) => {
  console.log('🔄 MetricCard re-render:', title);
  return (
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
});

const Dashboard = () => {
  const dispatch = useDispatch();
  
  // Local state for activity data
  const [activityData, setActivityData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Get system user (Windows login user) from Redux store
  const systemUser = useSelector((state) => state.user.systemUser);
  const systemUserLoading = useSelector((state) => state.user.systemUserLoading);

  // Fetch application activity data - extracted for manual refresh
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch today's activity data from new JSONL endpoint
      const response = await fetch('/api/activity/today');
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      } else if (response.status === 404) {
        setActivityData({ apps: [], system: {}, hourlySummary: [] });
      } else {
        throw new Error('Failed to fetch activity data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setActivityData({ apps: [], system: {}, hourlySummary: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch application activity data and system user on mount
  useEffect(() => {
    // Fetch system user information
    dispatch(fetchSystemUser());
    
    fetchData();
    
    // Set up periodic refresh every minute
    const interval = setInterval(fetchData, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch, fetchData]);
  
  // Get greeting message with Windows system username
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting;
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';
    
    // Use Windows system login username with fallback
    const displayName = systemUser?.displayName || systemUser?.username || 'User';
    return `${timeGreeting}, ${displayName}`;
  };

  // Format memory usage
  const formatMemory = (mb) => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb?.toFixed(1) || 0} MB`;
  };

  // Get productivity score based on application activity
  const getProductivityScore = () => {
    if (!activityData || !activityData.apps) return 75; // Default score
    
    const visibleApps = activityData.apps.filter(app => app.name !== 'background_apps');
    const focusedApp = visibleApps.find(app => app.isFocused);
    const productiveApps = visibleApps.filter(app => app.category === 'Productive');
    const totalFocusTime = visibleApps.reduce((sum, app) => sum + (app.focusDurationSec || 0), 0);
    const totalRunTime = visibleApps.reduce((sum, app) => sum + (app.runningTimeSec || 0), 0);
    
    // Calculate score components
    const focusScore = focusedApp ? 20 : 0;
    const productivityRatio = productiveApps.length > 0 ? (productiveApps.length / visibleApps.length) * 30 : 0;
    const focusTimeRatio = totalRunTime > 0 ? (totalFocusTime / totalRunTime) * 30 : 0;
    const monitoringScore = activityData.system?.aggregates?.overallMonitoringHours 
      ? Math.min(20, activityData.system.aggregates.overallMonitoringHours * 5) 
      : 0;
    
    return Math.round(focusScore + productivityRatio + focusTimeRatio + monitoringScore);
  };

  // Application usage data for charts
  const getApplicationUsageData = () => {
    if (!activityData || !activityData.apps || activityData.apps.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
        }]
      };
    }

    const visibleApps = activityData.apps
      .filter(app => app.name !== 'background_apps')
      .sort((a, b) => (b.runningTimeSec || 0) - (a.runningTimeSec || 0))
      .slice(0, 5);

    return {
      labels: visibleApps.map(app => app.title || app.name),
      datasets: [{
        data: visibleApps.map(app => Math.round((app.runningTimeSec || 0) / 60)),
        backgroundColor: [
          '#1976d2',
          '#dc004e',
          '#9c27b0',
          '#ff9800',
          '#4caf50',
        ],
      }]
    };
  };

  // Get work pattern data based on categories
  const getWorkPatternData = () => {
    if (!activityData || !activityData.hourlySummary || activityData.hourlySummary.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
        }]
      };
    }

    // Aggregate from hourly summary
    const summary = activityData.hourlySummary.reduce((acc, hour) => {
      acc.productive += hour.productiveFocusSec || 0;
      acc.communication += hour.communicationFocusSec || 0;
      acc.idle += hour.idleSec || 0;
      return acc;
    }, { productive: 0, communication: 0, idle: 0 });

    // Also calculate from apps for more detail
    const appsByCategory = activityData.apps
      .filter(app => app.name !== 'background_apps')
      .reduce((acc, app) => {
        const cat = app.category;
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += app.focusDurationSec || 0;
        return acc;
      }, {});

    // Calculate browsers and other activities
    const browsersTime = (appsByCategory['Browsers'] || 0);
    const mediaTime = (appsByCategory['Media'] || 0);
    const otherTime = (appsByCategory['Non-Productive'] || 0);

    // Build chart data - show all main categories
    const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
    const data = [
      Math.round(summary.productive / 60),      // Productive apps
      Math.round(summary.communication / 60),   // Communication apps
      Math.round(browsersTime / 60),            // Browser usage
      Math.round(summary.idle / 60)             // Idle/breaks
    ];
    const colors = ['#4caf50', '#2196f3', '#9c27b0', '#ff9800'];

    return {
      labels: labels,
      datasets: [{
        label: 'Time Spent (minutes)',
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
      }]
    };
  };

  // Get work pattern breakdown for pie chart
  const getWorkPatternBreakdown = () => {
    return getWorkPatternData();
  };

  // Calculate total memory usage from current applications
  const getTotalMemoryUsage = () => {
    if (!activityData || !activityData.apps) return 0;
    
    return activityData.apps
      .filter(app => app.name !== 'background_apps')
      .reduce((total, app) => total + (app.memoryUsageMB || 0), 0);
  };

  // Get current apps count
  const getCurrentAppsCount = () => {
    if (!activityData || !activityData.apps) return 0;
    return activityData.apps.filter(app => app.name !== 'background_apps').length;
  };

  // Get focused window
  const getFocusedWindow = () => {
    if (!activityData || !activityData.apps) return null;
    const focused = activityData.apps.find(app => app.isFocused);
    return focused ? {
      application: focused.name,
      window_title: focused.title,
      is_focused: true,
      memory_usage_mb: focused.memoryUsageMB,
      cpu_usage_percent: focused.cpuUsage
    } : null;
  };

  // Get monitoring hours
  const getMonitoringHours = () => {
    return activityData?.system?.aggregates?.overallMonitoringHours || 0;
  };

  // Get productive hours
  const getProductiveHours = () => {
    return activityData?.system?.aggregates?.productiveHours || 0;
  };

  // Get idle hours
  const getIdleHours = () => {
    return activityData?.system?.aggregates?.idleHours || 0;
  };

  // Get battery information
  const getBatteryInfo = () => {
    if (!activityData || !activityData.system) return null;
    
    const batteryPercent = activityData.system.batteryPercent;
    const isCharging = activityData.system.isCharging;
    
    // Return null if battery data is not available (desktop system)
    if (batteryPercent === null || batteryPercent === undefined) {
      return null;
    }
    
    return {
      percent: batteryPercent,
      isCharging: isCharging
    };
  };

  // Get battery icon based on percentage and charging status
  const getBatteryIcon = (batteryInfo) => {
    if (!batteryInfo) return <BatteryAlert />;
    
    const { percent, isCharging } = batteryInfo;
    
    if (isCharging) {
      return <BatteryChargingFull />;
    }
    
    if (percent > 80) return <BatteryChargingFull />;
    if (percent > 50) return <Battery80 />;
    if (percent > 20) return <Battery50 />;
    if (percent > 10) return <Battery20 />;
    return <BatteryAlert />;
  };

  // Get battery color based on percentage
  const getBatteryColor = (batteryInfo) => {
    if (!batteryInfo) return '#9e9e9e';
    
    const { percent, isCharging } = batteryInfo;
    
    if (isCharging) return '#4caf50'; // Green for charging
    if (percent > 50) return '#4caf50'; // Green
    if (percent > 20) return '#ff9800'; // Orange
    return '#f44336'; // Red for low battery
  };

  // Line Chart: Focus time per app over hours
  const getFocusTimePerAppData = () => {
    if (!activityData || !activityData.apps || activityData.apps.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Get all unique hours from hourlySummary
    const hours = activityData.hourlySummary?.map(h => h.hour) || [];
    
    // Get top 5 apps by total focus time
    const topApps = activityData.apps
      .filter(app => app.name !== 'background_apps' && app.focusDurationSec > 0)
      .sort((a, b) => (b.focusDurationSec || 0) - (a.focusDurationSec || 0))
      .slice(0, 5);

    const colors = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50'];

    const datasets = topApps.map((app, index) => {
      // Extract hourly focus data for this app
      const hourlyData = hours.map(hour => {
        const hourData = app.hourlyStats?.find(h => h.hour === hour);
        return hourData ? Math.round(hourData.focusSeconds / 60) : 0;
      });

      return {
        label: app.title || app.name,
        data: hourlyData,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        tension: 0.3,
        fill: true
      };
    });

    return {
      labels: hours,
      datasets: datasets
    };
  };

  // Stacked Bar Chart: Category-wise focus hours per hour
  const getCategoryFocusPerHourData = () => {
    if (!activityData || !activityData.hourlySummary || activityData.hourlySummary.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const hours = activityData.hourlySummary.map(h => h.hour);

    // Calculate category focus time for each hour
    const productiveData = activityData.hourlySummary.map(h => 
      Math.round((h.productiveFocusSec || 0) / 60)
    );
    const communicationData = activityData.hourlySummary.map(h => 
      Math.round((h.communicationFocusSec || 0) / 60)
    );
    
    // Calculate browser time from apps
    const browserData = hours.map(hour => {
      const browsers = activityData.apps.filter(app => 
        app.category === 'Browsers' && app.name !== 'background_apps'
      );
      let totalBrowserTime = 0;
      browsers.forEach(app => {
        const hourStat = app.hourlyStats?.find(h => h.hour === hour);
        if (hourStat) {
          totalBrowserTime += hourStat.focusSeconds || 0;
        }
      });
      return Math.round(totalBrowserTime / 60);
    });

    return {
      labels: hours,
      datasets: [
        {
          label: '🎯 Productive',
          data: productiveData,
          backgroundColor: '#4caf50',
          stack: 'stack1'
        },
        {
          label: '📞 Communication',
          data: communicationData,
          backgroundColor: '#2196f3',
          stack: 'stack1'
        },
        {
          label: '🌐 Browsing',
          data: browserData,
          backgroundColor: '#9c27b0',
          stack: 'stack1'
        }
      ]
    };
  };

  // Pie Chart: Overall time distribution
  const getOverallTimeDistributionData = () => {
    if (!activityData || !activityData.system) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0']
        }]
      };
    }

    const productive = activityData.system.aggregates?.productiveHours || 0;
    const communication = activityData.system.aggregates?.communicationHours || 0;
    const idle = activityData.system.aggregates?.idleHours || 0;
    const total = activityData.system.aggregates?.overallMonitoringHours || 0;
    const other = Math.max(0, total - productive - communication - idle);

    const labels = [];
    const data = [];
    const colors = [];

    if (productive > 0) {
      labels.push(`Productive (${(productive * 60).toFixed(0)}m)`);
      data.push(productive);
      colors.push('#4caf50');
    }
    if (communication > 0) {
      labels.push(`Communication (${(communication * 60).toFixed(0)}m)`);
      data.push(communication);
      colors.push('#2196f3');
    }
    if (other > 0) {
      labels.push(`Other (${(other * 60).toFixed(0)}m)`);
      data.push(other);
      colors.push('#9c27b0');
    }
    if (idle > 0) {
      labels.push(`Idle (${(idle * 60).toFixed(0)}m)`);
      data.push(idle);
      colors.push('#ff9800');
    }

    return {
      labels: labels.length > 0 ? labels : ['No Activity'],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: colors.length > 0 ? colors : ['#e0e0e0'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  // Heatmap data: Focus intensity over 24 hours
  const getFocusIntensityHeatmapData = () => {
    if (!activityData || !activityData.hourlySummary) {
      return [];
    }

    // Create array of all 24 hours
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0') + ':00';
      const hourData = activityData.hourlySummary.find(h => h.hour === hour);
      
      const totalFocus = (hourData?.productiveFocusSec || 0) + 
                        (hourData?.communicationFocusSec || 0);
      const intensity = Math.round((totalFocus / 3600) * 100); // Percentage of hour

      return {
        hour: hour,
        intensity: intensity,
        focusMinutes: Math.round(totalFocus / 60),
        productive: Math.round((hourData?.productiveFocusSec || 0) / 60),
        communication: Math.round((hourData?.communicationFocusSec || 0) / 60),
        idle: Math.round((hourData?.idleSec || 0) / 60)
      };
    });

    return allHours;
  };

  // Get color for heatmap based on intensity
  const getHeatmapColor = (intensity) => {
    if (intensity === 0) return '#f5f5f5';
    if (intensity < 20) return '#c8e6c9';
    if (intensity < 40) return '#81c784';
    if (intensity < 60) return '#4caf50';
    if (intensity < 80) return '#388e3c';
    return '#1b5e20';
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
        {/* Header with Refresh Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            {/* Display Windows system login username (not database user) */}
            <Typography variant="h4" gutterBottom>
              {systemUserLoading && !systemUser ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  Getting system user...
                </Box>
              ) : (
                getGreeting()
              )}! 👋
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Welcome to your Employee360 Dashboard
              {systemUser && (
                <span> • Logged in as: <strong>{systemUser.username}</strong></span>
              )}
            </Typography>
          </Box>
          {/* Refresh Button */}
          <Tooltip title="Refresh dashboard data">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={isLoading}
              sx={{ minWidth: '120px' }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </Tooltip>
        </Box>        {/* Current Focused Application Alert */}
        {(() => {
          const focusedWindow = getFocusedWindow();
          return focusedWindow?.is_focused && (
            <Alert 
              severity="info" 
              sx={{ mt: 2, mb: 2 }}
              icon={<Visibility />}
            >
              <strong>Currently Focused:</strong> {focusedWindow.application}
              {focusedWindow.window_title && focusedWindow.window_title !== focusedWindow.application && (
                <span> - {focusedWindow.window_title}</span>
              )}
            </Alert>
          );
        })()}
      </Box>
      
      {/* Loading State */}
      {isLoading && !activityData && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>Loading application data...</Typography>
        </Box>
      )}
      
      {/* Metric Cards */}
  <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Applications"
            value={getCurrentAppsCount()}
            icon={<Apps />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Productivity Score"
            value={`${getProductivityScore()}%`}
            icon={<TrendingUp />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={formatMemory(getTotalMemoryUsage())}
            icon={<Memory />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monitoring Hours"
            value={`${getMonitoringHours().toFixed(1)}h`}
            icon={<Schedule />}
            color="#e91e63"
          />
        </Grid>
      </Grid>

      {/* Additional Info Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Productive Hours"
            value={`${getProductiveHours().toFixed(2)}h`}
            icon={<Work />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Idle Hours"
            value={`${getIdleHours().toFixed(2)}h`}
            icon={<Coffee />}
            color="#ff9800"
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
        
        {/* Conditionally show Battery card only if battery data is available */}
        {(() => {
          const batteryInfo = getBatteryInfo();
          if (batteryInfo) {
            return (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: getBatteryColor(batteryInfo), mr: 1 }}>
                        {getBatteryIcon(batteryInfo)}
                      </Box>
                      <Typography variant="h6" component="h2">
                        Battery
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h3" 
                      component="div" 
                      sx={{ color: getBatteryColor(batteryInfo), fontWeight: 'bold' }}
                    >
                      {batteryInfo.percent}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {batteryInfo.isCharging ? '🔌 Charging' : '🔋 On Battery'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          } else {
            // Show Health Score for desktop users without battery
            return (
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Health Score"
                  value="78%"
                  icon={<FitnessCenter />}
                  color="#e91e63"
                />
              </Grid>
            );
          }
        })()}
      </Grid>

      {/* Charts */}
  <Grid container spacing={2}>
        {/* AI Suggestions Section */}
        <Grid item xs={12}>
          <AISuggestions 
            activityData={activityData}
            focusedWindow={getFocusedWindow()}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Work Pattern Analysis - Time Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Breakdown of your daily activities: Focus work, Communication, and Breaks
            </Typography>
            <Bar data={getWorkPatternData()} options={{
              ...chartOptions,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Time Spent (minutes)'
                  }
                }
              },
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const minutes = context.parsed.y;
                      const hours = Math.floor(minutes / 60);
                      const mins = Math.round(minutes % 60);
                      return `${context.dataset.label}: ${hours}h ${mins}m`;
                    }
                  }
                }
              }
            }} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Work Pattern Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Distribution of your work patterns today
            </Typography>
            <Doughnut 
              data={getWorkPatternBreakdown()} 
              options={{ 
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const minutes = context.parsed;
                        const hours = Math.floor(minutes / 60);
                        const mins = Math.round(minutes % 60);
                        return `${context.label}: ${hours}h ${mins}m`;
                      }
                    }
                  }
                },
              }} 
            />
          </Paper>
        </Grid>

        {/* New Advanced Charts Section */}
        
        {/* Line Chart: Focus Time per App */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              📈 Focus Time per Application
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track how focus time varies across hours for your top apps
            </Typography>
            <Line 
              data={getFocusTimePerAppData()} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y} minutes`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Focus Time (minutes)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Hour of Day'
                    }
                  }
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Stacked Bar Chart: Category-wise Focus per Hour */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              📊 Category-wise Focus Hours
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Breakdown of productive, communication, and browsing time per hour
            </Typography>
            <Bar 
              data={getCategoryFocusPerHourData()} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y} minutes`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    stacked: true,
                    title: {
                      display: true,
                      text: 'Hour of Day'
                    }
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Focus Time (minutes)'
                    }
                  }
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Pie Chart: Overall Time Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              🥧 Overall Time Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              See how your time is split between productive work, communication, and idle time
            </Typography>
            <Doughnut 
              data={getOverallTimeDistributionData()} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${percentage}%`;
                      }
                    }
                  }
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Heatmap: Focus Intensity over 24 Hours */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              🔥 Focus Intensity Heatmap
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Color-coded view of your focus intensity throughout the day
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(12, 1fr)', 
              gap: 0.5,
              mt: 2 
            }}>
              {getFocusIntensityHeatmapData().map((hourData, index) => (
                <Tooltip 
                  key={index}
                  title={
                    <Box>
                      <Typography variant="caption" display="block">
                        <strong>{hourData.hour}</strong>
                      </Typography>
                      <Typography variant="caption" display="block">
                        Focus: {hourData.focusMinutes} min
                      </Typography>
                      <Typography variant="caption" display="block">
                        Productive: {hourData.productive} min
                      </Typography>
                      <Typography variant="caption" display="block">
                        Communication: {hourData.communication} min
                      </Typography>
                      <Typography variant="caption" display="block">
                        Intensity: {hourData.intensity}%
                      </Typography>
                    </Box>
                  }
                  arrow
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: getHeatmapColor(hourData.intensity),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        zIndex: 10,
                        boxShadow: 2
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem',
                        fontWeight: hourData.intensity > 0 ? 'bold' : 'normal',
                        color: hourData.intensity > 40 ? '#fff' : '#666'
                      }}
                    >
                      {hourData.hour.split(':')[0]}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">Low</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[0, 20, 40, 60, 80, 100].map((intensity, i) => (
                  <Box 
                    key={i}
                    sx={{ 
                      width: 30, 
                      height: 15, 
                      backgroundColor: getHeatmapColor(intensity),
                      border: '1px solid #e0e0e0'
                    }} 
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">High</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Real-time Activity Feed - Last Component */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Activity Feed
            </Typography>
            <Box sx={{ mt: 2 }}>
              {(() => {
                const fw = getFocusedWindow();
                return fw && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    🎯 Currently focused on: <strong>{fw.application}</strong>
                    {fw.window_title && (
                      <span> - {fw.window_title}</span>
                    )}
                    {fw.memory_usage_mb && (
                      <Chip 
                        size="small" 
                        label={`${formatMemory(fw.memory_usage_mb)}`} 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Typography>
                );
              })()}
              
              {activityData && activityData.system && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📊 {activityData.apps ? activityData.apps.filter(a => a.name !== 'background_apps').length : 0} applications currently active
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ⏱️ {getMonitoringHours().toFixed(1)} hours of activity monitored today
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    💻 {getCurrentAppsCount()} applications running now
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    💾 {formatMemory(getTotalMemoryUsage())} total memory usage
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    🎯 Productivity Score: <strong>{getProductivityScore()}%</strong>
                  </Typography>
                </>
              )}

              {!activityData && !isLoading && (
                <Typography variant="body2" color="text.secondary">
                  Start some applications to see real-time activity data
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;