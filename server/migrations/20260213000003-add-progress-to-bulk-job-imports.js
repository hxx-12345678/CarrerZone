'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'bulk_job_imports';
    let desc;

    try {
      desc = await queryInterface.describeTable(table);
    } catch (e) {
      console.warn(`⚠️ Could not describe table ${table}:`, e?.message || e);
      return;
    }

    if (!desc.progress) {
      await queryInterface.addColumn(table, 'progress', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      });
    }

    if (!desc.started_at) {
      await queryInterface.addColumn(table, 'started_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!desc.completed_at) {
      await queryInterface.addColumn(table, 'completed_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!desc.cancelled_at) {
      await queryInterface.addColumn(table, 'cancelled_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = 'bulk_job_imports';
    try {
      const desc = await queryInterface.describeTable(table);
      if (desc.progress) await queryInterface.removeColumn(table, 'progress');
      if (desc.started_at) await queryInterface.removeColumn(table, 'started_at');
      if (desc.completed_at) await queryInterface.removeColumn(table, 'completed_at');
      if (desc.cancelled_at) await queryInterface.removeColumn(table, 'cancelled_at');
    } catch (e) {
      console.warn(`⚠️ Could not rollback columns on ${table}:`, e?.message || e);
    }
  }
};
