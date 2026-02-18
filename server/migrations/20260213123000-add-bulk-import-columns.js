'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = 'bulk_job_imports';
        try {
            const tableDescription = await queryInterface.describeTable(table);

            // Add mapping_config
            if (!tableDescription.mapping_config) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['mapping_config']) {
          await queryInterface.addColumn('table', 'mapping_config', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true
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

            // Add validation_rules
            if (!tableDescription.validation_rules) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['validation_rules']) {
          await queryInterface.addColumn('table', 'validation_rules', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true
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

            // Add default_values
            if (!tableDescription.default_values) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['default_values']) {
          await queryInterface.addColumn('table', 'default_values', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true
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

            // Add template_id
            if (!tableDescription.template_id) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['template_id']) {
          await queryInterface.addColumn('table', 'template_id', {
                    type: Sequelize.UUID,
                    defaultValue: null,
                    allowNull: true
                });
          console.log('✅ Added template_id to table');
        } else {
          console.log('ℹ️ Column template_id already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column template_id already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add template_id to table:', err.message);
        }
      }

            }

            // Add is_scheduled
            if (!tableDescription.is_scheduled) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['is_scheduled']) {
          await queryInterface.addColumn('table', 'is_scheduled', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: true
                });
          console.log('✅ Added is_scheduled to table');
        } else {
          console.log('ℹ️ Column is_scheduled already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column is_scheduled already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add is_scheduled to table:', err.message);
        }
      }

            }

            // Add scheduled_at
            if (!tableDescription.scheduled_at) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['scheduled_at']) {
          await queryInterface.addColumn('table', 'scheduled_at', {
                    type: Sequelize.DATE,
                    defaultValue: null,
                    allowNull: true
                });
          console.log('✅ Added scheduled_at to table');
        } else {
          console.log('ℹ️ Column scheduled_at already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column scheduled_at already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add scheduled_at to table:', err.message);
        }
      }

            }

            // Add notification_email
            if (!tableDescription.notification_email) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['notification_email']) {
          await queryInterface.addColumn('table', 'notification_email', {
                    type: Sequelize.STRING,
                    defaultValue: null,
                    allowNull: true
                });
          console.log('✅ Added notification_email to table');
        } else {
          console.log('ℹ️ Column notification_email already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column notification_email already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add notification_email to table:', err.message);
        }
      }

            }

            // Add success_log
            if (!tableDescription.success_log) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['success_log']) {
          await queryInterface.addColumn('table', 'success_log', {
                    type: Sequelize.JSONB,
                    defaultValue: [],
                    allowNull: true
                });
          console.log('✅ Added success_log to table');
        } else {
          console.log('ℹ️ Column success_log already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column success_log already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add success_log to table:', err.message);
        }
      }

            }

            // Add error_log
            if (!tableDescription.error_log) {
                
      try {
        const tableInfo = await queryInterface.describeTable('table');
        if (!tableInfo['error_log']) {
          await queryInterface.addColumn('table', 'error_log', {
                    type: Sequelize.JSONB,
                    defaultValue: [],
                    allowNull: true
                });
          console.log('✅ Added error_log to table');
        } else {
          console.log('ℹ️ Column error_log already exists in table, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column error_log already exists in table, skipping...');
        } else {
            console.warn('⚠️ Could not check/add error_log to table:', err.message);
        }
      }

            }

            console.log('✅ Bulk Import columns added successfully');
        } catch (error) {
            console.error('⚠️ Error adding columns to bulk_job_imports:', error);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Optional: removing columns on rollback
    }
};
