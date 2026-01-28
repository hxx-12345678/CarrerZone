const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/adminAuth');
const AdminNotificationService = require('../services/adminNotificationService');


/**
 * @route   GET /api/admin/notifications
 * @desc    Get admin notifications with pagination and filtering
 * @access  Private (Super Admin)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      priority,
      isRead,
      type
    } = req.query;

    const result = await AdminNotificationService.getNotifications({
      page,
      limit,
      category,
      priority,
      isRead: isRead !== undefined ? isRead === 'true' : null,
      type
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/notifications/stats
 * @desc    Get notification statistics
 * @access  Private (Super Admin)
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await AdminNotificationService.getNotificationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private (Super Admin)
 */
router.put('/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await AdminNotificationService.markAsRead(id);
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (Super Admin)
 */
router.put('/read-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await AdminNotificationService.markAllAsRead();
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/admin/notifications/check-milestones
 * @desc    Manually check and create milestone notifications
 * @access  Private (Super Admin)
 */
router.post('/check-milestones', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await AdminNotificationService.checkJobseekerMilestones();
    await AdminNotificationService.checkJobPostingMilestones();
    
    res.json({
      success: true,
      message: 'Milestone check completed'
    });
  } catch (error) {
    console.error('❌ Error checking milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check milestones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/notifications/cleanup
 * @desc    Clean up old notifications
 * @access  Private (Super Admin)
 */
router.delete('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    const deletedCount = await AdminNotificationService.cleanupOldNotifications(daysOld);
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old notifications`,
      deletedCount
    });
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
