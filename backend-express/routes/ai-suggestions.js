const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration - supports both Ollama and OpenAI
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama'; // 'ollama' or 'openai'
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// Initialize OpenAI client (only if using OpenAI)
let openai = null;
if (AI_PROVIDER === 'openai') {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Function to call Ollama API
async function callOllama(prompt, systemPrompt) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: `${systemPrompt}\n\n${prompt}`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 1500,
      }
    });

    return response.data.response;
  } catch (error) {
    console.error('Ollama API error:', error.message);
    throw new Error(`Ollama is not available. Please ensure Ollama is running and ${OLLAMA_MODEL} model is installed.`);
  }
}

// Function to call OpenAI API
async function callOpenAI(prompt, systemPrompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" }
  });

  return completion.choices[0].message.content;
}

// Generic function to call AI provider
async function callAI(prompt, systemPrompt) {
  if (AI_PROVIDER === 'ollama') {
    console.log(`🦙 Using Ollama (${OLLAMA_MODEL}) at ${OLLAMA_URL}`);
    return await callOllama(prompt, systemPrompt);
  } else if (AI_PROVIDER === 'openai') {
    console.log('🤖 Using OpenAI (gpt-4o-mini)');
    return await callOpenAI(prompt, systemPrompt);
  } else {
    throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }
}

