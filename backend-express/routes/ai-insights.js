const express = require('express');
const router = express.Router();
const axios = require('axios');

// Configuration - read dynamically to allow runtime changes
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
      timeout: 60000, // 60 second timeout
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
        num_predict: 2000,
      }
    }, { timeout: 60000 });

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
    max_tokens: 2000,
    response_format: { type: "json_object" }
  });

  return completion.choices[0].message.content;
}

// Generic function to call AI provider
async function callAI(prompt, systemPrompt) {
  const aiProvider = getAIProvider();
  
  if (aiProvider === 'ollama') {
    console.log(`🦙 Using Ollama (${OLLAMA_MODEL}) for AI Insights`);
    return await callOllama(prompt, systemPrompt);
  } else if (aiProvider === 'openai') {
    console.log('🤖 Using OpenAI (gpt-4o-mini) for AI Insights');
    return await callOpenAI(prompt, systemPrompt);
  } else {
    throw new Error(`Unknown AI provider: ${aiProvider}`);
  }
}

// Generate comprehensive AI insights
router.post('/generate', async (req, res) => {
  try {
    const { metrics, topApps, hourlySummary } = req.body;

    console.log('📊 Generating AI insights for metrics:', {
      productivityScore: metrics?.productivityScore,
      focusTime: metrics?.focusTimePercentage,
      activeTime: metrics?.totalActiveMinutes
    });

    // Validate data
    if (!metrics) {
      return res.status(400).json({
        error: 'Metrics data is required',
        success: false
      });
    }

    // Build context for AI
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    // Format top apps
    const topAppsText = topApps && topApps.length > 0
      ? topApps.map((app, i) => `${i + 1}. ${app.name || app.title}: ${Math.round(app.focusDurationSec / 60)} minutes`).join('\n')
      : 'No application data available';

    // Format hourly summary
    const peakHours = hourlySummary && hourlySummary.length > 0
      ? hourlySummary
          .filter(h => h.focusSec > 0)
          .sort((a, b) => b.focusSec - a.focusSec)
          .slice(0, 3)
          .map(h => `${h.hour}:00`)
          .join(', ')
      : 'Not enough data';

    const prompt = `You are an AI productivity analyst. Analyze the following work pattern data and provide comprehensive insights.

**Today's Work Summary (${timeOfDay}):**
- Total Active Time: ${Math.floor(metrics.totalActiveMinutes / 60)}h ${Math.round(metrics.totalActiveMinutes % 60)}m
- Productivity Score: ${metrics.productivityScore}%
- Focus Time: ${metrics.focusTimePercentage}% (${Math.round(metrics.productiveMinutes)} minutes)
- Meeting/Collaboration Time: ${metrics.meetingTimePercentage}%
- Break Time: ${metrics.breakTimePercentage}%

**Top Applications Used:**
${topAppsText}

**Peak Productivity Hours:**
${peakHours}

**Analysis Requirements:**
Generate a detailed JSON response with the following structure:

{
  "dailySummary": "A 2-3 sentence natural language summary of the user's day and overall performance",
  "strengths": [
    "Strength 1: Brief description of what they're doing well",
    "Strength 2: Another positive aspect",
    "Strength 3: One more strength"
  ],
  "areasForImprovement": [
    "Area 1: Specific improvement opportunity with reasoning",
    "Area 2: Another area to focus on"
  ],
  "keyInsights": [
    {
      "title": "Short insight title (3-5 words)",
      "description": "Detailed explanation of this insight (1-2 sentences)",
      "type": "positive|neutral|warning"
    }
  ],
  "predictions": {
    "nextWeekFocus": "Prediction about focus time trends",
    "burnoutRisk": "low|medium|high",
    "burnoutAnalysis": "Brief explanation of burnout risk level",
    "recommendedActions": [
      "Action 1: Specific recommendation",
      "Action 2: Another recommendation"
    ]
  },
  "motivationalMessage": "An encouraging, personalized message (1-2 sentences) based on their performance"
}

**Guidelines:**
- Be specific and actionable in your recommendations
- Consider work-life balance
- Be encouraging and positive while being honest
- Reference specific data points from their activity
- Keep the tone professional but friendly
- If productivity is low, be constructive rather than critical
- If productivity is high, acknowledge it but remind about balance

Respond ONLY with valid JSON, no additional text.`;

    const systemPrompt = `You are an expert AI productivity coach and performance analyst specializing in workplace productivity, time management, and employee well-being. You analyze work patterns to provide actionable insights that improve both productivity and work-life balance. Always provide specific, data-driven recommendations. Be empathetic and encouraging while maintaining professionalism.`;

    console.log('🚀 Calling AI provider for insights generation...');

    // Call AI provider
    const responseText = await callAI(prompt, systemPrompt);
    console.log('✅ AI response received');

    // Parse response
    let insights;
    try {
      const parsed = JSON.parse(responseText);
      insights = parsed;
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse AI insights');
    }

    const currentProvider = getAIProvider();
    res.json({
      success: true,
      insights,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: currentProvider,
        model: currentProvider === 'ollama' ? OLLAMA_MODEL : 'gpt-4o-mini',
      }
    });

  } catch (error) {
    console.error('❌ Error generating AI insights:', error);
    
    // Provide fallback insights
    res.json({
      success: false,
      error: error.message,
      insights: {
        dailySummary: "Unable to generate AI insights at this time. Your activity data has been recorded and is available in the charts above.",
        strengths: [
          "You're actively tracking your work patterns",
          "Consistent monitoring helps identify productivity trends"
        ],
        areasForImprovement: [
          "Enable AI provider to get personalized insights"
        ],
        keyInsights: [],
        predictions: {
          nextWeekFocus: "Data analysis unavailable",
          burnoutRisk: "unknown",
          burnoutAnalysis: "AI provider needed for burnout analysis",
          recommendedActions: []
        },
        motivationalMessage: "Keep tracking your productivity to build better work habits!"
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        fallback: true,
      }
    });
  }
});

module.exports = router;
