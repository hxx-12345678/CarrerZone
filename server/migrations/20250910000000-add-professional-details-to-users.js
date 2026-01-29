'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if users table doesn't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('users')) {
      console.log('ℹ️  Skipping professional details migration (users table not created yet)');
      return;
    }

    // Add Professional Details columns
    await queryInterface.addColumn('users', 'current_company', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'current_role', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'highest_education', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'field_of_study', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add Preferred Professional Details columns
    await queryInterface.addColumn('users', 'preferred_job_titles', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('users', 'preferred_industries', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('users', 'preferred_company_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'preferred_work_mode', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'preferred_employment_type', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove Professional Details columns
    await queryInterface.removeColumn('users', 'current_company');
    await queryInterface.removeColumn('users', 'current_role');
    await queryInterface.removeColumn('users', 'highest_education');
    await queryInterface.removeColumn('users', 'field_of_study');

    // Remove Preferred Professional Details columns
    await queryInterface.removeColumn('users', 'preferred_job_titles');
    await queryInterface.removeColumn('users', 'preferred_industries');
    await queryInterface.removeColumn('users', 'preferred_company_size');
    await queryInterface.removeColumn('users', 'preferred_work_mode');
    await queryInterface.removeColumn('users', 'preferred_employment_type');
  }
};

