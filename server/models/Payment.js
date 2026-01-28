const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'subscription_id',
    references: {
      model: 'subscriptions',
      key: 'id'
    }
  },
  paymentType: {
    type: DataTypes.ENUM('subscription', 'one_time', 'refund', 'credit', 'debit'),
    allowNull: false,
    defaultValue: 'subscription',
    field: 'payment_type'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'bank_transfer'),
    allowNull: false,
    field: 'payment_method'
  },
  paymentGateway: {
    type: DataTypes.ENUM('razorpay', 'stripe', 'paypal', 'paytm', 'phonepe'),
    field: 'payment_gateway',
    allowNull: false
  },
  gatewayTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gateway_transaction_id'
  },
  gatewayOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gateway_order_id'
  },
  gatewayPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gateway_payment_id'
  },
  gatewayRefundId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gateway_refund_id'
  },
  billingAddress: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'billing_address'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_amount'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_amount'
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'final_amount'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'failure_reason'
  },
  failureCode: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'failure_code'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'refunded_at'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'refund_amount'
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refund_reason'
  },
  refundedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'refunded_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'gateway_response'
  },
  invoiceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'invoice_url'
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'receipt_url'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['subscription_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_gateway']
    },
    {
      fields: ['gateway_transaction_id']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (payment) => {
      // Calculate final amount
      payment.finalAmount = payment.amount + payment.taxAmount - payment.discountAmount;
    },
    beforeUpdate: (payment) => {
      if (payment.changed('amount') || payment.changed('taxAmount') || payment.changed('discountAmount')) {
        payment.finalAmount = payment.amount + payment.taxAmount - payment.discountAmount;
      }
    }
  }
});

// Instance methods
Payment.prototype.isSuccessful = function() {
  return this.status === 'completed';
};

Payment.prototype.isFailed = function() {
  return this.status === 'failed';
};

Payment.prototype.isPending = function() {
  return this.status === 'pending' || this.status === 'processing';
};

Payment.prototype.canBeRefunded = function() {
  return this.status === 'completed' && !this.refundedAt;
};

Payment.prototype.getStatusColor = function() {
  const colors = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray',
    refunded: 'orange'
  };
  return colors[this.status] || 'gray';
};

Payment.prototype.getStatusLabel = function() {
  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  };
  return labels[this.status] || 'Unknown';
};

Payment.prototype.getFormattedAmount = function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency
  }).format(this.finalAmount);
};

Payment.prototype.process = function() {
  this.status = 'processing';
  return this.save();
};

Payment.prototype.complete = function(gatewayTransactionId) {
  this.status = 'completed';
  this.gatewayTransactionId = gatewayTransactionId;
  this.processedAt = new Date();
  return this.save();
};

Payment.prototype.fail = function(reason, code) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  return this.save();
};

Payment.prototype.refund = function(amount, reason) {
  this.status = 'refunded';
  this.refundAmount = amount || this.finalAmount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

module.exports = Payment; 