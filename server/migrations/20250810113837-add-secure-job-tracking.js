'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('users') || !normalized.includes('jobs')) {
      console.log('ℹ️  Skipping migration (users, jobs not created yet)');
      return;
    }


    // Add isSecure field to jobs table
    await queryInterface.addColumn('jobs', 'isSecure', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: 'Whether this is a secure job that awards premium badges when tapped'
    });

    // Add secureJobTaps field to users table to track secure job interactions
    await queryInterface.addColumn('users', 'secureJobTaps', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of secure jobs tapped by this user'
    });

    // Add secureJobTapsAt field to users table to track when they first tapped a secure job
    await queryInterface.addColumn('users', 'secureJobTapsAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the user first tapped a secure job'
    });

    // Create secure_job_taps table to track individual secure job taps
    await queryInterface.createTable('secure_job_taps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      tapped_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Add unique constraint to prevent duplicate taps
    await queryInterface.addConstraint('secure_job_taps', {
      fields: ['user_id', 'job_id'],
      type: 'unique',
      name: 'unique_user_job_tap'
    });

    // Add index for performance
    await queryInterface.addIndex('secure_job_taps', ['user_id']);
    await queryInterface.addIndex('secure_job_taps', ['job_id']);
    await queryInterface.addIndex('secure_job_taps', ['tapped_at']);
  },

  async down(queryInterface, Sequelize) {
    // Remove the secure job taps table
    await queryInterface.dropTable('secure_job_taps');
    
    // Remove columns from users table
    await queryInterface.removeColumn('users', 'secureJobTaps');
    await queryInterface.removeColumn('users', 'secureJobTapsAt');
    
    // Remove column from jobs table
    await queryInterface.removeColumn('jobs', 'isSecure');
  }
};
