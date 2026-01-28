'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      monthly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      yearly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      features: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      limits: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      trial_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_popular: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('subscription_plans', ['slug']);
    await queryInterface.addIndex('subscription_plans', ['is_active']);
    await queryInterface.addIndex('subscription_plans', ['is_popular']);
    await queryInterface.addIndex('subscription_plans', ['sort_order']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('subscription_plans');
  }
};
