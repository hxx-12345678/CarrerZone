'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: ensure base tables exist
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    if (!normalized.includes('companies') || !normalized.includes('users')) {
      console.log('ℹ️  Skipping company claiming fields (companies/users not created yet)');
      return;
    }

    console.log('🔄 Adding company claiming fields to companies table...');
    
    try {
      // Track if company was created by an agency
      await queryInterface.addColumn('companies', 'created_by_agency_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Agency that created this company profile'
      });
      console.log('✅ Added created_by_agency_id');
      
      // Track if company is claimed by its actual owner
      await queryInterface.addColumn('companies', 'is_claimed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether company is claimed by its actual owner (false if created by agency)'
      });
      console.log('✅ Added is_claimed');
      
      // Track when company was claimed
      await queryInterface.addColumn('companies', 'claimed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When company was claimed by its owner'
      });
      console.log('✅ Added claimed_at');
      
      // Track who claimed the company
      await queryInterface.addColumn('companies', 'claimed_by_user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'User who claimed the company'
      });
      console.log('✅ Added claimed_by_user_id');
      
      console.log('🎉 Company claiming fields added successfully!');
    } catch (error) {
      console.error('❌ Error adding company claiming fields:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('companies', 'created_by_agency_id');
    await queryInterface.removeColumn('companies', 'is_claimed');
    await queryInterface.removeColumn('companies', 'claimed_at');
    await queryInterface.removeColumn('companies', 'claimed_by_user_id');
  }
};


