'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check which columns exist and only add missing ones
      const tableDescription = await queryInterface.describeTable('users');
      
      // Add only the missing columns
      if (!tableDescription.session_version) {
        await queryInterface.addColumn('users', 'session_version', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 1,
          comment: 'Session version for security'
        }, { transaction });
        console.log('✅ Added session_version column');
      }

      if (!tableDescription.verification_level) {
        await queryInterface.addColumn('users', 'verification_level', {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: 'basic',
          comment: 'User verification level'
        }, { transaction });
        console.log('✅ Added verification_level column');
      }

      if (!tableDescription.last_profile_update) {
        await queryInterface.addColumn('users', 'last_profile_update', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last profile update timestamp'
        }, { transaction });
        console.log('✅ Added last_profile_update column');
      }

      if (!tableDescription.profile_completion) {
        await queryInterface.addColumn('users', 'profile_completion', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
          comment: 'Profile completion percentage'
        }, { transaction });
        console.log('✅ Added profile_completion column');
      }

      if (!tableDescription.oauth_provider) {
        await queryInterface.addColumn('users', 'oauth_provider', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'OAuth provider (google, facebook, etc.)'
        }, { transaction });
        console.log('✅ Added oauth_provider column');
      }

      if (!tableDescription.oauth_id) {
        await queryInterface.addColumn('users', 'oauth_id', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'OAuth provider user ID'
        }, { transaction });
        console.log('✅ Added oauth_id column');
      }

      if (!tableDescription.oauth_access_token) {
        await queryInterface.addColumn('users', 'oauth_access_token', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'OAuth access token'
        }, { transaction });
        console.log('✅ Added oauth_access_token column');
      }

      if (!tableDescription.oauth_refresh_token) {
        await queryInterface.addColumn('users', 'oauth_refresh_token', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'OAuth refresh token'
        }, { transaction });
        console.log('✅ Added oauth_refresh_token column');
      }

      if (!tableDescription.oauth_token_expires_at) {
        await queryInterface.addColumn('users', 'oauth_token_expires_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'OAuth token expiration date'
        }, { transaction });
        console.log('✅ Added oauth_token_expires_at column');
      }

      await transaction.commit();
      console.log('✅ Added remaining user columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding remaining user columns:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the added columns
      await queryInterface.removeColumn('users', 'session_version', { transaction });
      await queryInterface.removeColumn('users', 'verification_level', { transaction });
      await queryInterface.removeColumn('users', 'last_profile_update', { transaction });
      await queryInterface.removeColumn('users', 'profile_completion', { transaction });
      await queryInterface.removeColumn('users', 'oauth_provider', { transaction });
      await queryInterface.removeColumn('users', 'oauth_id', { transaction });
      await queryInterface.removeColumn('users', 'oauth_access_token', { transaction });
      await queryInterface.removeColumn('users', 'oauth_refresh_token', { transaction });
      await queryInterface.removeColumn('users', 'oauth_token_expires_at', { transaction });

      await transaction.commit();
      console.log('✅ Removed remaining user columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing remaining user columns:', error);
      throw error;
    }
  }
};
