const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserDashboard = sequelize.define('UserDashboard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Application statistics
  totalApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applicationsUnderReview: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applicationsShortlisted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applicationsRejected: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applicationsAccepted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastApplicationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Bookmark statistics
  totalBookmarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastBookmarkDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Search statistics
  totalSearches: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  savedSearches: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastSearchDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Resume statistics
  totalResumes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hasDefaultResume: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastResumeUpdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Job alert statistics
  totalJobAlerts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  activeJobAlerts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Profile statistics
  profileViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastProfileView: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Activity tracking
  lastLoginDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActivityDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalLoginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Dashboard preferences
  dashboardLayout: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'User preferences for dashboard layout and widgets'
  },
  favoriteActions: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'User favorite actions and shortcuts'
  },
  
  // Analytics metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional dashboard analytics and user behavior data'
  }
}, {
  tableName: 'user_dashboard',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['lastActivityDate']
    },
    {
      fields: ['totalApplications']
    },
    {
      fields: ['totalBookmarks']
    }
  ],
  hooks: {
    beforeCreate: (dashboard) => {
      dashboard.lastActivityDate = new Date();
    },
    beforeUpdate: (dashboard) => {
      dashboard.lastActivityDate = new Date();
    }
  }
});

// Instance methods
UserDashboard.prototype.updateApplicationStats = async function(applicationData) {
  // Update application counts based on status
  if (applicationData.status === 'reviewing') {
    this.applicationsUnderReview += 1;
  } else if (applicationData.status === 'shortlisted') {
    this.applicationsShortlisted += 1;
  } else if (applicationData.status === 'rejected') {
    this.applicationsRejected += 1;
  } else if (applicationData.status === 'accepted') {
    this.applicationsAccepted += 1;
  }
  
  this.totalApplications += 1;
  this.lastApplicationDate = new Date();
  
  return this.save();
};

UserDashboard.prototype.updateBookmarkStats = async function() {
  this.totalBookmarks += 1;
  this.lastBookmarkDate = new Date();
  return this.save();
};

UserDashboard.prototype.updateSearchStats = async function() {
  this.totalSearches += 1;
  this.lastSearchDate = new Date();
  return this.save();
};

UserDashboard.prototype.updateResumeStats = async function(hasDefault = false) {
  this.totalResumes += 1;
  this.hasDefaultResume = hasDefault;
  this.lastResumeUpdate = new Date();
  return this.save();
};

UserDashboard.prototype.updateJobAlertStats = async function(activeCount) {
  this.totalJobAlerts += 1;
  this.activeJobAlerts = activeCount;
  return this.save();
};

UserDashboard.prototype.updateProfileStats = async function() {
  this.profileViews += 1;
  this.lastProfileView = new Date();
  return this.save();
};

UserDashboard.prototype.updateLoginStats = async function() {
  this.lastLoginDate = new Date();
  this.totalLoginCount += 1;
  this.lastActivityDate = new Date();
  return this.save();
};

UserDashboard.prototype.getDashboardSummary = function() {
  return {
    applications: {
      total: this.totalApplications,
      underReview: this.applicationsUnderReview,
      shortlisted: this.applicationsShortlisted,
      rejected: this.applicationsRejected,
      accepted: this.applicationsAccepted,
      lastDate: this.lastApplicationDate
    },
    bookmarks: {
      total: this.totalBookmarks,
      lastDate: this.lastBookmarkDate
    },
    searches: {
      total: this.totalSearches,
      saved: this.savedSearches,
      lastDate: this.lastSearchDate
    },
    resumes: {
      total: this.totalResumes,
      hasDefault: this.hasDefaultResume,
      lastUpdate: this.lastResumeUpdate
    },
    jobAlerts: {
      total: this.totalJobAlerts,
      active: this.activeJobAlerts
    },
    profile: {
      views: this.profileViews,
      lastView: this.lastProfileView
    },
    activity: {
      lastLogin: this.lastLoginDate,
      lastActivity: this.lastActivityDate,
      totalLogins: this.totalLoginCount
    }
  };
};

module.exports = UserDashboard;
