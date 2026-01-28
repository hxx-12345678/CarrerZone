const db = require('../config/sequelize').sequelize;

async function checkRequirement() {
  try {
    const result = await db.query(
      `SELECT id, title, required_skills, preferred_skills, experience_min, experience_max, salary_min, salary_max, metadata 
       FROM requirements 
       WHERE id = 'd73babb4-2f4f-4f0c-ad13-6cd64e58cbcb'`,
      {
        type: db.QueryTypes.SELECT
      }
    );
    
    console.log('📋 Requirement Details from Database:');
    console.log(JSON.stringify(result[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

checkRequirement();
