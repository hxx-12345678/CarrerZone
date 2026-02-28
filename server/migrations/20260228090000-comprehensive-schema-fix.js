'use strict';

/**
 * COMPREHENSIVE SCHEMA FIX MIGRATION
 * 
 * This migration ensures the database schema perfectly matches all models.
 * It creates missing tables, adds missing columns, fixes type mismatches,
 * and adds missing enum values.
 * 
 * Every operation is IDEMPOTENT (safe to run multiple times).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        console.log('🚀 Starting comprehensive schema fix migration...');

        // Helper: safely add a column if it doesn't exist
        const safeAddColumn = async (table, column, definition) => {
            try {
                const tableInfo = await queryInterface.describeTable(table);
                if (!tableInfo[column]) {
                    await queryInterface.addColumn(table, column, definition);
                    console.log(`  ✅ Added ${table}.${column}`);
                }
            } catch (err) {
                if (err.message && err.message.includes('does not exist')) {
                    console.log(`  ⚠️ Table ${table} does not exist, skipping ${column}`);
                } else {
                    console.log(`  ℹ️ ${table}.${column}: ${err.message}`);
                }
            }
        };

        // Helper: safely add enum value
        const safeAddEnumValue = async (enumName, value) => {
            try {
                await queryInterface.sequelize.query(
                    `DO $$ BEGIN ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}'; EXCEPTION WHEN duplicate_object THEN null; END $$`
                );
                console.log(`  ✅ Added enum value '${value}' to ${enumName}`);
            } catch (err) {
                console.log(`  ℹ️ Enum ${enumName}.'${value}': ${err.message}`);
            }
        };

        // Helper: safely create table
        const safeCreateTable = async (tableName, columns) => {
            try {
                const tables = await queryInterface.showAllTables();
                const normalized = Array.isArray(tables)
                    ? tables.map(t => typeof t === 'string' ? t : t.tableName || t).map(n => String(n).toLowerCase())
                    : [];
                if (!normalized.includes(tableName.toLowerCase())) {
                    await queryInterface.createTable(tableName, columns);
                    console.log(`  ✅ Created table ${tableName}`);
                } else {
                    console.log(`  ℹ️ Table ${tableName} already exists`);
                }
            } catch (err) {
                console.log(`  ⚠️ Table ${tableName}: ${err.message}`);
            }
        };

        // Helper: safely change column type
        const safeChangeColumnType = async (table, column, newType) => {
            try {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE ${newType} USING "${column}"::${newType}`
                );
                console.log(`  ✅ Changed ${table}.${column} type to ${newType}`);
            } catch (err) {
                console.log(`  ℹ️ ${table}.${column} type change: ${err.message}`);
            }
        };

        // ============================================================
        // 1. CREATE MISSING TABLES
        // ============================================================
        console.log('\n📋 Step 1: Creating missing tables...');

        // system_settings table
        await safeCreateTable('system_settings', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true
            },
            key: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            value: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            type: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'string'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true
            },
            updated_by: {
                type: Sequelize.UUID,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // ============================================================
        // 2. ADD MISSING COLUMNS TO USERS TABLE
        // ============================================================
        console.log('\n📋 Step 2: Adding missing columns to users...');

        await safeAddColumn('users', 'secureJobTaps', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0
        });

        await safeAddColumn('users', 'secureJobTapsAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        // ============================================================
        // 3. FIX TYPE MISMATCHES
        // ============================================================
        console.log('\n📋 Step 3: Fixing column type mismatches...');

        // bulk_job_imports.file_size: should be INTEGER, not VARCHAR
        try {
            const bi = await queryInterface.describeTable('bulk_job_imports');
            if (bi.file_size && bi.file_size.type && bi.file_size.type.includes('VARYING')) {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "bulk_job_imports" ALTER COLUMN "file_size" TYPE INTEGER USING "file_size"::INTEGER`
                );
                console.log('  ✅ Fixed bulk_job_imports.file_size to INTEGER');
            }
        } catch (err) { console.log('  ℹ️ bulk_job_imports.file_size:', err.message); }

        // bulk_job_imports.progress: should be NUMERIC, not FLOAT8
        try {
            const bi2 = await queryInterface.describeTable('bulk_job_imports');
            if (bi2.progress) {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "bulk_job_imports" ALTER COLUMN "progress" TYPE NUMERIC USING "progress"::NUMERIC`
                );
                console.log('  ✅ Fixed bulk_job_imports.progress to NUMERIC');
            }
        } catch (err) { console.log('  ℹ️ bulk_job_imports.progress:', err.message); }

        // bulk_job_imports.error_log: should be JSONB, not TEXT
        try {
            const bi3 = await queryInterface.describeTable('bulk_job_imports');
            if (bi3.error_log && bi3.error_log.type === 'TEXT') {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "bulk_job_imports" ALTER COLUMN "error_log" TYPE JSONB USING CASE WHEN "error_log" IS NULL THEN NULL WHEN "error_log" = '' THEN '[]'::JSONB ELSE "error_log"::JSONB END`
                );
                console.log('  ✅ Fixed bulk_job_imports.error_log to JSONB');
            }
        } catch (err) { console.log('  ℹ️ bulk_job_imports.error_log:', err.message); }

        // companies.agency_specialization: should be JSONB, not VARCHAR
        try {
            const comp = await queryInterface.describeTable('companies');
            if (comp.agency_specialization && comp.agency_specialization.type && comp.agency_specialization.type.includes('VARYING')) {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "companies" ALTER COLUMN "agency_specialization" TYPE JSONB USING CASE WHEN "agency_specialization" IS NULL THEN NULL WHEN "agency_specialization" = '' THEN 'null'::JSONB ELSE to_jsonb("agency_specialization") END`
                );
                console.log('  ✅ Fixed companies.agency_specialization to JSONB');
            }
        } catch (err) { console.log('  ℹ️ companies.agency_specialization:', err.message); }

        // jobs.hiringtimeline: should be VARCHAR, not ENUM
        try {
            const jobs = await queryInterface.describeTable('jobs');
            if (jobs.hiringtimeline) {
                // Check if it's currently an enum
                const [result] = await queryInterface.sequelize.query(
                    `SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='jobs' AND column_name='hiringtimeline'`
                );
                if (result.length > 0 && result[0].data_type === 'USER-DEFINED') {
                    await queryInterface.sequelize.query(
                        `ALTER TABLE "jobs" ALTER COLUMN "hiringtimeline" TYPE VARCHAR(255) USING "hiringtimeline"::VARCHAR(255)`
                    );
                    console.log('  ✅ Fixed jobs.hiringtimeline from ENUM to VARCHAR');
                }
            }
        } catch (err) { console.log('  ℹ️ jobs.hiringtimeline:', err.message); }

        // jobs.pricingtier: should be VARCHAR, not ENUM
        try {
            const jobs2 = await queryInterface.describeTable('jobs');
            if (jobs2.pricingtier) {
                const [result] = await queryInterface.sequelize.query(
                    `SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='jobs' AND column_name='pricingtier'`
                );
                if (result.length > 0 && result[0].data_type === 'USER-DEFINED') {
                    await queryInterface.sequelize.query(
                        `ALTER TABLE "jobs" ALTER COLUMN "pricingtier" TYPE VARCHAR(255) USING "pricingtier"::VARCHAR(255)`
                    );
                    console.log('  ✅ Fixed jobs.pricingtier from ENUM to VARCHAR');
                }
            }
        } catch (err) { console.log('  ℹ️ jobs.pricingtier:', err.message); }

        // ============================================================
        // 4. FIX ENUM VALUES
        // ============================================================
        console.log('\n📋 Step 4: Fixing enum values...');

        // Ensure all user_type values exist
        await safeAddEnumValue('enum_users_user_type', 'superadmin');
        await safeAddEnumValue('enum_users_user_type', 'agency');

        // Ensure all account_status values exist
        await safeAddEnumValue('enum_users_account_status', 'inactive');

        // Ensure all verification_status values exist  
        await safeAddEnumValue('enum_companies_verification_status', 'premium_verified');
        await safeAddEnumValue('enum_companies_verification_status', 'rejected');

        // Ensure company_status values
        await safeAddEnumValue('enum_companies_company_status', 'pending_approval');

        // Ensure job status values
        await safeAddEnumValue('enum_jobs_status', 'inactive');

        // Ensure notification types
        const notifTypes = [
            'interview_scheduled', 'interview_cancelled', 'interview_rescheduled',
            'interview_completed', 'interview_reminder', 'interview_feedback',
            'company_verified', 'company_rejected', 'profile_verified',
            'profile_rejected', 'verification_pending', 'verification_approved',
            'verification_rejected'
        ];
        for (const nt of notifTypes) {
            await safeAddEnumValue('enum_notifications_type', nt);
        }

        // Ensure job application status values
        await safeAddEnumValue('enum_job_applications_status', 'interview_scheduled');

        // ============================================================
        // 5. CREATE MISSING INDEXES (idempotent)
        // ============================================================
        console.log('\n📋 Step 5: Ensuring indexes...');

        const safeCreateIndex = async (sql) => {
            try { await queryInterface.sequelize.query(sql); } catch (_) { }
        };

        await safeCreateIndex('CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)');
        await safeCreateIndex('CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category)');

        // ============================================================
        // 6. FIX REMAINING SYSTEM_SETTINGS SCHEMA
        // ============================================================
        console.log('\n📋 Step 6: Fixing system_settings schema...');

        // Add is_public column
        await safeAddColumn('system_settings', 'is_public', {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
        });

        // Fix value column to JSONB
        try {
            const [colInfo] = await queryInterface.sequelize.query(
                `SELECT data_type FROM information_schema.columns WHERE table_name='system_settings' AND column_name='value'`
            );
            if (colInfo.length > 0 && colInfo[0].data_type === 'text') {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "system_settings" ALTER COLUMN "value" TYPE JSONB USING CASE WHEN "value" IS NULL THEN NULL WHEN "value" = '' THEN 'null'::JSONB ELSE "value"::JSONB END`
                );
                console.log('  ✅ Fixed system_settings.value to JSONB');
            }
        } catch (err) { console.log('  ℹ️ system_settings.value:', err.message); }

        // Fix timestamp columns to use TIMESTAMP WITHOUT TIME ZONE (to match Sequelize model with underscored: true)
        const timestampFixes = [
            { table: 'system_settings', column: 'created_at' },
            { table: 'system_settings', column: 'updated_at' },
            { table: 'companies', column: 'verified_at' },
        ];
        for (const fix of timestampFixes) {
            try {
                const [colInfo] = await queryInterface.sequelize.query(
                    `SELECT data_type FROM information_schema.columns WHERE table_name='${fix.table}' AND column_name='${fix.column}'`
                );
                if (colInfo.length > 0 && colInfo[0].data_type === 'timestamp with time zone') {
                    await queryInterface.sequelize.query(
                        `ALTER TABLE "${fix.table}" ALTER COLUMN "${fix.column}" TYPE TIMESTAMP WITHOUT TIME ZONE`
                    );
                    console.log(`  ✅ Fixed ${fix.table}.${fix.column} to TIMESTAMP WITHOUT TIME ZONE`);
                }
            } catch (err) { console.log(`  ℹ️ ${fix.table}.${fix.column}:`, err.message); }
        }

        // Fix job_templates.last_used_at to TIMESTAMPTZ
        try {
            const [colInfo] = await queryInterface.sequelize.query(
                `SELECT data_type FROM information_schema.columns WHERE table_name='job_templates' AND column_name='last_used_at'`
            );
            if (colInfo.length > 0 && colInfo[0].data_type === 'timestamp without time zone') {
                await queryInterface.sequelize.query(
                    `ALTER TABLE "job_templates" ALTER COLUMN "last_used_at" TYPE TIMESTAMP WITH TIME ZONE`
                );
                console.log('  ✅ Fixed job_templates.last_used_at to TIMESTAMPTZ');
            }
        } catch (err) { console.log('  ℹ️ job_templates.last_used_at:', err.message); }

        console.log('\n🎉 Comprehensive schema fix migration completed!');
    },

    async down(queryInterface, Sequelize) {
        // We don't undo schema fixes since they're corrective
        console.log('⚠️ Down migration for schema fix is a no-op (corrective changes are not reversed)');
    }
};
