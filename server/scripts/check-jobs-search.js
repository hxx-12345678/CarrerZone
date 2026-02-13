'use strict';

const { sequelize } = require('../config/sequelize');
const Job = require('../models/Job');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB: connected');

    // Check Job table schema and some records
    const jobs = await Job.findAll({ limit: 5 });
    console.log('\nSAMPLE JOBS:');
    console.log(JSON.stringify(jobs.map(j => ({
      title: j.title,
      category: j.category,
      industry: j.industry,
      location: j.location,
      jobType: j.jobType,
      experience: j.experience,
      salaryRange: j.salaryRange,
      status: j.status
    })), null, 2));

    // Get unique categories and industries
    const categories = await Job.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      where: { status: 'active' }
    });
    console.log('\nUNIQUE CATEGORIES (active):');
    console.log(categories.map(c => c.category).filter(Boolean));

    const industries = await Job.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('industrytype')), 'industryType']],
      where: { status: 'active' }
    });
    console.log('\nUNIQUE INDUSTRIES (active):');
    console.log(industries.map(i => i.industryType).filter(Boolean));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking jobs:', error);
    process.exit(1);
  }
})();
