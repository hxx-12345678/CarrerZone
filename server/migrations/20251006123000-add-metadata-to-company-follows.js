'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'company_follows' AND column_name = 'metadata'
        ) THEN
          ALTER TABLE "company_follows" ADD COLUMN "metadata" JSONB NULL DEFAULT '{}';
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
          WHERE table_schema = 'public' AND table_name = 'company_follows' AND column_name = 'metadata'
        ) THEN
          ALTER TABLE "company_follows" DROP COLUMN "metadata";
        END IF;
      END$$;
    `);
  }
};


