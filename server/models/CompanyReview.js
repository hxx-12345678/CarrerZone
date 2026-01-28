const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CompanyReview = sequelize.define('CompanyReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'reviewer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pros: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cons: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  jobTitle: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  employmentStatus: {
    type: DataTypes.ENUM('current', 'former', 'interviewed'),
    allowNull: false
  },
  employmentDuration: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., "2 years", "6 months"'
  },
  workLocation: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reviewDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'review_date'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the review is from a verified employee'
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  notHelpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
    defaultValue: 'pending'
  },
  moderationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  companyResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  companyResponseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional review data'
  }
}, {
  tableName: 'company_reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['company_id', 'rating']
    },
    {
      fields: ['user_id', 'company_id'],
      unique: true,
      name: 'unique_user_company_review'
    },
    {
      fields: ['status']
    },
    {
      fields: ['review_date']
    }
  ],
  hooks: {
    afterCreate: async (review) => {
      // Update company average rating
      const { Company } = require('../config/index');
      const company = await Company.findByPk(review.companyId);
      if (company) {
        await company.updateAverageRating();
      }
    },
    afterUpdate: async (review) => {
      if (review.changed('rating') || review.changed('status')) {
        const { Company } = require('../config/index');
        const company = await Company.findByPk(review.companyId);
        if (company) {
          await company.updateAverageRating();
        }
      }
    }
  }
});

// Instance methods
CompanyReview.prototype.getRatingStars = function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
};

CompanyReview.prototype.getHelpfulPercentage = function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? Math.round((this.helpfulCount / total) * 100) : 0;
};

CompanyReview.prototype.canEdit = function(userId) {
  return this.userId === userId && this.status === 'approved';
};

CompanyReview.prototype.canDelete = function(userId) {
  return this.userId === userId;
};

CompanyReview.prototype.isRecent = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.reviewDate > thirtyDaysAgo;
};

module.exports = CompanyReview; 