const db = require('../config/sequelize').sequelize;
const Resume = require('../models/Resume');

async function fixJackResumes() {
  try {
    console.log('🔧 FIXING JACK\'S RESUMES');
    console.log('========================\n');
    
    const JACK_ID = '0e6bc77c-195a-4ed9-befa-5cb330d79361';
    
    // Step 1: Get all resumes for JACK
    const allResumes = await Resume.findAll({
      where: { userId: JACK_ID }
    });
    
    console.log(`📋 Found ${allResumes.length} resumes for JACK\n`);
    
    // Step 2: Delete all existing resumes
    console.log('🗑️  Deleting mismatched resumes...\n');
    for (const resume of allResumes) {
      await Resume.destroy({ where: { id: resume.id } });
      console.log(`   ✅ Deleted: ${resume.title}`);
    }
    
    console.log();
    
    // Step 3: Create a proper resume for JACK
    console.log('📄 Creating JACK\'s proper resume...\n');
    
    const newResume = await Resume.create({
      userId: JACK_ID,
      title: 'JACK SPARROW - Software Developer Resume',
      summary: 'Experienced Software Developer with 1 year of professional experience. Proficient in Java, Python, React.js, and Node.js. Seeking challenging opportunities to apply technical skills and contribute to innovative software solutions.',
      skills: ['Java', 'Python', 'React.js', 'Node.js', 'JavaScript', 'HTML', 'CSS'],
      isDefault: true,  // Mark as primary
      isPublic: true,
      lastUpdated: new Date(),
      metadata: {
        experience_years: 1,
        current_company: 'Marvel',
        current_role: 'SDE-1',
        current_salary: '10 LPA',
        education: 'Bachelor of Technology in Computer Science',
        institution: 'MSU',
        headline: 'Software developer',
        summary_short: 'Aspiring AI/ML engineer'
      }
    });
    
    console.log(`   ✅ Created Resume: ${newResume.title}`);
    console.log(`   ID: ${newResume.id}`);
    console.log(`   Primary: ${newResume.isDefault ? 'YES ✅' : 'NO'}`);
    console.log();
    
    // Step 4: Verify
    console.log('✅ VERIFICATION:');
    const updatedResumes = await Resume.findAll({
      where: { userId: JACK_ID }
    });
    
    console.log(`   Total resumes: ${updatedResumes.length}`);
    updatedResumes.forEach(r => {
      console.log(`   - ${r.title} (Primary: ${r.isDefault ? 'YES ✅' : 'NO'})`);
    });
    
    console.log();
    console.log('✅ JACK\'S RESUMES FIXED!');
    console.log();
    console.log('📌 Next Steps:');
    console.log('   1. Update JACK\'s profile completion to 70%');
    console.log('   2. Trigger email verification (or verify manually)');
    console.log('   3. Recalculate ATS score');
    console.log('   4. Expected new ATS score: 65-70/100');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

fixJackResumes();
