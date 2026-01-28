const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobTemplate = sequelize.define('JobTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public'
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Complete job form data that matches post-job page
  templateData: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    field: 'template_data'
  },
  // Metadata
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by'
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'usage_count'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'job_templates',
  timestamps: true,
  indexes: [
    {
      fields: ['created_by']
    },
    {
      fields: ['company_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_public']
    },
    {
      fields: ['is_active']
    }
  ]
});

  // Define associations
  JobTemplate.associate = (models) => {
    // JobTemplate belongs to User (creator)
    JobTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // JobTemplate belongs to Company
    JobTemplate.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  return JobTemplate;
};