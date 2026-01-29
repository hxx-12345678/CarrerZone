'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('support_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('general', 'technical', 'sales', 'billing', 'feature', 'bug'),
        allowNull: false,
        defaultValue: 'general'
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'new'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      responded_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('support_messages', ['email']);
    await queryInterface.addIndex('support_messages', ['status']);
    await queryInterface.addIndex('support_messages', ['category']);
    await queryInterface.addIndex('support_messages', ['priority']);
    await queryInterface.addIndex('support_messages', ['created_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('support_messages');
  }
};
