const express = require('express');
const router = express.Router();

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
