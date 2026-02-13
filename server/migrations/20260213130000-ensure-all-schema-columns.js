'use strict';

/**
 * Comprehensive migration to ensure ALL tables have their required columns.
 * This migration is safe to run on any deployment state - it checks for column
 * existence before adding, so it's idempotent.
 * 
 * This fixes issues where:
 * - Earlier migrations ran before the table existed (no-op)
 * - Tables were created by sync() without all model fields
 * - Migrations used wrong column names (camelCase vs snake_case)
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Helper: safely add a column if it doesn't exist
        const addColumnIfMissing = async (table, column, definition) => {
            try {
                const [rows] = await queryInterface.sequelize.query(
                    `SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
             AND table_name = :table 
             AND column_name = :column 
           LIMIT 1`,
                    { replacements: { table, column } }
                );
                if (!rows || rows.length === 0) {
                    await queryInterface.addColumn(table, column, definition);
                    console.log(`✅ Added column ${table}.${column}`);
                } else {
                    console.log(`ℹ️ Column ${table}.${column} already exists`);
                }
            } catch (error) {
                console.warn(`⚠️ Could not add ${table}.${column}:`, error.message);
            }
        };

        // Helper: check if table exists
        const tableExists = async (table) => {
            const [rows] = await queryInterface.sequelize.query(
                `SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = :table LIMIT 1`,
                { replacements: { table } }
            );
            return rows && rows.length > 0;
        };

        // ========================================
        // 1. job_templates table fixes
        // ========================================
        if (await tableExists('job_templates')) {
            console.log('🔧 Ensuring job_templates columns...');

            await addColumnIfMissing('job_templates', 'company_id', {
                type: Sequelize.UUID,
                allowNull: true,
                comment: 'Company this template belongs to'
            });

            await addColumnIfMissing('job_templates', 'created_by', {
                type: Sequelize.UUID,
                allowNull: true,
                comment: 'User who created this template'
            });

            await addColumnIfMissing('job_templates', 'is_public', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });

            await addColumnIfMissing('job_templates', 'is_default', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });

            await addColumnIfMissing('job_templates', 'template_data', {
                type: Sequelize.JSONB,
                defaultValue: {}
            });

            await addColumnIfMissing('job_templates', 'usage_count', {
                type: Sequelize.INTEGER,
                defaultValue: 0
            });

            await addColumnIfMissing('job_templates', 'last_used_at', {
                type: Sequelize.DATE,
                allowNull: true
            });

            await addColumnIfMissing('job_templates', 'is_active', {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            });

            await addColumnIfMissing('job_templates', 'tags', {
                type: Sequelize.JSONB,
                defaultValue: []
            });

            await addColumnIfMissing('job_templates', 'version', {
                type: Sequelize.INTEGER,
                defaultValue: 1
            });
        }

        // ========================================
        // 2. bulk_job_imports table fixes
        // ========================================
        if (await tableExists('bulk_job_imports')) {
            console.log('🔧 Ensuring bulk_job_imports columns...');

            await addColumnIfMissing('bulk_job_imports', 'mapping_config', {
                type: Sequelize.JSONB,
                defaultValue: {}
            });

            await addColumnIfMissing('bulk_job_imports', 'validation_rules', {
                type: Sequelize.JSONB,
                defaultValue: {}
            });

            await addColumnIfMissing('bulk_job_imports', 'default_values', {
                type: Sequelize.JSONB,
                defaultValue: {}
            });

            await addColumnIfMissing('bulk_job_imports', 'template_id', {
                type: Sequelize.UUID,
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'is_scheduled', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });

            await addColumnIfMissing('bulk_job_imports', 'scheduled_at', {
                type: Sequelize.DATE,
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'notification_email', {
                type: Sequelize.STRING(255),
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'success_log', {
                type: Sequelize.JSONB,
                defaultValue: []
            });

            await addColumnIfMissing('bulk_job_imports', 'error_log', {
                type: Sequelize.JSONB,
                defaultValue: []
            });

            await addColumnIfMissing('bulk_job_imports', 'created_by', {
                type: Sequelize.UUID,
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'company_id', {
                type: Sequelize.UUID,
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'successful_imports', {
                type: Sequelize.INTEGER,
                defaultValue: 0
            });

            await addColumnIfMissing('bulk_job_imports', 'failed_imports', {
                type: Sequelize.INTEGER,
                defaultValue: 0
            });

            await addColumnIfMissing('bulk_job_imports', 'failed_records', {
                type: Sequelize.JSONB,
                defaultValue: []
            });

            await addColumnIfMissing('bulk_job_imports', 'skipped_records', {
                type: Sequelize.INTEGER,
                defaultValue: 0
            });

            await addColumnIfMissing('bulk_job_imports', 'progress', {
                type: Sequelize.FLOAT,
                defaultValue: 0
            });

            await addColumnIfMissing('bulk_job_imports', 'started_at', {
                type: Sequelize.DATE,
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'completed_at', {
                type: Sequelize.DATE,
                allowNull: true
            });

            await addColumnIfMissing('bulk_job_imports', 'cancelled_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }

        console.log('🏁 Schema verification complete');
    },

    down: async (queryInterface, Sequelize) => {
        // This migration only adds missing columns, no rollback needed
        // Rolling back would risk data loss
        console.log('ℹ️ No rollback for schema verification migration');
    }
};
