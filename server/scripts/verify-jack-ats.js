const db = require('../config/sequelize').sequelize;
const User = require('../models/User');
const CandidateAnalytics = require('../models/CandidateAnalytics');
const Requirement = require('../models/Requirement');

async function verifyJackATSScore() {
  try {
    console.log('🔍 JACK SPARROW - ATS Score Verification');
    console.log('=========================================\n');
    
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';
    const REQUIREMENT_ID = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    
    // Fetch JACK's profile
    console.log('📝 Step 1: Fetching JACK\'s profile...\n');
    const jack = await User.findByPk(JACK_ID, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'experience_years', 'current_salary', 'expected_salary', 'notice_period', 'skills', 'education', 'highest_education', 'headline', 'summary', 'profile_completion', 'is_email_verified', 'is_phone_verified']
    });
    
    if (!jack) {
      console.log('❌ JACK not found');
      return;
    }
    
    console.log('✅ JACK\'s Profile:');
    console.log(`   Name: ${jack.first_name} ${jack.last_name}`);
    console.log(`   Email: ${jack.email}`);
    console.log(`   Experience: ${jack.experience_years} years`);
    console.log(`   Current Salary: ${jack.current_salary} LPA`);
    console.log(`   Expected Salary: ${jack.expected_salary} LPA`);
    console.log(`   Notice Period: ${jack.notice_period} days`);
    console.log(`   Skills: ${jack.skills}`);
    console.log(`   Education: ${jack.education}`);
    console.log(`   Highest Education: ${jack.highest_education}`);
    console.log(`   Headline: ${jack.headline}`);
    console.log(`   Summary: ${jack.summary}`);
    console.log(`   Profile Completion: ${jack.profile_completion}%`);
    console.log(`   Email Verified: ${jack.is_email_verified}`);
    console.log(`   Phone Verified: ${jack.is_phone_verified}`);
    console.log();
    
    // Fetch requirement
    console.log('📋 Step 2: Fetching requirement details...\n');
    const requirement = await Requirement.findByPk(REQUIREMENT_ID);
    if (!requirement) {
      console.log('❌ Requirement not found');
      return;
    }
    
    console.log('✅ Requirement: Software Developer');
    console.log(`   Experience: ${requirement.experienceMin}-${requirement.experienceMax} years`);
    console.log(`   Salary: ${requirement.salaryMin}-${requirement.salaryMax} LPA`);
    console.log(`   Skills: ${requirement.skills}`);
    console.log(`   Education: ${requirement.metadata?.education || 'Not specified'}`);
    console.log();
    
    // Fetch ATS score
    console.log('📊 Step 3: Fetching ATS score from database...\n');
    const atsRecord = await db.query(
      `SELECT user_id, requirement_id, ats_score, last_calculated 
       FROM candidate_analytics 
       WHERE user_id = :userId AND requirement_id = :requirementId`,
      {
        replacements: { userId: JACK_ID, requirementId: REQUIREMENT_ID },
        type: db.QueryTypes.SELECT
      }
    );
    
    if (atsRecord.length > 0) {
      const ats = atsRecord[0];
      console.log('✅ ATS Score Found:');
      console.log(`   Score: ${ats.ats_score}/100`);
      console.log(`   Last Calculated: ${new Date(ats.last_calculated).toLocaleString()}`);
      console.log();
      
      // Analyze score
      console.log('📈 Step 4: Score Analysis...\n');
      console.log('Expected Score Breakdown (Rule-Based):');
      
      let expectedScore = 0;
      
      // Skills (35 points max)
      const skillsMatch = jack.skills && jack.skills.includes('Node.js') ? 1 : 0;
      const skillsPoints = Math.round((skillsMatch / 1) * 35);
      expectedScore += skillsPoints;
      console.log(`   ✓ Skills Match (1/1): ${skillsPoints} points`);
      
      // Experience (15 points)
      const expInRange = jack.experience_years >= requirement.experienceMin && jack.experience_years <= requirement.experienceMax;
      const expPoints = expInRange ? 15 : 0;
      expectedScore += expPoints;
      console.log(`   ✓ Experience (${jack.experience_years}y in ${requirement.experienceMin}-${requirement.experienceMax}y): ${expPoints} points`);
      
      // Salary (10 points)
      const salaryInRange = jack.current_salary >= requirement.salaryMin && jack.current_salary <= requirement.salaryMax;
      const salaryPoints = salaryInRange ? 10 : 0;
      expectedScore += salaryPoints;
      console.log(`   ✓ Salary (${jack.current_salary} LPA in ${requirement.salaryMin}-${requirement.salaryMax}): ${salaryPoints} points`);
      
      // Education (10 points)
      const educationMatch = jack.highest_education === 'bachelors';
      const eduPoints = educationMatch ? 10 : 0;
      expectedScore += eduPoints;
      console.log(`   ✓ Education (${jack.highest_education}): ${eduPoints} points`);
      
      // Profile Quality (8 points max)
      let qualityPoints = 0;
      const profileCompletionBonus = jack.profile_completion >= 90 ? 4 : 0;
      const verificationBonus = (jack.is_email_verified && jack.is_phone_verified) ? 3 : 0;
      qualityPoints = profileCompletionBonus + verificationBonus;
      expectedScore += qualityPoints;
      console.log(`   ✓ Profile Quality (${jack.profile_completion}% completion, ${jack.is_email_verified && jack.is_phone_verified ? 'verified' : 'not verified'}): ${qualityPoints} points`);
      
      // Notice Period (4 points - optional filter)
      const noticeMatch = jack.notice_period <= 60; // Requirement metadata specifies 60 days
      const noticePoints = noticeMatch ? 4 : 0;
      console.log(`   ✓ Notice Period (${jack.notice_period} days): ${noticePoints} points (optional filter)`);
      
      console.log();
      console.log(`   EXPECTED TOTAL (Rule-Based): ${expectedScore} points`);
      console.log(`   ACTUAL SCORE (Database): ${ats.ats_score} points`);
      console.log(`   DIFFERENCE: ${Math.abs(expectedScore - ats.ats_score)} points`);
      console.log();
      
      // Assessment
      if (ats.ats_score >= 65) {
        console.log('✅ ASSESSMENT: Strong Candidate - Score is GOOD');
      } else if (ats.ats_score >= 50) {
        console.log('⚠️ ASSESSMENT: Moderate Candidate - Score could be improved');
      } else if (ats.ats_score >= 35) {
        console.log('⚠️ ASSESSMENT: Below Average Candidate - Score is LOW');
      } else {
        console.log('❌ ASSESSMENT: Poor Candidate Match - Score is VERY LOW');
      }
      
    } else {
      console.log('❌ No ATS score found for this candidate and requirement');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

verifyJackATSScore();
