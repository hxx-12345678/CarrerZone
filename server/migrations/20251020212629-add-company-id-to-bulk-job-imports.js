'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if company_id column already exists
    const tableDescription = await queryInterface.describeTable('bulk_job_imports');
    
    if (!tableDescription.company_id) {
      await queryInterface.addColumn('bulk_job_imports', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true, // Allow null initially for existing records
        comment: 'Company this import belongs to',
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
      
      // Add index for company_id
      await queryInterface.addIndex('bulk_job_imports', ['company_id'], {
        name: 'bulk_job_imports_company_id'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove the company_id column and its index
    await queryInterface.removeIndex('bulk_job_imports', 'bulk_job_imports_company_id');
    await queryInterface.removeColumn('bulk_job_imports', 'company_id');
  }
};
