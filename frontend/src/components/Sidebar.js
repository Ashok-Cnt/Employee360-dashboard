import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work,
  School,
  FitnessCenter,
  Psychology,
  Computer,
  NotificationsActive,
} from '@mui/icons-material';

const drawerWidth = 240;
const collapsedWidth = 72; // icon width + padding

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Work Patterns', icon: <Work />, path: '/work-patterns' },
  { text: 'Learning Progress', icon: <School />, path: '/learning' },
  { text: 'Health Metrics', icon: <FitnessCenter />, path: '/health' },
  { text: 'AI Insights', icon: <Psychology />, path: '/insights' },
  { text: 'Application Activity', icon: <Computer />, path: '/application-activity' },
  { text: 'Alert Rules', icon: <NotificationsActive />, path: '/alert-rules' },
];

const Sidebar = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
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
        {menuItems.map((item) => (
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
    </Drawer>
  );
};

export default Sidebar;