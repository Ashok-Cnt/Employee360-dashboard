const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Configuration - read dynamically to allow runtime changes
const getAIProvider = () => process.env.AI_PROVIDER || 'openai';

// Get data directory from environment or use default
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data-collector/activity_data');

/**
 * Get the current logged-in username
 */
function getLoggedInUsername() {
  return process.env.USER_ID || os.userInfo().username || 'Admin';
}

// Initialize OpenAI client (lazy initialization)
let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000,
    });
  }
  return openai;
}

// Function to call OpenAI API
async function callOpenAI(messages) {
  const openaiClient = getOpenAI();
  if (!openaiClient) {
    throw new Error('OpenAI client not configured');
  }
  
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content;
}

// Get activity data for a specific date
async function getActivityData(date, userId = null) {
  try {
    const username = userId || getLoggedInUsername();
    const filePath = path.join(DATA_DIR, `activity_${date}_${username}.jsonl`);
    
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    
    if (lines.length === 0) {
      return null;
    }
    
    // The last snapshot contains cumulative data for the entire day
    const data = JSON.parse(lines[lines.length - 1]);
    return data;
  } catch (error) {
    console.error('Error reading activity data:', error);
    return null;
  }
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, date, conversationHistory, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get work pattern data for the specified date
    const activityData = await getActivityData(
      date || new Date().toISOString().split('T')[0], 
      userId
    );

    if (!activityData) {
      return res.status(404).json({ 
        error: 'No work pattern data found for the specified date',
        response: 'I could not find work pattern data for the specified date. Please select a different date or check if the activity collector is running.'
      });
    }

    // Prepare context about the work pattern data
    const contextData = {
      date: activityData.date,
      totalActiveTime: activityData.system?.aggregates?.overallMonitoringHours || 0,
      productiveHours: activityData.system?.aggregates?.productiveHours || 0,
      communicationHours: activityData.system?.aggregates?.communicationHours || 0,
      idleHours: activityData.system?.aggregates?.idleHours || 0,
      topApps: activityData.apps?.slice(0, 5).map(app => ({
        name: app.name,
        category: app.category,
        focusTime: Math.round((app.focusDurationSec || 0) / 60)
      })) || [],
      hourlySummary: activityData.hourlySummary || []
    };

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant specialized in analyzing work patterns and productivity data. 
You have access to work pattern data for ${contextData.date}.

Here's the data summary:
- Total Active Time: ${contextData.totalActiveTime.toFixed(2)} hours
- Productive Hours: ${contextData.productiveHours.toFixed(2)} hours
- Communication Hours: ${contextData.communicationHours.toFixed(2)} hours
- Idle Hours: ${contextData.idleHours.toFixed(2)} hours
- Top Applications: ${contextData.topApps.map(app => `${app.name} (${app.category}, ${app.focusTime} min)`).join(', ')}

You can:
1. Answer questions about work patterns, productivity, and time distribution
2. Provide insights and recommendations based on the data
3. Explain trends and patterns in the work day
4. If user asks to create/generate an Excel report, respond with: "GENERATE_EXCEL_REPORT" followed by a brief description of what the report will contain

Always be helpful, concise, and data-driven in your responses.`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI
    const aiProvider = getAIProvider();
    console.log(`💬 Processing chat message with ${aiProvider}`);
    
    const response = await callOpenAI(messages);

    // Check if user requested Excel report generation
    if (response.includes('GENERATE_EXCEL_REPORT')) {
      return res.json({
        response: response.replace('GENERATE_EXCEL_REPORT', '').trim(),
        action: 'generate_excel',
        data: activityData
      });
    }

    res.json({
      response,
      data: contextData
    });

  } catch (error) {
    console.error('❌ Error in work pattern chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      response: 'Sorry, I encountered an error processing your request. Please try again.'
    });
  }
});

// Generate Excel report
router.post('/generate-excel', async (req, res) => {
  try {
    const { date, userId } = req.body;

    // Get work pattern data
    const activityData = await getActivityData(
      date || new Date().toISOString().split('T')[0],
      userId
    );

    if (!activityData) {
      return res.status(404).json({ error: 'No work pattern data found' });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Work Pattern Report'],
      ['Date', activityData.date],
      [],
      ['Overall Statistics'],
      ['Total Active Time (hours)', activityData.system?.aggregates?.overallMonitoringHours || 0],
      ['Productive Hours', activityData.system?.aggregates?.productiveHours || 0],
      ['Communication Hours', activityData.system?.aggregates?.communicationHours || 0],
      ['Idle Hours', activityData.system?.aggregates?.idleHours || 0],
      [],
      ['Productivity Metrics'],
      ['Focus Time %', activityData.system?.aggregates?.productiveHours && activityData.system?.aggregates?.overallMonitoringHours 
        ? Math.round((activityData.system.aggregates.productiveHours / activityData.system.aggregates.overallMonitoringHours) * 100)
        : 0],
      ['Communication %', activityData.system?.aggregates?.communicationHours && activityData.system?.aggregates?.overallMonitoringHours 
        ? Math.round((activityData.system.aggregates.communicationHours / activityData.system.aggregates.overallMonitoringHours) * 100)
        : 0],
      ['Idle %', activityData.system?.aggregates?.idleHours && activityData.system?.aggregates?.overallMonitoringHours 
        ? Math.round((activityData.system.aggregates.idleHours / activityData.system.aggregates.overallMonitoringHours) * 100)
        : 0],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Applications Sheet
    const appsData = [
      ['Application', 'Category', 'Focus Time (minutes)', 'Active Time (minutes)']
    ];
    
    if (activityData.apps && Array.isArray(activityData.apps)) {
      activityData.apps.forEach(app => {
        appsData.push([
          app.name || 'Unknown',
          app.category || 'Uncategorized',
          Math.round((app.focusDurationSec || 0) / 60),
          Math.round((app.activeDurationSec || 0) / 60)
        ]);
      });
    }
    const appsSheet = XLSX.utils.aoa_to_sheet(appsData);
    XLSX.utils.book_append_sheet(workbook, appsSheet, 'Applications');

    // Hourly Summary Sheet
    const hourlyData = [
      ['Hour', 'Focus Time (minutes)', 'Active Time (minutes)', 'Productive Time (minutes)', 'Communication Time (minutes)']
    ];
    
    if (activityData.hourlySummary && Array.isArray(activityData.hourlySummary)) {
      activityData.hourlySummary.forEach(hour => {
        hourlyData.push([
          `${hour.hour}:00`,
          Math.round((hour.focusSec || 0) / 60),
          Math.round((hour.activeSec || 0) / 60),
          Math.round((hour.productiveSec || 0) / 60),
          Math.round((hour.communicationSec || 0) / 60)
        ]);
      });
    }
    const hourlySheet = XLSX.utils.aoa_to_sheet(hourlyData);
    XLSX.utils.book_append_sheet(workbook, hourlySheet, 'Hourly Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=work-pattern-${activityData.date}.xlsx`);
    
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error generating Excel report:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

module.exports = router;
