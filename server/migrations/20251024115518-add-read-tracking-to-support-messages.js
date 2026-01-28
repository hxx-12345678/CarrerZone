'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add fields for tracking which admins have read the message
    await queryInterface.addColumn('support_messages', 'read_by', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('support_messages', 'read_at', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('support_messages', 'last_read_by', {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'last_read_by'
    });

    await queryInterface.addColumn('support_messages', 'last_read_at', {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'last_read_at'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('support_messages', 'read_by');
    await queryInterface.removeColumn('support_messages', 'read_at');
    await queryInterface.removeColumn('support_messages', 'last_read_by');
    await queryInterface.removeColumn('support_messages', 'last_read_at');
  }
};