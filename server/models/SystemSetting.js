const { sequelize } = require('../config/sequelize');
const { DataTypes } = require('sequelize');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Setting key identifier'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Setting value (stored as text, can be JSON)'
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string',
    comment: 'Type of the setting value'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Human-readable description of the setting'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Category for grouping settings'
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User ID who last updated this setting'
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  underscored: true
});

module.exports = SystemSetting;



