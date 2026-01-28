const db = require('../config/sequelize').sequelize;
const User = require('../models/User');
const Resume = require('../models/Resume');

async function analyzeATS() {
  try {
    console.log('📊 COMPREHENSIVE ATS SCORE ANALYSIS FOR JACK');
    console.log('==============================================\n');
    
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';
    const REQUIREMENT_ID = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    
    // Get requirement full metadata
    const reqData = await db.query(
      `SELECT metadata FROM requirements WHERE id = :id`,
      { replacements: { id: REQUIREMENT_ID }, type: db.QueryTypes.SELECT }
    );
    const metadata = reqData[0].metadata;
    
    // Get JACK's full data
    const jack = await User.findByPk(JACK_ID);
    
    console.log('👤 JACK SPARROW:');
    console.log(`   Skills: ${jack.skills}`);
    console.log(`   Experience: ${jack.experience_years} years`);
    console.log(`   Salary: ${jack.current_salary} LPA`);
    console.log(`   Notice: ${jack.notice_period} days`);
    console.log(`   Profile Completion: ${jack.profile_completion}%`);
    console.log(`   Email Verified: ${jack.is_email_verified}`);
    console.log(`   Phone Verified: ${jack.is_phone_verified}`);
    console.log();
    
    console.log('📋 REQUIREMENT:');
    console.log(`   Required Skills: ${JSON.stringify(metadata.includeSkills)}`);
    console.log(`   Experience: ${metadata.workExperienceMin}-${metadata.workExperienceMax} years`);
    console.log(`   Salary: ${metadata.currentSalaryMin}-${metadata.currentSalaryMax} LPA`);
    console.log(`   Notice Period: ${metadata.noticePeriod}`);
    console.log(`   Education: ${metadata.education}`);
    console.log();
    
    // Calculate rule-based score
    console.log('📈 RULE-BASED SCORE CALCULATION:');
    console.log();
    
    let ruleScore = 0;
    
    // Skills match
    const requiredSkills = metadata.includeSkills || ['Node.js'];
    const skillsFromDb = jack.skills || [];
    const jackSkillsArray = Array.isArray(skillsFromDb) ? skillsFromDb.map(s => s.toLowerCase()) : [];
    console.log(`   Skills Analysis:`);
    console.log(`   - Required: ${JSON.stringify(requiredSkills)}`);
    console.log(`   - JACK has: ${JSON.stringify(jackSkillsArray)}`);
    
    let skillsMatched = 0;
    requiredSkills.forEach(skill => {
      if (jackSkillsArray.some(js => js.includes(skill.toLowerCase()))) {
        skillsMatched++;
      }
    });
    const skillsScore = Math.round((skillsMatched / requiredSkills.length) * 35);
    ruleScore += skillsScore;
    console.log(`   - Matched: ${skillsMatched}/${requiredSkills.length}`);
    console.log(`   - Points: ${skillsScore}/35`);
    console.log();
    
    // Experience match
    const expInRange = jack.experience_years >= metadata.workExperienceMin && jack.experience_years <= metadata.workExperienceMax;
    const expScore = expInRange ? 15 : 0;
    ruleScore += expScore;
    console.log(`   Experience Analysis:`);
    console.log(`   - JACK: ${jack.experience_years}y`);
    console.log(`   - Range: ${metadata.workExperienceMin}-${metadata.workExperienceMax}y`);
    console.log(`   - Match: ${expInRange ? 'YES' : 'NO'}`);
    console.log(`   - Points: ${expScore}/15`);
    console.log();
    
    // Salary match
    const salaryInRange = jack.current_salary >= metadata.currentSalaryMin && jack.current_salary <= metadata.currentSalaryMax;
    const salaryScore = salaryInRange ? 10 : 0;
    ruleScore += salaryScore;
    console.log(`   Salary Analysis:`);
    console.log(`   - JACK: ${jack.current_salary} LPA`);
    console.log(`   - Range: ${metadata.currentSalaryMin}-${metadata.currentSalaryMax} LPA`);
    console.log(`   - Match: ${salaryInRange ? 'YES' : 'NO'}`);
    console.log(`   - Points: ${salaryScore}/10`);
    console.log();
    
    // Education match
    const educationMatch = jack.highest_education === 'bachelors';
    const eduScore = educationMatch ? 10 : 0;
    ruleScore += eduScore;
    console.log(`   Education Analysis:`);
    console.log(`   - JACK: ${jack.highest_education}`);
    console.log(`   - Required: ${metadata.education}`);
    console.log(`   - Match: ${educationMatch ? 'YES' : 'NO'}`);
    console.log(`   - Points: ${eduScore}/10`);
    console.log();
    
    // Profile Quality
    const profileBonus = jack.profile_completion >= 90 ? 4 : 0;
    const verificationBonus = (jack.is_email_verified && jack.is_phone_verified) ? 3 : 0;
    const qualityScore = profileBonus + verificationBonus;
    ruleScore += qualityScore;
    console.log(`   Profile Quality Analysis:`);
    console.log(`   - Completion: ${jack.profile_completion}% (${profileBonus} points)`);
    console.log(`   - Verifications: ${jack.is_email_verified && jack.is_phone_verified ? 'BOTH' : 'NONE'} (${verificationBonus} points)`);
    console.log(`   - Points: ${qualityScore}/8`);
    console.log();
    
    // Notice period (optional)
    const noticeDaysAllowed = parseInt(metadata.noticePeriod);
    const noticeMatch = jack.notice_period <= noticeDaysAllowed;
    console.log(`   Notice Period Analysis (Optional):`);
    console.log(`   - JACK: ${jack.notice_period} days`);
    console.log(`   - Allowed: ${noticeDaysAllowed} days`);
    console.log(`   - Match: ${noticeMatch ? 'YES' : 'NO'}`);
    console.log();
    
    console.log(`   ✅ RULE-BASED TOTAL: ${ruleScore}/100`);
    console.log();
    
    // Get actual ATS score from DB
    const atsResult = await db.query(
      `SELECT ats_score, last_calculated FROM candidate_analytics WHERE user_id = :uid AND requirement_id = :rid`,
      { replacements: { uid: JACK_ID, rid: REQUIREMENT_ID }, type: db.QueryTypes.SELECT }
    );
    
    if (atsResult.length > 0) {
      const actualScore = atsResult[0].ats_score;
      console.log('🤖 AI-BASED SCORE (From Database):');
      console.log(`   Score: ${actualScore}/100`);
      console.log(`   Calculated: ${new Date(atsResult[0].last_calculated).toLocaleString()}`);
      console.log();
      
      console.log('📊 COMPARISON:');
      console.log(`   Rule-Based: ${ruleScore}`);
      console.log(`   AI-Based: ${actualScore}`);
      console.log(`   Difference: ${Math.abs(ruleScore - actualScore)} points`);
      console.log();
      
      // Why the difference?
      console.log('🔍 POSSIBLE REASONS FOR ${actualScore} SCORE:');
      if (actualScore === 35) {
        console.log(`   1. Skills points: ${skillsScore}/35 → Makes ${skillsScore} points`);
        console.log(`   2. AI may have deducted for:`);
        console.log(`      - 0% profile completion: -4 points`);
        console.log(`      - No email/phone verification: -3 points`);
        console.log(`      - Mismatched or wrong resumes in profile`);
        console.log(`      - Resume extraction failed (using fallback)`);
        console.log(`      - Wrong resume data analyzed by Gemini`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

analyzeATS();
