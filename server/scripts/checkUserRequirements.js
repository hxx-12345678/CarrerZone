const { sequelize } = require('../config/sequelize');
const { Requirement, User } = require('../models');
const { Op } = require('sequelize');

async function checkUserRequirements(email) {
  try {
    console.log('🔌 Authenticating to DB...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n👤 Found user: ${user.id} | ${user.email} | ${user.user_type}`);

    const reqs = await Requirement.findAll({ where: { createdBy: user.id }, order: [['created_at', 'DESC']] });
    console.log(`\n📋 Requirements created by ${email}: ${reqs.length}`);

    for (const req of reqs) {
      console.log('\n---');
      console.log(`Requirement ID: ${req.id}`);
      console.log(`Title: ${req.title}`);
      console.log(`Status: ${req.status}`);
      console.log(`Valid Till: ${req.validTill}`);
      console.log(`Skills (required): ${JSON.stringify(req.skills)}`);
      console.log(`Key Skills (preferred): ${JSON.stringify(req.keySkills)}`);
      console.log(`Metadata: ${JSON.stringify(req.metadata)}`);

      // Reproduce minimal matching filters: active jobseekers only
      const metadata = typeof req.metadata === 'string' ? JSON.parse(req.metadata) : (req.metadata || {});
      const candidateLocations = (metadata.candidateLocations && metadata.candidateLocations.length > 0) ? metadata.candidateLocations : [];
      const includeSkills = metadata.includeSkills || req.skills || [];

      const where = {
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      };

      // Build skill condition (candidate must have at least one of includeSkills in their keySkills or resume skills stored)
      const skillConditions = [];
      if (includeSkills && includeSkills.length > 0) {
        includeSkills.forEach(s => {
          // Check keySkills JSONB and metadata includeSkills maybe in candidate's metadata
          skillConditions.push({
            [Op.or]: [
              sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              { summary: { [Op.iLike]: `%${s}%` } }
            ]
          });
        });
      }

      // Location filter
      const locationConditions = [];
      if (candidateLocations && candidateLocations.length > 0) {
        candidateLocations.forEach(loc => {
          locationConditions.push({ current_location: { [Op.iLike]: `%${loc}%` } });
          locationConditions.push(sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.iLike]: `%${loc}%` }));
        });
      }

      // Combine where
      const finalWhere = { ...where };
      const ands = [];
      if (skillConditions.length > 0) {
        ands.push({ [Op.or]: skillConditions });
      }
      if (locationConditions.length > 0) {
        ands.push({ [Op.or]: locationConditions });
      }
      if (ands.length > 0) {
        finalWhere[Op.and] = ands;
      }

      const count = await User.count({ where: finalWhere });
      console.log(`✅ Matching candidates found (approx): ${count}`);

      // For more visibility, list up to 10 matching candidate emails
      const matches = await User.findAll({ where: finalWhere, limit: 10, attributes: ['id', 'email', 'first_name', 'last_name'] });
      console.log('Matching candidate samples:');
      matches.forEach(m => console.log(`${m.id} | ${m.email} | ${m.first_name} ${m.last_name}`));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node checkUserRequirements.js <email>');
    process.exit(1);
  }
  checkUserRequirements(email);
}

module.exports = { checkUserRequirements };