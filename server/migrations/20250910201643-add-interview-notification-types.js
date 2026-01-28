'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add new enum values to the notifications type enum idempotently
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_notifications_type' AND e.enumlabel = 'interview_scheduled'
        ) THEN
          ALTER TYPE "enum_notifications_type" ADD VALUE 'interview_scheduled';
        END IF;
      END
      $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_notifications_type' AND e.enumlabel = 'interview_cancelled'
        ) THEN
          ALTER TYPE "enum_notifications_type" ADD VALUE 'interview_cancelled';
        END IF;
      END
      $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_notifications_type' AND e.enumlabel = 'interview_reminder'
        ) THEN
          ALTER TYPE "enum_notifications_type" ADD VALUE 'interview_reminder';
        END IF;
      END
      $$;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll leave the enum values in place
    console.log('Note: PostgreSQL enum values cannot be easily removed. The new enum values will remain.');
  }
};
