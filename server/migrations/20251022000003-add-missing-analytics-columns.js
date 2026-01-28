'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding missing columns to analytics table...');

    // Add missing columns to analytics table
    const analyticsColumns = [
      {
        name: 'search_query',
        definition: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      },
      {
        name: 'filters',
        definition: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      },
      {
        name: 'job_id',
        definition: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'jobs',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }
      },
      {
        name: 'application_id',
        definition: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'job_applications',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }
      }
    ];

    for (const column of analyticsColumns) {
      try {
        await queryInterface.addColumn('analytics', column.name, column.definition);
        console.log(`✅ Added column ${column.name} to analytics`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${column.name} already exists in analytics`);
        } else {
          console.error(`❌ Error adding column ${column.name} to analytics:`, error.message);
        }
      }
    }

    // Add indexes for better performance
    const indexes = [
      {
        table: 'analytics',
        columns: ['job_id'],
        name: 'analytics_job_id_idx'
      },
      {
        table: 'analytics',
        columns: ['application_id'],
        name: 'analytics_application_id_idx'
      }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex(index.table, index.columns, {
          name: index.name
        });
        console.log(`✅ Added index ${index.name} to ${index.table}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Index ${index.name} already exists on ${index.table}`);
        } else {
          console.error(`❌ Error adding index ${index.name} to ${index.table}:`, error.message);
        }
      }
    }

    console.log('🎉 Missing analytics columns migration completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back missing analytics columns...');

    // Remove indexes
    const indexes = [
      'analytics_job_id_idx',
      'analytics_application_id_idx'
    ];

    for (const indexName of indexes) {
      try {
        await queryInterface.removeIndex('analytics', indexName);
        console.log(`✅ Removed index ${indexName}`);
      } catch (error) {
        console.log(`⚠️  Index ${indexName} may not exist:`, error.message);
      }
    }

    // Remove columns from analytics
    const analyticsColumns = ['application_id', 'job_id', 'filters', 'search_query'];
    for (const column of analyticsColumns) {
      try {
        await queryInterface.removeColumn('analytics', column);
        console.log(`✅ Removed ${column} from analytics`);
      } catch (error) {
        console.log(`⚠️  Column ${column} may not exist in analytics:`, error.message);
      }
    }

    console.log('🔄 Missing analytics columns rollback completed!');
  }
};

