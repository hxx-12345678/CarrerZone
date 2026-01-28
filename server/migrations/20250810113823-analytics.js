'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      event_action: {
        type: Sequelize.STRING,
        allowNull: true
      },
      event_label: {
        type: Sequelize.STRING,
        allowNull: true
      },
      page_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      referrer_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      device_type: {
        type: Sequelize.ENUM('desktop', 'mobile', 'tablet'),
        allowNull: true
      },
      browser: {
        type: Sequelize.STRING,
        allowNull: true
      },
      browser_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      operating_system: {
        type: Sequelize.STRING,
        allowNull: true
      },
      os_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      screen_resolution: {
        type: Sequelize.STRING,
        allowNull: true
      },
      viewport_size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER, // in seconds
        allowNull: true
      },
      scroll_depth: {
        type: Sequelize.INTEGER, // percentage
        allowNull: true
      },
      bounce: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      exit_page: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      custom_parameters: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('analytics', ['user_id']);
    await queryInterface.addIndex('analytics', ['session_id']);
    await queryInterface.addIndex('analytics', ['event_type']);
    await queryInterface.addIndex('analytics', ['event_category']);
    await queryInterface.addIndex('analytics', ['page_url']);
    await queryInterface.addIndex('analytics', ['device_type']);
    await queryInterface.addIndex('analytics', ['browser']);
    await queryInterface.addIndex('analytics', ['operating_system']);
    await queryInterface.addIndex('analytics', ['ip_address']);
    await queryInterface.addIndex('analytics', ['country']);
    await queryInterface.addIndex('analytics', ['city']);
    await queryInterface.addIndex('analytics', ['created_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('analytics');
  }
};
