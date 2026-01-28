const db = require('../config/sequelize').sequelize;
const User = require('../models/User');
const CandidateAnalytics = require('../models/CandidateAnalytics');

async function improveJackProfile() {
  try {
    console.log('🚀 IMPROVING JACK\'S PROFILE');
    console.log('============================\n');
    
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';
    const REQUIREMENT_ID = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    
    // Step 1: Update profile completion
    console.log('📝 Step 1: Updating profile completion...\n');
    await User.update(
      { profile_completion: 75 },  // 75% completion (realistic)
      { where: { id: JACK_ID } }
    );
    console.log('   ✅ Profile completion updated to 75%');
    console.log();
    
    // Step 2: Email verification (simulate)
    console.log('📧 Step 2: Marking email as verified...\n');
    await User.update(
      { is_email_verified: true },
      { where: { id: JACK_ID } }
    );
    console.log('   ✅ Email marked as verified');
    console.log();
    
    // Step 3: Delete old ATS score to force recalculation
    console.log('🗑️  Step 3: Deleting old ATS score...\n');
    const deleteResult = await db.query(
      `DELETE FROM candidate_analytics 
       WHERE user_id = :userId AND requirement_id = :requirementId`,
      { replacements: { userId: JACK_ID, requirementId: REQUIREMENT_ID } }
    );
    console.log(`   ✅ Deleted old ATS score record(s)`);
    console.log();
    
    // Step 4: Verify changes
    console.log('✅ VERIFICATION:');
    const updatedJack = await User.findByPk(JACK_ID, {
      attributes: ['first_name', 'last_name', 'profile_completion', 'is_email_verified', 'is_phone_verified']
    });
    
    console.log(`   Name: ${updatedJack.first_name} ${updatedJack.last_name}`);
    console.log(`   Profile Completion: ${updatedJack.profile_completion}%`);
    console.log(`   Email Verified: ${updatedJack.is_email_verified ? '✅ YES' : '❌ NO'}`);
    console.log(`   Phone Verified: ${updatedJack.is_phone_verified ? '✅ YES' : '❌ NO'}`);
    console.log();
    
    console.log('✅ PROFILE IMPROVEMENTS COMPLETED!');
    console.log();
    console.log('📌 Next: Recalculate ATS Score');
    console.log('   Expected new score: 65-75/100');
    console.log('   (Including profile quality bonus +7 points)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

improveJackProfile();
