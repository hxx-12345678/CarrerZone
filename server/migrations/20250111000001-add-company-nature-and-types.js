'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: ensure companies table exists before altering
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    if (!normalized.includes('companies')) {
      console.log('ℹ️  Skipping company nature/types migration (companies table not created yet)');
      return;
    }

    // Add natureOfBusiness field (JSONB array for multi-select)
    await queryInterface.addColumn('companies', 'nature_of_business', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Nature of business: SaaS, PaaS, B2B, B2C, D2C, etc.'
    });

    // Add companyTypes field (JSONB array for multi-select)
    await queryInterface.addColumn('companies', 'company_types', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Company types: Corporate, Foreign MNC, Indian MNC, Startup, etc.'
    });

    console.log('✅ Added nature_of_business and company_types columns to companies table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('companies', 'nature_of_business');
    await queryInterface.removeColumn('companies', 'company_types');
  }
};

