import React from 'react';
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
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Refresh,
  CloudSync
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { refreshUserData } from '../store/slices/userSlice';

const Navbar = ({ onToggleSidebar, sidebarCollapsed, currentUser }) => {
  const dispatch = useDispatch();

  const handleRefreshUser = () => {
    dispatch(refreshUserData());
  };

  const handleADSync = async () => {
    if (currentUser && currentUser.email) {
      try {
        const response = await fetch(`http://127.0.0.1:8001/api/ad/refresh-user/${currentUser.id}`, {
          method: 'POST'
        });
        if (response.ok) {
          // Refresh user data after AD sync
          dispatch(refreshUserData());
        }
      } catch (error) {
        console.error('AD sync failed:', error);
      }
    }
  };
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
          {currentUser && (
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>
                {currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) || 'U'}
              </Avatar>}
              label={currentUser.full_name || currentUser.username || 'User'}
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
          
          <Tooltip title="Refresh user data">
            <IconButton color="inherit" onClick={handleRefreshUser}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Sync from Active Directory">
            <IconButton color="inherit" onClick={handleADSync}>
              <CloudSync />
            </IconButton>
          </Tooltip>
          
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;