'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing enum value to Postgres enum used by job_applications.status
    // Safe to run multiple times with IF NOT EXISTS
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_job_applications_status\" ADD VALUE IF NOT EXISTS 'interview_scheduled';"
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert by recreating the enum without the 'interview_scheduled' value
    // Postgres cannot DROP an enum value directly; recreate the type instead.
    await queryInterface.sequelize.query(
      "CREATE TYPE \"enum_job_applications_status_new\" AS ENUM ('applied','reviewing','shortlisted','interviewed','offered','hired','rejected','withdrawn');"
    );

    // Change column to use the new enum type
    await queryInterface.sequelize.query(
      "ALTER TABLE \"job_applications\" ALTER COLUMN \"status\" DROP DEFAULT;"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE \"job_applications\" ALTER COLUMN \"status\" TYPE \"enum_job_applications_status_new\" USING \"status\"::text::\"enum_job_applications_status_new\";"
    );

    // Set default back to 'applied'
    await queryInterface.sequelize.query(
      "ALTER TABLE \"job_applications\" ALTER COLUMN \"status\" SET DEFAULT 'applied';"
    );

    // Drop old type and rename new to original name
    await queryInterface.sequelize.query(
      "DROP TYPE \"enum_job_applications_status\";"
    );
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_job_applications_status_new\" RENAME TO \"enum_job_applications_status\";"
    );
  }
};


