'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Creating conversations and messages tables...');

      // helper to add index only if it doesn't already exist
      const addIndexIfMissing = async (table, columns, options = {}) => {
        const idxName = options.name || `${table}_${(Array.isArray(columns)?columns:[columns]).map(c=>c).join('_')}`;
        const [rows] = await queryInterface.sequelize.query(`SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname = :idx`, { replacements: { idx: idxName } });
        if (!Array.isArray(rows) || rows.length === 0) {
          await queryInterface.addIndex(table, columns, options);
          console.log(`✅ Created index ${idxName}`);
        } else {
          console.log(`ℹ️ Index ${idxName} already exists, skipping`);
        }
      };

      // helper to pick existing column name between snake_case and camelCase
      const pickExistingColumn = async (table, snake, camel) => {
        const [cols] = await queryInterface.sequelize.query(`
          SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=:t
        `, { replacements: { t: table } });
        const names = Array.isArray(cols) ? cols.map(r => String(r.column_name)) : [];
        if (names.includes(snake)) return snake;
        if (names.includes(camel)) return camel;
        return snake; // default
      };

      // Create conversations table first (referenced by messages)
      await queryInterface.createTable('conversations', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        participant1Id: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'participant1_id',
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        participant2Id: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'participant2_id',
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        jobApplicationId: {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'job_application_id',
          references: {
            model: 'job_applications',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        jobId: {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'job_id',
          references: {
            model: 'jobs',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        conversationType: {
          type: Sequelize.ENUM('general', 'job_application', 'interview', 'support'),
          allowNull: false,
          defaultValue: 'general',
          field: 'conversation_type'
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        lastMessageId: {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'last_message_id'
          // Note: Foreign key will be added after messages table is created
        },
        lastMessageAt: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'last_message_at'
        },
        unreadCount: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          field: 'unread_count'
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          field: 'is_active'
        },
        isArchived: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          field: 'is_archived'
        },
        archivedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'archived_by',
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        archivedAt: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'archived_at'
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

      console.log('✅ Conversations table created');

      // Create messages table
      await queryInterface.createTable('messages', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        conversationId: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'conversation_id',
          references: {
            model: 'conversations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        senderId: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'sender_id',
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        receiverId: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'receiver_id',
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        messageType: {
          type: Sequelize.ENUM('text', 'image', 'file', 'system', 'notification'),
          allowNull: false,
          defaultValue: 'text',
          field: 'message_type'
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        attachments: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        isRead: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          field: 'is_read'
        },
        readAt: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'read_at'
        },
        isDelivered: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          field: 'is_delivered'
        },
        deliveredAt: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'delivered_at'
        },
        isEdited: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          field: 'is_edited'
        },
        editedAt: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'edited_at'
        },
        replyToMessageId: {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'reply_to_message_id',
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

      console.log('✅ Messages table created');

      // Now add the foreign key constraint for lastMessageId in conversations (idempotent)
      const [constraintRows] = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_constraint WHERE conname = 'conversations_last_message_fkey'
      `);
      if (!Array.isArray(constraintRows) || constraintRows.length === 0) {
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
      } else {
        console.log('ℹ️ Foreign key conversations_last_message_fkey already exists, skipping');
      }

      // Create indexes
      await addIndexIfMissing('conversations', ['participant1_id'], { name: 'conversations_participant1_id' });
      await addIndexIfMissing('conversations', ['participant2_id'], { name: 'conversations_participant2_id' });
      const tryAddIndexWithCandidates = async (table, candidates, name) => {
        // Skip if index already exists
        const [existsRows] = await queryInterface.sequelize.query(`SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname = :idx`, { replacements: { idx: name } });
        if (Array.isArray(existsRows) && existsRows.length > 0) {
          console.log(`ℹ️ Index ${name} already exists, skipping`);
          return;
        }
        // Try each candidate column set in order
        for (const cols of candidates) {
          try {
            await queryInterface.addIndex(table, cols, { name });
            console.log(`✅ Created index ${name} on columns ${cols.join(',')}`);
            return;
          } catch (e) {
            console.log(`ℹ️ Failed to create index ${name} on ${cols.join(',')}: ${e.message}`);
          }
        }
        console.log(`⚠️ Skipping index ${name} - no matching column variant found`);
      };

      await tryAddIndexWithCandidates('conversations', [['job_application_id'], ['jobApplicationId']], 'conversations_job_application_id');
      await tryAddIndexWithCandidates('conversations', [['job_id'], ['jobId']], 'conversations_job_id');
      await tryAddIndexWithCandidates('conversations', [['last_message_at'], ['lastMessageAt']], 'conversations_last_message_at');
      await tryAddIndexWithCandidates('conversations', [['is_active'], ['isActive']], 'conversations_is_active');

      await tryAddIndexWithCandidates('messages', [['conversation_id'], ['conversationId']], 'messages_conversation_id');
      await tryAddIndexWithCandidates('messages', [['sender_id'], ['senderId']], 'messages_sender_id');
      await tryAddIndexWithCandidates('messages', [['receiver_id'], ['receiverId']], 'messages_receiver_id');
      await tryAddIndexWithCandidates('messages', [['is_read'], ['isRead']], 'messages_is_read');
      await tryAddIndexWithCandidates('messages', [['created_at'], ['createdAt']], 'messages_created_at');
      await tryAddIndexWithCandidates('messages', [['reply_to_message_id'], ['replyToMessageId']], 'messages_reply_to_message_id');

      console.log('✅ Conversations and messages tables created successfully');
    } catch (error) {
      console.error('⚠️ Error creating conversations and messages tables:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Drop tables in reverse order
      await queryInterface.dropTable('messages');
      await queryInterface.dropTable('conversations');
      
      // Drop enums
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_conversations_conversationType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_messages_messageType";');
      
      console.log('✅ Conversations and messages tables dropped');
    } catch (error) {
      console.error('⚠️ Error dropping conversations and messages tables:', error.message);
      throw error;
    }
  }
};
