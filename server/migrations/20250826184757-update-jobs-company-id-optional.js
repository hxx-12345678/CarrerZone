'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Make company_id column optional (allow NULL)
    await queryInterface.changeColumn('jobs', 'company_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert company_id column to required (not allow NULL)
    await queryInterface.changeColumn('jobs', 'company_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      }
    });
  }
};
