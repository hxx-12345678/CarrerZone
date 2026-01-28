'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Ensuring all model field mappings are properly set up...');

    // Check and add missing columns to subscription_plans table
    const subscriptionPlanColumns = [
      {
        name: 'plan_type',
        definition: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'basic'
        }
      },
      {
        name: 'max_team_members',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 1
        }
      },
      {
        name: 'max_job_postings',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 1
        }
      },
      {
        name: 'max_candidate_views',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 100
        }
      },
      {
        name: 'max_resume_downloads',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 10
        }
      },
      {
        name: 'has_advanced_analytics',
        definition: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }
      },
      {
        name: 'has_priority_support',
        definition: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }
      },
      {
        name: 'has_custom_branding',
        definition: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }
      },
      {
        name: 'has_api_access',
        definition: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }
      },
      {
        name: 'has_bulk_operations',
        definition: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }
      },
      {
        name: 'metadata',
        definition: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      }
    ];

    for (const column of subscriptionPlanColumns) {
      try {
        await queryInterface.addColumn('subscription_plans', column.name, column.definition);
        console.log(`✅ Added column ${column.name} to subscription_plans`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${column.name} already exists in subscription_plans`);
        } else {
          console.error(`❌ Error adding column ${column.name} to subscription_plans:`, error.message);
        }
      }
    }

    // Check and add missing columns to payments table
    const paymentColumns = [
      {
        name: 'description',
        definition: {
          type: Sequelize.TEXT,
          allowNull: true
        }
      },
      {
        name: 'gateway_payment_id',
        definition: {
          type: Sequelize.STRING,
          allowNull: true
        }
      },
      {
        name: 'gateway_refund_id',
        definition: {
          type: Sequelize.STRING,
          allowNull: true
        }
      },
      {
        name: 'failure_code',
        definition: {
          type: Sequelize.STRING,
          allowNull: true
        }
      },
      {
        name: 'processed_at',
        definition: {
          type: Sequelize.DATE,
          allowNull: true
        }
      },
      {
        name: 'final_amount',
        definition: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true
        }
      },
      {
        name: 'metadata',
        definition: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      }
    ];

    for (const column of paymentColumns) {
      try {
        await queryInterface.addColumn('payments', column.name, column.definition);
        console.log(`✅ Added column ${column.name} to payments`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${column.name} already exists in payments`);
        } else {
          console.error(`❌ Error adding column ${column.name} to payments:`, error.message);
        }
      }
    }

    // Check and add missing columns to analytics table
    const analyticsColumns = [
      {
        name: 'company_id',
        definition: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'companies',
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
        columns: ['company_id'],
        name: 'analytics_company_id_idx'
      },
      {
        table: 'subscription_plans',
        columns: ['plan_type'],
        name: 'subscription_plans_plan_type_idx'
      },
      {
        table: 'payments',
        columns: ['gateway_payment_id'],
        name: 'payments_gateway_payment_id_idx'
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

    console.log('🎉 Model field mappings migration completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back model field mappings...');

    // Remove indexes
    const indexes = [
      'analytics_company_id_idx',
      'subscription_plans_plan_type_idx',
      'payments_gateway_payment_id_idx'
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
    try {
      await queryInterface.removeColumn('analytics', 'company_id');
      console.log('✅ Removed company_id from analytics');
    } catch (error) {
      console.log('⚠️  company_id column may not exist in analytics:', error.message);
    }

    // Remove columns from payments
    const paymentColumns = ['metadata', 'final_amount', 'processed_at', 'failure_code', 'gateway_refund_id', 'gateway_payment_id', 'description'];
    for (const column of paymentColumns) {
      try {
        await queryInterface.removeColumn('payments', column);
        console.log(`✅ Removed ${column} from payments`);
      } catch (error) {
        console.log(`⚠️  Column ${column} may not exist in payments:`, error.message);
      }
    }

    // Remove columns from subscription_plans
    const subscriptionPlanColumns = ['metadata', 'has_bulk_operations', 'has_api_access', 'has_custom_branding', 'has_priority_support', 'has_advanced_analytics', 'max_resume_downloads', 'max_candidate_views', 'max_job_postings', 'max_team_members', 'plan_type'];
    for (const column of subscriptionPlanColumns) {
      try {
        await queryInterface.removeColumn('subscription_plans', column);
        console.log(`✅ Removed ${column} from subscription_plans`);
      } catch (error) {
        console.log(`⚠️  Column ${column} may not exist in subscription_plans:`, error.message);
      }
    }

    console.log('🔄 Model field mappings rollback completed!');
  }
};

