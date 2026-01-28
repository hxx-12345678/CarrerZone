/**
 * Initialize default system settings
 * Run this script to set up default settings if they don't exist
 */

const { sequelize } = require('../config/sequelize');
const SystemSetting = require('../models/SystemSetting');

async function initializeSystemSettings() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Default settings
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

    console.log('📝 Initializing system settings...');

    for (const setting of defaultSettings) {
      const [created, wasCreated] = await SystemSetting.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });

      if (wasCreated) {
        console.log(`✅ Created setting: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`ℹ️  Setting already exists: ${setting.key} = ${created.value}`);
      }
    }

    console.log('✅ System settings initialized successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
    process.exit(1);
  }
}

initializeSystemSettings();



