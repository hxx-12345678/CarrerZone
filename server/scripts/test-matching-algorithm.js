#!/usr/bin/env node

/**
 * Script: Test the Exact Matching Algorithm from Requirements Endpoint
 * ====================================================================
 */

const { sequelize, User, Requirement } = require('../config/index');
const { Op } = require('sequelize');

async function testMatchingAlgorithm() {
  try {
    console.log('\n🔍 === TESTING EXACT MATCHING ALGORITHM ===\n');
    
    // Get the requirement
    const req_id = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    const requirement = await Requirement.findOne({ where: { id: req_id } });
    
    if (!requirement) {
      console.error('Requirement not found');
      process.exit(1);
    }
    
    // Extract metadata exactly as the endpoint does
    const metadata = typeof requirement.metadata === 'string' 
      ? JSON.parse(requirement.metadata) 
      : (requirement.metadata || {});
    
    // Extract values exactly as the endpoint does
    let workExperienceMin = metadata.workExperienceMin || metadata.experienceMin || null;
    let workExperienceMax = metadata.workExperienceMax || metadata.experienceMax || null;
    let currentSalaryMin = metadata.currentSalaryMin || metadata.salaryMin || null;
    let currentSalaryMax = metadata.currentSalaryMax || metadata.salaryMax || null;
    const candidateLocations = metadata.candidateLocations || [];
    const includeSkills = metadata.includeSkills || [];
    
    console.log('Extracted Values:');
    console.log('  workExperienceMin:', workExperienceMin);
    console.log('  workExperienceMax:', workExperienceMax);
    console.log('  currentSalaryMin:', currentSalaryMin);
    console.log('  currentSalaryMax:', currentSalaryMax);
    console.log('  candidateLocations:', candidateLocations);
    console.log('  includeSkills:', includeSkills);
    
    // Build whereClause exactly as endpoint does
    const whereClause = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active'
    };
    
    const matchingConditions = [];
    const allAndConditions = [];
    
    // 1. Experience
    if (workExperienceMin !== null && workExperienceMin !== undefined) {
      const minExp = Number(workExperienceMin);
      const maxExp = workExperienceMax !== null && workExperienceMax !== undefined 
        ? Number(workExperienceMax) : 50;
      
      whereClause.experience_years = {
        [Op.and]: [
          { [Op.gte]: minExp },
          { [Op.lte]: maxExp }
        ]
      };
      console.log(`\n✅ Added experience filter: ${minExp}-${maxExp} years`);
    }
    
    // 2. Salary
    if (currentSalaryMin !== null && currentSalaryMin !== undefined) {
      const minSalary = Number(currentSalaryMin);
      const maxSalary = currentSalaryMax !== null && currentSalaryMax !== undefined
        ? Number(currentSalaryMax) : 200;
      
      matchingConditions.push({
        [Op.or]: [
          {
            current_salary: {
              [Op.and]: [
                { [Op.gte]: minSalary },
                { [Op.lte]: maxSalary }
              ]
            }
          },
          { current_salary: null },
          { current_salary: { [Op.is]: null } }
        ]
      });
      console.log(`✅ Added salary filter: ${minSalary}-${maxSalary} LPA (or NULL)`);
    }
    
    // 3. Skills
    if (includeSkills.length > 0) {
      const skillConditions = includeSkills.flatMap(skill => ([
        sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        { headline: { [Op.iLike]: `%${skill}%` } },
        { summary: { [Op.iLike]: `%${skill}%` } }
      ]));
      
      matchingConditions.push({ [Op.or]: skillConditions });
      console.log(`✅ Added skills filter: ${includeSkills.join(', ')}`);
    }
    
    // Combine conditions
    if (whereClause.experience_years) {
      allAndConditions.push({ experience_years: whereClause.experience_years });
      delete whereClause.experience_years;
      console.log(`✅ Moved experience to allAndConditions`);
    }
    
    if (whereClause.current_salary) {
      allAndConditions.push({ current_salary: whereClause.current_salary });
      delete whereClause.current_salary;
      console.log(`✅ Moved salary to allAndConditions`);
    }
    
    if (matchingConditions.length > 0) {
      allAndConditions.push({ [Op.and]: matchingConditions });
      console.log(`✅ Added ${matchingConditions.length} matching conditions to allAndConditions`);
    }
    
    if (allAndConditions.length > 0) {
      whereClause[Op.and] = allAndConditions;
      console.log(`✅ Applied ${allAndConditions.length} AND conditions`);
    }
    
    // Log the whereClause
    console.log('\n📊 Final whereClause structure:');
    console.log(JSON.stringify(whereClause, null, 2).substring(0, 2000));
    
    // Test the query
    console.log('\n\n🔍 Testing query...');
    const count = await User.count({ where: whereClause });
    console.log(`✅ Query returned ${count} candidates`);
    
    if (count > 0) {
      const candidates = await User.findAll({
        where: whereClause,
        attributes: ['first_name', 'email', 'experience_years', 'current_salary', 'skills'],
        limit: 5
      });
      
      console.log('\nMatching candidates:');
      for (const cand of candidates) {
        console.log(`  ${cand.first_name}: ${cand.experience_years}y exp, ${cand.current_salary} salary, skills=${cand.skills}`);
      }
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

testMatchingAlgorithm();
