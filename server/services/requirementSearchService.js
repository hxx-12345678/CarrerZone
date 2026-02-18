const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Requirement Search Service - Unified searching logic for candidates
 */
const requirementSearchService = {
    /**
     * Extract search criteria from a requirement and its metadata
     */
    extractCriteria(requirement, queryParams = {}) {
        const metadata = typeof requirement.metadata === 'string'
            ? JSON.parse(requirement.metadata)
            : (requirement.metadata || {});

        // Extract experience
        let workExperienceMin = queryParams.filterExperienceMin !== undefined
            ? Number(queryParams.filterExperienceMin)
            : (metadata.workExperienceMin || metadata.experienceMin || requirement.experienceMin || null);

        let workExperienceMax = queryParams.filterExperienceMax !== undefined
            ? Number(queryParams.filterExperienceMax)
            : (metadata.workExperienceMax || metadata.experienceMax || requirement.experienceMax || null);

        // Parse experience from string if needed
        if (workExperienceMin === null && metadata.experience) {
            const expMatch = String(metadata.experience).match(/(\d+)(?:\s*-\s*(\d+))?/);
            if (expMatch) {
                workExperienceMin = parseInt(expMatch[1]);
                if (expMatch[2]) workExperienceMax = parseInt(expMatch[2]);
            }
        }

        // Extract salary
        let currentSalaryMin = queryParams.filterSalaryMin !== undefined
            ? Number(queryParams.filterSalaryMin)
            : (metadata.currentSalaryMin || metadata.salaryMin || requirement.currentSalaryMin || requirement.salaryMin || null);

        let currentSalaryMax = queryParams.filterSalaryMax !== undefined
            ? Number(queryParams.filterSalaryMax)
            : (metadata.currentSalaryMax || metadata.salaryMax || requirement.currentSalaryMax || requirement.salaryMax || null);

        // Parse salary from string if needed
        if (currentSalaryMin === null && metadata.salary) {
            const salMatch = String(metadata.salary).match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
            if (salMatch) {
                currentSalaryMin = parseFloat(salMatch[1]);
                if (salMatch[2]) currentSalaryMax = parseFloat(salMatch[2]);
            }
        }

        // Skills
        const includeSkills = [...new Set([
            ...(requirement.skills || []),
            ...(requirement.keySkills || []),
            ...(metadata.includeSkills || []),
            ...(queryParams.filterSkillsInclude ? queryParams.filterSkillsInclude.split(',') : [])
        ])].filter(Boolean);

        const excludeSkills = [...new Set([
            ...(metadata.excludeSkills || requirement.excludeSkills || []),
            ...(queryParams.filterSkillsExclude ? queryParams.filterSkillsExclude.split(',') : [])
        ])].filter(Boolean);

        // Locations
        let candidateLocations = [...new Set([
            ...(metadata.candidateLocations || requirement.candidateLocations || []),
            ...(queryParams.filterLocationInclude ? queryParams.filterLocationInclude.split(',') : [])
        ])].filter(Boolean);

        const excludeLocations = [...new Set([
            ...(metadata.excludeLocations || []),
            ...(metadata.exclude_locations || []),
            ...(queryParams.filterLocationExclude ? queryParams.filterLocationExclude.split(',') : [])
        ])].filter(Boolean);

        // Other fields
        const candidateDesignations = (metadata.candidateDesignations || requirement.candidateDesignations || []);
        const education = metadata.education || requirement.education || null;
        const institute = metadata.institute || requirement.institute || null;
        const noticePeriod = metadata.noticePeriod || requirement.noticePeriod || null;
        const diversityPreference = metadata.diversityPreference || requirement.diversityPreference || null;
        const currentDesignation = metadata.currentDesignation || requirement.currentDesignation || null;
        const currentCompany = metadata.currentCompany || requirement.currentCompany || null;
        const includeWillingToRelocate = metadata.includeWillingToRelocate || false;
        const includeNotMentioned = metadata.includeNotMentioned || false;
        const lastActive = queryParams.filterLastActive || metadata.lastActive || null;

        return {
            workExperienceMin,
            workExperienceMax,
            currentSalaryMin,
            currentSalaryMax,
            includeSkills,
            excludeSkills,
            candidateLocations,
            excludeLocations,
            candidateDesignations,
            education,
            institute,
            noticePeriod,
            diversityPreference,
            currentDesignation,
            currentCompany,
            includeWillingToRelocate,
            includeNotMentioned,
            lastActive,
            search: queryParams.search || queryParams.filterKeyword || null
        };
    },

    /**
     * Build the Sequelize where clause based on criteria
     */
    buildWhereClause(criteria, requirementTitle) {
        const whereClause = {
            user_type: 'jobseeker',
            is_active: true,
            account_status: 'active'
        };

        const allAndConditions = [];
        const matchingConditions = [];

        // 1. Experience
        if (criteria.workExperienceMin !== null) {
            const min = Number(criteria.workExperienceMin);
            const max = criteria.workExperienceMax !== null ? Number(criteria.workExperienceMax) : 50;
            allAndConditions.push({
                experience_years: {
                    [Op.and]: [{ [Op.gte]: min }, { [Op.lte]: max }]
                }
            });
        }

        // 2. Salary
        if (criteria.currentSalaryMin !== null) {
            const min = Number(criteria.currentSalaryMin);
            const max = criteria.currentSalaryMax !== null ? Number(criteria.currentSalaryMax) : 200;
            const salaryMatch = {
                current_salary: {
                    [Op.and]: [{ [Op.gte]: min }, { [Op.lte]: max }]
                }
            };

            if (criteria.includeNotMentioned) {
                matchingConditions.push({
                    [Op.or]: [salaryMatch, { current_salary: null }]
                });
            } else {
                matchingConditions.push(salaryMatch);
            }
        }

        // 3. Locations
        if (criteria.candidateLocations.length > 0) {
            const locConds = criteria.candidateLocations.flatMap(loc => [
                { current_location: { [Op.iLike]: `%${loc}%` } },
                sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.iLike]: `%${loc}%` })
            ]);

            if (criteria.includeWillingToRelocate) {
                locConds.push({ willing_to_relocate: true });
            }

            matchingConditions.push({ [Op.or]: locConds });
        }

        // 4. Exclude Locations
        if (criteria.excludeLocations.length > 0) {
            const excludeConds = criteria.excludeLocations.flatMap(loc => [
                { current_location: { [Op.notILike]: `%${loc}%` } },
                sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.notILike]: `%${loc}%` })
            ]);
            allAndConditions.push({ [Op.and]: excludeConds });
        }

        // 5. Skills
        const hasStrongTitleMatch = (requirementTitle || '').trim().length > 2;
        let titleMatchConditions = [];
        if (hasStrongTitleMatch) {
            const words = requirementTitle.trim().split(/\s+/).filter(w => w.length > 2).map(w => w.toLowerCase());
            titleMatchConditions = words.flatMap(w => [
                { headline: { [Op.iLike]: `%${w}%` } },
                { designation: { [Op.iLike]: `%${w}%` } },
                { current_role: { [Op.iLike]: `%${w}%` } }
            ]);
        }

        if (criteria.includeSkills.length > 0) {
            const skillConds = criteria.includeSkills.flatMap(skill => [
                { skills: { [Op.contains]: [skill] } },
                sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
                { key_skills: { [Op.contains]: [skill] } },
                sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
                { headline: { [Op.iLike]: `%${skill}%` } },
                { summary: { [Op.iLike]: `%${skill}%` } }
            ]);

            if (titleMatchConditions.length > 0) {
                matchingConditions.push({
                    [Op.or]: [
                        { [Op.or]: skillConds },
                        { [Op.or]: titleMatchConditions }
                    ]
                });
            } else {
                matchingConditions.push({ [Op.or]: skillConds });
            }
        } else if (titleMatchConditions.length > 0) {
            matchingConditions.push({ [Op.or]: titleMatchConditions });
        }

        // 6. Exclude Skills
        if (criteria.excludeSkills.length > 0) {
            const excludeSkillConds = criteria.excludeSkills.map(skill => {
                return sequelize.where(
                    sequelize.literal(`
            (
              (skills IS NULL OR NOT CAST(skills AS TEXT) ILIKE '%${skill}%') AND
              (key_skills IS NULL OR NOT CAST(key_skills AS TEXT) ILIKE '%${skill}%') AND
              (headline IS NULL OR headline NOT ILIKE '%${skill}%') AND
              (summary IS NULL OR summary NOT ILIKE '%${skill}%')
            )
          `),
                    {}
                );
            });
            allAndConditions.push({ [Op.and]: excludeSkillConds });
        }

        // 7. Designations
        if (criteria.candidateDesignations.length > 0) {
            const desConds = criteria.candidateDesignations.flatMap(des => [
                { designation: { [Op.iLike]: `%${des}%` } },
                { headline: { [Op.iLike]: `%${des}%` } },
                { current_role: { [Op.iLike]: `%${des}%` } }
            ]);
            matchingConditions.push({ [Op.or]: desConds });
        }

        // 8. Gender
        if (criteria.diversityPreference && Array.isArray(criteria.diversityPreference)) {
            const genders = criteria.diversityPreference.filter(p => p && p !== 'all');
            if (genders.length > 0 && !criteria.diversityPreference.includes('all')) {
                allAndConditions.push({ gender: { [Op.in]: genders } });
            }
        }

        // 9. Search Query
        if (criteria.search) {
            const search = criteria.search;
            const searchConds = [
                { first_name: { [Op.iLike]: `%${search}%` } },
                { last_name: { [Op.iLike]: `%${search}%` } },
                { headline: { [Op.iLike]: `%${search}%` } },
                { designation: { [Op.iLike]: `%${search}%` } },
                { summary: { [Op.iLike]: `%${search}%` } },
                sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${search}%` }),
                sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${search}%` })
            ];
            allAndConditions.push({ [Op.or]: searchConds });
        }

        // Combine everything
        if (matchingConditions.length > 0) {
            allAndConditions.push({ [Op.and]: matchingConditions });
        }

        if (allAndConditions.length > 0) {
            whereClause[Op.and] = allAndConditions;
        }

        return whereClause;
    }
};

module.exports = requirementSearchService;
