'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_alerts' AND column_name = 'salary_currency'
        ) THEN
          ALTER TABLE "job_alerts" ADD COLUMN "salary_currency" VARCHAR(3) DEFAULT 'INR';
        END IF;
      END$$;
    `);
    console.log('✅ Added salary_currency column to job_alerts table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_alerts' AND column_name = 'salary_currency'
        ) THEN
          ALTER TABLE "job_alerts" DROP COLUMN "salary_currency";
        END IF;
      END$$;
    `);
    console.log('✅ Removed salary_currency column from job_alerts table');
  }
};

