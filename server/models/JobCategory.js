const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const JobCategory = sequelize.define('JobCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'CSS color class for UI styling'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'job_categories',
      key: 'id'
    },
    comment: 'For sub-categories'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional category-specific data'
  }
}, {
  tableName: 'job_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (category) => {
      if (!category.slug) {
        category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
    },
    beforeUpdate: (category) => {
      if (category.changed('name') && !category.changed('slug')) {
        category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
    }
  }
});

// Instance methods
JobCategory.prototype.getFullPath = function() {
  return this.name;
};

JobCategory.prototype.getJobCount = async function() {
  const { Job } = require('../config/index');
  return await Job.count({
    where: {
      category: this.name,
      status: 'active'
    }
  });
};

module.exports = JobCategory; 