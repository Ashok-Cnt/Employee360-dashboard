import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Tab,
  Tabs,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Favorite,
  DirectionsWalk,
  LocalFireDepartment,
  Straighten,
  Bluetooth,
  CloudDownload,
  Refresh,
  DevicesOther,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import bleService from '../services/bleService';
import googleFitService from '../services/googleFitService';
import localStorageService from '../services/localStorageService';
import {
  storeBLEData,
  fetchRealtimeData,
  fetchHistoricalData,
  storeGoogleFitData,
  registerDevice,
  disconnectDevice,
  fetchConnectedDevices,
  fetchHealthSummary,
  setDataSource,
  setGoogleFitAuth,
  updateCurrentMetrics,
  clearError
} from '../store/slices/healthSlice';

const HealthMetrics = () => {
  const dispatch = useDispatch();
  const {
    realtimeData,
    currentMetrics,
    historicalData,
    connectedDevices,
    activeDevice,
    dataSource,
    googleFitAuthenticated,
    loading,
    error
  } = useSelector((state) => state.health);

  // Only show error if Google Fit is connected, otherwise suppress 'Failed to fetch' error
  const shouldShowError = error && (
    !(error === 'Failed to fetch' && !googleFitAuthenticated)
  );

  const [tabValue, setTabValue] = useState(0);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [bleDialogOpen, setBleDialogOpen] = useState(false);
  const [googleFitDialogOpen, setGoogleFitDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [googleFitInitialized, setGoogleFitInitialized] = useState(false);

  const userId = 'Admin'; // Replace with actual user from auth

  // Initialize on mount
  useEffect(() => {
    dispatch(fetchConnectedDevices(userId));
    dispatch(fetchHealthSummary(userId));

    // Only load Google Fit API if credentials are configured
    const hasGoogleFitCredentials = 
      process.env.REACT_APP_GOOGLE_FIT_CLIENT_ID && 
      process.env.REACT_APP_GOOGLE_FIT_CLIENT_ID.trim() !== '';

    let googleScript = null;

    if (hasGoogleFitCredentials) {
      // Load Google Fit API script with error handling
      googleScript = document.createElement('script');
      googleScript.src = 'https://apis.google.com/js/api.js';
      googleScript.async = true;
      googleScript.defer = true;
      googleScript.crossOrigin = 'anonymous';
      
      googleScript.onload = async () => {
        try {
          const result = await googleFitService.initialize();
          setGoogleFitInitialized(true);
          if (result.isAuthenticated) {
            dispatch(setGoogleFitAuth(true));
            if (!activeDevice) {
              dispatch(setDataSource('GoogleFit'));
            }
          }
        } catch (error) {
          console.warn('Google Fit initialization failed (optional feature):', error);
          setGoogleFitInitialized(false);
        }
      };
      
      googleScript.onerror = (error) => {
        console.warn('Google Fit API script failed to load (optional feature):', error);
        setGoogleFitInitialized(false);
      };
      
      document.body.appendChild(googleScript);
    } else {
      console.info('Google Fit integration disabled (credentials not configured)');
      setGoogleFitInitialized(false);
    }

    // Inject mock data for demo
    dispatch(updateCurrentMetrics({
      heartRate: 72,
      steps: 8500,
      calories: 320,
      distance: 6.2,
      lastUpdated: new Date().toISOString()
    }));
    
    // Set mock data source to show device is connected
    if (!dataSource) {
      dispatch(setDataSource('BLE'));
    }
    
    // Add mock realtimeData
    if (!realtimeData || realtimeData.length === 0) {
      const now = new Date();
      const mockReadings = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(now.getTime() - i * 60000).toISOString(),
        heartRate: 70 + (i % 5),
        steps: 8500 + i * 10
      }));
      window.mockRealtimeData = mockReadings;
    }
    
    // Add mock historical data
    if (!historicalData || historicalData.length === 0) {
      const mockHistorical = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockHistorical.push({
          date: date.toISOString().split('T')[0],
          steps: 8000 + Math.floor(Math.random() * 3000),
          calories: 300 + Math.floor(Math.random() * 200),
          distance: (6 + Math.random() * 3).toFixed(2)
        });
      }
      window.mockHistoricalData = [{
        source: 'Mock Device',
        syncedAt: new Date().toISOString(),
        data: mockHistorical,
        entriesCount: mockHistorical.length
      }];
    }
    
    // Add mock connected device
    if (!connectedDevices || connectedDevices.length === 0) {
      window.mockConnectedDevices = [{
        deviceId: 'mock-device-001',
        deviceName: 'Fitness Band Pro',
        deviceType: 'Fitness Tracker',
        status: 'connected',
        lastConnected: new Date().toISOString()
      }];
    }

    // Cleanup function
    return () => {
      try {
        // Clean up Google Fit script if it was added
        if (googleScript && document.body.contains(googleScript)) {
          document.body.removeChild(googleScript);
        }
        // Clean up BLE service callbacks
        if (bleService && typeof bleService.clearCallbacks === 'function') {
          bleService.clearCallbacks();
        }
      } catch (error) {
        console.warn('Cleanup error (non-critical):', error);
      }
    };
  }, [dispatch, activeDevice, dataSource, realtimeData, historicalData, connectedDevices]);

  // Auto-refresh disabled
  useEffect(() => {
    // Removed auto-refresh for BLE data
  }, [dataSource, dispatch, userId]);

  // Handle BLE device connection
  const handleConnectBLE = async () => {
    setConnectionStatus('Scanning for devices...');
    
    const result = await bleService.scanAndConnect();
    
    if (result.success) {
      setConnectionStatus('Device connected! Starting heart rate monitoring...');
      
      // Register device in backend
      await dispatch(registerDevice({
        userId,
        deviceId: result.device.id,
        deviceName: result.device.name,
        deviceType: result.device.deviceType || 'Fitness Tracker'
      }));

      // Start heart rate monitoring
      const monitorResult = await bleService.startHeartRateMonitoring(async (data) => {
        // Update Redux store
        dispatch(updateCurrentMetrics({ heartRate: data.heartRate }));

        // Store in backend
        dispatch(storeBLEData({
          userId,
          deviceId: result.device.id,
          metrics: { heartRate: data.heartRate }
        }));

        // Store in local storage
        await localStorageService.storeBLEData(
          result.device.id,
          result.device.name,
          { heartRate: data.heartRate }
        );
      });

      if (monitorResult.success) {
        dispatch(setDataSource('BLE'));
        setBleDialogOpen(false);
        setConnectionStatus('');
      } else {
        setConnectionStatus(`Failed to start monitoring: ${monitorResult.error}`);
      }
    } else {
      setConnectionStatus(`Failed to connect: ${result.error}`);
      setTimeout(() => setConnectionStatus(''), 5000);
    }
  };

  // Handle BLE disconnect
  const handleDisconnectBLE = async () => {
    if (activeDevice) {
      await bleService.disconnect();
      await dispatch(disconnectDevice({
        userId,
        deviceId: activeDevice.deviceId
      }));
      dispatch(setDataSource(googleFitAuthenticated ? 'GoogleFit' : null));
    }
  };

  // Handle Google Fit authentication
  const handleGoogleFitAuth = async () => {
    if (!googleFitInitialized) {
      alert('Google Fit API is still initializing. Please wait a moment and try again.');
      return;
    }

    const result = await googleFitService.signIn();
    
    if (result.success) {
      dispatch(setGoogleFitAuth(true));
      if (!activeDevice) {
        dispatch(setDataSource('GoogleFit'));
      }
      setGoogleFitDialogOpen(false);
      alert('Successfully connected to Google Fit!');
    } else {
      alert(`Failed to connect: ${result.error}`);
    }
  };

  // Fetch Google Fit historical data
  const handleFetchGoogleFitData = async () => {
    if (!googleFitAuthenticated) {
      alert('Please connect to Google Fit first');
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    try {
      // Fetch activity data
      const activityResult = await googleFitService.fetchActivityData(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (activityResult.success && activityResult.data.length > 0) {
        // Store in backend
        await dispatch(storeGoogleFitData({
          userId,
          data: activityResult.data,
          dateRange: { 
            start: startDate.toISOString(), 
            end: endDate.toISOString() 
          }
        }));

        // Store in local storage
        const googleUser = googleFitService.getUserProfile();
        if (googleUser) {
          await localStorageService.storeGoogleFitData(
            googleUser.id,
            googleUser.email,
            activityResult.data
          );
        }

        // Fetch from backend to update UI
        await dispatch(fetchHistoricalData({
          userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }));

        alert(`Google Fit data synced successfully! (${activityResult.data.length} days)`);
      } else {
        alert('No activity data found in Google Fit for the last 7 days');
      }
    } catch (error) {
      alert(`Failed to sync: ${error.message}`);
    }
  };

  // Render metric card
  const renderMetricCard = (icon, title, value, unit, color) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            {React.cloneElement(icon, { sx: { fontSize: 40, color } })}
            <Box>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {value !== null && value !== undefined ? value : '--'}
                {value !== null && value !== undefined && (
                  <Typography component="span" variant="body1" color="text.secondary" ml={1}>
                    {unit}
                  </Typography>
                )}
              </Typography>
              {currentMetrics.lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Updated {new Date(currentMetrics.lastUpdated).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <Box 
          sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: dataSource === 'BLE' ? '#4caf50' : '#f44336',
            animation: dataSource === 'BLE' ? 'pulse 2s infinite' : 'none'
          }} 
        />
        <Typography variant="caption" color={dataSource === 'BLE' ? 'success.main' : 'error.main'}>
          {dataSource === 'BLE' ? 'Live' : 'Not Live'}
        </Typography>
      </Box>
    </Card>
  );

  // Use mock data for demo if no real data
  const demoRealtimeData = window.mockRealtimeData || [];
  const demoHistoricalData = window.mockHistoricalData || [];
  const demoConnectedDevices = window.mockConnectedDevices || [];
  const showMock = (!realtimeData || realtimeData.length === 0);
  const showMockHistorical = (!historicalData || historicalData.length === 0);
  const showMockDevices = (!connectedDevices || connectedDevices.length === 0);
  
  // Helper function to format time without seconds
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Health & Wellness Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Monitor your health data from Bluetooth devices
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {dataSource && (
            <Chip
              icon={dataSource === 'BLE' ? <Bluetooth /> : <CloudDownload />}
              label={dataSource === 'BLE' ? 'Connected' : 'Google Fit Active'}
              color="success"
              variant="outlined"
            />
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConnectDialogOpen(true)}
            disabled={loading}
          >
            Connect
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {shouldShowError && (
        <Alert 
          severity="error" 
          onClose={() => dispatch(clearError())} 
          sx={{ mb: 2 }}
          icon={<ErrorIcon />}
        >
          {error}
        </Alert>
      )}

      {/* No data source warning */}
      {!dataSource && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No devices connected.
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Real-time Metrics" />
          <Tab label="Historical Data" />
          <Tab label="Devices" />
        </Tabs>
      </Paper>

      {/* Tab 0: Real-time Metrics */}
      {tabValue === 0 && (
        <>
          {/* Current Metrics */}
          <Grid container spacing={3} mb={3}>
            {/* Heart Rate - only show if data available */}
            {((showMock ? 72 : currentMetrics.heartRate) !== null && (showMock ? 72 : currentMetrics.heartRate) !== undefined) && (
              <Grid item xs={12} md={3}>
                {renderMetricCard(
                  <Favorite />,
                  'Heart Rate',
                  (showMock ? 72 : currentMetrics.heartRate),
                  'bpm',
                  '#e74c3c'
                )}
              </Grid>
            )}
            
            {/* Steps - only show if data available */}
            {((showMock ? 8500 : currentMetrics.steps) !== null && (showMock ? 8500 : currentMetrics.steps) !== undefined) && (
              <Grid item xs={12} md={3}>
                {renderMetricCard(
                  <DirectionsWalk />,
                  'Steps',
                  (showMock ? 8500 : currentMetrics.steps),
                  'steps',
                  '#3498db'
                )}
              </Grid>
            )}
            
            {/* Calories - only show if data available */}
            {((showMock ? 320 : currentMetrics.calories) !== null && (showMock ? 320 : currentMetrics.calories) !== undefined) && (
              <Grid item xs={12} md={3}>
                {renderMetricCard(
                  <LocalFireDepartment />,
                  'Calories',
                  (showMock ? 320 : currentMetrics.calories),
                  'kcal',
                  '#e67e22'
                )}
              </Grid>
            )}
            
            {/* Distance - only show if data available */}
            {((showMock ? 6.2 : currentMetrics.distance) !== null && (showMock ? 6.2 : currentMetrics.distance) !== undefined) && (
              <Grid item xs={12} md={3}>
                {renderMetricCard(
                  <Straighten />,
                  'Distance',
                  (showMock ? 6.2 : (currentMetrics.distance ? parseFloat(currentMetrics.distance).toFixed(2) : null)),
                  'km',
                  '#27ae60'
                )}
              </Grid>
            )}
          </Grid>

          {/* Recent readings */}
          {(showMock ? demoRealtimeData.length > 0 : realtimeData.length > 0) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Readings (Last 10)
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  {(showMock ? demoRealtimeData : realtimeData).slice(0, 10).map((reading, index) => (
                    <Grid item xs={12} key={index}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {formatTime(reading.timestamp)}
                        </Typography>
                        <Box display="flex" gap={3}>
                          {reading.heartRate && (
                            <Typography variant="body2" color="text.secondary">
                              ❤️ {reading.heartRate} bpm
                            </Typography>
                          )}
                          {reading.steps && (
                            <Typography variant="body2" color="text.secondary">
                              👣 {reading.steps} steps
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {index < 9 && <Divider sx={{ mt: 2 }} />}
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {(!showMock && realtimeData.length === 0 && !loading && dataSource === 'BLE') && (
            <Alert severity="info">
              Waiting for data from BLE device... Make sure your device is active and transmitting.
            </Alert>
          )}

          {!dataSource && !loading && (
            <Alert severity="warning">
              Connect a Bluetooth device or your account to see your health metrics here.
            </Alert>
          )}
        </>
      )}
      {/* Connect Dialog: Choose BLE or Google Fit */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)}>
        <DialogTitle>Connect to devices</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose how you want to connect:
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Button
              variant="contained"
              startIcon={<Bluetooth />}
              onClick={() => {
                setConnectDialogOpen(false);
                setBleDialogOpen(true);
              }}
            >
              Bluetooth Device
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudDownload />}
              onClick={() => {
                setConnectDialogOpen(false);
                setGoogleFitDialogOpen(true);
              }}
              color="success"
            >
              Google Fit
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 1: Historical Data */}
      {tabValue === 1 && (
        <>
          {googleFitAuthenticated && (
            <Box mb={3}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleFetchGoogleFitData}
                disabled={loading}
              >
                Sync Last 7 Days from Google Fit
              </Button>
            </Box>
          )}

          {(showMockHistorical ? demoHistoricalData.length > 0 : historicalData.length > 0) ? (
            <Grid container spacing={3}>
              {(showMockHistorical ? demoHistoricalData : historicalData).map((entry, index) => (
                <Grid item xs={12} key={index}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          {formatTime(entry.syncedAt)}
                        </Typography>
                        <Chip label={entry.source} size="small" color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Synced at: {formatTime(entry.syncedAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Entries: {entry.entriesCount || (Array.isArray(entry.data) ? entry.data.length : 0)}
                      </Typography>
                      {Array.isArray(entry.data) && entry.data.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Daily Activity Summary:
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          {entry.data.map((item, idx) => (
                            <Box key={idx} mb={1}>
                              <Typography variant="body2" fontWeight="bold" color="text.primary">
                                {new Date(item.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                👣 {item.steps} steps • 🔥 {item.calories} kcal • 📏 {item.distance} km
                              </Typography>
                              {idx < entry.data.length - 1 && <Divider sx={{ mt: 1 }} />}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              {googleFitAuthenticated 
                ? 'No historical data available. Click "Sync Last 7 Days" to fetch data from Google Fit.'
                : 'Connect to your account to access your historical health data.'}
            </Alert>
          )}
        </>
      )}

      {/* Tab 2: Devices */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {(showMockDevices ? demoConnectedDevices.length > 0 : connectedDevices.length > 0) ? (
            (showMockDevices ? demoConnectedDevices : connectedDevices).map((device, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={2}>
                        <DevicesOther sx={{ fontSize: 40, color: '#3498db' }} />
                        <Box>
                          <Typography variant="h6">{device.deviceName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {device.deviceType}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last connected: {formatTime(device.lastConnected)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                        <Chip
                          label={device.status}
                          color={device.status === 'connected' ? 'success' : 'default'}
                          size="small"
                          icon={device.status === 'connected' ? <CheckCircle /> : undefined}
                        />
                        {device.status === 'connected' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={handleDisconnectBLE}
                          >
                            Disconnect
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                No devices connected.
              </Alert>
            </Grid>
          )}

          {googleFitAuthenticated && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <CloudDownload sx={{ fontSize: 40, color: '#4285f4' }} />
                      <Box>
                        <Typography variant="h6">Google Fit</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cloud-based fitness data
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="Connected"
                      color="success"
                      size="small"
                      icon={<CheckCircle />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* BLE Connection Dialog */}
      <Dialog open={bleDialogOpen} onClose={() => !connectionStatus && setBleDialogOpen(false)}>
        <DialogTitle>Connect BLE Device</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Click "Scan" to search for nearby Bluetooth health devices such as:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 2 }}>
            <li><Typography variant="body2">Fitness trackers (Fitbit, Garmin, etc.)</Typography></li>
            <li><Typography variant="body2">Smartwatches</Typography></li>
            <li><Typography variant="body2">Heart rate monitors</Typography></li>
            <li><Typography variant="body2">Smart scales</Typography></li>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Note:</strong> Chrome, Edge, or Opera browser. Bluetooth must be enabled.
            </Typography>
          </Alert>
          {connectionStatus && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {connectionStatus}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBleDialogOpen(false)} disabled={!!connectionStatus}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleConnectBLE}
            disabled={!!connectionStatus}
          >
            Scan & Connect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Google Fit Dialog */}
      <Dialog open={googleFitDialogOpen} onClose={() => setGoogleFitDialogOpen(false)}>
        <DialogTitle>Connect to Google Fit</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Connect to Google Fit to access your historical health data and use it when no BLE device is connected.
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 2 }}>
            <li><Typography variant="body2">View past 7 days of activity</Typography></li>
            <li><Typography variant="body2">Access data from multiple devices</Typography></li>
            <li><Typography variant="body2">Automatic cloud synchronization</Typography></li>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="caption">
              You'll need to grant permissions to access your fitness data.
            </Typography>
          </Alert>
          {!googleFitInitialized && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Initializing Google Fit API... Please wait.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoogleFitDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleGoogleFitAuth}
            disabled={!googleFitInitialized || googleFitAuthenticated}
          >
            {googleFitAuthenticated ? 'Already Connected' : 'Connect Google Fit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pulse animation for live indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default HealthMetrics;