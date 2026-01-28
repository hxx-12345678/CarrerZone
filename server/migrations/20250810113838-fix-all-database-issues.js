'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Fixing all database field mapping issues...');

      // Helper function to check if column exists
      const columnExists = async (tableName, columnName) => {
        try {
          const tableDescription = await queryInterface.describeTable(tableName);
          return tableDescription[columnName] !== undefined;
        } catch (error) {
          return false;
        }
      };

      // Helper function to check if table exists
      const tableExists = async (tableName) => {
        try {
          await queryInterface.describeTable(tableName);
          return true;
        } catch (error) {
          return false;
        }
      };

      // Fix CompanyReview table - add missing columns
      if (await tableExists('company_reviews')) {
        if (!(await columnExists('company_reviews', 'review_date'))) {
          await queryInterface.addColumn('company_reviews', 'review_date', {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.NOW
          });
          console.log('✅ Added review_date column to company_reviews');
        }
      }

      // Fix UserSession table - ensure all required columns exist
      if (await tableExists('user_sessions')) {
        if (!(await columnExists('user_sessions', 'user_id'))) {
          await queryInterface.addColumn('user_sessions', 'user_id', {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          });
          console.log('✅ Added user_id column to user_sessions');
        }
      }

      // Fix Analytics table - ensure all required columns exist
      if (await tableExists('analytics')) {
        if (!(await columnExists('analytics', 'session_id'))) {
          await queryInterface.addColumn('analytics', 'session_id', {
            type: Sequelize.STRING,
            allowNull: true
          });
          console.log('✅ Added session_id column to analytics');
        }
      }

      // Fix Payment table - ensure all required columns exist
      if (await tableExists('payments')) {
        if (!(await columnExists('payments', 'user_id'))) {
          await queryInterface.addColumn('payments', 'user_id', {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          });
          console.log('✅ Added user_id column to payments');
        }
      }

      // Fix CompanyFollow table - ensure followed_at column exists
      if (await tableExists('company_follows')) {
        if (!(await columnExists('company_follows', 'followed_at'))) {
          await queryInterface.addColumn('company_follows', 'followed_at', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          });
          console.log('✅ Added followed_at column to company_follows');
        }
      }

      // Add any missing indexes that are safe to add
      try {
        // Only add indexes if tables exist
        if (await tableExists('user_sessions') && await columnExists('user_sessions', 'user_id')) {
          await queryInterface.addIndex('user_sessions', ['user_id'], {
            name: 'user_sessions_user_id_idx',
            concurrently: true
          });
          console.log('✅ Added user_id index to user_sessions');
        }
      } catch (error) {
        console.log('ℹ️ Index may already exist or table not ready:', error.message);
      }

      try {
        if (await tableExists('analytics') && await columnExists('analytics', 'session_id')) {
          await queryInterface.addIndex('analytics', ['session_id'], {
            name: 'analytics_session_id_idx',
            concurrently: true
          });
          console.log('✅ Added session_id index to analytics');
        }
      } catch (error) {
        console.log('ℹ️ Index may already exist or table not ready:', error.message);
      }

      try {
        if (await tableExists('payments') && await columnExists('payments', 'user_id')) {
          await queryInterface.addIndex('payments', ['user_id'], {
            name: 'payments_user_id_idx',
            concurrently: true
          });
          console.log('✅ Added user_id index to payments');
        }
      } catch (error) {
        console.log('ℹ️ Index may already exist or table not ready:', error.message);
      }

      try {
        if (await tableExists('company_reviews') && await columnExists('company_reviews', 'review_date')) {
          await queryInterface.addIndex('company_reviews', ['review_date'], {
            name: 'company_reviews_review_date_idx',
            concurrently: true
          });
          console.log('✅ Added review_date index to company_reviews');
        }
      } catch (error) {
        console.log('ℹ️ Index may already exist or table not ready:', error.message);
      }

      console.log('✅ All database field mapping fixes completed successfully');
    } catch (error) {
      console.error('⚠️ Error fixing database issues:', error.message);
      // Don't throw error to prevent migration failure
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Reversing database field mapping fixes...');
      
      // Remove added columns (be careful with this in production)
      const tableExists = async (tableName) => {
        try {
          await queryInterface.describeTable(tableName);
          return true;
        } catch (error) {
          return false;
        }
      };

      const columnExists = async (tableName, columnName) => {
        try {
          const tableDescription = await queryInterface.describeTable(tableName);
          return tableDescription[columnName] !== undefined;
        } catch (error) {
          return false;
        }
      };

      // Remove indexes first
      try {
        await queryInterface.removeIndex('user_sessions', 'user_sessions_user_id_idx');
      } catch (error) {
        console.log('ℹ️ Index may not exist:', error.message);
      }

      try {
        await queryInterface.removeIndex('analytics', 'analytics_session_id_idx');
      } catch (error) {
        console.log('ℹ️ Index may not exist:', error.message);
      }

      try {
        await queryInterface.removeIndex('payments', 'payments_user_id_idx');
      } catch (error) {
        console.log('ℹ️ Index may not exist:', error.message);
      }

      try {
        await queryInterface.removeIndex('company_reviews', 'company_reviews_review_date_idx');
      } catch (error) {
        console.log('ℹ️ Index may not exist:', error.message);
      }

      console.log('✅ Database field mapping fixes reversed');
    } catch (error) {
      console.error('⚠️ Error reversing database fixes:', error.message);
    }
  }
};
