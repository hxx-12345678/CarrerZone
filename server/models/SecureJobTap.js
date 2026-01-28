const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SecureJobTap = sequelize.define('SecureJobTap', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  tappedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'tapped_at'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  }
}, {
  tableName: 'secure_job_taps',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id', 'job_id'],
      unique: true,
      name: 'unique_user_job_tap'
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['job_id']
    },
    {
      fields: ['tapped_at']
    }
  ]
});

module.exports = SecureJobTap;
