'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    // Add visibilityType column (ENUM)
    if (!tableDescription.visibilityType) {
      await queryInterface.addColumn('jobs', 'visibilityType', {
        type: Sequelize.ENUM('public', 'private', 'referral-only', 'invite-only'),
        allowNull: true,
        defaultValue: 'public'
      });
      console.log('✅ Added visibilityType column');
    }
    
    // Add allowedViewers column (JSONB)
    if (!tableDescription.allowedViewers) {
      await queryInterface.addColumn('jobs', 'allowedViewers', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added allowedViewers column');
    }
    
    // Add referralCode column (STRING)
    if (!tableDescription.referralCode) {
      await queryInterface.addColumn('jobs', 'referralCode', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added referralCode column');
    }
    
    // Add scheduledPublishAt column (DATE)
    if (!tableDescription.scheduledPublishAt) {
      await queryInterface.addColumn('jobs', 'scheduledPublishAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added scheduledPublishAt column');
    }
    
    // Add scheduledExpiryAt column (DATE)
    if (!tableDescription.scheduledExpiryAt) {
      await queryInterface.addColumn('jobs', 'scheduledExpiryAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added scheduledExpiryAt column');
    }
    
    // Add autoRenew column (BOOLEAN)
    if (!tableDescription.autoRenew) {
      await queryInterface.addColumn('jobs', 'autoRenew', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added autoRenew column');
    }
    
    // Add renewalPeriod column (INTEGER)
    if (!tableDescription.renewalPeriod) {
      await queryInterface.addColumn('jobs', 'renewalPeriod', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Added renewalPeriod column');
    }
    
    // Add maxRenewals column (INTEGER)
    if (!tableDescription.maxRenewals) {
      await queryInterface.addColumn('jobs', 'maxRenewals', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Added maxRenewals column');
    }
    
    // Add currentRenewalCount column (INTEGER)
    if (!tableDescription.currentRenewalCount) {
      await queryInterface.addColumn('jobs', 'currentRenewalCount', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added currentRenewalCount column');
    }
    
    // Add templateId column (UUID)
    if (!tableDescription.templateId) {
      await queryInterface.addColumn('jobs', 'templateId', {
        type: Sequelize.UUID,
        allowNull: true
      });
      console.log('✅ Added templateId column');
    }
    
    // Add bulkImportId column (UUID)
    if (!tableDescription.bulkImportId) {
      await queryInterface.addColumn('jobs', 'bulkImportId', {
        type: Sequelize.UUID,
        allowNull: true
      });
      console.log('✅ Added bulkImportId column');
    }
    
    // Add searchImpressions column (INTEGER)
    if (!tableDescription.searchImpressions) {
      await queryInterface.addColumn('jobs', 'searchImpressions', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added searchImpressions column');
    }
    
    // Add searchClicks column (INTEGER)
    if (!tableDescription.searchClicks) {
      await queryInterface.addColumn('jobs', 'searchClicks', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added searchClicks column');
    }
    
    // Add applicationRate column (DECIMAL)
    if (!tableDescription.applicationRate) {
      await queryInterface.addColumn('jobs', 'applicationRate', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added applicationRate column');
    }
    
    // Add qualityScore column (DECIMAL)
    if (!tableDescription.qualityScore) {
      await queryInterface.addColumn('jobs', 'qualityScore', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added qualityScore column');
    }
    
    // Add seoScore column (DECIMAL)
    if (!tableDescription.seoScore) {
      await queryInterface.addColumn('jobs', 'seoScore', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added seoScore column');
    }
    
    // Add isATSEnabled column (BOOLEAN)
    if (!tableDescription.isATSEnabled) {
      await queryInterface.addColumn('jobs', 'isATSEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added isATSEnabled column');
    }
    
    // Add atsKeywords column (JSONB)
    if (!tableDescription.atsKeywords) {
      await queryInterface.addColumn('jobs', 'atsKeywords', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added atsKeywords column');
    }
    
    // Add targetAudience column (JSONB)
    if (!tableDescription.targetAudience) {
      await queryInterface.addColumn('jobs', 'targetAudience', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
      console.log('✅ Added targetAudience column');
    }
    
    // Add promotionSettings column (JSONB)
    if (!tableDescription.promotionSettings) {
      await queryInterface.addColumn('jobs', 'promotionSettings', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
      console.log('✅ Added promotionSettings column');
    }
    
    // Add bookmarkCount column (INTEGER)
    if (!tableDescription.bookmarkCount) {
      await queryInterface.addColumn('jobs', 'bookmarkCount', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added bookmarkCount column');
    }
    
    // Add duration column (STRING)
    if (!tableDescription.duration) {
      await queryInterface.addColumn('jobs', 'duration', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added duration column');
    }
    
    // Add startDate column (DATE)
    if (!tableDescription.startDate) {
      await queryInterface.addColumn('jobs', 'startDate', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added startDate column');
    }
    
    // Add workMode column (STRING)
    if (!tableDescription.workMode) {
      await queryInterface.addColumn('jobs', 'workMode', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added workMode column');
    }
    
    // Add learningObjectives column (TEXT)
    if (!tableDescription.learningObjectives) {
      await queryInterface.addColumn('jobs', 'learningObjectives', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added learningObjectives column');
    }
    
    // Add mentorship column (TEXT)
    if (!tableDescription.mentorship) {
      await queryInterface.addColumn('jobs', 'mentorship', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added mentorship column');
    }
    
    // Add region column (ENUM)
    if (!tableDescription.region) {
      await queryInterface.addColumn('jobs', 'region', {
        type: Sequelize.ENUM('india', 'gulf', 'other'),
        allowNull: true,
        defaultValue: 'india'
      });
      console.log('✅ Added region column');
    }
    
    console.log('✅ Migration completed - All final missing columns added');
  },

  async down(queryInterface, Sequelize) {
    // Drop all added columns in reverse order
    const tableDescription = await queryInterface.describeTable('jobs');
    
    const columnsToRemove = [
      'region',
      'mentorship',
      'learningObjectives',
      'workMode',
      'startDate',
      'duration',
      'bookmarkCount',
      'promotionSettings',
      'targetAudience',
      'atsKeywords',
      'isATSEnabled',
      'seoScore',
      'qualityScore',
      'applicationRate',
      'searchClicks',
      'searchImpressions',
      'bulkImportId',
      'templateId',
      'currentRenewalCount',
      'maxRenewals',
      'renewalPeriod',
      'autoRenew',
      'scheduledExpiryAt',
      'scheduledPublishAt',
      'referralCode',
      'allowedViewers',
      'visibilityType'
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

