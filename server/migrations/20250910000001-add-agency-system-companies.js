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
      
      try {
        const tableInfo = await queryInterface.describeTable('companies');
        if (!tableInfo['company_account_type']) {
          await queryInterface.addColumn('companies', 'company_account_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'direct',
        comment: 'direct | recruiting_agency | consulting_firm'
      }, { transaction });
          console.log('✅ Added company_account_type to companies');
        } else {
          console.log('ℹ️ Column company_account_type already exists in companies, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column company_account_type already exists in companies, skipping...');
        } else {
            console.warn('⚠️ Could not check/add company_account_type to companies:', err.message);
        }
      }

      
      console.log('✅ Added company_account_type');
      
      // Add agency-specific fields
      
      try {
        const tableInfo = await queryInterface.describeTable('companies');
        if (!tableInfo['agency_license']) {
          await queryInterface.addColumn('companies', 'agency_license', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Agency license number'
      }, { transaction });
          console.log('✅ Added agency_license to companies');
        } else {
          console.log('ℹ️ Column agency_license already exists in companies, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column agency_license already exists in companies, skipping...');
        } else {
            console.warn('⚠️ Could not check/add agency_license to companies:', err.message);
        }
      }

      
      
      try {
        const tableInfo = await queryInterface.describeTable('companies');
        if (!tableInfo['agency_specialization']) {
          await queryInterface.addColumn('companies', 'agency_specialization', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'e.g., IT Recruitment, Finance Hiring'
      }, { transaction });
          console.log('✅ Added agency_specialization to companies');
        } else {
          console.log('ℹ️ Column agency_specialization already exists in companies, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column agency_specialization already exists in companies, skipping...');
        } else {
            console.warn('⚠️ Could not check/add agency_specialization to companies:', err.message);
        }
      }

      
      
      try {
        const tableInfo = await queryInterface.describeTable('companies');
        if (!tableInfo['agency_documents']) {
          await queryInterface.addColumn('companies', 'agency_documents', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Store agency verification documents'
      }, { transaction });
          console.log('✅ Added agency_documents to companies');
        } else {
          console.log('ℹ️ Column agency_documents already exists in companies, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column agency_documents already exists in companies, skipping...');
        } else {
            console.warn('⚠️ Could not check/add agency_documents to companies:', err.message);
        }
      }

      
      
      try {
        const tableInfo = await queryInterface.describeTable('companies');
        if (!tableInfo['verified_at']) {
          await queryInterface.addColumn('companies', 'verified_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When company/agency was verified'
      }, { transaction });
          console.log('✅ Added verified_at to companies');
        } else {
          console.log('ℹ️ Column verified_at already exists in companies, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column verified_at already exists in companies, skipping...');
        } else {
            console.warn('⚠️ Could not check/add verified_at to companies:', err.message);
        }
      }

      
      
      try {
        const tableInfo = await queryInterface.describeTable('companies');
        if (!tableInfo['verification_method']) {
          await queryInterface.addColumn('companies', 'verification_method', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'automated_gst | manual_review | hybrid'
      }, { transaction });
          console.log('✅ Added verification_method to companies');
        } else {
          console.log('ℹ️ Column verification_method already exists in companies, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column verification_method already exists in companies, skipping...');
        } else {
            console.warn('⚠️ Could not check/add verification_method to companies:', err.message);
        }
      }

      
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


