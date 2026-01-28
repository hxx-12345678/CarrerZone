'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('job_bookmarks', {
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
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      folder: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'default'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_applied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      applied_at: {
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
    await queryInterface.addIndex('job_bookmarks', ['user_id']);
    await queryInterface.addIndex('job_bookmarks', ['job_id']);
    await queryInterface.addIndex('job_bookmarks', ['folder']);
    await queryInterface.addIndex('job_bookmarks', ['priority']);
    await queryInterface.addIndex('job_bookmarks', ['is_applied']);
    
    // Add unique constraint to prevent duplicate bookmarks
    await queryInterface.addConstraint('job_bookmarks', {
      fields: ['user_id', 'job_id'],
      type: 'unique',
      name: 'unique_job_bookmark'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('job_bookmarks');
  }
};
