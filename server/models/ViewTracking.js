const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ViewTracking = sequelize.define('ViewTracking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  viewerId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow anonymous views
    field: 'viewer_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of the user who viewed (null for anonymous)'
  },
  viewedUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'viewed_user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of the user whose profile was viewed'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    },
    comment: 'ID of the job that was viewed (if applicable)'
  },
  viewType: {
    type: DataTypes.ENUM('job_view', 'profile_view', 'company_view'),
    allowNull: false,
    field: 'view_type',
    comment: 'Type of view that occurred'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address',
    comment: 'IP address of the viewer'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
    comment: 'User agent string'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'session_id',
    comment: 'Session ID for tracking anonymous users'
  },
  referrer: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Referrer URL'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional view metadata'
  }
}, {
  tableName: 'view_tracking',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['viewer_id', 'viewed_user_id', 'view_type'],
      name: 'unique_user_view',
      unique: true,
      comment: 'Prevent duplicate views from same user'
    },
    {
      fields: ['viewed_user_id', 'view_type'],
      name: 'viewed_user_type'
    },
    {
      fields: ['job_id', 'view_type'],
      name: 'job_view_type'
    },
    {
      fields: ['ip_address', 'viewed_user_id'],
      name: 'ip_user_view'
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    afterCreate: async (view) => {
      try {
        // Update profile views count in UserDashboard
        const { UserDashboard } = require('../config/index');
        const dashboard = await UserDashboard.findOne({
          where: { userId: view.viewedUserId }
        });
        
        if (dashboard) {
          await dashboard.updateProfileStats();
        } else {
          // Create dashboard if it doesn't exist
          await UserDashboard.create({
            userId: view.viewedUserId,
            profileViews: 1,
            lastProfileView: new Date()
          });
        }
        
        // Update job views if it's a job view
        if (view.jobId && view.viewType === 'job_view') {
          const { Job } = require('../config/index');
          await Job.increment('views', { where: { id: view.jobId } });
        }
        
        console.log(`✅ View tracked: ${view.viewType} for user ${view.viewedUserId}`);
      } catch (error) {
        console.error('Error updating view stats:', error);
      }
    }
  }
});

module.exports = ViewTracking;
