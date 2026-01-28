'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_dashboard', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Application statistics
      totalApplications: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      applicationsUnderReview: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      applicationsShortlisted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      applicationsRejected: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      applicationsAccepted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastApplicationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Bookmark statistics
      totalBookmarks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastBookmarkDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Search statistics
      totalSearches: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      savedSearches: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastSearchDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Resume statistics
      totalResumes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      hasDefaultResume: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastResumeUpdate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Job alert statistics
      totalJobAlerts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      activeJobAlerts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // Profile statistics
      profileViews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastProfileView: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Activity tracking
      lastLoginDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastActivityDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      totalLoginCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // Dashboard preferences
      dashboardLayout: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      favoriteActions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      
      // Analytics metadata
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

    // Add indexes
    const safeAddIndex = async (table, cols, options) => {
      try {
        await queryInterface.addIndex(table, cols, options);
      } catch (error) {
        if ((error && String(error.message || '').includes('already exists')) || (error && String(error).includes('already exists'))) {
          console.log(`ℹ️  Index ${options && options.name ? options.name : cols} already exists, skipping`);
        } else {
          throw error;
        }
      }
    };

    await safeAddIndex('user_dashboard', ['userId'], { name: 'user_dashboard_user_id' });
    await safeAddIndex('user_dashboard', ['lastActivityDate'], { name: 'user_dashboard_last_activity' });
    await safeAddIndex('user_dashboard', ['totalApplications'], { name: 'user_dashboard_total_applications' });
    await safeAddIndex('user_dashboard', ['totalBookmarks'], { name: 'user_dashboard_total_bookmarks' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_dashboard');
  }
};
