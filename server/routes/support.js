const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

// Create support message (public endpoint)
router.post('/messages', [
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required'),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters'),
  body('category').isIn(['general', 'technical', 'sales', 'billing', 'feature', 'bug', 'fraud', 'spam', 'misconduct', 'whistleblower']).withMessage('Category is required and must be one of: general, technical, sales, billing, feature, bug, fraud, spam, misconduct, whistleblower')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { SupportMessage } = require('../config/index');
    const { firstName, lastName, email, subject, message, category } = req.body;

    // Create support message
    const supportMessage = await SupportMessage.create({
      firstName,
      lastName,
      email,
      subject,
      message,
      category,
      status: 'new',
      priority: ['fraud', 'spam', 'misconduct', 'whistleblower'].includes(category) ? 'urgent' : category === 'bug' ? 'high' : category === 'technical' ? 'medium' : 'low'
    });

    console.log('✅ Support message created:', supportMessage.id);

    // Send notification to super admin
    try {
      const { Notification, User } = require('../config/index');
      
      // Find super admin users
      const superAdmins = await User.findAll({
        where: { user_type: 'superadmin' }
      });

      for (const admin of superAdmins) {
        // Special handling for whistleblower reports
        const isWhistleblower = ['fraud', 'spam', 'misconduct', 'whistleblower'].includes(category);
        const isAnonymous = firstName === 'Anonymous' && lastName === 'Reporter';
        
        let title, message, shortMessage, icon;
        
        if (isWhistleblower) {
          title = `🚨 URGENT: ${category.toUpperCase()} Report`;
          message = isAnonymous 
            ? `Anonymous ${category} report received: "${subject}"`
            : `${category} report from ${firstName} ${lastName}: "${subject}"`;
          shortMessage = `🚨 ${category.toUpperCase()}: ${subject}`;
          icon = 'alert-triangle';
        } else {
          title = `🆘 New Support Message`;
          message = `New ${category} support message from ${firstName} ${lastName}: "${subject}"`;
          shortMessage = `Support: ${subject}`;
          icon = 'help-circle';
        }

        await Notification.create({
          userId: admin.id,
          type: 'system',
          title,
          message,
          shortMessage,
          priority: isWhistleblower ? 'urgent' : (category === 'bug' ? 'high' : 'medium'),
          actionUrl: `/super-admin/support?messageId=${supportMessage.id}`,
          actionText: 'View Report',
          icon,
          metadata: {
            supportMessageId: supportMessage.id,
            category,
            senderName: `${firstName} ${lastName}`,
            senderEmail: email,
            subject,
            isWhistleblower,
            isAnonymous
          }
        });
      }
      
      console.log(`✅ Support notifications sent to ${superAdmins.length} super admins`);
    } catch (notificationError) {
      console.error('❌ Failed to send support notifications:', notificationError);
      // Don't fail the support message creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Support message sent successfully',
      data: {
        id: supportMessage.id,
        status: supportMessage.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating support message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send support message'
    });
  }
});

// Get all support messages (admin only)
router.get('/messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { SupportMessage } = require('../config/index');
    const { page = 1, limit = 20, status, category, priority } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;

    const { count, rows: messages } = await SupportMessage.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching support messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support messages'
    });
  }
});

// Get support message by ID (admin only)
router.get('/messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { SupportMessage } = require('../config/index');
    const { id } = req.params;

    const message = await SupportMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Support message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('❌ Error fetching support message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support message'
    });
  }
});

// Update support message status (admin only)
router.put('/messages/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['new', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('response').optional().isLength({ max: 5000 }).withMessage('Response too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { SupportMessage } = require('../config/index');
    const { id } = req.params;
    const { status, response } = req.body;

    const message = await SupportMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Support message not found'
      });
    }

    const updateData = { status };
    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = req.user.id;
    }

    await message.update(updateData);

    // Send email response to user if response is provided
    if (response && message.email) {
      try {
        console.log('📧 Attempting to send support response email...');
        console.log('📧 Email details:', {
          to: message.email,
          subject: message.subject,
          adminName: req.user.first_name ? `${req.user.first_name} ${req.user.last_name}` : 
                     req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Support Team',
          responseLength: response.length
        });
        
        const emailService = require('../services/emailService');
        const adminName = req.user.first_name ? `${req.user.first_name} ${req.user.last_name}` : 
                         req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Support Team';
        
        const emailResult = await emailService.sendSupportResponse(message, response, adminName);
        
        if (emailResult.success) {
          console.log('✅ Support response email sent successfully to:', message.email);
          console.log('✅ Email result:', emailResult);
        } else {
          console.error('❌ Failed to send support response email:', emailResult.message);
          console.error('❌ Email result:', emailResult);
        }
      } catch (emailError) {
        console.error('❌ Error sending support response email:', emailError);
        console.error('❌ Error stack:', emailError.stack);
        // Don't fail the request if email fails
      }
    } else {
      console.log('📧 Email not sent - missing response or email:', {
        hasResponse: !!response,
        hasEmail: !!message.email,
        email: message.email
      });
    }

    res.json({
      success: true,
      message: 'Support message updated successfully',
      data: message
    });

  } catch (error) {
    console.error('❌ Error updating support message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support message'
    });
  }
});

// Mark support message as read by admin
router.post('/messages/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { SupportMessage } = require('../config/index');
    const { id } = req.params;
    const adminId = req.user.id;

    const message = await SupportMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Support message not found'
      });
    }

    // Update read tracking
    const readBy = message.readBy || [];
    const readAt = message.readAt || {};
    const now = new Date();

    if (!readBy.includes(adminId)) {
      readBy.push(adminId);
    }
    readAt[adminId] = now;

    await message.update({
      readBy,
      readAt,
      lastReadBy: adminId,
      lastReadAt: now
    });

    res.json({
      success: true,
      message: 'Support message marked as read',
      data: {
        readBy,
        readAt,
        lastReadBy: adminId,
        lastReadAt: now
      }
    });

  } catch (error) {
    console.error('❌ Error marking support message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark support message as read'
    });
  }
});

// Get support statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { SupportMessage } = require('../config/index');

    const stats = await SupportMessage.findAll({
      attributes: [
        'status',
        [SupportMessage.sequelize.fn('COUNT', SupportMessage.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const categoryStats = await SupportMessage.findAll({
      attributes: [
        'category',
        [SupportMessage.sequelize.fn('COUNT', SupportMessage.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    const totalMessages = await SupportMessage.count();
    const newMessages = await SupportMessage.count({ where: { status: 'new' } });
    const inProgressMessages = await SupportMessage.count({ where: { status: 'in_progress' } });
    const resolvedMessages = await SupportMessage.count({ where: { status: 'resolved' } });

    res.json({
      success: true,
      data: {
        total: totalMessages,
        new: newMessages,
        inProgress: inProgressMessages,
        resolved: resolvedMessages,
        byStatus: stats,
        byCategory: categoryStats
      }
    });

  } catch (error) {
    console.error('❌ Error fetching support stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support statistics'
    });
  }
});

module.exports = router;
