'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: skip if jobs or companies tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('jobs') || !normalized.includes('companies')) {
      console.log('ℹ️  Skipping agency fields migration (jobs/companies not created yet)');
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Adding agency fields to jobs table...');
      
      // Add hiring_company_id (the actual hiring company)
      await queryInterface.addColumn('jobs', 'hiring_company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'The actual hiring company (for agency posts)'
      }, { transaction });
      
      console.log('✅ Added hiring_company_id');
      
      // Add posted_by_agency_id
      await queryInterface.addColumn('jobs', 'posted_by_agency_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'The agency that posted the job'
      }, { transaction });
      
      console.log('✅ Added posted_by_agency_id');
      
      // Add is_agency_posted flag
      await queryInterface.addColumn('jobs', 'is_agency_posted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this job was posted by an agency'
      }, { transaction });
      
      console.log('✅ Added is_agency_posted');
      
      // Add agency_description
      await queryInterface.addColumn('jobs', 'agency_description', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Short description about the agency'
      }, { transaction });
      
      console.log('✅ Added agency_description');
      
      // Add authorization_id reference
      await queryInterface.addColumn('jobs', 'authorization_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'agency_client_authorizations',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Link to the authorization record'
      }, { transaction });
      
      console.log('✅ Added authorization_id');
      
      // Create indexes
      await queryInterface.addIndex('jobs', ['hiring_company_id'], {
        name: 'idx_jobs_hiring_company',
        transaction
      });
      
      await queryInterface.addIndex('jobs', ['posted_by_agency_id'], {
        name: 'idx_jobs_posted_by_agency',
        transaction
      });
      
      await queryInterface.addIndex('jobs', ['is_agency_posted'], {
        name: 'idx_jobs_is_agency_posted',
        transaction
      });
      
      console.log('✅ Created indexes');
      
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
      console.log('🔄 Rolling back agency fields from jobs table...');
      
      await queryInterface.removeIndex('jobs', 'idx_jobs_is_agency_posted', { transaction });
      await queryInterface.removeIndex('jobs', 'idx_jobs_posted_by_agency', { transaction });
      await queryInterface.removeIndex('jobs', 'idx_jobs_hiring_company', { transaction });
      
      await queryInterface.removeColumn('jobs', 'authorization_id', { transaction });
      await queryInterface.removeColumn('jobs', 'agency_description', { transaction });
      await queryInterface.removeColumn('jobs', 'is_agency_posted', { transaction });
      await queryInterface.removeColumn('jobs', 'posted_by_agency_id', { transaction });
      await queryInterface.removeColumn('jobs', 'hiring_company_id', { transaction });
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};


