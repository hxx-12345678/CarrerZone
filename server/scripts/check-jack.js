#!/usr/bin/env node

/**
 * Check JACK's notice_period
 */

const { sequelize, User } = require('../config/index');

async function check() {
  try {
    const jack = await User.findOne({
      where: { email: 'cptjacksprw@gmail.com' },
      attributes: ['id', 'first_name', 'email', 'notice_period', 'experience_years', 'current_salary']
    });
    
    console.log('\nJACK:');
    console.log('  notice_period:', jack.notice_period);
    console.log('  experience_years:', jack.experience_years);
    console.log('  current_salary:', jack.current_salary);
    
    console.log('\nRequirement wants:');
    console.log('  noticePeriod: Immediately');
    console.log('  experience: 1-3 years');
    console.log('  salary: 5-15 LPA');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

check();
