'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if employer_quotas table exists
    const tableExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employer_quotas'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!tableExists[0].exists) {
      console.log('⚠️ employer_quotas table does not exist, skipping quota type updates');
      return;
    }

    // Update old quota types to new ones
    const quotaTypeMappings = [
      { old: 'resume_search', new: 'resume_views' },
      { old: 'messages', new: 'requirements_posted' },
      { old: 'contact_views', new: 'profile_visits' }
    ];

    for (const mapping of quotaTypeMappings) {
      await queryInterface.sequelize.query(`
        UPDATE employer_quotas 
        SET "quotaType" = :newType 
        WHERE "quotaType" = :oldType
      `, {
        replacements: { oldType: mapping.old, newType: mapping.new },
        type: Sequelize.QueryTypes.UPDATE
      });
    }

    console.log('✅ Updated quota types in employer_quotas table');
  },

  async down (queryInterface, Sequelize) {
    // Revert new quota types back to old ones
    const quotaTypeMappings = [
      { old: 'resume_views', new: 'resume_search' },
      { old: 'requirements_posted', new: 'messages' },
      { old: 'profile_visits', new: 'contact_views' }
    ];

    for (const mapping of quotaTypeMappings) {
      await queryInterface.sequelize.query(`
        UPDATE employer_quotas 
        SET "quotaType" = :newType 
        WHERE "quotaType" = :oldType
      `, {
        replacements: { oldType: mapping.old, newType: mapping.new },
        type: Sequelize.QueryTypes.UPDATE
      });
    }

    console.log('✅ Reverted quota types in employer_quotas table');
  }
};
