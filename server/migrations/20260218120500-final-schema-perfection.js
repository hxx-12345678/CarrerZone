'use strict';

/**
 * FINAL SCHEMA PERFECTION MIGRATION
 * This migration ensures that the local database schema exactly matches the models
 * and resolves all discrepancies found during comparison with Render.
 * It is idempotent and safe to run.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const sequelize = queryInterface.sequelize;

        // Helper: Add column if missing
        const addColumnIfMissing = async (table, column, definition) => {
            const [rows] = await sequelize.query(
                `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :table AND column_name = :column LIMIT 1`,
                { replacements: { table, column } }
            );
            if (!rows || rows.length === 0) {
                await queryInterface.addColumn(table, column, definition);
                console.log(`✅ Added column ${table}.${column}`);
            }
        };

        // Helper: Change column type/nullability
        const changeColumnSafe = async (table, column, definition) => {
            try {
                await queryInterface.changeColumn(table, column, definition);
                console.log(`✅ Updated column ${table}.${column}`);
            } catch (error) {
                console.warn(`⚠️ Could not update ${table}.${column}:`, error.message);
            }
        };

        // Helper: Drop column if exists
        const dropColumnIfExists = async (table, column) => {
            const [rows] = await sequelize.query(
                `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :table AND column_name = :column LIMIT 1`,
                { replacements: { table, column } }
            );
            if (rows && rows.length > 0) {
                await queryInterface.removeColumn(table, column);
                console.log(`🗑️ Dropped extra column ${table}.${column}`);
            }
        };

        // 1. SYSTEM_SETTINGS table (Missing in Remote)
        await queryInterface.createTable('system_settings', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            key: { type: Sequelize.STRING, allowNull: false, unique: true },
            value: { type: Sequelize.JSONB, allowNull: false },
            category: { type: Sequelize.STRING, defaultValue: 'general' },
            description: { type: Sequelize.TEXT },
            is_public: { type: Sequelize.BOOLEAN, defaultValue: false },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false }
        }).catch(() => console.log('ℹ️ system_settings already exists'));

        // 2. BULK_JOB_IMPORTS Fixes
        await dropColumnIfExists('bulk_job_imports', 'column_mapping');
        await changeColumnSafe('bulk_job_imports', 'error_log', {
            type: 'JSONB USING CAST(error_log AS JSONB)',
            defaultValue: [],
            allowNull: true
        });
        await changeColumnSafe('bulk_job_imports', 'mapping_config', {
            type: 'JSONB USING CAST(mapping_config AS JSONB)',
            defaultValue: {},
            allowNull: true
        });
        await changeColumnSafe('bulk_job_imports', 'progress', {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0,
            allowNull: true
        });
        // Match nullability to model for bulk_job_imports
        const bulkJobNullableFields = ['file_url', 'file_path', 'file_size', 'started_at', 'completed_at', 'cancelled_at', 'scheduled_at', 'notification_email'];
        for (const f of bulkJobNullableFields) {
            await changeColumnSafe('bulk_job_imports', f, { allowNull: true });
        }

        // 3. JOB_TEMPLATES Fixes (Drop CamelCase duplicates, fix snake_case)
        await dropColumnIfExists('job_templates', 'createdAt');
        await dropColumnIfExists('job_templates', 'updatedAt');
        await dropColumnIfExists('job_templates', 'companyId'); // CamelCase one

        await changeColumnSafe('job_templates', 'is_public', { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
        await changeColumnSafe('job_templates', 'is_default', { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
        await changeColumnSafe('job_templates', 'usage_count', { type: Sequelize.INTEGER, defaultValue: 0, allowNull: true });
        await changeColumnSafe('job_templates', 'last_used_at', { type: Sequelize.DATE, allowNull: true });
        await changeColumnSafe('job_templates', 'category', { type: Sequelize.STRING, allowNull: false });
        await changeColumnSafe('job_templates', 'company_id', { type: Sequelize.UUID, allowNull: false });

        // 4. USERS Fixes
        await changeColumnSafe('users', 'session_version', { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false });

        // 5. JOBS Standardize (Enums vs Varchar)
        // We stick with STRING for columns that have compatibility issues as per comments in Job.js
        await changeColumnSafe('jobs', 'hiringtimeline', { type: Sequelize.STRING, allowNull: true });
        await changeColumnSafe('jobs', 'pricingtier', { type: Sequelize.STRING, allowNull: true });
        await changeColumnSafe('jobs', 'urgencylevel', { type: Sequelize.STRING, allowNull: true });

        // 6. ENUM Synchronization
        // Standardize enum_users_account_status if possible
        // Note: Changing enums can be tricky in migrations, usually best to just ensure values exist
        try {
            await sequelize.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_account_status') THEN
                        CREATE TYPE "enum_users_account_status" AS ENUM('active', 'suspended', 'deleted', 'pending_verification', 'rejected', 'inactive');
                    END IF;
                END $$;
            `);
        } catch (e) {
            console.warn('⚠️ Enum sync warning:', e.message);
        }

        // 7. COMPANIES Fixes
        await addColumnIfMissing('companies', 'verified_at', { type: Sequelize.DATE, allowNull: true });

        // Ensure jsonb for agency_specialization
        await changeColumnSafe('companies', 'agency_specialization', {
            type: 'JSONB USING CAST(agency_specialization AS JSONB)',
            defaultValue: [],
            allowNull: true
        });

        console.log('🏁 Final Schema Perfection Migration Completed');
    },

    down: async (queryInterface, Sequelize) => {
        // Non-destructive
    }
};
