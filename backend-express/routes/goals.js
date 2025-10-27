const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const GOALS_FILE = path.join(__dirname, '../data/user_goals.json');

// Helper function to ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(GOALS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Helper function to read goals file
async function readGoals() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(GOALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, create it with empty array
      await fs.writeFile(GOALS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    throw err;
  }
}

// Helper function to write goals file
async function writeGoals(goals) {
  await ensureDataDirectory();
  await fs.writeFile(GOALS_FILE, JSON.stringify(goals, null, 2));
}

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await readGoals();
    res.json({ success: true, goals });
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch goals' });
  }
});

// Add a new goal
router.post('/', async (req, res) => {
  try {
    const { userId, goalText, targetDate, courseId, totalHours } = req.body;
    if (!goalText) return res.status(400).json({ success: false, error: 'Goal text required' });
    
    const goals = await readGoals();
    const newGoal = {
      userId: userId || 'default',
      goalText,
      createdAt: new Date().toISOString(),
      targetDate: targetDate || null,
      courseId: courseId || null,
      totalHours: totalHours || null,
      status: 'active'
    };
    goals.push(newGoal);
    await writeGoals(goals);
    res.json({ success: true, goal: newGoal });
  } catch (err) {
    console.error('Error adding goal:', err);
    res.status(500).json({ success: false, error: 'Failed to add goal', message: err.message });
  }
});

// Update goal status or courseId
router.put('/:index', async (req, res) => {
  try {
    const { status, courseId, totalHours, goalText, targetDate } = req.body;
    const goals = await readGoals();
    const idx = parseInt(req.params.index);
    if (isNaN(idx) || !goals[idx]) return res.status(404).json({ success: false, error: 'Goal not found' });
    if (status !== undefined) goals[idx].status = status;
    if (courseId !== undefined) goals[idx].courseId = courseId;
    if (totalHours !== undefined) goals[idx].totalHours = totalHours;
    if (goalText !== undefined) goals[idx].goalText = goalText;
    if (targetDate !== undefined) goals[idx].targetDate = targetDate;
    await writeGoals(goals);
    res.json({ success: true, goal: goals[idx] });
  } catch (err) {
    console.error('Error updating goal:', err);
    res.status(500).json({ success: false, error: 'Failed to update goal' });
  }
});

// Delete goal
router.delete('/:index', async (req, res) => {
  try {
    const goals = await readGoals();
    const idx = parseInt(req.params.index);
    if (isNaN(idx) || !goals[idx]) return res.status(404).json({ success: false, error: 'Goal not found' });
    const deletedGoal = goals.splice(idx, 1)[0];
    await writeGoals(goals);
    res.json({ success: true, goal: deletedGoal });
  } catch (err) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ success: false, error: 'Failed to delete goal' });
  }
});

module.exports = router;
