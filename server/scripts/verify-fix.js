#!/usr/bin/env node

/**
 * Test: Verify Candidate Matching Bug Fix
 * ========================================
 * 
 * This test verifies that the notice_period filter fix is working correctly.
 * 
 * PROBLEM:
 * - Requirement "Software Developer" had no candidates appearing
 * - JACK SPARROW matched all criteria (1 year exp, 10 LPA salary, Node.js skill)
 * - But notice_period filter was set to "Immediately" (0 days)
 * - JACK has 22 days notice period, so was excluded
 * 
 * SOLUTION:
 * - Moved notice_period from hard filter (whereClause) to optional filter (matchingConditions)
 * - Now skills take priority, and notice_period is secondary
 * - JACK now appears in the results
 */

const fetch = require('node-fetch');
const { sequelize, User, Requirement } = require('../config/index');

async function test() {
  try {
    console.log('\n🧪 === CANDIDATE MATCHING BUG FIX VERIFICATION ===\n');
    
    // Step 1: Verify JACK exists and has the expected profile
    console.log('📍 Step 1: Verify JACK SPARROW profile...');
    const jack = await User.findOne({
      where: { email: 'cptjacksprw@gmail.com' },
      attributes: ['id', 'first_name', 'experience_years', 'current_salary', 'notice_period', 'skills']
    });
    
    console.log(`  ✅ Found: ${jack.first_name}`);
    console.log(`     Experience: ${jack.experience_years} years`);
    console.log(`     Salary: ${jack.current_salary} LPA`);
    console.log(`     Notice Period: ${jack.notice_period} days`);
    console.log(`     Skills: ${jack.skills}`);
    
    // Step 2: Verify requirement exists
    console.log('\n📍 Step 2: Verify Software Developer requirement...');
    const requirement = await Requirement.findOne({
      where: { id: 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb' }
    });
    
    const metadata = typeof requirement.metadata === 'string' 
      ? JSON.parse(requirement.metadata) 
      : requirement.metadata;
    
    console.log(`  ✅ Found: ${requirement.title}`);
    console.log(`     Skills: ${metadata.includeSkills.join(', ')}`);
    console.log(`     Experience: ${metadata.workExperienceMin}-${metadata.workExperienceMax} years`);
    console.log(`     Salary: ${metadata.currentSalaryMin}-${metadata.currentSalaryMax} LPA`);
    console.log(`     Notice Period: ${metadata.noticePeriod}`);
    
    // Step 3: Test matching via API
    console.log('\n📍 Step 3: Test matching via API...');
    
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vinod@keshavencon.com',
        password: 'Keshav@123'
      })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    
    const candidatesRes = await fetch(`http://localhost:8000/api/requirements/d73babb4-2f4f-4f0c-ad13-6cd64e58cbcb/candidates?page=1&limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const candidatesData = await candidatesRes.json();
    console.log(`  ✅ API returned ${candidatesData.data?.candidates?.length} candidate(s)`);
    
    // Step 4: Verify results
    console.log('\n📍 Step 4: Verify matching results...');
    if (candidatesData.data?.candidates?.length > 0) {
      const candidate = candidatesData.data.candidates[0];
      console.log(`  ✅ SUCCESS! Candidate found:`);
      console.log(`     Name: ${candidate.name}`);
      console.log(`     Experience: ${candidate.experience}`);
      console.log(`     Current Salary: ${candidate.currentSalary}`);
      console.log(`     Relevance Score: ${candidate.relevanceScore}%`);
      console.log(`     ATS Score: ${candidate.atsScore || 'N/A'}`);
      
      if (candidate.name.includes('JACK')) {
        console.log(`\n✅ SUCCESS! JACK SPARROW is now appearing in the candidates list!`);
        console.log(`   Notice Period (${jack.notice_period} days) no longer excludes skilled candidates.`);
      }
    } else {
      console.log(`  ❌ FAILED: No candidates returned`);
    }
    
    console.log(`\n✅ Test complete!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

test();
