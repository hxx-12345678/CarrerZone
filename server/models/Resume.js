const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
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
  objective: {
    type: DataTypes.VIRTUAL
  },
  languages: {
    type: DataTypes.VIRTUAL
  },
  certifications: {
    type: DataTypes.VIRTUAL
  },
  projects: {
    type: DataTypes.VIRTUAL
  },
  achievements: {
    type: DataTypes.VIRTUAL
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'is_primary'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'is_public'
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'view_count'
  },
  downloads: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'download_count'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'resumes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
  hooks: {
    beforeCreate: async (resume) => {
      if (!resume.lastUpdated) {
        resume.lastUpdated = new Date();
      }
    },
    beforeUpdate: async (resume) => {
      resume.lastUpdated = new Date();
    },
    afterCreate: async (resume) => {
      try {
        const DashboardService = require('../services/dashboardService');
        await DashboardService.updateDashboardStats(resume.userId, {
          totalResumes: sequelize.literal('totalResumes + 1'),
          hasDefaultResume: resume.isDefault,
          lastResumeUpdate: new Date()
        });
        
        // Record activity
        await DashboardService.recordActivity(resume.userId, 'resume_upload', {
          resumeId: resume.id,
          title: resume.title,
          isDefault: resume.isDefault
        });
      } catch (error) {
        console.error('Error updating dashboard stats after resume creation:', error);
      }
    },
    afterUpdate: async (resume) => {
      try {
        const DashboardService = require('../services/dashboardService');
        
        const updates = {
          lastResumeUpdate: new Date()
        };
        
        // Check if default status changed
        if (resume.changed('isDefault')) {
          updates.hasDefaultResume = resume.isDefault;
        }
        
        await DashboardService.updateDashboardStats(resume.userId, updates);
        
        // Record activity
        await DashboardService.recordActivity(resume.userId, 'resume_update', {
          resumeId: resume.id,
          title: resume.title,
          changes: resume.changed()
        });
      } catch (error) {
        console.error('Error updating dashboard stats after resume update:', error);
      }
    },
    afterDestroy: async (resume) => {
      try {
        const DashboardService = require('../services/dashboardService');
        await DashboardService.updateDashboardStats(resume.userId, {
          totalResumes: sequelize.literal('totalResumes - 1')
        });
        
        // Record activity
        await DashboardService.recordActivity(resume.userId, 'resume_delete', {
          resumeId: resume.id,
          title: resume.title
        });
      } catch (error) {
        console.error('Error updating dashboard stats after resume deletion:', error);
      }
    }
  }
});

// Instance methods
Resume.prototype.getSkillsString = function() {
  const skills = Array.isArray(this.skills) ? this.skills : [];
  return skills.join(', ');
};

Resume.prototype.getLanguagesString = function() {
  const languages = Array.isArray(this.languages) ? this.languages : [];
  return languages.map(lang => `${lang.name} (${lang.proficiency})`).join(', ');
};

Resume.prototype.getCertificationsString = function() {
  const certifications = Array.isArray(this.certifications) ? this.certifications : [];
  return certifications.map(cert => `${cert.name} - ${cert.issuer}`).join(', ');
};

Resume.prototype.getTotalExperience = function() {
  // This would be calculated from work experience entries
  return 0; // Placeholder
};

module.exports = Resume; 