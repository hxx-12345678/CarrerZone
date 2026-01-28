'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      payment_type: {
        type: Sequelize.ENUM('subscription', 'one_time', 'refund'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      payment_method: {
        type: Sequelize.ENUM('credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'bank_transfer'),
        allowNull: false
      },
      payment_gateway: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gateway_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      gateway_order_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        defaultValue: 'pending'
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      gateway_response: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      billing_address: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      refund_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refunded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      invoice_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      receipt_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('payments', ['user_id']);
    await queryInterface.addIndex('payments', ['subscription_id']);
    await queryInterface.addIndex('payments', ['payment_type']);
    await queryInterface.addIndex('payments', ['payment_method']);
    await queryInterface.addIndex('payments', ['payment_gateway']);
    await queryInterface.addIndex('payments', ['gateway_transaction_id']);
    await queryInterface.addIndex('payments', ['gateway_order_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['created_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
