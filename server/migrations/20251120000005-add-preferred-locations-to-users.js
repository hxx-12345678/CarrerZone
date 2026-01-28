'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('users')) {
      console.log('ℹ️  Skipping migration (users not created yet)');
      return;
    }


    // Get current table description to check existing columns
    const tableDescription = await queryInterface.describeTable('users');
    
    // Add preferred_locations column if it doesn't exist
    if (!tableDescription.preferred_locations) {
      await queryInterface.addColumn('users', 'preferred_locations', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true
      });
    }

    // Add current_salary column if it doesn't exist
    if (!tableDescription.current_salary) {
      await queryInterface.addColumn('users', 'current_salary', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    // Add experience_years column if it doesn't exist
    if (!tableDescription.experience_years) {
      await queryInterface.addColumn('users', 'experience_years', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    // Add account_status column if it doesn't exist
    if (!tableDescription.account_status) {
      await queryInterface.addColumn('users', 'account_status', {
        type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending'),
        defaultValue: 'active',
        allowNull: false
      });
    }

    // Add verification_level column if it doesn't exist
    if (!tableDescription.verification_level) {
      await queryInterface.addColumn('users', 'verification_level', {
        type: Sequelize.ENUM('unverified', 'basic', 'premium'),
        defaultValue: 'unverified',
        allowNull: false
      });
    }

    // Add department column if it doesn't exist
    if (!tableDescription.department) {
      await queryInterface.addColumn('users', 'department', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Add designation column if it doesn't exist
    if (!tableDescription.designation) {
      await queryInterface.addColumn('users', 'designation', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Add headline column if it doesn't exist
    if (!tableDescription.headline) {
      await queryInterface.addColumn('users', 'headline', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Add summary column if it doesn't exist
    if (!tableDescription.summary) {
      await queryInterface.addColumn('users', 'summary', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // Add skills column if it doesn't exist
    if (!tableDescription.skills) {
      await queryInterface.addColumn('users', 'skills', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true
      });
    }

    // Add key_skills column if it doesn't exist
    if (!tableDescription.key_skills) {
      await queryInterface.addColumn('users', 'key_skills', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true
      });
    }

    // Add languages column if it doesn't exist
    if (!tableDescription.languages) {
      await queryInterface.addColumn('users', 'languages', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true
      });
    }

    // Add certifications column if it doesn't exist
    if (!tableDescription.certifications) {
      await queryInterface.addColumn('users', 'certifications', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true
      });
    }

    // Add education column if it doesn't exist
    if (!tableDescription.education) {
      await queryInterface.addColumn('users', 'education', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true
      });
    }

    // Add social_links column if it doesn't exist
    if (!tableDescription.social_links) {
      await queryInterface.addColumn('users', 'social_links', {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: true
      });
    }

    // Add profile_visibility column if it doesn't exist
    if (!tableDescription.profile_visibility) {
      await queryInterface.addColumn('users', 'profile_visibility', {
        type: Sequelize.ENUM('public', 'private', 'connections'),
        defaultValue: 'public',
        allowNull: false
      });
    }

    // Add contact_visibility column if it doesn't exist
    if (!tableDescription.contact_visibility) {
      await queryInterface.addColumn('users', 'contact_visibility', {
        type: Sequelize.ENUM('public', 'private', 'connections'),
        defaultValue: 'public',
        allowNull: false
      });
    }

    // Add index for better performance
    try {
      await queryInterface.addIndex('users', ['preferred_locations']);
    } catch (error) {
      console.log('Index on preferred_locations might already exist, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns
    await queryInterface.removeColumn('users', 'preferred_locations');
    await queryInterface.removeColumn('users', 'current_salary');
    await queryInterface.removeColumn('users', 'experience_years');
    await queryInterface.removeColumn('users', 'account_status');
    await queryInterface.removeColumn('users', 'verification_level');
  }
};
