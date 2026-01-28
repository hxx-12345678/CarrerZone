'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('employer_quotas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quotaType: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      used: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      resetAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
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

    await queryInterface.addIndex('employer_quotas', ['userId']);
    await queryInterface.addIndex('employer_quotas', ['quotaType']);
    await queryInterface.addConstraint('employer_quotas', {
      fields: ['userId', 'quotaType'],
      type: 'unique',
      name: 'unique_user_quotaType'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('employer_quotas');
  }
};


