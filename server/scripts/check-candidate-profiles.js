#!/usr/bin/env node

/**
 * Script: Check Candidate Profiles and Their Skills
 * ==================================================
 * 
 * Analyzes the 5 candidates in the database to understand why they
 * don't match the requirement
 */

const { sequelize, User } = require('../config/index');
const { Op } = require('sequelize');

async function analyzeCandidates() {
  try {
    console.log('\n🔍 === ANALYZING CANDIDATES ===\n');
    
    // Get all jobseekers
    const candidates = await User.findAll({
      where: {
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      },
      attributes: [
        'id', 'email', 'first_name', 'last_name', 'experience_years',
        'current_salary', 'current_company', 'current_role', 
        'current_location', 'key_skills', 'headline', 'highest_education'
      ],
      limit: 10
    });
    
    console.log(`Found ${candidates.length} active candidates\n`);
    
    for (const candidate of candidates) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 ${candidate.first_name} ${candidate.last_name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Email: ${candidate.email}`);
      console.log(`   Experience: ${candidate.experience_years || 'NOT SET'} years`);
      console.log(`   Current Salary: ${candidate.current_salary || 'NOT SET'}`);
      console.log(`   Current Company: ${candidate.current_company || 'NOT SET'}`);
      console.log(`   Current Role: ${candidate.current_role || 'NOT SET'}`);
      console.log(`   Location: ${candidate.current_location || 'NOT SET'}`);
      console.log(`   Education: ${candidate.highest_education || 'NOT SET'}`);
      
      const skills = candidate.key_skills;
      if (skills) {
        const skillArray = Array.isArray(skills) ? skills : 
                          (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : []);
        console.log(`   Skills: ${skillArray.length > 0 ? skillArray.slice(0, 5).join(', ') : 'NONE'}`);
      } else {
        console.log(`   Skills: NONE`);
      }
    }
    
    console.log(`\n\n✅ Analysis complete\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

analyzeCandidates();
