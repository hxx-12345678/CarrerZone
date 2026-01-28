'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('interviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      job_application_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'job_applications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      requirement_application_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'applications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      interviewer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      interview_type: {
        type: Sequelize.ENUM('phone', 'video', 'in-person', 'technical', 'hr', 'final'),
        allowNull: false
      },
      round_number: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER, // in minutes
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meeting_link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meeting_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meeting_password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'),
        defaultValue: 'scheduled'
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      decision: {
        type: Sequelize.ENUM('selected', 'rejected', 'on-hold', 'next-round'),
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rescheduled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rescheduled_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reschedule_reason: {
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
    await queryInterface.addIndex('interviews', ['job_application_id']);
    await queryInterface.addIndex('interviews', ['requirement_application_id']);
    await queryInterface.addIndex('interviews', ['interviewer_id']);
    await queryInterface.addIndex('interviews', ['candidate_id']);
    await queryInterface.addIndex('interviews', ['interview_type']);
    await queryInterface.addIndex('interviews', ['status']);
    await queryInterface.addIndex('interviews', ['scheduled_at']);
    await queryInterface.addIndex('interviews', ['decision']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('interviews');
  }
};
