'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    // Hot Vacancy Premium Features - these use lowercase snake_case field names
    
    // Basic job fields
    if (!tableDescription.role) {
      await queryInterface.addColumn('jobs', 'role', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added role column');
    }
    
    if (!tableDescription.industrytype) {
      await queryInterface.addColumn('jobs', 'industrytype', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added industrytype column');
    }
    
    if (!tableDescription.rolecategory) {
      await queryInterface.addColumn('jobs', 'rolecategory', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added rolecategory column');
    }
    
    if (!tableDescription.employmenttype) {
      await queryInterface.addColumn('jobs', 'employmenttype', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added employmenttype column');
    }
    
    // Hot Vacancy flags
    if (!tableDescription.ishotvacancy) {
      await queryInterface.addColumn('jobs', 'ishotvacancy', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Added ishotvacancy column');
    }
    
    if (!tableDescription.urgenthiring) {
      await queryInterface.addColumn('jobs', 'urgenthiring', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Added urgenthiring column');
    }
    
    if (!tableDescription.multipleemailids) {
      await queryInterface.addColumn('jobs', 'multipleemailids', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added multipleemailids column');
    }
    
    if (!tableDescription.boostedsearch) {
      await queryInterface.addColumn('jobs', 'boostedsearch', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Added boostedsearch column');
    }
    
    if (!tableDescription.searchboostlevel) {
      await queryInterface.addColumn('jobs', 'searchboostlevel', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'standard'
      });
      console.log('✅ Added searchboostlevel column');
    }
    
    if (!tableDescription.cityspecificboost) {
      await queryInterface.addColumn('jobs', 'cityspecificboost', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added cityspecificboost column');
    }
    
    if (!tableDescription.videobanner) {
      await queryInterface.addColumn('jobs', 'videobanner', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added videobanner column');
    }
    
    if (!tableDescription.whyworkwithus) {
      await queryInterface.addColumn('jobs', 'whyworkwithus', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added whyworkwithus column');
    }
    
    if (!tableDescription.companyreviews) {
      await queryInterface.addColumn('jobs', 'companyreviews', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added companyreviews column');
    }
    
    if (!tableDescription.autorefresh) {
      await queryInterface.addColumn('jobs', 'autorefresh', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Added autorefresh column');
    }
    
    if (!tableDescription.refreshdiscount) {
      await queryInterface.addColumn('jobs', 'refreshdiscount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added refreshdiscount column');
    }
    
    if (!tableDescription.attachmentfiles) {
      await queryInterface.addColumn('jobs', 'attachmentfiles', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added attachmentfiles column');
    }
    
    if (!tableDescription.officeimages) {
      await queryInterface.addColumn('jobs', 'officeimages', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added officeimages column');
    }
    
    if (!tableDescription.companyprofile) {
      await queryInterface.addColumn('jobs', 'companyprofile', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added companyprofile column');
    }
    
    if (!tableDescription.proactivealerts) {
      await queryInterface.addColumn('jobs', 'proactivealerts', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Added proactivealerts column');
    }
    
    if (!tableDescription.alertradius) {
      await queryInterface.addColumn('jobs', 'alertradius', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 50
      });
      console.log('✅ Added alertradius column');
    }
    
    if (!tableDescription.alertfrequency) {
      await queryInterface.addColumn('jobs', 'alertfrequency', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'immediate'
      });
      console.log('✅ Added alertfrequency column');
    }
    
    if (!tableDescription.featuredkeywords) {
      await queryInterface.addColumn('jobs', 'featuredkeywords', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added featuredkeywords column');
    }
    
    if (!tableDescription.custombranding) {
      await queryInterface.addColumn('jobs', 'custombranding', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
      console.log('✅ Added custombranding column');
    }
    
    if (!tableDescription.superfeatured) {
      await queryInterface.addColumn('jobs', 'superfeatured', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Added superfeatured column');
    }
    
    if (!tableDescription.tierlevel) {
      await queryInterface.addColumn('jobs', 'tierlevel', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'basic'
      });
      console.log('✅ Added tierlevel column');
    }
    
    if (!tableDescription.externalapplyurl) {
      await queryInterface.addColumn('jobs', 'externalapplyurl', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added externalapplyurl column');
    }
    
    if (!tableDescription.hotvacancyprice) {
      await queryInterface.addColumn('jobs', 'hotvacancyprice', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
      console.log('✅ Added hotvacancyprice column');
    }
    
    if (!tableDescription.hotvacancycurrency) {
      await queryInterface.addColumn('jobs', 'hotvacancycurrency', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'INR'
      });
      console.log('✅ Added hotvacancycurrency column');
    }
    
    if (!tableDescription.hotvacancypaymentstatus) {
      await queryInterface.addColumn('jobs', 'hotvacancypaymentstatus', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'pending'
      });
      console.log('✅ Added hotvacancypaymentstatus column');
    }
    
    // Premium hot vacancy features
    if (!tableDescription.urgencylevel) {
      await queryInterface.addColumn('jobs', 'urgencylevel', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added urgencylevel column');
    }
    
    if (!tableDescription.hiringtimeline) {
      await queryInterface.addColumn('jobs', 'hiringtimeline', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added hiringtimeline column');
    }
    
    if (!tableDescription.maxapplications) {
      await queryInterface.addColumn('jobs', 'maxapplications', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Added maxapplications column');
    }
    
    if (!tableDescription.applicationdeadline) {
      await queryInterface.addColumn('jobs', 'applicationdeadline', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added applicationdeadline column');
    }
    
    if (!tableDescription.pricingtier) {
      await queryInterface.addColumn('jobs', 'pricingtier', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added pricingtier column');
    }
    
    if (!tableDescription.paymentid) {
      await queryInterface.addColumn('jobs', 'paymentid', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added paymentid column');
    }
    
    if (!tableDescription.paymentdate) {
      await queryInterface.addColumn('jobs', 'paymentdate', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added paymentdate column');
    }
    
    if (!tableDescription.prioritylisting) {
      await queryInterface.addColumn('jobs', 'prioritylisting', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added prioritylisting column');
    }
    
    if (!tableDescription.featuredbadge) {
      await queryInterface.addColumn('jobs', 'featuredbadge', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added featuredbadge column');
    }
    
    if (!tableDescription.unlimitedapplications) {
      await queryInterface.addColumn('jobs', 'unlimitedapplications', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added unlimitedapplications column');
    }
    
    if (!tableDescription.advancedanalytics) {
      await queryInterface.addColumn('jobs', 'advancedanalytics', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added advancedanalytics column');
    }
    
    if (!tableDescription.candidatematching) {
      await queryInterface.addColumn('jobs', 'candidatematching', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added candidatematching column');
    }
    
    if (!tableDescription.directcontact) {
      await queryInterface.addColumn('jobs', 'directcontact', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added directcontact column');
    }
    
    if (!tableDescription.seotitle) {
      await queryInterface.addColumn('jobs', 'seotitle', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added seotitle column');
    }
    
    if (!tableDescription.seodescription) {
      await queryInterface.addColumn('jobs', 'seodescription', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added seodescription column');
    }
    
    if (!tableDescription.keywords) {
      await queryInterface.addColumn('jobs', 'keywords', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added keywords column');
    }
    
    if (!tableDescription.impressions) {
      await queryInterface.addColumn('jobs', 'impressions', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added impressions column');
    }
    
    if (!tableDescription.clicks) {
      await queryInterface.addColumn('jobs', 'clicks', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added clicks column');
    }
    
    console.log('✅ Migration completed - All remaining job columns added');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    const columnsToRemove = [
      'clicks',
      'impressions',
      'keywords',
      'seodescription',
      'seotitle',
      'directcontact',
      'candidatematching',
      'advancedanalytics',
      'unlimitedapplications',
      'featuredbadge',
      'prioritylisting',
      'paymentdate',
      'paymentid',
      'pricingtier',
      'applicationdeadline',
      'maxapplications',
      'hiringtimeline',
      'urgencylevel',
      'hotvacancypaymentstatus',
      'hotvacancycurrency',
      'hotvacancyprice',
      'externalapplyurl',
      'tierlevel',
      'superfeatured',
      'custombranding',
      'featuredkeywords',
      'alertfrequency',
      'alertradius',
      'proactivealerts',
      'companyprofile',
      'officeimages',
      'attachmentfiles',
      'refreshdiscount',
      'autorefresh',
      'companyreviews',
      'whyworkwithus',
      'videobanner',
      'cityspecificboost',
      'searchboostlevel',
      'boostedsearch',
      'multipleemailids',
      'urgenthiring',
      'ishotvacancy',
      'employmenttype',
      'rolecategory',
      'industrytype',
      'role'
    ];
    
    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('jobs', column);
        console.log(`✅ Removed ${column} column`);
      }
    }
    
    console.log('✅ Rollback completed');
  }
};

