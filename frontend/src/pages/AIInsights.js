import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Skeleton,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Speed,
  Timeline,
  Assessment,
  AutoAwesome,
  Refresh,
  Schedule,
  Work,
  FitnessCenter,
  Psychology,
} from '@mui/icons-material';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const AIInsights = () => {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activity/today');
      const data = await response.json();
      setActivityData(data);
      await generateAIInsights(data);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async (data) => {
    try {
      setGeneratingInsights(true);
      
      // Calculate metrics for local display and backend
      const totalActiveMinutes = data?.system?.aggregates?.overallMonitoringHours 
        ? data.system.aggregates.overallMonitoringHours * 60 
        : 0;
      
      const productiveMinutes = data?.system?.aggregates?.productiveHours 
        ? data.system.aggregates.productiveHours * 60 
        : 0;
      
      const communicationMinutes = data?.system?.aggregates?.communicationHours 
        ? data.system.aggregates.communicationHours * 60 
        : 0;
      
      const idleMinutes = data?.system?.aggregates?.idleHours 
        ? data.system.aggregates.idleHours * 60 
        : 0;
      
      const focusTimePercentage = totalActiveMinutes > 0 
        ? Math.round((productiveMinutes / totalActiveMinutes) * 100) 
        : 0;
      
      const meetingTimePercentage = totalActiveMinutes > 0 
        ? Math.round((communicationMinutes / totalActiveMinutes) * 100) 
        : 0;
      
      const breakTimePercentage = totalActiveMinutes > 0 
        ? Math.round((idleMinutes / totalActiveMinutes) * 100) 
        : 0;
      
      const productivityScore = Math.min(100, Math.round(
        (focusTimePercentage * 0.6) + (meetingTimePercentage * 0.2) + (breakTimePercentage * 0.2)
      ));

      // Get top apps
      const topApps = data?.apps
        ?.filter(app => app.name !== 'background_apps')
        ?.sort((a, b) => (b.focusDurationSec || 0) - (a.focusDurationSec || 0))
        ?.slice(0, 5)
        ?.map(app => ({
          name: app.name,
          category: app.category || 'Uncategorized',
          duration: Math.round((app.focusDurationSec || 0) / 60),
        })) || [];

      // Prepare data for OpenAI backend
      const requestData = {
        metrics: {
          totalActiveMinutes,
          productiveMinutes,
          communicationMinutes,
          idleMinutes,
          productivityScore,
          focusTimePercentage,
          meetingTimePercentage,
          breakTimePercentage,
        },
        topApps,
        hourlySummary: data?.hourlySummary || [],
      };

      // Call backend AI endpoint
      const response = await fetch('/api/ai-insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const aiResponse = await response.json();

      // Merge OpenAI insights with local calculations and trends
      const generatedInsights = {
        productivityScore,
        focusTimePercentage,
        meetingTimePercentage,
        breakTimePercentage,
        totalActiveMinutes,
        productiveMinutes,
        topApps,
        trends: analyzeTrends(data),
        
        // OpenAI-generated content
        dailySummary: aiResponse.dailySummary,
        strengths: aiResponse.strengths || [],
        areasForImprovement: aiResponse.areasForImprovement || [],
        keyInsights: aiResponse.keyInsights || [],
        predictions: aiResponse.predictions,
        motivationalMessage: aiResponse.motivationalMessage,
        
        // Keep local recommendations and achievements as fallback
        recommendations: generateRecommendations({
          focusTimePercentage,
          meetingTimePercentage,
          breakTimePercentage,
          productivityScore,
          totalActiveMinutes,
        }),
        achievements: generateAchievements({
          focusTimePercentage,
          productivityScore,
          totalActiveMinutes,
        }),
      };

      setInsights(generatedInsights);
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError('Failed to generate AI insights. Using local analysis.');
      
      // Fallback to local insights if API fails
      const totalActiveMinutes = data?.system?.aggregates?.overallMonitoringHours 
        ? data.system.aggregates.overallMonitoringHours * 60 
        : 0;
      
      const productiveMinutes = data?.system?.aggregates?.productiveHours 
        ? data.system.aggregates.productiveHours * 60 
        : 0;
      
      const communicationMinutes = data?.system?.aggregates?.communicationHours 
        ? data.system.aggregates.communicationHours * 60 
        : 0;
      
      const idleMinutes = data?.system?.aggregates?.idleHours 
        ? data.system.aggregates.idleHours * 60 
        : 0;
      
      const focusTimePercentage = totalActiveMinutes > 0 
        ? Math.round((productiveMinutes / totalActiveMinutes) * 100) 
        : 0;
      
      const meetingTimePercentage = totalActiveMinutes > 0 
        ? Math.round((communicationMinutes / totalActiveMinutes) * 100) 
        : 0;
      
      const breakTimePercentage = totalActiveMinutes > 0 
        ? Math.round((idleMinutes / totalActiveMinutes) * 100) 
        : 0;
      
      const productivityScore = Math.min(100, Math.round(
        (focusTimePercentage * 0.6) + (meetingTimePercentage * 0.2) + (breakTimePercentage * 0.2)
      ));

      const topApps = data?.apps
        ?.filter(app => app.name !== 'background_apps')
        ?.sort((a, b) => (b.focusDurationSec || 0) - (a.focusDurationSec || 0))
        ?.slice(0, 5) || [];

      setInsights({
        productivityScore,
        focusTimePercentage,
        meetingTimePercentage,
        breakTimePercentage,
        totalActiveMinutes,
        productiveMinutes,
        topApps,
        trends: analyzeTrends(data),
        recommendations: generateRecommendations({
          focusTimePercentage,
          meetingTimePercentage,
          breakTimePercentage,
          productivityScore,
          totalActiveMinutes,
        }),
        achievements: generateAchievements({
          focusTimePercentage,
          productivityScore,
          totalActiveMinutes,
        }),
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const analyzeTrends = (data) => {
    const hourlySummary = data?.hourlySummary || [];
    
    return {
      peakProductivityHours: hourlySummary
        .filter(h => h.focusSec > 0)
        .sort((a, b) => b.focusSec - a.focusSec)
        .slice(0, 3)
        .map(h => `${h.hour}:00`),
      totalSessions: hourlySummary.length,
      averageFocusTime: hourlySummary.reduce((acc, h) => acc + (h.focusSec || 0), 0) / Math.max(hourlySummary.length, 1) / 60,
    };
  };

  const generateRecommendations = (metrics) => {
    const recommendations = [];

    if (metrics.focusTimePercentage < 40) {
      recommendations.push({
        id: 1,
        title: 'Increase Deep Focus Time',
        description: `Your focus time is at ${metrics.focusTimePercentage}%. Try blocking 2-hour focus sessions.`,
        priority: 'high',
        icon: <Work />,
        color: '#f44336',
      });
    }

    if (metrics.breakTimePercentage < 10 && metrics.totalActiveMinutes > 120) {
      recommendations.push({
        id: 2,
        title: 'Take Regular Breaks',
        description: 'Schedule short breaks every hour to maintain energy and focus.',
        priority: 'high',
        icon: <FitnessCenter />,
        color: '#ff9800',
      });
    }

    if (metrics.meetingTimePercentage > 40) {
      recommendations.push({
        id: 3,
        title: 'Optimize Meeting Time',
        description: 'Consider consolidating or shortening meetings to increase focus time.',
        priority: 'medium',
        icon: <Schedule />,
        color: '#2196f3',
      });
    }

    if (metrics.productivityScore >= 75) {
      recommendations.push({
        id: 4,
        title: 'Excellent Work Pattern!',
        description: 'Your productivity is high. Keep maintaining this healthy balance.',
        priority: 'low',
        icon: <AutoAwesome />,
        color: '#4caf50',
      });
    }

    return recommendations;
  };

  const generateAchievements = (metrics) => {
    const achievements = [];

    if (metrics.productivityScore >= 80) {
      achievements.push({
        title: '🏆 High Performer',
        description: 'Achieved 80%+ productivity score today',
      });
    }

    if (metrics.focusTimePercentage >= 50) {
      achievements.push({
        title: '🎯 Focus Master',
        description: 'Maintained 50%+ focus time',
      });
    }

    if (metrics.totalActiveMinutes >= 240) {
      achievements.push({
        title: '⏰ Dedication Champion',
        description: '4+ hours of active work time',
      });
    }

    return achievements;
  };

  const getProductivityTrendData = () => {
    if (!activityData?.hourlySummary) return null;

    const hours = activityData.hourlySummary.map(h => `${h.hour}:00`);
    const focusData = activityData.hourlySummary.map(h => (h.focusSec || 0) / 60);
    const idleData = activityData.hourlySummary.map(h => (h.idleSec || 0) / 60);

    return {
      labels: hours,
      datasets: [
        {
          label: 'Focus Time (min)',
          data: focusData,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Idle Time (min)',
          data: idleData,
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getPerformanceRadarData = () => {
    if (!insights) return null;

    return {
      labels: ['Focus', 'Collaboration', 'Balance', 'Consistency', 'Efficiency'],
      datasets: [
        {
          label: 'Your Performance',
          data: [
            insights.focusTimePercentage,
            insights.meetingTimePercentage,
            insights.breakTimePercentage * 2,
            Math.min(100, insights.totalActiveMinutes / 4),
            insights.productivityScore,
          ],
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          borderColor: '#2196f3',
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          AI-Powered Performance Insights
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          AI-Powered Performance Insights
        </Typography>
        <Tooltip title="Refresh Insights">
          <IconButton onClick={fetchActivityData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {generatingInsights && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            Generating AI insights from your activity data...
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Productivity Score Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ mr: 1, color: '#2196f3' }} />
                <Typography variant="h6">Productivity Score</Typography>
              </Box>
              <Typography variant="h3" color="primary" gutterBottom>
                {insights?.productivityScore || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={insights?.productivityScore || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {insights?.productivityScore >= 75 ? 'Excellent performance!' : 
                 insights?.productivityScore >= 50 ? 'Good progress' : 
                 'Room for improvement'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Time Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Psychology sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6">Focus Time</Typography>
              </Box>
              <Typography variant="h3" color="success.main" gutterBottom>
                {insights?.focusTimePercentage || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={insights?.focusTimePercentage || 0} 
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {Math.round(insights?.productiveMinutes || 0)} minutes of focused work
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Time Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6">Active Time</Typography>
              </Box>
              <Typography variant="h3" color="warning.main" gutterBottom>
                {Math.round((insights?.totalActiveMinutes || 0) / 60 * 10) / 10}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total active time monitored today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Meetings Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6">Collaboration</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#9c27b0' }} gutterBottom>
                {insights?.meetingTimePercentage || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time spent in meetings and communication
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        {insights?.achievements && insights.achievements.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesome sx={{ mr: 1, color: '#ffd700' }} />
                <Typography variant="h6">Today's Achievements</Typography>
              </Box>
              <List>
                {insights.achievements.map((achievement, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={achievement.title}
                        secondary={achievement.description}
                      />
                    </ListItem>
                    {index < insights.achievements.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* OpenAI Daily Summary */}
        {insights?.dailySummary && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Psychology sx={{ mr: 1, color: '#fff' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>AI-Powered Daily Summary</Typography>
              </Box>
              <Typography variant="body1" sx={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1.8 }}>
                {insights.dailySummary}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* OpenAI Strengths */}
        {insights?.strengths && insights.strengths.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderLeft: '4px solid #4caf50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6">Your Strengths Today</Typography>
              </Box>
              <List>
                {insights.strengths.map((strength, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={strength}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    {index < insights.strengths.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* OpenAI Areas for Improvement */}
        {insights?.areasForImprovement && insights.areasForImprovement.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderLeft: '4px solid #ff9800' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6">Areas for Improvement</Typography>
              </Box>
              <List>
                {insights.areasForImprovement.map((area, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={area}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    {index < insights.areasForImprovement.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* OpenAI Key Insights */}
        {insights?.keyInsights && insights.keyInsights.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: '#2196f3' }} />
                <Typography variant="h6">Key Insights from AI Analysis</Typography>
              </Box>
              <Grid container spacing={2}>
                {insights.keyInsights.map((insight, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Chip 
                          label={insight.type} 
                          size="small" 
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {insight.insight}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* OpenAI Motivational Message */}
        {insights?.motivationalMessage && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesome sx={{ mr: 1, color: '#fff' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>Motivation Boost</Typography>
              </Box>
              <Typography variant="body1" sx={{ color: '#fff', fontSize: '1.1rem', fontStyle: 'italic' }}>
                "{insights.motivationalMessage}"
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* AI Recommendations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Lightbulb sx={{ mr: 1, color: '#ff9800' }} />
              <Typography variant="h6">AI Recommendations</Typography>
            </Box>
            <List>
              {insights?.recommendations?.map((rec, index) => (
                <React.Fragment key={rec.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Box sx={{ color: rec.color }}>
                        {rec.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {rec.title}
                          <Chip 
                            label={rec.priority} 
                            size="small" 
                            color={
                              rec.priority === 'high' ? 'error' : 
                              rec.priority === 'medium' ? 'warning' : 
                              'success'
                            }
                          />
                        </Box>
                      }
                      secondary={rec.description}
                    />
                  </ListItem>
                  {index < insights.recommendations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Productivity Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hourly Productivity Trend
            </Typography>
            {getProductivityTrendData() && (
              <Box sx={{ height: 300 }}>
                <Line 
                  data={getProductivityTrendData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Minutes',
                        },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Performance Radar */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Overview
            </Typography>
            {getPerformanceRadarData() && (
              <Box sx={{ height: 300 }}>
                <Radar 
                  data={getPerformanceRadarData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Applications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Most Used Applications Today
            </Typography>
            <Grid container spacing={2}>
              {insights?.topApps?.map((app, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" noWrap>
                        {app.name || app.title}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {Math.round((app.focusDurationSec || 0) / 60)}m
                      </Typography>
                      <Chip 
                        label={app.category} 
                        size="small" 
                        sx={{ mt: 1 }} 
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Peak Productivity Hours */}
        {insights?.trends?.peakProductivityHours && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Peak Productivity Hours
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {insights.trends.peakProductivityHours.map((hour, index) => (
                  <Chip 
                    key={index}
                    label={hour}
                    color="primary"
                    icon={<TrendingUp />}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                These are your most productive hours. Schedule important tasks during these times.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AIInsights;