import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

const HolidayManagement = () => {
  const [holidays, setHolidays] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openFetchDialog, setOpenFetchDialog] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [currentHoliday, setCurrentHoliday] = React.useState({
    id: '',
    name: '',
    date: '',
    type: 'public',
    country: 'US',
    description: ''
  });
  const [fetchParams, setFetchParams] = React.useState({
    country: 'india',
    year: new Date().getFullYear().toString(),
    replaceExisting: false
  });
  const [fetchingOnline, setFetchingOnline] = React.useState(false);
  const [alert, setAlert] = React.useState({ show: false, message: '', severity: 'success' });

  const holidayTypes = ['public', 'religious', 'cultural'];

  // Fetch holidays
  const fetchHolidays = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8001/api/holidays');
      const data = await response.json();
      setHolidays(data.holidays || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      showAlert('Failed to fetch holidays', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Show alert
  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
  };

  // Open dialog for add/edit
  const handleOpenDialog = (holiday = null) => {
    if (holiday) {
      setEditMode(true);
      setCurrentHoliday(holiday);
    } else {
      setEditMode(false);
      setCurrentHoliday({
        id: '',
        name: '',
        date: '',
        type: 'public',
        country: 'US',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentHoliday({
      id: '',
      name: '',
      date: '',
      type: 'public',
      country: 'US',
      description: ''
    });
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setCurrentHoliday(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save holiday (create or update)
  const handleSaveHoliday = async () => {
    try {
      if (!currentHoliday.name || !currentHoliday.date || !currentHoliday.type) {
        showAlert('Please fill in all required fields', 'error');
        return;
      }

      const url = editMode 
        ? `http://localhost:8001/api/holidays/${currentHoliday.id}`
        : 'http://localhost:8001/api/holidays';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: currentHoliday.name,
          date: currentHoliday.date,
          type: currentHoliday.type,
          country: currentHoliday.country,
          description: currentHoliday.description
        })
      });

      if (response.ok) {
        showAlert(editMode ? 'Holiday updated successfully' : 'Holiday created successfully', 'success');
        handleCloseDialog();
        fetchHolidays();
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to save holiday', 'error');
      }
    } catch (error) {
      console.error('Error saving holiday:', error);
      showAlert('Failed to save holiday', 'error');
    }
  };

  // Delete holiday
  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/api/holidays/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showAlert('Holiday deleted successfully', 'success');
        fetchHolidays();
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to delete holiday', 'error');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      showAlert('Failed to delete holiday', 'error');
    }
  };

  // Fetch holidays from online API
  const handleFetchOnline = async () => {
    if (!fetchParams.country || !fetchParams.year) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    try {
      setFetchingOnline(true);
      const response = await fetch('http://localhost:8001/api/holidays/fetch-online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fetchParams)
      });

      if (response.ok) {
        const result = await response.json();
        showAlert(result.message || 'Holidays imported successfully', 'success');
        setOpenFetchDialog(false);
        fetchHolidays();
        // Reset form
        setFetchParams({
          country: 'india',
          year: new Date().getFullYear().toString(),
          replaceExisting: false
        });
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to fetch holidays', 'error');
      }
    } catch (error) {
      console.error('Error fetching online holidays:', error);
      showAlert('Failed to fetch holidays from online source', 'error');
    } finally {
      setFetchingOnline(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'public': return 'primary';
      case 'religious': return 'secondary';
      case 'cultural': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Holiday Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={() => setOpenFetchDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#764ba2',
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            Fetch Online
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add Holiday
          </Button>
        </Box>
      </Box>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Holidays Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No holidays found. Click "Add Holiday" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    holidays.map((holiday) => (
                      <TableRow key={holiday.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {holiday.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(holiday.date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={holiday.type} 
                            size="small" 
                            color={getTypeColor(holiday.type)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{holiday.country}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {holiday.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(holiday)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon sx={{ color: '#9c27b0' }} />
            <Typography variant="h6">
              {editMode ? 'Edit Holiday' : 'Add New Holiday'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Holiday Name *"
              fullWidth
              value={currentHoliday.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., New Year's Day"
            />
            <TextField
              label="Date *"
              type="date"
              fullWidth
              value={currentHoliday.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Type *"
              select
              fullWidth
              value={currentHoliday.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
            >
              {holidayTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Country"
              fullWidth
              value={currentHoliday.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="e.g., US"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentHoliday.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the holiday"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveHoliday}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none'
            }}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fetch Online Holidays Dialog */}
      <Dialog open={openFetchDialog} onClose={() => setOpenFetchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudDownloadIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6">
              Fetch Holidays from Online Source
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info">
              This will fetch public holidays from an online API and import them into your holiday list.
            </Alert>
            
            <TextField
              label="Country *"
              select
              fullWidth
              value={fetchParams.country}
              onChange={(e) => setFetchParams({ ...fetchParams, country: e.target.value })}
              helperText="Select the country to fetch holidays for"
            >
              <MenuItem value="india">India (IN)</MenuItem>
              <MenuItem value="us">United States (US)</MenuItem>
              <MenuItem value="uk">United Kingdom (UK)</MenuItem>
              <MenuItem value="canada">Canada (CA)</MenuItem>
              <MenuItem value="australia">Australia (AU)</MenuItem>
            </TextField>
            
            <TextField
              label="Year *"
              type="number"
              fullWidth
              value={fetchParams.year}
              onChange={(e) => setFetchParams({ ...fetchParams, year: e.target.value })}
              inputProps={{ min: 2020, max: 2030 }}
              helperText="Enter the year (2020-2030)"
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="replaceExisting"
                checked={fetchParams.replaceExisting}
                onChange={(e) => setFetchParams({ ...fetchParams, replaceExisting: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="replaceExisting" style={{ cursor: 'pointer', userSelect: 'none' }}>
                Replace existing holidays for this country and year
              </label>
            </Box>
            
            {fetchingOnline && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Fetching holidays from online source...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenFetchDialog(false)} color="inherit" disabled={fetchingOnline}>
            Cancel
          </Button>
          <Button
            onClick={handleFetchOnline}
            variant="contained"
            disabled={fetchingOnline}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none'
            }}
          >
            Fetch Holidays
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidayManagement;
