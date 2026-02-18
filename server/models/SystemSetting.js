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
    unique: true
  },
  value: {
    type: DataTypes.JSONB, // Changed from TEXT to JSONB to match Render and support complex settings
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // Use string for more flexibility
    allowNull: false,
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'general'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public'
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  underscored: true
});

module.exports = SystemSetting;



