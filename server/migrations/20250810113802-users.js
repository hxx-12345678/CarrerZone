'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM types first (if they don't exist)
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_user_type" AS ENUM ('jobseeker', 'employer', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_gender" AS ENUM ('male', 'female', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_profile_visibility" AS ENUM ('public', 'private', 'connections'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_contact_visibility" AS ENUM ('public', 'private', 'connections'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_account_status" AS ENUM ('active', 'suspended', 'deleted'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryInterface.sequelize.query(`DO $$ BEGIN CREATE TYPE "enum_users_verification_level" AS ENUM ('unverified', 'basic', 'premium'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_type: {
        type: Sequelize.ENUM('jobseeker', 'employer', 'admin'),
        allowNull: false,
        defaultValue: 'jobseeker'
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      current_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      willing_to_relocate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      expected_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notice_period: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_secret: {
        type: Sequelize.STRING,
        allowNull: true
      },
      skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      languages: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      certifications: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      profile_visibility: {
        type: Sequelize.ENUM('public', 'private', 'connections'),
        defaultValue: 'public'
      },
      contact_visibility: {
        type: Sequelize.ENUM('public', 'private', 'connections'),
        defaultValue: 'public'
      },
      account_status: {
        type: Sequelize.ENUM('active', 'suspended', 'deleted'),
        defaultValue: 'active'
      },
      verification_level: {
        type: Sequelize.ENUM('unverified', 'basic', 'premium'),
        defaultValue: 'unverified'
      },
      profile_completion: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes (email index is automatically created by unique constraint)
    await queryInterface.addIndex('users', ['user_type']);
    await queryInterface.addIndex('users', ['company_id']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['account_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_user_type"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_gender"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_profile_visibility"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_contact_visibility"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_account_status"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_verification_level"`);
  }
};
