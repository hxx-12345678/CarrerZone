const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Subscription = sequelize.define('Subscription', {
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
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plan_id',
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'expired', 'trial', 'past_due'),
    defaultValue: 'trial',
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_date'
  },
  trialEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_ends_at'
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
    defaultValue: 'monthly',
    field: 'billing_cycle'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_billing_date'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'auto_renew'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at'
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cancelled_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Active features for this subscription'
  },
  usage: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'limits',
    comment: 'Usage statistics: job_postings, candidate_views, etc.'
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['status']
    },
    {
      fields: ['next_billing_date']
    }
  ],
  hooks: {
    beforeCreate: (subscription) => {
      if (subscription.status === 'trial' && !subscription.trialEndDate) {
        // Set trial end date to 14 days from start (virtual field)
        const trialEnd = new Date(subscription.startDate);
        trialEnd.setDate(trialEnd.getDate() + 14);
        subscription.trialEndDate = trialEnd;
      }
    }
  }
});

// Instance methods
Subscription.prototype.isActive = function() {
  return ['active', 'trial'].includes(this.status);
};

Subscription.prototype.isTrial = function() {
  return this.status === 'trial' && this.trialEndDate > new Date();
};

Subscription.prototype.isExpired = function() {
  return this.endDate && this.endDate < new Date();
};

Subscription.prototype.daysUntilExpiry = function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Subscription.prototype.canCancel = function() {
  return this.isActive() && this.status !== 'cancelled';
};

Subscription.prototype.getFeatureValue = function(featureName) {
  return this.features?.[featureName] || 0;
};

Subscription.prototype.hasFeature = function(featureName) {
  return this.getFeatureValue(featureName) > 0;
};

Subscription.prototype.getUsagePercentage = function(featureName) {
  const limit = this.getFeatureValue(featureName);
  const used = this.usage?.[featureName] || 0;
  return limit > 0 ? Math.round((used / limit) * 100) : 0;
};

module.exports = Subscription; 