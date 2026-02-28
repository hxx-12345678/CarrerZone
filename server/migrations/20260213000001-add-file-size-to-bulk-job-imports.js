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

    if (!desc.file_size) {
      try {
        await queryInterface.addColumn(table, 'file_size', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
        console.log(`✅ Added file_size to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add file_size to ${table}:`, err?.message || err);
        }
      }
    }
  },

  async down(queryInterface) {
    const table = 'bulk_job_imports';
    try {
      const desc = await queryInterface.describeTable(table);
      if (desc.file_size) {
        await queryInterface.removeColumn(table, 'file_size');
      }
    } catch (e) {
      console.warn(`⚠️ Could not remove file_size from ${table}:`, e?.message || e);
    }
  }
};
