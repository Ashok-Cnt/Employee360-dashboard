const express = require('express');
const os = require('os');
const router = express.Router();

// Get system user information (must be before parameterized routes)
router.get('/system-user', (req, res) => {
  try {
    // Get Windows system username
    const systemUser = {
      username: process.env.USERNAME || process.env.USER || os.userInfo().username,
      displayName: os.userInfo().username,
      platform: os.platform(),
      hostname: os.hostname(),
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      systemUser
    });
  } catch (error) {
    console.error('Error getting system user:', error);
    res.status(500).json({ error: 'Failed to get system user information' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db();
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (must be after specific routes)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.locals.db();
    const user = await db.collection('users').findOne({ user_id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;