#!/usr/bin/env node

// Simple script to synchronize Sequelize models to the local database
// Run with: node scripts/sync-db.js

try {
  require('dotenv').config();
} catch (err) {}

const { sequelize } = require('../config/sequelize');
const db = require('../config');

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection OK');

    console.log('🔄 Synchronizing models (no force)...');
    await db.syncDatabase(false);
    console.log('✅ Sync complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err?.message || err);
    process.exit(1);
  }
}

main();


