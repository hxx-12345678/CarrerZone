const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const EmployerQuota = sequelize.define('EmployerQuota', {
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
  quotaType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  resetAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'employer_quotas',
  indexes: [
    { fields: ['userId'] },
    { fields: ['quotaType'] },
    { unique: true, name: 'unique_user_quotaType', fields: ['userId', 'quotaType'] }
  ]
});

module.exports = EmployerQuota;


