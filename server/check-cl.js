const { CoverLetter } = require('./models');
const { sequelize } = require('./config/sequelize');

async function checkCoverLetter() {
    try {
        const cl = await CoverLetter.findByPk('09adcd93-5c6e-4846-976b-9a1259f51782');
        if (!cl) {
            console.log('❌ Cover letter not found');
            return;
        }
        console.log('✅ Cover letter found:');
        console.log(JSON.stringify(cl.toJSON(), null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkCoverLetter();
