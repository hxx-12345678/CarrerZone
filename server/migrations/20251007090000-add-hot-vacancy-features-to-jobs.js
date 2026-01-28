'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('jobs')) {
      console.log('ℹ️  Skipping migration (jobs not created yet)');
      return;
    }


    console.log('🔥 Adding hot vacancy features to jobs table...');
    
    // Add hot vacancy fields to jobs table
    const hotVacancyFields = [
      { name: 'ishotvacancy', type: Sequelize.BOOLEAN, defaultValue: false },
      { name: 'urgenthiring', type: Sequelize.BOOLEAN, defaultValue: false },
      { name: 'multipleemailids', type: Sequelize.JSONB, defaultValue: [] },
      { name: 'boostedsearch', type: Sequelize.BOOLEAN, defaultValue: false },
      { name: 'searchboostlevel', type: Sequelize.ENUM('standard', 'premium', 'super', 'city-specific'), defaultValue: 'standard' },
      { name: 'cityspecificboost', type: Sequelize.JSONB, defaultValue: [] },
      { name: 'videobanner', type: Sequelize.STRING },
      { name: 'whyworkwithus', type: Sequelize.TEXT },
      { name: 'companyreviews', type: Sequelize.JSONB, defaultValue: [] },
      { name: 'autorefresh', type: Sequelize.BOOLEAN, defaultValue: false },
      { name: 'refreshdiscount', type: Sequelize.DECIMAL, defaultValue: 0 },
      { name: 'attachmentfiles', type: Sequelize.JSONB, defaultValue: [] },
      { name: 'officeimages', type: Sequelize.JSONB, defaultValue: [] },
      { name: 'companyprofile', type: Sequelize.TEXT },
      { name: 'proactivealerts', type: Sequelize.BOOLEAN, defaultValue: false },
      { name: 'alertradius', type: Sequelize.INTEGER, defaultValue: 50 },
      { name: 'alertfrequency', type: Sequelize.ENUM('immediate', 'daily', 'weekly'), defaultValue: 'immediate' },
      { name: 'featuredkeywords', type: Sequelize.JSONB, defaultValue: [] },
      { name: 'custombranding', type: Sequelize.JSONB, defaultValue: {} },
      { name: 'superfeatured', type: Sequelize.BOOLEAN, defaultValue: false },
      { name: 'tierlevel', type: Sequelize.ENUM('basic', 'premium', 'enterprise', 'super-premium'), defaultValue: 'basic' },
      { name: 'externalapplyurl', type: Sequelize.STRING },
      { name: 'hotvacancyprice', type: Sequelize.DECIMAL },
      { name: 'hotvacancycurrency', type: Sequelize.STRING, defaultValue: 'INR' },
      { name: 'hotvacancypaymentstatus', type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' }
    ];
    
    for (const field of hotVacancyFields) {
      try {
        await queryInterface.addColumn('jobs', field.name, {
          type: field.type,
          allowNull: true,
          defaultValue: field.defaultValue
        });
        console.log(`✅ Added ${field.name} column`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Column ${field.name} already exists`);
        } else {
          console.error(`❌ Failed to add column ${field.name}:`, error.message);
        }
      }
    }
    
    console.log('🎉 All hot vacancy features added to jobs table successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔧 Removing hot vacancy features from jobs table...');
    
    const columnsToRemove = [
      'ishotvacancy',
      'urgenthiring',
      'multipleemailids',
      'boostedsearch',
      'searchboostlevel',
      'cityspecificboost',
      'videobanner',
      'whyworkwithus',
      'companyreviews',
      'autorefresh',
      'refreshdiscount',
      'attachmentfiles',
      'officeimages',
      'companyprofile',
      'proactivealerts',
      'alertradius',
      'alertfrequency',
      'featuredkeywords',
      'custombranding',
      'superfeatured',
      'tierlevel',
      'externalapplyurl',
      'hotvacancyprice',
      'hotvacancycurrency',
      'hotvacancypaymentstatus'
    ];
    
    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('jobs', column);
        console.log(`✅ Removed ${column} column`);
      } catch (error) {
        console.error(`❌ Failed to remove column ${column}:`, error.message);
      }
    }
    
    console.log('✅ All hot vacancy features removed from jobs table successfully!');
  }
};


