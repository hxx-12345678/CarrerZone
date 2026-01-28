/**
 * Admin setup routes for ensuring admin user exists
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Admin setup function (inline since ensureAdminUser script was removed)
const ensureAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { user_type: 'superadmin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    // Create default admin user
    const adminUser = await User.create({
      email: 'admin@jobportal.com',
      first_name: 'Super',
      last_name: 'Admin',
      user_type: 'superadmin',
      is_email_verified: true,
      account_status: 'active'
    });

    console.log('✅ Admin user created:', adminUser.email);
    return adminUser;
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
    throw error;
  }
};

// Endpoint to ensure admin user exists (no auth required for setup)
router.post('/ensure-admin', async (req, res) => {
  try {
    console.log('🔧 Admin setup request received');
    
    const adminUser = await ensureAdminUser();
    
    res.json({
      success: true,
      message: 'Admin user ensured successfully',
      data: {
        email: adminUser.email,
        userType: adminUser.user_type,
        isActive: adminUser.is_active,
        id: adminUser.id
      }
    });
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ensure admin user',
      error: error.message
    });
  }
});

// Health check for admin setup
router.get('/admin-health', async (req, res) => {
  try {
    const { User } = require('../models');
    
    const adminUser = await User.findOne({
      where: { email: 'admin@campus.com' }
    });
    
    if (adminUser && adminUser.user_type === 'admin' && adminUser.is_active) {
      res.json({
        success: true,
        message: 'Admin user is ready',
        data: {
          email: adminUser.email,
          userType: adminUser.user_type,
          isActive: adminUser.is_active
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Admin user not found or inactive',
        data: null
      });
    }
  } catch (error) {
    console.error('❌ Admin health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Admin health check failed',
      error: error.message
    });
  }
});

module.exports = router;
