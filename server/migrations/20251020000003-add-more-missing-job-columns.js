'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    // Add isUrgent column (BOOLEAN)
    if (!tableDescription.isUrgent) {
      await queryInterface.addColumn('jobs', 'isUrgent', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added isUrgent column');
    }
    
    // Add isFeatured column (BOOLEAN)
    if (!tableDescription.isFeatured) {
      await queryInterface.addColumn('jobs', 'isFeatured', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added isFeatured column');
    }
    
    // Add isPremium column (BOOLEAN)
    if (!tableDescription.isPremium) {
      await queryInterface.addColumn('jobs', 'isPremium', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added isPremium column');
    }
    
    // Add views column (INTEGER)
    if (!tableDescription.views) {
      await queryInterface.addColumn('jobs', 'views', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added views column');
    }
    
    // Add applications column (INTEGER)
    if (!tableDescription.applications) {
      await queryInterface.addColumn('jobs', 'applications', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added applications column');
    }
    
    // Add validTill column (DATE) - note: field name is valid_till in DB
    if (!tableDescription.valid_till && !tableDescription.validTill) {
      await queryInterface.addColumn('jobs', 'valid_till', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added valid_till column');
    }
    
    // Add publishedAt column (DATE)
    if (!tableDescription.publishedAt) {
      await queryInterface.addColumn('jobs', 'publishedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added publishedAt column');
    }
    
    // Add closedAt column (DATE)
    if (!tableDescription.closedAt) {
      await queryInterface.addColumn('jobs', 'closedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added closedAt column');
    }
    
    // Add tags column (JSONB)
    if (!tableDescription.tags) {
      await queryInterface.addColumn('jobs', 'tags', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
      console.log('✅ Added tags column');
    }
    
    // Add metadata column (JSONB)
    if (!tableDescription.metadata) {
      await queryInterface.addColumn('jobs', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
      console.log('✅ Added metadata column');
    }
    
    // Add isPrivate column (BOOLEAN)
    if (!tableDescription.isPrivate) {
      await queryInterface.addColumn('jobs', 'isPrivate', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added isPrivate column');
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
    
    console.log('✅ Successfully added all missing job columns (batch 3)');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('jobs');
    
    // Remove columns in reverse order
    const columnsToRemove = [
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
      'isPrivate',
      'metadata',
      'tags',
      'closedAt',
      'publishedAt',
      'valid_till',
      'applications',
      'views',
      'isPremium',
      'isFeatured',
      'isUrgent'
    ];
    
    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('jobs', column);
        console.log(`✅ Removed ${column} column`);
      }
    }
    
    console.log('✅ Successfully removed all added job columns (batch 3)');
  }
};

