const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  participant1Id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'participant1_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  participant2Id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'participant2_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reference_id'
  },
  referenceType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reference_type'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  conversationType: {
    type: DataTypes.ENUM('direct', 'job_application', 'requirement_application', 'interview'),
    allowNull: false,
    defaultValue: 'direct',
    field: 'conversation_type'
  },
  lastMessageId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'last_message_id',
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
  },
  unreadCountParticipant1: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'unread_count_participant1'
  },
  unreadCountParticipant2: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'unread_count_participant2'
  },
  isArchivedParticipant1: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_archived_participant1'
  },
  isArchivedParticipant2: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_archived_participant2'
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_blocked'
  },
  blockedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'blocked_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  blockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'blocked_at'
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['participant1_id']
    },
    {
      fields: ['participant2_id']
    },
    {
      fields: ['reference_id']
    },
    {
      fields: ['last_message_at']
    },
    {
      fields: ['is_blocked']
    },
    {
      unique: true,
      name: 'conversations_unique_participants_reference',
      fields: ['participant1_id', 'participant2_id', 'reference_id']
    }
  ],
  hooks: {
    beforeCreate: (conversation) => {
      // Ensure participant1Id is always the smaller UUID for consistency
      if (conversation.participant1Id > conversation.participant2Id) {
        [conversation.participant1Id, conversation.participant2Id] = 
        [conversation.participant2Id, conversation.participant1Id];
      }
    }
  }
});

// Instance methods
Conversation.prototype.getOtherParticipant = function(userId) {
  return this.participant1Id === userId ? this.participant2Id : this.participant1Id;
};

Conversation.prototype.isParticipant = function(userId) {
  return this.participant1Id === userId || this.participant2Id === userId;
};

Conversation.prototype.markAsRead = function(userId) {
  if (this.participant1Id === userId) {
    this.unreadCountParticipant1 = 0;
  } else if (this.participant2Id === userId) {
    this.unreadCountParticipant2 = 0;
  }
  return this.save();
};

Conversation.prototype.archive = function(userId) {
  if (this.participant1Id === userId) {
    this.isArchivedParticipant1 = true;
  } else if (this.participant2Id === userId) {
    this.isArchivedParticipant2 = true;
  }
  return this.save();
};

Conversation.prototype.unarchive = function(userId) {
  if (this.participant1Id === userId) {
    this.isArchivedParticipant1 = false;
  } else if (this.participant2Id === userId) {
    this.isArchivedParticipant2 = false;
  }
  return this.save();
};

Conversation.prototype.getFormattedLastMessageTime = function() {
  if (!this.lastMessageAt) return null;
  
  const now = new Date();
  const messageTime = new Date(this.lastMessageAt);
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

module.exports = Conversation; 