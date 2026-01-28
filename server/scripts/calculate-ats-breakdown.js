#!/usr/bin/env node

/**
 * Script: Calculate ATS Score Breakdown for JACK
 * ===============================================
 */

const { sequelize, User, Requirement } = require('../config/index');

async function calculateATSScore() {
  try {
    console.log('\n📊 === ATS SCORE BREAKDOWN FOR JACK SPARROW ===\n');
    
    // Get JACK
    const jack = await User.findOne({
      where: { email: 'cptjacksprw@gmail.com' }
    });
    
    // Get requirement
    const requirement = await Requirement.findOne({
      where: { id: 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb' }
    });
    
    const metadata = typeof requirement.metadata === 'string' 
      ? JSON.parse(requirement.metadata) 
      : requirement.metadata;
    
    console.log(`Candidate: ${jack.first_name} ${jack.last_name}`);
    console.log(`Requirement: ${requirement.title}\n`);
    
    let score = 0;
    const breakdown = [];
    
    // 1. SKILLS MATCHING (35 points max)
    console.log('🔹 SKILLS MATCHING (Max: 35 points)');
    const requiredSkills = metadata.includeSkills || [];
    const skillsData = jack.skills;
    const candidateSkills = Array.isArray(skillsData) 
      ? skillsData.map(s => String(s).trim().toLowerCase()) 
      : (typeof skillsData === 'string' 
        ? skillsData.split(',').map(s => s.trim().toLowerCase()) 
        : []);
    
    console.log(`   Required: ${requiredSkills.join(', ')}`);
    console.log(`   JACK Has: ${jack.skills}`);
    
    let matchedSkills = 0;
    requiredSkills.forEach(skill => {
      const matches = candidateSkills.some(cs => 
        cs.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(cs)
      );
      if (matches) {
        console.log(`   ✅ "${skill}" MATCHES`);
        matchedSkills++;
      } else {
        console.log(`   ❌ "${skill}" does not match`);
      }
    });
    
    if (matchedSkills > 0) {
      const percent = (matchedSkills / requiredSkills.length) * 100;
      const points = Math.min(35, (percent / 100) * 35);
      score += points;
      breakdown.push(`Skills (${matchedSkills}/${requiredSkills.length}): ${Math.round(points)} points`);
      console.log(`   Score: ${Math.round(points)} points ✅\n`);
    } else {
      console.log(`   Score: 0 points ❌\n`);
    }
    
    // 2. LOCATION MATCHING (15 points)
    console.log('🔹 LOCATION MATCHING (Max: 15 points)');
    const requiredLocations = metadata.candidateLocations || [];
    if (requiredLocations.length > 0) {
      console.log(`   Required locations: ${requiredLocations.join(', ')}`);
      console.log(`   JACK Location: ${jack.current_location || 'NOT SET'}`);
      console.log(`   Score: 0 points (location not specified in requirement) ℹ️\n`);
    } else {
      console.log(`   No location requirement specified`);
      console.log(`   Score: 0 points (N/A) ℹ️\n`);
    }
    
    // 3. EXPERIENCE MATCHING (15 points)
    console.log('🔹 EXPERIENCE MATCHING (Max: 15 points)');
    const minExp = metadata.workExperienceMin;
    const maxExp = metadata.workExperienceMax;
    const jackExp = jack.experience_years;
    
    console.log(`   Required: ${minExp}-${maxExp} years`);
    console.log(`   JACK Has: ${jackExp} years`);
    
    if (jackExp >= minExp && jackExp <= maxExp) {
      score += 15;
      breakdown.push(`Experience (${jackExp}y): 15 points`);
      console.log(`   ✅ Perfect match! Score: 15 points\n`);
    } else {
      console.log(`   Score: 0 points ❌\n`);
    }
    
    // 4. SALARY MATCHING (10 points)
    console.log('🔹 SALARY MATCHING (Max: 10 points)');
    const minSal = metadata.currentSalaryMin;
    const maxSal = metadata.currentSalaryMax;
    const jackSal = jack.current_salary;
    
    console.log(`   Required: ${minSal}-${maxSal} LPA`);
    console.log(`   JACK Has: ${jackSal} LPA`);
    
    if (jackSal >= minSal && jackSal <= maxSal) {
      score += 10;
      breakdown.push(`Salary (${jackSal} LPA): 10 points`);
      console.log(`   ✅ Perfect match! Score: 10 points\n`);
    } else {
      console.log(`   Score: 0 points ❌\n`);
    }
    
    // 5. EDUCATION MATCHING (10 points)
    console.log('🔹 EDUCATION MATCHING (Max: 10 points)');
    const reqEducation = metadata.education;
    console.log(`   Required: ${reqEducation}`);
    console.log(`   JACK Has: ${jack.highest_education} (${jack.field_of_study})`);
    
    const eduMatches = reqEducation && jack.highest_education && 
      jack.highest_education.toLowerCase().includes('bachelor') || 
      jack.highest_education.toLowerCase().includes('b.tech') ||
      jack.highest_education.toLowerCase().includes('b.e.');
    
    if (eduMatches) {
      score += 10;
      breakdown.push(`Education: 10 points`);
      console.log(`   ✅ Match! Score: 10 points\n`);
    } else {
      console.log(`   Score: 0 points ❌\n`);
    }
    
    // 6. PROFILE QUALITY (8 points max)
    console.log('🔹 PROFILE QUALITY BONUS (Max: 8 points)');
    console.log(`   Profile Completion: ${jack.profile_completion}%`);
    console.log(`   Email Verified: ${jack.is_email_verified ? 'YES' : 'NO'}`);
    console.log(`   Phone Verified: ${jack.is_phone_verified ? 'YES' : 'NO'}`);
    
    let qualityScore = 0;
    if (jack.profile_completion >= 90) {
      qualityScore += 4;
      console.log(`   +4 for profile 90%+`);
    } else if (jack.profile_completion >= 70) {
      qualityScore += 2;
      console.log(`   +2 for profile 70%+`);
    } else {
      console.log(`   +0 for incomplete profile`);
    }
    
    if (jack.is_email_verified && jack.is_phone_verified) {
      qualityScore += 3;
      console.log(`   +3 for verified contact`);
    }
    
    const daysSinceUpdate = jack.last_profile_update 
      ? Math.floor((Date.now() - new Date(jack.last_profile_update).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceUpdate <= 30) {
      qualityScore += 1;
      console.log(`   +1 for recent activity`);
    }
    
    score += qualityScore;
    breakdown.push(`Profile Quality: ${qualityScore} points`);
    console.log(`   Score: ${qualityScore} points\n`);
    
    // FINAL SCORE
    console.log('═══════════════════════════════════════════');
    console.log('📊 FINAL ATS SCORE BREAKDOWN:');
    breakdown.forEach(item => {
      console.log(`   ${item}`);
    });
    console.log(`\n   TOTAL: ${Math.min(100, Math.round(score))} / 100`);
    console.log('═══════════════════════════════════════════');
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS TO IMPROVE ATS SCORE:');
    console.log(`   1. Update profile completion (currently 0%) → Aim for 70%+`);
    console.log(`   2. Verify email and phone (currently: Email ${jack.is_email_verified ? '✅' : '❌'}, Phone ${jack.is_phone_verified ? '✅' : '❌'})`);
    console.log(`   3. Add more work experience details (currently 2 entries)`);
    console.log(`   4. Add more skills to profile`);
    console.log(`   5. Update profile recent (last update: ${daysSinceUpdate} days ago)`);
    
    console.log('\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

calculateATSScore();
