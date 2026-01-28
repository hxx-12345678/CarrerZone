'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [results] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'region' LIMIT 1`
    );
    if (!(results && results.length > 0)) {
      await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_companies_region" AS ENUM ('india', 'gulf', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
      await queryInterface.addColumn('companies', 'region', {
        type: Sequelize.ENUM('india', 'gulf', 'other'),
        allowNull: true,
        defaultValue: 'india'
      });
    } else {
      console.log('ℹ️  companies.region already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('companies', 'region');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_companies_region";');
  }
};
