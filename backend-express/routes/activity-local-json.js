const express = require('express');
const router = express.Router();

// Add new activity record
router.post('/', async (req, res) => {
  try {
    const newActivity = {
      ...req.body,
      _id: Date.now().toString(),
      timestamp: req.body.timestamp || new Date()
    };
    
    const activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    activities.push(newActivity);
    
    // Keep only last 10000 records to prevent file from growing too large
    if (activities.length > 10000) {
      activities.splice(0, activities.length - 10000);
    }
    
    await req.app.locals.writeJSONFile(req.app.locals.files.activity, activities);
    res.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Get recent activities
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const limit = parseInt(req.query.limit) || 100;
    
    let activities = await req.app.locals.readJSONFile(req.app.locals.files.activity);
    
    // Filter by user if specified
    if (userId) {
      activities = activities.filter(a => a.user_id === userId);
    }
    
    // Sort by timestamp descending and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

module.exports = router;
