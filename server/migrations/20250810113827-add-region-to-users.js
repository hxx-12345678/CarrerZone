'use strict';

/** @type {import('sequelize-cli').Migration} */
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


    const [exists] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'region' LIMIT 1`
    );
    if (!(exists && exists.length > 0)) {
      await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_region" AS ENUM ('india', 'gulf', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
      await queryInterface.addColumn('users', 'region', {
        type: Sequelize.ENUM('india', 'gulf', 'other'),
        allowNull: true,
      });
    } else {
      console.log('ℹ️  users.region already exists, skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'region');
  }
};
