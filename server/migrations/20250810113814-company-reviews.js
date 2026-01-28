'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('company_reviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      review: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      pros: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      cons: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      job_title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      employment_status: {
        type: Sequelize.ENUM('current', 'former', 'intern'),
        allowNull: true
      },
      employment_duration: {
        type: Sequelize.INTEGER, // in months
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_helpful: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_not_helpful: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_anonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      moderated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      moderated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      moderation_notes: {
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
    await queryInterface.addIndex('company_reviews', ['company_id']);
    await queryInterface.addIndex('company_reviews', ['reviewer_id']);
    await queryInterface.addIndex('company_reviews', ['rating']);
    await queryInterface.addIndex('company_reviews', ['employment_status']);
    await queryInterface.addIndex('company_reviews', ['is_verified']);
    await queryInterface.addIndex('company_reviews', ['status']);
    await queryInterface.addIndex('company_reviews', ['created_at']);
    
    // Add unique constraint to prevent duplicate reviews from same user
    await queryInterface.addConstraint('company_reviews', {
      fields: ['company_id', 'reviewer_id'],
      type: 'unique',
      name: 'unique_company_review'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('company_reviews');
  }
};
