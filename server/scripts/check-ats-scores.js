#!/usr/bin/env node

/**
 * Check ATS Scores in Database
 */

const { sequelize } = require('../config/index');
const { QueryTypes } = require('sequelize');

async function check() {
  try {
    const scores = await sequelize.query(`
      SELECT 
        ca.user_id,
        ca.requirement_id,
        ca.ats_score,
        ca.last_calculated,
        u.first_name,
        u.email
      FROM candidate_analytics ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.requirement_id = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb'
    `, {
      type: QueryTypes.SELECT
    });
    
    console.log('\n📊 ATS Scores in Database:');
    if (scores.length > 0) {
      scores.forEach(s => {
        console.log(`\n  ${s.first_name} (${s.email})`);
        console.log(`    ATS Score: ${s.ats_score}`);
        console.log(`    Last Calculated: ${new Date(s.last_calculated).toLocaleString()}`);
      });
    } else {
      console.log('  ⚠️ NO ATS SCORES FOUND IN DATABASE');
      console.log('  The ATS scores need to be calculated!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

check();
