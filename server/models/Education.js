const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Education = sequelize.define('Education', {
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
  institution: {
    type: DataTypes.STRING,
    allowNull: false
  },
  degree: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fieldOfStudy: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'field_of_study'
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
  grade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  cgpa: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'gpa'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activities: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'relevant_courses'
  },
  achievements: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  educationType: {
    type: DataTypes.ENUM('bachelor', 'master', 'phd', 'diploma', 'certification', 'high-school', 'other'),
    allowNull: true,
    field: 'education_type'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_date'
  }
  // Note: The following fields are NOT in the database table, so they're removed:
  // scale, country, level, order, metadata, resumeId
}, {
  tableName: 'educations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false, // Don't automatically convert to snake_case
  hooks: {
    beforeCreate: async (education) => {
      if (education.isCurrent) {
        education.endDate = null;
      }
      // Remove any fields that don't exist in the database
      if (education.scale !== undefined) delete education.scale;
      if (education.country !== undefined) delete education.country;
      if (education.level !== undefined) delete education.level;
      if (education.order !== undefined) delete education.order;
      if (education.metadata !== undefined) delete education.metadata;
      if (education.resumeId !== undefined) delete education.resumeId;
    },
    beforeUpdate: async (education) => {
      if (education.changed('isCurrent') && education.isCurrent) {
        education.endDate = null;
      }
      // Remove any fields that don't exist in the database
      if (education.scale !== undefined) delete education.scale;
      if (education.country !== undefined) delete education.country;
      if (education.level !== undefined) delete education.level;
      if (education.order !== undefined) delete education.order;
      if (education.metadata !== undefined) delete education.metadata;
      if (education.resumeId !== undefined) delete education.resumeId;
    }
  }
});

// Instance methods
Education.prototype.getDuration = function() {
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

Education.prototype.getFormattedPeriod = function() {
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

Education.prototype.getGradeDisplay = function() {
  if (this.percentage) {
    return `${this.percentage}%`;
  } else if (this.cgpa) {
    const scaleMax = 10; // DB does not store scale; assume 10
    return `${this.cgpa}/${scaleMax} CGPA`;
  } else if (this.grade) {
    return this.grade;
  }
  return 'Not specified';
};

Education.prototype.getFullDegree = function() {
  return `${this.degree} in ${this.fieldOfStudy}`;
};

module.exports = Education; 