const express = require('express');
const router = express.Router();
const axios = require('axios');

// Configuration - supports both Ollama and OpenAI
// Read dynamically from process.env to allow runtime changes
const getAIProvider = () => process.env.AI_PROVIDER || 'openai';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// Initialize OpenAI client (lazy initialization)
let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout
    });
  }
  return openai;
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
    }, { timeout: 30000 });

    return response.data.response;
  } catch (error) {
    console.error('Ollama API error:', error.message);
    throw new Error(`Ollama is not available. Please ensure Ollama is running and ${OLLAMA_MODEL} model is installed.`);
  }
}

// Function to call OpenAI API
async function callOpenAI(prompt, systemPrompt) {
  const openaiClient = getOpenAI();
  if (!openaiClient) {
    throw new Error('OpenAI client not configured');
  }
  
  const completion = await openaiClient.chat.completions.create({
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
  const aiProvider = getAIProvider();
  
  if (aiProvider === 'ollama') {
    console.log(`🦙 Using Ollama (${OLLAMA_MODEL}) at ${OLLAMA_URL}`);
    return await callOllama(prompt, systemPrompt);
  } else if (aiProvider === 'openai') {
    console.log('🤖 Using OpenAI (gpt-4o-mini)');
    return await callOpenAI(prompt, systemPrompt);
  } else {
    throw new Error(`Unknown AI provider: ${aiProvider}`);
  }
}

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

// Fallback suggestions when AI is not available
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

// Generate AI-powered suggestions based on work patterns
router.post('/generate', async (req, res) => {
  try {
    // Get work patterns data from request body
    const { workPatterns, appStats, focusedWindow, currentApps, leaveDays, courses, battery, memory, productivityScore } = req.body;

    console.log('📥 Received request:', {
      hasWorkPatterns: !!workPatterns,
      hasMetrics: !!workPatterns?.metrics,
      hasAppStats: !!appStats,
      hasFocusedWindow: !!focusedWindow,
      hasLeaveDays: !!leaveDays,
      hasCourses: !!courses,
      hasBattery: !!battery,
      hasMemory: !!memory,
      hasProductivityScore: !!productivityScore
    });

    // Validate that we have the necessary data
    if (!workPatterns || !workPatterns.metrics) {
      console.warn('⚠️ Missing work patterns data, using fallback suggestions');
      const fallbackSuggestions = getFallbackSuggestions(req.body);
      return res.json({ 
        success: false,
        error: 'Work patterns data is required',
        suggestions: fallbackSuggestions,
        metadata: {
          generatedAt: new Date().toISOString(),
          fallback: true,
        }
      });
    }

    const metrics = workPatterns.metrics;
    const patterns = workPatterns.work_patterns || [];

    // Prepare context for AI
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
      // User's personalized data
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

    console.log('📊 Work Context Data:', JSON.stringify({
      leaveDays: workContext.leaveDays,
      courses: workContext.courses,
      battery: workContext.battery,
      memory: workContext.memory,
      productivityScore: workContext.productivityScore
    }, null, 2));

    // Create the prompt for AI
    const prompt = `You are an AI productivity coach analyzing employee work patterns. Based on the following data, provide 3-5 personalized, actionable suggestions to improve productivity and well-being.

**CRITICAL: Your suggestions MUST reference the specific numbers and data points below. Do not give generic advice - use the actual values provided.**

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

**USER'S LEAVE & TIME OFF DATA (MUST REFERENCE):**
- Leave Days Taken: ${workContext.leaveDays.totalDays} days
${workContext.leaveDays.recentLeaves.length > 0 ? `- Recent Leave Dates: ${workContext.leaveDays.recentLeaves.map(l => `${l.date} (${l.dayOfWeek}, ${l.runningHours.toFixed(1)}h)`).join(', ')}` : '- No recent leave recorded'}

**USER'S LEARNING & DEVELOPMENT DATA (MUST REFERENCE):**
- Total Courses: ${workContext.courses.totalCourses}
- Completed Courses: ${workContext.courses.completedCourses}
- Days with Learning: ${workContext.courses.daysWithLearning}
${workContext.courses.recentCourses.length > 0 ? `- Recent Courses: ${workContext.courses.recentCourses.map(c => `${c.title} (${c.progress}% complete)`).join(', ')}` : ''}

**USER'S SYSTEM RESOURCES (MUST REFERENCE):**
- Memory Usage: ${workContext.memory.totalUsageGB} GB (${workContext.memory.totalUsageMB.toFixed(0)} MB)
${workContext.memory.totalUsageMB > 8000 ? '- ⚠️ HIGH MEMORY - Suggest closing apps' : ''}
${workContext.battery ? `- Battery: ${workContext.battery.percent}% (${workContext.battery.status})` : '- Battery: Desktop (no battery)'}

**REQUIREMENTS:**
1. YOU MUST mention at least 2-3 specific data points in your suggestions (e.g., "You've taken ${workContext.leaveDays.totalDays} leave days", "Your memory is at ${workContext.memory.totalUsageGB} GB", "You've completed ${workContext.courses.completedCourses} courses")
2. Provide 3-5 suggestions with varying priority levels (high, medium, low)
3. Each suggestion should have:
   - A clear, concise title (max 6 words)
   - A brief description that MENTIONS THE ACTUAL DATA
   - 2-4 specific, actionable items
   - A category (productivity, wellbeing, balance, learning, or system)
   - A priority level (high, medium, or low)
4. Be empathetic, encouraging, and specific
5. Balance productivity with well-being

Format your response as a JSON object with a "suggestions" array:
{
  "suggestions": [
    {
      "title": "Clear, actionable title",
      "description": "Brief explanation referencing their specific data",
      "category": "productivity|wellbeing|balance|learning|system",
      "priority": "high|medium|low",
      "actionItems": [
        "Specific action based on their data",
        "Another specific action",
        "One more action"
      ]
    }
  ]
}

Respond ONLY with valid JSON, no additional text.`;

    const systemPrompt = 'You are an expert AI productivity coach specializing in work-life balance and employee well-being. You provide personalized, actionable suggestions based on work pattern analysis. Always respond with valid JSON only.';

    const aiProvider = getAIProvider();
    console.log(`🚀 Calling ${aiProvider.toUpperCase()} with work patterns data...`);

    // Call AI provider (Ollama or OpenAI)
    const responseText = await callAI(prompt, systemPrompt);
    console.log('✅ AI Response received:', responseText.substring(0, 200) + '...');

    // Parse the response
    let suggestions;
    try {
      const parsed = JSON.parse(responseText);
      // Handle both direct array and object with suggestions property
      suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse AI suggestions');
    }

    // Add IDs and icons to suggestions
    const enhancedSuggestions = suggestions.map((suggestion, index) => ({
      id: `ai-suggestion-${index}-${Date.now()}`,
      ...suggestion,
      icon: getCategoryIcon(suggestion.category),
      color: getPriorityColor(suggestion.priority),
    }));

    const providerInfo = getAIProvider();
    res.json({
      success: true,
      suggestions: enhancedSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: providerInfo === 'ollama' ? OLLAMA_MODEL : 'gpt-4o-mini',
        provider: providerInfo,
        context: workContext,
      }
    });

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    
    // Provide fallback suggestions if AI fails
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

// Get AI suggestions for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'Admin';
    const suggestions = await req.app.locals.readJSONFile(req.app.locals.files.suggestions);
    
    // Filter by user if specified
    const userSuggestions = userId 
      ? suggestions.filter(s => s.user_id === userId)
      : suggestions;
    
    res.json(userSuggestions);
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch AI suggestions' });
  }
});

// Create new AI suggestion
router.post('/', async (req, res) => {
  try {
    const newSuggestion = {
      ...req.body,
      id: Date.now().toString(),
      created_at: new Date(),
      status: req.body.status || 'pending'
    };
    
    const suggestions = await req.app.locals.readJSONFile(req.app.locals.files.suggestions);
    suggestions.push(newSuggestion);
    
    await req.app.locals.writeJSONFile(req.app.locals.files.suggestions, suggestions);
    res.json({ success: true, suggestion: newSuggestion });
  } catch (error) {
    console.error('Error creating AI suggestion:', error);
    res.status(500).json({ error: 'Failed to create AI suggestion' });
  }
});

// Update AI suggestion status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const suggestions = await req.app.locals.readJSONFile(req.app.locals.files.suggestions);
    
    const index = suggestions.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    suggestions[index] = { ...suggestions[index], ...req.body, updated_at: new Date() };
    
    await req.app.locals.writeJSONFile(req.app.locals.files.suggestions, suggestions);
    res.json({ success: true, suggestion: suggestions[index] });
  } catch (error) {
    console.error('Error updating AI suggestion:', error);
    res.status(500).json({ error: 'Failed to update AI suggestion' });
  }
});

module.exports = router;
