# AI-Powered Suggestions Setup

The Employee360 Dashboard now includes AI-powered suggestions using OpenAI's GPT-4 model. These suggestions provide personalized, context-aware recommendations based on your work patterns.

## Features

- **Intelligent Analysis**: AI analyzes your focus time, meeting load, break patterns, and productivity metrics
- **Personalized Recommendations**: Get 3-5 specific, actionable suggestions tailored to your work style
- **Priority-Based**: Suggestions are categorized by priority (high, medium, low)
- **Category-Specific**: Recommendations span productivity, wellbeing, and work-life balance
- **Fallback Support**: If OpenAI is unavailable, the system uses rule-based suggestions

## Setup Instructions

### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

### 2. Configure the Backend

1. Open `backend-express/.env` file
2. Replace the placeholder with your actual API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

3. Save the file

### 3. Restart the Backend

```bash
cd backend-express
npm start
```

### 4. Verify Setup

Check if OpenAI is configured correctly:

```bash
curl http://localhost:8001/api/ai-suggestions/health
```

Expected response:
```json
{
  "status": "healthy",
  "openai_configured": true,
  "timestamp": "2025-10-12T..."
}
```

## How It Works

### Backend (`routes/ai-suggestions.js`)

1. **Data Collection**: Collects work pattern metrics, application stats, and current activity
2. **Context Building**: Creates comprehensive context about work patterns, time of day, and productivity
3. **AI Prompting**: Sends structured prompt to OpenAI GPT-4o-mini model
4. **Response Parsing**: Parses AI response into structured suggestion objects
5. **Fallback**: If AI fails, returns rule-based suggestions

### Frontend (`components/AISuggestions.js`)

1. **API Call**: Sends work pattern data to backend
2. **Loading State**: Shows spinner while AI is thinking
3. **Display**: Renders suggestions with icons, colors, and action items
4. **Interactivity**: Users can dismiss suggestions or refresh for new ones
5. **Visual Indicators**: Shows "AI" badge when powered by OpenAI

## API Endpoint

### POST `/api/ai-suggestions/generate`

**Request Body:**
```json
{
  "workPatterns": {
    "metrics": {
      "total_active_time_minutes": 240,
      "focus_time_percentage": 45,
      "meeting_time_percentage": 30,
      "break_time_percentage": 15,
      "productivity_score": 72
    },
    "work_patterns": [...]
  },
  "appStats": {...},
  "focusedWindow": {...},
  "currentApps": [...]
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "ai-suggestion-0-1697123456789",
      "title": "Take Strategic Breaks",
      "description": "Your break time is lower than recommended...",
      "category": "wellbeing",
      "priority": "high",
      "actionItems": [
        "Schedule 5-minute breaks every hour",
        "Practice the 20-20-20 rule",
        "Take a short walk"
      ],
      "icon": "Coffee",
      "color": "#ff9800"
    }
  ],
  "metadata": {
    "generatedAt": "2025-10-12T...",
    "model": "gpt-4o-mini"
  }
}
```

## Cost Considerations

- **Model Used**: GPT-4o-mini (cost-effective, fast)
- **Tokens Per Request**: ~500-1000 tokens
- **Estimated Cost**: $0.0001-$0.0003 per request
- **Daily Usage**: ~50-100 requests = $0.005-$0.03/day
- **Monthly Estimate**: ~$0.15-$1.00/month per active user

## Customization

### Adjust AI Behavior

Edit `backend-express/routes/ai-suggestions.js`:

```javascript
// Change model
model: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo'

// Adjust creativity
temperature: 0.7, // 0.0 = deterministic, 1.0 = creative

// Change response length
max_tokens: 1500, // increase for longer suggestions
```

### Modify Prompt

Edit the prompt in `generateAISuggestions()` to change:
- Number of suggestions (3-5)
- Categories (productivity, wellbeing, balance)
- Priority levels
- Action item count

## Troubleshooting

### "AI is analyzing..." shows indefinitely

**Cause**: OpenAI API key not set or invalid

**Solution**:
1. Check `.env` file has valid API key
2. Restart backend server
3. Check console for errors

### Fallback suggestions shown instead of AI

**Cause**: OpenAI API call failed

**Solution**:
1. Check API key is valid and has credits
2. Check network connectivity
3. Review backend logs for errors
4. Verify OpenAI service status

### "Failed to generate suggestions"

**Cause**: Network error or API issue

**Solution**:
1. Click "Refresh" button
2. Check backend logs
3. Verify OpenAI API status
4. Check rate limits

## Benefits Over Rule-Based Suggestions

### Rule-Based (Old)
- ❌ Limited to predefined scenarios
- ❌ Generic advice
- ❌ No context awareness
- ❌ Static recommendations

### AI-Powered (New)
- ✅ Understands nuanced situations
- ✅ Personalized advice
- ✅ Time-of-day awareness
- ✅ Dynamic recommendations
- ✅ Natural language explanations
- ✅ Learns from patterns

## Examples

### Morning Focus Suggestion
```
Title: "Start Your Day Strong"
Description: "It's morning - the best time for deep work. Your focus time is only at 25%."
Action Items:
- Tackle your most challenging task first
- Block the first 2 hours for focused work
- Avoid checking emails until 10 AM
```

### Break Reminder
```
Title: "Time to Recharge"
Description: "You've been actively working for 3 hours without a break. Taking breaks improves long-term productivity."
Action Items:
- Take a 10-minute walk outside
- Practice some stretches
- Grab water and a healthy snack
```

### Meeting Optimization
```
Title: "Optimize Your Calendar"
Description: "55% of your day is in meetings. This leaves little time for deep work."
Action Items:
- Review recurring meetings for necessity
- Propose async updates for status meetings
- Block 2-hour focus time slots
- Implement "No Meeting Fridays"
```

## Privacy & Security

- Work pattern data is only sent to OpenAI for processing
- No personal identifiable information (PII) is shared
- API calls are made server-side (keys never exposed to frontend)
- Suggestions are not stored permanently
- OpenAI's data usage policy applies

## Support

For issues or questions:
1. Check backend console logs
2. Review OpenAI API status
3. Verify API key configuration
4. Test with health endpoint

---

**Powered by OpenAI GPT-4o-mini** 🤖✨
