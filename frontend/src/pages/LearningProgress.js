import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  Timer as TimerIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const LearningProgress = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // Last 7 days

  // Fetch today's learning progress
  const fetchTodayProgress = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/learning-progress/today');
      if (!response.ok) throw new Error('Failed to fetch today\'s learning data');
      const data = await response.json();
      setTodayData(data);
    } catch (err) {
      console.error('Error fetching today\'s progress:', err);
      setError(err.message);
    }
  };

  // Fetch learning statistics
  const fetchStats = async (days) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/learning-progress/stats?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch learning stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchTodayProgress(),
        fetchStats(selectedPeriod)
      ]);
      setLoading(false);
    };

    loadData();
    
    // Auto-refresh disabled
  }, [selectedPeriod]);

  const formatHours = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Learning Progress
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            label="Period"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value={1}>Today</MenuItem>
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats?.uniqueCourses || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Unique Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatHours(stats?.totalLearningHours || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Total Learning Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatHours(stats?.avgHoursPerDay || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Avg Hours/Day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats?.totalDaysWithLearning || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Active Learning Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Learning Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MenuBookIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Today's Learning Activity
              </Typography>
            </Box>
            
            {todayData && todayData.courses && todayData.courses.length > 0 ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Time Today: <strong>{formatHours(todayData.totalHours)}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Courses: <strong>{todayData.totalCourses}</strong>
                  </Typography>
                </Box>
                
                <List>
                  {todayData.courses.map((course, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {course.courseName}
                              </Typography>
                              <Chip 
                                label={course.platform} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                <Chip 
                                  icon={<TimerIcon />}
                                  label={formatHours(course.totalHours)}
                                  size="small"
                                  sx={{ bgcolor: 'success.light', color: 'success.dark' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {course.sessions.length} session{course.sessions.length > 1 ? 's' : ''}
                                </Typography>
                              </Box>
                              
                              {/* Progress bar */}
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={Math.min(course.totalHours * 10, 100)} 
                                  sx={{ height: 6, borderRadius: 1 }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < todayData.courses.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SchoolIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No learning activity detected today
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start watching a course on Udemy to track your progress
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Courses */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">
                Top Courses ({stats?.period || 'Last 7 days'})
              </Typography>
            </Box>
            
            {stats && stats.topCourses && stats.topCourses.length > 0 ? (
              <List>
                {stats.topCourses.map((course, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        bgcolor: `${['primary', 'success', 'info', 'warning', 'error'][index % 5]}.light`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontWeight: 'bold',
                        color: `${['primary', 'success', 'info', 'warning', 'error'][index % 5]}.dark`
                      }}>
                        #{index + 1}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {course.courseName}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip 
                              label={formatHours(course.totalHours)}
                              size="small"
                              icon={<TimerIcon />}
                            />
                            <Chip 
                              label={`${course.daysActive} days`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={course.platform}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < stats.topCourses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MenuBookIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No course data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Course tracking will appear once you start learning
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LearningProgress;