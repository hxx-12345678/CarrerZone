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
      await queryInterface.addColumn(table, 'successful_imports', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    if (!desc.failed_imports) {
      await queryInterface.addColumn(table, 'failed_imports', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    if (!desc.skipped_records) {
      await queryInterface.addColumn(table, 'skipped_records', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
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
