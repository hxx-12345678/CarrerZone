'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Add last_used_at if missing
		await queryInterface.sequelize.query(`
		  DO $$
		  BEGIN
		    IF NOT EXISTS (
		      SELECT 1 FROM information_schema.columns
		      WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'last_used_at'
		    ) THEN
		      ALTER TABLE "job_templates" ADD COLUMN "last_used_at" TIMESTAMP NULL;
		    END IF;
		  END$$;
		`);

		// Add usage_count if missing
		await queryInterface.sequelize.query(`
		  DO $$
		  BEGIN
		    IF NOT EXISTS (
		      SELECT 1 FROM information_schema.columns
		      WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'usage_count'
		    ) THEN
		      ALTER TABLE "job_templates" ADD COLUMN "usage_count" INTEGER NOT NULL DEFAULT 0;
		    END IF;
		  END$$;
		`);
	},

	down: async (queryInterface, Sequelize) => {
		// Drop columns if they exist
		await queryInterface.sequelize.query(`
		  DO $$
		  BEGIN
		    IF EXISTS (
		      SELECT 1 FROM information_schema.columns
		      WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'last_used_at'
		    ) THEN
		      ALTER TABLE "job_templates" DROP COLUMN "last_used_at";
		    END IF;
		  END$$;
		`);
		await queryInterface.sequelize.query(`
		  DO $$
		  BEGIN
		    IF EXISTS (
		      SELECT 1 FROM information_schema.columns
		      WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'usage_count'
		    ) THEN
		      ALTER TABLE "job_templates" DROP COLUMN "usage_count";
		    END IF;
		  END$$;
		`);
	}
};



