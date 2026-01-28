'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add requirement_id column to candidate_likes table
    const tableDescription = await queryInterface.describeTable('candidate_likes');
    
    // Check if column already exists
    if (!tableDescription.requirement_id) {
      await queryInterface.addColumn('candidate_likes', 'requirement_id', {
        type: Sequelize.UUID,
        allowNull: true, // Allow NULL for backward compatibility with global likes
        references: {
          model: 'requirements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }

    // Drop old unique index if it exists
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "unique_employer_candidate_like"
    `).catch(() => {}); // Ignore if doesn't exist

    // Create new compound index that accounts for requirement_id
    // This allows same candidate to be saved for different requirements
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_employer_candidate_requirement_like" 
      ON "candidate_likes" ("employer_id", "candidate_id", "requirement_id")
      WHERE "requirement_id" IS NOT NULL
    `);

    // Create index for global likes (where requirement_id is NULL)
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_employer_candidate_global_like" 
      ON "candidate_likes" ("employer_id", "candidate_id")
      WHERE "requirement_id" IS NULL
    `);

    // Keep existing indexes for lookups
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "candidate_likes_candidate_id" ON "candidate_likes" ("candidate_id")
    `).catch(() => {});
    
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "candidate_likes_requirement_id" ON "candidate_likes" ("requirement_id")
    `).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the new indexes
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "unique_employer_candidate_requirement_like"
    `).catch(() => {});

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "unique_employer_candidate_global_like"
    `).catch(() => {});

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "candidate_likes_requirement_id"
    `).catch(() => {});

    // Remove the column
    await queryInterface.removeColumn('candidate_likes', 'requirement_id');

    // Recreate original index
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_employer_candidate_like" ON "candidate_likes" ("employer_id", "candidate_id")
    `);
  }
};
