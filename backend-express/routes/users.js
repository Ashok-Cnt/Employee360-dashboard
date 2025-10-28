const express = require('express');
const os = require('os');
const { execSync } = require('child_process');
const router = express.Router();

// Helper function to get Windows user full name
function getWindowsUserFullName() {
  try {
    if (os.platform() === 'win32') {
      // Try to get full name from Windows
      const username = process.env.USERNAME || os.userInfo().username;
      const output = execSync(`wmic useraccount where name="${username}" get fullname /value`, { 
        encoding: 'utf-8',
        timeout: 5000 
      });
      const match = output.match(/FullName=(.*)/);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch (error) {
    console.log('Could not get Windows full name:', error.message);
  }
  return null;
}

// Helper function to get computer domain
function getComputerDomain() {
  try {
    if (os.platform() === 'win32') {
      const output = execSync('wmic computersystem get domain /value', { 
        encoding: 'utf-8',
        timeout: 5000 
      });
      const match = output.match(/Domain=(.*)/);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch (error) {
    console.log('Could not get domain:', error.message);
  }
  return null;
}

// Get system user information (must be before parameterized routes)
router.get('/system-user', (req, res) => {
  try {
    const userInfo = os.userInfo();
    const username = process.env.USERNAME || process.env.USER || userInfo.username;
    const fullName = getWindowsUserFullName();
    const domain = getComputerDomain();
    
    // Get Windows system username
    const systemUser = {
      username: username,
      displayName: fullName || userInfo.username || username,
      computerName: os.hostname(),
      domain: domain || 'WORKGROUP',
      platform: os.platform(),
      hostname: os.hostname(),
      homedir: userInfo.homedir,
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