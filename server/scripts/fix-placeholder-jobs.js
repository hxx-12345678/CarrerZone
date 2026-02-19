/**
 * Fix existing placeholder jobs that were created without metadata.isPlaceholder flag.
 * This is a one-time migration script.
 */
const { sequelize } = require('../config/sequelize');

async function fixPlaceholderJobs() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Find and update all existing placeholder jobs that don't have metadata.isPlaceholder
        const [results] = await sequelize.query(`
      UPDATE jobs 
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'), 
        '{isPlaceholder}', 
        'true'
      )
      WHERE title = 'Requirement Shortlist' 
        AND (
          metadata IS NULL 
          OR metadata->>'isPlaceholder' IS NULL 
          OR metadata->>'isPlaceholder' != 'true'
        )
      RETURNING id, title, metadata
    `);

        console.log(`✅ Fixed ${results.length} placeholder jobs:`);
        results.forEach(row => {
            console.log(`  - Job ID: ${row.id}, Title: ${row.title}`);
        });

        if (results.length === 0) {
            console.log('  No placeholder jobs needed fixing (already correct or none exist)');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing placeholder jobs:', error.message);
        process.exit(1);
    }
}

fixPlaceholderJobs();
