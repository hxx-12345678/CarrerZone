'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'applied_at'
        ) THEN
          ALTER TABLE "job_applications" ADD COLUMN "applied_at" TIMESTAMP NULL;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'last_updated_at'
        ) THEN
          ALTER TABLE "job_applications" ADD COLUMN "last_updated_at" TIMESTAMP NULL;
        END IF;
      END$$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'applied_at'
        ) THEN
          ALTER TABLE "job_applications" DROP COLUMN "applied_at";
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'last_updated_at'
        ) THEN
          ALTER TABLE "job_applications" DROP COLUMN "last_updated_at";
        END IF;
      END$$;
    `);
  }
};


