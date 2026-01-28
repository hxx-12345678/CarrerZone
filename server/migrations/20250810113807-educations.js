'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('educations', {
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
      degree: {
        type: Sequelize.STRING,
        allowNull: false
      },
      institution: {
        type: Sequelize.STRING,
        allowNull: false
      },
      field_of_study: {
        type: Sequelize.STRING,
        allowNull: true
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
      gpa: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      grade: {
        type: Sequelize.STRING,
        allowNull: true
      },
      relevant_courses: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      achievements: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      education_type: {
        type: Sequelize.ENUM('bachelor', 'master', 'phd', 'diploma', 'certification', 'high-school', 'other'),
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_date: {
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
    await queryInterface.addIndex('educations', ['user_id']);
    await queryInterface.addIndex('educations', ['institution']);
    await queryInterface.addIndex('educations', ['degree']);
    await queryInterface.addIndex('educations', ['education_type']);
    await queryInterface.addIndex('educations', ['is_current']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('educations');
  }
};
