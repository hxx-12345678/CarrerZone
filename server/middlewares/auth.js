const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 [AUTH] Starting authentication for:', req.path);

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ [AUTH] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    console.log('🔍 [AUTH] Verifying JWT token...');
    // Removed insecure fallback secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [AUTH] JWT token verified, user ID:', decoded.id);

    console.log('🔍 [AUTH] Fetching user from database...');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      console.log('❌ [AUTH] User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check session version for token invalidation
    // If token lacks sessionVersion or it doesn't match DB, it's considered expired/invalidated
    if (user.session_version !== undefined && String(decoded.sessionVersion) !== String(user.session_version)) {
      console.log(`❌ [AUTH] Session version mismatch (Token: ${decoded.sessionVersion}, DB: ${user.session_version}) - token invalidated`);
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }

    if (!user.is_active) {
      console.log('❌ [AUTH] User account is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check account status for suspended users
    if (user.account_status === 'suspended') {
      console.log('❌ [AUTH] User account is suspended');
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support for assistance.',
        status: 'suspended'
      });
    }

    if (user.account_status === 'deleted') {
      console.log('❌ [AUTH] User account is deleted');
      return res.status(403).json({
        success: false,
        message: 'Account not found or has been deleted.',
        status: 'deleted'
      });
    }

    if (user.account_status === 'inactive') {
      console.log('❌ [AUTH] User account is inactive due to inactivity');
      return res.status(403).json({
        success: false,
        message: 'Your account has been marked as inactive due to prolonged inactivity. Please log in to reactivate your account.',
        status: 'inactive'
      });
    }

    console.log('✅ [AUTH] User authenticated successfully:', { id: user.id, type: user.user_type });
    // Set req.user to the full Sequelize instance for compatibility
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      console.log('❌ [AUTH] Invalid JWT token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      console.log('❌ [AUTH] Token expired');
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.log('❌ [AUTH] General authentication failure');
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

module.exports = { authenticateToken, requireAdmin };
