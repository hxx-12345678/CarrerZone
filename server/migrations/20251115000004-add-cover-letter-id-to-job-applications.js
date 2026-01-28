'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('job_applications')) {
      console.log('ℹ️  Skipping migration (job_applications not created yet)');
      return;
    }

    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('job_applications');
    
    if (!tableDescription.coverLetterId) {
      await queryInterface.addColumn('job_applications', 'coverLetterId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cover_letters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    // Add index for better performance
    try {
      await queryInterface.addIndex('job_applications', ['coverLetterId'], { name: 'job_applications_cover_letter_id' });
    } catch (error) {
      console.log('Index job_applications_cover_letter_id might already exist, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('job_applications', ['coverLetterId']);
    await queryInterface.removeColumn('job_applications', 'coverLetterId');
  }
};
