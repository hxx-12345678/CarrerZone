const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'receiver_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system', 'interview_invite', 'application_update'),
    allowNull: false,
    defaultValue: 'text',
    field: 'message_type'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_url'
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_name'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size'
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_type'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_delivered'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_edited'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
  },
  originalContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'original_content'
  },
  replyToMessageId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reply_to_message_id',
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  },
  deletedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'deleted_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['conversation_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    afterCreate: async (message) => {
      // Update conversation last message (use camelCase columns explicitly)
      try {
        await sequelize.query(
          'UPDATE "conversations" SET "lastMessageAt" = NOW(), "lastMessageId" = :mid, "unreadCount" = COALESCE("unreadCount", 0) + 1, "updated_at" = NOW() WHERE "id" = :cid',
          {
            replacements: { mid: message.id, cid: message.conversationId },
            type: sequelize.QueryTypes.UPDATE
          }
        );
      } catch (e) {
        // Fallback using model with correct literal if raw SQL fails
        const Conversation = require('./Conversation');
        await Conversation.update(
          {
            lastMessageAt: new Date(),
            lastMessageId: message.id,
            // Ensure we reference camelCase column
            unreadCount: sequelize.literal('"unreadCount" + 1')
          },
          { where: { id: message.conversationId }, returning: false }
        );
      }
    }
  }
});

// Instance methods
Message.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

Message.prototype.markAsDelivered = function() {
  this.isDelivered = true;
  this.deliveredAt = new Date();
  return this.save();
};

Message.prototype.edit = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

Message.prototype.getFormattedTime = function() {
  const now = new Date();
  const messageTime = new Date(this.createdAt);
  const diffInHours = (now - messageTime) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return messageTime.toLocaleDateString();
  }
};

module.exports = Message; 