import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Chip,
  Avatar,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Refresh,
  CheckCircle,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemUser } from '../store/slices/userSlice';

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const dispatch = useDispatch();
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [customDisplayName, setCustomDisplayName] = useState('');
  
  // Get system user from Redux store
  const systemUser = useSelector((state) => state.user.systemUser);

  // Load custom display name from API on mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/preferences/current/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Always set display name (defaults to username on backend)
            setCustomDisplayName(data.preferences.customDisplayName || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };
    
    fetchUserPreferences();
  }, []);

  // Get the display name (custom or system)
  const getDisplayName = () => {
    return customDisplayName || systemUser?.displayName || systemUser?.username || 'User';
  };

  const handleRefreshUser = () => {
    dispatch(fetchSystemUser());
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        
        // Count unread
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Load notifications on mount and poll every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
    fetchNotifications(); // Fetch full notifications when opening popover
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleAccountClick = (event) => {
    setAccountAnchor(event.currentTarget);
  };

  const handleAccountClose = () => {
    setAccountAnchor(null);
  };

  const handleEditDisplayName = () => {
    setEditedDisplayName(getDisplayName());
    setEditDialogOpen(true);
  };

  const handleSaveDisplayName = async () => {
    if (editedDisplayName.trim()) {
      try {
        const username = systemUser?.username;
        if (!username) {
          console.error('No username available');
          return;
        }
        
        const response = await fetch(`http://localhost:8001/api/preferences/${username}/display-name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: editedDisplayName.trim() })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCustomDisplayName(data.preferences.customDisplayName);
            setEditDialogOpen(false);
          }
        }
      } catch (error) {
        console.error('Error saving display name:', error);
      }
    }
  };

  const handleResetDisplayName = async () => {
    try {
      const username = systemUser?.username;
      if (!username) {
        console.error('No username available');
        return;
      }
      
      const response = await fetch(`http://localhost:8001/api/preferences/${username}/display-name`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomDisplayName('');
          setEditDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error resetting display name:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditedDisplayName('');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8001/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (response.ok) {
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8001/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const notificationOpen = Boolean(notificationAnchor);
  const accountOpen = Boolean(accountAnchor);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'primary.main'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Employee360
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {systemUser && (
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>
                {getDisplayName().charAt(0).toUpperCase()}
              </Avatar>}
              label={getDisplayName()}
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '& .MuiChip-avatar': {
                  color: 'white'
                }
              }}
            />
          )}
          
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton color="inherit" onClick={handleAccountClick}>
              <AccountCircle />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Notifications Popover */}
      <Popover
        open={notificationOpen}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 600 }}>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6">
              Notifications ({unreadCount} unread)
            </Typography>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllAsRead}
                startIcon={<CheckCircle />}
              >
                Mark all read
              </Button>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: notification.read ? 'action.hover' : 'action.selected',
                      }
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!notification.read && (
                          <Tooltip title="Mark as read">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: notification.read ? 400 : 600,
                            pr: 6
                          }}
                        >
                          {notification.ruleName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'text.secondary',
                              pr: 6
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.disabled',
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>

      {/* Account Details Popover */}
      <Popover
        open={accountOpen}
        anchorEl={accountAnchor}
        onClose={handleAccountClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                width: 56, 
                height: 56,
                fontSize: '1.5rem',
                mr: 2
              }}
            >
              {getDisplayName().charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {getDisplayName()}
                </Typography>
                <Tooltip title="Edit display name">
                  <IconButton size="small" onClick={handleEditDisplayName}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {customDisplayName ? 'Custom Name' : 'System User'}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Username" 
                secondary={systemUser?.username || 'Not Available'}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Display Name" 
                secondary={getDisplayName()}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
            {customDisplayName && (
              <ListItem>
                <ListItemText 
                  primary="Original Name" 
                  secondary={systemUser?.displayName || systemUser?.username || 'Not Available'}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
            )}
            <ListItem>
              <ListItemText 
                primary="Computer Name" 
                secondary={systemUser?.computerName || systemUser?.hostname || 'Not Available'}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
            {systemUser?.email && (
              <ListItem>
                <ListItemText 
                  primary="Email" 
                  secondary={systemUser.email}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 2 }} />

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              handleRefreshUser();
              handleAccountClose();
            }}
          >
            Refresh User Data
          </Button>
        </Box>
      </Popover>

      {/* Edit Display Name Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Display Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editedDisplayName}
            onChange={(e) => setEditedDisplayName(e.target.value)}
            helperText="This name will be shown in the navbar and saved locally"
            sx={{ mt: 2 }}
          />
          {customDisplayName && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Current custom name: {customDisplayName}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {customDisplayName && (
            <Button onClick={handleResetDisplayName} color="error">
              Reset to System Name
            </Button>
          )}
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveDisplayName} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;