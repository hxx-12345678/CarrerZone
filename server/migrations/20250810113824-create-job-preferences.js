'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_preferences', {
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
        onDelete: 'CASCADE'
      },
      preferred_job_titles: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_industries: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_locations: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_job_types: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_experience_levels: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_salary_min: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      preferred_salary_max: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      preferred_salary_currency: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'INR'
      },
      preferred_skills: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_companies: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_work_mode: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      preferred_shift_timing: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      willing_to_relocate: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      willing_to_travel: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      notice_period: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      email_alerts: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      push_notifications: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      region: {
        type: Sequelize.ENUM('india', 'gulf', 'other'),
        allowNull: true,
        defaultValue: 'india'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    try {
      await queryInterface.addIndex('job_preferences', ['user_id'], {
        unique: true,
        name: 'job_preferences_user_id_unique'
      });
    } catch (error) {
      if ((error && String(error.message || '').includes('already exists')) || (error && String(error).includes('already exists'))) {
        console.log('ℹ️  Index job_preferences_user_id_unique already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('job_preferences', ['region'], {
        name: 'job_preferences_region_idx'
      });
    } catch (error) {
      if ((error && String(error.message || '').includes('already exists')) || (error && String(error).includes('already exists'))) {
        console.log('ℹ️  Index job_preferences_region_idx already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('job_preferences', ['is_active'], {
        name: 'job_preferences_is_active_idx'
      });
    } catch (error) {
      if ((error && String(error.message || '').includes('already exists')) || (error && String(error).includes('already exists'))) {
        console.log('ℹ️  Index job_preferences_is_active_idx already exists, skipping');
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_preferences');
  }
};


