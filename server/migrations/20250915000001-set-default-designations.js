'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: ensure users table exists before running data update
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    if (!normalized.includes('users')) {
      console.log('ℹ️  Skipping default designations update (users table not created yet)');
      return;
    }

    // Set default designations for existing users based on their user_type
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET designation = CASE 
        WHEN user_type = 'admin' THEN 'Hiring Manager'
        WHEN user_type = 'employer' THEN 'Recruiter'
        ELSE designation
      END
      WHERE designation IS NULL OR designation = '';
    `);

    console.log('✅ Set default designations for existing users');
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is not easily reversible as we don't know what the original values were
    console.log('⚠️ Cannot reverse designation defaults - original values unknown');
  }
};
