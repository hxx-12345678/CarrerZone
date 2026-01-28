'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the column already exists
    const tableDescription = await queryInterface.describeTable('conversations');
    
    if (!tableDescription.job_id) {
      await queryInterface.addColumn('conversations', 'job_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      console.log('✅ Added job_id column to conversations table');
    } else {
      console.log('ℹ️ job_id column already exists in conversations table');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('conversations');
    
    if (tableDescription.job_id) {
      await queryInterface.removeColumn('conversations', 'job_id');
      console.log('✅ Removed job_id column from conversations table');
    }
  }
};
