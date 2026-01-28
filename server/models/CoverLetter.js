const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CoverLetter = sequelize.define('CoverLetter', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  downloads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'cover_letters',
  timestamps: true,
  underscored: false,
  hooks: {
    beforeCreate: async (coverLetter) => {
      if (!coverLetter.lastUpdated) {
        coverLetter.lastUpdated = new Date();
      }
    },
    beforeUpdate: async (coverLetter) => {
      coverLetter.lastUpdated = new Date();
    },
    afterCreate: async (coverLetter) => {
      try {
        const DashboardService = require('../services/dashboardService');
        await DashboardService.updateDashboardStats(coverLetter.userId, {
          totalCoverLetters: sequelize.literal('totalCoverLetters + 1'),
          hasDefaultCoverLetter: coverLetter.isDefault,
          lastCoverLetterUpdate: new Date()
        });
        
        // Record activity
        await DashboardService.recordActivity(coverLetter.userId, 'cover_letter_upload', {
          coverLetterId: coverLetter.id,
          title: coverLetter.title,
          isDefault: coverLetter.isDefault
        });
      } catch (error) {
        console.error('Error updating dashboard stats after cover letter creation:', error);
      }
    },
    afterUpdate: async (coverLetter) => {
      try {
        const DashboardService = require('../services/dashboardService');
        
        const updates = {
          lastCoverLetterUpdate: new Date()
        };
        
        // Check if default status changed
        if (coverLetter.changed('isDefault')) {
          updates.hasDefaultCoverLetter = coverLetter.isDefault;
        }
        
        await DashboardService.updateDashboardStats(coverLetter.userId, updates);
        
        // Record activity
        await DashboardService.recordActivity(coverLetter.userId, 'cover_letter_update', {
          coverLetterId: coverLetter.id,
          title: coverLetter.title,
          changes: coverLetter.changed()
        });
      } catch (error) {
        console.error('Error updating dashboard stats after cover letter update:', error);
      }
    },
    afterDestroy: async (coverLetter) => {
      try {
        const DashboardService = require('../services/dashboardService');
        await DashboardService.updateDashboardStats(coverLetter.userId, {
          totalCoverLetters: sequelize.literal('totalCoverLetters - 1')
        });
        
        // Record activity
        await DashboardService.recordActivity(coverLetter.userId, 'cover_letter_delete', {
          coverLetterId: coverLetter.id,
          title: coverLetter.title
        });
      } catch (error) {
        console.error('Error updating dashboard stats after cover letter deletion:', error);
      }
    }
  }
});

// Instance methods
CoverLetter.prototype.getContentPreview = function(maxLength = 200) {
  if (!this.content) return '';
  return this.content.length > maxLength 
    ? this.content.substring(0, maxLength) + '...' 
    : this.content;
};

module.exports = CoverLetter;
