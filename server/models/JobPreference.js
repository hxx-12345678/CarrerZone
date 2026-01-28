const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const JobPreference = sequelize.define('JobPreference', {
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
    },
    onDelete: 'CASCADE'
  },
  // Job preferences
  preferredJobTitles: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_job_titles'
  },
  preferredLocations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_locations'
  },
  preferredJobTypes: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_job_types'
  },
  preferredExperienceLevels: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_experience_levels'
  },
  preferredSalaryMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'preferred_salary_min'
  },
  preferredSalaryMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'preferred_salary_max'
  },
  preferredSalaryCurrency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'INR',
    field: 'preferred_salary_currency'
  },
  preferredSkills: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_skills'
  },
  preferredWorkMode: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_work_mode'
  },
  preferredShiftTiming: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_shift_timing'
  },
  // Additional preferences
  willingToRelocate: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'willing_to_relocate'
  },
  willingToTravel: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'willing_to_travel'
  },
  noticePeriod: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'notice_period'
  },
  // Notification preferences
  emailAlerts: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'email_alerts'
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'push_notifications'
  },
  // Region specific
  region: {
    type: DataTypes.ENUM('india', 'gulf', 'other'),
    allowNull: true,
    defaultValue: 'india'
  },
  // Additional metadata
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'is_active'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'last_updated'
  }
}, {
  tableName: 'job_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['userId']
    },
    {
      fields: ['region']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = JobPreference;
