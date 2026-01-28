'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: skip if companies table doesn't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('companies')) {
      console.log('ℹ️  Skipping agency system migration (companies table not created yet)');
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Adding agency system fields to companies table...');
      
      // Add company_account_type column
      await queryInterface.addColumn('companies', 'company_account_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'direct',
        comment: 'direct | recruiting_agency | consulting_firm'
      }, { transaction });
      
      console.log('✅ Added company_account_type');
      
      // Add agency-specific fields
      await queryInterface.addColumn('companies', 'agency_license', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Agency license number'
      }, { transaction });
      
      await queryInterface.addColumn('companies', 'agency_specialization', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'e.g., IT Recruitment, Finance Hiring'
      }, { transaction });
      
      await queryInterface.addColumn('companies', 'agency_documents', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Store agency verification documents'
      }, { transaction });
      
      await queryInterface.addColumn('companies', 'verified_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When company/agency was verified'
      }, { transaction });
      
      await queryInterface.addColumn('companies', 'verification_method', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'automated_gst | manual_review | hybrid'
      }, { transaction });
      
      console.log('✅ Added all agency fields to companies table');
      
      await transaction.commit();
      console.log('🎉 Migration completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back agency system fields from companies table...');
      
      await queryInterface.removeColumn('companies', 'verification_method', { transaction });
      await queryInterface.removeColumn('companies', 'verified_at', { transaction });
      await queryInterface.removeColumn('companies', 'agency_documents', { transaction });
      await queryInterface.removeColumn('companies', 'agency_specialization', { transaction });
      await queryInterface.removeColumn('companies', 'agency_license', { transaction });
      await queryInterface.removeColumn('companies', 'company_account_type', { transaction });
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};


