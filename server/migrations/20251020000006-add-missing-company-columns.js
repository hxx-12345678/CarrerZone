'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add missing company columns
      await queryInterface.addColumn('companies', 'created_by_agency_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        comment: 'Agency that created this company profile (if created by agency)'
      }, { transaction });

      await queryInterface.addColumn('companies', 'is_claimed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether company is claimed by its actual owner (false if created by agency and not yet claimed)'
      }, { transaction });

      await queryInterface.addColumn('companies', 'claimed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When company was claimed by its owner'
      }, { transaction });

      await queryInterface.addColumn('companies', 'claimed_by_user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who claimed the company'
      }, { transaction });

      await transaction.commit();
      console.log('✅ Added missing company columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding company columns:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the added columns
      await queryInterface.removeColumn('companies', 'created_by_agency_id', { transaction });
      await queryInterface.removeColumn('companies', 'is_claimed', { transaction });
      await queryInterface.removeColumn('companies', 'claimed_at', { transaction });
      await queryInterface.removeColumn('companies', 'claimed_by_user_id', { transaction });

      await transaction.commit();
      console.log('✅ Removed company columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing company columns:', error);
      throw error;
    }
  }
};
