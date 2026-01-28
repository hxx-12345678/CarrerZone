const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserActivityLog = sequelize.define('UserActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  activityType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'jobs', key: 'id' }
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'job_applications', key: 'id' }
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'user_activity_logs',
  indexes: [
    { fields: ['userId'] },
    { fields: ['activityType'] },
    { fields: ['timestamp'] },
    { fields: ['jobId'] },
    { fields: ['applicationId'] },
    { name: 'user_activity_logs_composite', fields: ['userId', 'activityType', 'timestamp'] }
  ]
});

// Define associations
UserActivityLog.associate = (models) => {
  UserActivityLog.belongsTo(models.User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  UserActivityLog.belongsTo(models.Job, { 
    foreignKey: 'jobId', 
    as: 'job' 
  });
  UserActivityLog.belongsTo(models.JobApplication, { 
    foreignKey: 'applicationId', 
    as: 'application' 
  });
};

module.exports = UserActivityLog;


