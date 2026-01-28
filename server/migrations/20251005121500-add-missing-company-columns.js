'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'companies';
    const columnExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
        { replacements: { table, column: columnName } }
      );
      return results && results.length > 0;
    };

    // Ensure ENUMs exist
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_companies_company_type" AS ENUM ('startup', 'midsize', 'enterprise', 'multinational'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_companies_funding_stage" AS ENUM ('bootstrapped', 'seed', 'series-a', 'series-b', 'series-c', 'public'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_companies_revenue" AS ENUM ('0-1cr', '1-10cr', '10-50cr', '50-100cr', '100cr+'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_companies_region" AS ENUM ('india', 'gulf', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    // Add missing columns
    if (!(await columnExists('is_verified'))) {
      await queryInterface.addColumn(table, 'is_verified', { type: Sequelize.BOOLEAN, defaultValue: false });
    }
    if (!(await columnExists('is_active'))) {
      await queryInterface.addColumn(table, 'is_active', { type: Sequelize.BOOLEAN, defaultValue: true });
    }
    if (!(await columnExists('is_featured'))) {
      await queryInterface.addColumn(table, 'is_featured', { type: Sequelize.BOOLEAN, defaultValue: false });
    }
    if (!(await columnExists('social_links'))) {
      await queryInterface.addColumn(table, 'social_links', { type: Sequelize.JSONB, defaultValue: {} });
    }
    if (!(await columnExists('benefits'))) {
      await queryInterface.addColumn(table, 'benefits', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('technologies'))) {
      await queryInterface.addColumn(table, 'technologies', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('company_type'))) {
      await queryInterface.addColumn(table, 'company_type', { type: Sequelize.ENUM('startup', 'midsize', 'enterprise', 'multinational'), allowNull: true });
    }
    if (!(await columnExists('funding_stage'))) {
      await queryInterface.addColumn(table, 'funding_stage', { type: Sequelize.ENUM('bootstrapped', 'seed', 'series-a', 'series-b', 'series-c', 'public'), allowNull: true });
    }
    if (!(await columnExists('revenue'))) {
      await queryInterface.addColumn(table, 'revenue', { type: Sequelize.ENUM('0-1cr', '1-10cr', '10-50cr', '50-100cr', '100cr+'), allowNull: true });
    }
    if (!(await columnExists('culture'))) {
      await queryInterface.addColumn(table, 'culture', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!(await columnExists('work_environment'))) {
      await queryInterface.addColumn(table, 'work_environment', { type: Sequelize.JSONB, defaultValue: {} });
    }
    if (!(await columnExists('hiring_process'))) {
      await queryInterface.addColumn(table, 'hiring_process', { type: Sequelize.JSONB, defaultValue: {} });
    }
    if (!(await columnExists('contact_person'))) {
      await queryInterface.addColumn(table, 'contact_person', { type: Sequelize.STRING, allowNull: true });
    }
    if (!(await columnExists('contact_email'))) {
      await queryInterface.addColumn(table, 'contact_email', { type: Sequelize.STRING, allowNull: true });
    }
    if (!(await columnExists('contact_phone'))) {
      await queryInterface.addColumn(table, 'contact_phone', { type: Sequelize.STRING, allowNull: true });
    }
    if (!(await columnExists('verification_documents'))) {
      await queryInterface.addColumn(table, 'verification_documents', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('total_applications'))) {
      await queryInterface.addColumn(table, 'total_applications', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!(await columnExists('average_response_time'))) {
      await queryInterface.addColumn(table, 'average_response_time', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!(await columnExists('keywords'))) {
      await queryInterface.addColumn(table, 'keywords', { type: Sequelize.JSONB, defaultValue: [] });
    }
    if (!(await columnExists('last_activity_at'))) {
      await queryInterface.addColumn(table, 'last_activity_at', { type: Sequelize.DATE, allowNull: true });
    }
    if (!(await columnExists('profile_completion'))) {
      await queryInterface.addColumn(table, 'profile_completion', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!(await columnExists('region'))) {
      await queryInterface.addColumn(table, 'region', { type: Sequelize.ENUM('india', 'gulf', 'other'), allowNull: true, defaultValue: 'india' });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'companies';
    const dropColumnIfExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
        { replacements: { table, column: columnName } }
      );
      if (results && results.length > 0) {
        await queryInterface.removeColumn(table, columnName);
      }
    };

    const cols = ['is_verified','is_active','is_featured','social_links','benefits','technologies','company_type','funding_stage','revenue','culture','work_environment','hiring_process','contact_person','contact_email','contact_phone','verification_documents','total_applications','average_response_time','keywords','last_activity_at','profile_completion','region'];
    for (const c of cols) {
      await dropColumnIfExists(c);
    }

    await queryInterface.sequelize.query(`DO $$ BEGIN DROP TYPE IF EXISTS "enum_companies_company_type"; EXCEPTION WHEN undefined_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN DROP TYPE IF EXISTS "enum_companies_funding_stage"; EXCEPTION WHEN undefined_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN DROP TYPE IF EXISTS "enum_companies_revenue"; EXCEPTION WHEN undefined_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN DROP TYPE IF EXISTS "enum_companies_region"; EXCEPTION WHEN undefined_object THEN null; END $$`);
  }
};


