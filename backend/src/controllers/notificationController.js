const { pool } = require('../config/database');

class NotificationController {
  // Get all notifications for a user
  async getUserNotifications(userId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        n.*,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.username as sender_username
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = $1
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND n.is_read = false';
    }

    query += ' ORDER BY n.created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get notification by ID
  async getNotificationById(notificationId, userId) {
    const query = `
      SELECT 
        n.*,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.username as sender_username
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.id = $1 AND n.user_id = $2
    `;

    const result = await pool.query(query, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create new notification
  async createNotification(notificationData) {
    const { user_id, type, title, message, data, sender_id, related_entity_type, related_entity_id } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id, type, title, message, data, sender_id, 
        related_entity_type, related_entity_id, is_read, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      user_id, type, title, message, 
      data ? JSON.stringify(data) : null,
      sender_id, related_entity_type, related_entity_id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update notification
  async updateNotification(notificationId, updateData, userId) {
    const { title, message, data, is_read } = updateData;

    const query = `
      UPDATE notifications 
      SET title = COALESCE($1, title),
          message = COALESCE($2, message),
          data = COALESCE($3, data),
          is_read = COALESCE($4, is_read),
          updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `;

    const values = [
      title, message, 
      data ? JSON.stringify(data) : null,
      is_read, notificationId, userId
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const query = 'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [notificationId, userId]);
    
    return result.rows.length > 0;
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, updated_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING id
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.length;
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Get notifications by type
  async getNotificationsByType(userId, type, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        n.*,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.username as sender_username
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = $1 AND n.type = $2
      ORDER BY n.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [userId, type, limit, offset]);
    return result.rows;
  }

  // Send notification to multiple users
  async sendNotificationToUsers(userIds, notificationData) {
    const { type, title, message, data, sender_id, related_entity_type, related_entity_id } = notificationData;

    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await this.createNotification({
        user_id: userId,
        type,
        title,
        message,
        data,
        sender_id,
        related_entity_type,
        related_entity_id
      });
      notifications.push(notification);
    }

    return notifications;
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read,
        COUNT(CASE WHEN type = 'task' THEN 1 END) as task_notifications,
        COUNT(CASE WHEN type = 'project' THEN 1 END) as project_notifications,
        COUNT(CASE WHEN type = 'milestone' THEN 1 END) as milestone_notifications,
        COUNT(CASE WHEN type = 'comment' THEN 1 END) as comment_notifications,
        COUNT(CASE WHEN type = 'system' THEN 1 END) as system_notifications
      FROM notifications 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications() {
    const query = `
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '30 days' 
      AND is_read = true
    `;

    const result = await pool.query(query);
    return result.rowCount;
  }
}

module.exports = new NotificationController(); 