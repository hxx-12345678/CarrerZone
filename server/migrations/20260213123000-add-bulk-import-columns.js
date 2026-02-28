'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = 'bulk_job_imports';
        try {
            const safeAddColumn = async (columnName, definition) => {
                try {
                    const tableInfo = await queryInterface.describeTable(table);
                    if (tableInfo[columnName]) {
                        return;
                    }
                    await queryInterface.addColumn(table, columnName, definition);
                    console.log(`✅ Added ${columnName} to ${table}`);
                } catch (err) {
                    if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate column'))) {
                        return;
                    }
                    console.warn(`⚠️ Could not check/add ${columnName} to ${table}:`, err.message);
                }
            };

            await safeAddColumn('mapping_config', {
                type: Sequelize.JSONB,
                defaultValue: {},
                allowNull: true
            });

            await safeAddColumn('validation_rules', {
                type: Sequelize.JSONB,
                defaultValue: {},
                allowNull: true
            });

            await safeAddColumn('default_values', {
                type: Sequelize.JSONB,
                defaultValue: {},
                allowNull: true
            });

            await safeAddColumn('template_id', {
                type: Sequelize.UUID,
                defaultValue: null,
                allowNull: true
            });

            await safeAddColumn('is_scheduled', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: true
            });

            await safeAddColumn('scheduled_at', {
                type: Sequelize.DATE,
                defaultValue: null,
                allowNull: true
            });

            await safeAddColumn('notification_email', {
                type: Sequelize.STRING,
                defaultValue: null,
                allowNull: true
            });

            await safeAddColumn('success_log', {
                type: Sequelize.JSONB,
                defaultValue: [],
                allowNull: true
            });

            await safeAddColumn('error_log', {
                type: Sequelize.JSONB,
                defaultValue: [],
                allowNull: true
            });

            console.log('✅ Bulk Import columns added successfully');
        } catch (error) {
            console.error('⚠️ Error adding columns to bulk_job_imports:', error);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Optional: removing columns on rollback
    }
};
