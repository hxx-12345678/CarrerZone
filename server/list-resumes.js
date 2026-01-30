const { Resume, User } = require('./models');
const { sequelize } = require('./config/sequelize');

async function listResumes() {
    try {
        const resumes = await Resume.findAll({
            include: [{ model: User, as: 'creator', attributes: ['email'] }]
        });
        console.log(`✅ Found ${resumes.length} resumes:`);
        resumes.forEach(r => {
            console.log(`- ID: ${r.id}, Title: ${r.title}, User: ${r.creator?.email}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

listResumes();
