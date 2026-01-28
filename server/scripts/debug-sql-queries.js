#!/usr/bin/env node

/**
 * Script: Deep Debugging - Check Actual SQL Query
 * ===============================================
 * 
 * This script enables SQL query logging and runs the matching algorithm
 * to see the exact SQL being generated
 */

const { sequelize, User, Requirement } = require('../config/index');
const { Op } = require('sequelize');

async function debugSQL() {
  try {
    console.log('\n🔍 === DEBUGGING SQL QUERIES ===\n');
    
    // Enable logging
    sequelize.options.logging = (sql) => console.log('SQL:', sql);
    
    // Get the requirement
    const req_id = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    const requirement = await Requirement.findOne({
      where: { id: req_id }
    });
    
    if (!requirement) {
      console.error('Requirement not found');
      process.exit(1);
    }
    
    console.log(`Found requirement: ${requirement.title}`);
    console.log(`Metadata:`, requirement.metadata);
    
    const metadata = typeof requirement.metadata === 'string' 
      ? JSON.parse(requirement.metadata) 
      : (requirement.metadata || {});
    
    console.log('\nExtracted criteria:');
    console.log('  includeSkills:', metadata.includeSkills);
    console.log('  workExperienceMin:', metadata.workExperienceMin);
    console.log('  workExperienceMax:', metadata.workExperienceMax);
    console.log('  currentSalaryMin:', metadata.currentSalaryMin);
    console.log('  currentSalaryMax:', metadata.currentSalaryMax);
    
    // Test 1: Base query (no filters)
    console.log('\n\n--- Test 1: Base query (no filters) ---');
    const baseWhere = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active'
    };
    
    const baseCount = await User.count({ where: baseWhere });
    console.log(`✅ Base count: ${baseCount}`);
    
    // Test 2: Experience filter
    if (metadata.workExperienceMin !== undefined) {
      console.log('\n\n--- Test 2: Experience filter ---');
      const expWhere = {
        ...baseWhere,
        experience_years: {
          [Op.and]: [
            { [Op.gte]: Number(metadata.workExperienceMin) },
            { [Op.lte]: Number(metadata.workExperienceMax || 50) }
          ]
        }
      };
      
      const expCount = await User.count({ where: expWhere });
      console.log(`✅ Count with experience filter: ${expCount}`);
    }
    
    // Test 3: Salary filter
    if (metadata.currentSalaryMin !== undefined) {
      console.log('\n\n--- Test 3: Salary filter ---');
      const salWhere = {
        ...baseWhere,
        [Op.or]: [
          {
            current_salary: {
              [Op.and]: [
                { [Op.gte]: Number(metadata.currentSalaryMin) },
                { [Op.lte]: Number(metadata.currentSalaryMax || 200) }
              ]
            }
          },
          { current_salary: null },
          { current_salary: { [Op.is]: null } }
        ]
      };
      
      const salCount = await User.count({ where: salWhere });
      console.log(`✅ Count with salary filter: ${salCount}`);
    }
    
    // Test 4: Skills filter
    if (metadata.includeSkills && metadata.includeSkills.length > 0) {
      console.log('\n\n--- Test 4: Skills filter ---');
      const skillConditions = metadata.includeSkills.flatMap(skill => [
        sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        { headline: { [Op.iLike]: `%${skill}%` } },
        { summary: { [Op.iLike]: `%${skill}%` } },
        { current_role: { [Op.iLike]: `%${skill}%` } }
      ]);
      
      const skillWhere = {
        ...baseWhere,
        [Op.or]: skillConditions
      };
      
      const skillCount = await User.count({ where: skillWhere });
      console.log(`✅ Count with skills filter: ${skillCount}`);
      
      // Check individual skills
      console.log('\n  Checking individual skills:');
      for (const skill of metadata.includeSkills) {
        const skillWhere2 = {
          ...baseWhere,
          [Op.or]: [
            sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
            { headline: { [Op.iLike]: `%${skill}%` } }
          ]
        };
        
        const skillCount2 = await User.count({ where: skillWhere2 });
        console.log(`    "${skill}": ${skillCount2} candidates`);
      }
    }
    
    // Test 5: Combination of experience + salary
    if (metadata.workExperienceMin !== undefined && metadata.currentSalaryMin !== undefined) {
      console.log('\n\n--- Test 5: Experience + Salary combined ---');
      const combinedWhere = {
        ...baseWhere,
        experience_years: {
          [Op.and]: [
            { [Op.gte]: Number(metadata.workExperienceMin) },
            { [Op.lte]: Number(metadata.workExperienceMax || 50) }
          ]
        },
        [Op.or]: [
          {
            current_salary: {
              [Op.and]: [
                { [Op.gte]: Number(metadata.currentSalaryMin) },
                { [Op.lte]: Number(metadata.currentSalaryMax || 200) }
              ]
            }
          },
          { current_salary: null },
          { current_salary: { [Op.is]: null } }
        ]
      };
      
      const combinedCount = await User.count({ where: combinedWhere });
      console.log(`✅ Count with experience + salary: ${combinedCount}`);
    }
    
    // Test 6: Get all candidates with their key info
    console.log('\n\n--- Test 6: All candidates details ---');
    const allCandidates = await User.findAll({
      where: baseWhere,
      attributes: ['id', 'first_name', 'email', 'experience_years', 'current_salary', 'current_role', 'key_skills'],
      raw: true
    });
    
    for (const cand of allCandidates) {
      console.log(`\n  ${cand.first_name} (${cand.email})`);
      console.log(`    Experience: ${cand.experience_years}`);
      console.log(`    Salary: ${cand.current_salary}`);
      console.log(`    Role: ${cand.current_role}`);
      console.log(`    Skills: ${cand.key_skills || 'NULL'}`);
    }
    
    console.log(`\n✅ Debug completed!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

debugSQL();
