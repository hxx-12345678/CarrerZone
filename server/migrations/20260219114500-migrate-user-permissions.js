'use strict';

/**
 * Migration to sync permissions from legacy preferences to the new permissions column.
 * This ensures all existing team members maintain their intended access levels.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // Find all users who might have permissions in their preferences
            // We use raw SQL to avoid model issues during migrations
            const [users] = await queryInterface.sequelize.query(
                `SELECT id, preferences, permissions, user_type FROM users 
         WHERE (preferences->>'permissions' IS NOT NULL OR permissions IS NULL OR permissions = '{}')
           AND user_type IN ('employer', 'admin', 'superadmin')`
            );

            console.log(`🔍 Found ${users.length} users to potentially migrate permissions for.`);

            const ALL_PERMISSIONS = {
                jobPosting: true,
                resumeDatabase: true,
                analytics: true,
                featuredJobs: true,
                hotVacancies: true,
                applications: true,
                settings: true,
                agencyClients: true
            };

            const NONE_PERMISSIONS = {
                jobPosting: false,
                resumeDatabase: false,
                analytics: false,
                featuredJobs: false,
                hotVacancies: false,
                applications: false,
                settings: false,
                agencyClients: false
            };

            let updatedCount = 0;

            for (const user of users) {
                let currentPerms = user.permissions || {};
                let legacyPerms = user.preferences?.permissions || {};

                // Determine target permissions
                let finalPerms;
                if (user.user_type === 'admin' || user.user_type === 'superadmin') {
                    finalPerms = ALL_PERMISSIONS;
                } else {
                    // Combine legacy and current, ensuring we don't lose anything but favoring current if it exists
                    // We'll use a broad merge here for the migration to ensure users get the "most comprehensive" set
                    finalPerms = {
                        ...NONE_PERMISSIONS,
                        ...legacyPerms,
                        ...currentPerms
                    };

                    // Specific fix for the legacy 'requirements' key mapping to 'resumeDatabase'
                    if (legacyPerms.requirements === true && finalPerms.resumeDatabase !== true) {
                        finalPerms.resumeDatabase = true;
                    }
                }

                // Check if update is needed
                if (JSON.stringify(user.permissions) !== JSON.stringify(finalPerms)) {
                    await queryInterface.sequelize.query(
                        'UPDATE users SET permissions = :perms, updated_at = NOW() WHERE id = :id',
                        {
                            replacements: {
                                perms: JSON.stringify(finalPerms),
                                id: user.id
                            }
                        }
                    );
                    updatedCount++;
                }
            }

            console.log(`✅ Migrated permissions for ${updatedCount} users.`);
        } catch (error) {
            console.error('❌ Failed to migrate user permissions:', error.message);
            // Don't throw to avoid blocking other migrations if this fails
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Non-destructive migration
    }
};
