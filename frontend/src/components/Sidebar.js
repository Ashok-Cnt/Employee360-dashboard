import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work,
  School,
  FitnessCenter,
  Psychology,
  Computer,
  NotificationsActive,
  Settings,
  ExpandLess,
  ExpandMore,
  Extension,
  Event,
} from '@mui/icons-material';

const drawerWidth = 240;
const collapsedWidth = 72; // icon width + padding

// Main menu items
const mainMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Work Patterns', icon: <Work />, path: '/work-patterns' },
  { text: 'Learning Progress', icon: <School />, path: '/learning' },
  { text: 'Health Metrics', icon: <FitnessCenter />, path: '/health' },
  { text: 'AI Insights', icon: <Psychology />, path: '/insights' },
];

// Settings menu items
const settingsMenuItems = [
  { text: 'Application Activity', icon: <Computer />, path: '/application-activity' },
  { text: 'Alert Rules', icon: <NotificationsActive />, path: '/alert-rules' },
  { text: 'Category Configuration', icon: <Settings />, path: '/category-configuration' },
  { text: 'Holiday Management', icon: <Event />, path: '/holiday-management' },
];

const Sidebar = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        },
      }}
    >
      <Toolbar />
      <List>
        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
                px: collapsed ? 1.5 : 2
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: location.pathname === item.path ? 'primary.contrastText' : 'inherit',
                  minWidth: collapsed ? 0 : 40,
                  justifyContent: 'center'
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Add-ons Section with Collapsible Menu */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleSettingsToggle}
            sx={{
              px: collapsed ? 1.5 : 2
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'inherit',
                minWidth: collapsed ? 0 : 40,
                justifyContent: 'center'
              }}
            >
              <Extension />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText 
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        letterSpacing: 0.5
                      }}
                    >
                      Add-ons
                    </Typography>
                  } 
                />
                {settingsOpen ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </ListItemButton>
        </ListItem>

        <Collapse in={settingsOpen && !collapsed} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {settingsMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: location.pathname === item.path ? 'primary.contrastText' : 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;