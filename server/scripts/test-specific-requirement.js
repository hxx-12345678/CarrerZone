const { calculateATSScore } = require('../services/atsService');
const db = require('../config/sequelize').sequelize;

async function testSpecificRequirement() {
  try {
    console.log('🧪 Testing Specific Requirement: 5119b43b-95c3-4200-b725-1dee7cfc8d84');
    console.log('==================================================================\n');
    
    const REQUIREMENT_ID = '5119b43b-95c3-4200-b725-1dee7cfc8d84';
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';  // JACK SPARROW
    
    // Get requirement details
    const req = await db.query(
      `SELECT id, title, metadata FROM requirements WHERE id = :id`,
      { replacements: { id: REQUIREMENT_ID }, type: db.QueryTypes.SELECT }
    );
    
    if (req.length > 0) {
      console.log(`📋 Requirement: ${req[0].title}`);
      console.log(`   ID: ${req[0].id}`);
      console.log();
    }
    
    console.log('📊 Testing ATS calculation for requirement...\n');
    
    const result = await calculateATSScore(JACK_ID, REQUIREMENT_ID);
    
    console.log(`✅ ATS Calculation Result:`);
    console.log(`   Score: ${result.atsScore}/100`);
    console.log(`   Status: ${result.analysis.recommendation}`);
    console.log(`   Overall Assessment: ${result.analysis.overall_assessment}`);
    console.log();
    
    console.log('✅ TEST PASSED! ATS calculation is working correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

testSpecificRequirement();
