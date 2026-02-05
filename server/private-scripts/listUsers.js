const { sequelize } = require('../config/sequelize');
const { User } = require('../models');

async function listUsers() {
  try {
    console.log('🔌 Authenticating to DB...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const users = await User.findAll({
      attributes: ['id', 'email', 'user_type', 'created_at', 'first_name', 'last_name', 'is_active'],
      order: [['created_at', 'DESC']],
      limit: 10000
    });

    console.log(`\n📋 Total users: ${users.length}\n`);

    users.forEach((u) => {
      const created = u.created_at ? new Date(u.created_at).toISOString() : 'N/A';
      console.log(`${u.id} | ${u.email} | ${u.user_type} | ${u.is_active ? 'Active' : 'Inactive'} | ${created} | ${u.first_name || ''} ${u.last_name || ''}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error listing users:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  listUsers();
}

module.exports = { listUsers };