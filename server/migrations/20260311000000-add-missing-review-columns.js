'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Adding missing columns to company_reviews table...');

      // Helper function to check if column exists
      const columnExists = async (tableName, columnName) => {
        try {
          const tableDescription = await queryInterface.describeTable(tableName);
          return tableDescription[columnName] !== undefined;
        } catch (error) {
          return false;
        }
      };

      const table = 'company_reviews';

      // 1. Add work_location
      if (!(await columnExists(table, 'work_location'))) {
        await queryInterface.addColumn(table, 'work_location', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
        console.log('  ✅ Added work_location');
      }

      // 2. Add helpful_count
      if (!(await columnExists(table, 'helpful_count'))) {
        await queryInterface.addColumn(table, 'helpful_count', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        });
        console.log('  ✅ Added helpful_count');
      }

      // 3. Add not_helpful_count
      if (!(await columnExists(table, 'not_helpful_count'))) {
        await queryInterface.addColumn(table, 'not_helpful_count', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        });
        console.log('  ✅ Added not_helpful_count');
      }

      // 4. Add moderation_notes
      if (!(await columnExists(table, 'moderation_notes'))) {
        await queryInterface.addColumn(table, 'moderation_notes', {
          type: Sequelize.TEXT,
          allowNull: true
        });
        console.log('  ✅ Added moderation_notes');
      }

      // 5. Add company_response
      if (!(await columnExists(table, 'company_response'))) {
        await queryInterface.addColumn(table, 'company_response', {
          type: Sequelize.TEXT,
          allowNull: true
        });
        console.log('  ✅ Added company_response');
      }

      // 6. Add company_response_date
      if (!(await columnExists(table, 'company_response_date'))) {
        await queryInterface.addColumn(table, 'company_response_date', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('  ✅ Added company_response_date');
      }

      // 7. Add metadata
      if (!(await columnExists(table, 'metadata'))) {
        await queryInterface.addColumn(table, 'metadata', {
          type: Sequelize.JSONB,
          allowNull: true
        });
        console.log('  ✅ Added metadata');
      }

      // 8. Fix enum values
      console.log('  🔄 Updating enum values...');
      try {
        await queryInterface.sequelize.query(`DO $$ BEGIN ALTER TYPE "enum_company_reviews_employment_status" ADD VALUE IF NOT EXISTS 'interviewed'; EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryInterface.sequelize.query(`DO $$ BEGIN ALTER TYPE "enum_company_reviews_status" ADD VALUE IF NOT EXISTS 'flagged'; EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        console.log('  ✅ Enum values updated.');
      } catch (enumErr) {
        console.log('  ℹ️ Enum update note (might already be fixed):', enumErr.message);
      }

      // 9. Fix employment_duration type if it's currently INTEGER
      console.log('  🔄 Checking employment_duration type...');
      const tableDesc = await queryInterface.describeTable(table);
      if (tableDesc.employment_duration && tableDesc.employment_duration.type.includes('INTEGER')) {
        await queryInterface.changeColumn(table, 'employment_duration', {
          type: Sequelize.STRING(50),
          allowNull: true
        });
        console.log('  ✅ Changed employment_duration type to STRING(50)');
      }

      console.log('🎉 Successfully fixed company_reviews table!');
    } catch (error) {
      console.error('❌ Error fixing company_reviews table:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'company_reviews';
    await queryInterface.removeColumn(table, 'work_location');
    await queryInterface.removeColumn(table, 'helpful_count');
    await queryInterface.removeColumn(table, 'not_helpful_count');
    await queryInterface.removeColumn(table, 'moderation_notes');
    await queryInterface.removeColumn(table, 'company_response');
    await queryInterface.removeColumn(table, 'company_response_date');
    await queryInterface.removeColumn(table, 'metadata');
  }
};
