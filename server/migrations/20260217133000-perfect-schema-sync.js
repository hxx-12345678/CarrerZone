'use strict';

/**
 * Migration to add permissions column to users table and ensure other critical columns exist.
 * This migration is idempotent and safe to run on any environment.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
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

        // 1. ADD PERMISSIONS TO USERS
        await addColumnIfMissing('users', 'permissions', {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {}
        });

        // 2. ENSURE OTHER CRITICAL COLUMNS IN USERS (based on User.js model)
        await addColumnIfMissing('users', 'company_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'companies', key: 'id' }
        });

        await addColumnIfMissing('users', 'designation', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfMissing('users', 'department', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfMissing('users', 'last_profile_update', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await addColumnIfMissing('users', 'session_version', {
            type: Sequelize.INTEGER,
            defaultValue: 1
        });

        // 3. ENSURE TEAM_INVITATIONS PERMISSIONS (already exists but just in case)
        await addColumnIfMissing('team_invitations', 'permissions', {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {
                jobPosting: true,
                resumeDatabase: true,
                analytics: true,
                featuredJobs: false,
                hotVacancies: false,
                applications: true,
                requirements: true,
                settings: false
            }
        });

        // 4. ENSURE BULK_JOB_IMPORTS COLUMNS
        await addColumnIfMissing('bulk_job_imports', 'file_url', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfMissing('bulk_job_imports', 'file_size', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfMissing('bulk_job_imports', 'successful_imports', {
            type: Sequelize.INTEGER,
            defaultValue: 0
        });

        await addColumnIfMissing('bulk_job_imports', 'progress', {
            type: Sequelize.INTEGER,
            defaultValue: 0
        });

        await addColumnIfMissing('bulk_job_imports', 'column_mapping', {
            type: Sequelize.JSONB,
            allowNull: true
        });

        // 5. ENSURE JOBS COLUMNS
        await addColumnIfMissing('jobs', 'department', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await addColumnIfMissing('jobs', 'salary_currency', {
            type: Sequelize.STRING,
            defaultValue: 'INR'
        });

        // 6. ENSURE COMPANIES COLUMNS
        await addColumnIfMissing('companies', 'industries', {
            type: Sequelize.JSONB,
            defaultValue: []
        });

        await addColumnIfMissing('companies', 'company_account_type', {
            type: Sequelize.ENUM('employer', 'recruiting_agency', 'consulting_firm'),
            defaultValue: 'employer'
        });

        console.log('🏁 Migration 20260217133000-perfect-schema-sync completed');
    },

    down: async (queryInterface, Sequelize) => {
        // Non-destructive migration
    }
};
