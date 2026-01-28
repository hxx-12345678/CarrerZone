const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CompanyFollow = sequelize.define('CompanyFollow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      newJobs: true,
      companyUpdates: true,
      jobAlerts: true,
      email: true,
      push: true,
      sms: false
    },
    field: 'notification_preferences',
    comment: 'Notification preferences for this company'
  },
  followedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'followed_at'
  },
  lastNotificationAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_notification_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional follow data'
  }
}, {
  tableName: 'company_follows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'company_id'],
      unique: true,
      name: 'unique_user_company_follow'
    },
    {
      fields: ['company_id']
    },
    {
      fields: ['followed_at']
    }
  ],
  // Removed hooks that tried to update non-existent followerCount column
});

// Instance methods
CompanyFollow.prototype.getNotificationCount = function() {
  return this.notificationPreferences?.newJobs ? 1 : 0;
};

CompanyFollow.prototype.isNotificationEnabled = function(type) {
  return this.notificationPreferences?.[type] || false;
};

CompanyFollow.prototype.updateLastNotification = function() {
  this.lastNotificationAt = new Date();
  return this.save();
};

module.exports = CompanyFollow; 