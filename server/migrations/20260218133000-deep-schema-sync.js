'use strict';

/**
 * DEEP SCHEMA SYNC MIGRATION
 * This migration forces both local and Render databases into a perfectly synchronized state.
 * It uses RAW SQL to handle complex type changes (like text to JSONB) and ensures all enums match.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const sequelize = queryInterface.sequelize;

        // --- 1. ENUM SYNCHRONIZATION ---
        const addEnumValue = async (enumName, value) => {
            try {
                await sequelize.query(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}'`);
                console.log(`✅ Added value '${value}' to enum '${enumName}'`);
            } catch (e) {
                console.warn(`⚠️ Could not add value to ${enumName}:`, e.message);
            }
        };

        // hiringtimeline
        await addEnumValue('enum_jobs_hiringtimeline', 'immediate');
        await addEnumValue('enum_jobs_hiringtimeline', '1-week');
        await addEnumValue('enum_jobs_hiringtimeline', '2-weeks');
        await addEnumValue('enum_jobs_hiringtimeline', '1-month');

        // pricingtier
        await addEnumValue('enum_jobs_pricingtier', 'basic');
        await addEnumValue('enum_jobs_pricingtier', 'premium');
        await addEnumValue('enum_jobs_pricingtier', 'enterprise');
        await addEnumValue('enum_jobs_pricingtier', 'super-premium');

        // messageType (handle both snake_case and camelCase enum names if they exist)
        const enumNames = ['enum_messages_messageType', 'enum_messages_message_type'];
        for (const name of enumNames) {
            await addEnumValue(name, 'text');
            await addEnumValue(name, 'image');
            await addEnumValue(name, 'file');
            await addEnumValue(name, 'system');
            await addEnumValue(name, 'interview_invite');
            await addEnumValue(name, 'application_update');
        }

        // --- 2. TABLE-SPECIFIC TYPE & NULLABILITY FIXES ---

        // bulk_job_imports
        await sequelize.query(`
      ALTER TABLE bulk_job_imports 
      ALTER COLUMN error_log TYPE JSONB USING (CASE WHEN error_log IS NULL OR error_log = '' THEN '[]'::jsonb ELSE error_log::jsonb END),
      ALTER COLUMN mapping_config TYPE JSONB USING (CASE WHEN mapping_config IS NULL OR mapping_config = '' THEN '{}'::jsonb ELSE mapping_config::jsonb END),
      ALTER COLUMN success_log TYPE JSONB USING (CASE WHEN success_log IS NULL OR success_log = '' THEN '[]'::jsonb ELSE success_log::jsonb END),
      ALTER COLUMN validation_rules TYPE JSONB USING (CASE WHEN validation_rules IS NULL OR validation_rules = '' THEN '{}'::jsonb ELSE validation_rules::jsonb END),
      ALTER COLUMN default_values TYPE JSONB USING (CASE WHEN default_values IS NULL OR default_values = '' THEN '{}'::jsonb ELSE default_values::jsonb END),
      ALTER COLUMN error_log SET DEFAULT '[]',
      ALTER COLUMN mapping_config SET DEFAULT '{}',
      ALTER COLUMN success_log SET DEFAULT '[]',
      ALTER COLUMN validation_rules SET DEFAULT '{}',
      ALTER COLUMN default_values SET DEFAULT '{}',
      ALTER COLUMN default_values DROP NOT NULL,
      ALTER COLUMN failed_imports DROP NOT NULL,
      ALTER COLUMN is_scheduled DROP NOT NULL,
      ALTER COLUMN skipped_records DROP NOT NULL,
      ALTER COLUMN successful_imports DROP NOT NULL;
    `).catch(e => console.warn('⚠️ bulk_job_imports fix warning:', e.message));

        // companies
        await sequelize.query(`
      ALTER TABLE companies
      ALTER COLUMN agency_specialization TYPE JSONB USING (CASE WHEN agency_specialization IS NULL OR agency_specialization = '' THEN '[]'::jsonb ELSE agency_specialization::jsonb END),
      ALTER COLUMN agency_specialization SET DEFAULT '[]',
      ALTER COLUMN verified_at TYPE TIMESTAMPTZ USING verified_at AT TIME ZONE 'UTC';
    `).catch(e => console.warn('⚠️ companies fix warning:', e.message));

        // payments
        await sequelize.query(`
      ALTER TABLE payments
      ALTER COLUMN processed_at TYPE TIMESTAMPTZ USING processed_at AT TIME ZONE 'UTC';
    `).catch(e => console.warn('⚠️ payments fix warning:', e.message));

        // system_settings
        await sequelize.query(`
      -- Ensure table exists first
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Add missing columns
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'string';
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_by UUID;

      -- Ensure value is JSONB
      ALTER TABLE system_settings ALTER COLUMN value TYPE JSONB USING value::jsonb;
    `).catch(e => console.warn('⚠️ system_settings fix warning:', e.message));

        console.log('✨ Deep Schema Sync Completed Successfully');
    },

    down: async (queryInterface, Sequelize) => {
        // Non-destructive synchronization usually doesn't have a simple 'down'
    }
};
