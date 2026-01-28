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


    console.log('🔧 Adding missing columns to jobs table...');

    const columnExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = :column LIMIT 1`,
        { replacements: { column: columnName } }
      );
      return results && results.length > 0;
    };

    if (!(await columnExists('role'))) {
      await queryInterface.addColumn('jobs', 'role', { type: Sequelize.STRING, allowNull: true });
      console.log('✅ Added role column');
    } else {
      console.log('ℹ️  role already exists, skipping');
    }

    if (!(await columnExists('industrytype'))) {
      await queryInterface.addColumn('jobs', 'industrytype', { type: Sequelize.STRING, allowNull: true });
      console.log('✅ Added industrytype column');
    } else {
      console.log('ℹ️  industrytype already exists, skipping');
    }

    if (!(await columnExists('rolecategory'))) {
      await queryInterface.addColumn('jobs', 'rolecategory', { type: Sequelize.STRING, allowNull: true });
      console.log('✅ Added rolecategory column');
    } else {
      console.log('ℹ️  rolecategory already exists, skipping');
    }

    if (!(await columnExists('employmenttype'))) {
      await queryInterface.addColumn('jobs', 'employmenttype', { type: Sequelize.STRING, allowNull: true });
      console.log('✅ Added employmenttype column');
    } else {
      console.log('ℹ️  employmenttype already exists, skipping');
    }

    console.log('🎉 All missing columns added successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔧 Removing added columns from jobs table...');

    await queryInterface.removeColumn('jobs', 'role');
    await queryInterface.removeColumn('jobs', 'industrytype');
    await queryInterface.removeColumn('jobs', 'rolecategory');
    await queryInterface.removeColumn('jobs', 'employmenttype');

    console.log('✅ All columns removed successfully!');
  }
};
