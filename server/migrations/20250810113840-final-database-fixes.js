'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Applying final database fixes...');

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

      // Helper function to check if index exists
      const indexExists = async (tableName, indexName) => {
        try {
          const indexes = await queryInterface.showIndex(tableName);
          return indexes.some(idx => idx.name === indexName);
        } catch (error) {
          return false;
        }
      };

      // 1. Fix CompanyReview table - add review_date if missing
      if (await tableExists('company_reviews')) {
        if (!(await columnExists('company_reviews', 'review_date'))) {
          await queryInterface.addColumn('company_reviews', 'review_date', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          });
          console.log('✅ Added review_date column to company_reviews');
        }
      }

      // 2. Fix UserSession table - add user_id if missing
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

      // 3. Fix Analytics table - add session_id if missing
      if (await tableExists('analytics')) {
        if (!(await columnExists('analytics', 'session_id'))) {
          await queryInterface.addColumn('analytics', 'session_id', {
            type: Sequelize.STRING,
            allowNull: true
          });
          console.log('✅ Added session_id column to analytics');
        }
      }

      // 4. Fix Payment table - add user_id if missing
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

      // 5. Create conversations table if not exists
      if (!(await tableExists('conversations'))) {
        await queryInterface.createTable('conversations', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          participant1_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          participant2_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          job_application_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'job_applications',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          job_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'jobs',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          conversation_type: {
            type: Sequelize.ENUM('general', 'job_application', 'interview', 'support'),
            allowNull: false,
            defaultValue: 'general'
          },
          title: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          last_message_id: {
            type: Sequelize.UUID,
            allowNull: true
          },
          last_message_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          unread_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          is_archived: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          archived_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          archived_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          metadata: {
            type: Sequelize.JSONB,
            defaultValue: {}
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
        console.log('✅ Created conversations table');
      }

      // 6. Create messages table if not exists
      if (!(await tableExists('messages'))) {
        await queryInterface.createTable('messages', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          conversation_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'conversations',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          sender_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          receiver_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          message_type: {
            type: Sequelize.ENUM('text', 'image', 'file', 'system', 'notification'),
            allowNull: false,
            defaultValue: 'text'
          },
          content: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          attachments: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          read_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          is_delivered: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          delivered_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          is_edited: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          edited_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          reply_to_message_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'messages',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          metadata: {
            type: Sequelize.JSONB,
            defaultValue: {}
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
        console.log('✅ Created messages table');
      }

      // 7. Add foreign key constraint for last_message_id in conversations
      if (await tableExists('conversations') && await tableExists('messages')) {
        try {
          await queryInterface.addConstraint('conversations', {
            fields: ['last_message_id'],
            type: 'foreign key',
            name: 'conversations_last_message_fkey',
            references: {
              table: 'messages',
              field: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          });
          console.log('✅ Added foreign key constraint for last_message_id');
        } catch (error) {
          console.log('ℹ️ Foreign key constraint may already exist:', error.message);
        }
      }

      // 8. Add indexes safely
      const indexesToAdd = [
        { table: 'user_sessions', column: 'user_id', name: 'user_sessions_user_id_idx' },
        { table: 'analytics', column: 'session_id', name: 'analytics_session_id_idx' },
        { table: 'payments', column: 'user_id', name: 'payments_user_id_idx' },
        { table: 'company_reviews', column: 'review_date', name: 'company_reviews_review_date_idx' },
        { table: 'conversations', column: 'participant1_id', name: 'conversations_participant1_id_idx' },
        { table: 'conversations', column: 'participant2_id', name: 'conversations_participant2_id_idx' },
        { table: 'messages', column: 'conversation_id', name: 'messages_conversation_id_idx' },
        { table: 'messages', column: 'sender_id', name: 'messages_sender_id_idx' }
      ];

      for (const { table, column, name } of indexesToAdd) {
        try {
          if (await tableExists(table) && await columnExists(table, column)) {
            if (!(await indexExists(table, name))) {
              await queryInterface.addIndex(table, [column], { name });
              console.log(`✅ Added index ${name} to ${table}.${column}`);
            }
          }
        } catch (error) {
          console.log(`ℹ️ Could not add index ${name}:`, error.message);
        }
      }

      console.log('✅ Final database fixes completed successfully');
    } catch (error) {
      console.error('⚠️ Error applying final database fixes:', error.message);
      // Don't throw error to prevent migration failure
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Reversing final database fixes...');
      
      // Drop tables in reverse order
      await queryInterface.dropTable('messages');
      await queryInterface.dropTable('conversations');
      
      // Drop enums
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_conversations_conversation_type";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_messages_message_type";');
      
      console.log('✅ Final database fixes reversed');
    } catch (error) {
      console.error('⚠️ Error reversing final database fixes:', error.message);
    }
  }
};
