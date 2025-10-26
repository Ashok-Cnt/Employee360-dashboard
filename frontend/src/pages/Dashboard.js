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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
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
  Event as EventIcon,
} from '@mui/icons-material';
import { fetchSystemUser } from '../store/slices/userSlice';
import AISuggestions from '../components/AISuggestions';

// Memoized MetricCard - only re-renders when props change
const MetricCard = React.memo(({ title, value, icon, color = '#1976d2', onClick }) => {
  console.log('🔄 MetricCard re-render:', title);
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
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
  const [holidays, setHolidays] = React.useState([]);
  const [activeAppsDialogOpen, setActiveAppsDialogOpen] = React.useState(false);
  const [productiveHoursDialogOpen, setProductiveHoursDialogOpen] = React.useState(false);
  const [productivityScoreDialogOpen, setProductivityScoreDialogOpen] = React.useState(false);
  const [memoryUsageDialogOpen, setMemoryUsageDialogOpen] = React.useState(false);
  const [monitoringHoursDialogOpen, setMonitoringHoursDialogOpen] = React.useState(false);
  const [idleHoursDialogOpen, setIdleHoursDialogOpen] = React.useState(false);
  const [coursesDialogOpen, setCoursesDialogOpen] = React.useState(false);
  const [batteryDialogOpen, setBatteryDialogOpen] = React.useState(false);
  const [holidaysDialogOpen, setHolidaysDialogOpen] = React.useState(false);
  
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

  // Fetch upcoming holidays
  const fetchHolidays = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8001/api/holidays/upcoming?limit=5');
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  }, []);

  // Fetch application activity data and system user on mount
  useEffect(() => {
    // Fetch system user information
    dispatch(fetchSystemUser());
    
    fetchData();
    fetchHolidays();
    
    // Set up periodic refresh every 30 seconds for Dashboard
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch, fetchData, fetchHolidays]);
  
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
            onClick={() => setActiveAppsDialogOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Productivity Score"
            value={`${getProductivityScore()}%`}
            icon={<TrendingUp />}
            color="#4caf50"
            onClick={() => setProductivityScoreDialogOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={formatMemory(getTotalMemoryUsage())}
            icon={<Memory />}
            color="#ff9800"
            onClick={() => setMemoryUsageDialogOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monitoring Hours"
            value={`${getMonitoringHours().toFixed(1)}h`}
            icon={<Schedule />}
            color="#e91e63"
            onClick={() => setMonitoringHoursDialogOpen(true)}
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
            onClick={() => setProductiveHoursDialogOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Idle Hours"
            value={`${getIdleHours().toFixed(2)}h`}
            icon={<Coffee />}
            color="#ff9800"
            onClick={() => setIdleHoursDialogOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Courses Completed"
            value="12"
            icon={<School />}
            color="#ff9800"
            onClick={() => setCoursesDialogOpen(true)}
          />
        </Grid>
        
        {/* Conditionally show Battery card only if battery data is available */}
        {(() => {
          const batteryInfo = getBatteryInfo();
          if (batteryInfo) {
            return (
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => setBatteryDialogOpen(true)}
                >
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
                  onClick={() => setBatteryDialogOpen(true)}
                />
              </Grid>
            );
          }
        })()}
        
        {/* Upcoming Holidays Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
            onClick={() => setHolidaysDialogOpen(true)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: '#9c27b0', mr: 1 }}>
                  <EventIcon />
                </Box>
                <Typography variant="h6" component="h2">
                  Next Holiday
                </Typography>
              </Box>
              {holidays.length > 0 ? (
                <>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ color: '#9c27b0', fontWeight: 'bold', mb: 1 }}
                  >
                    {holidays[0].name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(holidays[0].date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Typography>
                  <Chip 
                    label={holidays[0].type} 
                    size="small" 
                    sx={{ mt: 1, textTransform: 'capitalize' }}
                  />
                </>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No upcoming holidays
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Suggestions and Activity Feed */}
      <Grid container spacing={2}>
        {/* AI Suggestions Section */}
        <Grid item xs={12}>
          <AISuggestions 
            activityData={activityData}
            focusedWindow={getFocusedWindow()}
          />
        </Grid>

        {/* Real-time Activity Feed */}
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

      {/* Active Applications Dialog */}
      <Dialog 
        open={activeAppsDialogOpen} 
        onClose={() => setActiveAppsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Active Applications ({getCurrentAppsCount()})
        </DialogTitle>
        <DialogContent>
          {activityData && activityData.apps && activityData.apps.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Currently running applications on your system:
              </Typography>
              <List>
                {activityData.apps
                  .filter(app => app.name !== 'background_apps')
                  .sort((a, b) => {
                    // Sort: focused first, then by running time
                    if (a.isFocused && !b.isFocused) return -1;
                    if (!a.isFocused && b.isFocused) return 1;
                    return (b.runningTimeSec || 0) - (a.runningTimeSec || 0);
                  })
                  .map((app, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {app.title || app.name}
                              {app.isFocused && (
                                <Chip 
                                  label="Focused" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Category: {app.category}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Running time: {Math.round((app.runningTimeSec || 0) / 60)} minutes
                              </Typography>
                              <Typography variant="caption" display="block">
                                Focus time: {Math.round((app.focusDurationSec || 0) / 60)} minutes
                              </Typography>
                              <Typography variant="caption" display="block">
                                Memory: {formatMemory(app.memoryUsageMB || 0)}
                              </Typography>
                              {app.cpuUsage !== undefined && (
                                <Typography variant="caption" display="block">
                                  CPU: {app.cpuUsage.toFixed(1)}%
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < activityData.apps.filter(a => a.name !== 'background_apps').length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No active applications detected.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveAppsDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Productive Hours Dialog */}
      <Dialog 
        open={productiveHoursDialogOpen} 
        onClose={() => setProductiveHoursDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Productive Hours - Detailed Breakdown
        </DialogTitle>
        <DialogContent>
          {activityData && activityData.apps ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Summary
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  Total Productive Hours: <strong>{getProductiveHours().toFixed(2)} hours</strong> ({(getProductiveHours() * 60).toFixed(0)} minutes)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Time spent on productive applications like IDEs, editors, and development tools.
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {(() => {
                const productiveApps = activityData.apps
                  .filter(app => app.name !== 'background_apps' && app.category === 'Productive')
                  .map(app => ({
                    name: app.title || app.name,
                    focusTime: app.focusDurationSec || 0,
                    focusTimeMinutes: Math.round((app.focusDurationSec || 0) / 60),
                    focusTimeHours: ((app.focusDurationSec || 0) / 3600).toFixed(2),
                    runningTime: app.runningTimeSec || 0,
                    runningTimeMinutes: Math.round((app.runningTimeSec || 0) / 60),
                    memoryUsageMB: app.memoryUsageMB || 0
                  }))
                  .filter(app => app.focusTime > 0 || app.runningTime > 0)
                  .sort((a, b) => b.focusTime - a.focusTime);

                return productiveApps.length > 0 ? (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Productive Applications ({productiveApps.length})
                    </Typography>
                    <List>
                      {productiveApps.map((app, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {app.name}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    🎯 <strong>Focus Time:</strong> {app.focusTimeHours} hours ({app.focusTimeMinutes} minutes)
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    ⏱️ <strong>Running Time:</strong> {app.runningTimeMinutes} minutes
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    💾 <strong>Memory:</strong> {formatMemory(app.memoryUsageMB)}
                                  </Typography>
                                  {app.focusTime > 0 && (
                                    <Box sx={{ 
                                      mt: 1, 
                                      width: '100%', 
                                      height: 8, 
                                      backgroundColor: '#e0e0e0',
                                      borderRadius: 1,
                                      overflow: 'hidden'
                                    }}>
                                      <Box sx={{ 
                                        width: `${Math.min(100, (app.focusTime / (getProductiveHours() * 3600)) * 100)}%`,
                                        height: '100%',
                                        backgroundColor: '#4caf50',
                                        transition: 'width 0.3s'
                                      }} />
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < productiveApps.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>

                    <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        💡 <strong>Tip:</strong> Your most productive application was <strong>{productiveApps[0]?.name}</strong> with {productiveApps[0]?.focusTimeHours} hours of focus time.
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No productive applications detected during this period.
                  </Typography>
                );
              })()}

              {activityData.hourlySummary && activityData.hourlySummary.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Hourly Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {activityData.hourlySummary
                      .filter(hour => (hour.productiveFocusSec || 0) > 0)
                      .map((hour, index) => (
                        <Chip 
                          key={index}
                          label={`${hour.hour}: ${Math.round(hour.productiveFocusSec / 60)} min`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No productivity data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductiveHoursDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Productivity Score Dialog */}
      <Dialog 
        open={productivityScoreDialogOpen} 
        onClose={() => setProductivityScoreDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Productivity Score - {getProductivityScore()}%
        </DialogTitle>
        <DialogContent>
          {activityData && activityData.apps ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  How is your score calculated?
                </Typography>
                {(() => {
                  const visibleApps = activityData.apps.filter(app => app.name !== 'background_apps');
                  const focusedApp = visibleApps.find(app => app.isFocused);
                  const productiveApps = visibleApps.filter(app => app.category === 'Productive');
                  const totalFocusTime = visibleApps.reduce((sum, app) => sum + (app.focusDurationSec || 0), 0);
                  const totalRunTime = visibleApps.reduce((sum, app) => sum + (app.runningTimeSec || 0), 0);
                  
                  const focusScore = focusedApp ? 20 : 0;
                  const productivityRatio = productiveApps.length > 0 ? (productiveApps.length / visibleApps.length) * 30 : 0;
                  const focusTimeRatio = totalRunTime > 0 ? (totalFocusTime / totalRunTime) * 30 : 0;
                  const monitoringScore = activityData.system?.aggregates?.overallMonitoringHours 
                    ? Math.min(20, activityData.system.aggregates.overallMonitoringHours * 5) 
                    : 0;

                  return (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            🎯 <strong>Current Focus</strong> {focusedApp ? '(Active)' : '(Inactive)'}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            <strong>{focusScore} / 20 points</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 12, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${(focusScore / 20) * 100}%`,
                            height: '100%',
                            backgroundColor: '#4caf50',
                            transition: 'width 0.3s'
                          }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {focusedApp ? `Focused on: ${focusedApp.title || focusedApp.name}` : 'No application currently in focus'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            📊 <strong>Productive Apps Ratio</strong>
                          </Typography>
                          <Typography variant="body2" color="primary">
                            <strong>{productivityRatio.toFixed(1)} / 30 points</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 12, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${(productivityRatio / 30) * 100}%`,
                            height: '100%',
                            backgroundColor: '#2196f3',
                            transition: 'width 0.3s'
                          }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {productiveApps.length} of {visibleApps.length} apps are productive
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            ⏱️ <strong>Focus Time Efficiency</strong>
                          </Typography>
                          <Typography variant="body2" color="primary">
                            <strong>{focusTimeRatio.toFixed(1)} / 30 points</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 12, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${(focusTimeRatio / 30) * 100}%`,
                            height: '100%',
                            backgroundColor: '#9c27b0',
                            transition: 'width 0.3s'
                          }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round((totalFocusTime / 60))} minutes of focus out of {Math.round((totalRunTime / 60))} minutes running
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            📅 <strong>Monitoring Duration</strong>
                          </Typography>
                          <Typography variant="body2" color="primary">
                            <strong>{monitoringScore.toFixed(1)} / 20 points</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 12, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${(monitoringScore / 20) * 100}%`,
                            height: '100%',
                            backgroundColor: '#ff9800',
                            transition: 'width 0.3s'
                          }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {getMonitoringHours().toFixed(1)} hours tracked today
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Total Score: <strong style={{ color: getProductivityScore() >= 75 ? '#4caf50' : getProductivityScore() >= 50 ? '#ff9800' : '#f44336' }}>
                            {getProductivityScore()}%
                          </strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getProductivityScore() >= 75 ? '🎉 Excellent! You\'re having a very productive day!' : 
                           getProductivityScore() >= 50 ? '👍 Good progress! Keep up the momentum!' : 
                           '💪 There\'s room for improvement. Try focusing on productive tasks!'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Top Productive Applications
                </Typography>
                {(() => {
                  const productiveApps = activityData.apps
                    .filter(app => app.name !== 'background_apps' && app.category === 'Productive')
                    .map(app => ({
                      name: app.title || app.name,
                      focusTime: app.focusDurationSec || 0,
                      focusTimeMinutes: Math.round((app.focusDurationSec || 0) / 60)
                    }))
                    .filter(app => app.focusTime > 0)
                    .sort((a, b) => b.focusTime - a.focusTime)
                    .slice(0, 5);

                  return productiveApps.length > 0 ? (
                    <List>
                      {productiveApps.map((app, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${index + 1}. ${app.name}`}
                            secondary={`Focus time: ${app.focusTimeMinutes} minutes`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No productive applications detected.
                    </Typography>
                  );
                })()}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No productivity data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductivityScoreDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Memory Usage Dialog */}
      <Dialog 
        open={memoryUsageDialogOpen} 
        onClose={() => setMemoryUsageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Memory Usage - {formatMemory(getTotalMemoryUsage())}
        </DialogTitle>
        <DialogContent>
          {activityData && activityData.apps ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Memory Usage
                </Typography>
                <Typography variant="h4" sx={{ mb: 2, color: '#ff9800' }}>
                  {formatMemory(getTotalMemoryUsage())}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Combined memory usage of all active applications
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {(() => {
                const appsWithMemory = activityData.apps
                  .filter(app => app.name !== 'background_apps' && (app.memoryUsageMB || 0) > 0)
                  .map(app => ({
                    name: app.title || app.name,
                    memoryMB: app.memoryUsageMB || 0,
                    category: app.category,
                    isFocused: app.isFocused
                  }))
                  .sort((a, b) => b.memoryMB - a.memoryMB);

                const totalMemory = getTotalMemoryUsage();

                return appsWithMemory.length > 0 ? (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Applications by Memory Usage ({appsWithMemory.length})
                    </Typography>
                    <List>
                      {appsWithMemory.map((app, index) => {
                        const percentage = totalMemory > 0 ? ((app.memoryMB / totalMemory) * 100).toFixed(1) : 0;
                        return (
                          <React.Fragment key={index}>
                            <ListItem>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1">
                                      {app.name}
                                    </Typography>
                                    {app.isFocused && (
                                      <Chip 
                                        label="Focused" 
                                        size="small" 
                                        color="primary" 
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    )}
                                    <Chip 
                                      label={app.category} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                      <Typography variant="body2">
                                        💾 {formatMemory(app.memoryMB)}
                                      </Typography>
                                      <Typography variant="body2" color="primary">
                                        {percentage}% of total
                                      </Typography>
                                    </Box>
                                    <Box sx={{ 
                                      width: '100%', 
                                      height: 8, 
                                      backgroundColor: '#e0e0e0',
                                      borderRadius: 1,
                                      overflow: 'hidden'
                                    }}>
                                      <Box sx={{ 
                                        width: `${percentage}%`,
                                        height: '100%',
                                        backgroundColor: app.memoryMB > 500 ? '#f44336' : app.memoryMB > 200 ? '#ff9800' : '#4caf50',
                                        transition: 'width 0.3s'
                                      }} />
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < appsWithMemory.length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>

                    <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ff9800' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        💡 Memory Usage Tips:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        • High memory usage (&gt;500 MB): Consider closing if not in use
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        • Medium memory usage (200-500 MB): Normal for most applications
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Low memory usage (&lt;200 MB): Efficient application
                      </Typography>
                    </Box>

                    {appsWithMemory[0] && (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          🔝 <strong>Highest memory consumer:</strong> {appsWithMemory[0].name} with {formatMemory(appsWithMemory[0].memoryMB)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No memory usage data available for active applications.
                  </Typography>
                );
              })()}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No memory usage data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemoryUsageDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Monitoring Hours Dialog */}
      <Dialog 
        open={monitoringHoursDialogOpen} 
        onClose={() => setMonitoringHoursDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Monitoring Hours - {getMonitoringHours().toFixed(2)} hours
        </DialogTitle>
        <DialogContent>
          {activityData && activityData.system ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Monitoring Time
                </Typography>
                <Typography variant="h3" sx={{ mb: 2, color: '#e91e63' }}>
                  {getMonitoringHours().toFixed(2)} hours
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {(getMonitoringHours() * 60).toFixed(0)} minutes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total time your activity has been monitored today
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Time Breakdown
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      🎯 <strong>Productive Time</strong>
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {getProductiveHours().toFixed(2)}h ({((getProductiveHours() / getMonitoringHours()) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 12, 
                    backgroundColor: '#e0e0e0',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${(getProductiveHours() / getMonitoringHours()) * 100}%`,
                      height: '100%',
                      backgroundColor: '#4caf50',
                      transition: 'width 0.3s'
                    }} />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      ☕ <strong>Idle Time</strong>
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      {getIdleHours().toFixed(2)}h ({((getIdleHours() / getMonitoringHours()) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 12, 
                    backgroundColor: '#e0e0e0',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${(getIdleHours() / getMonitoringHours()) * 100}%`,
                      height: '100%',
                      backgroundColor: '#ff9800',
                      transition: 'width 0.3s'
                    }} />
                  </Box>
                </Box>

                {activityData.system.aggregates?.communicationHours > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        📞 <strong>Communication Time</strong>
                      </Typography>
                      <Typography variant="body2" color="info.main">
                        {activityData.system.aggregates.communicationHours.toFixed(2)}h ({((activityData.system.aggregates.communicationHours / getMonitoringHours()) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: '100%', 
                      height: 12, 
                      backgroundColor: '#e0e0e0',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${(activityData.system.aggregates.communicationHours / getMonitoringHours()) * 100}%`,
                        height: '100%',
                        backgroundColor: '#2196f3',
                        transition: 'width 0.3s'
                      }} />
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {activityData.hourlySummary && activityData.hourlySummary.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Hourly Activity Timeline
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {activityData.hourlySummary
                      .filter(hour => (hour.productiveFocusSec || 0) + (hour.communicationFocusSec || 0) + (hour.idleSec || 0) > 0)
                      .map((hour, index) => {
                        const totalSec = (hour.productiveFocusSec || 0) + (hour.communicationFocusSec || 0) + (hour.idleSec || 0);
                        const totalMin = Math.round(totalSec / 60);
                        return (
                          <Tooltip 
                            key={index}
                            title={
                              <Box>
                                <Typography variant="caption" display="block">
                                  <strong>Hour: {hour.hour}</strong>
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Productive: {Math.round((hour.productiveFocusSec || 0) / 60)} min
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Communication: {Math.round((hour.communicationFocusSec || 0) / 60)} min
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Idle: {Math.round((hour.idleSec || 0) / 60)} min
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Chip 
                              label={`${hour.hour}: ${totalMin}m`}
                              color={totalMin > 30 ? 'success' : totalMin > 15 ? 'primary' : 'default'}
                              variant={totalMin > 30 ? 'filled' : 'outlined'}
                              size="small"
                            />
                          </Tooltip>
                        );
                      })}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  📊 <strong>Summary:</strong> You've been monitored for {getMonitoringHours().toFixed(2)} hours today, with {((getProductiveHours() / getMonitoringHours()) * 100).toFixed(1)}% productive time and {((getIdleHours() / getMonitoringHours()) * 100).toFixed(1)}% idle time.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No monitoring data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMonitoringHoursDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Idle Hours Dialog */}
      <Dialog 
        open={idleHoursDialogOpen} 
        onClose={() => setIdleHoursDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Idle Hours - {getIdleHours().toFixed(2)} hours
        </DialogTitle>
        <DialogContent>
          {activityData && activityData.system ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Idle Time
                </Typography>
                <Typography variant="h3" sx={{ mb: 2, color: '#ff9800' }}>
                  {getIdleHours().toFixed(2)} hours
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {(getIdleHours() * 60).toFixed(0)} minutes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time when no application activity was detected (breaks, idle, away from keyboard)
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Idle Time Analysis
                </Typography>
                
                {(() => {
                  const totalHours = getMonitoringHours();
                  const idleHours = getIdleHours();
                  const productiveHours = getProductiveHours();
                  const idlePercentage = totalHours > 0 ? ((idleHours / totalHours) * 100).toFixed(1) : 0;
                  const productivePercentage = totalHours > 0 ? ((productiveHours / totalHours) * 100).toFixed(1) : 0;
                  const activePercentage = totalHours > 0 ? (((totalHours - idleHours) / totalHours) * 100).toFixed(1) : 0;

                  return (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            ☕ <strong>Idle Time</strong>
                          </Typography>
                          <Typography variant="body2" color="warning.main">
                            {idlePercentage}% of total time
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 16, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${idlePercentage}%`,
                            height: '100%',
                            backgroundColor: '#ff9800',
                            transition: 'width 0.3s'
                          }} />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            💻 <strong>Active Time</strong>
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            {activePercentage}% of total time
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 16, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${activePercentage}%`,
                            height: '100%',
                            backgroundColor: '#4caf50',
                            transition: 'width 0.3s'
                          }} />
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {activityData.hourlySummary && activityData.hourlySummary.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Hourly Idle Time Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {activityData.hourlySummary
                      .filter(hour => (hour.idleSec || 0) > 0)
                      .map((hour, index) => {
                        const idleMin = Math.round((hour.idleSec || 0) / 60);
                        return (
                          <Tooltip 
                            key={index}
                            title={
                              <Box>
                                <Typography variant="caption" display="block">
                                  <strong>Hour: {hour.hour}</strong>
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Idle: {idleMin} minutes
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Productive: {Math.round((hour.productiveFocusSec || 0) / 60)} min
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Chip 
                              label={`${hour.hour}: ${idleMin}m`}
                              color={idleMin > 30 ? 'warning' : idleMin > 15 ? 'default' : 'success'}
                              variant={idleMin > 30 ? 'filled' : 'outlined'}
                              size="small"
                            />
                          </Tooltip>
                        );
                      })}
                  </Box>
                  {activityData.hourlySummary.filter(hour => (hour.idleSec || 0) > 0).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No idle time recorded in hourly breakdown.
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ff9800' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  💡 About Idle Time:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • Idle time includes breaks, lunch, meetings away from computer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • Regular breaks are important for productivity and health
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • Recommended: 5-10 minute break every hour
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Long idle periods may indicate need to lock workstation
                </Typography>
              </Box>

              {(() => {
                const idlePercentage = getMonitoringHours() > 0 ? ((getIdleHours() / getMonitoringHours()) * 100).toFixed(1) : 0;
                return (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {idlePercentage < 20 ? 
                        '⚡ Very active day! Remember to take regular breaks.' :
                        idlePercentage < 40 ?
                        '👍 Good balance between work and breaks.' :
                        idlePercentage < 60 ?
                        '☕ Moderate idle time. This is normal for a typical workday.' :
                        '⚠️ High idle time detected. Consider reviewing your work schedule.'
                      }
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No idle time data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIdleHoursDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Courses Completed Dialog */}
      <Dialog 
        open={coursesDialogOpen} 
        onClose={() => setCoursesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Learning Progress - 12 Courses Completed
        </DialogTitle>
        <DialogContent>
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Your Learning Journey
              </Typography>
              <Typography variant="h3" sx={{ mb: 2, color: '#ff9800' }}>
                12 Courses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total courses completed this quarter
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Completions
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Advanced React Patterns"
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Completed: October 15, 2025
                        </Typography>
                        <Typography variant="caption" display="block">
                          Category: Frontend Development
                        </Typography>
                        <Chip label="Certificate Earned" size="small" color="success" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Python Data Analytics"
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Completed: October 10, 2025
                        </Typography>
                        <Typography variant="caption" display="block">
                          Category: Data Science
                        </Typography>
                        <Chip label="Certificate Earned" size="small" color="success" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="AWS Cloud Architecture"
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Completed: October 5, 2025
                        </Typography>
                        <Typography variant="caption" display="block">
                          Category: Cloud Computing
                        </Typography>
                        <Chip label="Certificate Earned" size="small" color="success" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Node.js Performance Optimization"
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Completed: September 28, 2025
                        </Typography>
                        <Typography variant="caption" display="block">
                          Category: Backend Development
                        </Typography>
                        <Chip label="Certificate Earned" size="small" color="success" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="UI/UX Design Fundamentals"
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Completed: September 20, 2025
                        </Typography>
                        <Typography variant="caption" display="block">
                          Category: Design
                        </Typography>
                        <Chip label="Certificate Earned" size="small" color="success" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Learning Statistics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    📚 <strong>Courses This Quarter</strong>
                  </Typography>
                  <Typography variant="body2" color="primary">
                    12 / 15 (80%)
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 12, 
                  backgroundColor: '#e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: '80%',
                    height: '100%',
                    backgroundColor: '#ff9800',
                    transition: 'width 0.3s'
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  3 more to reach your quarterly goal
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <Box sx={{ flex: 1, minWidth: 200, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Hours
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800' }}>
                    48 hours
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Certificates
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#4caf50' }}>
                    12
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Score
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#2196f3' }}>
                    92%
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #2196f3' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🎯 Keep Learning!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're 80% towards your quarterly learning goal. Complete 3 more courses to achieve 100% and earn a bonus badge!
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoursesDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Battery/Health Dialog */}
      <Dialog 
        open={batteryDialogOpen} 
        onClose={() => setBatteryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {(() => {
            const batteryInfo = getBatteryInfo();
            return batteryInfo ? `Battery Status - ${batteryInfo.percent}%` : 'System Health Score - 78%';
          })()}
        </DialogTitle>
        <DialogContent>
          {(() => {
            const batteryInfo = getBatteryInfo();
            
            if (batteryInfo) {
              // Laptop with battery
              return (
                <Box>
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Box sx={{ fontSize: 80, color: getBatteryColor(batteryInfo) }}>
                      {getBatteryIcon(batteryInfo)}
                    </Box>
                    <Typography variant="h2" sx={{ mb: 1, color: getBatteryColor(batteryInfo) }}>
                      {batteryInfo.percent}%
                    </Typography>
                    <Chip 
                      label={batteryInfo.isCharging ? '🔌 Charging' : '🔋 On Battery'} 
                      color={batteryInfo.isCharging ? 'success' : 'default'}
                      sx={{ fontSize: '1rem', py: 2 }}
                    />
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Battery Status
                    </Typography>
                    <Box sx={{ 
                      width: '100%', 
                      height: 40, 
                      backgroundColor: '#e0e0e0',
                      borderRadius: 2,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <Box sx={{ 
                        width: `${batteryInfo.percent}%`,
                        height: '100%',
                        backgroundColor: getBatteryColor(batteryInfo),
                        transition: 'width 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {batteryInfo.percent}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Battery Health Tips
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Optimal Charging Range"
                          secondary="Keep battery between 20% - 80% for longevity"
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Charging Status"
                          secondary={batteryInfo.isCharging ? 
                            "Currently charging - unplug when reaching 80-90%" : 
                            "On battery - plug in before reaching 20%"
                          }
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Battery Health"
                          secondary={
                            batteryInfo.percent > 80 ? "Excellent battery level" :
                            batteryInfo.percent > 50 ? "Good battery level" :
                            batteryInfo.percent > 20 ? "Consider charging soon" :
                            "Low battery - charge immediately"
                          }
                        />
                      </ListItem>
                    </List>
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: batteryInfo.percent < 20 ? '#ffebee' : '#e8f5e9', 
                    borderRadius: 2,
                    border: `1px solid ${batteryInfo.percent < 20 ? '#f44336' : '#4caf50'}`
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {batteryInfo.percent < 20 ? '⚠️ Low Battery Warning' : 
                       batteryInfo.percent > 80 ? '✅ Battery Level Good' : 
                       '💡 Battery Status Normal'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {batteryInfo.percent < 20 ? 
                        'Your battery is running low. Please connect your charger to avoid data loss.' :
                        batteryInfo.percent > 80 ?
                        'Your battery is well charged. You can unplug and work on battery power.' :
                        'Battery level is adequate for normal use. Monitor the percentage regularly.'
                      }
                    </Typography>
                  </Box>
                </Box>
              );
            } else {
              // Desktop system - Health Score
              return (
                <Box>
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Box sx={{ fontSize: 80, color: '#e91e63' }}>
                      <FitnessCenter sx={{ fontSize: 80 }} />
                    </Box>
                    <Typography variant="h2" sx={{ mb: 1, color: '#e91e63' }}>
                      78%
                    </Typography>
                    <Chip 
                      label="System Health Score" 
                      color="secondary"
                      sx={{ fontSize: '1rem', py: 2 }}
                    />
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Health Score Breakdown
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          💻 <strong>System Performance</strong>
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          85%
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 12, 
                        backgroundColor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: '85%',
                          height: '100%',
                          backgroundColor: '#4caf50',
                          transition: 'width 0.3s'
                        }} />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          💾 <strong>Memory Management</strong>
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          70%
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 12, 
                        backgroundColor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: '70%',
                          height: '100%',
                          backgroundColor: '#ff9800',
                          transition: 'width 0.3s'
                        }} />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          📊 <strong>Resource Usage</strong>
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          82%
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 12, 
                        backgroundColor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: '82%',
                          height: '100%',
                          backgroundColor: '#4caf50',
                          transition: 'width 0.3s'
                        }} />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          🎯 <strong>Application Efficiency</strong>
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          75%
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 12, 
                        backgroundColor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: '75%',
                          height: '100%',
                          backgroundColor: '#ff9800',
                          transition: 'width 0.3s'
                        }} />
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      System Recommendations
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="✅ System Performance"
                          secondary="Your system is running smoothly with good performance metrics"
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="⚠️ Memory Optimization"
                          secondary="Consider closing unused applications to free up memory"
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="💡 Resource Management"
                          secondary="Resource usage is optimal. Continue monitoring for best performance"
                        />
                      </ListItem>
                    </List>
                  </Box>

                  <Box sx={{ p: 2, backgroundColor: '#f3e5f5', borderRadius: 2, border: '1px solid #e91e63' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      💪 Good System Health!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your system health score of 78% indicates good overall performance. Keep optimizing memory usage to improve further.
                    </Typography>
                  </Box>
                </Box>
              );
            }
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatteryDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upcoming Holidays Dialog */}
      <Dialog 
        open={holidaysDialogOpen} 
        onClose={() => setHolidaysDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 1, color: '#9c27b0' }} />
            Upcoming Holidays
          </Box>
        </DialogTitle>
        <DialogContent>
          {holidays.length > 0 ? (
            <List>
              {holidays.map((holiday, index) => (
                <React.Fragment key={holiday.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="h6" sx={{ color: '#9c27b0' }}>
                            {holiday.name}
                          </Typography>
                          <Chip 
                            label={holiday.type} 
                            size="small" 
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            📅 {new Date(holiday.date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                          {holiday.description && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              {holiday.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 3 }}>
              No upcoming holidays found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHolidaysDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;