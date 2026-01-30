const { Resume } = require('./models');
const { sequelize } = require('./config/sequelize');

async function checkUserResumes() {
    try {
        const resumes = await Resume.findAll({
            where: { userId: 'eda201f3-ef9e-444f-84ef-c4981b21b82e' }
        });
        console.log(`✅ Found ${resumes.length} resumes for user:`);
        resumes.forEach(r => {
            console.log(`- ID: ${r.id}, Title: ${r.title}, Metadata: ${JSON.stringify(r.metadata)}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkUserResumes();
