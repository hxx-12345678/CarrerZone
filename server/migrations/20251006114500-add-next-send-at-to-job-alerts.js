'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_alerts' AND column_name = 'next_send_at'
        ) THEN
          ALTER TABLE "job_alerts" ADD COLUMN "next_send_at" TIMESTAMP NULL;
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
          WHERE table_schema = 'public' AND table_name = 'job_alerts' AND column_name = 'next_send_at'
        ) THEN
          ALTER TABLE "job_alerts" DROP COLUMN "next_send_at";
        END IF;
      END$$;
    `);
  }
};


