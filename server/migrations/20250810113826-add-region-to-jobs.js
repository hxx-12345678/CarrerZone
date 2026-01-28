'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('jobs')) {
      console.log('ℹ️  Skipping migration (jobs not created yet)');
      return;
    }


    const [exists] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'region' LIMIT 1`
    );
    if (!(exists && exists.length > 0)) {
      await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_jobs_region" AS ENUM ('india', 'gulf', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
      await queryInterface.addColumn('jobs', 'region', {
        type: Sequelize.ENUM('india', 'gulf', 'other'),
        allowNull: true,
        defaultValue: 'india'
      });
    } else {
      console.log('ℹ️  jobs.region already exists, skipping');
    }

    try {
      await queryInterface.addIndex('jobs', ['region']);
    } catch (error) {
      if ((error && String(error.message || '').includes('already exists')) || (error && String(error).includes('already exists'))) {
        console.log('ℹ️  Index on jobs.region already exists, skipping');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeIndex('jobs', ['region']); } catch (e) {}
    await queryInterface.removeColumn('jobs', 'region');
  }
};
