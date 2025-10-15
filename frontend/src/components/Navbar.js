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
  Refresh
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemUser } from '../store/slices/userSlice';

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const dispatch = useDispatch();
  
  // Get system user from Redux store
  const systemUser = useSelector((state) => state.user.systemUser);

  const handleRefreshUser = () => {
    dispatch(fetchSystemUser());
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
          {systemUser && (
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>
                {systemUser.displayName?.charAt(0) || systemUser.username?.charAt(0) || 'U'}
              </Avatar>}
              label={systemUser.displayName || systemUser.username || 'System User'}
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
          
          <Tooltip title="Refresh system user">
            <IconButton color="inherit" onClick={handleRefreshUser}>
              <Refresh />
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