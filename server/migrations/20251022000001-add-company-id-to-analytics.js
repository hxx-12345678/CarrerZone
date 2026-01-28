'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add company_id column to analytics table
    await queryInterface.addColumn('analytics', 'company_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for better query performance
    await queryInterface.addIndex('analytics', ['company_id'], {
      name: 'analytics_company_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('analytics', 'analytics_company_id_idx');
    
    // Remove the company_id column
    await queryInterface.removeColumn('analytics', 'company_id');
  }
};

