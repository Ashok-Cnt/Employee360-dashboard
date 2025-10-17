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
    const users = await req.app.locals.readJSONFile(req.app.locals.files.users);
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
    const users = await req.app.locals.readJSONFile(req.app.locals.files.users);
    const user = users.find(u => u.user_id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user
router.post('/', async (req, res) => {
  try {
    const newUser = req.body;
    const users = await req.app.locals.readJSONFile(req.app.locals.files.users);
    
    // Check if user already exists
    const existingIndex = users.findIndex(u => u.user_id === newUser.user_id);
    
    if (existingIndex >= 0) {
      // Update existing user
      users[existingIndex] = { ...users[existingIndex], ...newUser, updated_at: new Date() };
    } else {
      // Add new user
      newUser.created_at = new Date();
      users.push(newUser);
    }
    
    await req.app.locals.writeJSONFile(req.app.locals.files.users, users);
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

module.exports = router;
