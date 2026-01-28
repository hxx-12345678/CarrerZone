const axios = require('axios');
const db = require('../config/sequelize').sequelize;

async function recalculateATSScore() {
  try {
    console.log('🔄 RECALCULATING ATS SCORE FOR JACK');
    console.log('====================================\n');
    
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';
    const REQUIREMENT_ID = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb';
    
    // Import the ATS service
    const { calculateATSScore } = require('../services/atsService');
    
    console.log('📊 Step 1: Triggering ATS calculation via atsService...\n');
    
    const result = await calculateATSScore(JACK_ID, REQUIREMENT_ID);
    
    console.log('✅ ATS Calculation Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log();
    
    // Fetch from database
    console.log('📋 Step 2: Verifying score in database...\n');
    
    const atsRecord = await db.query(
      `SELECT user_id, requirement_id, ats_score, last_calculated FROM candidate_analytics 
       WHERE user_id = :userId AND requirement_id = :requirementId`,
      { replacements: { userId: JACK_ID, requirementId: REQUIREMENT_ID }, type: db.QueryTypes.SELECT }
    );
    
    if (atsRecord.length > 0) {
      const ats = atsRecord[0];
      console.log(`✅ ATS Score Saved:`);
      console.log(`   Score: ${ats.ats_score}/100`);
      console.log(`   Last Calculated: ${new Date(ats.last_calculated).toLocaleString()}`);
      console.log();
      
      if (ats.ats_score >= 65) {
        console.log('🎉 EXCELLENT! JACK\'S ATS SCORE IS NOW OPTIMAL!');
        console.log(`   Score: ${ats.ats_score}/100`);
        console.log(`   Previous: 35/100 → Current: ${ats.ats_score}/100`);
        console.log(`   Improvement: +${ats.ats_score - 35} points`);
      } else if (ats.ats_score >= 50) {
        console.log('✅ GOOD IMPROVEMENT!');
        console.log(`   Score: ${ats.ats_score}/100`);
        console.log(`   Previous: 35/100 → Current: ${ats.ats_score}/100`);
        console.log(`   Improvement: +${ats.ats_score - 35} points`);
      }
    } else {
      console.log('⚠️ ATS score not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

recalculateATSScore();
