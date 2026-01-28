const express = require('express');
const router = express.Router();
const { Company, User } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const AdminNotificationService = require('../services/adminNotificationService');

/**
 * @route   GET /api/companies/claim/search
 * @desc    Search for unclaimed companies by name
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Company name must be at least 2 characters long'
      });
    }
    
    // Search for companies with similar names that are unclaimed
    const companies = await Company.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name.trim()}%`
        },
        isClaimed: false, // Only unclaimed companies
        isActive: true
      },
      attributes: ['id', 'name', 'industry', 'city', 'created_at', 'createdByAgencyId'],
      limit: 10,
      order: [['name', 'ASC']]
    });
    
    res.json({
        success: true,
      data: companies,
      message: companies.length > 0 ? 'Companies found' : 'No unclaimed companies found'
    });
    
  } catch (error) {
    console.error('❌ Company search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/companies/claim
 * @desc    Claim an unclaimed company profile
 * @access  Public (during registration)
 */
router.post('/claim', async (req, res) => {
  try {
    const {
      companyId,
      userEmail,
      userName,
      userPhone,
      password,
      verificationCode // Optional: Send OTP to company email for verification
    } = req.body;
    
    if (!companyId || !userEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, email, and password are required'
      });
    }
    
    // Find the unclaimed company
    const company = await Company.findByPk(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Verify company is unclaimed
    if (company.isClaimed) {
      return res.status(400).json({
        success: false,
        message: 'This company has already been claimed. Please use the join company option instead.'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email: userEmail } });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists. Please login instead.'
      });
    }
    
    // Start transaction for claiming
    const { sequelize } = require('../config/sequelize');
    const transaction = await sequelize.transaction();
    
    try {
      // Split name
      const nameParts = userName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create user as admin of the claimed company
      const user = await User.create({
        email: userEmail,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone: userPhone,
        user_type: 'admin', // Company owner becomes admin
        account_status: 'active',
        company_id: company.id,
        email_verified: false, // Will be verified via OTP
        phone_verified: false
      }, { transaction });
      
      // Update company to mark as claimed
      await company.update({
        isClaimed: true,
        claimedAt: new Date(),
        claimedByUserId: user.id,
        contactPerson: userName,
        contactEmail: userEmail,
        contactPhone: userPhone,
        companyStatus: 'active', // Activate the company
        verificationStatus: 'verified' // Mark as verified since claimed by owner
      }, { transaction });
      
      await transaction.commit();
      
      console.log('✅ Company claimed successfully:', {
        companyId: company.id,
        companyName: company.name,
        userId: user.id,
        userEmail
      });
      
      res.json({
        success: true,
        message: 'Company claimed successfully! You can now login with your credentials.',
        data: {
          userId: user.id,
          companyId: company.id,
          companyName: company.name,
          userType: 'admin'
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Company claim error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      if (field === 'email') {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/companies/claim/create-new
 * @desc    Create a new company when the name doesn't exist
 * @access  Public (during registration)
 */
router.post('/create-new', async (req, res) => {
  try {
    const {
      companyName,
      industry,
      companySize,
      website,
      userEmail,
      userName,
      userPhone,
      password,
      region
    } = req.body;
    
    if (!companyName || !userEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company name, email, and password are required'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email: userEmail } });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists. Please login instead.'
      });
    }
    
    // Check if company with this name already exists
    const existingCompany = await Company.findOne({ 
      where: { 
        name: {
          [Op.iLike]: companyName.trim()
        }
      } 
    });
    
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'A company with this name already exists. Please search for it or choose a different name.',
        data: {
          existingCompany: {
            id: existingCompany.id,
            name: existingCompany.name,
            isClaimed: existingCompany.isClaimed
          }
        }
      });
    }
    
    // Start transaction
    const { sequelize } = require('../config/sequelize');
    const transaction = await sequelize.transaction();
    
    try {
      // Generate unique slug
      const generateSlug = async (name) => {
        let baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 50);
        
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
          const existingCompany = await Company.findOne({ where: { slug } });
          if (!existingCompany) {
            break;
          }
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        return slug;
      };
      
      const companySlug = await generateSlug(companyName);
      
      // Split name
      const nameParts = userName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create company
      const company = await Company.create({
        name: companyName.trim(),
        slug: companySlug,
        industry: industry || 'Other',
        companySize: companySize || '1-50',
        website: website || '',
        email: userEmail,
        phone: userPhone,
        region: region || 'india',
        contactPerson: userName,
        contactEmail: userEmail,
        contactPhone: userPhone,
        companyStatus: 'active',
        isActive: true,
        companyAccountType: 'direct',
        verificationStatus: 'verified',
        isClaimed: true, // Mark as claimed since created by owner
        claimedAt: new Date()
      }, { transaction });
      
      // Create user as admin
      const user = await User.create({
        email: userEmail,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone: userPhone,
        user_type: 'admin',
        account_status: 'active',
        company_id: company.id,
        email_verified: false,
        phone_verified: false
      }, { transaction });
      
      // Update company with user reference
      await company.update({
        claimedByUserId: user.id
      }, { transaction });
      
      await transaction.commit();
      
      console.log('✅ New company created successfully:', {
        companyId: company.id,
        companyName: company.name,
        userId: user.id,
        userEmail
      });

      // Create admin notifications for new admin and company registration
      try {
        await AdminNotificationService.notifyNewRegistration('admin', user, company);
        await AdminNotificationService.notifyNewCompanyRegistration(company, user);
      } catch (error) {
        console.error('⚠️ Error creating admin notifications:', error);
      }
      
      res.json({
        success: true,
        message: 'Company created successfully! You can now login with your credentials.',
        data: {
          userId: user.id,
          companyId: company.id,
          companyName: company.name,
          userType: 'admin'
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ New company creation error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      if (field === 'email') {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      } else if (field === 'slug') {
        return res.status(409).json({
          success: false,
          message: 'Company with this name already exists. Please choose a different company name.'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
