#!/usr/bin/env node

/**
 * Script: Test Combined Filters (Experience + Salary + Skills)
 * =============================================================
 */

const { sequelize, User } = require('../config/index');
const { Op } = require('sequelize');

async function testCombined() {
  try {
    sequelize.options.logging = (sql) => console.log('SQL:', sql.substring(0, 300) + '...');
    
    console.log('\n🔍 === TESTING COMBINED FILTERS ===\n');
    
    // Criteria from requirement
    const workExperienceMin = 1;
    const workExperienceMax = 3;
    const currentSalaryMin = 5;
    const currentSalaryMax = 15;
    const requiredSkill = 'Node.js';
    
    // Test 1: Each filter individually
    console.log('Test 1: Experience filter (1-3 years)');
    let where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      experience_years: { [Op.and]: [{ [Op.gte]: workExperienceMin }, { [Op.lte]: workExperienceMax }] }
    };
    let count = await User.count({ where });
    console.log(`  Result: ${count} candidates\n`);
    
    console.log('Test 2: Salary filter (5-15 LPA or null)');
    where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      [Op.or]: [
        { current_salary: { [Op.and]: [{ [Op.gte]: currentSalaryMin }, { [Op.lte]: currentSalaryMax }] } },
        { current_salary: null },
        { current_salary: { [Op.is]: null } }
      ]
    };
    count = await User.count({ where });
    console.log(`  Result: ${count} candidates\n`);
    
    console.log('Test 3: Skills filter (Node.js)');
    const skillConditions = [
      sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${requiredSkill}%` }),
      sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${requiredSkill}%` }),
      { headline: { [Op.iLike]: `%${requiredSkill}%` } },
      { summary: { [Op.iLike]: `%${requiredSkill}%` } },
      { current_role: { [Op.iLike]: `%${requiredSkill}%` } }
    ];
    where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      [Op.or]: skillConditions
    };
    count = await User.count({ where });
    console.log(`  Result: ${count} candidates\n`);
    
    // Test 4: Experience AND Salary combined
    console.log('Test 4: Experience AND Salary combined');
    where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      experience_years: { [Op.and]: [{ [Op.gte]: workExperienceMin }, { [Op.lte]: workExperienceMax }] },
      [Op.or]: [
        { current_salary: { [Op.and]: [{ [Op.gte]: currentSalaryMin }, { [Op.lte]: currentSalaryMax }] } },
        { current_salary: null },
        { current_salary: { [Op.is]: null } }
      ]
    };
    count = await User.count({ where });
    console.log(`  Result: ${count} candidates\n`);
    
    // Test 5: Experience AND Skills combined
    console.log('Test 5: Experience AND Skills combined');
    where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      experience_years: { [Op.and]: [{ [Op.gte]: workExperienceMin }, { [Op.lte]: workExperienceMax }] },
      [Op.or]: skillConditions
    };
    count = await User.count({ where });
    console.log(`  Result: ${count} candidates\n`);
    
    // Test 6: Salary AND Skills combined
    console.log('Test 6: Salary AND Skills combined');
    where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      [Op.or]: [
        { current_salary: { [Op.and]: [{ [Op.gte]: currentSalaryMin }, { [Op.lte]: currentSalaryMax }] } },
        { current_salary: null },
        { current_salary: { [Op.is]: null } }
      ],
      // This is problematic - we need to add skills as AND condition but we need Op.or
      // The query builder doesn't handle this well
    };
    console.log('  (Skipping - complex query construction)\n');
    
    // Test 7: Experience AND Salary AND Skills combined properly
    console.log('Test 7: Experience AND Salary AND Skills combined (using Op.and)');
    where = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active',
      [Op.and]: [
        { experience_years: { [Op.and]: [{ [Op.gte]: workExperienceMin }, { [Op.lte]: workExperienceMax }] } },
        {
          [Op.or]: [
            { current_salary: { [Op.and]: [{ [Op.gte]: currentSalaryMin }, { [Op.lte]: currentSalaryMax }] } },
            { current_salary: null },
            { current_salary: { [Op.is]: null } }
          ]
        },
        { [Op.or]: skillConditions }
      ]
    };
    count = await User.count({ where });
    console.log(`  Result: ${count} candidates\n`);
    
    // Show who matches
    console.log('\nCandidates matching all filters:');
    const candidates = await User.findAll({
      where,
      attributes: ['first_name', 'email', 'experience_years', 'current_salary', 'skills'],
      raw: true
    });
    
    for (const cand of candidates) {
      console.log(`  ${cand.first_name}: ${cand.experience_years} years exp, ${cand.current_salary} salary, skills: ${cand.skills}`);
    }
    
    console.log(`\n✅ Test complete!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testCombined();
