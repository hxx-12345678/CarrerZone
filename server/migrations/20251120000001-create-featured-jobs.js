'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('featured_jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      promotion_type: {
        type: Sequelize.ENUM('featured', 'premium', 'urgent', 'sponsored', 'top-listing'),
        allowNull: false,
        defaultValue: 'featured'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      spent_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      impressions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      clicks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      applications: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ctr: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0
      },
      conversion_rate: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0
      },
      target_audience: {
        type: Sequelize.JSONB,
        defaultValue: Sequelize.literal(`'{}'::jsonb`)
      },
      placement: {
        type: Sequelize.JSONB,
        defaultValue: Sequelize.literal(`'["search-results", "homepage", "category-pages"]'::jsonb`)
      },
      custom_styling: {
        type: Sequelize.JSONB,
        defaultValue: Sequelize.literal(`'{}'::jsonb`)
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Ensure critical columns exist (for idempotent reruns)
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "job_id" UUID');
    await queryInterface.sequelize.query('DO $$ BEGIN CREATE TYPE "public"."enum_featured_jobs_promotion_type" AS ENUM (\'featured\', \'premium\', \'urgent\', \'sponsored\', \'top-listing\'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "promotion_type" "public"."enum_featured_jobs_promotion_type" DEFAULT \'featured\'');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ALTER COLUMN "promotion_type" SET NOT NULL');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMPTZ');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMPTZ');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 1');
    await queryInterface.sequelize.query('ALTER TABLE "featured_jobs" ADD COLUMN IF NOT EXISTS "created_by" UUID');

    // Add indexes idempotently with explicit names
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "featured_jobs_job_id" ON "featured_jobs" ("job_id")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "featured_jobs_promotion_type" ON "featured_jobs" ("promotion_type")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "featured_jobs_is_active" ON "featured_jobs" ("is_active")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "featured_jobs_start_end_date" ON "featured_jobs" ("start_date", "end_date")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "featured_jobs_priority" ON "featured_jobs" ("priority")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "featured_jobs_created_by" ON "featured_jobs" ("created_by")');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('featured_jobs');
  }
};
