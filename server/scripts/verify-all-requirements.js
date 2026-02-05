#!/usr/bin/env node

/**
 * Script: Verify All Requirements
 * Checks matching candidate counts for every requirement in the DB
 * Usage:
 *  NODE_ENV=production DATABASE_URL='<url>' node server/scripts/verify-all-requirements.js
 */

const { sequelize } = require('../config/sequelize');
const { Requirement, User } = require('../models');
const { Op } = require('sequelize');

async function verify() {
  try {
    console.log('🔌 Authenticating to DB...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const requirements = await Requirement.findAll({ order: [['created_at', 'DESC']] });
    console.log(`\n📋 Total requirements found: ${requirements.length}\n`);

    for (const req of requirements) {
      console.log('---');
      console.log(`Requirement: ${req.title} (${req.id}) [status=${req.status}]`);
      const metadata = typeof req.metadata === 'string' ? JSON.parse(req.metadata) : (req.metadata || {});

      const includeSkills = (metadata.includeSkills && metadata.includeSkills.length > 0) ? metadata.includeSkills : (req.skills || []);
      const candidateLocations = (metadata.candidateLocations && metadata.candidateLocations.length > 0) ? metadata.candidateLocations : [];

      // Base where
      const where = {
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      };

      const ands = [];

      // Skills
      if (includeSkills && includeSkills.length > 0) {
        const skillConditions = includeSkills.map(s => ({
          [Op.or]: [
            sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${s}%` }),
            sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${s}%` }),
            { summary: { [Op.iLike]: `%${s}%` } }
          ]
        }));
        ands.push({ [Op.or]: skillConditions });
      }

      // Locations
      if (candidateLocations && candidateLocations.length > 0) {
        const locationConditions = [];
        candidateLocations.forEach(loc => {
          locationConditions.push({ current_location: { [Op.iLike]: `%${loc}%` } });
          locationConditions.push(sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.iLike]: `%${loc}%` }));
        });
        ands.push({ [Op.or]: locationConditions });
      }

      // Experience range
      if (metadata.workExperienceMin !== undefined) {
        ands.push({ experience_years: { [Op.and]: [{ [Op.gte]: Number(metadata.workExperienceMin) }, { [Op.lte]: Number(metadata.workExperienceMax || 100) }] } });
      }

      // Salary range (current_salary in LPA or stored as decimal)
      if (metadata.currentSalaryMin !== undefined) {
        ands.push({ current_salary: { [Op.and]: [{ [Op.gte]: Number(metadata.currentSalaryMin) }, { [Op.lte]: Number(metadata.currentSalaryMax || 1000) }] } });
      }

      const finalWhere = { ...where };
      if (ands.length > 0) finalWhere[Op.and] = ands;

      const count = await User.count({ where: finalWhere });
      console.log(`Matching candidates (count): ${count}`);

      const samples = await User.findAll({ where: finalWhere, attributes: ['id', 'email', 'first_name', 'last_name', 'experience_years', 'current_salary'], limit: 5 });
      if (samples.length > 0) {
        console.log('Sample matches:');
        samples.forEach(s => console.log(` - ${s.id} | ${s.email} | ${s.first_name || ''} ${s.last_name || ''} | exp:${s.experience_years || 'N/A'} | sal:${s.current_salary || 'N/A'}`));
      } else {
        console.log('No sample matches returned for this requirement.');

        // Controlled relaxed fallback: remove experience and salary constraints if present
        const hasStrictCriteria = (metadata && ((metadata.includeSkills && metadata.includeSkills.length>0) || (metadata.candidateLocations && metadata.candidateLocations.length>0) || (metadata.workExperienceMin !== undefined && metadata.workExperienceMin !== null) || (metadata.currentSalaryMin !== undefined && metadata.currentSalaryMin !== null)));
        if (count === 0 && hasStrictCriteria) {
          console.log('⚠️ No strict matches. Trying relaxed fallback (ignore experience & salary)...');
          const baseWhere = { user_type: 'jobseeker', is_active: true, account_status: 'active' };
          const relaxAnds = [];

          // Skills
          const relaxedSkillConds = [];
          (includeSkills || []).forEach(s => {
            if (!s) return;
            relaxedSkillConds.push({ [Op.or]: [
              sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              { summary: { [Op.iLike]: `%${s}%` } }
            ]});
          });
          if (relaxedSkillConds.length>0) relaxAnds.push({ [Op.or]: relaxedSkillConds });

          // Locations
          const relaxLocs = [];
          (candidateLocations || []).forEach(loc => {
            if (!loc) return;
            relaxLocs.push({ current_location: { [Op.iLike]: `%${loc}%` } });
            relaxLocs.push(sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.iLike]: `%${loc}%` }));
          });
          if (relaxLocs.length>0) relaxAnds.push({ [Op.or]: relaxLocs });

          const relaxedWhere = { ...baseWhere };
          if (relaxAnds.length>0) relaxedWhere[Op.and] = relaxAnds;

          const relaxedCount = await User.count({ where: relaxedWhere });
          console.log(`Relaxed fallback matches: ${relaxedCount}`);
          if (relaxedCount>0) {
            const relaxedSamples = await User.findAll({ where: relaxedWhere, attributes: ['id','email','first_name','last_name','experience_years','current_salary'], limit: 5 });
            console.log('Relaxed samples:');
            relaxedSamples.forEach(s => console.log(` - ${s.id} | ${s.email} | ${s.first_name || ''} ${s.last_name || ''} | exp:${s.experience_years || 'N/A'} | sal:${s.current_salary || 'N/A'}`));
          }
        }
      }
    }

    console.log('\n✅ Verification completed');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error during verification:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) verify();
module.exports = { verify };
