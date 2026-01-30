const { User } = require('./models');
const { sequelize } = require('./config/sequelize');

async function checkUser() {
    try {
        const user = await User.findOne({
            where: { email: 'aadityamahil1409@gmail.com' }
        });
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        console.log('✅ User found:');
        console.log(`- ID: ${user.id}, Email: ${user.email}`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkUser();
