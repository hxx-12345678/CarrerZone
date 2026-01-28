const db = require('../config/sequelize').sequelize;
const { calculateATSScore } = require('../services/atsService');

async function testATSCalculationForAllRequirements() {
  try {
    console.log('🧪 TEST: ATS Calculation for Multiple Requirements');
    console.log('==================================================\n');
    
    // Get a few requirements
    const requirements = await db.query(
      `SELECT id, title FROM requirements LIMIT 5`,
      { type: db.QueryTypes.SELECT }
    );
    
    console.log(`📋 Found ${requirements.length} requirements to test:\n`);
    
    // Get some jobseeker candidates
    const candidates = await db.query(
      `SELECT id, first_name, last_name FROM users WHERE user_type = 'jobseeker' AND is_active = true LIMIT 3`,
      { type: db.QueryTypes.SELECT }
    );
    
    if (candidates.length === 0) {
      console.log('⚠️ No candidates found to test');
      await db.close();
      return;
    }
    
    console.log(`👥 Found ${candidates.length} candidates to test:\n`);
    candidates.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.first_name} ${c.last_name} (ID: ${c.id})`);
    });
    console.log();
    
    // Test ATS calculation for each requirement-candidate pair
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let req of requirements) {
      console.log(`\n📌 Testing Requirement: ${req.title} (${req.id})`);
      
      for (let cand of candidates.slice(0, 1)) {  // Test with first candidate only
        try {
          console.log(`   📊 Calculating ATS for ${cand.first_name}...`);
          
          const result = await calculateATSScore(cand.id, req.id);
          
          console.log(`   ✅ SUCCESS: ATS Score = ${result.atsScore}/100`);
          successCount++;
        } catch (error) {
          console.log(`   ❌ ERROR: ${error.message}`);
          errorCount++;
          errors.push({
            requirement: req.title,
            candidate: `${cand.first_name} ${cand.last_name}`,
            error: error.message
          });
        }
      }
    }
    
    console.log(`\n\n📊 TEST SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      errors.forEach(e => {
        console.log(`   - ${e.requirement} × ${e.candidate}: ${e.error}`);
      });
    } else {
      console.log(`\n✅ ALL TESTS PASSED!`);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await db.close();
  }
}

testATSCalculationForAllRequirements();
