'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'available_from'
        ) THEN
          ALTER TABLE "job_applications" ADD COLUMN "available_from" TIMESTAMP NULL;
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
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'available_from'
        ) THEN
          ALTER TABLE "job_applications" DROP COLUMN "available_from";
        END IF;
      END$$;
    `);
  }
};


