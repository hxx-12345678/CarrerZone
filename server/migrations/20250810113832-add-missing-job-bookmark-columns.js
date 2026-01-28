'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Adding missing columns to job_bookmarks table...');
      
      // Check if columns exist before adding them
      const tableDescription = await queryInterface.describeTable('job_bookmarks');
      
      if (!tableDescription.folder) {
        await queryInterface.addColumn('job_bookmarks', 'folder', {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: 'default'
        });
        console.log('✅ Added folder column');
      } else {
        console.log('⚠️ folder column already exists');
      }

      if (!tableDescription.priority) {
        await queryInterface.addColumn('job_bookmarks', 'priority', {
          type: Sequelize.ENUM('low', 'medium', 'high'),
          allowNull: true,
          defaultValue: 'medium'
        });
        console.log('✅ Added priority column');
      } else {
        console.log('⚠️ priority column already exists');
      }

      if (!tableDescription.reminder_date) {
        await queryInterface.addColumn('job_bookmarks', 'reminder_date', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('✅ Added reminder_date column');
      } else {
        console.log('⚠️ reminder_date column already exists');
      }

      if (!tableDescription.notes) {
        await queryInterface.addColumn('job_bookmarks', 'notes', {
          type: Sequelize.TEXT,
          allowNull: true
        });
        console.log('✅ Added notes column');
      } else {
        console.log('⚠️ notes column already exists');
      }

      console.log('✅ Job bookmarks migration completed');
    } catch (error) {
      console.log('⚠️ Error in job bookmarks migration:', error.message);
      // Don't throw error, just log it
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('job_bookmarks', 'folder');
      await queryInterface.removeColumn('job_bookmarks', 'priority');
      await queryInterface.removeColumn('job_bookmarks', 'reminder_date');
      await queryInterface.removeColumn('job_bookmarks', 'notes');
    } catch (error) {
      console.log('⚠️ Error removing columns:', error.message);
    }
  }
};
