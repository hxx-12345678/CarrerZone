'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add missing user columns with error handling for existing columns
      const columnsToAdd = [
        { name: 'current_company', type: Sequelize.STRING, comment: 'Current company name for job seekers' },
        { name: 'current_role', type: Sequelize.STRING, comment: 'Current role/position for job seekers' },
        { name: 'highest_education', type: Sequelize.STRING, comment: 'Highest education level' },
        { name: 'field_of_study', type: Sequelize.STRING, comment: 'Field of study' },
        { name: 'preferred_job_titles', type: Sequelize.JSONB, defaultValue: [], comment: 'Preferred job titles' },
        { name: 'preferred_industries', type: Sequelize.JSONB, defaultValue: [], comment: 'Preferred industries' },
        { name: 'preferred_company_size', type: Sequelize.STRING, comment: 'Preferred company size' },
        { name: 'preferred_work_mode', type: Sequelize.STRING, comment: 'Preferred work mode (remote, hybrid, on-site)' },
        { name: 'preferred_employment_type', type: Sequelize.STRING, comment: 'Preferred employment type (full-time, part-time, etc.)' },
        { name: 'designation', type: Sequelize.STRING, comment: 'User designation' },
        { name: 'department', type: Sequelize.STRING, comment: 'User department' }
      ];

      for (const column of columnsToAdd) {
        try {
          await queryInterface.addColumn('users', column.name, {
            type: column.type,
            allowNull: true,
            defaultValue: column.defaultValue,
            comment: column.comment
          }, { transaction });
          console.log(`✅ Added column: ${column.name}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ Column ${column.name} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }

      await transaction.commit();
      console.log('✅ Added missing user columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding user columns:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the added columns
      await queryInterface.removeColumn('users', 'current_company', { transaction });
      await queryInterface.removeColumn('users', 'current_role', { transaction });
      await queryInterface.removeColumn('users', 'highest_education', { transaction });
      await queryInterface.removeColumn('users', 'field_of_study', { transaction });
      await queryInterface.removeColumn('users', 'preferred_job_titles', { transaction });
      await queryInterface.removeColumn('users', 'preferred_industries', { transaction });
      await queryInterface.removeColumn('users', 'preferred_company_size', { transaction });
      await queryInterface.removeColumn('users', 'preferred_work_mode', { transaction });
      await queryInterface.removeColumn('users', 'preferred_employment_type', { transaction });
      await queryInterface.removeColumn('users', 'designation', { transaction });
      await queryInterface.removeColumn('users', 'department', { transaction });

      await transaction.commit();
      console.log('✅ Removed user columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing user columns:', error);
      throw error;
    }
  }
};
