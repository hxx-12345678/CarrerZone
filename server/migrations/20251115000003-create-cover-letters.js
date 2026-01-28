'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cover_letters', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      downloads: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    await safeAddIndex('cover_letters', ['userId'], { name: 'cover_letters_user_id' });
    await safeAddIndex('cover_letters', ['isDefault'], { name: 'cover_letters_is_default' });
    await safeAddIndex('cover_letters', ['isPublic'], { name: 'cover_letters_is_public' });
    await safeAddIndex('cover_letters', ['lastUpdated'], { name: 'cover_letters_last_updated' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cover_letters');
  }
};
