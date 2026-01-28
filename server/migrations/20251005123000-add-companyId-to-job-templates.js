'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'job_templates';
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
      { replacements: { table, column: 'companyId' } }
    );
    if (!rows || rows.length === 0) {
      try {
        await queryInterface.addColumn(table, 'companyId', { type: Sequelize.UUID, allowNull: true });
      } catch (e) {
        // If snake_case exists, keep both-compatible by creating a view alias if needed (skip here)
      }
    }
  },
  async down(queryInterface, Sequelize) {
    const table = 'job_templates';
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
      { replacements: { table, column: 'companyId' } }
    );
    if (rows && rows.length > 0) {
      await queryInterface.removeColumn(table, 'companyId');
    }
  }
};


