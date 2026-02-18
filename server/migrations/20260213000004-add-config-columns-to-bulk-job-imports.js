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
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['mapping_config']) {
          await queryInterface.addColumn('table', 'mapping_config', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
          console.log('✅ Added mapping_config to table');
        } else {
          console.log('ℹ️ Column mapping_config already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column mapping_config already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add mapping_config to table:', err.message);
        }
      }

    }

    if (!desc.validation_rules) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['validation_rules']) {
          await queryInterface.addColumn('table', 'validation_rules', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
          console.log('✅ Added validation_rules to table');
        } else {
          console.log('ℹ️ Column validation_rules already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column validation_rules already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add validation_rules to table:', err.message);
        }
      }

    }

    if (!desc.default_values) {
      
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['default_values']) {
          await queryInterface.addColumn('table', 'default_values', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
          console.log('✅ Added default_values to table');
        } else {
          console.log('ℹ️ Column default_values already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column default_values already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add default_values to table:', err.message);
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
