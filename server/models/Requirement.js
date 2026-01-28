const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Requirement = sequelize.define('Requirement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'posted_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  experience: { type: DataTypes.VIRTUAL },
  experienceMin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'experience_min'
  },
  experienceMax: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'experience_max'
  },
  salary: { type: DataTypes.VIRTUAL },
  salaryMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'salary_min'
  },
  salaryMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'salary_max'
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'INR',
    field: 'salary_currency'
  },
  jobType: { type: DataTypes.VIRTUAL },
  skills: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'required_skills'
  },
  keySkills: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'preferred_skills'
  },
  education: { type: DataTypes.VIRTUAL },
  validTill: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deadline'
  },
  noticePeriod: { type: DataTypes.VIRTUAL },
  remoteWork: {
    type: DataTypes.ENUM('on-site', 'remote', 'hybrid'),
    allowNull: true,
    defaultValue: 'on-site',
    field: 'location_type'
  },
  travelRequired: { type: DataTypes.VIRTUAL },
  shiftTiming: { type: DataTypes.VIRTUAL },
  benefits: { type: DataTypes.VIRTUAL },
  candidateDesignations: { type: DataTypes.VIRTUAL },
  candidateLocations: { type: DataTypes.VIRTUAL },
  includeWillingToRelocate: { type: DataTypes.VIRTUAL },
  currentSalaryMin: { type: DataTypes.VIRTUAL },
  currentSalaryMax: { type: DataTypes.VIRTUAL },
  includeNotMentioned: { type: DataTypes.VIRTUAL },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'closed', 'filled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  isUrgent: { type: DataTypes.VIRTUAL },
  isFeatured: { type: DataTypes.VIRTUAL },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  matches: { type: DataTypes.VIRTUAL },
  applications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'application_count'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at'
  },
  closedAt: { type: DataTypes.VIRTUAL },
  tags: { type: DataTypes.VIRTUAL },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  }
}, {
  tableName: 'requirements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (requirement) => {
      if (requirement.status === 'active' && !requirement.publishedAt) {
        requirement.publishedAt = new Date();
      }
    },
    beforeUpdate: async (requirement) => {
      if (requirement.changed('status')) {
        if (requirement.status === 'active' && !requirement.publishedAt) {
          requirement.publishedAt = new Date();
        } else if (requirement.status === 'closed' && !requirement.closedAt) {
          requirement.closedAt = new Date();
        }
      }
    }
  }
});

// Instance methods
Requirement.prototype.getExperienceRange = function() {
  if (this.experienceMin && this.experienceMax) {
    return `${this.experienceMin}-${this.experienceMax} years`;
  } else if (this.experienceMin) {
    return `${this.experienceMin}+ years`;
  } else if (this.experienceMax) {
    return `0-${this.experienceMax} years`;
  }
  return this.experience || 'Not specified';
};

Requirement.prototype.getSalaryRange = function() {
  if (this.salaryMin && this.salaryMax) {
    return `${this.currency} ${this.salaryMin.toLocaleString()}-${this.salaryMax.toLocaleString()}`;
  } else if (this.salaryMin) {
    return `${this.currency} ${this.salaryMin.toLocaleString()}+`;
  } else if (this.salaryMax) {
    return `${this.currency} Up to ${this.salaryMax.toLocaleString()}`;
  }
  return this.salary || 'Not specified';
};

Requirement.prototype.isExpired = function() {
  if (!this.validTill) return false;
  return new Date() > new Date(this.validTill);
};

Requirement.prototype.getStatusColor = function() {
  const statusColors = {
    draft: 'gray',
    active: 'green',
    paused: 'yellow',
    closed: 'red'
  };
  return statusColors[this.status] || 'gray';
};

module.exports = Requirement; 