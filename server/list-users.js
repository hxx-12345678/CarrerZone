const { User } = require('./models');
const { sequelize } = require('./config/sequelize');

async function listUsers() {
    try {
        const users = await User.findAll({ limit: 10 });
        console.log(`✅ Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

listUsers();
