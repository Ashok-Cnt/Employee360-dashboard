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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Pagination,
  Slider,
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
  Flag as FlagIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const LearningProgress = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [allCoursesData, setAllCoursesData] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // Last 7 days
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [goals, setGoals] = useState([]);
  const [openGoalDialog, setOpenGoalDialog] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCourseId, setNewGoalCourseId] = useState('');
  const [newGoalHours, setNewGoalHours] = useState('');
  const [newGoalProgress, setNewGoalProgress] = useState(0);
  const [editingGoalIndex, setEditingGoalIndex] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editGoalText, setEditGoalText] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCourseId, setEditGoalCourseId] = useState('');
  const [editGoalHours, setEditGoalHours] = useState('');
  const [editGoalProgress, setEditGoalProgress] = useState(0);
  
  // Pagination and tabs state
  const [goalsTab, setGoalsTab] = useState(0); // 0: In Progress, 1: Completed
  const [goalsPage, setGoalsPage] = useState(1);
  const [coursesTab, setCoursesTab] = useState(0); // 0: In Progress, 1: Completed
  const [coursesPage, setCoursesPage] = useState(1);
  const itemsPerPage = 5;

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

  // Helper function to get course completion by courseId
  const getCourseCompletion = (courseId) => {
    if (!courseId || !allCoursesData?.courses) return null;
    const course = allCoursesData.courses.find(c => c.courseId === courseId);
    return course ? course.stats.percentComplete : null;
  };

  // Helper function to get course name by courseId
  const getCourseName = (courseId) => {
    if (!courseId || !allCoursesData?.courses) return null;
    const course = allCoursesData.courses.find(c => c.courseId === courseId);
    return course ? course.courseName : null;
  };

  // Helper function to calculate average hours per day
  const getAverageHoursPerDay = (goalTotalHours, targetDate, createdDate) => {
    if (!goalTotalHours || !targetDate) return null;
    const start = new Date(createdDate);
    const end = new Date(targetDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 0) return null;
    return (goalTotalHours / daysDiff).toFixed(1);
  };

  // Calculate time spent today on a specific course
  const getTodayTimeSpent = (courseId) => {
    if (!todayData || !todayData.courses) return null;
    const course = todayData.courses.find(c => c.courseId === courseId);
    if (!course) return null;
    
    const completedLessons = course.stats.completedLessons;
    if (completedLessons === 0) return null;
    
    // Calculate actual time from timestamps if available
    if (course.firstTimestamp && course.lastTimestamp) {
      const firstTime = new Date(course.firstTimestamp);
      const lastTime = new Date(course.lastTimestamp);
      const diffMs = lastTime - firstTime;
      const totalMinutes = Math.round(diffMs / (1000 * 60));
      
      if (totalMinutes < 1) {
        // If less than 1 minute, estimate based on lessons
        const estimatedMinutes = completedLessons * 5;
        return estimatedMinutes < 60 ? `${estimatedMinutes} min` : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}min`;
      }
      
      if (totalMinutes < 60) {
        return `${totalMinutes} min`;
      } else {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
      }
    }
    
    // Fallback: estimate 5 minutes per lesson if no timestamps
    const estimatedMinutes = completedLessons * 5;
    if (estimatedMinutes < 60) {
      return `~${estimatedMinutes} min`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const mins = estimatedMinutes % 60;
      return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
    }
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

  // Fetch learning goals
  const fetchGoals = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  // Auto-complete goals when linked course reaches 100%
  const checkAndAutoCompleteGoals = async () => {
    if (!goals || goals.length === 0) return;

    let hasChanges = false;
    const updatedGoals = [...goals];

    for (let i = 0; i < updatedGoals.length; i++) {
      const goal = updatedGoals[i];
      // Only check goals that are not already completed
      if (goal.status !== 'completed') {
        let shouldComplete = false;
        
        // Check if linked course is 100% complete
        if (goal.courseId && allCoursesData?.courses) {
          const courseCompletion = getCourseCompletion(goal.courseId);
          if (courseCompletion === 100) {
            shouldComplete = true;
          }
        }
        
        // Check if manual progress is 100%
        if (!goal.courseId && goal.progress === 100) {
          shouldComplete = true;
        }
        
        if (shouldComplete) {
          // Auto-complete the goal
          try {
            const response = await fetch(`http://127.0.0.1:8001/api/goals/${i}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...goal,
                status: 'completed'
              })
            });
            if (response.ok) {
              hasChanges = true;
            }
          } catch (err) {
            console.error('Error auto-completing goal:', err);
          }
        }
      }
    }

    if (hasChanges) {
      await fetchGoals();
    }
  };

  // Add new goal
  const handleAddGoal = async () => {
    if (!newGoalText.trim()) return;
    try {
      const response = await fetch('http://127.0.0.1:8001/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalText: newGoalText,
          targetDate: newGoalTarget || null,
          courseId: newGoalCourseId || null,
          totalHours: newGoalHours ? parseFloat(newGoalHours) : null,
          progress: (newGoalCourseId && newGoalCourseId !== '') ? null : newGoalProgress
        })
      });
      if (!response.ok) throw new Error('Failed to add goal');
      
      console.log('Goal added successfully with progress:', newGoalProgress);
      
      setNewGoalText('');
      setNewGoalTarget('');
      setNewGoalCourseId('');
      setNewGoalHours('');
      setNewGoalProgress(0);
      setOpenGoalDialog(false);
      fetchGoals();
    } catch (err) {
      console.error('Error adding goal:', err);
    }
  };

  // Update goal status
  const handleToggleGoal = async (index, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'completed' : 'active';
      const response = await fetch(`http://127.0.0.1:8001/api/goals/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update goal');
      fetchGoals();
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  // Open edit dialog with current goal data
  const handleOpenEditDialog = (index, goal) => {
    setEditingGoalIndex(index);
    setEditGoalText(goal.goalText);
    setEditGoalTarget(goal.targetDate || '');
    setEditGoalCourseId(goal.courseId || '');
    setEditGoalHours(goal.totalHours || '');
    setEditGoalProgress(goal.progress || 0);
    setOpenEditDialog(true);
  };

  // Update goal
  const handleUpdateGoal = async () => {
    if (!editGoalText.trim()) return;
    try {
      // Determine if goal should be marked as completed (progress = 100%)
      const shouldComplete = !editGoalCourseId && editGoalProgress === 100;
      const goalStatus = shouldComplete ? 'completed' : 'active';
      
      const response = await fetch(`http://127.0.0.1:8001/api/goals/${editingGoalIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalText: editGoalText,
          targetDate: editGoalTarget || null,
          courseId: editGoalCourseId || null,
          totalHours: editGoalHours ? parseFloat(editGoalHours) : null,
          progress: (editGoalCourseId && editGoalCourseId !== '') ? null : editGoalProgress,
          status: goalStatus
        })
      });
      if (!response.ok) throw new Error('Failed to update goal');
      
      console.log('Goal updated successfully with progress:', editGoalProgress, 'status:', goalStatus);
      
      setOpenEditDialog(false);
      setEditingGoalIndex(null);
      setEditGoalText('');
      setEditGoalTarget('');
      setEditGoalCourseId('');
      setEditGoalHours('');
      setEditGoalProgress(0);
      fetchGoals();
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (index) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/goals/${index}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete goal');
      fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchTodayProgress(),
        fetchAllCourses(selectedPeriod),
        fetchStats(selectedPeriod),
        fetchGoals()
      ]);
      setLoading(false);
    };

    loadData();
    
    // Auto-refresh disabled
  }, [selectedPeriod]);

  // Auto-complete goals when course data is loaded
  useEffect(() => {
    if (allCoursesData && goals.length > 0) {
      checkAndAutoCompleteGoals();
    }
  }, [allCoursesData, goals.length]);

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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title="Refresh learning progress data">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                setLoading(true);
                await Promise.all([
                  fetchTodayProgress(),
                  fetchAllCourses(selectedPeriod),
                  fetchStats(selectedPeriod),
                  fetchGoals()
                ]);
                setLoading(false);
              }}
              disabled={loading}
              sx={{ minWidth: '120px' }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Tooltip>
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
        {/* Learning Goals Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FlagIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Learning Goals</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenGoalDialog(true)}
            size="small"
          >
            Add Goal
          </Button>
        </Box>

        <Tabs 
          value={goalsTab} 
          onChange={(e, newValue) => {
            setGoalsTab(newValue);
            setGoalsPage(1);
          }} 
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`In Progress (${goals.filter(g => g.status !== 'completed').length})`} />
          <Tab label={`Completed (${goals.filter(g => g.status === 'completed').length})`} />
        </Tabs>

        {goals && goals.length > 0 ? (
          <>
          <List>
            {goals
              .filter(goal => goalsTab === 0 ? goal.status !== 'completed' : goal.status === 'completed')
              .slice((goalsPage - 1) * itemsPerPage, goalsPage * itemsPerPage)
              .map((goal, index) => {
                const actualIndex = goals.findIndex(g => g === goal);
                return (
              <ListItem
                key={actualIndex}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: goal.status === 'completed' ? 'success.light' : 'background.paper',
                  opacity: goal.status === 'completed' ? 0.7 : 1
                }}
              >
                <ListItemText
                  primary={goal.goalText}
                  secondary={
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 1 }}>
                        {goal.targetDate && (
                          <Chip
                            label={`Target: ${new Date(goal.targetDate).toLocaleDateString()}`}
                            size="small"
                            variant="outlined"
                            icon={<CalendarIcon />}
                          />
                        )}
                        {goal.totalHours && (
                          <Chip
                            label={`${goal.totalHours} hours`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                        <Chip
                          label={`Added: ${new Date(goal.createdAt).toLocaleDateString()}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      {goal.totalHours && goal.targetDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          <strong>Average:</strong> {getAverageHoursPerDay(goal.totalHours, goal.targetDate, goal.createdAt)} hours/day
                        </Typography>
                      )}
                      {goal.courseId && getTodayTimeSpent(goal.courseId) && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>
                          <strong>Today:</strong> {getTodayTimeSpent(goal.courseId)} ({todayData?.courses?.find(c => c.courseId === goal.courseId)?.stats?.completedLessons || 0} lessons completed)
                        </Typography>
                      )}
                      {goal.courseId && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            <strong>Course:</strong> {getCourseName(goal.courseId) || goal.courseId}
                          </Typography>
                          {getCourseCompletion(goal.courseId) !== null && (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ minWidth: 40 }}>
                                  {getCourseCompletion(goal.courseId)}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={getCourseCompletion(goal.courseId)}
                                  color={getProgressColor(getCourseCompletion(goal.courseId))}
                                  sx={{ flex: 1, height: 6, borderRadius: 1 }}
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                      {!goal.courseId && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            <strong>Progress:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ minWidth: 40 }}>
                              {goal.progress || 0}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={goal.progress || 0}
                              color={getProgressColor(goal.progress || 0)}
                              sx={{ flex: 1, height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  }
                  sx={{
                    textDecoration: goal.status === 'completed' ? 'line-through' : 'none'
                  }}
                />
                {goal.status !== 'completed' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleOpenEditDialog(actualIndex, goal)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteGoal(actualIndex)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </ListItem>
                );
              })}
          </List>
          
          {goals.filter(goal => goalsTab === 0 ? goal.status !== 'completed' : goal.status === 'completed').length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={Math.ceil(goals.filter(goal => goalsTab === 0 ? goal.status !== 'completed' : goal.status === 'completed').length / itemsPerPage)}
                page={goalsPage}
                onChange={(e, page) => setGoalsPage(page)}
                color="primary"
              />
            </Box>
          )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FlagIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No learning goals set yet. Click "Add Goal" to create your first goal!
            </Typography>
          </Box>
        )}
      </Paper>
        </Grid>

      {/* Goal Dialog */}
      <Dialog open={openGoalDialog} onClose={() => setOpenGoalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Learning Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Goal Description"
            fullWidth
            multiline
            rows={3}
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="E.g., Complete Advanced JavaScript course by end of month"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Link to Course (Optional)</InputLabel>
            <Select
              value={newGoalCourseId}
              label="Link to Course (Optional)"
              onChange={(e) => setNewGoalCourseId(e.target.value)}
            >
              <MenuItem value="">
                <em>No course selected</em>
              </MenuItem>
              {allCoursesData?.courses?.map((course) => (
                <MenuItem key={course.courseId} value={course.courseId}>
                  {course.courseName} ({course.stats.percentComplete}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Total Hours (Optional)"
            type="number"
            fullWidth
            value={newGoalHours}
            onChange={(e) => setNewGoalHours(e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 0.5 } }}
            sx={{ mb: 2 }}
          />
          {!newGoalCourseId && (
            <Box sx={{ mb: 2, px: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Progress (%)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={newGoalProgress}
                  onChange={(e, value) => setNewGoalProgress(value)}
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 45 }}>
                  {newGoalProgress}%
                </Typography>
              </Box>
            </Box>
          )}
          <TextField
            margin="dense"
            label="Target Date (Optional)"
            type="date"
            fullWidth
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGoalDialog(false)}>Cancel</Button>
          <Button onClick={handleAddGoal} variant="contained" disabled={!newGoalText.trim()}>
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Learning Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Goal Description"
            fullWidth
            multiline
            rows={3}
            value={editGoalText}
            onChange={(e) => setEditGoalText(e.target.value)}
            placeholder="E.g., Complete Advanced JavaScript course by end of month"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Link to Course (Optional)</InputLabel>
            <Select
              value={editGoalCourseId}
              label="Link to Course (Optional)"
              onChange={(e) => setEditGoalCourseId(e.target.value)}
            >
              <MenuItem value="">
                <em>No course selected</em>
              </MenuItem>
              {allCoursesData?.courses?.map((course) => (
                <MenuItem key={course.courseId} value={course.courseId}>
                  {course.courseName} ({course.stats.percentComplete}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Total Hours (Optional)"
            type="number"
            fullWidth
            value={editGoalHours}
            onChange={(e) => setEditGoalHours(e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 0.5 } }}
            sx={{ mb: 2 }}
          />
          {!editGoalCourseId && (
            <Box sx={{ mb: 2, px: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Progress (%)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={editGoalProgress}
                  onChange={(e, value) => setEditGoalProgress(value)}
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 45 }}>
                  {editGoalProgress}%
                </Typography>
              </Box>
            </Box>
          )}
          <TextField
            margin="dense"
            label="Target Date (Optional)"
            type="date"
            fullWidth
            value={editGoalTarget}
            onChange={(e) => setEditGoalTarget(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateGoal} variant="contained" disabled={!editGoalText.trim()}>
            Update Goal
          </Button>
        </DialogActions>
      </Dialog>

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
                {stats.topCourses.slice(0, 5).map((course, index) => (
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
                    {index < stats.topCourses.slice(0, 5).length - 1 && <Divider />}
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
            <Typography variant="h5" sx={{ mb: 2 }}>
              All Courses ({allCoursesData.period || getPeriodText(selectedPeriod)})
            </Typography>
            
            <Tabs 
              value={coursesTab} 
              onChange={(e, newValue) => {
                setCoursesTab(newValue);
                setCoursesPage(1);
              }} 
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label={`In Progress (${allCoursesData.courses.filter(c => c.stats.percentComplete < 100).length})`} />
              <Tab label={`Completed (${allCoursesData.courses.filter(c => c.stats.percentComplete === 100).length})`} />
            </Tabs>
            
            <Grid container spacing={2}>
              {allCoursesData.courses
                .filter(course => coursesTab === 0 ? course.stats.percentComplete < 100 : course.stats.percentComplete === 100)
                .slice((coursesPage - 1) * itemsPerPage, coursesPage * itemsPerPage)
                .map((course) => (
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
            
            {allCoursesData.courses.filter(course => coursesTab === 0 ? course.stats.percentComplete < 100 : course.stats.percentComplete === 100).length > itemsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination 
                  count={Math.ceil(allCoursesData.courses.filter(course => coursesTab === 0 ? course.stats.percentComplete < 100 : course.stats.percentComplete === 100).length / itemsPerPage)}
                  page={coursesPage}
                  onChange={(e, page) => setCoursesPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LearningProgress;