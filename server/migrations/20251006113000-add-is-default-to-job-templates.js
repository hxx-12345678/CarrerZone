'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'is_default'
        ) THEN
          ALTER TABLE "job_templates" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;
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
          WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'is_default'
        ) THEN
          ALTER TABLE "job_templates" DROP COLUMN "is_default";
        END IF;
      END$$;
    `);
  }
};


