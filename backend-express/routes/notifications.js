const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to notification history file
const NOTIFICATION_FILE = path.join(__dirname, '../../data-collector/notification_history.json');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    // Check if file exists
    try {
      await fs.access(NOTIFICATION_FILE);
    } catch {
      // File doesn't exist yet, return empty array
      return res.json([]);
    }
    
    // Read notifications
    const data = await fs.readFile(NOTIFICATION_FILE, 'utf-8');
    let notifications = JSON.parse(data);
    
    // Filter by unread if requested
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    
    // Apply limit if requested
    if (limit) {
      notifications = notifications.slice(0, limit);
    }
    
    res.json(notifications);
  } catch (error) {
    console.error('Error reading notifications:', error);
    res.status(500).json({ error: 'Failed to read notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    // Check if file exists
    try {
      await fs.access(NOTIFICATION_FILE);
    } catch {
      // File doesn't exist yet, return 0
      return res.json({ count: 0 });
    }
    
    // Read notifications
    const data = await fs.readFile(NOTIFICATION_FILE, 'utf-8');
    const notifications = JSON.parse(data);
    
    // Count unread
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ error: 'Failed to count unread notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Read notifications
    const data = await fs.readFile(NOTIFICATION_FILE, 'utf-8');
    const notifications = JSON.parse(data);
    
    // Find and mark as read
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    
    // Save back
    await fs.writeFile(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2));
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    // Read notifications
    const data = await fs.readFile(NOTIFICATION_FILE, 'utf-8');
    const notifications = JSON.parse(data);
    
    // Mark all as read
    notifications.forEach(n => n.read = true);
    
    // Save back
    await fs.writeFile(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2));
    
    res.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Read notifications
    const data = await fs.readFile(NOTIFICATION_FILE, 'utf-8');
    let notifications = JSON.parse(data);
    
    // Filter out the notification
    const originalLength = notifications.length;
    notifications = notifications.filter(n => n.id !== notificationId);
    
    if (notifications.length === originalLength) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Save back
    await fs.writeFile(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
