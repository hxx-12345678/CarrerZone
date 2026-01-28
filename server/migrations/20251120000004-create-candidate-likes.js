'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('candidate_likes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      employer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      candidate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes idempotently
    await queryInterface.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS "unique_employer_candidate_like" ON "candidate_likes" ("employer_id", "candidate_id")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "candidate_likes_candidate_id" ON "candidate_likes" ("candidate_id")');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('candidate_likes');
  }
};
