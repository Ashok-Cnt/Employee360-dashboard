const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Path to store user preferences JSON file
const DATA_DIR = path.join(__dirname, '..', 'data');
const PREFERENCES_FILE = path.join(DATA_DIR, 'user_preferences.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Read preferences from JSON file
async function readPreferences() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(PREFERENCES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty object
      return {};
    }
    console.error('Error reading preferences:', error);
    throw error;
  }
}

// Write preferences to JSON file
async function writePreferences(preferences) {
  try {
    await ensureDataDirectory();
    await fs.writeFile(PREFERENCES_FILE, JSON.stringify(preferences, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing preferences:', error);
    throw error;
  }
}

// Get current username
function getCurrentUsername() {
  return process.env.USERNAME || process.env.USER || os.userInfo().username || 'default_user';
}

// GET user preferences by username
router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const allPreferences = await readPreferences();
    const userPrefs = allPreferences[username] || {
      username: username,
      customDisplayName: username, // Default to username
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      preferences: userPrefs
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user preferences'
    });
  }
});

// GET current user preferences (based on system username)
router.get('/current/me', async (req, res) => {
  try {
    const username = getCurrentUsername();
    const allPreferences = await readPreferences();
    const userPrefs = allPreferences[username] || {
      username: username,
      customDisplayName: username, // Default to username
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      preferences: userPrefs
    });
  } catch (error) {
    console.error('Error getting current user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current user preferences'
    });
  }
});

// UPDATE custom display name
router.put('/:username/display-name', async (req, res) => {
  try {
    const username = req.params.username;
    const { displayName } = req.body;
    
    const allPreferences = await readPreferences();
    
    if (!allPreferences[username]) {
      allPreferences[username] = {
        username: username,
        customDisplayName: null,
        reminders: [],
        createdAt: new Date().toISOString()
      };
    }
    
    allPreferences[username].customDisplayName = displayName;
    allPreferences[username].updatedAt = new Date().toISOString();
    
    await writePreferences(allPreferences);
    
    res.json({
      success: true,
      message: 'Display name updated successfully',
      preferences: allPreferences[username]
    });
  } catch (error) {
    console.error('Error updating display name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update display name'
    });
  }
});

// RESET custom display name (set to null)
router.delete('/:username/display-name', async (req, res) => {
  try {
    const username = req.params.username;
    
    const allPreferences = await readPreferences();
    
    if (allPreferences[username]) {
      allPreferences[username].customDisplayName = null;
      allPreferences[username].updatedAt = new Date().toISOString();
      await writePreferences(allPreferences);
    }
    
    res.json({
      success: true,
      message: 'Display name reset successfully',
      preferences: allPreferences[username]
    });
  } catch (error) {
    console.error('Error resetting display name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset display name'
    });
  }
});

// GET all reminders for a user
router.get('/:username/reminders', async (req, res) => {
  try {
    const username = req.params.username;
    const allPreferences = await readPreferences();
    const userPrefs = allPreferences[username];
    
    res.json({
      success: true,
      reminders: userPrefs?.reminders || []
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reminders'
    });
  }
});

// ADD a new reminder
router.post('/:username/reminders', async (req, res) => {
  try {
    const username = req.params.username;
    const reminder = req.body;
    
    const allPreferences = await readPreferences();
    
    if (!allPreferences[username]) {
      allPreferences[username] = {
        username: username,
        customDisplayName: null,
        reminders: [],
        createdAt: new Date().toISOString()
      };
    }
    
    // Add ID and timestamp to reminder
    const newReminder = {
      ...reminder,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    allPreferences[username].reminders.push(newReminder);
    allPreferences[username].updatedAt = new Date().toISOString();
    
    await writePreferences(allPreferences);
    
    res.json({
      success: true,
      message: 'Reminder added successfully',
      reminder: newReminder,
      reminders: allPreferences[username].reminders
    });
  } catch (error) {
    console.error('Error adding reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reminder'
    });
  }
});

// DELETE a reminder
router.delete('/:username/reminders/:reminderId', async (req, res) => {
  try {
    const username = req.params.username;
    const reminderId = parseInt(req.params.reminderId);
    
    const allPreferences = await readPreferences();
    
    if (allPreferences[username]) {
      allPreferences[username].reminders = allPreferences[username].reminders.filter(
        r => r.id !== reminderId
      );
      allPreferences[username].updatedAt = new Date().toISOString();
      await writePreferences(allPreferences);
    }
    
    res.json({
      success: true,
      message: 'Reminder deleted successfully',
      reminders: allPreferences[username]?.reminders || []
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete reminder'
    });
  }
});

// UPDATE all reminders (bulk update)
router.put('/:username/reminders', async (req, res) => {
  try {
    const username = req.params.username;
    const { reminders } = req.body;
    
    const allPreferences = await readPreferences();
    
    if (!allPreferences[username]) {
      allPreferences[username] = {
        username: username,
        customDisplayName: null,
        reminders: [],
        createdAt: new Date().toISOString()
      };
    }
    
    allPreferences[username].reminders = reminders;
    allPreferences[username].updatedAt = new Date().toISOString();
    
    await writePreferences(allPreferences);
    
    res.json({
      success: true,
      message: 'Reminders updated successfully',
      reminders: allPreferences[username].reminders
    });
  } catch (error) {
    console.error('Error updating reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reminders'
    });
  }
});

module.exports = router;
