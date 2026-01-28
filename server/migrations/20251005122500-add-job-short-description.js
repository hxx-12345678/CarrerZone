'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'jobs';
    const [results] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
      { replacements: { table, column: 'short_description' } }
    );
    if (!results || results.length === 0) {
      await queryInterface.addColumn(table, 'short_description', { type: Sequelize.STRING, allowNull: true });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'jobs';
    const [results] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
      { replacements: { table, column: 'short_description' } }
    );
    if (results && results.length > 0) {
      await queryInterface.removeColumn(table, 'short_description');
    }
  }
};


