'use strict';

/**
 * Shared utility to normalize user permissions with column prioritization and legacy fallback.
 * Ensures a complete permission object is always returned.
 */

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

const normalizePermissions = (user) => {
    if (!user) return NONE_PERMISSIONS;

    // Admins and superadmins always have all permissions.
    if (user.user_type === 'admin' || user.user_type === 'superadmin') {
        return ALL_PERMISSIONS;
    }

    const primary = user.permissions || {};
    const fallback = user.preferences?.permissions || {};

    // Merge: defaults < legacy preferences < dedicated permissions column
    const combined = {
        ...NONE_PERMISSIONS,
        ...(typeof fallback === 'object' ? fallback : {}),
        ...(typeof primary === 'object' ? primary : {})
    };

    // Filter to only include standard keys to keep the API response clean
    const result = {};
    Object.keys(NONE_PERMISSIONS).forEach(key => {
        result[key] = combined[key] === true;
    });

    // Special mapping for legacy 'requirements' key to 'resumeDatabase'
    // ONLY if resumeDatabase wasn't explicitly handled in the new permissions column
    if (combined.requirements === true && (primary === null || typeof primary !== 'object' || primary.resumeDatabase === undefined)) {
        result.resumeDatabase = true;
    }

    return result;
};

module.exports = {
    normalizePermissions,
    ALL_PERMISSIONS,
    NONE_PERMISSIONS
};
