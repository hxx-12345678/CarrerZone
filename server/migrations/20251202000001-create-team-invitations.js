'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('team_invitations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      invited_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          jobPosting: true,
          resumeDatabase: true,
          analytics: true,
          featuredJobs: false,
          hotVacancies: false,
          applications: true,
          requirements: true,
          settings: false
        }
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Recruiter'
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
    await queryInterface.addIndex('team_invitations', ['company_id'], { name: 'idx_team_invitations_company_id' });
    await queryInterface.addIndex('team_invitations', ['email'], { name: 'idx_team_invitations_email' });
    await queryInterface.addIndex('team_invitations', ['token'], { name: 'idx_team_invitations_token' });
    await queryInterface.addIndex('team_invitations', ['status'], { name: 'idx_team_invitations_status' });
    await queryInterface.addIndex('team_invitations', ['invited_by'], { name: 'idx_team_invitations_invited_by' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('team_invitations');
  }
};

