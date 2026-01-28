'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'oauth_provider', {
      type: Sequelize.ENUM('google', 'facebook', 'local'),
      defaultValue: 'local',
      allowNull: false
    });

    await queryInterface.addColumn('users', 'oauth_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'oauth_access_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'oauth_refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'oauth_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Make password nullable for OAuth users
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add unique constraint for oauth_provider + oauth_id combination
    await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
      unique: true,
      where: {
        oauth_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', ['oauth_provider', 'oauth_id']);
    
    await queryInterface.removeColumn('users', 'oauth_token_expires_at');
    await queryInterface.removeColumn('users', 'oauth_refresh_token');
    await queryInterface.removeColumn('users', 'oauth_access_token');
    await queryInterface.removeColumn('users', 'oauth_id');
    await queryInterface.removeColumn('users', 'oauth_provider');

    // Revert password to not null
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
