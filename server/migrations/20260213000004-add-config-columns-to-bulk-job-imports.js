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
      try {
        await queryInterface.addColumn(table, 'mapping_config', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        });
        console.log(`✅ Added mapping_config to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add mapping_config to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.validation_rules) {
      try {
        await queryInterface.addColumn(table, 'validation_rules', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        });
        console.log(`✅ Added validation_rules to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add validation_rules to ${table}:`, err?.message || err);
        }
      }
    }

    if (!desc.default_values) {
      try {
        await queryInterface.addColumn(table, 'default_values', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        });
        console.log(`✅ Added default_values to ${table}`);
      } catch (err) {
        if (err?.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
          // ignore
        } else {
          console.warn(`⚠️ Could not add default_values to ${table}:`, err?.message || err);
        }
      }
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
