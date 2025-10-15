import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Apps as AppsIcon,
  Timeline as TimelineIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  Language as BrowserIcon,
  Chat as ChatIcon,
  Edit as EditIcon,
  VideoCall as VideoCallIcon,
  Email as EmailIcon,
  Terminal as TerminalIcon,
  Description as DocumentIcon,
  Storage as DatabaseIcon,
  CloudQueue as CloudIcon,
  DesignServices as DesignIcon,
  MusicNote as MusicIcon,
  VideoLibrary as VideoIcon,
  Palette as ImageIcon,
  FolderOpen as FolderIcon,
  Settings as SettingsIcon,
  Window as WindowIcon,
  Extension as ExtensionIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const ApplicationActivity = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentApps, setCurrentApps] = useState(null);
  const [appSummary, setAppSummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [topMemoryApps, setTopMemoryApps] = useState([]);
  const [focusedWindow, setFocusedWindow] = useState(null);
  const [timeRange, setTimeRange] = useState(1); // hours
  const [detailDialog, setDetailDialog] = useState({ open: false, app: null });
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [mostFocusedApp, setMostFocusedApp] = useState(null);
  const [selectedAppForChart, setSelectedAppForChart] = useState('');
  const [todayAppsData, setTodayAppsData] = useState([]);

  const calculateMostFocusedApp = (apps) => {
    if (!apps || apps.length === 0) {
      console.log('📊 Most Focused App: No apps available');
      return null;
    }
    
    // Find the app with the longest focus time
    const topApp = apps.reduce((max, app) => {
      const currentFocusTime = app.aggregates?.totalFocusHours || 0;
      const maxFocusTime = max.aggregates?.totalFocusHours || 0;
      return currentFocusTime > maxFocusTime ? app : max;
    }, apps[0]);
    
    // Log the calculated most focused app with details
    console.log('📊 Most Focused App Calculated:', {
      name: topApp.name,
      title: topApp.title,
      category: topApp.category,
      focusHours: topApp.aggregates?.totalFocusHours || 0,
      runHours: topApp.aggregates?.totalRunHours || 0,
      focusCount: topApp.aggregates?.totalFocusCount || 0
    });
    
    return topApp;
  };

  // Helper function to get proper display name for apps
  const getAppDisplayName = (app) => {
    if (!app) return 'N/A';
    
    // If title exists and is meaningful (not just the executable name), use it
    if (app.title && app.title !== app.name && app.title.length > 0) {
      return app.title;
    }
    
    // Otherwise, clean up the name by removing file extensions
    const cleanName = app.name.replace(/\.(exe|app)$/i, '');
    return cleanName;
  };

  // Helper function to get app icon/logo based on app name and category
  const getAppIcon = (app) => {
    if (!app) return <AppsIcon />;
    
    const appName = (app.name || '').toLowerCase();
    const appTitle = (app.title || '').toLowerCase();
    const category = app.category || '';
    
    // Check for specific applications by name
    if (appName.includes('code') || appTitle.includes('visual studio code') || appName.includes('vscode')) {
      return <CodeIcon sx={{ color: '#007ACC' }} />;
    }
    if (appName.includes('chrome') || appTitle.includes('chrome')) {
      return <BrowserIcon sx={{ color: '#4285F4' }} />;
    }
    if (appName.includes('firefox') || appTitle.includes('firefox')) {
      return <BrowserIcon sx={{ color: '#FF7139' }} />;
    }
    if (appName.includes('edge') || appTitle.includes('edge')) {
      return <BrowserIcon sx={{ color: '#0078D7' }} />;
    }
    if (appName.includes('teams') || appTitle.includes('teams')) {
      return <VideoCallIcon sx={{ color: '#6264A7' }} />;
    }
    if (appName.includes('slack') || appTitle.includes('slack')) {
      return <ChatIcon sx={{ color: '#4A154B' }} />;
    }
    if (appName.includes('discord') || appTitle.includes('discord')) {
      return <ChatIcon sx={{ color: '#5865F2' }} />;
    }
    if (appName.includes('outlook') || appTitle.includes('outlook')) {
      return <EmailIcon sx={{ color: '#0078D4' }} />;
    }
    if (appName.includes('word') || appTitle.includes('word')) {
      return <DocumentIcon sx={{ color: '#2B579A' }} />;
    }
    if (appName.includes('excel') || appTitle.includes('excel')) {
      return <DocumentIcon sx={{ color: '#217346' }} />;
    }
    if (appName.includes('powerpoint') || appTitle.includes('powerpoint')) {
      return <DocumentIcon sx={{ color: '#D24726' }} />;
    }
    if (appName.includes('notepad') || appTitle.includes('notepad')) {
      return <EditIcon sx={{ color: '#0078D7' }} />;
    }
    if (appName.includes('photoshop') || appTitle.includes('photoshop')) {
      return <ImageIcon sx={{ color: '#31A8FF' }} />;
    }
    if (appName.includes('illustrator') || appTitle.includes('illustrator')) {
      return <DesignIcon sx={{ color: '#FF9A00' }} />;
    }
    if (appName.includes('figma') || appTitle.includes('figma')) {
      return <DesignIcon sx={{ color: '#F24E1E' }} />;
    }
    if (appName.includes('spotify') || appTitle.includes('spotify')) {
      return <MusicIcon sx={{ color: '#1DB954' }} />;
    }
    if (appName.includes('vlc') || appTitle.includes('vlc')) {
      return <VideoIcon sx={{ color: '#FF8800' }} />;
    }
    if (appName.includes('terminal') || appName.includes('cmd') || appName.includes('powershell')) {
      return <TerminalIcon sx={{ color: '#4EC9B0' }} />;
    }
    if (appName.includes('python') || appTitle.includes('python')) {
      return <CodeIcon sx={{ color: '#3776AB' }} />;
    }
    if (appName.includes('node') || appTitle.includes('node')) {
      return <CodeIcon sx={{ color: '#339933' }} />;
    }
    if (appName.includes('git') || appTitle.includes('git')) {
      return <ExtensionIcon sx={{ color: '#F05032' }} />;
    }
    if (appName.includes('docker') || appTitle.includes('docker')) {
      return <CloudIcon sx={{ color: '#2496ED' }} />;
    }
    if (appName.includes('explorer') || appTitle.includes('explorer')) {
      return <FolderIcon sx={{ color: '#FFB900' }} />;
    }
    
    // Fallback to category-based icons
    if (category === 'Productive') {
      return <CodeIcon sx={{ color: '#4caf50' }} />;
    }
    if (category === 'Communication') {
      return <ChatIcon sx={{ color: '#2196f3' }} />;
    }
    if (category === 'Browsers') {
      return <BrowserIcon sx={{ color: '#ff9800' }} />;
    }
    if (category === 'Media') {
      return <VideoIcon sx={{ color: '#e91e63' }} />;
    }
    if (category === 'Development') {
      return <CodeIcon sx={{ color: '#9c27b0' }} />;
    }
    
    // Default icon
    return <AppsIcon sx={{ color: '#757575' }} />;
  };

  const fetchCurrentApplications = async () => {
    try {
      console.log('Fetching current snapshot...');
      const response = await fetch('/api/activity/current');
      if (response.ok) {
        const snapshot = await response.json();
        console.log('Current snapshot:', snapshot);
        
        // Extract focused app from apps array
        const focusedApp = snapshot.apps?.find(app => app.isFocused);
        if (focusedApp) {
          setFocusedWindow({
            application: focusedApp.name,
            window_title: focusedApp.title,
            is_focused: true,
            memory_usage_mb: snapshot.system?.memoryUsageMB || 0,
            cpu_usage_percent: snapshot.system?.cpuUsage || 0
          });
        } else {
          setFocusedWindow(null);
        }
        
        // Extract running apps from new JSONL format
        if (snapshot.apps && snapshot.apps.length > 0) {
          const apps = snapshot.apps
            .filter(app => app.name !== 'background_apps') // Exclude aggregated background apps
            .map((app, index) => ({
              application: app.name,
              window_title: app.title,
              is_focused: app.isFocused,
              memory_usage_mb: app.memoryUsageMB || 0,
              cpu_usage_percent: app.cpuUsage || 0,
              timestamp: snapshot.timestamp,
              category: app.category,
              runningTimeSec: app.runningTimeSec,
              focusDurationSec: app.focusDurationSec,
              _id: `${app.name}-${index}`
            }));
          setCurrentApps(apps);
        } else {
          setCurrentApps([]);
        }
        
        // Update system metrics from new format
        if (snapshot.system) {
          setSystemMetrics({
            cpu: snapshot.system.cpuUsage,
            memory: snapshot.system.memoryUsageMB,
            battery: snapshot.system.batteryPercent,
            isCharging: snapshot.system.isCharging,
            isIdle: snapshot.system.isIdle,
            idleTime: snapshot.system.idleTimeSec
          });
        }
      } else if (response.status === 404) {
        console.log('No activity data available yet');
        setCurrentApps([]);
      } else {
        console.error('Failed to fetch current snapshot');
      }
    } catch (error) {
      console.error('Error fetching current snapshot:', error);
      setCurrentApps([]);
    }
  };

  const fetchApplicationSummary = async () => {
    try {
      console.log('Fetching today\'s summary...');
      const response = await fetch('/api/activity/today');
      if (response.ok) {
        const data = await response.json();
        console.log('Today\'s data:', data);
        
        // Store full apps data for charting
        if (data.apps && data.apps.length > 0) {
          setTodayAppsData(data.apps);
          
          // Set default selected app if not already set
          if (!selectedAppForChart && data.apps.length > 0) {
            setSelectedAppForChart(data.apps[0].title);
          }
        }
        
        // Convert apps data to summary format
        if (data.apps && data.apps.length > 0) {
          const summary = data.apps.map(app => ({
            application_name: app.title,
            _id: app.title,
            total_time: (app.aggregates?.totalRunHours || 0) * 60,
            total_usage: 1,
            avg_memory: 0,
            avg_cpu: 0,
            category: app.category,
            focus_time: (app.aggregates?.totalFocusHours || 0) * 60
          }));
          setAppSummary(summary);
          
          // Calculate most focused app
          const topApp = calculateMostFocusedApp(data.apps);
          setMostFocusedApp(topApp);
        } else {
          setAppSummary([]);
          setMostFocusedApp(null);
        }
        
        // Update system metrics from aggregates
        if (data.system) {
          setSystemMetrics({
            cpu: data.system.cpuUsage,
            memory: data.system.memoryUsageMB,
            battery: data.system.batteryPercent,
            isCharging: data.system.isCharging,
            isIdle: data.system.isIdle,
            idleTime: data.system.idleTimeSec
          });
        }
      } else if (response.status === 404) {
        console.log('No summary available yet');
        setAppSummary([]);
      }
    } catch (error) {
      console.error('Error fetching application summary:', error);
      setAppSummary([]);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats from today\'s data...');
      const response = await fetch('/api/activity/today');
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data:', data);
        
        // Calculate stats from today's data
        const calculatedStats = {
          currently_active_apps: data.apps ? data.apps.length : 0,
          total_sessions: data.apps ? data.apps.reduce((sum, app) => sum + (app.aggregates?.totalRuns || 0), 0) : 0,
          avg_memory_mb: systemMetrics?.memory || 0,
          total_time_hours: data.system?.aggregates?.overallMonitoringHours || 0,
          productive_hours: data.system?.aggregates?.productiveHours || 0,
          communication_hours: data.system?.aggregates?.communicationHours || 0,
          idle_hours: data.system?.aggregates?.idleHours || 0,
          avg_cpu: data.system?.aggregates?.avgCPU || 0
        };
        
        setStats(calculatedStats);
      } else if (response.status === 404) {
        setStats({
          currently_active_apps: 0,
          total_sessions: 0,
          avg_memory_mb: 0,
          total_time_hours: 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        currently_active_apps: 0,
        total_sessions: 0,
        avg_memory_mb: 0,
        total_time_hours: 0
      });
    }
  };

  const fetchTopMemoryApps = async () => {
    try {
      console.log('Fetching current apps for resource usage...');
      const response = await fetch('/api/activity/current');
      if (response.ok) {
        const data = await response.json();
        
        // Get apps with actual memory and CPU usage
        if (data.apps && data.apps.length > 0) {
          const appsWithResources = data.apps
            .filter(app => app.name !== 'background_apps')
            .map(app => ({
              application: app.title,
              name: app.name,
              current_memory_mb: app.memoryUsageMB || 0,
              cpu_usage_percent: app.cpuUsage || 0,
              is_focused: app.isFocused,
              last_updated: data.timestamp,
              total_run_hours: app.aggregates?.totalRunHours || 0,
              total_focus_hours: app.aggregates?.totalFocusHours || 0,
              running_time_sec: app.runningTimeSec || 0,
              focus_time_sec: app.focusDurationSec || 0,
              category: app.category
            }))
            .sort((a, b) => b.current_memory_mb - a.current_memory_mb)
            .slice(0, 10);
          
          setTopMemoryApps(appsWithResources);
        } else {
          setTopMemoryApps([]);
        }
      } else if (response.status === 404) {
        setTopMemoryApps([]);
      }
    } catch (error) {
      console.error('Error fetching top memory apps:', error);
      setTopMemoryApps([]);
    }
  };

  const fetchFocusedWindow = async () => {
    try {
      console.log('Fetching focused window from current snapshot...');
      const response = await fetch('/api/activity/current');
      if (response.ok) {
        const snapshot = await response.json();
        const focusedApp = snapshot.apps?.find(app => app.isFocused);
        if (focusedApp) {
          setFocusedWindow({
            application: focusedApp.name,
            window_title: focusedApp.title,
            is_focused: true,
            memory_usage_mb: snapshot.system?.memoryUsageMB || 0,
            cpu_usage_percent: snapshot.system?.cpuUsage || 0
          });
        } else {
          setFocusedWindow(null);
        }
      } else if (response.status === 404) {
        setFocusedWindow(null);
      }
    } catch (error) {
      console.error('Error fetching focused window:', error);
      setFocusedWindow(null);
    }
  };

  // Generate hourly chart data for selected application
  const getAppHourlyChartData = () => {
    if (!selectedAppForChart || todayAppsData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Find the selected app data
    const selectedApp = todayAppsData.find(app => app.title === selectedAppForChart);
    
    if (!selectedApp || !selectedApp.hourlyStats || selectedApp.hourlyStats.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Sort hourly stats by hour
    const sortedHourlyStats = [...selectedApp.hourlyStats].sort((a, b) => {
      return a.hour.localeCompare(b.hour);
    });

    // Extract hours for x-axis
    const hours = sortedHourlyStats.map(stat => stat.hour);

    // Extract data for different metrics
    const focusMinutes = sortedHourlyStats.map(stat => Math.round((stat.focusSeconds || 0) / 60));
    const runMinutes = sortedHourlyStats.map(stat => Math.round((stat.runSeconds || 0) / 60));

    return {
      labels: hours,
      datasets: [
        {
          label: 'Focus Time (minutes)',
          data: focusMinutes,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Running Time (minutes)',
          data: runMinutes,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  };

  const handleAppSelectionChange = (event) => {
    setSelectedAppForChart(event.target.value);
    console.log('📊 Selected app for chart:', event.target.value);
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching all data...');
      await Promise.all([
        fetchCurrentApplications(),
        fetchApplicationSummary(),
        fetchStats(),
        fetchTopMemoryApps(),
        fetchFocusedWindow()
      ]);
    } catch (error) {
      setError('Failed to load application data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  useEffect(() => {
    const interval = setInterval(fetchAllData, 60000); // Refresh every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const formatMemory = (mb) => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getProcessStatusColor = (memoryMb) => {
    if (memoryMb > 1000) return 'error';
    if (memoryMb > 500) return 'warning';
    return 'success';
  };

  const openAppDetail = (app) => {
    setDetailDialog({ open: true, app });
  };

  const closeAppDetail = () => {
    setDetailDialog({ open: false, app: null });
  };

  if (loading && !currentApps) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Application Activity Monitor
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} onChange={handleTimeRangeChange} label="Time Range">
              <MenuItem value={1}>Last Hour</MenuItem>
              <MenuItem value={6}>Last 6 Hours</MenuItem>
              <MenuItem value={24}>Last 24 Hours</MenuItem>
              <MenuItem value={168}>Last Week</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAllData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overview Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AppsIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Applications
                    </Typography>
                    <Typography variant="h4">
                      {stats.currently_active_apps || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Currently tracked
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  {/* Use app-specific icon instead of generic ComputerIcon */}
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    {mostFocusedApp ? getAppIcon(mostFocusedApp) : <ComputerIcon color="primary" />}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Most Focused App
                    </Typography>
                    <Tooltip 
                      title={
                        mostFocusedApp ? (
                          <Box>
                            <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                              {getAppDisplayName(mostFocusedApp)}
                            </Typography>
                            {mostFocusedApp.name && (
                              <Typography variant="caption" component="div">
                                Process: {mostFocusedApp.name}
                              </Typography>
                            )}
                            <Typography variant="caption" component="div">
                              Category: {mostFocusedApp.category || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" component="div">
                              Focus: {(mostFocusedApp.aggregates?.totalFocusHours || 0).toFixed(2)}h
                            </Typography>
                          </Box>
                        ) : ''
                      }
                      arrow
                      placement="top"
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: mostFocusedApp ? 'help' : 'default',
                          width: '100%'
                        }}
                      >
                        {mostFocusedApp ? getAppDisplayName(mostFocusedApp) : 'N/A'}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" color="textSecondary">
                      {mostFocusedApp ? `${(mostFocusedApp.aggregates?.totalFocusHours || 0).toFixed(1)}h focus time` : 'No data'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <MemoryIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      System Memory
                    </Typography>
                    <Typography variant="h6">
                      {systemMetrics?.memory ? `${(systemMetrics.memory / 1024).toFixed(1)} GB` : '0 GB'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      CPU: {systemMetrics?.cpu ? `${systemMetrics.cpu.toFixed(1)}%` : '0%'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TimelineIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Monitoring
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_time_hours ? `${stats.total_time_hours.toFixed(1)}h` : '0h'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {systemMetrics?.isIdle ? '💤 Idle' : '✅ Active'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Current Applications" />
        <Tab label="Usage Summary" />
        <Tab label="Resource Usage" />
        <Tab label="Hourly Usage Chart" />
      </Tabs>

      {/* Current Applications Tab */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Currently Running Applications
              {currentApps && currentApps.length > 0 && (
                <Chip 
                  label={`${currentApps.length} apps`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            
            {focusedWindow && focusedWindow.application && focusedWindow.is_focused && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>🎯 Currently Focused:</strong> {focusedWindow.window_title || focusedWindow.application}
              </Alert>
            )}

            {currentApps && currentApps.length > 0 && (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Application</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Memory</TableCell>
                      <TableCell>CPU %</TableCell>
                      <TableCell>Running Time</TableCell>
                      <TableCell>Focus %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentApps.slice(0, 20).map((app, index) => (
                      <TableRow 
                        key={`current-${app.application}-${app._id || index}`}
                        hover 
                        onClick={() => openAppDetail(app)}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: app.is_focused ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {app.is_focused && (
                              <Box 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  backgroundColor: 'green', 
                                  mr: 1 
                                }} 
                              />
                            )}
                            <Typography variant="subtitle2">{app.window_title || app.application}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.is_focused ? "Focused" : "Running"}
                            color={app.is_focused ? "success" : "default"}
                            size="small"
                            variant={app.is_focused ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.category || 'Unknown'}
                            color={
                              app.category === 'Productive' ? 'success' :
                              app.category === 'Communication' ? 'info' :
                              app.category === 'Browsers' ? 'primary' :
                              app.category === 'Media' ? 'warning' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatMemory(app.memory_usage_mb || 0)}
                            color={getProcessStatusColor(app.memory_usage_mb || 0)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" width="80px">
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(app.cpu_usage_percent || 0, 100)}
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="caption">
                              {(app.cpu_usage_percent || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {app.runningTimeSec ? `${Math.floor(app.runningTimeSec / 60)}m ${app.runningTimeSec % 60}s` : '0s'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Focus: {app.focusDurationSec ? `${Math.floor(app.focusDurationSec / 60)}m` : '0m'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" width="80px">
                            <LinearProgress
                              variant="determinate"
                              value={app.runningTimeSec > 0 ? (app.focusDurationSec / app.runningTimeSec * 100) : 0}
                              sx={{ flexGrow: 1, mr: 1 }}
                              color={
                                app.category === 'Productive' ? 'success' :
                                app.category === 'Communication' ? 'info' :
                                'primary'
                              }
                            />
                            <Typography variant="caption">
                              {app.runningTimeSec > 0 ? `${Math.round((app.focusDurationSec / app.runningTimeSec) * 100)}%` : '0%'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {(!currentApps || currentApps.length === 0) && !loading && (
              <Alert severity="info">
                No applications currently running. Start some applications to see activity data.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Summary Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Usage Summary (Today)
            </Typography>
            {appSummary && appSummary.length > 0 ? (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Application</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Total Run Time</TableCell>
                      <TableCell>Focus Time</TableCell>
                      <TableCell>Focus %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appSummary.map((app, index) => (
                      <TableRow key={`summary-${app.application_name || app._id}-${index}`}>
                        <TableCell>
                          <Typography variant="subtitle2">{app.application_name || app._id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.category || 'Unknown'}
                            color={
                              app.category === 'Productive' ? 'success' :
                              app.category === 'Communication' ? 'info' :
                              app.category === 'Browsers' ? 'primary' :
                              app.category === 'Media' ? 'warning' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {app.total_time ? `${app.total_time.toFixed(0)} min` : '0 min'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary">
                            {app.focus_time ? `${app.focus_time.toFixed(0)} min` : '0 min'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" width="100px">
                            <LinearProgress
                              variant="determinate"
                              value={app.total_time > 0 ? (app.focus_time / app.total_time * 100) : 0}
                              sx={{ flexGrow: 1, mr: 1 }}
                              color={
                                app.category === 'Productive' ? 'success' :
                                app.category === 'Communication' ? 'info' :
                                'primary'
                              }
                            />
                            <Typography variant="caption">
                              {app.total_time > 0 ? `${((app.focus_time / app.total_time) * 100).toFixed(0)}%` : '0%'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No usage summary data available yet. The collector needs to run for a while to gather data.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Memory Usage Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Resource Usage Ranking
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Applications ranked by memory consumption and CPU usage
            </Typography>
            {topMemoryApps && topMemoryApps.length > 0 ? (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Application</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Memory Usage</TableCell>
                      <TableCell>CPU Usage</TableCell>
                      <TableCell>Running Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topMemoryApps.map((app, index) => (
                      <TableRow 
                        key={`memory-${app.application}-${index}`}
                        sx={{ 
                          backgroundColor: app.is_focused ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {app.is_focused && (
                              <Box 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  backgroundColor: 'green', 
                                  mr: 1 
                                }} 
                              />
                            )}
                            <Typography variant="subtitle2">{app.application}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.category || 'Unknown'}
                            color={
                              app.category === 'Productive' ? 'success' :
                              app.category === 'Communication' ? 'info' :
                              app.category === 'Browsers' ? 'primary' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Chip
                              label={formatMemory(app.current_memory_mb || 0)}
                              color={getProcessStatusColor(app.current_memory_mb || 0)}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" width="120px">
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(app.cpu_usage_percent || 0, 100)}
                              sx={{ flexGrow: 1, mr: 1 }}
                              color={
                                app.cpu_usage_percent > 50 ? 'error' :
                                app.cpu_usage_percent > 25 ? 'warning' :
                                'success'
                              }
                            />
                            <Typography variant="caption">
                              {(app.cpu_usage_percent || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {app.running_time_sec ? `${Math.floor(app.running_time_sec / 60)}m ${app.running_time_sec % 60}s` : '0s'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Focus: {app.focus_time_sec ? `${Math.floor(app.focus_time_sec / 60)}m` : '0m'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.is_focused ? "Focused" : "Running"}
                            color={app.is_focused ? "success" : "default"}
                            size="small"
                            variant={app.is_focused ? "filled" : "outlined"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No application resource data available yet. The collector needs to be running to gather data.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hourly Usage Chart Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Application Hourly Usage Analysis
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Select an application to view its hourly usage pattern including focus time and running time
              </Typography>
            </Box>

            {/* Application Selector */}
            <Box sx={{ mb: 4, maxWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel id="app-select-label">Select Application</InputLabel>
                <Select
                  labelId="app-select-label"
                  id="app-select"
                  value={selectedAppForChart}
                  label="Select Application"
                  onChange={handleAppSelectionChange}
                >
                  {todayAppsData.length > 0 ? (
                    todayAppsData
                      .filter(app => app.hourlyStats && app.hourlyStats.length > 0)
                      .map((app) => (
                        <MenuItem key={app.title} value={app.title}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{app.title}</Typography>
                            <Chip
                              label={app.category}
                              size="small"
                              color={
                                app.category === 'Productive' ? 'success' :
                                app.category === 'Communication' ? 'info' :
                                app.category === 'Browsers' ? 'primary' :
                                'default'
                              }
                            />
                          </Box>
                        </MenuItem>
                      ))
                  ) : (
                    <MenuItem disabled>No applications available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* Chart Display */}
            {selectedAppForChart && todayAppsData.length > 0 ? (
              (() => {
                const chartData = getAppHourlyChartData();
                const selectedApp = todayAppsData.find(app => app.title === selectedAppForChart);
                
                if (chartData.labels.length === 0) {
                  return (
                    <Alert severity="info">
                      No hourly data available for the selected application yet.
                    </Alert>
                  );
                }

                return (
                  <>
                    {/* App Summary Info */}
                    {selectedApp && (
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom variant="body2">
                                Total Focus Time
                              </Typography>
                              <Typography variant="h6" color="success.main">
                                {(selectedApp.aggregates?.totalFocusHours || 0).toFixed(2)}h
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom variant="body2">
                                Total Run Time
                              </Typography>
                              <Typography variant="h6" color="primary.main">
                                {(selectedApp.aggregates?.totalRunHours || 0).toFixed(2)}h
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom variant="body2">
                                Focus Count
                              </Typography>
                              <Typography variant="h6">
                                {selectedApp.aggregates?.totalFocusCount || 0}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom variant="body2">
                                Category
                              </Typography>
                              <Chip
                                label={selectedApp.category}
                                color={
                                  selectedApp.category === 'Productive' ? 'success' :
                                  selectedApp.category === 'Communication' ? 'info' :
                                  selectedApp.category === 'Browsers' ? 'primary' :
                                  'default'
                                }
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}

                    {/* Hourly Usage Chart */}
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" gutterBottom>
                        📊 Hourly Usage Pattern
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Track how your usage varies throughout the day
                      </Typography>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          interaction: {
                            mode: 'index',
                            intersect: false,
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                padding: 15
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              padding: 12,
                              titleFont: {
                                size: 14
                              },
                              bodyFont: {
                                size: 13
                              },
                              callbacks: {
                                label: function(context) {
                                  const label = context.dataset.label || '';
                                  const value = context.parsed.y;
                                  const hours = Math.floor(value / 60);
                                  const minutes = value % 60;
                                  if (hours > 0) {
                                    return `${label}: ${hours}h ${minutes}m`;
                                  }
                                  return `${label}: ${minutes}m`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Hour of Day',
                                font: {
                                  size: 13,
                                  weight: 'bold'
                                }
                              },
                              grid: {
                                display: false
                              }
                            },
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Usage Time (minutes)',
                                font: {
                                  size: 13,
                                  weight: 'bold'
                                }
                              },
                              ticks: {
                                callback: function(value) {
                                  return value + 'm';
                                }
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                              }
                            }
                          }
                        }}
                      />
                    </Paper>
                  </>
                );
              })()
            ) : (
              <Alert severity="info">
                No applications available. Please ensure the data collector is running and tracking application activity.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={detailDialog.open} onClose={closeAppDetail} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details
          <IconButton
            aria-label="close"
            onClick={closeAppDetail}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detailDialog.app && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Application:</Typography>
                <Typography>{detailDialog.app.application}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Name:</Typography>
                <Typography>{detailDialog.app.window_title || detailDialog.app.application}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Category:</Typography>
                <Chip
                  label={detailDialog.app.category || 'Unknown'}
                  color={
                    detailDialog.app.category === 'Productive' ? 'success' :
                    detailDialog.app.category === 'Communication' ? 'info' :
                    detailDialog.app.category === 'Browsers' ? 'primary' :
                    'default'
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status:</Typography>
                <Chip
                  label={detailDialog.app.is_focused ? "Focused" : "Running"}
                  color={detailDialog.app.is_focused ? "success" : "default"}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Memory Usage:</Typography>
                <Typography fontWeight="medium">
                  {formatMemory(detailDialog.app.memory_usage_mb || 0)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">CPU Usage:</Typography>
                <Typography fontWeight="medium">
                  {(detailDialog.app.cpu_usage_percent || 0).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Running Time:</Typography>
                <Typography fontWeight="medium">
                  {detailDialog.app.runningTimeSec ? `${Math.floor(detailDialog.app.runningTimeSec / 60)} minutes ${detailDialog.app.runningTimeSec % 60} seconds` : 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Focus Time:</Typography>
                <Typography color="primary" fontWeight="medium">
                  {detailDialog.app.focusDurationSec ? `${Math.floor(detailDialog.app.focusDurationSec / 60)} minutes ${detailDialog.app.focusDurationSec % 60} seconds` : 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Focus Percentage:</Typography>
                <Typography>
                  {detailDialog.app.runningTimeSec > 0 ? `${Math.round((detailDialog.app.focusDurationSec / detailDialog.app.runningTimeSec) * 100)}%` : '0%'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Last Updated:</Typography>
                <Typography>
                  {detailDialog.app.timestamp ? format(new Date(detailDialog.app.timestamp), 'PPpp') : 'Unknown'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ApplicationActivity;