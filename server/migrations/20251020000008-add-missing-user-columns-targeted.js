'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check which columns exist and only add missing ones
      const tableDescription = await queryInterface.describeTable('users');
      
      // Add only the missing columns
      if (!tableDescription.current_company) {
        await queryInterface.addColumn('users', 'current_company', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Current company name for job seekers'
        }, { transaction });
        console.log('✅ Added current_company column');
      }

      if (!tableDescription.current_role) {
        await queryInterface.addColumn('users', 'current_role', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Current role/position for job seekers'
        }, { transaction });
        console.log('✅ Added current_role column');
      }

      if (!tableDescription.highest_education) {
        await queryInterface.addColumn('users', 'highest_education', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Highest education level'
        }, { transaction });
        console.log('✅ Added highest_education column');
      }

      if (!tableDescription.field_of_study) {
        await queryInterface.addColumn('users', 'field_of_study', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Field of study'
        }, { transaction });
        console.log('✅ Added field_of_study column');
      }

      if (!tableDescription.preferred_job_titles) {
        await queryInterface.addColumn('users', 'preferred_job_titles', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: [],
          comment: 'Preferred job titles'
        }, { transaction });
        console.log('✅ Added preferred_job_titles column');
      }

      if (!tableDescription.preferred_industries) {
        await queryInterface.addColumn('users', 'preferred_industries', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: [],
          comment: 'Preferred industries'
        }, { transaction });
        console.log('✅ Added preferred_industries column');
      }

      if (!tableDescription.preferred_company_size) {
        await queryInterface.addColumn('users', 'preferred_company_size', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Preferred company size'
        }, { transaction });
        console.log('✅ Added preferred_company_size column');
      }

      if (!tableDescription.preferred_work_mode) {
        await queryInterface.addColumn('users', 'preferred_work_mode', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Preferred work mode (remote, hybrid, on-site)'
        }, { transaction });
        console.log('✅ Added preferred_work_mode column');
      }

      if (!tableDescription.preferred_employment_type) {
        await queryInterface.addColumn('users', 'preferred_employment_type', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Preferred employment type (full-time, part-time, etc.)'
        }, { transaction });
        console.log('✅ Added preferred_employment_type column');
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

      await transaction.commit();
      console.log('✅ Removed user columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing user columns:', error);
      throw error;
    }
  }
};
