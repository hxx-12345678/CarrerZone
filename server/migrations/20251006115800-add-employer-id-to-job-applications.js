'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'employer_id'
        ) THEN
          ALTER TABLE "job_applications" ADD COLUMN "employer_id" UUID NULL;
          ALTER TABLE "job_applications" ADD CONSTRAINT fk_job_applications_employer_id FOREIGN KEY ("employer_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
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
          WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'employer_id'
        ) THEN
          ALTER TABLE "job_applications" DROP CONSTRAINT IF EXISTS fk_job_applications_employer_id;
          ALTER TABLE "job_applications" DROP COLUMN "employer_id";
        END IF;
      END$$;
    `);
  }
};


