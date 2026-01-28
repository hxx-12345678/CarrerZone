'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'job_templates';
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
      { replacements: { table, column: 'tags' } }
    );
    if (!rows || rows.length === 0) {
      await queryInterface.addColumn(table, 'tags', { type: Sequelize.JSONB, allowNull: true, defaultValue: [] });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'job_templates';
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
      { replacements: { table, column: 'tags' } }
    );
    if (rows && rows.length > 0) {
      await queryInterface.removeColumn(table, 'tags');
    }
  }
};


