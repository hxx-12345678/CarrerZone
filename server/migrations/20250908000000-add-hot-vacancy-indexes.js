'use strict';

/**
 * Migration: Add performance indexes for hot vacancy queries
 * 
 * This migration adds database indexes to improve query performance
 * for hot vacancy filtering and sorting operations.
 * 
 * Date: 2025-01-08
 * Purpose: Performance optimization for hot vacancy features
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('📊 Adding performance indexes for hot vacancy queries...');

    // Helper to check if a column exists on a table
    const columnExists = async (table, column) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column LIMIT 1`,
        { replacements: { table, column } }
      );
      return results && results.length > 0;
    };

    try {
      const hasIsHotVacancy = await columnExists('jobs', 'ishotvacancy');
      const hasHotVacancyPaymentStatus = await columnExists('jobs', 'hotvacancypaymentstatus');
      const hasSuperFeatured = await columnExists('jobs', 'superfeatured');
      const hasUrgentHiring = await columnExists('jobs', 'urgenthiring');
      const hasBoostedSearch = await columnExists('jobs', 'boostedsearch');
      const hasTierLevel = await columnExists('jobs', 'tierlevel');
      const hasEmployerId = await columnExists('jobs', 'employer_id');
      const hasValidTill = await columnExists('jobs', 'valid_till');

      // Index 1
      if (hasIsHotVacancy) {
        await queryInterface.addIndex('jobs', ['ishotvacancy'], {
          name: 'idx_jobs_ishotvacancy',
          where: { ishotvacancy: true }
        });
        console.log('✅ Added index: idx_jobs_ishotvacancy');
      } else {
        console.log('⏭️  Skipping idx_jobs_ishotvacancy (ishotvacancy column missing)');
      }

      // Index 2
      if (hasIsHotVacancy && hasHotVacancyPaymentStatus) {
        await queryInterface.addIndex('jobs', ['ishotvacancy', 'status', 'hotvacancypaymentstatus'], {
          name: 'idx_jobs_hot_vacancy_status',
          where: { ishotvacancy: true }
        });
        console.log('✅ Added index: idx_jobs_hot_vacancy_status');
      } else {
        console.log('⏭️  Skipping idx_jobs_hot_vacancy_status (dependent columns missing)');
      }

      // Index 3
      if (hasIsHotVacancy && hasSuperFeatured && hasUrgentHiring && hasBoostedSearch) {
        await queryInterface.addIndex('jobs', ['ishotvacancy', 'superfeatured', 'urgenthiring', 'boostedsearch', 'createdAt'], {
          name: 'idx_jobs_hot_vacancy_featured',
          where: { ishotvacancy: true }
        });
        console.log('✅ Added index: idx_jobs_hot_vacancy_featured');
      } else {
        console.log('⏭️  Skipping idx_jobs_hot_vacancy_featured (dependent columns missing)');
      }

      // Index 4
      if (hasIsHotVacancy && hasTierLevel) {
        await queryInterface.addIndex('jobs', ['ishotvacancy', 'tierlevel'], {
          name: 'idx_jobs_hot_vacancy_tier',
          where: { ishotvacancy: true }
        });
        console.log('✅ Added index: idx_jobs_hot_vacancy_tier');
      } else {
        console.log('⏭️  Skipping idx_jobs_hot_vacancy_tier (dependent columns missing)');
      }

      // Index 5
      if (hasEmployerId && hasIsHotVacancy) {
        await queryInterface.addIndex('jobs', ['employer_id', 'ishotvacancy'], {
          name: 'idx_jobs_employer_hot_vacancy'
        });
        console.log('✅ Added index: idx_jobs_employer_hot_vacancy');
      } else {
        console.log('⏭️  Skipping idx_jobs_employer_hot_vacancy (dependent columns missing)');
      }

      // Index 6
      if (hasIsHotVacancy && hasValidTill) {
        await queryInterface.addIndex('jobs', ['ishotvacancy', 'valid_till'], {
          name: 'idx_jobs_hot_vacancy_valid',
          where: { ishotvacancy: true }
        });
        console.log('✅ Added index: idx_jobs_hot_vacancy_valid');
      } else {
        console.log('⏭️  Skipping idx_jobs_hot_vacancy_valid (dependent columns missing)');
      }

      console.log('🎉 Hot vacancy index migration completed with guards.');

    } catch (error) {
      console.error('❌ Error adding indexes:', error.message);
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Some indexes already exist, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔧 Removing hot vacancy performance indexes...');

    const indexesToRemove = [
      'idx_jobs_ishotvacancy',
      'idx_jobs_hot_vacancy_status',
      'idx_jobs_hot_vacancy_featured',
      'idx_jobs_hot_vacancy_tier',
      'idx_jobs_employer_hot_vacancy',
      'idx_jobs_hot_vacancy_valid'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('jobs', indexName);
        console.log(`✅ Removed index: ${indexName}`);
      } catch (error) {
        console.error(`❌ Failed to remove index ${indexName}:`, error.message);
      }
    }

    console.log('✅ All hot vacancy performance indexes removed successfully!');
  }
};

