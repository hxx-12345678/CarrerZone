const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const RequirementApplication = sequelize.define('RequirementApplication', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  applicantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
  status: {
    type: DataTypes.ENUM('applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'),
    allowNull: false,
    defaultValue: 'applied'
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resume: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expectedSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  noticePeriod: {
    type: DataTypes.INTEGER, // in days
    allowNull: true
  },
  isWillingToRelocate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  source: {
    type: DataTypes.ENUM('website', 'referral', 'job-board', 'social-media', 'email', 'other'),
    allowNull: true,
    defaultValue: 'website'
  },
  appliedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shortlistedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  interviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  offeredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hiredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  withdrawnAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isViewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isShortlisted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRejected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'requirement_applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (application) => {
      application.appliedAt = new Date();
    },
    beforeUpdate: async (application) => {
      if (application.changed('status')) {
        const now = new Date();
        switch (application.status) {
          case 'reviewing':
            application.reviewedAt = now;
            break;
          case 'shortlisted':
            application.shortlistedAt = now;
            application.isShortlisted = true;
            break;
          case 'interviewed':
            application.interviewedAt = now;
            break;
          case 'offered':
            application.offeredAt = now;
            break;
          case 'hired':
            application.hiredAt = now;
            break;
          case 'rejected':
            application.rejectedAt = now;
            application.isRejected = true;
            break;
          case 'withdrawn':
            application.withdrawnAt = now;
            break;
        }
      }
      if (application.changed('isViewed') && application.isViewed) {
        application.viewedAt = new Date();
      }
    }
  }
});

// Instance methods
RequirementApplication.prototype.getStatusColor = function() {
  const statusColors = {
    applied: 'blue',
    reviewing: 'yellow',
    shortlisted: 'green',
    interviewed: 'purple',
    offered: 'orange',
    hired: 'green',
    rejected: 'red',
    withdrawn: 'gray'
  };
  return statusColors[this.status] || 'gray';
};

RequirementApplication.prototype.getStatusText = function() {
  const statusTexts = {
    applied: 'Applied',
    reviewing: 'Under Review',
    shortlisted: 'Shortlisted',
    interviewed: 'Interviewed',
    offered: 'Offer Made',
    hired: 'Hired',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn'
  };
  return statusTexts[this.status] || this.status;
};

RequirementApplication.prototype.getTimeSinceApplied = function() {
  const now = new Date();
  const applied = new Date(this.appliedAt);
  const diffInMs = now - applied;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

module.exports = RequirementApplication; 