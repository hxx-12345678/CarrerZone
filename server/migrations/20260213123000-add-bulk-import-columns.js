'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = 'bulk_job_imports';
        try {
            const tableDescription = await queryInterface.describeTable(table);

            // Add mapping_config
            if (!tableDescription.mapping_config) {
                await queryInterface.addColumn(table, 'mapping_config', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true
                });
            }

            // Add validation_rules
            if (!tableDescription.validation_rules) {
                await queryInterface.addColumn(table, 'validation_rules', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true
                });
            }

            // Add default_values
            if (!tableDescription.default_values) {
                await queryInterface.addColumn(table, 'default_values', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true
                });
            }

            // Add template_id
            if (!tableDescription.template_id) {
                await queryInterface.addColumn(table, 'template_id', {
                    type: Sequelize.UUID,
                    defaultValue: null,
                    allowNull: true
                });
            }

            // Add is_scheduled
            if (!tableDescription.is_scheduled) {
                await queryInterface.addColumn(table, 'is_scheduled', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: true
                });
            }

            // Add scheduled_at
            if (!tableDescription.scheduled_at) {
                await queryInterface.addColumn(table, 'scheduled_at', {
                    type: Sequelize.DATE,
                    defaultValue: null,
                    allowNull: true
                });
            }

            // Add notification_email
            if (!tableDescription.notification_email) {
                await queryInterface.addColumn(table, 'notification_email', {
                    type: Sequelize.STRING,
                    defaultValue: null,
                    allowNull: true
                });
            }

            // Add success_log
            if (!tableDescription.success_log) {
                await queryInterface.addColumn(table, 'success_log', {
                    type: Sequelize.JSONB,
                    defaultValue: [],
                    allowNull: true
                });
            }

            // Add error_log
            if (!tableDescription.error_log) {
                await queryInterface.addColumn(table, 'error_log', {
                    type: Sequelize.JSONB,
                    defaultValue: [],
                    allowNull: true
                });
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
