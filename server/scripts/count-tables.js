#!/usr/bin/env node
/**
 * Count and list all tables in the local database
 */

const { sequelize } = require('../config/sequelize');

async function countTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📊 Total Tables:', tables.length);
    console.log('\n📋 Table List:\n');
    
    tables.forEach((t, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${t.table_name}`);
    });

    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

countTables();

