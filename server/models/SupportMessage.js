const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupportMessage = sequelize.define('SupportMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('general', 'technical', 'sales', 'billing', 'feature', 'bug', 'fraud', 'spam', 'misconduct', 'whistleblower'),
      allowNull: false,
      defaultValue: 'general'
    },
    status: {
      type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'new'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to'
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at'
    },
    respondedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'responded_by'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    readBy: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      field: 'read_by'
    },
    readAt: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      field: 'read_at'
    },
    lastReadBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_read_by'
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_read_at'
    }
  }, {
    tableName: 'support_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['category']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return SupportMessage;
};
