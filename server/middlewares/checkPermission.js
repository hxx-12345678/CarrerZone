'use strict';

/**
 * Middleware to check if a user has a specific permission.
 * Admins and Superadmins bypass all permission checks.
 * 
 * @param {string} permission - The permission key to check (e.g., 'jobPosting', 'analytics')
 */
const checkPermission = (permission) => {
    return (req, res, next) => {
        // 1. Ensure user is authenticated (req.user should be set by authenticateToken)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // 2. Admins and Superadmins have all permissions
        if (req.user.user_type === 'admin' || req.user.user_type === 'superadmin') {
            return next();
        }

        // 3. Check for specific permission in the user's permissions object
        // Handle both dedicated column and legacy preferences location
        const userPermissions = req.user.permissions || req.user.preferences?.permissions || {};

        // If the permission is explicitly true, allow access
        if (userPermissions[permission] === true) {
            return next();
        }

        // 4. Deny access if permission is missing or false
        return res.status(403).json({
            success: false,
            message: `Access denied. You do not have the required permission: ${permission}.`,
            requiredPermission: permission
        });
    };
};

module.exports = checkPermission;
