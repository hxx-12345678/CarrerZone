'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('work_experiences', {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      is_current: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      employment_type: {
        type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
        allowNull: true
      },
      skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      achievements: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      salary_currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      reason_for_leaving: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      supervisor_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      supervisor_contact: {
        type: Sequelize.STRING,
        allowNull: true
      },
      can_contact_supervisor: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('work_experiences', ['user_id']);
    await queryInterface.addIndex('work_experiences', ['company']);
    await queryInterface.addIndex('work_experiences', ['start_date']);
    await queryInterface.addIndex('work_experiences', ['is_current']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('work_experiences');
  }
};
