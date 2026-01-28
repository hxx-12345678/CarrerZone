const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to require admin privileges
const requireAdmin = async (req, res, next) => {
  try {
    console.log('🔍 [ADMIN] Starting admin authorization for:', req.path);
    console.log('🔍 [ADMIN] req.user:', req.user ? 'Present' : 'Missing');
    
    // Check if user is authenticated (from authenticateToken middleware)
    if (!req.user) {
      console.log('❌ [ADMIN] No req.user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('🔍 [ADMIN] req.user details:', {
      id: req.user.id,
      email: req.user.email,
      user_type: req.user.user_type
    });

    // Check if user is superadmin (only superadmin can access admin dashboard)
    if (req.user.user_type !== 'superadmin') {
      console.log('❌ [ADMIN] User is not superadmin, user_type:', req.user.user_type);
      return res.status(403).json({
        success: false,
        message: 'Superadmin privileges required. Only system administrators can access this area.'
      });
    }

    // Verify user still exists and is active
    console.log('🔍 [ADMIN] Verifying admin user in database for ID:', req.user.id);
    const user = await User.findByPk(req.user.id);
    if (!user || !user.is_active) {
      console.log('❌ [ADMIN] Admin account not found or inactive:', {
        userFound: !!user,
        isActive: user?.is_active
      });
      return res.status(403).json({
        success: false,
        message: 'Admin account not found or inactive'
      });
    }

    console.log('✅ [ADMIN] Admin authorization successful for:', user.email);
    // Add admin user to request
    req.admin = user;
    next();
  } catch (error) {
    console.error('❌ [ADMIN] Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin authentication failed',
      error: error.message
    });
  }
};

module.exports = { requireAdmin };