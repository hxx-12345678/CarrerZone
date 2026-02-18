'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    
      try {
        const tables = await queryInterface.showAllTables();
        const normalized = Array.isArray(tables) ? tables.map(t => typeof t === 'string' ? t : t.tableName || t).map(n => String(n).toLowerCase()) : [];
        if (!normalized.includes('support_messages')) {
          await queryInterface.createTable('support_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('general', 'technical', 'sales', 'billing', 'feature', 'bug'),
        allowNull: false,
        defaultValue: 'general'
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'new'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      responded_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
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
          console.log('✅ Created table support_messages');
        } else {
          console.log('ℹ️ Table support_messages already exists, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Table support_messages already exists, skipping...');
        } else {
            console.warn('⚠️ Could not check/create table support_messages:', err.message);
        }
      }


    // Add indexes
    
      try {
        await queryInterface.addIndex('support_messages', ['email']);
        console.log('✅ Added index support_messages_email_idx to support_messages');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️ Index on support_messages already exists, skipping...');
        } else {
          console.warn('⚠️ Could not add index on support_messages:', err.message);
        }
      }

    
      try {
        await queryInterface.addIndex('support_messages', ['status']);
        console.log('✅ Added index support_messages_status_idx to support_messages');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️ Index on support_messages already exists, skipping...');
        } else {
          console.warn('⚠️ Could not add index on support_messages:', err.message);
        }
      }

    
      try {
        await queryInterface.addIndex('support_messages', ['category']);
        console.log('✅ Added index support_messages_category_idx to support_messages');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️ Index on support_messages already exists, skipping...');
        } else {
          console.warn('⚠️ Could not add index on support_messages:', err.message);
        }
      }

    
      try {
        await queryInterface.addIndex('support_messages', ['priority']);
        console.log('✅ Added index support_messages_priority_idx to support_messages');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️ Index on support_messages already exists, skipping...');
        } else {
          console.warn('⚠️ Could not add index on support_messages:', err.message);
        }
      }

    
      try {
        await queryInterface.addIndex('support_messages', ['created_at']);
        console.log('✅ Added index support_messages_created_at_idx to support_messages');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️ Index on support_messages already exists, skipping...');
        } else {
          console.warn('⚠️ Could not add index on support_messages:', err.message);
        }
      }

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('support_messages');
  }
};
