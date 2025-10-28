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
        timeout: 5000,
        windowsHide: true
      });
      const match = output.match(/FullName=(.*)/);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch (error) {
    console.log('Could not get Windows full name:', error.message);
  }
  // Fallback: Try environment variables
  return process.env.USERDOMAIN_ROAMINGPROFILE || process.env.USERDOMAIN || null;
}

// Helper function to get computer domain
function getComputerDomain() {
  try {
    if (os.platform() === 'win32') {
      const output = execSync('wmic computersystem get domain /value', { 
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true
      });
      const match = output.match(/Domain=(.*)/);
      if (match && match[1] && match[1].trim()) {
        const domain = match[1].trim();
        // Don't return if it's the same as computer name (means no domain)
        if (domain && domain.toLowerCase() !== os.hostname().toLowerCase()) {
          return domain;
        }
      }
    }
  } catch (error) {
    console.log('Could not get domain:', error.message);
  }
  // Try environment variable
  return process.env.USERDOMAIN || process.env.USERDNSDOMAIN || 'WORKGROUP';
}

// Helper function to get user email (if available)
function getUserEmail() {
  try {
    if (os.platform() === 'win32') {
      const username = process.env.USERNAME || os.userInfo().username;
      const output = execSync(`powershell -Command "(Get-LocalUser -Name '${username}' -ErrorAction SilentlyContinue).Description"`, {
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true
      });
      if (output && output.trim() && output.includes('@')) {
        return output.trim();
      }
    }
  } catch (error) {
    console.log('Could not get user email:', error.message);
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
    const email = getUserEmail();
    
    // Get Windows system username
    const systemUser = {
      username: username,
      displayName: fullName || username,
      computerName: os.hostname(),
      domain: domain,
      email: email,
      platform: os.platform(),
      hostname: os.hostname(),
      homedir: userInfo.homedir,
      timestamp: new Date()
    };
    
    console.log('System user info:', JSON.stringify(systemUser, null, 2));
    
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
