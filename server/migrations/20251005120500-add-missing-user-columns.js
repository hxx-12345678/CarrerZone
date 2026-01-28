'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'users';

    const columnExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
        { replacements: { table, column: columnName } }
      );
      return results && results.length > 0;
    };

    // Ensure ENUM types exist
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_region" AS ENUM ('india', 'gulf', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_oauth_provider" AS ENUM ('google', 'facebook', 'local'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    // Add missing columns if they don't exist
    if (!(await columnExists('region'))) {
      await queryInterface.addColumn(table, 'region', { type: Sequelize.ENUM('india', 'gulf', 'other'), allowNull: true });
    }
    if (!(await columnExists('password_skipped'))) {
      await queryInterface.addColumn(table, 'password_skipped', { type: Sequelize.BOOLEAN, defaultValue: false });
    }
    if (!(await columnExists('preferred_locations'))) {
      await queryInterface.addColumn(table, 'preferred_locations', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('current_salary'))) {
      await queryInterface.addColumn(table, 'current_salary', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    }
    if (!(await columnExists('experience_years'))) {
      await queryInterface.addColumn(table, 'experience_years', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!(await columnExists('login_attempts'))) {
      await queryInterface.addColumn(table, 'login_attempts', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!(await columnExists('lock_until'))) {
      await queryInterface.addColumn(table, 'lock_until', { type: Sequelize.DATE, allowNull: true });
    }
    if (!(await columnExists('headline'))) {
      await queryInterface.addColumn(table, 'headline', { type: Sequelize.STRING, allowNull: true });
    }
    if (!(await columnExists('summary'))) {
      await queryInterface.addColumn(table, 'summary', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!(await columnExists('key_skills'))) {
      await queryInterface.addColumn(table, 'key_skills', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('education'))) {
      await queryInterface.addColumn(table, 'education', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('social_links'))) {
      await queryInterface.addColumn(table, 'social_links', { type: Sequelize.JSONB, defaultValue: {} });
    }
    if (!(await columnExists('email_notifications'))) {
      await queryInterface.addColumn(table, 'email_notifications', { type: Sequelize.BOOLEAN, defaultValue: true });
    }
    if (!(await columnExists('push_notifications'))) {
      await queryInterface.addColumn(table, 'push_notifications', { type: Sequelize.BOOLEAN, defaultValue: true });
    }
    if (!(await columnExists('last_profile_update'))) {
      await queryInterface.addColumn(table, 'last_profile_update', { type: Sequelize.DATE, allowNull: true });
    }
    if (!(await columnExists('oauth_provider'))) {
      await queryInterface.addColumn(table, 'oauth_provider', { type: Sequelize.ENUM('google', 'facebook', 'local'), defaultValue: 'local' });
    }
    if (!(await columnExists('oauth_id'))) {
      await queryInterface.addColumn(table, 'oauth_id', { type: Sequelize.STRING, allowNull: true });
    }
    if (!(await columnExists('oauth_access_token'))) {
      await queryInterface.addColumn(table, 'oauth_access_token', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!(await columnExists('oauth_refresh_token'))) {
      await queryInterface.addColumn(table, 'oauth_refresh_token', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!(await columnExists('oauth_token_expires_at'))) {
      await queryInterface.addColumn(table, 'oauth_token_expires_at', { type: Sequelize.DATE, allowNull: true });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'users';
    const dropColumnIfExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
        { replacements: { table, column: columnName } }
      );
      if (results && results.length > 0) {
        await queryInterface.removeColumn(table, columnName);
      }
    };

    await dropColumnIfExists('region');
    await dropColumnIfExists('password_skipped');
    await dropColumnIfExists('preferred_locations');
    await dropColumnIfExists('current_salary');
    await dropColumnIfExists('experience_years');
    await dropColumnIfExists('login_attempts');
    await dropColumnIfExists('lock_until');
    await dropColumnIfExists('headline');
    await dropColumnIfExists('summary');
    await dropColumnIfExists('key_skills');
    await dropColumnIfExists('education');
    await dropColumnIfExists('social_links');
    await dropColumnIfExists('email_notifications');
    await dropColumnIfExists('push_notifications');
    await dropColumnIfExists('last_profile_update');
    await dropColumnIfExists('oauth_id');
    await dropColumnIfExists('oauth_access_token');
    await dropColumnIfExists('oauth_refresh_token');
    await dropColumnIfExists('oauth_token_expires_at');

    // Drop ENUMs last
    await queryInterface.sequelize.query(`DO $$ BEGIN DROP TYPE IF EXISTS "enum_users_region"; EXCEPTION WHEN undefined_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN DROP TYPE IF EXISTS "enum_users_oauth_provider"; EXCEPTION WHEN undefined_object THEN null; END $$`);
  }
};


