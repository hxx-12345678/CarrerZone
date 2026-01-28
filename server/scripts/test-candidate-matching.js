#!/usr/bin/env node

/**
 * Test Script: Candidate Matching for Requirements
 * ================================================
 * 
 * This script tests the candidate matching logic for employer requirements
 * It helps diagnose why candidates are not appearing for a requirement
 * 
 * Usage:
 *   node server/scripts/test-candidate-matching.js
 * 
 * Test Employer: vinod@keshavencon.com / Keshav@123
 */

const { sequelize, User, Company, Requirement, Profile, Resume } = require('../config/index');
const { Op } = require('sequelize');

const EMPLOYER_EMAIL = 'vinod@keshavencon.com';

async function main() {
  try {
    console.log('\n🔍 === CANDIDATE MATCHING TEST SCRIPT ===\n');
    
    // Step 1: Find employer user
    console.log(`📍 Step 1: Finding employer user (${EMPLOYER_EMAIL})...`);
    const employer = await User.findOne({ where: { email: EMPLOYER_EMAIL } });
    
    if (!employer) {
      console.error(`❌ Employer not found with email: ${EMPLOYER_EMAIL}`);
      process.exit(1);
    }
    
    console.log(`✅ Found employer:`, {
      id: employer.id,
      email: employer.email,
      name: employer.first_name + ' ' + employer.last_name,
      companyId: employer.companyId,
      userType: employer.user_type
    });
    
    // Step 2: Get employer's company
    console.log(`\n📍 Step 2: Fetching employer's company...`);
    const company = await Company.findByPk(employer.companyId);
    
    if (!company) {
      console.error(`❌ Company not found with ID: ${employer.companyId}`);
      process.exit(1);
    }
    
    console.log(`✅ Found company:`, {
      id: company.id,
      name: company.name,
      industry: company.industries || company.industry,
      employees: company.companySize
    });
    
    // Step 3: Get all requirements for this employer
    console.log(`\n📍 Step 3: Fetching all requirements for this employer/company...`);
    const requirements = await Requirement.findAll({
      where: {
        [Op.or]: [
          { companyId: company.id },
          { userId: employer.id }
        ]
      },
      raw: false
    });
    
    console.log(`✅ Found ${requirements.length} requirement(s)`);
    
    if (requirements.length === 0) {
      console.error('⚠️  No requirements found. Please create a requirement first.');
      process.exit(0);
    }
    
    // Step 4: Analyze each requirement
    console.log(`\n📍 Step 4: Analyzing each requirement...`);
    
    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Requirement ${i + 1}/${requirements.length}`);
      console.log(`${'='.repeat(80)}`);
      
      console.log(`\n📋 Basic Info:`);
      console.log(`  ID: ${req.id}`);
      console.log(`  Title: ${req.title}`);
      console.log(`  Created: ${req.createdAt}`);
      console.log(`  Updated: ${req.updatedAt}`);
      
      // Extract metadata
      const metadata = typeof req.metadata === 'string' 
        ? JSON.parse(req.metadata) 
        : (req.metadata || {});
      
      console.log(`\n🔧 Metadata Fields:`);
      console.log(`  - Experience Min: ${metadata.workExperienceMin || req.workExperienceMin || 'NOT SET'}`);
      console.log(`  - Experience Max: ${metadata.workExperienceMax || req.workExperienceMax || 'NOT SET'}`);
      console.log(`  - Salary Min: ${metadata.currentSalaryMin || req.currentSalaryMin || 'NOT SET'}`);
      console.log(`  - Salary Max: ${metadata.currentSalaryMax || req.currentSalaryMax || 'NOT SET'}`);
      console.log(`  - Skills (Include): ${(metadata.includeSkills || req.includeSkills || []).join(', ') || 'NONE'}`);
      console.log(`  - Skills (Key): ${(req.keySkills || []).join(', ') || 'NONE'}`);
      console.log(`  - Skills (Database): ${(req.skills || []).join(', ') || 'NONE'}`);
      console.log(`  - Locations: ${(metadata.candidateLocations || []).join(', ') || 'ANY'}`);
      console.log(`  - Exclude Locations: ${(metadata.excludeLocations || []).join(', ') || 'NONE'}`);
      console.log(`  - Education: ${metadata.education || req.education || 'NOT SET'}`);
      console.log(`  - Job Type: ${req.jobType || 'NOT SET'}`);
      console.log(`  - Notice Period: ${metadata.noticePeriod || req.noticePeriod || 'NOT SET'}`);
      console.log(`  - Remote Work: ${metadata.remoteWork || req.remoteWork || 'NOT SET'}`);
      
      // Step 5: Count total candidates in database
      console.log(`\n📍 Step 5: Counting total candidates in database...`);
      const totalCandidates = await User.count({
        where: {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active'
        }
      });
      
      console.log(`✅ Total active candidates in database: ${totalCandidates}`);
      
      if (totalCandidates === 0) {
        console.error('⚠️  No active candidates found in database!');
        continue;
      }
      
      // Step 6: Test experience matching
      console.log(`\n📍 Step 6: Testing experience matching...`);
      const workExperienceMin = metadata.workExperienceMin || req.workExperienceMin;
      const workExperienceMax = metadata.workExperienceMax || req.workExperienceMax;
      
      let experienceCandidates = await User.count({
        where: {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active',
          ...(workExperienceMin !== null && workExperienceMin !== undefined ? {
            experience_years: {
              [Op.gte]: Number(workExperienceMin),
              [Op.lte]: workExperienceMax !== null ? Number(workExperienceMax) : 50
            }
          } : {})
        }
      });
      
      console.log(`  Filter: Experience ${workExperienceMin || '0'}-${workExperienceMax || 'N/A'} years`);
      console.log(`  ✅ Candidates matching experience: ${experienceCandidates}`);
      
      // Step 7: Test salary matching
      console.log(`\n📍 Step 7: Testing salary matching...`);
      const currentSalaryMin = metadata.currentSalaryMin || req.currentSalaryMin;
      const currentSalaryMax = metadata.currentSalaryMax || req.currentSalaryMax;
      
      let salaryCandidates = await User.count({
        where: {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active',
          ...(currentSalaryMin !== null ? {
            [Op.or]: [
              {
                current_salary: {
                  [Op.gte]: Number(currentSalaryMin),
                  [Op.lte]: currentSalaryMax ? Number(currentSalaryMax) : 200
                }
              },
              { current_salary: null }
            ]
          } : {})
        }
      });
      
      console.log(`  Filter: Salary ${currentSalaryMin || '0'}-${currentSalaryMax || 'N/A'} LPA (or NULL)`);
      console.log(`  ✅ Candidates matching salary: ${salaryCandidates}`);
      
      // Step 8: Test location matching
      console.log(`\n📍 Step 8: Testing location matching...`);
      const candidateLocations = metadata.candidateLocations || [];
      
      let locationCandidates = totalCandidates;
      if (candidateLocations.length > 0) {
        locationCandidates = await User.count({
          where: {
            user_type: 'jobseeker',
            is_active: true,
            account_status: 'active',
            [Op.or]: candidateLocations.flatMap(location => ([
              { current_location: { [Op.iLike]: `%${location}%` } },
              sequelize.where(
                sequelize.cast(sequelize.col('preferred_locations'), 'text'),
                { [Op.iLike]: `%${location}%` }
              )
            ]))
          }
        });
      }
      
      console.log(`  Filter: Locations ${candidateLocations.length > 0 ? candidateLocations.join(', ') : 'ANY'}`);
      console.log(`  ✅ Candidates matching location: ${locationCandidates}`);
      
      // Step 9: Test skills matching
      console.log(`\n📍 Step 9: Testing skills matching...`);
      const includeSkills = metadata.includeSkills || req.includeSkills || [];
      const allSkills = [...new Set([
        ...(Array.isArray(includeSkills) ? includeSkills : []),
        ...(req.keySkills || []),
        ...(req.skills || [])
      ])].filter(Boolean);
      
      let skillsCandidates = totalCandidates;
      if (allSkills.length > 0) {
        const skillConditions = allSkills.flatMap(skill => ([
          { skills: { [Op.contains]: [skill] } },
          sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
          { key_skills: { [Op.contains]: [skill] } },
          sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
          { headline: { [Op.iLike]: `%${skill}%` } }
        ]));
        
        skillsCandidates = await User.count({
          where: {
            user_type: 'jobseeker',
            is_active: true,
            account_status: 'active',
            [Op.or]: skillConditions
          }
        });
      }
      
      console.log(`  Filter: Skills ${allSkills.length > 0 ? allSkills.slice(0, 5).join(', ') : 'NONE'}`);
      console.log(`  ✅ Candidates matching skills: ${skillsCandidates}`);
      
      // Step 10: Sample candidates
      console.log(`\n📍 Step 10: Sampling 5 active candidates from database...`);
      const sampleCandidates = await User.findAll({
        where: {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active'
        },
        limit: 5,
        raw: true
      });
      
      for (const cand of sampleCandidates) {
        console.log(`  - ${cand.first_name} ${cand.last_name} (${cand.email})`);
        console.log(`    Experience: ${cand.experience_years} years`);
        console.log(`    Current Salary: ${cand.current_salary || 'NOT SET'} LPA`);
        console.log(`    Current Location: ${cand.current_location || 'NOT SET'}`);
        console.log(`    Skills: ${cand.skills ? cand.skills.slice(0, 3).join(', ') : 'NONE'}`);
      }
      
      // Step 11: Test requirement criteria
      console.log(`\n📍 Step 11: Testing requirement criteria completeness...`);
      const criteriaChecks = {
        'Has Skills': (includeSkills && includeSkills.length > 0) || (allSkills && allSkills.length > 0),
        'Has Experience Range': workExperienceMin !== null || workExperienceMax !== null,
        'Has Salary Range': currentSalaryMin !== null || currentSalaryMax !== null,
        'Has Locations': candidateLocations && candidateLocations.length > 0,
        'Has Education': metadata.education || req.education,
        'Has Designation': (metadata.candidateDesignations && metadata.candidateDesignations.length > 0) || 
                           (req.candidateDesignations && req.candidateDesignations.length > 0)
      };
      
      console.log('  Criteria Status:');
      for (const [criteria, isSet] of Object.entries(criteriaChecks)) {
        console.log(`    ${isSet ? '✅' : '⚠️ '} ${criteria}`);
      }
      
      const unsetCriteria = Object.entries(criteriaChecks)
        .filter(([_, v]) => !v)
        .map(([k]) => k);
      
      if (unsetCriteria.length > 0) {
        console.warn(`\n⚠️  WARNING: The following criteria are NOT SET: ${unsetCriteria.join(', ')}`);
        console.warn('  This might result in no candidates being matched. Please ensure at least some criteria are set.');
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Test completed successfully!');
    console.log(`${'='.repeat(80)}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
