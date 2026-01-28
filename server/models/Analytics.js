const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'session_id'
  },
  eventType: {
    type: DataTypes.ENUM(
      'page_view', 'job_view', 'job_apply', 'job_bookmark', 'company_view', 
      'search_performed', 'filter_applied', 'login', 'logout', 'registration',
      'profile_update', 'resume_upload', 'application_submitted', 'interview_scheduled',
      'message_sent', 'notification_clicked', 'subscription_purchased', 'payment_made',
      'profile_like'
    ),
    allowNull: false,
    field: 'event_type'
  },
  eventCategory: {
    type: DataTypes.ENUM('user_engagement', 'job_interaction', 'company_interaction', 'application_process', 'payment', 'system'),
    allowNull: false,
    field: 'event_category'
  },
  pageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'page_url'
  },
  referrerUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'referrer_url'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address'
  },
  deviceType: {
    type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
    allowNull: true,
    field: 'device_type'
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  operatingSystem: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'operating_system'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'application_id',
    references: {
      model: 'job_applications',
      key: 'id'
    }
  },
  searchQuery: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'search_query'
  },
  filters: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'filters'
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'custom_parameters'
  }
}, {
  tableName: 'analytics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['session_id']
    },
    {
      fields: ['event_type']
    },
    {
      fields: ['event_category']
    },
    {
      fields: ['job_id']
    },
    {
      fields: ['company_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['device_type']
    }
  ],
  hooks: {
    beforeCreate: (analytics) => {
      // Auto-categorize events
      const categoryMap = {
        page_view: 'user_engagement',
        job_view: 'job_interaction',
        job_apply: 'application_process',
        job_bookmark: 'job_interaction',
        company_view: 'company_interaction',
        search_performed: 'user_engagement',
        filter_applied: 'user_engagement',
        login: 'system',
        logout: 'system',
        registration: 'system',
        profile_update: 'user_engagement',
        resume_upload: 'user_engagement',
        application_submitted: 'application_process',
        interview_scheduled: 'application_process',
        message_sent: 'user_engagement',
        notification_clicked: 'user_engagement',
        subscription_purchased: 'payment',
        payment_made: 'payment'
      };
      
      if (!analytics.eventCategory) {
        analytics.eventCategory = categoryMap[analytics.eventType] || 'system';
      }
    }
  }
});

// Instance methods
Analytics.prototype.getEventLabel = function() {
  const labels = {
    page_view: 'Page View',
    job_view: 'Job View',
    job_apply: 'Job Application',
    job_bookmark: 'Job Bookmark',
    company_view: 'Company View',
    search_performed: 'Search Performed',
    filter_applied: 'Filter Applied',
    login: 'User Login',
    logout: 'User Logout',
    registration: 'User Registration',
    profile_update: 'Profile Update',
    resume_upload: 'Resume Upload',
    application_submitted: 'Application Submitted',
    interview_scheduled: 'Interview Scheduled',
    message_sent: 'Message Sent',
    notification_clicked: 'Notification Clicked',
    subscription_purchased: 'Subscription Purchased',
    payment_made: 'Payment Made'
  };
  return labels[this.eventType] || this.eventType;
};

Analytics.prototype.getCategoryLabel = function() {
  const labels = {
    user_engagement: 'User Engagement',
    job_interaction: 'Job Interaction',
    company_interaction: 'Company Interaction',
    application_process: 'Application Process',
    payment: 'Payment',
    system: 'System'
  };
  return labels[this.eventCategory] || this.eventCategory;
};

Analytics.prototype.getFormattedDuration = function() {
  if (!this.duration) return null;
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

module.exports = Analytics; 