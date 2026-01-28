'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      participant1_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant2_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      conversation_type: {
        type: Sequelize.ENUM('direct', 'job_application', 'requirement_application', 'interview'),
        defaultValue: 'direct'
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      reference_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_message_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      unread_count_participant1: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unread_count_participant2: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_archived_participant1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_archived_participant2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      blocked_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      blocked_at: {
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
    await queryInterface.addIndex('conversations', ['participant1_id']);
    await queryInterface.addIndex('conversations', ['participant2_id']);
    await queryInterface.addIndex('conversations', ['conversation_type']);
    await queryInterface.addIndex('conversations', ['reference_id']);
    await queryInterface.addIndex('conversations', ['last_message_at']);
    await queryInterface.addIndex('conversations', ['is_blocked']);
    
    // Add unique constraint to prevent duplicate conversations
    await queryInterface.addConstraint('conversations', {
      fields: ['participant1_id', 'participant2_id', 'conversation_type'],
      type: 'unique',
      name: 'unique_conversation'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};