// Generate AI-powered suggestions based on work patterns
router.post('/generate', async (req, res) => {
  try {
    // Get work patterns data from request body
    const { workPatterns, appStats, focusedWindow, currentApps, leaveDays, courses, battery, memory, productivityScore } = req.body;

    // Validate that we have the necessary data
    if (!workPatterns || !workPatterns.metrics) {
      return res.status(400).json({ 
        error: 'Work patterns data is required',
        suggestions: [] 
      });
    }

    const metrics = workPatterns.metrics;
    const patterns = workPatterns.work_patterns || [];

    // Prepare context for OpenAI
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    // Build comprehensive context
    const workContext = {
      timeOfDay,
      totalActiveMinutes: metrics.total_active_time_minutes,
      focusTimePercentage: metrics.focus_time_percentage,
      meetingTimePercentage: metrics.meeting_time_percentage,
      breakTimePercentage: metrics.break_time_percentage,
      productivityScore: productivityScore || metrics.productivity_score,
      uniqueApplications: appStats?.unique_applications || 0,
      currentlyActiveApps: currentApps?.length || 0,
      focusedApp: focusedWindow?.application || 'None',
      patterns: patterns.map(p => ({
        type: p.pattern,
        timeSpent: p.total_time_minutes,
        percentage: p.percentage,
      })),
      // New data fields
      leaveDays: {
        totalDays: leaveDays?.totalDays || 0,
        recentLeaves: leaveDays?.recentLeaves || []
      },
      courses: {
        totalCourses: courses?.totalCourses || 0,
        completedCourses: courses?.completedCourses || 0,
        recentCourses: courses?.recentCourses || [],
        daysWithLearning: courses?.daysWithLearning || 0
      },
      battery: battery || null,
      memory: {
        totalUsageMB: memory?.totalUsageMB || 0,
        totalUsageGB: memory?.totalUsageGB || 0
      }
    };

    // Create the prompt for OpenAI
    const prompt = `You are an AI productivity coach analyzing employee work patterns. Based on the following data, provide 3-5 personalized, actionable suggestions to improve productivity and well-being.

IMPORTANT: Your suggestions MUST reference the specific numbers and data points below. Do not give generic advice - use the actual values provided.

**Current Context:**
- Time of Day: ${workContext.timeOfDay}
- Total Active Time: ${Math.floor(workContext.totalActiveMinutes / 60)}h ${Math.round(workContext.totalActiveMinutes % 60)}m
- Focus Time: ${workContext.focusTimePercentage}%
- Meeting Time: ${workContext.meetingTimePercentage}%
- Break Time: ${workContext.breakTimePercentage}%
- Productivity Score: ${workContext.productivityScore}%
- Currently Active Apps: ${workContext.currentlyActiveApps}
- Unique Apps Used: ${workContext.uniqueApplications}
- Currently Focused On: ${workContext.focusedApp}

**Work Pattern Breakdown:**
${workContext.patterns.map(p => `- ${p.type}: ${p.timeSpent.toFixed(0)} minutes (${p.percentage}%)`).join('\n')}

**USER'S LEAVE & TIME OFF DATA (MUST REFERENCE IN SUGGESTIONS):**
- Leave Days Taken (Recent): ${workContext.leaveDays.totalDays} days
${workContext.leaveDays.recentLeaves.length > 0 ? `- Recent Leave Dates: ${workContext.leaveDays.recentLeaves.map(l => `${l.date} (${l.dayOfWeek}, ${l.runningHours.toFixed(1)}h worked)`).join(', ')}` : '- No recent leave days recorded'}
- Analysis: ${workContext.leaveDays.totalDays < 5 ? 'User needs to plan more time off for rest and rejuvenation' : 'Good balance of work and time off'}

**USER'S LEARNING & DEVELOPMENT DATA (MUST REFERENCE IN SUGGESTIONS):**
- Total Courses: ${workContext.courses.totalCourses}
- Completed Courses: ${workContext.courses.completedCourses}
- Days with Learning Activity: ${workContext.courses.daysWithLearning}
${workContext.courses.recentCourses.length > 0 ? `- Recent Courses: ${workContext.courses.recentCourses.map(c => `${c.title} (${c.progress}% complete)`).join(', ')}` : '- No recent course activity'}
- Analysis: ${workContext.courses.completedCourses > 0 ? `User has completed ${workContext.courses.completedCourses} courses - encourage next steps` : 'User should start a learning path to enhance skills'}

**USER'S SYSTEM RESOURCES DATA (MUST REFERENCE IN SUGGESTIONS):**
- Memory Usage: ${workContext.memory.totalUsageGB} GB (${workContext.memory.totalUsageMB.toFixed(0)} MB)
${workContext.memory.totalUsageMB > 8000 ? '- HIGH MEMORY USAGE - Suggest closing specific apps' : '- Memory usage is within normal range'}
${workContext.battery ? `- Battery: ${workContext.battery.percent}% (${workContext.battery.status})${workContext.battery.status === 'low' ? ' - CRITICAL: User needs to charge device' : ''}` : '- Battery: Desktop system (no battery)'}

**CRITICAL REQUIREMENTS:**
1. YOU MUST mention at least 2-3 of these SPECIFIC data points in your suggestions:
   - The exact number of leave days (${workContext.leaveDays.totalDays} days)
   - The exact number of completed courses (${workContext.courses.completedCourses} courses)
   - The exact memory usage (${workContext.memory.totalUsageGB} GB)
   - The exact battery percentage (${workContext.battery ? workContext.battery.percent + '%' : 'N/A'})
   - The exact productivity score (${workContext.productivityScore}%)
   
2. Provide 3-5 suggestions with varying priority levels (high, medium, low)
3. Each suggestion should have:
   - A clear, concise title (max 6 words)
   - A brief description that MENTIONS THE ACTUAL DATA (e.g., "You've taken 2 leave days..." or "Your memory usage at 12.5 GB...")
   - 2-4 specific, actionable items
   - A category (productivity, wellbeing, balance, learning, or system)
   - A priority level (high, medium, or low)
4. Be empathetic, encouraging, and specific
4. Consider ALL the data points above:
   - Focus/productivity scores (suggest improvements for low scores, encourage breaks for high scores)
   - Idle time (suggest taking proper breaks if too low, or focus techniques if too high)
   - Leave days (suggest planning time off, utilizing leave balance wisely)
   - Courses (recommend next courses based on completed ones, encourage consistent learning)
   - Memory usage (suggest closing apps, optimizing system performance)
   - Battery (remind to charge, optimize battery settings)
   - Application usage patterns (suggest better app organization, time management)
5. Balance productivity with well-being
6. If the user is doing well, acknowledge it with positive reinforcement

Format your response as a JSON array of suggestion objects with this structure:
[
  {
    "title": "Clear, actionable title",
    "description": "Brief explanation of why this matters based on their specific data",
    "category": "productivity|wellbeing|balance|learning|system",
    "priority": "high|medium|low",
    "actionItems": [
      "Specific action 1 based on their data",
      "Specific action 2 based on their data",
      "Specific action 3 based on their data"
    ]
  }
]

Respond ONLY with valid JSON, no additional text.`;

    const systemPrompt = 'You are an expert AI productivity coach specializing in work-life balance and employee well-being. You provide personalized, actionable suggestions based on work pattern analysis. Always respond with valid JSON only.';

    console.log(`Calling ${AI_PROVIDER.toUpperCase()} with work patterns data...`);
    console.log('📊 Work Context Data:', JSON.stringify({
      leaveDays: workContext.leaveDays,
      courses: workContext.courses,
      battery: workContext.battery,
      memory: workContext.memory,
      productivityScore: workContext.productivityScore
    }, null, 2));

    console.log('\n🔍 FULL PROMPT BEING SENT TO AI:\n', prompt);

    // Call AI provider (Ollama or OpenAI)
    const responseText = await callAI(prompt, systemPrompt);
    console.log('\n✅ FULL AI RESPONSE:\n', responseText);
    console.log('\n📏 Response length:', responseText.length, 'characters');

    // Write to debug file for inspection
    const debugLogPath = path.join(__dirname, '..', 'ai-debug.log');
    const debugData = `
=== AI REQUEST DEBUG LOG ===
Timestamp: ${new Date().toISOString()}

WORK CONTEXT:
${JSON.stringify(workContext, null, 2)}

PROMPT SENT TO AI:
${prompt}

RESPONSE FROM AI:
${responseText}

=== END DEBUG LOG ===
\n\n`;
    fs.appendFileSync(debugLogPath, debugData);
    console.log('📝 Debug log written to:', debugLogPath);

    // Parse the response
    let suggestions;
    try {
      const parsed = JSON.parse(responseText);
      // Handle both direct array and object with suggestions property
      suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI suggestions');
    }

    // Add IDs and icons to suggestions
    const enhancedSuggestions = suggestions.map((suggestion, index) => ({
      id: `ai-suggestion-${index}-${Date.now()}`,
      ...suggestion,
      icon: getCategoryIcon(suggestion.category),
      color: getPriorityColor(suggestion.priority),
    }));

    res.json({
      success: true,
      suggestions: enhancedSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : 'gpt-4o-mini',
        provider: AI_PROVIDER,
        context: workContext,
      }
    });

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    
    // Provide fallback suggestions if OpenAI fails
    const fallbackSuggestions = getFallbackSuggestions(req.body);
    
    res.json({
      success: false,
      error: error.message,
      suggestions: fallbackSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        fallback: true,
      }
    });
  }
});

