const { Resume } = require('./models');
const { sequelize } = require('./config/sequelize');

async function findResumeByFilename() {
    try {
        const resumes = await Resume.findAll();
        const targetFilename = 'resume-1769587313357-339428608.pdf';

        const found = resumes.find(r => r.metadata?.filename === targetFilename);
        if (!found) {
            console.log('❌ Resume with that filename not found in DB');
            return;
        }
        console.log('✅ Found Resume:');
        console.log(JSON.stringify(found.toJSON(), null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

findResumeByFilename();
