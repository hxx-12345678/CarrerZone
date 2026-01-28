const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const JobBookmark = sequelize.define('JobBookmark', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
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
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  folder: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'default'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: true,
    defaultValue: 'medium'
  },
  reminderDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_date'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'job_bookmarks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'job_id'],
      unique: true,
      name: 'unique_user_job_bookmark'
    }
    // Note: Additional indexes will be created after columns are added via migration
  ],
  hooks: {
    afterCreate: async (bookmark) => {
      try {
        // Update job bookmark count
        const { Job } = require('../config/index');
        const job = await Job.findByPk(bookmark.job_id);
        if (job) {
          await job.increment('bookmarkCount');
        }
        
        // Update dashboard stats
        const DashboardService = require('../services/dashboardService');
        await DashboardService.updateDashboardStats(bookmark.userId, {
          totalBookmarks: sequelize.literal('totalBookmarks + 1'),
          lastBookmarkDate: new Date()
        });
        
        // Record activity
        await DashboardService.recordActivity(bookmark.userId, 'job_bookmark', {
          jobId: bookmark.jobId,
          bookmarkId: bookmark.id,
          action: 'created'
        });
      } catch (error) {
        console.error('Error updating dashboard stats after bookmark creation:', error);
      }
    },
    afterDestroy: async (bookmark) => {
      try {
        // Update job bookmark count
        const { Job } = require('../config/index');
        const job = await Job.findByPk(bookmark.job_id);
        if (job) {
          await job.decrement('bookmarkCount');
        }
        
        // Update dashboard stats
        const DashboardService = require('../services/dashboardService');
        await DashboardService.updateDashboardStats(bookmark.userId, {
          totalBookmarks: sequelize.literal('totalBookmarks - 1')
        });
        
        // Record activity
        await DashboardService.recordActivity(bookmark.userId, 'job_bookmark', {
          jobId: bookmark.jobId,
          bookmarkId: bookmark.id,
          action: 'deleted'
        });
      } catch (error) {
        console.error('Error updating dashboard stats after bookmark deletion:', error);
      }
    }
  }
});

// Instance methods
JobBookmark.prototype.isOverdue = function() {
  return this.reminderDate && this.reminderDate < new Date();
};

JobBookmark.prototype.daysUntilReminder = function() {
  if (!this.reminderDate) return null;
  const now = new Date();
  const diffTime = this.reminderDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

JobBookmark.prototype.getPriorityColor = function() {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'red'
  };
  return colors[this.priority] || 'gray';
};

module.exports = JobBookmark; 