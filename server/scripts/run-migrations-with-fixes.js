#!/usr/bin/env node
'use strict';

/**
 * Run migrations repeatedly, fixing dependency issues automatically
 * Run with: node scripts/run-migrations-with-fixes.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runMigrations() {
  console.log('🚀 Running migrations...\n');
  
  let iteration = 1;
  const maxIterations = 10;
  
  while (iteration <= maxIterations) {
    console.log(`\n📊 Iteration ${iteration}/${maxIterations}`);
    console.log('═'.repeat(60));
    
    try {
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
        cwd: __dirname + '/..',
        maxBuffer: 1024 * 1024 * 10
      });
      
      // Success! All migrations completed
      console.log(stdout);
      console.log('\n✅ All migrations completed successfully!');
      
      // Show final table count
      try {
        const { Sequelize } = require('sequelize');
        const config = require('../config/database');
        const env = process.env.NODE_ENV || 'development';
        const dbConfig = config[env];
        
        const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
          host: dbConfig.host,
          port: dbConfig.port,
          dialect: dbConfig.dialect,
          logging: false
        });
        
        const [tables] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);
        
        console.log(`\n📊 Total tables created: ${tables.length}`);
        console.log('Tables:', tables.map(t => t.table_name).join(', '));
        
        await sequelize.close();
      } catch (e) {
        // Ignore table count errors
      }
      
      return true;
      
    } catch (error) {
      const output = error.stdout || '';
      const errorOutput = error.stderr || '';
      
      // Check if we made progress
      const migratedMatch = output.match(/==\s+(\d+\-[^:]+):\s+migrated/g);
      const migratedCount = migratedMatch ? migratedMatch.length : 0;
      
      if (migratedCount > 0) {
        console.log(`✅ ${migratedCount} migration(s) completed in this iteration`);
        iteration++;
        continue; // Try again
      } else {
        // No progress - show error
        console.error('\n❌ Migration error (no progress):');
        console.error(errorOutput || output);
        return false;
      }
    }
  }
  
  console.log('\n⚠️  Reached maximum iterations. Some migrations may still be pending.');
  return false;
}

runMigrations()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

