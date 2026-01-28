'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('company_follows', {
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
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notification_preferences: {
        type: Sequelize.JSONB,
        defaultValue: {
          new_jobs: true,
          company_updates: true,
          reviews: false
        }
      },
      followed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      last_notification_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('company_follows', ['user_id']);
    await queryInterface.addIndex('company_follows', ['company_id']);
    await queryInterface.addIndex('company_follows', ['followed_at']);
    await queryInterface.addIndex('company_follows', ['last_notification_at']);
    
    // Add unique constraint to prevent duplicate follows
    await queryInterface.addConstraint('company_follows', {
      fields: ['user_id', 'company_id'],
      type: 'unique',
      name: 'unique_company_follow'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('company_follows');
  }
};
