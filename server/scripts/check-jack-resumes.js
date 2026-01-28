const db = require('../config/sequelize').sequelize;

async function checkJackResumes() {
  try {
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';
    
    const resumes = await db.query(
      `SELECT id, user_id, title, is_primary, created_at 
       FROM resumes 
       WHERE user_id = :userId`,
      {
        replacements: { userId: JACK_ID },
        type: db.QueryTypes.SELECT
      }
    );
    
    console.log(`🗂️  JACK SPARROW'S RESUMES (${JACK_ID})`);
    console.log('==========================================\n');
    
    if (resumes.length === 0) {
      console.log('❌ No resumes found!');
    } else {
      resumes.forEach((resume, index) => {
        console.log(`${index + 1}. ${resume.title}`);
        console.log(`   ID: ${resume.id}`);
        console.log(`   Primary: ${resume.is_primary ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(resume.created_at).toLocaleString()}`);
        console.log();
      });
    }
    
    // Also check whose resumes these are
    console.log('\n📋 CHECKING WHO THESE RESUMES BELONG TO:\n');
    
    for (const resume of resumes) {
      const owner = await db.query(
        `SELECT id, first_name, last_name, email FROM users WHERE id = :userId`,
        {
          replacements: { userId: resume.user_id },
          type: db.QueryTypes.SELECT
        }
      );
      
      if (owner.length > 0) {
        console.log(`Resume: "${resume.title}"`);
        console.log(`   Owner: ${owner[0].first_name} ${owner[0].last_name} (${owner[0].email})`);
        console.log(`   ID: ${owner[0].id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

checkJackResumes();
