'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration targets Postgres enum created by Sequelize for notifications.type
    // Name is typically "enum_notifications_type". We defensively try both possible names.
    const enumTypeNames = ['enum_notifications_type', 'notifications_type_enum'];
    const valuesToAdd = [
      'application_status',
      'candidate_shortlisted',
      'application_shortlisted',
      'profile_view',
      'job_recommendation',
      'interview_scheduled',
      'interview_cancelled',
      'interview_reminder',
      'preferred_job_posted',
      'marketing'
    ];

    for (const enumName of enumTypeNames) {
      for (const value of valuesToAdd) {
        // Add value if not exists (Postgres)
        await queryInterface.sequelize.query(
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = '${enumName}' AND e.enumlabel = '${value}') THEN ALTER TYPE "${enumName}" ADD VALUE '${value}'; END IF; END $$;`
        ).catch(() => {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // No-op: Removing enum values is non-trivial and unsafe in production
    return Promise.resolve();
  }
};


