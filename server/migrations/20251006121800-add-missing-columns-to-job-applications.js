'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add multiple columns if they do not exist
    const statements = [
      `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'employer_notes') THEN ALTER TABLE "job_applications" ADD COLUMN "employer_notes" TEXT NULL; END IF;`,
      `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'candidate_notes') THEN ALTER TABLE "job_applications" ADD COLUMN "candidate_notes" TEXT NULL; END IF;`,
      `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'interview_notes') THEN ALTER TABLE "job_applications" ADD COLUMN "interview_notes" TEXT NULL; END IF;`,
      `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'offer_details') THEN ALTER TABLE "job_applications" ADD COLUMN "offer_details" JSONB NULL; END IF;`,
      `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'additional_documents') THEN ALTER TABLE "job_applications" ADD COLUMN "additional_documents" JSONB NULL; END IF;`,
      `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'metadata') THEN ALTER TABLE "job_applications" ADD COLUMN "metadata" JSONB NULL DEFAULT '{}'; END IF;`
    ];

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        ${statements.join('\n        ')}
      END$$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    const statements = [
      `IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'employer_notes') THEN ALTER TABLE "job_applications" DROP COLUMN "employer_notes"; END IF;`,
      `IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'candidate_notes') THEN ALTER TABLE "job_applications" DROP COLUMN "candidate_notes"; END IF;`,
      `IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'interview_notes') THEN ALTER TABLE "job_applications" DROP COLUMN "interview_notes"; END IF;`,
      `IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'offer_details') THEN ALTER TABLE "job_applications" DROP COLUMN "offer_details"; END IF;`,
      `IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'additional_documents') THEN ALTER TABLE "job_applications" DROP COLUMN "additional_documents"; END IF;`,
      `IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'metadata') THEN ALTER TABLE "job_applications" DROP COLUMN "metadata"; END IF;`
    ];

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        ${statements.join('\n        ')}
      END$$;
    `);
  }
};


