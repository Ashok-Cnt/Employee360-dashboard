const express = require('express');
const router = express.Router();
const axios = require('axios');

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

// Helper function to get current active user
async function getCurrentActiveUser(db) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentActivity = await db.collection('application_activity')
      .findOne(
        { timestamp: { $gte: fiveMinutesAgo } },
        { sort: { timestamp: -1 } }
      );
    
    if (recentActivity) {
      return recentActivity.user_id;
    }
    
    const latestActivity = await db.collection('application_activity')
      .findOne({}, { sort: { timestamp: -1 } });
    
    return latestActivity ? latestActivity.user_id : 'Admin';
  } catch (error) {
    console.error('Error getting current active user:', error);
    return 'Admin';
  }
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
    const db = req.app.locals.db();
    const userId = req.body.user_id || await getCurrentActiveUser(db);
    
    // Get work patterns data from request body
    const { workPatterns, appStats, focusedWindow, currentApps } = req.body;

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
      productivityScore: metrics.productivity_score,
      uniqueApplications: appStats?.unique_applications || 0,
      currentlyActiveApps: currentApps?.length || 0,
      focusedApp: focusedWindow?.application || 'None',
      patterns: patterns.map(p => ({
        type: p.pattern,
        timeSpent: p.total_time_minutes,
        percentage: p.percentage,
      })),
    };

    // Create the prompt for OpenAI
    const prompt = `You are an AI productivity coach analyzing employee work patterns. Based on the following data, provide 3-5 personalized, actionable suggestions to improve productivity and well-being.

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

**Requirements:**
1. Provide 3-5 suggestions with varying priority levels (high, medium, low)
2. Each suggestion should have:
   - A clear, concise title (max 6 words)
   - A brief description (1-2 sentences)
   - 2-4 specific, actionable items
   - A category (productivity, wellbeing, or balance)
   - A priority level (high, medium, or low)
3. Be empathetic, encouraging, and specific
4. Consider the time of day and current work patterns
5. Balance productivity with well-being
6. If the user is doing well, acknowledge it with positive reinforcement

Format your response as a JSON array of suggestion objects with this structure:
[
  {
    "title": "Clear, actionable title",
    "description": "Brief explanation of why this matters",
    "category": "productivity|wellbeing|balance",
    "priority": "high|medium|low",
    "actionItems": [
      "Specific action 1",
      "Specific action 2",
      "Specific action 3"
    ]
  }
]

Respond ONLY with valid JSON, no additional text.`;

    const systemPrompt = 'You are an expert AI productivity coach specializing in work-life balance and employee well-being. You provide personalized, actionable suggestions based on work pattern analysis. Always respond with valid JSON only.';

    console.log(`Calling ${AI_PROVIDER.toUpperCase()} with work patterns data...`);

    // Call AI provider (Ollama or OpenAI)
    const responseText = await callAI(prompt, systemPrompt);
    console.log('AI Response received:', responseText.substring(0, 200) + '...');

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
