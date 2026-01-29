'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('messages');

        if (!tableInfo['receiver_id']) {
            await queryInterface.addColumn('messages', 'receiver_id', {
                type: Sequelize.UUID,
                allowNull: true, // Initially allow null to avoid issues with existing rows
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            });
            console.log('✅ Added receiver_id to messages table');
        }

        // Check for other potentially missing columns based on model definition
        if (!tableInfo['original_content']) {
            await queryInterface.addColumn('messages', 'original_content', {
                type: Sequelize.TEXT,
                allowNull: true
            });
            console.log('✅ Added original_content to messages table');
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('messages');

        if (tableInfo['receiver_id']) {
            await queryInterface.removeColumn('messages', 'receiver_id');
        }

        if (tableInfo['original_content']) {
            await queryInterface.removeColumn('messages', 'original_content');
        }
    }
};
