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
        await queryInterface.addColumn(table, 'successful_imports', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        });
        console.log(`✅ Added successful_imports to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add successful_imports to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.failed_imports) {
      try {
        await queryInterface.addColumn(table, 'failed_imports', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        });
        console.log(`✅ Added failed_imports to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add failed_imports to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.skipped_records) {
      try {
        await queryInterface.addColumn(table, 'skipped_records', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        });
        console.log(`✅ Added skipped_records to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add skipped_records to ${table}:`, err?.message || err);
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
