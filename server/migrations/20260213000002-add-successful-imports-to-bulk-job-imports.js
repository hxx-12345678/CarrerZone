'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'bulk_job_imports';
    let desc;

    try {
      desc = await queryInterface.describeTable(table);
    } catch (e) {
      console.warn(`⚠️ Could not describe table ${table}:`, e?.message || e);
      return;
    }

    if (!desc.successful_imports) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['successful_imports']) {
          await queryInterface.addColumn('table', 'successful_imports', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
          console.log('✅ Added successful_imports to table');
        } else {
          console.log('ℹ️ Column successful_imports already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column successful_imports already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add successful_imports to table:', err.message);
        }
      }

    }

    if (!desc.failed_imports) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['failed_imports']) {
          await queryInterface.addColumn('table', 'failed_imports', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
          console.log('✅ Added failed_imports to table');
        } else {
          console.log('ℹ️ Column failed_imports already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column failed_imports already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add failed_imports to table:', err.message);
        }
      }

    }

    if (!desc.skipped_records) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['skipped_records']) {
          await queryInterface.addColumn('table', 'skipped_records', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
          console.log('✅ Added skipped_records to table');
        } else {
          console.log('ℹ️ Column skipped_records already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column skipped_records already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add skipped_records to table:', err.message);
        }
      }

    }
  },

  async down(queryInterface) {
    const table = 'bulk_job_imports';
    try {
      const desc = await queryInterface.describeTable(table);
      if (desc.successful_imports) await queryInterface.removeColumn(table, 'successful_imports');
      if (desc.failed_imports) await queryInterface.removeColumn(table, 'failed_imports');
      if (desc.skipped_records) await queryInterface.removeColumn(table, 'skipped_records');
    } catch (e) {
      console.warn(`⚠️ Could not rollback columns on ${table}:`, e?.message || e);
    }
  }
};
