const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get AI provider from environment
const getAIProvider = () => process.env.AI_PROVIDER || 'openai';

// Initialize OpenAI client
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Format learning data into context for AI
function formatLearningContext(learningData) {
  const contextParts = [];
  
  try {
    // Today's data - MOST IMPORTANT for "today" questions
    if (learningData.todayData && learningData.todayData.courses && learningData.todayData.courses.length > 0) {
      contextParts.push('=== 📅 TODAY\'S LEARNING (Most Recent Activity) ===');
      contextParts.push('⚠️ IMPORTANT: These are the ONLY courses the user studied TODAY:');
      learningData.todayData.courses.forEach(course => {
        contextParts.push(
          `  ✓ ${course.courseName}: ${course.stats.completedLessons}/${course.stats.totalLessons} lessons (${course.stats.percentComplete}% complete)`
        );
      });
      contextParts.push(''); // Empty line for separation
    } else {
      contextParts.push('=== 📅 TODAY\'S LEARNING ===');
      contextParts.push('⚠️ No courses were studied TODAY yet.');
      contextParts.push(''); // Empty line for separation
    }
    
    // Daily History - for "yesterday", "last week", etc questions
    if (learningData.allCourses && learningData.allCourses.dailyData && learningData.allCourses.dailyData.length > 0) {
      contextParts.push('=== 📆 DAILY LEARNING HISTORY ===');
      contextParts.push('Historical data for past days:');
      
      // Show last 7 days
      const recentDays = learningData.allCourses.dailyData.slice(0, 7);
      recentDays.forEach(day => {
        const dayLabel = day.date === new Date().toISOString().split('T')[0] ? 
          'TODAY' : 
          (day.date === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 
            'YESTERDAY' : 
            day.date);
        
        contextParts.push(`\n📅 ${dayLabel} (${day.date}):`);
        if (day.courses && day.courses.length > 0) {
          day.courses.forEach(course => {
            contextParts.push(`  - ${course.courseName} (${course.lessonsCompleted || 0} lessons)`);
          });
        } else {
          contextParts.push('  (No learning activity)');
        }
      });
      contextParts.push(''); // Empty line for separation
    }
    
    // Stats
    if (learningData.stats) {
      const stats = learningData.stats;
      contextParts.push('=== 📊 OVERALL STATISTICS (All Time) ===');
      contextParts.push(`Total Courses: ${stats.totalCourses || 0}`);
      contextParts.push(`Completed Courses: ${stats.completedCourses || 0}`);
      contextParts.push(`Active Learning Days: ${stats.totalDaysWithLearning || 0}`);
      
      if (stats.topCourses && stats.topCourses.length > 0) {
        contextParts.push('\nTop Courses (Historical):');
        stats.topCourses.slice(0, 3).forEach((course, i) => {
          contextParts.push(
            `${i + 1}. ${course.courseName} (${course.maxProgress}% complete, ${course.daysActive} active days)`
          );
        });
      }
    }
    
    // All courses
    if (learningData.allCourses && learningData.allCourses.courses) {
      const courses = learningData.allCourses.courses;
      contextParts.push(`\n=== 📚 ALL COURSES - Historical Data (${courses.length} total) ===`);
      contextParts.push('Note: These may include courses from previous days, not just today');
      courses.slice(0, 5).forEach(course => {
        contextParts.push(`- ${course.courseName}: ${course.stats.percentComplete}% complete`);
      });
    }
    
    // Goals
    if (learningData.goals && learningData.goals.length > 0) {
      const activeGoals = learningData.goals.filter(g => g.status !== 'completed');
      const completedGoals = learningData.goals.filter(g => g.status === 'completed');
      
      contextParts.push('\n=== LEARNING GOALS ===');
      contextParts.push(`Active Goals: ${activeGoals.length}`);
      contextParts.push(`Completed Goals: ${completedGoals.length}`);
      
      if (activeGoals.length > 0) {
        contextParts.push('\nActive Goals:');
        activeGoals.slice(0, 3).forEach(goal => {
          let goalText = `- ${goal.goalText}`;
          if (goal.courseId) {
            goalText += ' (Linked to course)';
          }
          if (goal.progress != null) {
            goalText += ` - Progress: ${goal.progress}%`;
          }
          contextParts.push(goalText);
        });
      }
    }
  } catch (error) {
    console.error('Error formatting learning context:', error);
  }
  
  return contextParts.join('\n');
}

