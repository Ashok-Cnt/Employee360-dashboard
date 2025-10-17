import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Science as TestIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
const AlertRules = () => {
  const [rules, setRules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeApps, setActiveApps] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    conditionType: 'memory_usage',
    threshold: 80,
    durationMinutes: 5,
    enabled: true,
    targetApp: ''
  });

  useEffect(() => {
    console.log('🔔 AlertRules: Component mounted - fetching initial data');
    fetchRules();
    fetchActiveApplications();
    // No auto-refresh - only manual refresh via button
    
    return () => {
      console.log('🔔 AlertRules: Component unmounted');
    };
  }, []);

  const fetchRules = async () => {
    console.log('🔔 AlertRules: fetchRules() called at', new Date().toLocaleTimeString());
    try {
      const response = await fetch('http://localhost:8001/api/alerts/rules');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRules(data);
      } else {
        console.warn('Expected array but got:', data);
        setRules([]);
      }
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      showSnackbar('Error fetching alert rules', 'error');
      setRules([]); // Set empty array on error
    }
  };

  const fetchActiveApplications = async () => {
    console.log('🔔 AlertRules: fetchActiveApplications() called at', new Date().toLocaleTimeString());
    try {
      const response = await fetch('http://localhost:8001/api/activity/current');
      if (response.ok) {
        const snapshot = await response.json();
        
        // Extract unique application names from apps array in the snapshot
        if (snapshot.apps && snapshot.apps.length > 0) {
          const uniqueApps = [...new Set(
            snapshot.apps
              .filter(app => app.name !== 'background_apps') // Exclude background apps
              .map(app => app.title || app.name) // Use title if available, otherwise name
          )].sort();
          setActiveApps(uniqueApps);
          console.log('📱 Fetched active apps:', uniqueApps);
        } else {
          setActiveApps([]);
          console.log('📱 No active apps found in snapshot');
        }
      } else if (response.status === 404) {
        console.log('📱 No activity data available yet');
        setActiveApps([]);
      }
    } catch (error) {
      console.error('Error fetching active applications:', error);
      setActiveApps([]);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        conditionType: rule.conditionType,
        threshold: rule.threshold,
        durationMinutes: rule.durationMinutes,
        enabled: rule.enabled,
        targetApp: rule.targetApp || ''
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        conditionType: 'memory_usage',
        threshold: 80,
        durationMinutes: 5,
        enabled: true,
        targetApp: ''
      });
    }
    // Refresh active apps when opening dialog
    fetchActiveApplications();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
  };

  const handleSaveRule = async () => {
    try {
      const url = editingRule
        ? `http://localhost:8001/api/alerts/rules/${editingRule.ruleId}`
        : 'http://localhost:8001/api/alerts/rules';
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSnackbar(
          editingRule ? 'Alert rule updated successfully' : 'Alert rule created successfully',
          'success'
        );
        fetchRules();
        handleCloseDialog();
      } else {
        throw new Error('Failed to save alert rule');
      }
    } catch (error) {
      console.error('Error saving alert rule:', error);
      showSnackbar('Error saving alert rule', 'error');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/api/alerts/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSnackbar('Alert rule deleted successfully', 'success');
        fetchRules();
      } else {
        throw new Error('Failed to delete alert rule');
      }
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      showSnackbar('Error deleting alert rule', 'error');
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const response = await fetch(`http://localhost:8001/api/alerts/rules/${ruleId}/toggle`, {
        method: 'POST'
      });

      if (response.ok) {
        showSnackbar('Alert rule toggled successfully', 'success');
        fetchRules();
      } else {
        throw new Error('Failed to toggle alert rule');
      }
    } catch (error) {
      console.error('Error toggling alert rule:', error);
      showSnackbar('Error toggling alert rule', 'error');
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/alerts/test', {
        method: 'POST'
      });

      if (response.ok) {
        showSnackbar('Test notification sent! Check your desktop.', 'success');
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      showSnackbar('Error sending test notification', 'error');
    }
  };

  const getConditionTypeLabel = (type) => {
    const labels = {
      memory_usage: 'Memory Usage',
      app_overrun: 'Application Overrun',
      system_overrun: 'System Overrun'
    };
    return labels[type] || type;
  };

  const getConditionTypeColor = (type) => {
    const colors = {
      memory_usage: 'primary',
      app_overrun: 'warning',
      system_overrun: 'error'
    };
    return colors[type] || 'default';
  };

  const getThresholdUnit = (type) => {
    if (type === 'memory_usage') return 'MB or %';
    if (type === 'system_overrun') return '%';
    if (type === 'app_overrun') return 'minutes';
    return '';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Desktop Alert Rules
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchRules();
              fetchActiveApplications();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<TestIcon />}
            onClick={handleTestNotification}
          >
            Test Notification
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Alert Rule
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure desktop alerts to notify you when applications exceed resource limits, 
        run without being used, or when system resources are overused.
      </Alert>

      <Grid container spacing={3}>
        {rules.map((rule) => (
          <Grid item xs={12} md={6} lg={4} key={rule.ruleId}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {rule.name}
                    </Typography>
                    <Chip
                      label={getConditionTypeLabel(rule.conditionType)}
                      color={getConditionTypeColor(rule.conditionType)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <Box>
                    {rule.enabled ? (
                      <NotificationsActiveIcon color="success" />
                    ) : (
                      <NotificationsOffIcon color="disabled" />
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Threshold:</strong> {rule.threshold} {getThresholdUnit(rule.conditionType)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Duration:</strong> {rule.durationMinutes} minutes
                </Typography>
                {rule.targetApp && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Target App:</strong> {rule.targetApp}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.ruleId)}
                        size="small"
                      />
                    }
                    label={rule.enabled ? 'Enabled' : 'Disabled'}
                  />
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(rule)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRule(rule.ruleId)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Rule Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Condition Type"
              select
              value={formData.conditionType}
              onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="memory_usage">Memory Usage</MenuItem>
              <MenuItem value="app_overrun">Application Overrun</MenuItem>
              <MenuItem value="system_overrun">System Overrun</MenuItem>
            </TextField>

            <TextField
              label="Threshold"
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
              fullWidth
              required
              helperText={`Unit: ${getThresholdUnit(formData.conditionType)}`}
            />

            <TextField
              label="Duration (minutes)"
              type="number"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
              fullWidth
              required
              helperText="How long the condition must persist before alerting"
            />

            <TextField
              label="Target Application (optional)"
              select
              value={formData.targetApp}
              onChange={(e) => setFormData({ ...formData, targetApp: e.target.value })}
              fullWidth
              helperText={`${activeApps.length} active applications available. Select from taskbar apps or leave blank for system-wide.`}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={fetchActiveApplications}
                    title="Refresh active applications"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                )
              }}
            >
              <MenuItem value="">
                <em>None (System-wide)</em>
              </MenuItem>
              {activeApps.length === 0 && (
                <MenuItem disabled>
                  <em>No active applications found</em>
                </MenuItem>
              )}
              {activeApps.map((app) => (
                <MenuItem key={app} value={app}>
                  {app}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained" disabled={!formData.name}>
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlertRules;
