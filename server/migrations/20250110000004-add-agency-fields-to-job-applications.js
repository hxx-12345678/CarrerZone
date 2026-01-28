'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: skip if job_applications or companies tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('job_applications') || !normalized.includes('companies')) {
      console.log('ℹ️  Skipping agency fields migration (job_applications/companies not created yet)');
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Adding agency fields to job_applications table...');
      
      // Add hiring_company_id
      await queryInterface.addColumn('job_applications', 'hiring_company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'The actual hiring company (for agency jobs)'
      }, { transaction });
      
      console.log('✅ Added hiring_company_id');
      
      // Add is_agency_job flag
      await queryInterface.addColumn('job_applications', 'is_agency_job', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this application is for an agency-posted job'
      }, { transaction });
      
      console.log('✅ Added is_agency_job');
      
      // Create index
      await queryInterface.addIndex('job_applications', ['hiring_company_id'], {
        name: 'idx_job_apps_hiring_company',
        transaction
      });
      
      console.log('✅ Created index');
      
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
      console.log('🔄 Rolling back agency fields from job_applications table...');
      
      await queryInterface.removeIndex('job_applications', 'idx_job_apps_hiring_company', { transaction });
      await queryInterface.removeColumn('job_applications', 'is_agency_job', { transaction });
      await queryInterface.removeColumn('job_applications', 'hiring_company_id', { transaction });
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};


