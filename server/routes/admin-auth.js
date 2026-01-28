const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Admin login validation
const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Generate JWT token for admin
const generateAdminToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    userType: user.user_type,
    sessionId: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    iss: 'job-portal-admin',
    aud: 'admin-dashboard'
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h'
  });
};

// Admin login endpoint - ONLY for superadmin
router.post('/admin-login', validateAdminLogin, async (req, res) => {
  try {
    console.log('🔍 Admin login request received:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('🧪 Admin login debug: email=', email);

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ Admin user not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Admin user found:', { 
      id: user.id, 
      email: user.email, 
      userType: user.user_type 
    });

    // CRITICAL: Only allow superadmin to login through admin login
    if (user.user_type !== 'superadmin') {
      console.log('❌ Non-superadmin trying to access admin login:', user.user_type);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only system administrators can access this login.',
        userType: user.user_type
      });
    }

    // Check if account is active
    if (user.account_status !== 'active') {
      console.log('❌ Admin account not active:', user.account_status);
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Admin password verified successfully');

    // Update last login
    await user.update({ last_login_at: new Date() });

    // Generate JWT token
    const token = generateAdminToken(user);

    // Prepare response data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        isEmailVerified: user.is_email_verified,
        accountStatus: user.account_status,
        lastLoginAt: user.last_login_at,
        region: user.region,
        profileCompletion: user.profile_completion
      },
      token,
      redirectTo: '/admin/dashboard'
    };

    console.log('✅ Admin login successful for user:', user.email);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Admin logout endpoint
router.post('/admin-logout', (req, res) => {
  try {
    console.log('🔍 Admin logout request received');
    
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    console.error('❌ Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin logout'
    });
  }
});

// Verify admin token endpoint
router.get('/admin-verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id);

    if (!user || user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    res.json({
      success: true,
      message: 'Admin token valid',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type
        }
      }
    });

  } catch (error) {
    console.error('❌ Admin token verification error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired admin token'
    });
  }
});

module.exports = router;
