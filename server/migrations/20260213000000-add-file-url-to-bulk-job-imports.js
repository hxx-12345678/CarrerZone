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

    if (!desc.file_url) {
      await queryInterface.addColumn(table, 'file_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to the uploaded file'
      });
    }

    // Backfill file_url from file_path for existing rows if needed
    try {
      await queryInterface.sequelize.query(`
        UPDATE bulk_job_imports
        SET file_url = file_path
        WHERE file_url IS NULL AND file_path IS NOT NULL;
      `);
    } catch (e) {
      console.warn('⚠️ Could not backfill bulk_job_imports.file_url:', e?.message || e);
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'bulk_job_imports';
    try {
      const desc = await queryInterface.describeTable(table);
      if (desc.file_url) {
        await queryInterface.removeColumn(table, 'file_url');
      }
    } catch (e) {
      console.warn(`⚠️ Could not remove file_url from ${table}:`, e?.message || e);
    }
  }
};