// Helper function to get icon name based on category
function getCategoryIcon(category) {
  const icons = {
    productivity: 'Work',
    wellbeing: 'FitnessCenter',
    balance: 'Schedule',
    learning: 'Psychology',
    system: 'Memory',
  };
  return icons[category] || 'Lightbulb';
}

// Helper function to get color based on priority
function getPriorityColor(priority) {
  const colors = {
    high: '#f44336',
    medium: '#ff9800',
    low: '#4caf50',
  };
  return colors[priority] || '#2196f3';
}

// Fallback suggestions when OpenAI is not available
function getFallbackSuggestions(data) {
  const suggestions = [];
  const metrics = data.workPatterns?.metrics;

  if (!metrics) {
    return [{
      id: 'fallback-1',
      title: 'Keep Working Smart',
      description: 'Continue your current work patterns and maintain good habits.',
      category: 'productivity',
      priority: 'low',
      actionItems: [
        'Take regular breaks',
        'Stay hydrated',
        'Maintain work-life balance',
      ],
      icon: 'Lightbulb',
      color: '#4caf50',
    }];
  }

  if (metrics.focus_time_percentage < 40) {
    suggestions.push({
      id: 'fallback-focus',
      title: 'Increase Focus Time',
      description: `Your focus time is at ${metrics.focus_time_percentage}%. Consider blocking dedicated time for deep work.`,
      category: 'productivity',
      priority: 'high',
      actionItems: [
        'Schedule 2-hour focus blocks',
        'Use "Do Not Disturb" mode',
        'Close unnecessary applications',
      ],
      icon: 'Work',
      color: '#f44336',
    });
  }

  if (metrics.break_time_percentage < 10 && metrics.total_active_time_minutes > 120) {
    suggestions.push({
      id: 'fallback-breaks',
      title: 'Take More Breaks',
      description: 'You need more breaks to maintain productivity and well-being.',
      category: 'wellbeing',
      priority: 'high',
      actionItems: [
        'Take a 5-10 minute break every hour',
        'Practice the 20-20-20 rule for eye health',
        'Stand up and stretch',
      ],
      icon: 'Coffee',
      color: '#ff9800',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'fallback-positive',
      title: 'Great Work Today!',
      description: 'Your work patterns look healthy. Keep it up!',
      category: 'balance',
      priority: 'low',
      actionItems: [
        'Maintain your current routine',
        'Share your productivity tips with colleagues',
        'Reward yourself for good work',
      ],
      icon: 'Star',
      color: '#4caf50',
    });
  }

  return suggestions;
}

// Health check endpoint
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  res.json({ 
    status: 'healthy',
    openai_configured: hasApiKey,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
