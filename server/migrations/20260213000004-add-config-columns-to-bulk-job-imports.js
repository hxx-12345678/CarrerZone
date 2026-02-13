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

    if (!desc.mapping_config) {
      await queryInterface.addColumn(table, 'mapping_config', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
    }

    if (!desc.validation_rules) {
      await queryInterface.addColumn(table, 'validation_rules', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
    }

    if (!desc.default_values) {
      await queryInterface.addColumn(table, 'default_values', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
    }
  },

  async down(queryInterface) {
    const table = 'bulk_job_imports';
    try {
      const desc = await queryInterface.describeTable(table);
      if (desc.mapping_config) await queryInterface.removeColumn(table, 'mapping_config');
      if (desc.validation_rules) await queryInterface.removeColumn(table, 'validation_rules');
      if (desc.default_values) await queryInterface.removeColumn(table, 'default_values');
    } catch (e) {
      console.warn(`⚠️ Could not rollback columns on ${table}:`, e?.message || e);
    }
  }
};
