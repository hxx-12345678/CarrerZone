#!/usr/bin/env node

/**
 * Script: Find which candidate matches the skill filter
 * =====================================================
 */

const { sequelize, User } = require('../config/index');
const { Op } = require('sequelize');

async function findSkillMatch() {
  try {
    sequelize.options.logging = (sql) => console.log('SQL:', sql);
    
    console.log('\n🔍 === FINDING SKILL MATCHES ===\n');
    
    // This query matches the skills filter - returns 1 candidate
    const skillConditions = [
      sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%Node.js%` }),
      sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%Node.js%` }),
      { headline: { [Op.iLike]: `%Node.js%` } },
      { summary: { [Op.iLike]: `%Node.js%` } },
      { current_role: { [Op.iLike]: `%Node.js%` } }
    ];
    
    const skillWhere = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      [Op.or]: skillConditions
    };
    
    const candidates = await User.findAll({
      where: skillWhere,
      attributes: ['id', 'first_name', 'email', 'headline', 'summary', 'current_role', 'skills', 'key_skills'],
      raw: true
    });
    
    console.log(`\nFound ${candidates.length} candidates with "Node.js":`);
    for (const cand of candidates) {
      console.log(`\n  ${cand.first_name} (${cand.email})`);
      console.log(`    Headline: ${cand.headline || 'NULL'}`);
      console.log(`    Current Role: ${cand.current_role || 'NULL'}`);
      console.log(`    Summary: ${cand.summary ? cand.summary.substring(0, 100) : 'NULL'}`);
      console.log(`    Skills: ${cand.skills || 'NULL'}`);
      console.log(`    Key Skills: ${cand.key_skills || 'NULL'}`);
    }
    
    console.log(`\n✅ Analysis complete!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

findSkillMatch();
