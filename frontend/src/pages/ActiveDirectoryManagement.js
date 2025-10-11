import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Sync,
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  Refresh,
  Search,
  CloudSync,
  Group
} from '@mui/icons-material';

const ActiveDirectoryManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/ad/test-connection');
      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: 'Failed to connect to backend API'
      });
    } finally {
      setLoading(false);
    }
  };

  const searchADUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/ad/search?query=${encodeURIComponent(searchQuery)}&limit=10`);
      const result = await response.json();
      setSearchResults(result.users || []);
      setAlert({
        type: 'info',
        message: `Found ${result.count} users matching "${searchQuery}"`
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to search Active Directory users'
      });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const syncUser = async (user) => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/ad/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          username: user.username,
          force_update: true
        })
      });
      
      const result = await response.json();
      setAlert({
        type: 'success',
        message: `User ${result.action}: ${result.message}`
      });
      setSyncDialogOpen(false);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to sync user from Active Directory'
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/ad/bulk-sync?limit=50', {
        method: 'POST'
      });
      
      const result = await response.json();
      setAlert({
        type: 'success',
        message: 'Bulk sync started in background. This may take a few minutes.'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to start bulk sync'
      });
    } finally {
      setLoading(false);
    }
  };

  const UserDetailsCard = ({ user }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {user.full_name || user.display_name || `${user.first_name} ${user.last_name}`.trim()}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">{user.email}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Business sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {user.job_title} {user.department && `• ${user.department}`}
              </Typography>
            </Box>
            
            {user.phone_number && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{user.phone_number}</Typography>
              </Box>
            )}
            
            {user.office_location && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{user.office_location}</Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Company Info</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.company || 'Not specified'}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Username</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.username}
            </Typography>
            
            {user.user_principal_name && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>UPN</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.user_principal_name}
                </Typography>
              </>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<CloudSync />}
                onClick={() => {
                  setSelectedUser(user);
                  setSyncDialogOpen(true);
                }}
                disabled={loading}
              >
                Sync to Database
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Active Directory Integration
      </Typography>
      
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Connection Status" />
        <Tab label="Search Users" />
        <Tab label="Bulk Operations" />
      </Tabs>

      {/* Connection Status Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Active Directory Connection</Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={testConnection}
                disabled={loading}
              >
                Test Connection
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : connectionStatus ? (
              <Box>
                <Chip
                  label={connectionStatus.status === 'success' ? 'Connected' : 'Disconnected'}
                  color={connectionStatus.status === 'success' ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" gutterBottom>
                  <strong>Message:</strong> {connectionStatus.message}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Server:</strong> {connectionStatus.server}
                </Typography>
                <Typography variant="body2">
                  <strong>Domain:</strong> {connectionStatus.domain}
                </Typography>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Search Users Tab */}
      {tabValue === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Search Active Directory Users</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Search by email or username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchADUsers()}
                  placeholder="user@domain.com or username"
                />
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={searchADUsers}
                  disabled={loading || !searchQuery.trim()}
                >
                  Search
                </Button>
              </Box>
            </CardContent>
          </Card>

          {searchResults.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Search Results ({searchResults.length} users)
              </Typography>
              {searchResults.map((user, index) => (
                <UserDetailsCard key={index} user={user} />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Bulk Operations Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Bulk Operations</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sync multiple users from Active Directory to the database. This operation runs in the background.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<Group />}
              onClick={bulkSync}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? 'Starting Bulk Sync...' : 'Sync 50 Users from AD'}
            </Button>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Note:</strong> Bulk sync will create new users with temporary passwords ("changeme123"). 
              Users should change their passwords on first login.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Sync Confirmation Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="md">
        <DialogTitle>Sync User from Active Directory</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to sync this user to the database?
              </Typography>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2">User Details:</Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedUser.full_name || selectedUser.display_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedUser.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Department:</strong> {selectedUser.department || 'Not specified'}
                </Typography>
                <Typography variant="body2">
                  <strong>Job Title:</strong> {selectedUser.job_title || 'Not specified'}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                If this user already exists, their information will be updated with AD data.
                A temporary password will be set for new users.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => syncUser(selectedUser)}
            disabled={loading}
          >
            {loading ? 'Syncing...' : 'Sync User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveDirectoryManagement;