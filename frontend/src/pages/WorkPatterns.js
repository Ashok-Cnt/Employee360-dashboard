import React, { useEffect, useState as useReactState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  Collapse,
  ListItemButton,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CardActionArea,
  Fade,
  Slide,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Badge,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AppsIcon from '@mui/icons-material/Apps';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const WorkPatterns = () => {
  // State management
  const [activityData, setActivityData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  // Date filter state
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [availableDates, setAvailableDates] = React.useState([]);
  const [dateFilterMode, setDateFilterMode] = React.useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedWeek, setSelectedWeek] = React.useState('');
  const [selectedMonth, setSelectedMonth] = React.useState('');
  const [weeklyData, setWeeklyData] = React.useState(null);
  const [monthlyData, setMonthlyData] = React.useState(null);
  const [workPatternDialogOpen, setWorkPatternDialogOpen] = React.useState(false);
  const [selectedWorkPatternCategory, setSelectedWorkPatternCategory] = React.useState(null);
  const [categoryFocusDialogOpen, setCategoryFocusDialogOpen] = React.useState(false);
  const [selectedCategoryFocusData, setSelectedCategoryFocusData] = React.useState(null);
  const [timeDistributionDialogOpen, setTimeDistributionDialogOpen] = React.useState(false);
  const [selectedTimeDistribution, setSelectedTimeDistribution] = React.useState(null);
  const [heatmapDialogOpen, setHeatmapDialogOpen] = React.useState(false);
  const [selectedHeatmapHour, setSelectedHeatmapHour] = React.useState(null);
  // New states for drill-down functionality
  const [projectDialogOpen, setProjectDialogOpen] = React.useState(false);
  const [selectedAppProjects, setSelectedAppProjects] = React.useState(null);
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [selectedProjectModules, setSelectedProjectModules] = React.useState(null);
  // Tree view state
  const [treeViewDialogOpen, setTreeViewDialogOpen] = React.useState(false);
  const [treeViewData, setTreeViewData] = React.useState(null);
  const [expandedApps, setExpandedApps] = React.useState({});
  const [expandedProjects, setExpandedProjects] = React.useState({});
  // Split view state
  const [splitViewDialogOpen, setSplitViewDialogOpen] = React.useState(false);
  const [splitViewData, setSplitViewData] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedItemType, setSelectedItemType] = React.useState(null); // 'app', 'project', or 'module'
  // Accordion view state
  const [accordionViewOpen, setAccordionViewOpen] = React.useState(false);
  const [accordionData, setAccordionData] = React.useState(null);
  const [expandedAccordionApp, setExpandedAccordionApp] = React.useState(null);
  const [expandedAccordionProject, setExpandedAccordionProject] = React.useState({});
  
  // Chatbot states
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);
  const chatEndRef = useRef(null);
  
  // Stepper view state
  const [stepperViewOpen, setStepperViewOpen] = React.useState(false);
  const [stepperData, setStepperData] = React.useState(null);
  const [activeStep, setActiveStep] = React.useState(0);
  const [selectedStepperApp, setSelectedStepperApp] = React.useState(null);
  const [selectedStepperProject, setSelectedStepperProject] = React.useState(null);
  const [selectedStepperModule, setSelectedStepperModule] = React.useState(null);
  // Card stack view state
  const [cardStackViewOpen, setCardStackViewOpen] = React.useState(false);
  const [cardStackData, setCardStackData] = React.useState(null);
  const [cardStackLevel, setCardStackLevel] = React.useState('apps'); // 'apps', 'projects', 'modules'
  const [selectedCardApp, setSelectedCardApp] = React.useState(null);
  const [selectedCardProject, setSelectedCardProject] = React.useState(null);
  const [navigationHistory, setNavigationHistory] = React.useState([]);
  // Timeline dialog state
  const [timelineDialogOpen, setTimelineDialogOpen] = React.useState(false);
  const [selectedModuleTimeline, setSelectedModuleTimeline] = React.useState(null);
  // Hybrid view preferences for Work Pattern chart
  const [viewStyle, setViewStyle] = React.useState('card-stack'); // 'breadcrumbs', 'tree', 'split', 'accordion', 'stepper', 'card-stack'
  const [hybridDialogOpen, setHybridDialogOpen] = React.useState(false);
  // Hybrid view preferences for Category Focus chart
  const [categoryViewStyle, setCategoryViewStyle] = React.useState('card-stack');
  const [categoryHybridDialogOpen, setCategoryHybridDialogOpen] = React.useState(false);
  // Hybrid view preferences for Time Distribution chart
  const [timeDistViewStyle, setTimeDistViewStyle] = React.useState('card-stack');
  const [timeDistHybridDialogOpen, setTimeDistHybridDialogOpen] = React.useState(false);
  // Hybrid view preferences for Heatmap
  const [heatmapViewStyle, setHeatmapViewStyle] = React.useState('card-stack');
  const [heatmapHybridDialogOpen, setHeatmapHybridDialogOpen] = React.useState(false);

  // Fetch application activity data
  // Helper function to get week range
  const getWeekRange = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
      label: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  };

  // Helper function to get month range
  const getMonthRange = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
      label: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  };

  // Generate week options from available dates
  const getWeekOptions = React.useMemo(() => {
    if (availableDates.length === 0) return [];
    
    const weeks = new Map();
    availableDates.forEach(date => {
      const week = getWeekRange(date);
      const key = `${week.start}_${week.end}`;
      if (!weeks.has(key)) {
        weeks.set(key, week);
      }
    });
    
    return Array.from(weeks.values()).sort((a, b) => b.start.localeCompare(a.start));
  }, [availableDates]);

  // Generate month options from available dates
  const getMonthOptions = React.useMemo(() => {
    if (availableDates.length === 0) return [];
    
    const months = new Map();
    availableDates.forEach(date => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!months.has(key)) {
        const range = getMonthRange(year, month);
        months.set(key, { key, ...range });
      }
    });
    
    return Array.from(months.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [availableDates]);

  // Fetch available dates on component mount
  React.useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch('/api/activity/available-dates');
        if (response.ok) {
          const data = await response.json();
          setAvailableDates(data.dates || []);
          
          // Set default week and month
          if (data.dates && data.dates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const currentWeek = getWeekRange(today);
            setSelectedWeek(`${currentWeek.start}_${currentWeek.end}`);
            
            const now = new Date();
            setSelectedMonth(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
          }
        }
      } catch (err) {
        console.error('Error fetching available dates:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchAvailableDates();
    fetchCategories();
  }, []);

  // Helper function to recategorize apps based on current category configuration
  const recategorizeApp = React.useCallback((appName) => {
    if (!categories || categories.length === 0) {
      console.warn('⚠️ Categories not loaded yet, returning Uncategorized for:', appName);
      return 'Uncategorized';
    }
    
    for (const category of categories) {
      if (category.applications && category.applications.includes(appName)) {
        return category.name;
      }
    }
    
    // Log when app is not categorized (first 3 only to avoid spam)
    if (Math.random() < 0.1) { // Log ~10% for sampling
      console.log(`❌ "${appName}" not found in any category`);
      console.log('   Categories:', categories.map(c => c.name));
      console.log('   Sample apps in first category:', categories[0]?.applications?.slice(0, 5));
    }
    
    return 'Uncategorized';
  }, [categories]);

  // Fetch and aggregate data for multiple days
  const fetchRangeData = React.useCallback(async (startDate, endDate) => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔄 fetchRangeData called:', { startDate, endDate });
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allData = [];
      
      // Fetch data for each day in range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const isToday = dateStr === today;
        
        const endpoint = isToday 
          ? '/api/activity/today' 
          : `/api/activity/daily-summary/${dateStr}`;
        
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            console.log(`📅 Fetched data for ${dateStr}:`, {
              appsCount: data.apps?.length || 0,
              hourlySummaryCount: data.hourlySummary?.length || 0,
              sampleApp: data.apps?.[0] ? {
                name: data.apps[0].name,
                hasHourlyStats: !!data.apps[0].hourlyStats,
                hourlyStatsLength: data.apps[0].hourlyStats?.length || 0
              } : null
            });
            allData.push({ date: dateStr, ...data });
          }
        } catch (err) {
          console.warn(`No data for ${dateStr}`);
        }
      }
      
      console.log(`📊 Total days fetched: ${allData.length}`);
      
      if (allData.length === 0) {
        setActivityData({ apps: [], system: {}, hourlySummary: [] });
        setError('No data available for this period');
        return;
      }
      
      console.log(`📂 Categories available for aggregation: ${categories?.length || 0}`);
      
      // Aggregate data
      const aggregated = aggregateMultipleDays(allData);
      
      console.log('📊 Sample aggregated app categories:', 
        aggregated.apps.slice(0, 5).map(app => `${app.name}: ${app.category}`).join(', ')
      );
      
      setActivityData(aggregated);
      
    } catch (err) {
      console.error('Error fetching range data:', err);
      setError(err.message);
      setActivityData({ apps: [], system: {}, hourlySummary: [] });
    } finally {
      setIsLoading(false);
    }
  }, [recategorizeApp]);

  // Aggregate data from multiple days
  const aggregateMultipleDays = React.useCallback((daysData) => {
    const aggregated = {
      timestamp: new Date().toISOString(),
      system: {
        cpuUsage: 0,
        memoryUsageMB: 0,
        batteryPercent: null,
        isCharging: null,
        uptimeSec: 0,
        idleTimeSec: 0,
        isIdle: false,
        aggregates: {
          overallMonitoringHours: 0,
          productiveHours: 0,
          communicationHours: 0,
          idleHours: 0,
          avgCPU: 0
        }
      },
      apps: [],
      hourlySummary: []
    };
    
    const appMap = new Map();
    const hourMap = new Map();
    let totalCPU = 0;
    let cpuCount = 0;
    
    // Aggregate system data
    daysData.forEach(dayData => {
      if (dayData.system?.aggregates) {
        aggregated.system.aggregates.overallMonitoringHours += dayData.system.aggregates.overallMonitoringHours || 0;
        aggregated.system.aggregates.productiveHours += dayData.system.aggregates.productiveHours || 0;
        aggregated.system.aggregates.communicationHours += dayData.system.aggregates.communicationHours || 0;
        aggregated.system.aggregates.idleHours += dayData.system.aggregates.idleHours || 0;
        
        if (dayData.system.aggregates.avgCPU) {
          totalCPU += dayData.system.aggregates.avgCPU;
          cpuCount++;
        }
      }
      
      // Aggregate apps
      if (dayData.apps) {
        dayData.apps.forEach(app => {
          const key = app.name || app.title;
          if (!appMap.has(key)) {
            // Try to categorize using title first (display name), then fallback to name (executable)
            const categoryByTitle = app.title ? recategorizeApp(app.title) : 'Uncategorized';
            const category = categoryByTitle !== 'Uncategorized' 
              ? categoryByTitle 
              : recategorizeApp(app.name || app.title);
            
            appMap.set(key, {
              name: app.name,
              title: app.title,
              category: category,
              focusDurationSec: 0,
              runningTimeSec: 0,
              aggregates: {
                totalRunHours: 0,
                totalFocusHours: 0,
                avgMemoryMB: 0,
                peakMemoryMB: 0
              },
              hourlyStats: [],
              hourlyStatsMap: new Map(), // Temporary map for aggregating hourly stats
              focusSwitches: []
            });
          }
          
          const existing = appMap.get(key);
          existing.focusDurationSec += app.focusDurationSec || 0;
          existing.runningTimeSec += app.runningTimeSec || 0;
          existing.aggregates.totalRunHours += app.aggregates?.totalRunHours || 0;
          existing.aggregates.totalFocusHours += app.aggregates?.totalFocusHours || 0;
          existing.aggregates.peakMemoryMB = Math.max(existing.aggregates.peakMemoryMB, app.aggregates?.peakMemoryMB || 0);
          
          // Aggregate hourly stats for this app
          if (app.hourlyStats && Array.isArray(app.hourlyStats)) {
            if (app.hourlyStats.length > 0 && appMap.size <= 3) {
              console.log(`  📊 App "${app.name}" has ${app.hourlyStats.length} hourly stats entries`);
            }
            app.hourlyStats.forEach(hourStat => {
              const hour = hourStat.hour;
              if (!existing.hourlyStatsMap.has(hour)) {
                existing.hourlyStatsMap.set(hour, {
                  hour: hour,
                  focusSeconds: 0,
                  runningSeconds: 0,
                  switches: 0,
                  count: 0
                });
              }
              const existingHour = existing.hourlyStatsMap.get(hour);
              existingHour.focusSeconds += hourStat.focusSeconds || 0;
              existingHour.runningSeconds += hourStat.runningSeconds || 0;
              existingHour.switches += hourStat.switches || 0;
              existingHour.count++;
            });
          } else if (appMap.size <= 3) {
            console.log(`  ⚠️ App "${app.name}" has NO hourlyStats or empty array`);
          }
          
          if (app.focusSwitches) {
            existing.focusSwitches.push(...app.focusSwitches);
          }
        });
      }
      
      // Aggregate hourly summary
      if (dayData.hourlySummary) {
        dayData.hourlySummary.forEach(hourData => {
          const key = hourData.hour;
          if (!hourMap.has(key)) {
            hourMap.set(key, {
              hour: hourData.hour,
              productiveFocusSec: 0,
              communicationFocusSec: 0,
              idleSec: 0,
              count: 0
            });
          }
          
          const existing = hourMap.get(key);
          existing.productiveFocusSec += hourData.productiveFocusSec || 0;
          existing.communicationFocusSec += hourData.communicationFocusSec || 0;
          existing.idleSec += hourData.idleSec || 0;
          existing.count++;
        });
      }
    });
    
    // Average CPU
    aggregated.system.aggregates.avgCPU = cpuCount > 0 ? totalCPU / cpuCount : 0;
    
    // Convert maps to arrays and average hourly data
    aggregated.apps = Array.from(appMap.values()).map(app => {
      // Convert hourlyStatsMap to hourlyStats array
      if (app.hourlyStatsMap && app.hourlyStatsMap.size > 0) {
        app.hourlyStats = Array.from(app.hourlyStatsMap.values()).map(h => ({
          hour: h.hour,
          focusSeconds: h.count > 0 ? Math.round(h.focusSeconds / h.count) : h.focusSeconds,
          runningSeconds: h.count > 0 ? Math.round(h.runningSeconds / h.count) : h.runningSeconds,
          switches: h.count > 0 ? Math.round(h.switches / h.count) : h.switches
        }));
        delete app.hourlyStatsMap; // Remove temporary map
      }
      return app;
    });
    
    aggregated.hourlySummary = Array.from(hourMap.values()).map(h => ({
      hour: h.hour,
      productiveFocusSec: Math.round(h.productiveFocusSec / h.count),
      communicationFocusSec: Math.round(h.communicationFocusSec / h.count),
      idleSec: Math.round(h.idleSec / h.count)
    }));
    
    console.log('✅ Aggregation complete:', {
      totalApps: aggregated.apps.length,
      totalHours: aggregated.hourlySummary.length,
      sampleApp: aggregated.apps[0] ? {
        name: aggregated.apps[0].name,
        category: aggregated.apps[0].category,
        hasHourlyStats: !!aggregated.apps[0].hourlyStats,
        hourlyStatsLength: aggregated.apps[0].hourlyStats?.length || 0,
        firstHourStat: aggregated.apps[0].hourlyStats?.[0]
      } : null
    });
    
    return aggregated;
  }, [recategorizeApp]);

  const fetchData = React.useCallback(async (date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const isToday = date === today;
      
      // Use /today endpoint for today's data (live), /daily-summary for historical data
      const endpoint = isToday 
        ? '/api/activity/today' 
        : `/api/activity/daily-summary/${date}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        // Recategorize apps based on current category configuration
        if (data.apps && categories.length > 0) {
          console.log('🔄 Recategorizing apps for daily view...');
          data.apps = data.apps.map(app => {
            // Try to categorize using title first (display name), then fallback to name (executable)
            const categoryByTitle = app.title ? recategorizeApp(app.title) : 'Uncategorized';
            const category = categoryByTitle !== 'Uncategorized' 
              ? categoryByTitle 
              : recategorizeApp(app.name || app.title);
            
            return {
              ...app,
              category: category
            };
          });
          
          console.log('✅ Daily view recategorization complete:', {
            totalApps: data.apps.length,
            sampleCategories: data.apps.slice(0, 5).map(a => `${a.name}: ${a.category}`)
          });
        }
        
        setActivityData(data);
      } else if (response.status === 404) {
        setActivityData({ apps: [], system: {}, hourlySummary: [] });
        setError('No data available for this date');
      } else {
        throw new Error('Failed to fetch activity data');
      }
    } catch (err) {
      console.error('Error fetching work patterns data:', err);
      setError(err.message);
      setActivityData({ apps: [], system: {}, hourlySummary: [] });
    } finally {
      setIsLoading(false);
    }
  }, [categories, recategorizeApp]);

  useEffect(() => {
    if (dateFilterMode === 'daily') {
      fetchData(selectedDate);
    } else if (dateFilterMode === 'weekly' && selectedWeek) {
      const [start, end] = selectedWeek.split('_');
      fetchRangeData(start, end);
    } else if (dateFilterMode === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const range = getMonthRange(parseInt(year), parseInt(month));
      fetchRangeData(range.start, range.end);
    }
    
    // Auto-refresh disabled
  }, [fetchData, fetchRangeData, selectedDate, selectedWeek, selectedMonth, dateFilterMode]);

  // Format memory usage
  const formatMemory = (mb) => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb?.toFixed(1) || 0} MB`;
  };

  // Format time in a user-friendly way
  const formatTime = (hours) => {
    const totalMinutes = Math.round(hours * 60);
    
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    } else {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      if (mins === 0) {
        return `${hrs}h`;
      } else {
        return `${hrs}h ${mins}m`;
      }
    }
  };

  // Format seconds to time
  const formatSeconds = (seconds) => {
    return formatTime(seconds / 3600);
  };

  // Parse window title to extract project and module information
  const parseWindowTitle = (windowTitle) => {
    if (!windowTitle) return { module: null, project: null };
    
    // Clean browser window titles - remove "and X more pages" suffix
    // Example: "Employee360 and 4 more pages" → "Employee360"
    // This applies to Microsoft Edge, Chrome, Firefox, etc.
    let cleanedTitle = windowTitle.replace(/\s+and\s+\d+\s+more\s+pages?$/i, '').trim();
    
    // Skip window titles with file paths (containing C:\ or full paths in parentheses)
    // Example to skip: "XMLUtil.java (C:\\Users\\Gbs05262\\eclipse-workspace\\...)"
    // Example to keep: "Branch_6360809_SwiftCommission – XMLUtil.java"
    if (cleanedTitle.includes('C:\\') || /\([A-Z]:\\.+\)/.test(cleanedTitle)) {
      return { module: null, project: null, skip: true };
    }
    
    // Pattern for Microsoft Teams
    if (cleanedTitle.includes('Microsoft Teams')) {
      const teamsParts = cleanedTitle.split('|').map(p => p.trim());
      
      // Chat pattern: "Chat | PersonName | Microsoft Teams"
      // Example: "Chat | G Pirabu | Microsoft Teams"
      if (teamsParts.length >= 3 && teamsParts[0].toLowerCase() === 'chat') {
        return {
          module: 'Chat',  // Type: Chat
          project: teamsParts[1].trim(),  // Person name (e.g., "G Pirabu")
          application: 'Microsoft Teams',
          type: 'Chat'
        };
      }
      
      // Call/Meeting pattern: "MeetingName | Microsoft Teams"
      // Example: "Daily standup | Microsoft Teams"
      if (teamsParts.length >= 2 && teamsParts[0].toLowerCase() !== 'chat') {
        return {
          module: 'Call',  // Type: Call
          project: teamsParts[0].trim(),  // Meeting/Call name (e.g., "Daily standup")
          application: 'Microsoft Teams',
          type: 'Call'
        };
      }
      
      // Fallback for other Teams patterns
      if (teamsParts.length >= 2) {
        return {
          module: teamsParts[0].trim(),
          project: teamsParts[1].trim(),
          application: 'Microsoft Teams'
        };
      }
    }
    
    // Pattern 1: En-dash format (preferred): "Branch_6360809_SwiftCommission – XMLUtil.java"
    // This uses en-dash (–) or unicode \u2013
    if (cleanedTitle.includes('–') || cleanedTitle.includes('\u2013')) {
      const parts = cleanedTitle.split(/–|\u2013/);
      if (parts.length >= 2) {
        return {
          module: parts[1].trim(),  // File name (e.g., "XMLUtil.java")
          project: parts[0].trim(),  // Project name (e.g., "Branch_6360809_SwiftCommission")
          application: null
        };
      }
    }
    
    // Pattern 2: "file - project - application" (e.g., "ApplicationActivity.js - Employee360-dashboard - Visual Studio Code")
    const pattern1 = cleanedTitle.split(' - ');
    if (pattern1.length >= 3) {
      return {
        module: pattern1[0].trim(),
        project: pattern1[1].trim(),
        application: pattern1.slice(2).join(' - ').trim()
      };
    }
    
    // Pattern 3: "file - application" (e.g., "new 342 - Notepad++")
    if (pattern1.length === 2) {
      return {
        module: pattern1[0].trim(),
        project: null,
        application: pattern1[1].trim()
      };
    }
    
    // Default: treat whole title as module
    return {
      module: cleanedTitle.trim(),
      project: null,
      application: null
    };
  };

  // Group focus switches by project and module
  const groupFocusSwitches = (focusSwitches) => {
    const projects = {};
    
    focusSwitches.forEach(sw => {
      const parsed = parseWindowTitle(sw.window_title);
      
      // Skip only window titles with file paths (explicitly marked with skip flag)
      if (parsed.skip) {
        return;
      }
      
      const projectName = parsed.project || 'No Project';
      const moduleName = parsed.module || 'Unknown';
      
      if (!projects[projectName]) {
        projects[projectName] = {
          name: projectName,
          totalTime: 0,
          modules: {}
        };
      }
      
      // Calculate time spent
      const from = new Date(sw.from);
      const to = new Date(sw.to);
      const duration = (to - from) / 1000; // seconds
      
      projects[projectName].totalTime += duration;
      
      if (!projects[projectName].modules[moduleName]) {
        projects[projectName].modules[moduleName] = {
          name: moduleName,
          time: 0,
          switchCount: 0,
          focusSwitches: []  // Store raw focus switches for timeline
        };
      }
      
      projects[projectName].modules[moduleName].time += duration;
      projects[projectName].modules[moduleName].switchCount += 1;
      projects[projectName].modules[moduleName].focusSwitches.push(sw);  // Add focus switch to timeline
    });
    
    return Object.values(projects).map(project => ({
      ...project,
      modules: Object.values(project.modules).sort((a, b) => b.time - a.time)
    })).sort((a, b) => b.totalTime - a.totalTime);
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  // Get work pattern data
  const getWorkPatternData = () => {
    if (!activityData || !activityData.hourlySummary || activityData.hourlySummary.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
        }]
      };
    }

    const summary = activityData.hourlySummary.reduce((acc, hour) => {
      acc.productive += hour.productiveFocusSec || 0;
      acc.communication += hour.communicationFocusSec || 0;
      acc.idle += hour.idleSec || 0;
      return acc;
    }, { productive: 0, communication: 0, idle: 0 });

    const appsByCategory = activityData.apps
      .filter(app => app.name !== 'background_apps')
      .reduce((acc, app) => {
        const cat = app.category;
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += app.focusDurationSec || 0;
        return acc;
      }, {});

    // Calculate times from recategorized apps instead of hourlySummary
    const productiveTime = (appsByCategory['Productivity'] || 0);
    const communicationTime = (appsByCategory['Communication'] || 0);
    const browsersTime = (appsByCategory['Browsers'] || 0);
    
    console.log('📊 Work Pattern Chart Data:', {
      productive: {
        fromHourlySummary: Math.round(summary.productive / 60) + 'm',
        fromApps: Math.round(productiveTime / 60) + 'm'
      },
      communication: {
        fromHourlySummary: Math.round(summary.communication / 60) + 'm',
        fromApps: Math.round(communicationTime / 60) + 'm'
      },
      browsers: Math.round(browsersTime / 60) + 'm',
      allCategories: Object.keys(appsByCategory).map(cat => `${cat}: ${Math.round(appsByCategory[cat] / 60)}m`)
    });

    const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
    const data = [
      Math.round(productiveTime / 60),      // Use recategorized Productivity apps
      Math.round(communicationTime / 60),   // Use recategorized Communication apps
      Math.round(browsersTime / 60),
      Math.round(summary.idle / 60)
    ];
    const colors = ['#4caf50', '#2196f3', '#9c27b0', '#ff9800'];

    return {
      labels: labels,
      datasets: [{
        label: 'Time Spent (minutes)',
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
      }]
    };
  };

  // Get category focus per hour data
  const getCategoryFocusPerHourData = () => {
    if (!activityData || !activityData.hourlySummary || activityData.hourlySummary.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const hours = activityData.hourlySummary.map(h => h.hour);
    const productiveData = activityData.hourlySummary.map(h => 
      Math.round((h.productiveFocusSec || 0) / 60)
    );
    const communicationData = activityData.hourlySummary.map(h => 
      Math.round((h.communicationFocusSec || 0) / 60)
    );
    
    const browserData = hours.map(hour => {
      const browsers = activityData.apps.filter(app => 
        app.category === 'Browsers' && app.name !== 'background_apps'
      );
      let totalBrowserTime = 0;
      browsers.forEach(app => {
        const hourStat = app.hourlyStats?.find(h => h.hour === hour);
        if (hourStat) {
          totalBrowserTime += hourStat.focusSeconds || 0;
        }
      });
      return Math.round(totalBrowserTime / 60);
    });

    const breaksData = activityData.hourlySummary.map(h => 
      Math.round((h.idleSec || 0) / 60)
    );

    return {
      labels: hours,
      datasets: [
        {
          label: '🎯 Productive',
          data: productiveData,
          backgroundColor: '#4caf50',
          stack: 'stack1'
        },
        {
          label: '📞 Communication',
          data: communicationData,
          backgroundColor: '#2196f3',
          stack: 'stack1'
        },
        {
          label: '🌐 Browsing',
          data: browserData,
          backgroundColor: '#9c27b0',
          stack: 'stack1'
        },
        {
          label: '☕ Breaks',
          data: breaksData,
          backgroundColor: '#ff9800',
          stack: 'stack1'
        }
      ]
    };
  };

  // Get overall time distribution data
  const getOverallTimeDistributionData = () => {
    if (!activityData || !activityData.system) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0']
        }]
      };
    }

    const productive = activityData.system.aggregates?.productiveHours || 0;
    const communication = activityData.system.aggregates?.communicationHours || 0;
    const idle = activityData.system.aggregates?.idleHours || 0;
    const total = activityData.system.aggregates?.overallMonitoringHours || 0;
    const other = Math.max(0, total - productive - communication - idle);

    const labels = [];
    const data = [];
    const colors = [];

    if (productive > 0) {
      labels.push(`Productive (${(productive * 60).toFixed(0)}m)`);
      data.push(productive);
      colors.push('#4caf50');
    }
    if (communication > 0) {
      labels.push(`Communication (${(communication * 60).toFixed(0)}m)`);
      data.push(communication);
      colors.push('#2196f3');
    }
    if (other > 0) {
      labels.push(`Other (${(other * 60).toFixed(0)}m)`);
      data.push(other);
      colors.push('#9c27b0');
    }
    if (idle > 0) {
      labels.push(`Idle (${(idle * 60).toFixed(0)}m)`);
      data.push(idle);
      colors.push('#ff9800');
    }

    if (labels.length === 0) {
      return {
        labels: ['No Activity'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0']
        }]
      };
    }

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
      }]
    };
  };

  // Get focus intensity heatmap data
  const getFocusIntensityHeatmapData = () => {
    if (!activityData || !activityData.hourlySummary || activityData.hourlySummary.length === 0) {
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        focusMinutes: 0,
        productive: 0,
        communication: 0,
        intensity: 0
      }));
    }

    const heatmapData = Array.from({ length: 24 }, (_, i) => {
      const hourStr = `${i.toString().padStart(2, '0')}:00`;
      const hourData = activityData.hourlySummary.find(h => h.hour === hourStr);
      
      if (hourData) {
        const productive = Math.round((hourData.productiveFocusSec || 0) / 60);
        const communication = Math.round((hourData.communicationFocusSec || 0) / 60);
        const totalFocus = productive + communication;
        const intensity = Math.min(100, Math.round((totalFocus / 60) * 100));
        
        return {
          hour: hourStr,
          focusMinutes: totalFocus,
          productive,
          communication,
          intensity
        };
      }
      
      return {
        hour: hourStr,
        focusMinutes: 0,
        productive: 0,
        communication: 0,
        intensity: 0
      };
    });

    return heatmapData;
  };

  // Get heatmap color based on intensity
  const getHeatmapColor = (intensity) => {
    if (intensity === 0) return '#f5f5f5';
    if (intensity < 20) return '#c8e6c9';
    if (intensity < 40) return '#81c784';
    if (intensity < 60) return '#4caf50';
    if (intensity < 80) return '#388e3c';
    return '#1b5e20';
  };

  // Handle work pattern click
  const handleWorkPatternClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      const categoryMapping = {
        '🎯 Focus Work': 'Productivity',
        '📞 Communication': 'Communication',
        '🌐 Browsing': 'Browsers',
        '☕ Breaks': 'Break'
      };
      
      const clickedLabel = labels[clickedIndex];
      const categoryKey = categoryMapping[clickedLabel];
      
      if (categoryKey === 'Breaks') {
        setSelectedWorkPatternCategory({
          label: clickedLabel,
          apps: [],
          isBreaks: true,
          totalTime: activityData.hourlySummary.reduce((acc, hour) => 
            acc + (hour.idleSec || 0), 0)
        });
      } else {
        console.log('🔍 Daily Focus Work Debug:', {
          clickedLabel,
          categoryKey,
          totalApps: activityData.apps.length,
          sampleCategories: activityData.apps.slice(0, 10).map(a => `${a.name}: ${a.category}`),
          appsWithCategoryKey: activityData.apps.filter(app => app.category === categoryKey).length
        });
        
        const appsForCategory = activityData.apps
          .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
          .map(app => ({
            name: app.title || app.name,
            appData: app, // Keep reference to full app data
            focusTime: app.focusDurationSec || 0,
            focusTimeMinutes: Math.round((app.focusDurationSec || 0) / 60),
            hasFocusSwitches: app.focusSwitches && app.focusSwitches.length > 0
          }))
          .filter(app => app.focusTime > 0)
          .sort((a, b) => b.focusTime - a.focusTime);
        
        console.log('📱 Apps found for category:', appsForCategory.length);
        
        setSelectedWorkPatternCategory({
          label: clickedLabel,
          apps: appsForCategory,
          isBreaks: false
        });
      }
      
      setWorkPatternDialogOpen(true);
    }
  };

  // Handle app click to show projects or modules
  const handleAppClick = (app) => {
    if (!app.appData || !app.appData.focusSwitches || app.appData.focusSwitches.length === 0) {
      return;
    }
    
    const projects = groupFocusSwitches(app.appData.focusSwitches);
    
    // If there's only one project and it's "No Project", skip to modules directly
    if (projects.length === 1 && projects[0].name === 'No Project') {
      setSelectedProjectModules({
        appName: app.name,
        projectName: projects[0].name,
        modules: projects[0].modules
      });
      setModuleDialogOpen(true);
    } else {
      // Show project dialog for multiple projects or named projects
      setSelectedAppProjects({
        appName: app.name,
        projects: projects
      });
      setProjectDialogOpen(true);
    }
  };

  // Handle project click to show modules
  const handleProjectClick = (project, appName) => {
    setSelectedProjectModules({
      appName: appName,
      projectName: project.name,
      modules: project.modules
    });
    setModuleDialogOpen(true);
  };

  // Handle tree view click - opens tree view with all data
  const handleTreeViewClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      const categoryMapping = {
        '🎯 Focus Work': 'Productivity',
        '📞 Communication': 'Communication',
        '🌐 Browsing': 'Browsers',
        '☕ Breaks': 'Break'
      };
      
      const clickedLabel = labels[clickedIndex];
      const categoryKey = categoryMapping[clickedLabel];
      
      if (categoryKey === 'Breaks') return; // Skip breaks for tree view
      
      // Build tree data structure
      const appsForCategory = activityData.apps
        .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
        .filter(app => app.focusSwitches && app.focusSwitches.length > 0)
        .map(app => {
          const projects = groupFocusSwitches(app.focusSwitches);
          return {
            name: app.title || app.name,
            focusTime: app.focusDurationSec || 0,
            projects: projects,
            category: app.category
          };
        })
        .filter(app => app.projects.length > 0)
        .sort((a, b) => b.focusTime - a.focusTime);
      
      setTreeViewData({
        category: clickedLabel,
        apps: appsForCategory
      });
      setExpandedApps({});
      setExpandedProjects({});
      setTreeViewDialogOpen(true);
    }
  };

  // Toggle app expansion in tree view
  const toggleAppExpansion = (appName) => {
    setExpandedApps(prev => ({
      ...prev,
      [appName]: !prev[appName]
    }));
  };

  // Toggle project expansion in tree view
  const toggleProjectExpansion = (appName, projectName) => {
    const key = `${appName}_${projectName}`;
    setExpandedProjects(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle split view click - opens master-detail split view
  const handleSplitViewClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      const categoryMapping = {
        '🎯 Focus Work': 'Productivity',
        '📞 Communication': 'Communication',
        '🌐 Browsing': 'Browsers',
        '☕ Breaks': 'Break'
      };
      
      const clickedLabel = labels[clickedIndex];
      const categoryKey = categoryMapping[clickedLabel];
      
      if (categoryKey === 'Breaks') return; // Skip breaks for split view
      
      // Build split view data structure
      const appsForCategory = activityData.apps
        .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
        .filter(app => app.focusSwitches && app.focusSwitches.length > 0)
        .map(app => {
          const projects = groupFocusSwitches(app.focusSwitches);
          return {
            name: app.title || app.name,
            focusTime: app.focusDurationSec || 0,
            projects: projects,
            category: app.category
          };
        })
        .filter(app => app.projects.length > 0)
        .sort((a, b) => b.focusTime - a.focusTime);
      
      setSplitViewData({
        category: clickedLabel,
        apps: appsForCategory
      });
      
      // Select first app by default
      if (appsForCategory.length > 0) {
        setSelectedItem(appsForCategory[0]);
        setSelectedItemType('app');
      }
      
      setSplitViewDialogOpen(true);
    }
  };

  // Handle item selection in split view
  const handleSplitViewItemClick = (item, type, parentApp = null, parentProject = null) => {
    setSelectedItem({ ...item, parentApp, parentProject });
    setSelectedItemType(type);
  };

  // Handle accordion view click - opens inline accordion expansion
  const handleAccordionViewClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      const categoryMapping = {
        '🎯 Focus Work': 'Productivity',
        '📞 Communication': 'Communication',
        '🌐 Browsing': 'Browsers',
        '☕ Breaks': 'Break'
      };
      
      const clickedLabel = labels[clickedIndex];
      const categoryKey = categoryMapping[clickedLabel];
      
      if (categoryKey === 'Breaks') return; // Skip breaks for accordion view
      
      // Build accordion data structure
      const appsForCategory = activityData.apps
        .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
        .filter(app => app.focusSwitches && app.focusSwitches.length > 0)
        .map(app => {
          const projects = groupFocusSwitches(app.focusSwitches);
          return {
            name: app.title || app.name,
            focusTime: app.focusDurationSec || 0,
            projects: projects,
            category: app.category
          };
        })
        .filter(app => app.projects.length > 0)
        .sort((a, b) => b.focusTime - a.focusTime);
      
      setAccordionData({
        category: clickedLabel,
        apps: appsForCategory
      });
      setExpandedAccordionApp(null);
      setExpandedAccordionProject({});
      setAccordionViewOpen(true);
    }
  };

  // Handle accordion expansion
  const handleAccordionAppChange = (appName) => (event, isExpanded) => {
    setExpandedAccordionApp(isExpanded ? appName : null);
    if (!isExpanded) {
      setExpandedAccordionProject({});
    }
  };

  const handleAccordionProjectChange = (appName, projectName) => (event, isExpanded) => {
    const key = `${appName}_${projectName}`;
    setExpandedAccordionProject(prev => ({
      ...prev,
      [key]: isExpanded
    }));
  };

  // Handle stepper view click - opens wizard-style stepper
  const handleStepperViewClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      const categoryMapping = {
        '🎯 Focus Work': 'Productivity',
        '📞 Communication': 'Communication',
        '🌐 Browsing': 'Browsers',
        '☕ Breaks': 'Break'
      };
      
      const clickedLabel = labels[clickedIndex];
      const categoryKey = categoryMapping[clickedLabel];
      
      if (categoryKey === 'Breaks') return; // Skip breaks for stepper view
      
      // Build stepper data structure
      const appsForCategory = activityData.apps
        .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
        .filter(app => app.focusSwitches && app.focusSwitches.length > 0)
        .map(app => {
          const projects = groupFocusSwitches(app.focusSwitches);
          return {
            name: app.title || app.name,
            focusTime: app.focusDurationSec || 0,
            projects: projects,
            category: app.category
          };
        })
        .filter(app => app.projects.length > 0)
        .sort((a, b) => b.focusTime - a.focusTime);
      
      setStepperData({
        category: clickedLabel,
        apps: appsForCategory
      });
      setActiveStep(0);
      setSelectedStepperApp(null);
      setSelectedStepperProject(null);
      setSelectedStepperModule(null);
      setStepperViewOpen(true);
    }
  };

  // Stepper navigation handlers
  const handleStepperNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleStepperBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    // Clear selections when going back
    if (activeStep === 2) {
      setSelectedStepperModule(null);
    } else if (activeStep === 1) {
      setSelectedStepperProject(null);
      setSelectedStepperModule(null);
    }
  };

  const handleStepperReset = () => {
    setActiveStep(0);
    setSelectedStepperApp(null);
    setSelectedStepperProject(null);
    setSelectedStepperModule(null);
  };

  const handleSelectApp = (app) => {
    setSelectedStepperApp(app);
    handleStepperNext();
  };

  const handleSelectProject = (project) => {
    setSelectedStepperProject(project);
    handleStepperNext();
  };

  const handleSelectModule = (module) => {
    setSelectedStepperModule(module);
    handleStepperNext();
  };

  // Handle card stack view click - opens card-based navigation
  const handleCardStackViewClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const labels = ['🎯 Focus Work', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      const categoryMapping = {
        '🎯 Focus Work': 'Productivity',
        '📞 Communication': 'Communication',
        '🌐 Browsing': 'Browsers',
        '☕ Breaks': 'Break'
      };
      
      const clickedLabel = labels[clickedIndex];
      const categoryKey = categoryMapping[clickedLabel];
      
      if (categoryKey === 'Breaks') return; // Skip breaks for card stack view
      
      // Build card stack data structure
      const appsForCategory = activityData.apps
        .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
        .filter(app => app.focusSwitches && app.focusSwitches.length > 0)
        .map(app => {
          const projects = groupFocusSwitches(app.focusSwitches);
          return {
            name: app.title || app.name,
            focusTime: app.focusDurationSec || 0,
            projects: projects,
            category: app.category
          };
        })
        .filter(app => app.projects.length > 0)
        .sort((a, b) => b.focusTime - a.focusTime);
      
      setCardStackData({
        category: clickedLabel,
        apps: appsForCategory
      });
      setCardStackLevel('apps');
      setSelectedCardApp(null);
      setSelectedCardProject(null);
      setNavigationHistory([]);
      setCardStackViewOpen(true);
    }
  };

  // Card stack navigation handlers
  const handleCardAppClick = (app) => {
    setNavigationHistory([...navigationHistory, { level: 'apps', data: cardStackData }]);
    setSelectedCardApp(app);
    setCardStackLevel('projects');
  };

  const handleCardProjectClick = (project) => {
    setNavigationHistory([...navigationHistory, { level: 'projects', app: selectedCardApp }]);
    setSelectedCardProject(project);
    setCardStackLevel('modules');
  };

  const handleModuleClick = (module) => {
    setSelectedModuleTimeline(module);
    setTimelineDialogOpen(true);
  };

  const handleCardBack = () => {
    if (navigationHistory.length === 0) return;
    
    const previous = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory(navigationHistory.slice(0, -1));
    
    if (previous.level === 'apps') {
      setCardStackLevel('apps');
      setSelectedCardApp(null);
      setSelectedCardProject(null);
    } else if (previous.level === 'projects') {
      setCardStackLevel('projects');
      setSelectedCardProject(null);
    }
  };

  const handleCardHome = () => {
    setCardStackLevel('apps');
    setSelectedCardApp(null);
    setSelectedCardProject(null);
    setNavigationHistory([]);
  };

  // Unified hybrid handler - routes to selected style
  const handleHybridClick = (event, elements) => {
    switch(viewStyle) {
      case 'breadcrumbs':
        handleWorkPatternClick(event, elements);
        break;
      case 'tree':
        handleTreeViewClick(event, elements);
        break;
      case 'split':
        handleSplitViewClick(event, elements);
        break;
      case 'accordion':
        handleAccordionViewClick(event, elements);
        break;
      case 'stepper':
        handleStepperViewClick(event, elements);
        break;
      case 'card-stack':
      default:
        handleCardStackViewClick(event, elements);
        break;
    }
  };

  // Hybrid router for Category Focus chart
  const handleCategoryFocusHybrid = (event, elements) => {
    switch (categoryViewStyle) {
      case 'breadcrumbs':
        handleCategoryFocusClick(event, elements);
        break;
      case 'tree':
        handleCategoryFocusTreeView(event, elements);
        break;
      case 'split':
        handleCategoryFocusSplitView(event, elements);
        break;
      case 'accordion':
        handleCategoryFocusAccordionView(event, elements);
        break;
      case 'stepper':
        handleCategoryFocusStepperView(event, elements);
        break;
      case 'card-stack':
      default:
        handleCategoryFocusCardStack(event, elements);
        break;
    }
  };

  // Hybrid router for Time Distribution chart
  const handleTimeDistributionHybrid = (event, elements) => {
    switch (timeDistViewStyle) {
      case 'breadcrumbs':
        handleTimeDistributionClick(event, elements);
        break;
      case 'tree':
        handleTimeDistributionTreeView(event, elements);
        break;
      case 'split':
        handleTimeDistributionSplitView(event, elements);
        break;
      case 'accordion':
        handleTimeDistributionAccordionView(event, elements);
        break;
      case 'stepper':
        handleTimeDistributionStepperView(event, elements);
        break;
      case 'card-stack':
      default:
        handleTimeDistributionCardStack(event, elements);
        break;
    }
  };

  // Hybrid router for Heatmap
  const handleHeatmapHybrid = (hourIndex) => {
    switch (heatmapViewStyle) {
      case 'breadcrumbs':
        handleHeatmapClick(hourIndex);
        break;
      case 'tree':
        handleHeatmapTreeView(hourIndex);
        break;
      case 'split':
        handleHeatmapSplitView(hourIndex);
        break;
      case 'accordion':
        handleHeatmapAccordionView(hourIndex);
        break;
      case 'stepper':
        handleHeatmapStepperView(hourIndex);
        break;
      case 'card-stack':
      default:
        handleHeatmapCardStack(hourIndex);
        break;
    }
  };

  // Handle category focus click
  const handleCategoryFocusClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const hour = activityData.hourlySummary[clickedIndex]?.hour;
      const categoryLabels = ['🎯 Productive', '📞 Communication', '🌐 Browsing', '☕ Breaks'];
      // Updated to match the actual category names from the API
      const categoryKeys = ['Productivity', 'Communication', 'Browsers', 'Break'];
      
      const clickedCategory = categoryLabels[datasetIndex];
      const categoryKey = categoryKeys[datasetIndex];
      
      console.log('=== Category Focus Click Debug ===');
      console.log('Date Filter Mode:', dateFilterMode);
      console.log('Clicked Hour:', hour);
      console.log('Category:', clickedCategory, '(', categoryKey, ')');
      console.log('Total Apps:', activityData.apps?.length);
      console.log('Apps in category:', activityData.apps?.filter(app => app.category === categoryKey).length);
      
      // Handle Breaks category specially
      if (categoryKey === 'Break') {
        const hourData = activityData.hourlySummary[clickedIndex];
        setSelectedCategoryFocusData({
          hour: hour,
          category: clickedCategory,
          apps: [],
          isBreaks: true,
          idleMinutes: Math.round((hourData?.idleSec || 0) / 60)
        });
      } else {
        const appsInCategory = activityData.apps.filter(app => app.name !== 'background_apps' && app.category === categoryKey);
        console.log('Apps in category (filtered):', appsInCategory.length);
        appsInCategory.forEach(app => {
          console.log('App:', app.name, 'has hourlyStats:', app.hourlyStats?.length || 0, 'entries');
        });
        
        const appsForHour = appsInCategory
          .map(app => {
            const hourStat = app.hourlyStats?.find(h => h.hour === hour);
            console.log('App:', app.name, 'hourStat for', hour, ':', hourStat);
            return {
              name: app.title || app.name,
              focusTime: hourStat?.focusSeconds || 0,
              focusTimeMinutes: Math.round((hourStat?.focusSeconds || 0) / 60)
            };
          })
          .filter(app => app.focusTime > 0)
          .sort((a, b) => b.focusTime - a.focusTime);
        
        console.log('Final apps for hour:', appsForHour.length);
        console.log('Apps:', appsForHour);
        
        setSelectedCategoryFocusData({
          hour: hour,
          category: clickedCategory,
          apps: appsForHour,
          isBreaks: false
        });
      }
      
      setCategoryFocusDialogOpen(true);
    }
  };

  // Handle time distribution click
  const handleTimeDistributionClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const chartData = getOverallTimeDistributionData();
      const clickedLabel = chartData.labels[clickedIndex];
      
      const category = clickedLabel.split('(')[0].trim();
      const categoryMapping = {
        'Productive': 'Productive',
        'Communication': 'Communication',
        'Other': 'Browsers',
        'Idle': 'Idle'
      };
      
      const categoryKey = categoryMapping[category];
      
      if (categoryKey === 'Idle') {
        setSelectedTimeDistribution({
          category: category,
          apps: [],
          isIdle: true,
          totalTime: activityData.system.aggregates?.idleHours || 0
        });
      } else {
        const appsForCategory = activityData.apps
          .filter(app => app.name !== 'background_apps' && app.category === categoryKey)
          .map(app => ({
            name: app.title || app.name,
            focusTime: app.focusDurationSec || 0,
            focusTimeMinutes: Math.round((app.focusDurationSec || 0) / 60),
            runningTime: app.runningTimeSec || 0,
            runningTimeMinutes: Math.round((app.runningTimeSec || 0) / 60)
          }))
          .filter(app => app.runningTime > 0)
          .sort((a, b) => b.runningTime - a.runningTime);
        
        setSelectedTimeDistribution({
          category: category,
          apps: appsForCategory,
          isIdle: false
        });
      }
      
      setTimeDistributionDialogOpen(true);
    }
  };

  // Handle heatmap click
  const handleHeatmapClick = (hourIndex) => {
    if (!activityData || !activityData.hourlySummary) return;
    
    const hourData = activityData.hourlySummary[hourIndex];
    if (!hourData) return;
    
    const appsInHour = activityData.apps
      .filter(app => app.name !== 'background_apps')
      .map(app => {
        const hourStat = app.hourlyStats?.find(h => h.hour === hourData.hour);
        return {
          name: app.title || app.name,
          category: app.category,
          focusTime: hourStat?.focusSeconds || 0,
          focusTimeMinutes: Math.round((hourStat?.focusSeconds || 0) / 60)
        };
      })
      .filter(app => app.focusTime > 0)
      .sort((a, b) => b.focusTime - a.focusTime);
    
    setSelectedHeatmapHour({
      hour: hourData.hour,
      productiveFocus: Math.round((hourData.productiveFocusSec || 0) / 60),
      communicationFocus: Math.round((hourData.communicationFocusSec || 0) / 60),
      idle: Math.round((hourData.idleSec || 0) / 60),
      apps: appsInHour
    });
    
    setHeatmapDialogOpen(true);
  };

  // Category Focus chart - All view styles (simplified - these charts show flat lists)
  const handleCategoryFocusCardStack = (event, elements) => handleCategoryFocusClick(event, elements);
  const handleCategoryFocusTreeView = (event, elements) => handleCategoryFocusClick(event, elements);
  const handleCategoryFocusSplitView = (event, elements) => handleCategoryFocusClick(event, elements);
  const handleCategoryFocusAccordionView = (event, elements) => handleCategoryFocusClick(event, elements);
  const handleCategoryFocusStepperView = (event, elements) => handleCategoryFocusClick(event, elements);

  // Time Distribution chart - All view styles (simplified - these charts show flat lists)
  const handleTimeDistributionCardStack = (event, elements) => handleTimeDistributionClick(event, elements);
  const handleTimeDistributionTreeView = (event, elements) => handleTimeDistributionClick(event, elements);
  const handleTimeDistributionSplitView = (event, elements) => handleTimeDistributionClick(event, elements);
  const handleTimeDistributionAccordionView = (event, elements) => handleTimeDistributionClick(event, elements);
  const handleTimeDistributionStepperView = (event, elements) => handleTimeDistributionClick(event, elements);

  // Heatmap - All view styles (simplified - these charts show flat lists)
  const handleHeatmapCardStack = (hourIndex) => handleHeatmapClick(hourIndex);
  const handleHeatmapTreeView = (hourIndex) => handleHeatmapClick(hourIndex);
  const handleHeatmapSplitView = (hourIndex) => handleHeatmapClick(hourIndex);
  const handleHeatmapAccordionView = (hourIndex) => handleHeatmapClick(hourIndex);
  const handleHeatmapStepperView = (hourIndex) => handleHeatmapClick(hourIndex);

  // Chatbot functions
  const handleChatOpen = () => {
    setChatOpen(true);
    if (chatMessages.length === 0) {
      // Add welcome message
      setChatMessages([{
        role: 'assistant',
        content: 'Hi! I\'m your Work Pattern AI assistant. I can help you:\n\n📊 Analyze your work patterns\n⏰ Understand your focus time\n📈 Track productivity trends\n📄 Generate Excel reports\n\nWhat would you like to know?'
      }]);
    }
  };

  const handleChatClose = () => {
    setChatOpen(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8001/api/work-patterns/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          date: selectedDate,
          conversationHistory: chatMessages.slice(-10) // Send last 10 messages for context
        }),
      });

      const data = await response.json();

      if (data.action === 'generate_excel') {
        // Generate and download Excel report
        setChatMessages([...newMessages, { role: 'assistant', content: data.response + '\n\n📥 Generating Excel report...' }]);
        await handleGenerateExcel();
      } else {
        // Add AI response to chat
        setChatMessages([...newMessages, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please make sure the backend server is running and try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateExcel = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/work-patterns/generate-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-pattern-${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Update chat with success message
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '✅ Excel report generated successfully! The file has been downloaded to your computer.' 
      }]);
    } catch (error) {
      console.error('Excel generation error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Failed to generate Excel report. Please try again.' 
      }]);
    }
  };

  // Scroll to bottom of chat when new messages arrive
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading work patterns: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Work Pattern Analysis
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Detailed analysis of your work patterns, focus time, and productivity trends
      </Typography>
      
      {/* Date Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Filter Mode Selection */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button 
                variant={dateFilterMode === 'daily' ? 'contained' : 'outlined'}
                onClick={() => setDateFilterMode('daily')}
                size="small"
              >
                📅 Daily
              </Button>
              <Button 
                variant={dateFilterMode === 'weekly' ? 'contained' : 'outlined'}
                onClick={() => setDateFilterMode('weekly')}
                size="small"
              >
                📊 Weekly
              </Button>
              <Button 
                variant={dateFilterMode === 'monthly' ? 'contained' : 'outlined'}
                onClick={() => setDateFilterMode('monthly')}
                size="small"
              >
                📈 Monthly
              </Button>
            </Box>
          </Grid>
          
          {/* Daily Filter */}
          {dateFilterMode === 'daily' && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="date-select-label">Select Date</InputLabel>
                  <Select
                    labelId="date-select-label"
                    id="date-select"
                    value={selectedDate}
                    label="Select Date"
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <MenuItem value={new Date().toISOString().split('T')[0]}>
                      Today ({new Date().toLocaleDateString()})
                    </MenuItem>
                    <Divider />
                    {availableDates.map((date) => (
                      <MenuItem key={date} value={date}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Custom Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    label={selectedDate === new Date().toISOString().split('T')[0] ? "Live Data" : "Historical Data"}
                    color={selectedDate === new Date().toISOString().split('T')[0] ? "success" : "default"}
                    size="small"
                  />
                </Box>
              </Grid>
            </>
          )}
          
          {/* Weekly Filter */}
          {dateFilterMode === 'weekly' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="week-select-label">Select Week</InputLabel>
                  <Select
                    labelId="week-select-label"
                    id="week-select"
                    value={selectedWeek}
                    label="Select Week"
                    onChange={(e) => setSelectedWeek(e.target.value)}
                  >
                    {getWeekOptions.map((week) => (
                      <MenuItem key={`${week.start}_${week.end}`} value={`${week.start}_${week.end}`}>
                        {week.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    label="Weekly Aggregated Data"
                    color="primary"
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {selectedWeek && `${selectedWeek.split('_')[0]} to ${selectedWeek.split('_')[1]}`}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
          
          {/* Monthly Filter */}
          {dateFilterMode === 'monthly' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="month-select-label">Select Month</InputLabel>
                  <Select
                    labelId="month-select-label"
                    id="month-select"
                    value={selectedMonth}
                    label="Select Month"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {getMonthOptions.map((month) => (
                      <MenuItem key={month.key} value={month.key}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    label="Monthly Aggregated Data"
                    color="secondary"
                    size="small"
                  />
                  {selectedMonth && (
                    <Typography variant="caption" color="text.secondary">
                      {getMonthOptions.find(m => m.key === selectedMonth)?.label}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      <Grid container spacing={2}>
        {/* Work Pattern Analysis - Time Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Work Pattern Analysis - Time Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Breakdown of your daily activities: Focus work, Communication, and Breaks
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => setHybridDialogOpen(true)}
                startIcon={<AppsIcon />}
              >
                View Style: {viewStyle === 'card-stack' ? 'Cards' : viewStyle === 'breadcrumbs' ? 'Breadcrumbs' : viewStyle === 'tree' ? 'Tree' : viewStyle === 'split' ? 'Split' : viewStyle === 'accordion' ? 'Accordion' : 'Stepper'}
              </Button>
            </Box>
            <Box sx={{ flex: 1, minHeight: 180, display: 'flex', alignItems: 'center' }}>
              <Bar data={getWorkPatternData()} options={{
                ...chartOptions,
                onClick: (event, elements) => handleHybridClick(event, elements),
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Time Spent (minutes)'
                    }
                  }
                },
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const minutes = context.parsed.y;
                        const hours = Math.floor(minutes / 60);
                        const mins = Math.round(minutes % 60);
                        return `${context.dataset.label}: ${hours}h ${mins}m`;
                      }
                    }
                  }
                }
              }} />
            </Box>
          </Paper>
        </Grid>

        {/* Category-wise Focus Hours */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              📊 Category-wise Focus Hours
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Breakdown of productive, communication, and browsing time per hour
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => setCategoryHybridDialogOpen(true)}
                startIcon={<AppsIcon />}
              >
                View Style: {categoryViewStyle === 'card-stack' ? 'Cards' : categoryViewStyle === 'breadcrumbs' ? 'Breadcrumbs' : categoryViewStyle === 'tree' ? 'Tree' : categoryViewStyle === 'split' ? 'Split' : categoryViewStyle === 'accordion' ? 'Accordion' : 'Stepper'}
              </Button>
            </Box>
            <Bar 
              data={getCategoryFocusPerHourData()} 
              options={{
                responsive: true,
                onClick: (event, elements) => handleCategoryFocusHybrid(event, elements),
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y} minutes`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    stacked: true,
                    title: {
                      display: true,
                      text: 'Hour of Day'
                    }
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Focus Time (minutes)'
                    }
                  }
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Focus Intensity Heatmap */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              🔥 Focus Intensity Heatmap
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Color-coded view of your focus intensity throughout the day
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => setHeatmapHybridDialogOpen(true)}
                startIcon={<AppsIcon />}
              >
                View Style: {heatmapViewStyle === 'card-stack' ? 'Cards' : heatmapViewStyle === 'breadcrumbs' ? 'Breadcrumbs' : heatmapViewStyle === 'tree' ? 'Tree' : heatmapViewStyle === 'split' ? 'Split' : heatmapViewStyle === 'accordion' ? 'Accordion' : 'Stepper'}
              </Button>
            </Box>
            <Box sx={{ 
              flex: 1,
              display: 'grid', 
              gridTemplateColumns: 'repeat(12, 1fr)', 
              gap: 0.5,
              mt: 2,
              minHeight: 180,
              alignContent: 'center'
            }}>
              {getFocusIntensityHeatmapData().map((hourData, index) => (
                <Tooltip 
                  key={index}
                  title={
                    <Box>
                      <Typography variant="caption" display="block">
                        <strong>{hourData.hour}</strong>
                      </Typography>
                      <Typography variant="caption" display="block">
                        Focus: {hourData.focusMinutes} min
                      </Typography>
                      <Typography variant="caption" display="block">
                        Productive: {hourData.productive} min
                      </Typography>
                      <Typography variant="caption" display="block">
                        Communication: {hourData.communication} min
                      </Typography>
                      <Typography variant="caption" display="block">
                        Intensity: {hourData.intensity}%
                      </Typography>
                    </Box>
                  }
                  arrow
                >
                  <Box
                    onClick={() => handleHeatmapHybrid(index)}
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: getHeatmapColor(hourData.intensity),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        zIndex: 10,
                        boxShadow: 2
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem',
                        fontWeight: hourData.intensity > 0 ? 'bold' : 'normal',
                        color: hourData.intensity > 40 ? '#fff' : '#666'
                      }}
                    >
                      {hourData.hour.split(':')[0]}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">Low</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[0, 20, 40, 60, 80, 100].map((intensity, i) => (
                  <Box 
                    key={i}
                    sx={{ 
                      width: 30, 
                      height: 15, 
                      backgroundColor: getHeatmapColor(intensity),
                      borderRadius: 0.5,
                      border: '1px solid #e0e0e0'
                    }} 
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">High</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Work Pattern Details Dialog */}
      {/* View Style Selector Dialog */}
      <Dialog 
        open={hybridDialogOpen} 
        onClose={() => setHybridDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Choose Your Exploration Style</Typography>
          <Typography variant="caption" color="text.secondary">
            Select how you want to navigate through your activity data
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {[
              { id: 'card-stack', name: 'Card Stack', icon: '🎴', desc: 'Beautiful cards with animations', color: '#e3f2fd' },
              { id: 'breadcrumbs', name: 'Breadcrumbs', icon: '🍞', desc: 'Sequential with navigation path', color: '#f3e5f5' },
              { id: 'tree', name: 'Tree View', icon: '🌳', desc: 'See everything at once', color: '#e8f5e9' },
              { id: 'split', name: 'Split View', icon: '📱', desc: 'Master-detail panels', color: '#fff3e0' },
              { id: 'accordion', name: 'Accordion', icon: '📋', desc: 'Inline expansion panels', color: '#fce4ec' },
              { id: 'stepper', name: 'Stepper', icon: '🎯', desc: 'Guided step-by-step', color: '#e0f2f1' }
            ].map((style) => (
              <Grid item xs={6} key={style.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: viewStyle === style.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                    bgcolor: viewStyle === style.id ? style.color : 'white',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => {
                      setViewStyle(style.id);
                      setHybridDialogOpen(false);
                    }}
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>{style.icon}</Typography>
                      <Typography variant="h6" gutterBottom>{style.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {style.desc}
                      </Typography>
                      {viewStyle === style.id && (
                        <Chip label="Active" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHybridDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Category Focus - View Style Selector Dialog */}
      <Dialog 
        open={categoryHybridDialogOpen} 
        onClose={() => setCategoryHybridDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Choose Exploration Style</Typography>
          <Typography variant="caption" color="text.secondary">
            For Category-wise Focus Hours chart
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {[
              { id: 'card-stack', name: 'Card Stack', icon: '🎴', desc: 'Beautiful cards with animations', color: '#e3f2fd' },
              { id: 'breadcrumbs', name: 'Breadcrumbs', icon: '🍞', desc: 'Sequential with navigation path', color: '#f3e5f5' },
              { id: 'tree', name: 'Tree View', icon: '🌳', desc: 'See everything at once', color: '#e8f5e9' },
              { id: 'split', name: 'Split View', icon: '📱', desc: 'Master-detail panels', color: '#fff3e0' },
              { id: 'accordion', name: 'Accordion', icon: '📋', desc: 'Inline expansion panels', color: '#fce4ec' },
              { id: 'stepper', name: 'Stepper', icon: '🎯', desc: 'Guided step-by-step', color: '#e0f2f1' }
            ].map((style) => (
              <Grid item xs={6} key={style.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: categoryViewStyle === style.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                    bgcolor: categoryViewStyle === style.id ? style.color : 'white',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => {
                      setCategoryViewStyle(style.id);
                      setCategoryHybridDialogOpen(false);
                    }}
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>{style.icon}</Typography>
                      <Typography variant="h6" gutterBottom>{style.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {style.desc}
                      </Typography>
                      {categoryViewStyle === style.id && (
                        <Chip label="Active" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryHybridDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Time Distribution - View Style Selector Dialog */}
      <Dialog 
        open={timeDistHybridDialogOpen} 
        onClose={() => setTimeDistHybridDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Choose Exploration Style</Typography>
          <Typography variant="caption" color="text.secondary">
            For Overall Time Distribution chart
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {[
              { id: 'card-stack', name: 'Card Stack', icon: '🎴', desc: 'Beautiful cards with animations', color: '#e3f2fd' },
              { id: 'breadcrumbs', name: 'Breadcrumbs', icon: '🍞', desc: 'Sequential with navigation path', color: '#f3e5f5' },
              { id: 'tree', name: 'Tree View', icon: '🌳', desc: 'See everything at once', color: '#e8f5e9' },
              { id: 'split', name: 'Split View', icon: '📱', desc: 'Master-detail panels', color: '#fff3e0' },
              { id: 'accordion', name: 'Accordion', icon: '📋', desc: 'Inline expansion panels', color: '#fce4ec' },
              { id: 'stepper', name: 'Stepper', icon: '🎯', desc: 'Guided step-by-step', color: '#e0f2f1' }
            ].map((style) => (
              <Grid item xs={6} key={style.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: timeDistViewStyle === style.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                    bgcolor: timeDistViewStyle === style.id ? style.color : 'white',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => {
                      setTimeDistViewStyle(style.id);
                      setTimeDistHybridDialogOpen(false);
                    }}
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>{style.icon}</Typography>
                      <Typography variant="h6" gutterBottom>{style.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {style.desc}
                      </Typography>
                      {timeDistViewStyle === style.id && (
                        <Chip label="Active" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeDistHybridDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Heatmap - View Style Selector Dialog */}
      <Dialog 
        open={heatmapHybridDialogOpen} 
        onClose={() => setHeatmapHybridDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Choose Exploration Style</Typography>
          <Typography variant="caption" color="text.secondary">
            For Focus Intensity Heatmap
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {[
              { id: 'card-stack', name: 'Card Stack', icon: '🎴', desc: 'Beautiful cards with animations', color: '#e3f2fd' },
              { id: 'breadcrumbs', name: 'Breadcrumbs', icon: '🍞', desc: 'Sequential with navigation path', color: '#f3e5f5' },
              { id: 'tree', name: 'Tree View', icon: '🌳', desc: 'See everything at once', color: '#e8f5e9' },
              { id: 'split', name: 'Split View', icon: '📱', desc: 'Master-detail panels', color: '#fff3e0' },
              { id: 'accordion', name: 'Accordion', icon: '📋', desc: 'Inline expansion panels', color: '#fce4ec' },
              { id: 'stepper', name: 'Stepper', icon: '🎯', desc: 'Guided step-by-step', color: '#e0f2f1' }
            ].map((style) => (
              <Grid item xs={6} key={style.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: heatmapViewStyle === style.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                    bgcolor: heatmapViewStyle === style.id ? style.color : 'white',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => {
                      setHeatmapViewStyle(style.id);
                      setHeatmapHybridDialogOpen(false);
                    }}
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>{style.icon}</Typography>
                      <Typography variant="h6" gutterBottom>{style.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {style.desc}
                      </Typography>
                      {heatmapViewStyle === style.id && (
                        <Chip label="Active" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHeatmapHybridDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Card Stack View Dialog - Style 6 */}
      <Dialog 
        open={cardStackViewOpen} 
        onClose={() => setCardStackViewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">
                {cardStackData?.category} - Card Explorer
              </Typography>
              <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mt: 0.5 }}>
                <Chip 
                  label={cardStackData?.category} 
                  size="small" 
                  onClick={cardStackLevel !== 'apps' ? handleCardHome : undefined}
                  sx={{ cursor: cardStackLevel !== 'apps' ? 'pointer' : 'default' }}
                />
                {selectedCardApp && (
                  <Chip 
                    label={selectedCardApp.name} 
                    size="small" 
                    color="primary"
                    onClick={cardStackLevel === 'modules' ? () => setCardStackLevel('projects') : undefined}
                    sx={{ cursor: cardStackLevel === 'modules' ? 'pointer' : 'default' }}
                  />
                )}
                {selectedCardProject && (
                  <Chip label={selectedCardProject.name} size="small" color="warning" />
                )}
              </Breadcrumbs>
            </Box>
            <Box>
              {navigationHistory.length > 0 && (
                <IconButton onClick={handleCardBack} color="primary">
                  <ArrowBackIcon />
                </IconButton>
              )}
              {cardStackLevel !== 'apps' && (
                <IconButton onClick={handleCardHome} color="primary">
                  <HomeIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Fade in={true} timeout={500}>
            <Box>
              {/* Apps Level - Card Grid */}
              {cardStackLevel === 'apps' && (
                <Grid container spacing={2}>
                  {cardStackData?.apps?.map((app, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Slide direction="up" in={true} timeout={300 + index * 100}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: 6,
                              bgcolor: '#e3f2fd'
                            }
                          }}
                        >
                          <CardActionArea onClick={() => handleCardAppClick(app)} sx={{ height: '100%', p: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AppsIcon sx={{ fontSize: 48 }} color="primary" />
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="h6">{app.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Application
                                  </Typography>
                                </Box>
                                <ArrowForwardIcon color="action" />
                              </Box>
                              <Divider />
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Time</Typography>
                                  <Typography variant="h6" color="primary">
                                    {formatSeconds(app.focusTime)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Projects</Typography>
                                  <Typography variant="h6" color="primary">
                                    {app.projects.length}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </CardActionArea>
                        </Card>
                      </Slide>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Projects Level - Card Grid */}
              {cardStackLevel === 'projects' && selectedCardApp && (
                <Grid container spacing={2}>
                  {selectedCardApp.projects.map((project, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Slide direction="left" in={true} timeout={300 + index * 100}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: 6,
                              bgcolor: '#fff3e0'
                            }
                          }}
                        >
                          <CardActionArea onClick={() => handleCardProjectClick(project)} sx={{ height: '100%', p: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {selectedCardApp.category === 'Communication' ? (
                                  <PeopleIcon sx={{ fontSize: 48 }} color="primary" />
                                ) : (
                                  <FolderIcon sx={{ fontSize: 48 }} color="warning" />
                                )}
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="h6">{project.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {selectedCardApp.category === 'Communication' ? 'People' : 'Project'}
                                  </Typography>
                                </Box>
                                <ArrowForwardIcon color="action" />
                              </Box>
                              <Divider />
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Time</Typography>
                                  <Typography variant="h6" color="warning.main">
                                    {formatSeconds(project.totalTime)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Modules</Typography>
                                  <Typography variant="h6" color="warning.main">
                                    {project.modules.length}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </CardActionArea>
                        </Card>
                      </Slide>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Modules Level - Card Grid */}
              {cardStackLevel === 'modules' && selectedCardProject && (
                <Grid container spacing={2}>
                  {selectedCardProject.modules.map((module, index) => (
                    <Grid item xs={12} key={index}>
                      <Fade in={true} timeout={300 + index * 100}>
                        <Card 
                          sx={{ 
                            bgcolor: '#f1f8e9',
                            border: '2px solid #2e7d32',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateX(10px)',
                              boxShadow: 4,
                              bgcolor: '#e8f5e9'
                            }
                          }}
                          onClick={() => handleModuleClick(module)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <InsertDriveFileIcon sx={{ fontSize: 40 }} color="success" />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">{module.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Module / File • Click to view timeline
                                </Typography>
                              </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Time Spent</Typography>
                                <Typography variant="h5" color="success.main">
                                  {Math.round(module.time / 60)} min
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({Math.round(module.time)} seconds)
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Focus Switches</Typography>
                                <Typography variant="h5" color="success.main">
                                  {module.switchCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  times you worked on this
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Fade>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCardStackViewOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stepper View Dialog - Style 5 */}
      <Dialog 
        open={stepperViewOpen} 
        onClose={() => setStepperViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {stepperData?.category} - Guided Explorer
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Follow the steps to explore your activity
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Select Application */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Select Application</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose an application to explore:
                </Typography>
                <List>
                  {stepperData?.apps?.map((app, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleSelectApp(app)}
                      sx={{
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: '#e3f2fd',
                          borderColor: '#1976d2'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <AppsIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={app.name}
                        secondary={`${Math.round(app.focusTime / 60)} min • ${app.projects.length} projects`}
                      />
                      <ArrowForwardIcon color="action" />
                    </ListItemButton>
                  ))}
                </List>
              </StepContent>
            </Step>

            {/* Step 2: Select Project */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Select Project</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Application: <strong>{selectedStepperApp?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose a project to explore:
                </Typography>
                <List>
                  {selectedStepperApp?.projects?.map((project, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleSelectProject(project)}
                      sx={{
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: '#fff3e0',
                          borderColor: '#ed6c02'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <FolderIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        secondary={`${Math.round(project.totalTime / 60)} min • ${project.modules.length} modules`}
                      />
                      <ArrowForwardIcon color="action" />
                    </ListItemButton>
                  ))}
                </List>
                <Box sx={{ mt: 2 }}>
                  <Button
                    onClick={handleStepperBack}
                    startIcon={<ArrowBackIcon />}
                    size="small"
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Select Module */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Select Module</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Application: <strong>{selectedStepperApp?.name}</strong> → {selectedStepperApp?.category === 'Communication' ? 'People' : 'Project'}: <strong>{selectedStepperProject?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose a module to view details:
                </Typography>
                <List>
                  {selectedStepperProject?.modules?.map((module, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleSelectModule(module)}
                      sx={{
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: '#f1f8e9',
                          borderColor: '#2e7d32'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <InsertDriveFileIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={module.name}
                        secondary={`${Math.round(module.time / 60)} min • ${module.switchCount} switches`}
                      />
                      <ArrowForwardIcon color="action" />
                    </ListItemButton>
                  ))}
                </List>
                <Box sx={{ mt: 2 }}>
                  <Button
                    onClick={handleStepperBack}
                    startIcon={<ArrowBackIcon />}
                    size="small"
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Module Details */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Module Details</Typography>
              </StepLabel>
              <StepContent>
                <Card sx={{ bgcolor: '#f1f8e9', border: '2px solid #2e7d32' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <InsertDriveFileIcon sx={{ fontSize: 40 }} color="success" />
                      <Box>
                        <Typography variant="h5">{selectedStepperModule?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Module / File
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Time Spent</Typography>
                        <Typography variant="h4" color="success.main">
                          {Math.round(selectedStepperModule?.time / 60)} min
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({Math.round(selectedStepperModule?.time)} seconds)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Focus Switches</Typography>
                        <Typography variant="h4" color="success.main">
                          {selectedStepperModule?.switchCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          times you worked on this file
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Full Path:
                    </Typography>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                      <Chip label={selectedStepperApp?.name} size="small" color="primary" />
                      <Chip label={selectedStepperProject?.name} size="small" color="warning" />
                      <Chip label={selectedStepperModule?.name} size="small" color="success" />
                    </Breadcrumbs>
                  </CardContent>
                </Card>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    onClick={handleStepperBack}
                    startIcon={<ArrowBackIcon />}
                    size="small"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleStepperReset}
                    variant="outlined"
                    size="small"
                  >
                    Start Over
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStepperViewOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accordion View Dialog - Style 4 */}
      <Dialog 
        open={accordionViewOpen} 
        onClose={() => setAccordionViewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {accordionData?.category} - Accordion View
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Expand sections to explore - all data inline
          </Typography>
        </DialogTitle>
        <DialogContent>
          {accordionData?.apps && accordionData.apps.length > 0 ? (
            <Box>
              {accordionData.apps.map((app, appIndex) => (
                <Accordion 
                  key={appIndex}
                  expanded={expandedAccordionApp === app.name}
                  onChange={handleAccordionAppChange(app.name)}
                  sx={{ 
                    mb: 1,
                    '&:before': { display: 'none' },
                    boxShadow: 2
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{ 
                      bgcolor: '#e3f2fd',
                      '&:hover': { bgcolor: '#bbdefb' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <AppsIcon color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{app.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Application
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${Math.round(app.focusTime / 60)} min`}
                        color="primary"
                        size="small"
                      />
                      <Chip 
                        label={`${app.projects.length} projects`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    {/* Projects Level */}
                    {app.projects.map((project, projectIndex) => (
                      <Accordion 
                        key={projectIndex}
                        expanded={expandedAccordionProject[`${app.name}_${project.name}`]}
                        onChange={handleAccordionProjectChange(app.name, project.name)}
                        sx={{ 
                          boxShadow: 'none',
                          '&:before': { display: 'none' }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            bgcolor: '#fff3e0',
                            pl: 4,
                            '&:hover': { bgcolor: '#ffe0b2' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <FolderIcon color="warning" />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {project.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Project
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${Math.round(project.totalTime / 60)} min`}
                              color="warning"
                              size="small"
                            />
                            <Chip 
                              label={`${project.modules.length} modules`}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, bgcolor: '#f1f8e9' }}>
                          {/* Modules Level */}
                          <List>
                            {project.modules.map((module, moduleIndex) => (
                              <React.Fragment key={moduleIndex}>
                                <ListItem sx={{ pl: 8 }}>
                                  <ListItemIcon>
                                    <InsertDriveFileIcon color="success" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2">
                                          {module.name}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip 
                                          label={`${Math.round(module.time / 60)} min`}
                                          color="success"
                                          size="small"
                                        />
                                        <Chip 
                                          label={`${module.switchCount} switches`}
                                          variant="outlined"
                                          size="small"
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                                {moduleIndex < project.modules.length - 1 && (
                                  <Divider variant="inset" component="li" />
                                )}
                              </React.Fragment>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No detailed data available for this category.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccordionViewOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Split View Dialog - Style 3 */}
      <Dialog 
        open={splitViewDialogOpen} 
        onClose={() => setSplitViewDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            {splitViewData?.category} - Master-Detail View
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select items on the left to view details on the right
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Grid container sx={{ height: '100%' }}>
            {/* Left Sidebar - Master List */}
            <Grid item xs={4} sx={{ 
              borderRight: '1px solid #e0e0e0', 
              height: '100%',
              overflow: 'auto',
              bgcolor: '#fafafa'
            }}>
              <List sx={{ p: 0 }}>
                {splitViewData?.apps?.map((app, appIndex) => (
                  <React.Fragment key={appIndex}>
                    {/* App Item */}
                    <ListItemButton
                      selected={selectedItemType === 'app' && selectedItem?.name === app.name}
                      onClick={() => {
                        handleSplitViewItemClick(app, 'app');
                        toggleAppExpansion(app.name);
                      }}
                      sx={{
                        borderLeft: selectedItemType === 'app' && selectedItem?.name === app.name ? '4px solid #1976d2' : '4px solid transparent',
                        bgcolor: selectedItemType === 'app' && selectedItem?.name === app.name ? '#e3f2fd' : 'inherit',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <ListItemIcon>
                        <AppsIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={app.name}
                        secondary={`${Math.round(app.focusTime / 60)} min`}
                      />
                      {expandedApps[app.name] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    {/* Projects under this app */}
                    <Collapse in={expandedApps[app.name]} timeout="auto">
                      <List component="div" disablePadding>
                        {app.projects?.map((project, projectIndex) => (
                          <React.Fragment key={projectIndex}>
                            <ListItemButton
                              selected={selectedItemType === 'project' && selectedItem?.name === project.name && selectedItem?.parentApp?.name === app.name}
                              onClick={() => {
                                handleSplitViewItemClick(project, 'project', app);
                                toggleProjectExpansion(app.name, project.name);
                              }}
                              sx={{
                                pl: 4,
                                borderLeft: selectedItemType === 'project' && selectedItem?.name === project.name && selectedItem?.parentApp?.name === app.name ? '4px solid #ed6c02' : '4px solid transparent',
                                bgcolor: selectedItemType === 'project' && selectedItem?.name === project.name && selectedItem?.parentApp?.name === app.name ? '#fff3e0' : 'inherit',
                                '&:hover': { bgcolor: '#f5f5f5' }
                              }}
                            >
                              <ListItemIcon>
                                <FolderIcon color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={project.name}
                                secondary={formatSeconds(project.totalTime)}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                              {expandedProjects[`${app.name}_${project.name}`] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </ListItemButton>

                            {/* Modules under this project */}
                            <Collapse in={expandedProjects[`${app.name}_${project.name}`] || (selectedItemType === 'project' && selectedItem?.name === project.name)} timeout="auto">
                              <List component="div" disablePadding>
                                {project.modules?.map((module, moduleIndex) => (
                                  <ListItemButton
                                    key={moduleIndex}
                                    selected={selectedItemType === 'module' && selectedItem?.name === module.name && selectedItem?.parentProject?.name === project.name}
                                    onClick={() => handleSplitViewItemClick(module, 'module', app, project)}
                                    sx={{
                                      pl: 8,
                                      borderLeft: selectedItemType === 'module' && selectedItem?.name === module.name ? '4px solid #2e7d32' : '4px solid transparent',
                                      bgcolor: selectedItemType === 'module' && selectedItem?.name === module.name ? '#f1f8e9' : 'inherit',
                                      '&:hover': { bgcolor: '#f5f5f5' }
                                    }}
                                  >
                                    <ListItemIcon>
                                      <InsertDriveFileIcon color="success" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={module.name}
                                      secondary={formatSeconds(module.time)}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                  </ListItemButton>
                                ))}
                              </List>
                            </Collapse>
                          </React.Fragment>
                        ))}
                      </List>
                    </Collapse>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Grid>

            {/* Right Panel - Detail View */}
            <Grid item xs={8} sx={{ 
              p: 3, 
              height: '100%',
              overflow: 'auto'
            }}>
              {selectedItem ? (
                <Box>
                  {/* Breadcrumb showing context */}
                  {selectedItemType === 'module' && (
                    <Breadcrumbs sx={{ mb: 2 }} separator={<NavigateNextIcon fontSize="small" />}>
                      <Typography color="text.secondary">{selectedItem.parentApp?.name}</Typography>
                      <Typography color="text.secondary">{selectedItem.parentProject?.name}</Typography>
                      <Typography color="primary" fontWeight="bold">{selectedItem.name}</Typography>
                    </Breadcrumbs>
                  )}
                  {selectedItemType === 'project' && (
                    <Breadcrumbs sx={{ mb: 2 }} separator={<NavigateNextIcon fontSize="small" />}>
                      <Typography color="text.secondary">{selectedItem.parentApp?.name}</Typography>
                      <Typography color="primary" fontWeight="bold">{selectedItem.name}</Typography>
                    </Breadcrumbs>
                  )}

                  {/* App Details */}
                  {selectedItemType === 'app' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <AppsIcon sx={{ fontSize: 48 }} color="primary" />
                        <Box>
                          <Typography variant="h4">{selectedItem.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Application</Typography>
                        </Box>
                      </Box>
                      
                      <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
                        <Typography variant="h6" gutterBottom>Summary</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Total Focus Time</Typography>
                            <Typography variant="h5">{formatSeconds(selectedItem.focusTime)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Projects</Typography>
                            <Typography variant="h5">{selectedItem.projects?.length || 0}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      <Typography variant="h6" gutterBottom>Projects in this Application</Typography>
                      <List>
                        {selectedItem.projects?.map((project, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon><FolderIcon color="warning" /></ListItemIcon>
                            <ListItemText
                              primary={project.name}
                              secondary={`${formatSeconds(project.totalTime)} • ${project.modules.length} modules`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Project Details */}
                  {selectedItemType === 'project' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <FolderIcon sx={{ fontSize: 48 }} color="warning" />
                        <Box>
                          <Typography variant="h4">{selectedItem.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Project</Typography>
                        </Box>
                      </Box>
                      
                      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3e0' }}>
                        <Typography variant="h6" gutterBottom>Summary</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Total Time</Typography>
                            <Typography variant="h5">{formatSeconds(selectedItem.totalTime)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Modules</Typography>
                            <Typography variant="h5">{selectedItem.modules?.length || 0}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      <Typography variant="h6" gutterBottom>Modules in this Project</Typography>
                      <List>
                        {selectedItem.modules?.map((module, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon><InsertDriveFileIcon color="success" /></ListItemIcon>
                            <ListItemText
                              primary={module.name}
                              secondary={`${formatSeconds(module.time)} • ${module.switchCount} switches`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Module Details */}
                  {selectedItemType === 'module' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 48 }} color="success" />
                        <Box>
                          <Typography variant="h4">{selectedItem.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Module / File</Typography>
                        </Box>
                      </Box>
                      
                      <Paper sx={{ p: 2, bgcolor: '#f1f8e9' }}>
                        <Typography variant="h6" gutterBottom>Summary</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Time Spent</Typography>
                            <Typography variant="h5">{formatSeconds(selectedItem.time)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({Math.round(selectedItem.time)} seconds)
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Focus Switches</Typography>
                            <Typography variant="h5">{selectedItem.switchCount}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              times you switched to this file
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6">
                    Select an item from the left to view details
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitViewDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tree View Dialog - Style 2 */}
      <Dialog 
        open={treeViewDialogOpen} 
        onClose={() => setTreeViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AppsIcon />
            <Typography variant="h6">
              {treeViewData?.category} - Tree View
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Click to expand/collapse and explore all levels
          </Typography>
        </DialogTitle>
        <DialogContent>
          {treeViewData?.apps && treeViewData.apps.length > 0 ? (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {treeViewData.apps.map((app, appIndex) => (
                <React.Fragment key={appIndex}>
                  {/* Application Level */}
                  <ListItemButton 
                    onClick={() => toggleAppExpansion(app.name)}
                    sx={{ 
                      bgcolor: '#e3f2fd',
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#bbdefb' }
                    }}
                  >
                    <ListItemIcon>
                      <AppsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {app.name}
                          </Typography>
                          <Chip 
                            label={`${Math.round(app.focusTime / 60)} min`}
                            size="small" 
                            color="primary"
                          />
                          <Chip 
                            label={`${app.projects.length} projects`}
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    {expandedApps[app.name] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>

                  {/* Projects Level */}
                  <Collapse in={expandedApps[app.name]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {app.projects.map((project, projectIndex) => (
                        <React.Fragment key={projectIndex}>
                          <ListItemButton 
                            onClick={() => toggleProjectExpansion(app.name, project.name)}
                            sx={{ 
                              pl: 4,
                              bgcolor: '#fff3e0',
                              mb: 0.5,
                              borderRadius: 1,
                              '&:hover': { bgcolor: '#ffe0b2' }
                            }}
                          >
                            <ListItemIcon>
                              <FolderIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {project.name}
                                  </Typography>
                                  <Chip 
                                    label={`${Math.round(project.totalTime / 60)} min`}
                                    size="small" 
                                    color="warning"
                                  />
                                  <Chip 
                                    label={`${project.modules.length} modules`}
                                    size="small" 
                                    variant="outlined"
                                  />
                                </Box>
                              }
                            />
                            {expandedProjects[`${app.name}_${project.name}`] ? <ExpandLess /> : <ExpandMore />}
                          </ListItemButton>

                          {/* Modules Level */}
                          <Collapse in={expandedProjects[`${app.name}_${project.name}`]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {project.modules.map((module, moduleIndex) => (
                                <ListItem 
                                  key={moduleIndex}
                                  sx={{ 
                                    pl: 8,
                                    bgcolor: '#f1f8e9',
                                    mb: 0.5,
                                    borderRadius: 1
                                  }}
                                >
                                  <ListItemIcon>
                                    <InsertDriveFileIcon color="success" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2">
                                          {module.name}
                                        </Typography>
                                        <Chip 
                                          label={`${Math.round(module.time / 60)} min`}
                                          size="small" 
                                          color="success"
                                        />
                                        <Chip 
                                          label={`${module.switchCount} switches`}
                                          size="small" 
                                          variant="outlined"
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Collapse>
                        </React.Fragment>
                      ))}
                    </List>
                  </Collapse>
                  {appIndex < treeViewData.apps.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No detailed data available for this category.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTreeViewDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Original Work Pattern Dialog - Keep for comparison */}
      <Dialog 
        open={workPatternDialogOpen} 
        onClose={() => setWorkPatternDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedWorkPatternCategory?.label} - Details
        </DialogTitle>
        <DialogContent>
          {selectedWorkPatternCategory?.isBreaks ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Total idle/break time: <strong>{Math.round(selectedWorkPatternCategory.totalTime / 60)} minutes</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This represents time when no application activity was detected.
              </Typography>
            </Box>
          ) : (
            <>
              {selectedWorkPatternCategory?.apps && selectedWorkPatternCategory.apps.length > 0 ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click on an application to see projects and modules:
                  </Typography>
                  <List>
                    {selectedWorkPatternCategory.apps.map((app, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          button={app.hasFocusSwitches}
                          onClick={() => app.hasFocusSwitches && handleAppClick(app)}
                          sx={{
                            cursor: app.hasFocusSwitches ? 'pointer' : 'default',
                            '&:hover': app.hasFocusSwitches ? {
                              backgroundColor: '#f5f5f5'
                            } : {}
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1">{app.name}</Typography>
                                {app.hasFocusSwitches && (
                                  <Chip 
                                    label="Click for details" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={`Focus time: ${formatSeconds(app.focusTime)}`}
                          />
                        </ListItem>
                        {index < selectedWorkPatternCategory.apps.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No applications in this category with focus time.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkPatternDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog 
        open={projectDialogOpen} 
        onClose={() => setProjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {/* Breadcrumb Navigation */}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link
              component="button"
              variant="body1"
              onClick={() => {
                setProjectDialogOpen(false);
                setWorkPatternDialogOpen(true);
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {selectedWorkPatternCategory?.category || 'Category'}
            </Link>
            <Link
              component="button"
              variant="body1"
              onClick={() => {
                setProjectDialogOpen(false);
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {selectedAppProjects?.appName}
            </Link>
            <Typography color="text.primary">Projects</Typography>
          </Breadcrumbs>
        </DialogTitle>
        <DialogContent>
          {selectedAppProjects?.projects && selectedAppProjects.projects.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click on a project to see modules:
              </Typography>
              <List>
                {selectedAppProjects.projects.map((project, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      button
                      onClick={() => handleProjectClick(project, selectedAppProjects.appName)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              📁 {project.name}
                            </Typography>
                            <Chip 
                              label={`${project.modules.length} modules`}
                              size="small" 
                              color="info" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={`Total time: ${Math.round(project.totalTime / 60)} minutes (${Math.round(project.totalTime)} seconds)`}
                      />
                    </ListItem>
                    {index < selectedAppProjects.projects.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No project information available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)} color="primary">
            Back
          </Button>
        </DialogActions>
      </Dialog>

      {/* Module Details Dialog */}
      <Dialog 
        open={moduleDialogOpen} 
        onClose={() => setModuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {/* Breadcrumb Navigation */}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link
              component="button"
              variant="body1"
              onClick={() => {
                setModuleDialogOpen(false);
                setProjectDialogOpen(false);
                setWorkPatternDialogOpen(true);
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {selectedWorkPatternCategory?.category || 'Category'}
            </Link>
            <Link
              component="button"
              variant="body1"
              onClick={() => {
                setModuleDialogOpen(false);
                setProjectDialogOpen(true);
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {selectedProjectModules?.appName}
            </Link>
            <Link
              component="button"
              variant="body1"
              onClick={() => {
                setModuleDialogOpen(false);
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {selectedProjectModules?.projectName}
            </Link>
            <Typography color="text.primary">Modules</Typography>
          </Breadcrumbs>
        </DialogTitle>
        <DialogContent>
          {selectedProjectModules?.modules && selectedProjectModules.modules.length > 0 ? (
            <List>
              {selectedProjectModules.modules.map((module, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            📄 {module.name}
                          </Typography>
                          <Chip 
                            label={`${module.switchCount} switches`}
                            size="small" 
                            color="secondary" 
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={`Time spent: ${Math.round(module.time / 60)} minutes (${Math.round(module.time)} seconds)`}
                    />
                  </ListItem>
                  {index < selectedProjectModules.modules.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No modules found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Focus Per Hour Details Dialog */}
      <Dialog 
        open={categoryFocusDialogOpen} 
        onClose={() => setCategoryFocusDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCategoryFocusData?.category} - {selectedCategoryFocusData?.hour}
        </DialogTitle>
        <DialogContent>
          {selectedCategoryFocusData?.isBreaks ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Idle/Break time during {selectedCategoryFocusData?.hour}: <strong>{selectedCategoryFocusData?.idleMinutes} minutes</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This represents time when no application activity was detected during this hour.
              </Typography>
              <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ff9800' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  💡 About Breaks:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Breaks are essential for productivity and health. Regular breaks help maintain focus and prevent burnout.
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {selectedCategoryFocusData?.apps && selectedCategoryFocusData.apps.length > 0 ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Applications active during {selectedCategoryFocusData?.hour} in {selectedCategoryFocusData?.category}:
                  </Typography>
                  <List>
                    {selectedCategoryFocusData.apps.map((app, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={app.name}
                            secondary={`Focus time: ${formatSeconds(app.focusTime)}`}
                          />
                        </ListItem>
                        {index < selectedCategoryFocusData.apps.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No applications found in this category for this hour.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryFocusDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Overall Time Distribution Details Dialog */}
      <Dialog 
        open={timeDistributionDialogOpen} 
        onClose={() => setTimeDistributionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTimeDistribution?.category} - Detailed Breakdown
        </DialogTitle>
        <DialogContent>
          {selectedTimeDistribution?.isIdle ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Total idle time: <strong>{(selectedTimeDistribution.totalTime * 60).toFixed(0)} minutes</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This represents time when the system was idle or no application activity was detected.
              </Typography>
            </Box>
          ) : (
            <>
              {selectedTimeDistribution?.apps && selectedTimeDistribution.apps.length > 0 ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Applications in {selectedTimeDistribution?.category} category:
                  </Typography>
                  <List>
                    {selectedTimeDistribution.apps.map((app, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={app.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Focus time: {formatSeconds(app.focusTime)}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Running time: {formatSeconds(app.runningTime)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedTimeDistribution.apps.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No applications found in this category.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeDistributionDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Heatmap Hour Details Dialog */}
      <Dialog 
        open={heatmapDialogOpen} 
        onClose={() => setHeatmapDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Hour {selectedHeatmapHour?.hour} - Activity Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Summary:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              🎯 Productive Focus: <strong>{selectedHeatmapHour?.productiveFocus} minutes</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              📞 Communication: <strong>{selectedHeatmapHour?.communicationFocus} minutes</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              ☕ Idle: <strong>{selectedHeatmapHour?.idle} minutes</strong>
            </Typography>
          </Box>
          
          {selectedHeatmapHour?.apps && selectedHeatmapHour.apps.length > 0 ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Active Applications:</strong>
              </Typography>
              <List>
                {selectedHeatmapHour.apps.map((app, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={app.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Category: {app.category}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Focus time: {formatSeconds(app.focusTime)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < selectedHeatmapHour.apps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No application activity during this hour.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHeatmapDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Timeline Dialog - Shows Focus Switches Timeline for a Module */}
      <Dialog 
        open={timelineDialogOpen} 
        onClose={() => setTimelineDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InsertDriveFileIcon color="primary" />
            <Box>
              <Typography variant="h6">
                {selectedModuleTimeline?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Focus Switches Timeline
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                  <Typography variant="caption" color="text.secondary">Total Time</Typography>
                  <Typography variant="h5" color="primary">
                    {selectedModuleTimeline ? Math.round(selectedModuleTimeline.time / 60) : 0} min
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                  <Typography variant="caption" color="text.secondary">Focus Switches</Typography>
                  <Typography variant="h5" color="secondary">
                    {selectedModuleTimeline?.switchCount || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                  <Typography variant="caption" color="text.secondary">Avg Duration</Typography>
                  <Typography variant="h5" color="success.main">
                    {selectedModuleTimeline ? Math.round(selectedModuleTimeline.time / selectedModuleTimeline.switchCount) : 0}s
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            ⏱️ Timeline of Activity
          </Typography>

          {selectedModuleTimeline?.focusSwitches && selectedModuleTimeline.focusSwitches.length > 0 ? (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {selectedModuleTimeline.focusSwitches
                .sort((a, b) => new Date(a.from) - new Date(b.from))
                .map((fs, index) => {
                  const from = new Date(fs.from);
                  const to = new Date(fs.to);
                  const duration = Math.round((to - from) / 1000);
                  
                  return (
                    <Card key={index} sx={{ mb: 2, bgcolor: index % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" color="primary">
                            Session {index + 1}
                          </Typography>
                          <Chip 
                            label={`${duration}s`} 
                            size="small" 
                            color="success"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            🕐 From: <strong>{from.toLocaleTimeString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            →
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            🕐 To: <strong>{to.toLocaleTimeString()}</strong>
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Window: {fs.window_title}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No focus switches data available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chatbot Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="chat"
        onClick={handleChatOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          }
        }}
      >
        <Badge badgeContent={chatMessages.length > 0 ? '•' : null} color="error">
          <ChatIcon />
        </Badge>
      </Fab>

      {/* Chatbot Dialog */}
      <Dialog
        open={chatOpen}
        onClose={handleChatClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 90,
            right: 24,
            m: 0,
            maxHeight: '600px',
            height: '600px',
            maxWidth: '450px',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon />
            <Typography variant="h6">Work Pattern AI Assistant</Typography>
          </Box>
          <IconButton onClick={handleChatClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: 'calc(100% - 130px)' }}>
          {/* Chat Messages */}
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {chatMessages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1
                }}
              >
                {message.role === 'assistant' && (
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <SmartToyIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '75%',
                    borderRadius: 2,
                    bgcolor: message.role === 'user' 
                      ? 'primary.main' 
                      : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Paper>
                {message.role === 'user' && (
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                )}
              </Box>
            ))}
            {chatLoading && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <SmartToyIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.100' }}>
                  <CircularProgress size={20} />
                </Paper>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* Quick Action Buttons */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Quick Actions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  setChatInput('Generate an Excel report of my work patterns');
                  handleChatSend();
                }}
                disabled={chatLoading}
              >
                Generate Report
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setChatInput('What were my most productive hours today?')}
                disabled={chatLoading}
              >
                Productivity
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setChatInput('Analyze my focus time distribution')}
                disabled={chatLoading}
              >
                Focus Time
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Ask about your work patterns..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSend();
              }
            }}
            disabled={chatLoading}
            size="small"
            sx={{ mr: 1 }}
          />
          <IconButton 
            color="primary" 
            onClick={handleChatSend}
            disabled={!chatInput.trim() || chatLoading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
              '&:disabled': {
                background: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkPatterns;
