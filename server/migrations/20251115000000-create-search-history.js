'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('search_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      searchQuery: {
        type: Sequelize.STRING,
        allowNull: false
      },
      filters: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      resultsCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      searchType: {
        type: Sequelize.ENUM('job_search', 'company_search', 'advanced_search'),
        allowNull: false,
        defaultValue: 'job_search'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      experienceLevel: {
        type: Sequelize.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive'),
        allowNull: true
      },
      salaryMin: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      salaryMax: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      remoteWork: {
        type: Sequelize.ENUM('on_site', 'hybrid', 'remote', 'any'),
        allowNull: true
      },
      jobCategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isSaved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes (idempotent)
    // Use explicit names and IF NOT EXISTS to avoid rerun errors
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "search_history_user_id" ON "search_history" ("userId");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "search_history_search_query" ON "search_history" ("searchQuery");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "search_history_created_at" ON "search_history" ("createdAt");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "search_history_search_type" ON "search_history" ("searchType");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "search_history_location" ON "search_history" ("location");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('search_history');
  }
};
