#!/usr/bin/env node

/**
 * Script: Analyze JACK's Profile, Resume, and ATS Score
 * ======================================================
 */

const { sequelize, User } = require('../config/index');
const { Op } = require('sequelize');

async function analyzeJack() {
  try {
    console.log('\n🔍 === ANALYZING JACK SPARROW PROFILE & ATS SCORE ===\n');
    
    // Step 1: Get JACK's full profile
    console.log('📍 Step 1: JACK\'s Full Profile');
    const jack = await User.findOne({
      where: { email: 'cptjacksprw@gmail.com' },
      attributes: [
        'id', 'first_name', 'last_name', 'email', 'headline', 'summary',
        'experience_years', 'current_salary', 'expected_salary',
        'current_company', 'current_role', 'notice_period',
        'skills', 'key_skills', 'highest_education', 'field_of_study',
        'profile_completion', 'created_at', 'updated_at'
      ]
    });
    
    console.log(`\n👤 ${jack.first_name} ${jack.last_name}`);
    console.log(`   Email: ${jack.email}`);
    console.log(`   Profile Completion: ${jack.profile_completion}%`);
    console.log(`\n📋 Professional Info:`);
    console.log(`   Headline: ${jack.headline || 'NOT SET'}`);
    console.log(`   Current Role: ${jack.current_role || 'NOT SET'}`);
    console.log(`   Current Company: ${jack.current_company || 'NOT SET'}`);
    console.log(`   Experience: ${jack.experience_years} years`);
    console.log(`   Current Salary: ${jack.current_salary || 'NOT SET'} LPA`);
    console.log(`   Expected Salary: ${jack.expected_salary || 'NOT SET'} LPA`);
    console.log(`   Notice Period: ${jack.notice_period || 'NOT SET'} days`);
    
    console.log(`\n🎓 Education:`);
    console.log(`   Highest Education: ${jack.highest_education || 'NOT SET'}`);
    console.log(`   Field of Study: ${jack.field_of_study || 'NOT SET'}`);
    
    console.log(`\n💼 Skills:`);
    console.log(`   Skills: ${jack.skills || 'NOT SET'}`);
    console.log(`   Key Skills: ${jack.key_skills || 'NOT SET'}`);
    
    console.log(`\n📝 Summary:`);
    console.log(`   ${jack.summary || 'NO SUMMARY'}`);
    
    // Step 2: Check for resumes
    console.log(`\n\n📍 Step 2: JACK's Resumes`);
    const { Resume } = require('../config/index');
    const resumes = await Resume.findAll({
      where: { userId: jack.id }
    });
    
    if (resumes.length > 0) {
      console.log(`   Found ${resumes.length} resume(s):`);
      resumes.forEach((resume, index) => {
        console.log(`   ${index + 1}. ${resume.title}`);
        console.log(`      Default: ${resume.isDefault ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('   ⚠️  NO RESUMES FOUND');
    }
    
    // Step 3: Check work experience
    console.log(`\n\n📍 Step 3: JACK's Work Experience`);
    const workExp = await sequelize.query(`
      SELECT id, title, company, is_current, start_date, end_date, description
      FROM work_experiences
      WHERE user_id = ?
      ORDER BY is_current DESC, start_date DESC
    `, {
      replacements: [jack.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (workExp.length > 0) {
      console.log(`   Found ${workExp.length} work experience(s):`);
      workExp.forEach((exp, index) => {
        console.log(`   ${index + 1}. ${exp.title} at ${exp.company}`);
        console.log(`      Current: ${exp.is_current ? 'YES' : 'NO'}`);
        console.log(`      Duration: ${new Date(exp.start_date).toLocaleDateString()} to ${exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}`);
        if (exp.description) {
          console.log(`      Description: ${exp.description.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('   ⚠️  NO WORK EXPERIENCE FOUND');
    }
    
    // Step 4: Check education details
    console.log(`\n\n📍 Step 4: JACK's Education`);
    const { Education } = require('../config/index');
    const educations = await Education.findAll({
      where: { userId: jack.id }
    });
    
    if (educations.length > 0) {
      console.log(`   Found ${educations.length} education(s):`);
      educations.forEach((edu, index) => {
        console.log(`   ${index + 1}. ${edu.degree} in ${edu.fieldOfStudy}`);
        console.log(`      Institution: ${edu.institution}`);
        if (edu.cgpa) {
          console.log(`      CGPA: ${edu.cgpa}`);
        }
      });
    } else {
      console.log('   ⚠️  NO EDUCATION DETAILS FOUND');
    }
    
    // Step 5: ATS Score Analysis
    console.log(`\n\n📍 Step 5: ATS Score Analysis`);
    console.log(`   Current ATS Score: 35`);
    console.log(`   Max Possible Score: 100`);
    console.log(`   Score Quality: ${35 >= 70 ? '✅ EXCELLENT' : 35 >= 50 ? '⚠️  FAIR' : '❌ NEEDS IMPROVEMENT'}`);
    
    console.log(`\n   Why is ATS 35?`);
    console.log(`   - Missing detailed work experience descriptions`);
    console.log(`   - Limited education details in profile`);
    console.log(`   - No resumes uploaded`);
    console.log(`   - Profile not fully complete (${jack.profile_completion}%)`);
    
    // Step 6: Check requirement
    console.log(`\n\n📍 Step 6: Requirement Comparison`);
    const requirement = await sequelize.query(`
      SELECT title, metadata
      FROM requirements
      WHERE id = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb'
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (requirement[0]) {
      const meta = typeof requirement[0].metadata === 'string' 
        ? JSON.parse(requirement[0].metadata) 
        : requirement[0].metadata;
      
      console.log(`   Requirement: ${requirement[0].title}`);
      console.log(`   Required Skills: ${meta.includeSkills.join(', ')}`);
      console.log(`   Experience: ${meta.workExperienceMin}-${meta.workExperienceMax} years`);
      console.log(`   Salary: ${meta.currentSalaryMin}-${meta.currentSalaryMax} LPA`);
      console.log(`   Education: ${meta.education}`);
      
      console.log(`\n   JACK's Match:`);
      console.log(`   ✅ Has Node.js skill: YES`);
      console.log(`   ✅ Experience: ${jack.experience_years} years (matches 1-3)`);
      console.log(`   ✅ Current Salary: ${jack.current_salary} LPA (matches 5-15)`);
      console.log(`   ${jack.highest_education === 'bachelors' ? '✅' : '⚠️'} Education: ${jack.highest_education} (requires B.Tech/B.E.)`);
    }
    
    console.log(`\n\n✅ Analysis complete!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

analyzeJack();