// Health check endpoint
router.get('/health', (req, res) => {
  const aiProvider = getAIProvider();
  const isConfigured = aiProvider === 'ollama' || !!process.env.OPENAI_API_KEY;
  
  res.json({
    status: 'healthy',
    service: 'Learning Chatbot',
    type: aiProvider === 'ollama' ? 'Ollama' : 'OpenAI',
    provider: aiProvider,
    available: isConfigured
  });
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, learningData } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const aiProvider = getAIProvider();
    console.log(`🤖 Processing learning chatbot query with ${aiProvider.toUpperCase()}...`);
    console.log('📝 User question:', message);
    
    // Debug: Log today's learning data
    console.log('=== LEARNING DATA DEBUG ===');
    console.log('learningData exists:', !!learningData);
    console.log('learningData.todayData exists:', !!(learningData && learningData.todayData));
    
    if (learningData && learningData.todayData) {
      console.log('🟢 todayData structure:', {
        hasCoursesProperty: 'courses' in learningData.todayData,
        coursesType: typeof learningData.todayData.courses,
        isArray: Array.isArray(learningData.todayData.courses),
        coursesLength: learningData.todayData.courses?.length,
        allKeys: Object.keys(learningData.todayData)
      });
      
      if (learningData.todayData.courses && learningData.todayData.courses.length > 0) {
        console.log('🟢 todayData.courses:', learningData.todayData.courses.length, 'courses');
        console.log('   First course:', learningData.todayData.courses[0]?.courseName || 'N/A');
      } else {
        console.log('� todayData.courses is empty or missing');
      }
    } else {
      console.log('🔴 No todayData in learningData');
    }
    console.log('=== END DEBUG ===');
    
    // Format learning context
    const learningContext = learningData ? formatLearningContext(learningData) : '';
    console.log('📄 Generated context preview:', learningContext.substring(0, 200) + '...');
    
    // Detect if this is a knowledge test request
    const isKnowledgeTest = message.toLowerCase().includes('test') && 
                           (message.toLowerCase().includes('knowledge') || 
                            message.toLowerCase().includes('quiz') ||
                            message.toLowerCase().includes('question'));
    
    // Detect if this is an answer submission (e.g., "1: B, 2: C" or "A" or "answer is B")
    const isAnswerSubmission = /^(\d+\s*:\s*[A-D]|[A-D]|\d+\s*[A-D])/i.test(message.trim()) ||
                              message.toLowerCase().includes('answer is') ||
                              message.toLowerCase().includes('my answer');
    
    // Detect if this is a report generation request
    const isReportRequest = (message.toLowerCase().includes('report') || 
                            message.toLowerCase().includes('export') ||
                            message.toLowerCase().includes('download')) &&
                           (message.toLowerCase().includes('excel') ||
                            message.toLowerCase().includes('word') ||
                            message.toLowerCase().includes('pdf') ||
                            message.toLowerCase().includes('generate'));
    
    // Create system prompt
    let systemPrompt = `You are a Learning Progress Assistant for the Employee360 Dashboard. Your ONLY job is to help users understand their learning data, courses, progress, and goals.

STRICT RULES:
1. ONLY answer questions about the user's learning progress, courses, statistics, and goals
2. Use the learning data provided in the context below
3. If asked about anything NOT related to learning/courses/education, politely redirect: "I can only help with questions about your learning progress. Please ask about your courses, goals, or statistics."
4. Be concise, friendly, and encouraging
5. Use emojis sparingly but appropriately (📚 📈 🎯 ✅)
6. Provide specific numbers and percentages from the data
7. Offer actionable insights when relevant
8. Format your responses with clear structure using markdown

IMPORTANT: When answering questions about "today" or "what courses I studied today":
- ONLY refer to courses listed under "=== TODAY'S LEARNING ===" section
- Do NOT mention courses from "ALL COURSES" or "Top Courses" sections when asked about today
- If "TODAY'S LEARNING" section is empty or not present, clearly state "You haven't studied any courses today yet"
- Be specific about which courses were accessed TODAY vs other time periods

IMPORTANT: When answering questions about "yesterday", "last week", or other past dates:
- Refer to the "=== DAILY LEARNING HISTORY ===" section
- Identify the specific date being asked about (e.g., YESTERDAY label or specific date)
- List the courses studied on that specific day
- If no data exists for that day, state "No learning activity was recorded for that day"
- Be clear about distinguishing between different days

LEARNING DATA CONTEXT:
${learningContext}`;

    // Enhanced prompt for knowledge testing
    if (isKnowledgeTest) {
      systemPrompt = `You are a Learning Progress Assistant and Knowledge Tester for the Employee360 Dashboard. The user wants to test their knowledge.

YOUR TASK:
1. Identify the user's MOST COMPLETED courses from the learning data (highest completion percentage)
2. Select the TOP 1-2 most completed courses (those with highest percentage)
3. Generate 1-2 relevant quiz questions about topics from these specific courses
4. Questions should be:
   - Specific to the course names mentioned in the data
   - Appropriate for the course subject (e.g., technical questions for programming courses, methodology questions for project management courses)
   - Multiple choice with 4 options (A, B, C, D)
   - Moderate difficulty level
5. Format as:

📚 **Knowledge Test - Based on Your Most Completed Courses**

**Course: [Course Name] ([X]% complete)**

**Question 1:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

[If second course] **Course: [Course Name 2] ([Y]% complete)**

**Question 2:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

💡 *Reply with your answers (e.g., "1: B, 2: C") and I'll check them!*

LEARNING DATA CONTEXT:
${learningContext}`;
    }
    
    // Enhanced prompt for answer checking
    if (isAnswerSubmission) {
      systemPrompt += `

ANSWER CHECKING MODE:
The user is submitting answers to a quiz. Please:
1. Acknowledge their answers
2. Provide feedback on whether they're correct or incorrect (you can make reasonable assumptions about correct answers based on the course topics)
3. Give brief explanations for the correct answers
4. Be encouraging and supportive
5. Suggest they can ask for another quiz to continue testing their knowledge`;
    }
    
    // Handle report generation requests
    if (isReportRequest) {
      const reportTypes = [];
      if (message.toLowerCase().includes('excel')) reportTypes.push('Excel');
      if (message.toLowerCase().includes('word')) reportTypes.push('Word');
      if (message.toLowerCase().includes('pdf')) reportTypes.push('PDF');
      
      if (reportTypes.length === 0) reportTypes.push('Excel', 'Word', 'PDF');
      
      const reportResponse = `📊 **Generate Learning Progress Report**

I can generate your learning progress report in multiple formats:

${reportTypes.map(type => {
  const icon = type === 'Excel' ? '📗' : type === 'Word' ? '📘' : '📕';
  return `${icon} **${type}** - Click to download your report as ${type}`;
}).join('\n')}

**What's included in the report:**
- ✅ Today's learning activity
- 📚 All courses overview
- 📊 Overall statistics
- 🎯 Learning goals

To generate a report:
1. Look for the "Generate Report" button near the chat
2. Select your preferred format (Excel, Word, or PDF)
3. Your report will download automatically!

Would you like me to help you with anything else about your learning progress?`;
      
      return res.json({ response: reportResponse });
    }

    let response;

    if (aiProvider === 'ollama') {
      // Call Ollama
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
      
      try {
        const ollamaResponse = await axios.post(`${ollamaUrl}/api/generate`, {
          model: ollamaModel,
          prompt: `${systemPrompt}\n\nUser Question: ${message}\n\nAssistant:`,
          stream: false,
        });
        
        response = ollamaResponse.data.response;
        console.log('✅ Learning chatbot response generated with Ollama');
        console.log('🤖 AI Response preview:', response.substring(0, 200));
      } catch (ollamaError) {
        console.error('❌ Ollama error:', ollamaError.message);
        return res.json({
          response: `⚠️ Ollama error: ${ollamaError.message}. Make sure Ollama is running on ${ollamaUrl}`
        });
      }
    } else {
      // Call OpenAI
      if (!process.env.OPENAI_API_KEY) {
        return res.json({
          response: '⚠️ OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file or switch to Ollama in AI Configuration.'
        });
      }
      
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
        
        response = completion.choices[0].message.content;
        console.log('✅ Learning chatbot response generated with OpenAI');
        console.log('🤖 AI Response preview:', response.substring(0, 200));
      } catch (openaiError) {
        console.error('❌ OpenAI error:', openaiError);
        
        if (openaiError.code === 'invalid_api_key') {
          return res.json({
            response: '⚠️ Invalid OpenAI API key. Please check your OPENAI_API_KEY in the .env file.'
          });
        }
        
        return res.json({
          response: '⚠️ OpenAI error: ' + openaiError.message
        });
      }
    }
    
    res.json({ response });
    
  } catch (error) {
    console.error('❌ Learning chatbot error:', error);
    res.status(500).json({
      error: 'Chat error',
      message: error.message,
      response: '⚠️ Sorry, I encountered an error. Please try again.'
    });
  }
});

module.exports = router;
