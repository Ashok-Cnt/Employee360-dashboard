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
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  Timer as TimerIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  PlayArrow as PlayArrowIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const LearningProgress = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [allCoursesData, setAllCoursesData] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // Last 7 days
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Helper function to get period text
  const getPeriodText = (days) => {
    if (days === 1) return 'Today';
    return `Last ${days} days`;
  };

  // Helper function to get progress bar color based on completion percentage
  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // Fetch today's learning progress from new API
  const fetchTodayProgress = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/udemy-courses/today');
      if (!response.ok) throw new Error('Failed to fetch today\'s learning data');
      const data = await response.json();
      setTodayData(data);
    } catch (err) {
      console.error('Error fetching today\'s progress:', err);
      setError(err.message);
    }
  };

  // Fetch all courses data
  const fetchAllCourses = async (days) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/udemy-courses/all?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch courses data');
      const data = await response.json();
      setAllCoursesData(data);
    } catch (err) {
      console.error('Error fetching all courses:', err);
      setError(err.message);
    }
  };

  // Fetch learning statistics
  const fetchStats = async (days) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/udemy-courses/stats?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch learning stats');
      const data = await response.json();
      setStats(data.stats);
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
        fetchAllCourses(selectedPeriod),
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

  const handleCourseExpand = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const renderCourseDetails = (course) => {
    const totalSections = course.sections.length;
    const sectionsWithLessons = course.sections.filter(s => s.totalLessons > 0).length;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h4">{course.stats.percentComplete}%</Typography>
              <Typography variant="caption">Complete</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="h4">{course.stats.completedLessons}</Typography>
              <Typography variant="caption">Completed Lessons</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
              <Typography variant="h4">{course.stats.totalLessons}</Typography>
              <Typography variant="caption">Total Lessons</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <Typography variant="h4">{totalSections}</Typography>
              <Typography variant="caption">Sections</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Sections with Lessons */}
        <Typography variant="h6" sx={{ mb: 2 }}>Course Sections</Typography>
        {course.sections.map((section, index) => (
          <Accordion key={index} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                <Typography sx={{ flex: 1, fontWeight: 'medium' }}>
                  {section.sectionIndex}. {section.sectionTitle}
                </Typography>
                {section.totalLessons > 0 && (
                  <Chip 
                    label={`${section.completedLessons}/${section.totalLessons}`}
                    size="small"
                    color={section.completedLessons === section.totalLessons ? 'success' : 'default'}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {section.lessons && section.lessons.length > 0 ? (
                <List dense>
                  {section.lessons.map((lesson, lessonIndex) => (
                    <ListItem key={lessonIndex}>
                      {lesson.isCompleted ? (
                        <CheckCircleIcon sx={{ color: 'success.main', mr: 2 }} />
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', mr: 2 }} />
                      )}
                      <ListItemText
                        primary={`${lesson.lessonIndex}. ${lesson.lessonTitle}`}
                        primaryTypographyProps={{
                          sx: { 
                            textDecoration: lesson.isCompleted ? 'line-through' : 'none',
                            color: lesson.isCompleted ? 'text.disabled' : 'text.primary'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No lesson details available for this section
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
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
                  {stats?.totalCourses || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Total Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
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

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats?.completedCourses || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Courses Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <PlayArrowIcon />
                </Avatar>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {todayData?.totalCourses || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Courses Today
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
                Today's Courses
              </Typography>
            </Box>
            
            {todayData && todayData.courses && todayData.courses.length > 0 ? (
              <List>
                {todayData.courses.map((course, index) => (
                  <React.Fragment key={course.courseId}>
                    <ListItem 
                      alignItems="flex-start" 
                      sx={{ px: 0, cursor: 'pointer' }}
                      onClick={() => handleCourseExpand(`today-${course.courseId}`)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Tooltip 
                              title={course.alternateNames && course.alternateNames.length > 0 
                                ? `Also known as: ${course.alternateNames.join(', ')}` 
                                : ''
                              }
                              arrow
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', flex: 1 }}>
                                {course.courseName}
                              </Typography>
                            </Tooltip>
                            <Chip 
                              label={`${course.stats.percentComplete}%`}
                              size="small" 
                              color={course.stats.percentComplete === 100 ? 'success' : 'primary'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }}>
                              <Chip 
                                label={`${course.stats.completedLessons}/${course.stats.totalLessons} lessons`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                label={`${course.sections.length} sections`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={course.stats.percentComplete}
                              color={getProgressColor(course.stats.percentComplete)}
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>
                        }
                      />
                      <IconButton>
                        <ExpandMoreIcon 
                          sx={{ 
                            transform: expandedCourse === `today-${course.courseId}` ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        />
                      </IconButton>
                    </ListItem>
                    <Collapse in={expandedCourse === `today-${course.courseId}`} timeout="auto" unmountOnExit>
                      {renderCourseDetails(course)}
                    </Collapse>
                    {index < todayData.courses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
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
                Top Courses ({stats?.period || getPeriodText(selectedPeriod)})
              </Typography>
            </Box>
            
            {stats && stats.topCourses && stats.topCourses.length > 0 ? (
              <List>
                {stats.topCourses.map((course, index) => (
                  <React.Fragment key={course.courseId}>
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
                              label={`${course.maxProgress}%`}
                              size="small"
                              color={course.maxProgress === 100 ? 'success' : 'primary'}
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

      {/* All Courses Section */}
      {allCoursesData && allCoursesData.courses && allCoursesData.courses.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              All Courses ({allCoursesData.period || getPeriodText(selectedPeriod)})
            </Typography>
            
            <Grid container spacing={2}>
              {allCoursesData.courses.map((course) => (
                <Grid item xs={12} key={course.courseId}>
                  <Card sx={{ '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.3s' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Tooltip 
                            title={course.alternateNames && course.alternateNames.length > 0 
                              ? `Also known as: ${course.alternateNames.join(', ')}` 
                              : ''
                            }
                            arrow
                          >
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {course.courseName}
                            </Typography>
                          </Tooltip>
                          {course.alternateNames && course.alternateNames.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                              aka: {course.alternateNames[0]}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <Chip 
                              label={`${course.stats.percentComplete}% Complete`}
                              color={course.stats.percentComplete === 100 ? 'success' : 'primary'}
                              size="small"
                            />
                            <Chip 
                              label={`${course.stats.completedLessons}/${course.stats.totalLessons} Lessons`}
                              variant="outlined"
                              size="small"
                            />
                            <Chip 
                              label={course.platform}
                              color="info"
                              size="small"
                            />
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={course.stats.percentComplete}
                            color={getProgressColor(course.stats.percentComplete)}
                            sx={{ height: 10, borderRadius: 1 }}
                          />
                        </Box>
                        <IconButton 
                          onClick={() => handleCourseExpand(course.courseId)}
                          sx={{ ml: 2 }}
                        >
                          <ExpandMoreIcon 
                            sx={{ 
                              transform: expandedCourse === course.courseId ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s'
                            }}
                          />
                        </IconButton>
                      </Box>
                      
                      <Collapse in={expandedCourse === course.courseId} timeout="auto" unmountOnExit>
                        {renderCourseDetails(course)}
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LearningProgress;