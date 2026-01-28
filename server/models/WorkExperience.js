const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const WorkExperience = sequelize.define('WorkExperience', {
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
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'company'
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'title'
  },
  // Note: 'department' field removed - column doesn't exist in work_experiences table
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date'
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_current'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  achievements: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true
  },
  skills: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  salaryCurrency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'INR',
    field: 'salary_currency'
  },
  employmentType: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
    allowNull: true,
    defaultValue: 'full-time',
    field: 'employment_type'
  },
  reasonForLeaving: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'reason_for_leaving'
  },
  supervisorName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'supervisor_name'
  },
  supervisorContact: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'supervisor_contact'
  },
  canContactSupervisor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_contact_supervisor'
  }
}, {
  tableName: 'work_experiences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
  hooks: {
    beforeCreate: async (experience) => {
      if (experience.isCurrent) {
        experience.endDate = null;
      }
    },
    beforeUpdate: async (experience) => {
      if (experience.changed('isCurrent') && experience.isCurrent) {
        experience.endDate = null;
      }
    }
  }
});

// Instance methods
WorkExperience.prototype.getDuration = function() {
  const start = new Date(this.startDate);
  const end = this.endDate ? new Date(this.endDate) : new Date();
  
  const diffInMs = end - start;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffInDays / 365);
  const months = Math.floor((diffInDays % 365) / 30);
  
  let duration = '';
  if (years > 0) {
    duration += `${years} year${years > 1 ? 's' : ''}`;
  }
  if (months > 0) {
    duration += `${duration ? ' ' : ''}${months} month${months > 1 ? 's' : ''}`;
  }
  if (!duration) {
    duration = 'Less than a month';
  }
  
  return duration;
};

WorkExperience.prototype.getFormattedPeriod = function() {
  const start = new Date(this.startDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short' 
  });
  
  if (this.isCurrent) {
    return `${start} - Present`;
  }
  
  const end = new Date(this.endDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short' 
  });
  
  return `${start} - ${end}`;
};

WorkExperience.prototype.getSkillsString = function() {
  return this.skills && Array.isArray(this.skills) ? this.skills.join(', ') : '';
};

WorkExperience.prototype.getTechnologiesString = function() {
  return this.skills && Array.isArray(this.skills) ? this.skills.join(', ') : '';
};

module.exports = WorkExperience; 