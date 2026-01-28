'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Company = require('../models/Company');

const { authenticateToken } = require('../middlewares/auth');

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id }
        ],
        isBlocked: false
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'first_name', 'last_name', 'email', 'user_type', 'company_id']
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'first_name', 'last_name', 'email', 'user_type', 'company_id']
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    // Transform conversations to include other participant info
    const transformedConversations = conversations.map(conv => {
      const otherParticipant = conv.participant1Id === req.user.id ? conv.participant2 : conv.participant1;
      const unreadCount = conv.participant1Id === req.user.id ? conv.unreadCountParticipant1 : conv.unreadCountParticipant2;
      const isUnread = unreadCount > 0;

      // Generate title from participant names
      const title = otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : 'Unknown User';

      return {
        id: conv.id,
        title: title,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: unreadCount,
        isUnread,
        otherParticipant: {
          id: otherParticipant.id,
          name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
          email: otherParticipant.email,
          userType: otherParticipant.user_type,
          company: (otherParticipant.companyId || otherParticipant.company_id) ? { id: (otherParticipant.companyId || otherParticipant.company_id) } : null
        },
        lastMessage: null, // We'll fetch this separately if needed
        metadata: conv.metadata
      };
    });

    res.json({
      success: true,
      data: transformedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// List company coworkers (recruiters/admins in same company) to start chats
router.get('/company-users', authenticateToken, async (req, res) => {
  try {
    const userCompanyId = req.user.companyId || req.user.company_id
    if (!userCompanyId) {
      return res.json({ success: true, data: [] })
    }
    const coworkers = await User.findAll({
      where: {
        companyId: userCompanyId,
        id: { [Op.ne]: req.user.id },
        user_type: { [Op.in]: ['employer', 'admin'] }
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'user_type']
    })
    return res.json({
      success: true, data: coworkers.map(u => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        email: u.email,
        userType: u.user_type
      }))
    })
  } catch (error) {
    console.error('Error listing company users:', error)
    return res.status(500).json({ success: false, message: 'Failed to list users' })
  }
})

// Start (or fetch existing) conversation with a coworker in same company
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { receiverId, title } = req.body || {}
    if (!receiverId) return res.status(400).json({ success: false, message: 'receiverId is required' })

    // Validate coworker and same company
    const receiver = await User.findByPk(receiverId)
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' })

    // Use companyId (camelCase) as Sequelize model attribute maps to company_id in DB
    const userCompanyId = req.user.companyId || req.user.company_id
    const receiverCompanyId = receiver.companyId || receiver.company_id
    if (!userCompanyId || String(receiverCompanyId) !== String(userCompanyId)) {
      return res.status(403).json({ success: false, message: 'Users are not in the same company' })
    }

    // Normalize participants order as in model hook (compare UUIDs as strings)
    const userId = String(req.user.id)
    const recvId = String(receiverId)
    const p1 = userId < recvId ? userId : recvId
    const p2 = userId < recvId ? recvId : userId

    // Use findOrCreate to handle both finding existing and creating new conversations
    // The unique constraint is on (participant1_id, participant2_id, conversation_type)
    // This handles race conditions where two requests try to create the same conversation
    try {
      const [conversation, created] = await Conversation.findOrCreate({
        where: {
          participant1Id: p1,
          participant2Id: p2,
          conversationType: 'direct'
        },
        defaults: {
          isBlocked: false
        }
      })

      // If conversation was blocked, unblock it since user is trying to start it
      if (!created && conversation.isBlocked) {
        await conversation.update({ isBlocked: false })
      }

      return res.json({ success: true, data: { id: conversation.id } })
    } catch (createError) {
      // If creation fails due to unique constraint, try to find existing again
      // This handles race conditions where conversation was created between find and create
      if (createError.name === 'SequelizeUniqueConstraintError') {
        const existing = await Conversation.findOne({
          where: {
            participant1Id: p1,
            participant2Id: p2,
            conversationType: 'direct'
          }
        })
        if (existing) {
          // Unblock if needed
          if (existing.isBlocked) {
            await existing.update({ isBlocked: false })
          }
          return res.json({ success: true, data: { id: existing.id } })
        }
      }
      throw createError
    }
  } catch (error) {
    console.error('Error starting conversation:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to start conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in conversation
    const [convRows] = await sequelize.query(
      'SELECT "id" FROM "conversations" WHERE "id" = :cid AND ("participant1_id" = :uid OR "participant2_id" = :uid) LIMIT 1;',
      { replacements: { cid: conversationId, uid: req.user.id }, type: sequelize.QueryTypes.SELECT }
    )

    if (!convRows || !convRows.id) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages with pagination
    const offset = (page - 1) * limit;
    const messages = await Message.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'user_type', 'company_id']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          receiverId: req.user.id,
          isRead: false
        }
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      if (conversation.participant1Id === req.user.id) {
        conversation.unreadCountParticipant1 = 0;
      } else if (conversation.participant2Id === req.user.id) {
        conversation.unreadCountParticipant2 = 0;
      }
      await conversation.save();
    }

    // Transform messages
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      messageType: msg.messageType,
      createdAt: msg.created_at,
      isRead: msg.isRead,
      isFromMe: msg.senderId === req.user.id,
      sender: {
        id: msg.sender.id,
        name: `${msg.sender.first_name} ${msg.sender.last_name}`,
        userType: msg.sender.user_type,
        company: (msg.sender.companyId || msg.sender.company_id) ? { id: (msg.sender.companyId || msg.sender.company_id) } : null
      },
      metadata: msg.metadata
    }));

    res.json({
      success: true,
      data: {
        messages: transformedMessages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: await Message.count({ where: { conversationId } })
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is participant in conversation
    const [convRows] = await sequelize.query(
      'SELECT "id", "participant1_id" AS "participant1Id", "participant2_id" AS "participant2Id" FROM "conversations" WHERE "id" = :cid AND ("participant1_id" = :uid OR "participant2_id" = :uid) LIMIT 1;',
      { replacements: { cid: conversationId, uid: req.user.id }, type: sequelize.QueryTypes.SELECT }
    )

    if (!convRows || !convRows.id) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Determine receiver
    const receiverId = convRows.participant1Id === req.user.id ? convRows.participant2Id : convRows.participant1Id;

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      receiverId,
      messageType,
      content: content.trim()
    });

    // Update conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      conversation.lastMessageId = message.id;
      conversation.lastMessageAt = new Date();

      // Update unread count for the receiver
      if (conversation.participant1Id === receiverId) {
        conversation.unreadCountParticipant1 = (conversation.unreadCountParticipant1 || 0) + 1;
      } else if (conversation.participant2Id === receiverId) {
        conversation.unreadCountParticipant2 = (conversation.unreadCountParticipant2 || 0) + 1;
      }

      await conversation.save();
    }

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.created_at,
        isFromMe: true,
        sender: {
          id: req.user.id,
          name: `${req.user.first_name} ${req.user.last_name}`,
          userType: req.user.user_type
        }
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Mark conversation as read
router.put('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark all messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          receiverId: req.user.id,
          isRead: false
        }
      }
    );

    // Update conversation unread count
    await conversation.update({ unreadCount: 0 });

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark conversation as read'
    });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Conversation.sum('unreadCount', {
      where: {
        [Op.or]: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id }
        ],
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        unreadCount: unreadCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

module.exports = router;
