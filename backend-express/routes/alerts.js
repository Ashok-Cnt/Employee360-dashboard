const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const notifier = require('node-notifier');

// Path to alert rules file in data-collector
const ALERT_RULES_FILE = path.join(__dirname, '../../data-collector/alert_rules.json');

// Helper function to read alert rules
async function readAlertRules() {
  try {
    const data = await fs.readFile(ALERT_RULES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create default rules
      const defaultRules = [
        {
          ruleId: uuidv4(),
          name: 'High Memory Usage Alert',
          conditionType: 'memory_usage',
          threshold: 80.0,
          durationMinutes: 5,
          enabled: true,
          targetApp: null
        },
        {
          ruleId: uuidv4(),
          name: 'System Overrun Alert',
          conditionType: 'system_overrun',
          threshold: 90.0,
          durationMinutes: 10,
          enabled: true,
          targetApp: null
        },
        {
          ruleId: uuidv4(),
          name: 'Application Running But Not Used',
          conditionType: 'app_overrun',
          threshold: 120,
          durationMinutes: 120,
          enabled: true,
          targetApp: null
        }
      ];
      await writeAlertRules(defaultRules);
      return defaultRules;
    }
    throw error;
  }
}

// Helper function to write alert rules
async function writeAlertRules(rules) {
  await fs.writeFile(ALERT_RULES_FILE, JSON.stringify(rules, null, 2), 'utf8');
}

// GET /api/alerts/rules - Get all alert rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await readAlertRules();
    res.json(rules);
  } catch (error) {
    console.error('Error reading alert rules:', error);
    res.status(500).json({ error: 'Failed to read alert rules' });
  }
});

// POST /api/alerts/rules - Create new alert rule
router.post('/rules', async (req, res) => {
  try {
    const { name, conditionType, threshold, durationMinutes, enabled, targetApp } = req.body;
    
    if (!name || !conditionType || threshold === undefined || !durationMinutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rules = await readAlertRules();
    const newRule = {
      ruleId: uuidv4(),
      name,
      conditionType,
      threshold: parseFloat(threshold),
      durationMinutes: parseInt(durationMinutes),
      enabled: enabled !== false,
      targetApp: targetApp || null
    };

    rules.push(newRule);
    await writeAlertRules(rules);
    
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

// PUT /api/alerts/rules/:ruleId - Update alert rule
router.put('/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rules = await readAlertRules();
    const ruleIndex = rules.findIndex(r => r.ruleId === ruleId);

    if (ruleIndex === -1) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    // Update the rule
    const updatedRule = {
      ...rules[ruleIndex],
      ...updates,
      ruleId // Ensure ruleId doesn't change
    };

    rules[ruleIndex] = updatedRule;
    await writeAlertRules(rules);

    res.json(updatedRule);
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

// DELETE /api/alerts/rules/:ruleId - Delete alert rule
router.delete('/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;

    const rules = await readAlertRules();
    const filteredRules = rules.filter(r => r.ruleId !== ruleId);

    if (filteredRules.length === rules.length) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    await writeAlertRules(filteredRules);
    res.json({ message: 'Alert rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

// POST /api/alerts/rules/:ruleId/toggle - Toggle alert rule enabled/disabled
router.post('/rules/:ruleId/toggle', async (req, res) => {
  try {
    const { ruleId } = req.params;

    const rules = await readAlertRules();
    const rule = rules.find(r => r.ruleId === ruleId);

    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    rule.enabled = !rule.enabled;
    await writeAlertRules(rules);

    res.json(rule);
  } catch (error) {
    console.error('Error toggling alert rule:', error);
    res.status(500).json({ error: 'Failed to toggle alert rule' });
  }
});

// POST /api/alerts/test - Send test notification
router.post('/test', async (req, res) => {
  try {
    // Send Windows desktop notification using node-notifier
    notifier.notify({
      title: 'Employee-360 Alert Test',
      message: 'This is a test notification from Employee-360 Dashboard!',
      icon: path.join(__dirname, '../../frontend/public/favicon.ico'), // Optional icon
      sound: true, // Play default notification sound
      wait: false, // Don't wait for user action
      timeout: 5 // Auto-close after 5 seconds
    }, (err, response) => {
      if (err) {
        console.error('Notification error:', err);
      }
    });

    res.json({ 
      success: true,
      message: 'Test notification sent! Check your Windows notification center.' 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

module.exports = router;
