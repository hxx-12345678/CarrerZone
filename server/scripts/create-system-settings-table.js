/**
 * Create system_settings table manually
 */

const { sequelize } = require('../config/sequelize');

async function createSystemSettingsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create table with proper schema
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'string',
        description TEXT,
        category VARCHAR(100),
        updated_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ system_settings table created');

    // Create default settings
    const defaultSettings = [
      {
        key: 'job_expiry_days_after_deadline',
        value: '30',
        type: 'number',
        description: 'Number of days after application deadline when job expires and stops being visible in public listings',
        category: 'job_management'
      },
      {
        key: 'job_default_expiry_days',
        value: '30',
        type: 'number',
        description: 'Default number of days for job expiry when no application deadline is set (counted from published date)',
        category: 'job_management'
      }
    ];

    for (const setting of defaultSettings) {
      await sequelize.query(`
        INSERT INTO system_settings (key, value, type, description, category)
        VALUES (:key, :value, :type, :description, :category)
        ON CONFLICT (key) DO NOTHING
      `, {
        replacements: setting
      });
      console.log(`✅ Setting initialized: ${setting.key} = ${setting.value}`);
    }

    console.log('✅ System settings initialized successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSystemSettingsTable();



