const { Resume } = require('./models');
const { sequelize } = require('./config/sequelize');

async function checkResume() {
    try {
        const resume = await Resume.findByPk('09adcd93-5c6e-4846-976b-9a1259f51782');
        if (!resume) {
            console.log('❌ Resume not found');
            return;
        }
        console.log('✅ Resume found:');
        console.log(JSON.stringify(resume.toJSON(), null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkResume();
