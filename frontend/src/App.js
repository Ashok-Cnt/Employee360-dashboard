import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { autoLogin, loadUserFromStorage, refreshUserData, fetchSystemUser } from './store/slices/userSlice';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import WorkPatterns from './pages/WorkPatterns';
import LearningProgress from './pages/LearningProgress';
import HealthMetrics from './pages/HealthMetrics';
import AIInsights from './pages/AIInsights';
import ApplicationActivity from './pages/ApplicationActivity';

const drawerWidth = 240; // keep for potential responsive logic

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dispatch = useDispatch();
  const { currentUser, loading, isAuthenticated, systemUserLoading } = useSelector((state) => state.user);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  useEffect(() => {
    // Initialize system user first (non-blocking, with timeout)
    const systemUserPromise = dispatch(fetchSystemUser());
    
    // Try to load user from localStorage first
    dispatch(loadUserFromStorage());
    
    // If no user in storage, auto-login with demo user
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      dispatch(autoLogin());
    }

    // Set up a timeout for system user loading to prevent infinite loading
    setTimeout(() => {
      if (systemUserLoading) {
        console.warn('System user loading timed out, using fallback');
      }
    }, 10000); // 10 second timeout
  }, [dispatch]);

  // Set up periodic refresh of user data
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Refresh user data every 30 seconds to get latest changes from DB
      const refreshInterval = setInterval(() => {
        dispatch(refreshUserData());
      }, 30000); // 30 seconds

      // Clean up interval on unmount
      return () => clearInterval(refreshInterval);
    }
  }, [dispatch, isAuthenticated, currentUser]);

  // Show loading only for main user authentication, not system user
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Loading Employee360 Dashboard...</Typography>
        {systemUserLoading && (
          <Typography variant="body2" color="text.secondary">
            Detecting system user...
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Navbar 
        onToggleSidebar={toggleSidebar} 
        sidebarCollapsed={sidebarCollapsed}
      />
      <Sidebar collapsed={sidebarCollapsed} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // add a subtle gap from the sidebar
          pl: sidebarCollapsed ? { xs: 1, md: 1.5 } : { xs: 1, md: 2 },
          pr: { xs: 2, md: 3 },
          py: 3,
          mt: 8, // account for fixed navbar height
          // remove manual margin/width calc; Drawer already occupies space
          maxWidth: '100%',
          overflowX: 'hidden',
          position: 'relative',
          '&:before': sidebarCollapsed ? {} : {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'divider'
          }
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/work-patterns" element={<WorkPatterns currentUser={currentUser} />} />
          <Route path="/learning" element={<LearningProgress currentUser={currentUser} />} />
          <Route path="/health" element={<HealthMetrics currentUser={currentUser} />} />
          <Route path="/insights" element={<AIInsights currentUser={currentUser} />} />
          <Route path="/application-activity" element={<ApplicationActivity />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;