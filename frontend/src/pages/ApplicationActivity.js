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
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Apps as AppsIcon,
  Timeline as TimelineIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [detailDialog, setDetailDialog] = useState({ open: false, app: null });

  const fetchCurrentApplications = async () => {
    try {
      const response = await fetch('/api/apps/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentApps(data);
      } else {
        console.error('Failed to fetch current applications');
      }
    } catch (error) {
      console.error('Error fetching current applications:', error);
    }
  };

  const fetchApplicationSummary = async () => {
    try {
      const response = await fetch(`/api/apps/summary?hours=${timeRange}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setAppSummary(data);
      }
    } catch (error) {
      console.error('Error fetching application summary:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/apps/stats?hours=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTopMemoryApps = async () => {
    try {
      const response = await fetch(`/api/apps/top-memory-usage?hours=${timeRange}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTopMemoryApps(data);
      }
    } catch (error) {
      console.error('Error fetching top memory apps:', error);
    }
  };

  const fetchFocusedWindow = async () => {
    try {
      const response = await fetch('/api/apps/focused-window');
      if (response.ok) {
        const data = await response.json();
        setFocusedWindow(data);
      }
    } catch (error) {
      console.error('Error fetching focused window:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

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
                      Unique Applications
                    </Typography>
                    <Typography variant="h4">
                      {stats.unique_applications}
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
                  <ComputerIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Most Used App
                    </Typography>
                    <Typography variant="h6" noWrap>
                      {stats.most_used_app}
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
                      Peak Memory Usage
                    </Typography>
                    <Typography variant="h6">
                      {stats.peak_memory_usage_gb.toFixed(1)} GB
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
                      Monitoring Time
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_monitoring_time_hours.toFixed(1)}h
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
        <Tab label="Memory Usage" />
      </Tabs>

      {/* Current Applications Tab */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Currently Running Applications
              {currentApps && (
                <Chip 
                  label={`${currentApps.total_applications} apps`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            
            {focusedWindow && focusedWindow.window_title && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Currently Focused:</strong> {focusedWindow.window_title} 
                ({focusedWindow.process_name})
              </Alert>
            )}

            {currentApps && currentApps.applications && (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Application</TableCell>
                      <TableCell>Memory Usage</TableCell>
                      <TableCell>CPU %</TableCell>
                      <TableCell>Running Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentApps.applications.slice(0, 20).map((app) => (
                      <TableRow 
                        key={app.pid} 
                        hover 
                        onClick={() => openAppDetail(app)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2">{app.name}</Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            PID: {app.pid}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Chip
                              label={formatMemory(app.memory_usage_mb)}
                              color={getProcessStatusColor(app.memory_usage_mb)}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" width="100px">
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(app.cpu_percent || 0, 100)}
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="caption">
                              {(app.cpu_percent || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(app.create_time), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Chip label={app.status} color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Summary Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Usage Summary ({timeRange}h)
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application</TableCell>
                    <TableCell>Total Time</TableCell>
                    <TableCell>Avg Memory</TableCell>
                    <TableCell>Peak Memory</TableCell>
                    <TableCell>Usage %</TableCell>
                    <TableCell>Last Used</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appSummary.map((app, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="subtitle2">{app.application_name}</Typography>
                      </TableCell>
                      <TableCell>
                        {app.total_time_minutes.toFixed(0)} min
                      </TableCell>
                      <TableCell>{formatMemory(app.average_memory_mb)}</TableCell>
                      <TableCell>{formatMemory(app.max_memory_mb)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" width="100px">
                          <LinearProgress
                            variant="determinate"
                            value={app.usage_percentage}
                            sx={{ flexGrow: 1, mr: 1 }}
                          />
                          <Typography variant="caption">
                            {app.usage_percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(app.last_used), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Memory Usage Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Memory Consumers ({timeRange}h)
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application</TableCell>
                    <TableCell>Peak Memory</TableCell>
                    <TableCell>Average Memory</TableCell>
                    <TableCell>Last Seen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topMemoryApps.map((app, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="subtitle2">{app.application_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatMemory(app.max_memory_mb)}
                          color={getProcessStatusColor(app.max_memory_mb)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatMemory(app.avg_memory_mb)}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(app.last_seen), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
                <Typography variant="subtitle2">Name:</Typography>
                <Typography>{detailDialog.app.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Process ID:</Typography>
                <Typography>{detailDialog.app.pid}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Executable Path:</Typography>
                <Typography sx={{ wordBreak: 'break-all' }}>
                  {detailDialog.app.executable_path}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Memory Usage:</Typography>
                <Typography>{formatMemory(detailDialog.app.memory_usage_mb)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">CPU Usage:</Typography>
                <Typography>{(detailDialog.app.cpu_percent || 0).toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Started:</Typography>
                <Typography>
                  {format(new Date(detailDialog.app.create_time), 'PPpp')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Running Time:</Typography>
                <Typography>
                  {Math.floor(detailDialog.app.running_time_seconds / 3600)}h{' '}
                  {Math.floor((detailDialog.app.running_time_seconds % 3600) / 60)}m
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