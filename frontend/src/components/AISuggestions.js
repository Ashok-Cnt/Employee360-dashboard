import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Collapse,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Lightbulb,
  TrendingUp,
  Schedule,
  FitnessCenter,
  Coffee,
  Work,
  VideoCall,
  Star,
  ExpandMore,
  ExpandLess,
  Psychology,
  CheckCircle,
  Refresh,
  AutoAwesome,
  Memory,
} from '@mui/icons-material';

const AISuggestions = ({ activityData, focusedWindow, leaveDaysData, coursesData, batteryInfo, memoryUsage, productivityScore }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [aiProvider, setAiProvider] = useState('unknown');
  const [aiModel, setAiModel] = useState('');
  const isGeneratingRef = useRef(false);
  const isMountedRef = useRef(true);
  const dataReadyRef = useRef(false);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Only generate suggestions once when component mounts and we have complete data
    // Wait for activity data AND leave/courses data to be available
    const hasCompleteData = activityData && 
      (leaveDaysData !== undefined) && 
      (coursesData !== undefined);
    
    // Only generate if we have complete data, haven't loaded yet, and haven't marked data as ready
    if (hasCompleteData && !hasLoaded && !isGeneratingRef.current && !dataReadyRef.current) {
      console.log('✅ All data loaded, generating AI suggestions...', {
        hasActivityData: !!activityData,
        leaveDaysCount: leaveDaysData?.length,
        coursesCount: coursesData?.length,
        hasBattery: !!batteryInfo,
        memoryUsage: memoryUsage
      });
      dataReadyRef.current = true; // Mark that we've detected data is ready
      generateAISuggestions();
    }
    
    // Cleanup: mark as unmounted
    return () => {
      isMountedRef.current = false;
      isGeneratingRef.current = false;
    };
  }, [activityData, leaveDaysData, coursesData, batteryInfo, memoryUsage, hasLoaded]);

  const generateAISuggestions = async () => {
    // Prevent duplicate requests
    if (isGeneratingRef.current) {
      console.log('⏳ Already generating suggestions, skipping...');
      return;
    }

    isGeneratingRef.current = true;
    setLoading(true);
    setError(null);
    
    console.log('🚀 Starting AI suggestions generation...');
    
    try {
      // Calculate metrics from activityData
      const totalActiveMinutes = activityData?.system?.aggregates?.overallMonitoringHours 
        ? activityData.system.aggregates.overallMonitoringHours * 60 
        : 120; // default
      
      const productiveMinutes = activityData?.system?.aggregates?.productiveHours 
        ? activityData.system.aggregates.productiveHours * 60 
        : 0;
      
      const communicationMinutes = activityData?.system?.aggregates?.communicationHours 
        ? activityData.system.aggregates.communicationHours * 60 
        : 0;
      
      const idleMinutes = activityData?.system?.aggregates?.idleHours 
        ? activityData.system.aggregates.idleHours * 60 
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
      
      // Create work patterns structure
      const workPatterns = {
        metrics: {
          total_active_time_minutes: totalActiveMinutes,
          focus_time_percentage: focusTimePercentage,
          meeting_time_percentage: meetingTimePercentage,
          break_time_percentage: breakTimePercentage,
          productivity_score: productivityScore,
        },
        work_patterns: [],
      };
      
      const appStats = {
        unique_applications: activityData?.apps?.filter(a => a.name !== 'background_apps').length || 0,
      };
      
      const currentApps = activityData?.apps?.filter(a => a.name !== 'background_apps').map(a => a.name) || [];
      
      // Process leave days data
      const leaveDays = {
        totalDays: leaveDaysData?.length || 0,
        recentLeaves: leaveDaysData?.slice(0, 3).map(l => ({
          date: l.date,
          dayOfWeek: l.dayOfWeek,
          runningHours: l.runningHours
        })) || []
      };
      
      // Process courses data
      const courses = {
        totalCourses: coursesData?.find(c => c.isSummary)?.totalCount || coursesData?.length || 0,
        completedCourses: coursesData?.find(c => c.isSummary)?.completedCount || coursesData?.filter(c => c.isCompleted).length || 0,
        recentCourses: coursesData?.filter(c => !c.isSummary).slice(0, 3).map(c => ({
          title: c.course_title,
          provider: c.provider,
          progress: c.progress,
          isCompleted: c.isCompleted
        })) || [],
        daysWithLearning: coursesData?.find(c => c.isSummary)?.daysWithLearning || 0
      };
      
      // Battery information
      const battery = batteryInfo ? {
        percent: batteryInfo.percent,
        isCharging: batteryInfo.isCharging,
        status: batteryInfo.isCharging ? 'charging' : (batteryInfo.percent < 20 ? 'low' : 'normal')
      } : null;
      
      // Memory usage information
      const memory = {
        totalUsageMB: memoryUsage || 0,
        totalUsageGB: memoryUsage ? (memoryUsage / 1024).toFixed(2) : 0
      };
      
      console.log('📤 Sending request to backend with calculated metrics:', {
        totalActiveMinutes,
        focusTimePercentage,
        meetingTimePercentage,
        breakTimePercentage,
        productivityScore,
        uniqueApps: appStats.unique_applications,
        leaveDays: leaveDays.totalDays,
        courses: courses.completedCourses,
        battery: battery?.status,
        memoryGB: memory.totalUsageGB
      });
      
      console.log('📦 Full data being sent:', {
        leaveDays,
        courses,
        battery,
        memory,
        productivityScore: productivityScore || 0
      });
      
      const response = await fetch('/api/ai-suggestions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workPatterns,
          appStats,
          focusedWindow,
          currentApps,
          leaveDays,
          courses,
          battery,
          memory,
          productivityScore: productivityScore || 0
        }),
      });

      console.log('📥 Response received, status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Data parsed:', { success: data.success, suggestionCount: data.suggestions?.length });
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, skipping state updates');
        return;
      }
      
      if (data.success) {
        setIsAIGenerated(true);
        setAiProvider(data.metadata?.provider || 'unknown');
        setAiModel(data.metadata?.model || '');
        const filteredSuggestions = data.suggestions.filter(
          s => !dismissedSuggestions.has(s.id)
        );
        setSuggestions(filteredSuggestions);
        setHasLoaded(true);
        
        // Log success with source info
        const providerName = data.metadata?.provider === 'ollama' 
          ? `🦙 Ollama (${data.metadata?.model})` 
          : '� OpenAI GPT-4o-mini';
        console.log('✨ AI Suggestions Loaded:', {
          source: providerName,
          count: filteredSuggestions.length,
          timestamp: new Date().toLocaleTimeString(),
          message: 'Using real AI-powered suggestions!'
        });
      } else {
        // Use fallback suggestions
        setIsAIGenerated(false);
        setSuggestions(data.suggestions || []);
        setHasLoaded(true);
        if (data.error) {
          console.warn('⚠️ AI Suggestions Source:', {
            source: '📋 Rule-based fallback',
            reason: data.error,
            count: (data.suggestions || []).length,
            timestamp: new Date().toLocaleTimeString(),
            message: 'Install Ollama or configure OPENAI_API_KEY in backend .env to use AI'
          });
        }
      }
      
      console.log('✅ Request complete, setting loading to false...');
    } catch (err) {
      console.error('❌ Error generating AI suggestions:', err);
      if (isMountedRef.current) {
        setError('Failed to generate suggestions. Please try again.');
        setIsAIGenerated(false);
        setHasLoaded(true);  // Mark as loaded even on error
      }
    } finally {
      console.log('🏁 Finally block: Clearing loading state...');
      if (isMountedRef.current) {
        setLoading(false);
      }
      isGeneratingRef.current = false;
    }
  };

  const handleDismiss = (suggestionId) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handleRefresh = () => {
    // Reset the loaded flag and data ready flag to allow re-fetching
    setHasLoaded(false);
    dataReadyRef.current = false;
    generateAISuggestions();
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      Work: <Work />,
      FitnessCenter: <FitnessCenter />,
      Schedule: <Schedule />,
      Coffee: <Coffee />,
      VideoCall: <VideoCall />,
      Star: <Star />,
      Psychology: <Psychology />,
      TrendingUp: <TrendingUp />,
      Lightbulb: <Lightbulb />,
      Memory: <Memory />,
    };
    return iconMap[iconName] || <Lightbulb />;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            AI is analyzing your work patterns...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error" action={
          <Button size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Lightbulb sx={{ mr: 1, color: '#ffd700' }} />
          <Typography variant="h6">AI Suggestions</Typography>
        </Box>
        <Alert severity="success" icon={<CheckCircle />}>
          Great job! You're working efficiently. Keep up the good work! 🎉
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Box 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={handleExpand}
        >
          <AutoAwesome sx={{ mr: 1, color: '#ffd700' }} />
          <Typography variant="h6">
            {isAIGenerated ? 'AI-Powered Suggestions' : 'Productivity Suggestions'}
          </Typography>
          <Chip 
            label={suggestions.length} 
            size="small" 
            color="primary" 
            sx={{ ml: 1 }} 
          />
          {isAIGenerated && (
            <Tooltip title="Generated by OpenAI GPT-4">
              <Chip 
                label="AI" 
                size="small" 
                color="success"
                icon={<AutoAwesome />}
                sx={{ ml: 1 }} 
              />
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh suggestions">
            <Button 
              size="small" 
              onClick={handleRefresh}
              startIcon={<Refresh />}
              disabled={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          {expanded ? <ExpandLess onClick={handleExpand} sx={{ cursor: 'pointer' }} /> : <ExpandMore onClick={handleExpand} sx={{ cursor: 'pointer' }} />}
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isAIGenerated 
          ? 'Personalized recommendations powered by AI based on your work patterns'
          : 'Smart recommendations based on your work patterns'}
      </Typography>

      <Collapse in={expanded}>
        <List sx={{ width: '100%' }}>
          {suggestions.map((suggestion, index) => (
            <React.Fragment key={suggestion.id}>
              {index > 0 && <Divider />}
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  flexDirection: 'column',
                  bgcolor: `${suggestion.color}08`,
                  borderLeft: `4px solid ${suggestion.color}`,
                  mb: 1,
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <ListItemIcon sx={{ color: suggestion.color, minWidth: 40 }}>
                    {typeof suggestion.icon === 'string' ? getIconComponent(suggestion.icon) : suggestion.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {suggestion.title}
                        </Typography>
                        <Chip 
                          label={suggestion.priority.toUpperCase()} 
                          size="small"
                          color={
                            suggestion.priority === 'high' ? 'error' :
                            suggestion.priority === 'medium' ? 'warning' : 'default'
                          }
                          sx={{ height: 20 }}
                        />
                        <Chip 
                          label={suggestion.category} 
                          size="small"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {suggestion.description}
                      </Typography>
                    }
                  />
                </Box>
                
                {suggestion.actionItems && suggestion.actionItems.length > 0 && (
                  <Box sx={{ ml: 5, width: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      💡 Action Items:
                    </Typography>
                    <List dense sx={{ pl: 2 }}>
                      {suggestion.actionItems.map((item, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                          <Typography variant="body2" color="text.secondary">
                            • {item}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Box sx={{ mt: 1, ml: 5 }}>
                  <Button 
                    size="small" 
                    onClick={() => handleDismiss(suggestion.id)}
                    sx={{ textTransform: 'none' }}
                  >
                    Dismiss
                  </Button>
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Collapse>
      
      {/* Source Indicator Footer */}
      <Box 
        sx={{ 
          mt: 2, 
          pt: 1.5, 
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}
      >
        {isAIGenerated ? (
          <>
            <AutoAwesome sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="success.main" fontWeight="bold">
              {aiProvider === 'ollama' 
                ? `Powered by Ollama (${aiModel})` 
                : `Powered by OpenAI (${aiModel})`}
            </Typography>
          </>
        ) : (
          <>
            <Psychology sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Using rule-based suggestions
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              • Install Ollama or configure OpenAI API key for AI-powered suggestions
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default AISuggestions;
