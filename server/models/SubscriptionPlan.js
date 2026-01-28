const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  planType: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise', 'custom'),
    defaultValue: 'basic',
    allowNull: false,
    field: 'plan_type'
  },
  monthlyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'monthly_price'
  },
  yearlyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'yearly_price'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Plan features and limits'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isPopular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_popular'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  },
  trialDays: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
    field: 'trial_days'
  },
  maxTeamMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_team_members'
  },
  maxJobPostings: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_job_postings'
  },
  maxCandidateViews: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'max_candidate_views'
  },
  maxResumeDownloads: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'max_resume_downloads'
  },
  hasAdvancedAnalytics: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_advanced_analytics'
  },
  hasPrioritySupport: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_priority_support'
  },
  hasCustomBranding: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_custom_branding'
  },
  hasAPIAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_api_access'
  },
  hasBulkOperations: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_bulk_operations'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional plan data'
  }
}, {
  tableName: 'subscription_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  hooks: {
    beforeCreate: (plan) => {
      if (!plan.slug) {
        plan.slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
    },
    beforeUpdate: (plan) => {
      if (plan.changed('name') && !plan.changed('slug')) {
        plan.slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
    }
  }
});

// Instance methods
SubscriptionPlan.prototype.getPrice = function(billingCycle = 'monthly') {
  return billingCycle === 'yearly' ? this.yearlyPrice : this.monthlyPrice;
};

SubscriptionPlan.prototype.getSavings = function() {
  if (!this.yearlyPrice || !this.monthlyPrice) return 0;
  const yearlyTotal = this.monthlyPrice * 12;
  const savings = yearlyTotal - this.yearlyPrice;
  return Math.round((savings / yearlyTotal) * 100);
};

SubscriptionPlan.prototype.hasFeature = function(featureName) {
  return this.features?.[featureName] || false;
};

SubscriptionPlan.prototype.getFeatureLimit = function(featureName) {
  return this.features?.[featureName] || 0;
};

SubscriptionPlan.prototype.isUnlimited = function(featureName) {
  const limit = this.getFeatureLimit(featureName);
  return limit === -1 || limit === 'unlimited';
};

SubscriptionPlan.prototype.getDisplayPrice = function(billingCycle = 'monthly') {
  const price = this.getPrice(billingCycle);
  return `${this.currency} ${price}`;
};

SubscriptionPlan.prototype.getPopularBadge = function() {
  return this.isPopular ? 'Most Popular' : null;
};

module.exports = SubscriptionPlan; 