'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255]
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      tags: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      // Complete job form data that matches post-job page
      template_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      // Metadata
      created_by: {
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
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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
    await queryInterface.addIndex('job_templates', ['created_by']);
    await queryInterface.addIndex('job_templates', ['company_id']);
    await queryInterface.addIndex('job_templates', ['category']);
    await queryInterface.addIndex('job_templates', ['is_public']);
    await queryInterface.addIndex('job_templates', ['is_active']);
    await queryInterface.addIndex('job_templates', ['usage_count']);
    await queryInterface.addIndex('job_templates', ['last_used_at']);
    
    // Composite indexes for common queries
    await queryInterface.addIndex('job_templates', ['company_id', 'is_active']);
    await queryInterface.addIndex('job_templates', ['created_by', 'is_active']);
    await queryInterface.addIndex('job_templates', ['category', 'is_public', 'is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_templates');
  }
};