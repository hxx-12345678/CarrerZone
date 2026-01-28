'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM(
          'new_admin_registration',
          'new_employer_registration', 
          'new_company_registration',
          'company_verification_approved',
          'company_verification_rejected',
          'jobseeker_milestone_10',
          'jobseeker_milestone_50',
          'jobseeker_milestone_100',
          'jobseeker_milestone_500',
          'jobseeker_milestone_1000',
          'jobseeker_milestone_5000',
          'jobseeker_milestone_10000',
          'system_alert',
          'security_alert',
          'performance_alert'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      short_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      category: {
        type: Sequelize.ENUM('registration', 'verification', 'milestone', 'system', 'security'),
        allowNull: false
      },
      action_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      action_text: {
        type: Sequelize.STRING,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      related_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      related_company_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      triggered_by_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Add indexes for better performance
    await queryInterface.addIndex('admin_notifications', ['type']);
    await queryInterface.addIndex('admin_notifications', ['category']);
    await queryInterface.addIndex('admin_notifications', ['priority']);
    await queryInterface.addIndex('admin_notifications', ['is_read']);
    await queryInterface.addIndex('admin_notifications', ['created_at']);
    await queryInterface.addIndex('admin_notifications', ['related_user_id']);
    await queryInterface.addIndex('admin_notifications', ['related_company_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('admin_notifications');
  }
};

