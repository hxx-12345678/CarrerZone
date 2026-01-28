'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      requirement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'requirements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      candidate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      resume_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'resumes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'),
        defaultValue: 'applied'
      },
      cover_letter: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expected_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      expected_salary_currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      notice_period: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      interview_scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      interview_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      interview_type: {
        type: Sequelize.ENUM('phone', 'video', 'in-person', 'technical', 'hr'),
        allowNull: true
      },
      employer_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      candidate_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      offer_details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      offer_accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      offer_declined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      application_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      is_shortlisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      shortlisted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      shortlisted_by: {
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

    // Add indexes
    await queryInterface.addIndex('applications', ['requirement_id']);
    await queryInterface.addIndex('applications', ['candidate_id']);
    await queryInterface.addIndex('applications', ['resume_id']);
    await queryInterface.addIndex('applications', ['status']);
    await queryInterface.addIndex('applications', ['is_shortlisted']);
    await queryInterface.addIndex('applications', ['shortlisted_by']);
    await queryInterface.addIndex('applications', ['interview_scheduled_at']);
    
    // Add unique constraint to prevent duplicate applications
    await queryInterface.addConstraint('applications', {
      fields: ['requirement_id', 'candidate_id'],
      type: 'unique',
      name: 'unique_requirement_application'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('applications');
  }
};
