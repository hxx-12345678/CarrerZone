const { JobPreference, User, Job, Company } = require('../config/index');
const { Op } = require('sequelize');

class JobPreferenceMatchingService {
  /**
   * Find users whose preferences match a newly posted job
   * @param {object} jobData - The job data to match against
   * @returns {array} Array of user IDs who have matching preferences
   */
  static async findMatchingUsers(jobData) {
    try {
      console.log(`🔍 Finding users with preferences matching job: ${jobData.title}`);

      // Get all active job preferences
      const allPreferences = await JobPreference.findAll({
        where: { isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'user_type', 'account_status'],
          where: {
            user_type: 'jobseeker',
            account_status: 'active'
          }
        }]
      });

      if (!allPreferences || allPreferences.length === 0) {
        console.log('📝 No active job preferences found');
        return [];
      }

      const matchingUserIds = [];

      for (const preference of allPreferences) {
        const userId = preference.userId;
        let matchScore = 0;
        let hasAnyPreference = false;

        // Check job title match
        if (preference.preferredJobTitles && preference.preferredJobTitles.length > 0) {
          hasAnyPreference = true;
          const titleMatch = preference.preferredJobTitles.some(title => 
            jobData.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(jobData.title.toLowerCase())
          );
          if (titleMatch) {
            matchScore += 3; // High weight for title match
          }
        }


        // Check location match
        if (preference.preferredLocations && preference.preferredLocations.length > 0) {
          hasAnyPreference = true;
          const locationMatch = preference.preferredLocations.some(location => 
            jobData.location.toLowerCase().includes(location.toLowerCase()) ||
            location.toLowerCase().includes(jobData.location.toLowerCase())
          );
          if (locationMatch) {
            matchScore += 2;
          }
        }

        // Check job type match
        if (preference.preferredJobTypes && preference.preferredJobTypes.length > 0) {
          hasAnyPreference = true;
          const jobTypeMatch = preference.preferredJobTypes.includes(jobData.jobType);
          if (jobTypeMatch) {
            matchScore += 2;
          }
        }

        // Check experience level match
        if (preference.preferredExperienceLevels && preference.preferredExperienceLevels.length > 0) {
          hasAnyPreference = true;
          const experienceMatch = preference.preferredExperienceLevels.includes(jobData.experienceLevel);
          if (experienceMatch) {
            matchScore += 2;
          }
        }

        // Check work mode match
        if (preference.preferredWorkMode && preference.preferredWorkMode.length > 0) {
          hasAnyPreference = true;
          const workModeMatch = preference.preferredWorkMode.includes(jobData.remoteWork);
          if (workModeMatch) {
            matchScore += 1;
          }
        }


        // Check salary match (if both have salary info)
        if (preference.preferredSalaryMin && jobData.salaryMin) {
          hasAnyPreference = true;
          if (jobData.salaryMin >= preference.preferredSalaryMin) {
            matchScore += 1;
          }
        }

        if (preference.preferredSalaryMax && jobData.salaryMax) {
          hasAnyPreference = true;
          if (jobData.salaryMax <= preference.preferredSalaryMax) {
            matchScore += 1;
          }
        }

        // Check skills match (if job has skills)
        if (preference.preferredSkills && preference.preferredSkills.length > 0 && jobData.skills) {
          hasAnyPreference = true;
          const skillsMatch = preference.preferredSkills.some(skill => 
            jobData.skills.some(jobSkill => 
              jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(jobSkill.toLowerCase())
            )
          );
          if (skillsMatch) {
            matchScore += 1;
          }
        }

        // If user has any preferences set and match score is above threshold
        if (hasAnyPreference && matchScore >= 2) {
          matchingUserIds.push({
            userId,
            matchScore,
            preferences: {
              jobTitles: preference.preferredJobTitles,
              locations: preference.preferredLocations,
              jobTypes: preference.preferredJobTypes,
              experienceLevels: preference.preferredExperienceLevels,
              workModes: preference.preferredWorkMode,
              skills: preference.preferredSkills
            }
          });
        }
      }

      // Sort by match score and return user IDs
      const sortedMatches = matchingUserIds
        .sort((a, b) => b.matchScore - a.matchScore)
        .map(match => match.userId);

      console.log(`✅ Found ${sortedMatches.length} users with matching preferences`);
      return sortedMatches;

    } catch (error) {
      console.error('❌ Error finding matching users:', error);
      return [];
    }
  }

  /**
   * Check if a specific user's preferences match a job
   * @param {string} userId - User ID to check
   * @param {object} jobData - Job data to match against
   * @returns {object} Match result with score and details
   */
  static async checkUserJobMatch(userId, jobData) {
    try {
      const preference = await JobPreference.findOne({
        where: { userId, isActive: true }
      });

      if (!preference) {
        return { match: false, score: 0, reason: 'No preferences set' };
      }

      let matchScore = 0;
      const matchDetails = [];

      // Check various preference matches
      if (preference.preferredJobTitles && preference.preferredJobTitles.length > 0) {
        const titleMatch = preference.preferredJobTitles.some(title => 
          jobData.title.toLowerCase().includes(title.toLowerCase())
        );
        if (titleMatch) {
          matchScore += 3;
          matchDetails.push('Job title matches preference');
        }
      }

      if (preference.preferredLocations && preference.preferredLocations.length > 0) {
        const locationMatch = preference.preferredLocations.some(location => 
          jobData.location.toLowerCase().includes(location.toLowerCase())
        );
        if (locationMatch) {
          matchScore += 2;
          matchDetails.push('Location matches preference');
        }
      }

      if (preference.preferredJobTypes && preference.preferredJobTypes.length > 0) {
        const jobTypeMatch = preference.preferredJobTypes.includes(jobData.jobType);
        if (jobTypeMatch) {
          matchScore += 2;
          matchDetails.push('Job type matches preference');
        }
      }


      return {
        match: matchScore >= 2,
        score: matchScore,
        details: matchDetails,
        preferences: {
          jobTitles: preference.preferredJobTitles,
          locations: preference.preferredLocations,
          jobTypes: preference.preferredJobTypes,
          skills: preference.preferredSkills
        }
      };

    } catch (error) {
      console.error('❌ Error checking user job match:', error);
      return { match: false, score: 0, reason: 'Error checking match' };
    }
  }
}

module.exports = JobPreferenceMatchingService;
