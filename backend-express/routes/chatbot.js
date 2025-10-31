const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Initialize OpenAI client
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store for conversation history
const conversationHistory = new Map();

// Path to project documentation
const PROJECT_DOCS_DIR = path.join(__dirname, '../../');

// Helper function to read project context
async function loadProjectContext() {
  try {
    const contextFiles = [
      'README.md',
      'ARCHITECTURE.md',
      'QUICKSTART.md',
      'DATABASE_SCHEMA.md',
      'Employee360_Documentation.md',
    ];

    let context = '';
    for (const file of contextFiles) {
      try {
        const filePath = path.join(PROJECT_DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        context += `\n\n=== ${file} ===\n${content}`;
      } catch (error) {
        console.log(`Could not read ${file}, skipping...`);
      }
    }

    return context;
  } catch (error) {
    console.error('Error loading project context:', error);
    return '';
  }
}

// System prompt with project context
const SYSTEM_PROMPT = `You are an AI assistant for the Employee360 Dashboard project. Your role is to help users understand and work with this employee monitoring and productivity tracking system.

**About Employee360:**
Employee360 is a comprehensive employee monitoring and productivity dashboard that tracks:
- Application usage and activity patterns
- Productivity metrics and scores
- Work patterns (focus time, meetings, breaks)
- Learning progress and goals
- System health (memory, battery)
- Leave management and reminders

**Your Guidelines:**
1. Only answer questions related to the Employee360 project
2. Provide specific, actionable answers based on the project's architecture
3. Reference actual components, APIs, and features when relevant
4. If asked about unrelated topics, politely redirect to project-related questions
5. Be concise but thorough in your explanations
6. Suggest relevant features or components the user might want to explore

**Project Stack:**
- Frontend: React, Redux, Material-UI
- Backend: Express.js with JSON file storage
- AI Features: OpenAI integration for suggestions
- Data Collection: Activity tracking system

If you don't know something specific about the project, say so and suggest where the user might find that information.`;

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(503).json({ 
        error: 'OpenAI API key is not configured. Please add your API key to the .env file.',
        needsConfiguration: true
      });
    }

    // Get or create conversation history
    const convId = conversationId || `conv-${Date.now()}`;
    let history = conversationHistory.get(convId) || [];

    // Load project context on first message
    let projectContext = '';
    if (history.length === 0) {
      projectContext = await loadProjectContext();
    }

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + (projectContext ? `\n\n**Project Documentation:**\n${projectContext}` : '') },
      ...history.slice(-10), // Keep last 10 messages for context
    ];

    console.log(`💬 Chatbot: Processing message in conversation ${convId}`);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0].message.content;

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });

    // Store updated history (keep last 20 messages)
    conversationHistory.set(convId, history.slice(-20));

    res.json({
      success: true,
      message: assistantMessage,
      conversationId: convId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Failed to process your message',
      details: error.message 
    });
  }
});

// Clear conversation history
router.delete('/conversation/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  conversationHistory.delete(conversationId);
  res.json({ success: true, message: 'Conversation cleared' });
});

// Health check
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  res.json({ 
    status: 'healthy',
    configured: hasApiKey,
    activeConversations: conversationHistory.size,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
