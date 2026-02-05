#!/usr/bin/env node

const { sequelize } = require('../config/sequelize');
const { User } = require('../models');

async function show(identifier) {
  try {
    await sequelize.authenticate();
    const where = identifier.includes('@') ? { email: identifier } : { id: identifier };
    const user = await User.findOne({ where });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log(`User: ${user.id} | ${user.email}`);
    console.log('first_name:', user.first_name);
    console.log('last_name:', user.last_name);
    console.log('experience_years:', user.experience_years);
    console.log('current_salary:', user.current_salary);
    console.log('key_skills:', JSON.stringify(user.key_skills || user.skills || []));
    console.log('preferred_locations:', JSON.stringify(user.preferred_locations));
    console.log('profile_completion:', user.profile_completion);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node show-user.js <email|id>');
    process.exit(1);
  }
  show(id);
}

module.exports = { show };
