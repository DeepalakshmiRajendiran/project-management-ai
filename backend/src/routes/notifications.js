const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');
const { pool } = require('../config/database');

// Validation middleware
const validateNotification = [
  body('type').isIn(['task', 'project', 'milestone', 'comment', 'system']).withMessage('Invalid notification type'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be less than 1000 characters'),
  body('data').optional().isObject().withMessage('Data must be a valid object'),
  body('related_entity_type').optional().isString().withMessage('Related entity type must be a string'),
  body('related_entity_id').optional().isUUID().withMessage('Related entity ID must be a valid UUID')
];

const validateNotificationUpdate = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be less than 255 characters'),
  body('message').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be less than 1000 characters'),
  body('data').optional().isObject().withMessage('Data must be a valid object'),
  body('is_read').optional().isBoolean().withMessage('is_read must be a boolean')
];

// Check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/notifications - Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const notifications = await notificationController.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const notification = await notificationController.getNotificationById(req.params.id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
});

// POST /api/notifications - Create new notification
router.post('/', auth, validateNotification, handleValidationErrors, async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      user_id: req.user.id,
      sender_id: req.user.id
    };

    const notification = await notificationController.createNotification(notificationData);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id - Update notification
router.put('/:id', auth, validateNotificationUpdate, handleValidationErrors, async (req, res) => {
  try {
    const notification = await notificationController.updateNotification(
      req.params.id, 
      req.body, 
      req.user.id
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await notificationController.deleteNotification(req.params.id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await notificationController.markAsRead(req.params.id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    const count = await notificationController.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await notificationController.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// GET /api/notifications/user/:userId - Get notifications for a specific user (admin only)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2',
      [req.user.id, 'admin']
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const notifications = await notificationController.getUserNotifications(req.params.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/type/:type - Get notifications by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await notificationController.getNotificationsByType(
      req.user.id, 
      req.params.type, 
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications by type',
      error: error.message
    });
  }
});

// POST /api/notifications/send - Send notification to multiple users (admin only)
router.post('/send', auth, validateNotification, handleValidationErrors, async (req, res) => {
  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2',
      [req.user.id, 'admin']
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { user_ids, ...notificationData } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids array is required and must not be empty'
      });
    }

    const notifications = await notificationController.sendNotificationToUsers(user_ids, {
      ...notificationData,
      sender_id: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: `Sent ${notifications.length} notifications successfully`,
      data: notifications
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await notificationController.getNotificationStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
});

module.exports = router; 