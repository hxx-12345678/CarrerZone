'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_sessions', {
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
      session_token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      refresh_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      device_type: {
        type: Sequelize.ENUM('web', 'mobile', 'tablet', 'desktop'),
        allowNull: true
      },
      device_info: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      login_method: {
        type: Sequelize.ENUM('email', 'google', 'facebook', 'linkedin', 'github'),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      last_activity_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      logout_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      logout_reason: {
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
    await queryInterface.addIndex('user_sessions', ['user_id']);
    await queryInterface.addIndex('user_sessions', ['session_token']);
    await queryInterface.addIndex('user_sessions', ['refresh_token']);
    await queryInterface.addIndex('user_sessions', ['device_type']);
    await queryInterface.addIndex('user_sessions', ['ip_address']);
    await queryInterface.addIndex('user_sessions', ['is_active']);
    await queryInterface.addIndex('user_sessions', ['expires_at']);
    await queryInterface.addIndex('user_sessions', ['last_activity_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_sessions');
  }
};
