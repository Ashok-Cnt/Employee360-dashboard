const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to category config file
const CATEGORY_CONFIG_FILE = path.join(__dirname, '../data/category_config.json');
const ACTIVITY_DATA_DIR = path.join(__dirname, '../../data-collector/activity_data');

// Default categories
const DEFAULT_CATEGORIES = [
  {
    id: 'productivity',
    name: 'Productivity',
    icon: 'Work',
    color: '#4caf50',
    applications: [
      'Visual Studio Code',
      'IntelliJ IDEA',
      'Eclipse',
      'PyCharm',
      'Sublime Text',
      'Notepad++',
      'Microsoft Excel',
      'Microsoft Word',
      'Microsoft PowerPoint',
      'Google Chrome',
      'Firefox',
      'Edge',
      'Notepad'
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: 'People',
    color: '#2196f3',
    applications: [
      'Microsoft Teams',
      'Slack',
      'Discord',
      'Zoom',
      'Skype',
      'Microsoft Outlook',
      'Gmail',
      'Thunderbird'
    ]
  },
  {
    id: 'break',
    name: 'Break',
    icon: 'Coffee',
    color: '#ff9800',
    applications: [
      'YouTube',
      'Netflix',
      'Spotify',
      'VLC Media Player',
      'Windows Media Player',
      'Steam',
      'Epic Games Launcher'
    ]
  }
];

// Helper function to ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(CATEGORY_CONFIG_FILE);
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Helper function to read categories
async function readCategories() {
  try {
    const data = await fs.readFile(CATEGORY_CONFIG_FILE, 'utf8');
    const config = JSON.parse(data);
    return config.categories || DEFAULT_CATEGORIES;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create with default categories
      await ensureDataDir();
      await writeCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    throw error;
  }
}

// Helper function to write categories
async function writeCategories(categories) {
  await ensureDataDir();
  const config = { 
    categories,
    last_updated: new Date().toISOString()
  };
  await fs.writeFile(CATEGORY_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// Helper function to get all applications from activity data
async function getAllApplications() {
  const applications = new Set();
  
  try {
    const files = await fs.readdir(ACTIVITY_DATA_DIR);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    for (const file of jsonlFiles) {
      const filePath = path.join(ACTIVITY_DATA_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          
          // Get from main apps
          if (entry.apps && Array.isArray(entry.apps)) {
            for (const app of entry.apps) {
              if (app.title && app.title.trim()) {
                applications.add(app.title.trim());
              }
            }
          }
          
          // Get from background apps
          if (entry.backgroundApps && entry.backgroundApps.apps && Array.isArray(entry.backgroundApps.apps)) {
            for (const app of entry.backgroundApps.apps) {
              if (app.title && app.title.trim()) {
                applications.add(app.title.trim());
              }
            }
          }
        } catch (parseError) {
          // Skip invalid JSON lines
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error reading activity data:', error);
  }
  
  // Filter out system apps and empty strings
  const systemApps = ['Windows Shell Experience Host', 'Windows Explorer', 'System'];
  const filteredApps = Array.from(applications).filter(app => 
    app && !systemApps.includes(app)
  );
  
  return filteredApps.sort();
}

// GET /api/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await readCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error reading categories:', error);
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

// GET /api/applications - Get all available applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await getAllApplications();
    res.json({ applications });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// POST /api/categories - Update all categories
router.post('/categories', async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Invalid categories data' });
    }

    await writeCategories(categories);
    res.json({ 
      message: 'Categories updated successfully',
      categories 
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    res.status(500).json({ error: 'Failed to update categories' });
  }
});

// POST /api/categories/reset - Reset to default categories
router.post('/categories/reset', async (req, res) => {
  try {
    await writeCategories(DEFAULT_CATEGORIES);
    res.json({ 
      message: 'Categories reset to defaults',
      categories: DEFAULT_CATEGORIES 
    });
  } catch (error) {
    console.error('Error resetting categories:', error);
    res.status(500).json({ error: 'Failed to reset categories' });
  }
});

module.exports = router;
