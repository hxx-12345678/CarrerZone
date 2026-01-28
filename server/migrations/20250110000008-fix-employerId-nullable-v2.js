'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: ensure jobs table exists before altering
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    if (!normalized.includes('jobs')) {
      console.log('ℹ️  Skipping employerId nullable fix (jobs table not created yet)');
      return;
    }

    console.log('🔧 Making employerId nullable in jobs table (v2)...');
    
    try {
      // Use raw SQL to alter the column
      await queryInterface.sequelize.query(`
        ALTER TABLE jobs 
        ALTER COLUMN "employerId" DROP NOT NULL;
      `);
      
      console.log('✅ employerId is now nullable');
      
    } catch (error) {
      console.error('❌ Error making employerId nullable:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Reverting employerId to NOT NULL...');
    
    await queryInterface.sequelize.query(`
      ALTER TABLE jobs 
      ALTER COLUMN "employerId" SET NOT NULL;
    `);
  }
};


