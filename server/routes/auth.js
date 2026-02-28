const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const { sequelize } = require('../config/sequelize');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const AdminNotificationService = require('../services/adminNotificationService');
const { trackLogin, trackLogout } = require('../middlewares/activityTracker');
const { normalizePermissions } = require('../utils/permissions');

const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Test endpoint to verify auth routes are working
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

// Validation middleware
const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      gmail_convert_googlemaildotcom: false
    })
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('experience')
    .optional({ checkFalsy: true })
    .isIn(['fresher', 'junior', 'mid', 'senior', 'lead'])
    .withMessage('Experience level must be fresher, junior, mid, senior, or lead')
];

const validateEmployerSignup = [
  body('email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      gmail_convert_googlemaildotcom: false
    })
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('companyId')
    .optional()
    .isUUID()
    .withMessage('Invalid companyId'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('phone')
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Phone number must be between 8 and 20 characters')
    .matches(/^[\+]?[0-9\s\-\(\)\.]+$/)
    .withMessage('Please enter a valid phone number (digits, spaces, dashes, parentheses, and dots allowed)'),
  body('companySize')
    .optional({ checkFalsy: true })
    .isIn(['1-50', '51-200', '201-500', '500-1000', '1000+'])
    .withMessage('Invalid company size'),
  body('industries')
    .optional({ checkFalsy: true })
    .isArray()
    .withMessage('Industries must be an array'),
  body('industries.*')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each industry must be between 2 and 100 characters'),
  body('region')
    .optional()
    .isIn(['india', 'gulf', 'other'])
    .withMessage('Region must be india, gulf, or other'),
  body('agreeToTerms')
    .custom((value) => {
      // Handle both boolean and string values
      const boolValue = value === true || value === 'true' || value === 1;
      if (!boolValue) {
        throw new Error('You must agree to the terms and conditions');
      }
      return true;
    })
    .withMessage('You must agree to the terms and conditions')
  // Ensure either companyId or companyName is provided
  , (req, res, next) => {
    if (!req.body.companyId && !req.body.companyName) {
      return res.status(400).json({ success: false, message: 'Provide either companyId to join or companyName to create a new company' });
    }
    next();
  }
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .bail()
    .customSanitizer((value) => typeof value === 'string' ? value.trim().toLowerCase() : value),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      gmail_convert_googlemaildotcom: false
    })
    .withMessage('Please enter a valid email address')
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Helper function to generate JWT token
const generateToken = (user) => {
  console.log('🔍 [LOGIN] Generating JWT token for user:', user.email);
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required but not set');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      sessionVersion: user.session_version || 1
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ [LOGIN] JWT token generated successfully');
  return token;
};

// Helper function to determine redirect URL based on user type and region
// Accepts optional company object to check company region as fallback
const getRedirectUrl = (userType, region, company = null) => {
  // Determine effective region: prefer user region, fallback to company region
  let effectiveRegion = region;
  if (!effectiveRegion || effectiveRegion === 'india') {
    // If user region is not set or is default 'india', check company region
    if (company && company.region === 'gulf') {
      effectiveRegion = 'gulf';
    }
  }

  if (userType === 'superadmin') {
    return '/admin/dashboard';
  } else if (userType === 'employer' || userType === 'admin') {
    return effectiveRegion === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard';
  } else if (userType === 'jobseeker') {
    if (effectiveRegion === 'gulf') {
      return '/jobseeker-gulf-dashboard';
    } else {
      return '/dashboard';
    }
  }
  return '/dashboard'; // Default fallback
};

// Signup endpoint
router.post('/signup', validateSignup, async (req, res) => {
  try {
    console.log('🔍 Signup request received');

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

    const { email, password, fullName, phone, experience, region } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Determine region - default to 'india' if not specified
    const userRegion = region || 'india';

    // Create new user
    console.log('📝 Creating user with data:', {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      user_type: 'jobseeker',
      account_status: 'active',
      region: userRegion
    });

    const user = await User.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      region: userRegion,
      user_type: 'jobseeker', // Default to jobseeker
      account_status: 'active',
      is_email_verified: false,
      oauth_provider: 'local', // Ensure this is set for regular registrations
      // Store experience level in preferences and regions array
      preferences: {
        experience: experience || 'fresher',
        regions: [userRegion], // Store regions as array in preferences
        ...req.body.preferences
      }
    });

    console.log('✅ User created successfully:', user.id);

    // Check for jobseeker milestones and create notifications
    try {
      await AdminNotificationService.checkJobseekerMilestones();
    } catch (error) {
      console.error('⚠️ Error checking jobseeker milestones:', error);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          isEmailVerified: user.is_email_verified,
          accountStatus: user.account_status
        },
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Employer signup endpoint
router.post('/employer-signup', validateEmployerSignup, async (req, res) => {
  try {
    console.log('🔍 Employer signup request received:', req.body);

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

    const { email, password, fullName, companyName, companyId, phone, companySize, industries, website, region, role, companyAccountType } = req.body;

    // When joining existing company, industries can be empty - will use company's industries
    // When creating new company, industries are required
    let finalIndustries = industries;

    if (companyId) {
      // Joining existing company - fetch company industries if not provided
      const existingCompanyCheck = await Company.findByPk(companyId);
      if (existingCompanyCheck) {
        // Use company's existing industries if none provided
        if (!industries || !Array.isArray(industries) || industries.length === 0) {
          finalIndustries = existingCompanyCheck.industries || existingCompanyCheck.industry ?
            (Array.isArray(existingCompanyCheck.industries) ? existingCompanyCheck.industries :
              [existingCompanyCheck.industry || existingCompanyCheck.industries].filter(Boolean)) :
            ['Other'];
        }
      } else {
        // Company doesn't exist yet, require industries
        if (!industries || !Array.isArray(industries) || industries.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one industry must be selected'
          });
        }
      }
    } else {
      // Creating new company - industries are required
      if (!industries || !Array.isArray(industries) || industries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one industry must be selected'
        });
      }
    }

    // Use the first industry as the primary industry for backward compatibility
    const primaryIndustry = finalIndustries[0];

    // Check if user already exists and handle re-registration for rejected accounts
    const existingUser = await User.findOne({ where: { email } });
    let existingCompany = null;

    if (existingUser) {
      // Check if the user's company is rejected OR user account is rejected - allow re-registration
      existingCompany = await Company.findByPk(existingUser.companyId);

      // Allow re-registration if:
      // 1. Company verification is rejected
      // 2. User account is rejected  
      // 3. User account is pending verification (in case of incomplete registration)
      // 4. Company verification is pending (incomplete registration)
      const allowReRegistration = (
        (existingCompany && existingCompany.verificationStatus === 'rejected') ||
        existingUser.account_status === 'rejected' ||
        existingUser.account_status === 'pending_verification' ||
        (existingCompany && existingCompany.verificationStatus === 'pending')
      );

      if (allowReRegistration) {
        console.log('🔄 Allowing re-registration for user:', email, 'Status:', existingUser.account_status, 'Company status:', existingCompany?.verificationStatus);
        // Continue with registration - will update existing company
      } else {
        console.log('❌ User already exists with active account:', email);
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Start a transaction to create user and (optionally) company
    const transaction = await sequelize.transaction();

    try {
      // Generate unique slug from company name
      const generateSlug = async (name) => {
        let baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 50);

        let slug = baseSlug;
        let counter = 1;

        // Check if slug exists and generate unique one
        while (true) {
          const existingCompanyWithSlug = await Company.findOne({ where: { slug } });
          if (!existingCompanyWithSlug) {
            break;
          }
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        return slug;
      };

      let company = null;
      if (companyId) {
        // Join existing company
        company = await Company.findByPk(companyId, { transaction });
        if (!company) {
          throw new Error('Company not found');
        }

        // Check if company is unclaimed (created by agency)
        if (!company.isClaimed && company.createdByAgencyId) {
          console.log('🔓 Claiming unclaimed company:', company.name);

          // Update company as claimed
          company.isClaimed = true;
          company.claimedAt = new Date();
          company.contactPerson = fullName;
          company.contactEmail = email;
          company.contactPhone = phone;
          company.email = email;
          company.phone = phone;

          // Note: Don't set claimedByUserId yet - will be set after user creation
          await company.save({ transaction });

          console.log('✅ Company claimed successfully by actual owner');
        } else {
          console.log('✅ Joining existing company:', company.id);
        }
      } else {
        // Handle new company creation or re-registration

        if (existingUser && existingUser.companyId) {
          // Update existing company for re-registration
          company = await Company.findByPk(existingUser.companyId, { transaction });
          if (company && company.verificationStatus === 'rejected') {
            console.log('🔄 Updating rejected company for re-registration:', company.name);

            // Clean up old verification documents if they exist
            if (company.verificationDocuments && company.verificationDocuments.length > 0) {
              console.log('🗑️ Cleaning up old verification documents for company:', company.id);
              try {
                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(__dirname, '../uploads/verification-documents');

                // Delete old document files
                for (const doc of company.verificationDocuments) {
                  if (doc.filename) {
                    const filePath = path.join(uploadDir, doc.filename);
                    if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                      console.log('✅ Deleted old document:', doc.filename);
                    }
                  }
                }
              } catch (error) {
                console.error('❌ Error cleaning up old documents:', error);
                // Don't fail the registration if document cleanup fails
              }
            }

            await company.update({
              name: companyName,
              industries: finalIndustries,
              companySize: companySize || company.companySize,
              website: website || company.website,
              email: email,
              phone: phone,
              contactPerson: fullName,
              contactEmail: email,
              contactPhone: phone,
              companyStatus: 'pending_approval',
              verificationStatus: 'pending',
              companyAccountType: companyAccountType || 'direct',
              verificationDocuments: [], // Clear old documents
              verificationMethod: null, // Reset verification method
              verifiedAt: null // Reset verification date
            }, { transaction });
          }
        }

        if (!company) {
          // Create new company record
          const companySlug = await generateSlug(companyName);
          console.log('📝 Creating company record:', { name: companyName, industries: finalIndustries, companySize, website, slug: companySlug, companyAccountType });
          company = await Company.create({
            name: companyName,
            slug: companySlug,
            industries: finalIndustries,
            companySize: companySize || '1-50',
            website: website,
            email: email,
            phone: phone,
            region: region || 'india',
            contactPerson: fullName,
            contactEmail: email,
            contactPhone: phone,
            companyStatus: 'pending_approval',
            isActive: true,
            companyAccountType: companyAccountType || 'direct',
            verificationStatus: 'pending', // All new registrations need verification
            isClaimed: true,
            claimedAt: new Date()
          }, { transaction });
        }

        console.log('✅ Company created/updated successfully:', company?.id);
      }

      // Ensure company exists before proceeding
      if (!company) {
        throw new Error('Company creation/retrieval failed');
      }

      // Determine user type and designation based on whether they're creating a new company or joining existing one
      const userType = companyId ? 'employer' : 'admin'; // New company = admin, existing company = employer
      const designation = companyId ? 'Recruiter' : 'Hiring Manager'; // Set proper designation

      // Create or update employer user
      let user;

      const allowUserUpdate = (
        (existingUser && existingCompany?.verificationStatus === 'rejected') ||
        (existingUser && existingUser.account_status === 'rejected') ||
        (existingUser && existingUser.account_status === 'pending_verification') ||
        (existingUser && existingCompany?.verificationStatus === 'pending')
      );

      if (existingUser && allowUserUpdate) {
        // Update existing user for re-registration
        console.log('🔄 Updating existing user for re-registration:', email);

        // If user account was rejected, also clean up company documents
        if (existingUser.account_status === 'rejected' && company && company.verificationDocuments && company.verificationDocuments.length > 0) {
          console.log('🗑️ Cleaning up old verification documents for rejected user account:', email);
          try {
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../uploads/verification-documents');

            // Delete old document files
            for (const doc of company.verificationDocuments) {
              if (doc.filename) {
                const filePath = path.join(uploadDir, doc.filename);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log('✅ Deleted old document:', doc.filename);
                }
              }
            }

            // Clear documents from company record
            await company.update({
              verificationDocuments: [],
              verificationMethod: null,
              verifiedAt: null
            }, { transaction });
          } catch (error) {
            console.error('❌ Error cleaning up old documents for rejected user:', error);
            // Don't fail the registration if document cleanup fails
          }
        }

        await existingUser.update({
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          user_type: userType,
          designation: designation,
          account_status: 'pending_verification', // Set to pending verification initially
          company_id: company.id,
          region: region || company.region || 'india', // Set user region from registration or company region
          preferences: {
            employerRole: companyId ? (role || 'recruiter') : 'admin',
            ...req.body.preferences
          }
        }, { transaction });
        user = existingUser;
      } else {
        // Create new employer user
        console.log('📝 Creating employer user with data:', {
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          user_type: userType,
          account_status: 'active',
          company_id: company.id
        });

        user = await User.create({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          user_type: userType,
          designation: designation,
          account_status: 'pending_verification', // Set to pending verification initially
          is_email_verified: false,
          company_id: company.id,
          region: region || company.region || 'india', // Set user region from registration or company region
          oauth_provider: 'local',
          preferences: {
            employerRole: companyId ? (role || 'recruiter') : 'admin',
            ...req.body.preferences
          }
        }, { transaction });
      }

      console.log('✅ Employer user created successfully:', user.id);

      // If this was a company claiming (unclaimed company joined), update claimedByUserId
      if (companyId && company && !company.claimedByUserId && company.claimedAt) {
        company.claimedByUserId = user.id;
        await company.save({ transaction });
        console.log('✅ Updated company claimedByUserId:', user.id);
      }

      // Commit the transaction
      await transaction.commit();

      // Generate JWT token
      const token = generateToken(user);

      console.log('✅ Employer signup completed successfully for:', email);

      // Create admin notifications for new employer and company registration
      try {
        await AdminNotificationService.notifyNewRegistration('employer', user, company);
        if (company) {
          await AdminNotificationService.notifyNewCompanyRegistration(company, user);
        }
      } catch (error) {
        console.error('⚠️ Error creating admin notifications:', error);
      }

      // Return success response with company information
      res.status(201).json({
        success: true,
        message: 'Employer account created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            userType: user.user_type,
            isEmailVerified: user.is_email_verified,
            accountStatus: user.account_status,
            companyId: user.company_id
          },
          company: company ? {
            id: company.id,
            name: company.name,
            industries: company.industries || [],
            companySize: company.companySize,
            website: company.website,
            email: company.email,
            phone: company.phone,
            region: company.region,
            companyAccountType: company.companyAccountType,
            verificationStatus: company.verificationStatus
          } : undefined,
          token
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ Transaction error during employer signup:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Employer signup error:', error);

    // Handle specific database errors
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

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    console.log('🔍 Login request received');

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

    const { email, password, loginType } = req.body;
    console.log('🧪 Login debug: rawEmail=', req.body?.email, 'sanitizedEmail=', email, 'loginType=', loginType);

    // Find user by email (exact match first)
    let user = await User.findOne({ where: { email } });
    console.log('🧪 Login debug: exact match found? ', !!user);

    // Gmail-specific fallback: if not found and looks like gmail, try matching ignoring dots
    if (!user) {
      const lowerEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
      const looksLikeGmail = lowerEmail.endsWith('@gmail.com') || lowerEmail.endsWith('@googlemail.com');
      console.log('🧪 Login debug: looksLikeGmail=', looksLikeGmail, 'lowerEmail=', lowerEmail);
      if (looksLikeGmail) {
        const { sequelize } = require('../config/sequelize');
        const strippedInput = lowerEmail.replace(/\./g, '');
        console.log('🧪 Login debug: strippedInputForFallback=', strippedInput);
        user = await User.findOne({
          where: sequelize.where(
            sequelize.fn('replace', sequelize.fn('lower', sequelize.col('email')), '.', ''),
            strippedInput
          )
        });
        console.log('🧪 Login debug: fallback match found? ', !!user);
      }
    }

    if (!user) {
      console.log('❌ User not found after exact+fallback:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', { id: user.id, email: user.email, userType: user.user_type });

    // Check account status
    if (user.account_status === 'pending_verification') {
      console.log('❌ Account pending verification:', user.account_status);
      return res.status(403).json({
        success: false,
        message: 'Your account verification is pending. Please wait for admin approval.',
        status: 'pending_verification'
      });
    }

    if (user.account_status === 'rejected') {
      console.log('❌ Account rejected:', user.account_status);
      return res.status(403).json({
        success: false,
        message: 'Your account verification was rejected. Please contact support or re-register with correct documents.',
        status: 'rejected',
        redirectTo: '/employer-register'
      });
    }

    if (user.account_status !== 'active') {
      console.log('❌ Account not active:', user.account_status);
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified successfully');

    // For employer/admin users, verify company membership and verification status
    if ((user.user_type === 'employer' || user.user_type === 'admin') && loginType !== 'admin') {
      if (!user.company_id) {
        console.log('❌ Employer user has no company association:', email);
        return res.status(403).json({
          success: false,
          message: 'Your account is not associated with any company. Please contact your administrator.',
          redirectTo: '/employer-register'
        });
      }

      // Verify company exists and is active
      const company = await Company.findByPk(user.company_id);
      if (!company) {
        console.log('❌ Company not found for user:', email);
        return res.status(403).json({
          success: false,
          message: 'Your company account is not found. Please contact support.',
          redirectTo: '/employer-register'
        });
      }

      if (!company.isActive || company.companyStatus !== 'active') {
        console.log('❌ Company is not active:', company.companyStatus);
        return res.status(403).json({
          success: false,
          message: 'Your company account is not active. Please contact support.',
          redirectTo: '/employer-register'
        });
      }

      // Verify email verification for employer users
      if (user.user_type === 'employer' && !user.is_email_verified) {
        console.log('❌ Employer email not verified:', email);
        return res.status(403).json({
          success: false,
          message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          status: 'email_not_verified',
          redirectTo: '/employer-login'
        });
      }

      console.log('✅ Company membership verified:', { companyId: company.id, companyName: company.name });
    }

    // Validate login type if specified
    if (loginType) {
      console.log('🔍 Validating login type:', { loginType, userType: user.user_type });

      if (loginType === 'employer' && user.user_type === 'jobseeker') {
        console.log('❌ Jobseeker trying to login through employer login');
        return res.status(403).json({
          success: false,
          message: 'This account is registered as a jobseeker. Please use the jobseeker login page.',
          redirectTo: '/login'
        });
      }

      if (loginType === 'jobseeker' && (user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'superadmin')) {
        console.log('❌ Employer/Admin/Superadmin trying to login through jobseeker login');
        return res.status(403).json({
          success: false,
          message: 'This account is registered as an employer. Please use the employer login page.',
          redirectTo: '/employer-login'
        });
      }

      if (loginType === 'employer' && user.user_type === 'superadmin') {
        console.log('❌ Superadmin trying to login through employer login');
        return res.status(403).json({
          success: false,
          message: 'This account is registered as a system administrator. Please use the admin login page.',
          redirectTo: '/admin-login'
        });
      }

      // Validate admin login - only allow admin and superadmin users
      if (loginType === 'admin' && user.user_type !== 'superadmin') {
        console.log('❌ Non-admin user trying to login through admin login:', user.user_type);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
          redirectTo: '/login'
        });
      }
    }

    // Update last login
    await user.update({ last_login_at: new Date() });

    // Reactivate inactive jobseekers when they log in
    if (user.user_type === 'jobseeker' && user.account_status === 'inactive') {
      const JobseekerInactivityService = require('../services/jobseekerInactivityService');
      await JobseekerInactivityService.reactivateJobseekerAccount(user.id);
      console.log('✅ Reactivated inactive jobseeker account:', user.email);
    }

    // Track login activity
    await trackLogin(user.id, req, 'email');

    // Generate JWT token
    const token = generateToken(user);

    // Prepare response data
    const userRegions = user.preferences?.regions || [user.region].filter(Boolean);

    // Get company info early for redirect determination
    let company = null;
    if ((user.user_type === 'employer' || user.user_type === 'admin') && user.company_id) {
      company = await Company.findByPk(user.company_id);
    }

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
        companyId: user.company_id,
        region: user.region,
        regions: userRegions, // Include regions array for multi-portal access
        currentLocation: user.current_location,
        profileCompletion: user.profile_completion,
        permissions: normalizePermissions(user)
      },
      token,
      redirectTo: getRedirectUrl(user.user_type, user.region, company)
    };

    // If user is an employer or admin, include company information
    if (company) {
      responseData.company = {
        id: company.id,
        name: company.name,
        industries: company.industries || [],
        companySize: company.companySize,
        website: company.website,
        email: company.contactEmail,
        phone: company.contactPhone,
        verificationStatus: company.verificationStatus,
        companyAccountType: company.companyAccountType,
        region: company.region // Include company region in response
      };
    }

    console.log('✅ Login successful for user:', user.email);

    // Create greeting notification for first-time login
    try {
      const { Notification } = require('../config/index');

      // Check if this is the first login (no previous notifications)
      const existingNotifications = await Notification.count({
        where: { userId: user.id }
      });

      if (existingNotifications === 0) {
        // Create a personalized greeting notification
        const greetingMessages = {
          jobseeker: {
            title: '🎉 Welcome to JobPortal!',
            message: `Hi ${user.first_name}! Welcome to your job search journey. Complete your profile, upload your resume, and start applying to amazing opportunities. We're here to help you find your dream job!`,
            actionUrl: '/dashboard',
            actionText: 'Complete Profile'
          },
          employer: {
            title: '🚀 Welcome to JobPortal!',
            message: `Hello ${user.first_name}! Welcome to our employer platform. Post your first job, find talented candidates, and grow your team. Let's get started with creating your company profile!`,
            actionUrl: '/employer-dashboard',
            actionText: 'Post Your First Job'
          },
          admin: {
            title: '👋 Welcome to JobPortal!',
            message: `Welcome ${user.first_name}! You now have admin access to manage the platform. Explore the admin dashboard to oversee users, companies, and system operations.`,
            actionUrl: '/admin/dashboard',
            actionText: 'Admin Dashboard'
          },
          superadmin: {
            title: '🔧 Welcome to JobPortal!',
            message: `Welcome ${user.first_name}! You have super admin privileges. Access the super admin panel to manage the entire platform and system configurations.`,
            actionUrl: '/super-admin/dashboard',
            actionText: 'Super Admin Panel'
          }
        };

        const greeting = greetingMessages[user.user_type] || greetingMessages.jobseeker;

        await Notification.create({
          userId: user.id,
          type: 'system',
          title: greeting.title,
          message: greeting.message,
          priority: 'high',
          actionUrl: greeting.actionUrl,
          actionText: greeting.actionText,
          isRead: false
        });

        console.log('✅ Greeting notification created for first-time user:', user.email);
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create greeting notification:', notificationError?.message || notificationError);
      // Don't fail the login if notification creation fails
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Map user data to frontend format (camelCase)
    const userRegions = user.preferences?.regions || [user.region].filter(Boolean);
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      isEmailVerified: user.is_email_verified,
      accountStatus: user.account_status,
      lastLoginAt: user.last_login_at,
      companyId: user.company_id,
      phone: user.phone,
      avatar: user.avatar,
      currentLocation: user.current_location,
      headline: user.headline,
      summary: user.summary,
      profileCompletion: user.profile_completion,
      designation: user.designation,
      region: user.region,
      regions: userRegions, // Include regions array for multi-portal access
      permissions: normalizePermissions(user)
    };

    res.status(200).json({
      success: true,
      data: { user: userData }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // Track logout activity if user is authenticated
    if (req.user) {
      await trackLogout(req.user.id, req);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout tracking error:', error);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Generate new token
    const newToken = generateToken(user);

    res.status(200).json({
      success: true,
      data: { token: newToken }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if account is active
    if (user.account_status !== 'active') {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpiry
    });

    // Send password reset email asynchronously to avoid blocking the response
    try {
      const userName = user.first_name || user.email.split('@')[0];
      console.log(`📧 Scheduling password reset email for: ${user.email}`);

      // Fire-and-forget: do not await to prevent UI hanging on slow SMTP
      Promise.resolve()
        .then(() => {
          console.log(`📧 Attempting to send password reset email to: ${user.email}`);
          return emailService.sendPasswordResetEmail(user.email, resetToken, userName);
        })
        .then((result) => {
          console.log('✅ Password reset email sent successfully to:', user.email);
          console.log('📧 Email result:', result);
        })
        .catch((emailError) => {
          console.error('❌ Failed to send password reset email to:', user.email);
          console.error('❌ Email error details:', emailError);
        });
    } catch (emailScheduleError) {
      console.error('❌ Failed to schedule password reset email:', emailScheduleError);
    }

    // Always respond immediately for security and UX
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reset password endpoint
router.post('/reset-password', validateResetPassword, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    await user.update({
      password: password,
      password_reset_token: null,
      password_reset_expires: null
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify reset token endpoint
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by reset token
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid'
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test email endpoint for debugging
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    const testEmail = email || 'test@example.com';

    console.log(`🧪 Testing email service with: ${testEmail}`);

    const result = await emailService.sendPasswordResetEmail(
      testEmail,
      'test-token-' + Date.now(),
      'Test User'
    );

    console.log('📧 Test email result:', result);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      result,
      testEmail
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
});

// Cross-portal signup endpoint - Check if user exists for different region
router.post('/check-existing-user', async (req, res) => {
  try {
    const { email, password, requestingRegion } = req.body;

    console.log('🔍 Checking existing user for cross-portal signup:', { email, requestingRegion });

    if (!email || !password || !requestingRegion) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and requesting region are required'
      });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (!existingUser) {
      // User doesn't exist, proceed with normal registration
      return res.status(200).json({
        success: true,
        userExists: false,
        message: 'User does not exist. Proceed with normal registration.'
      });
    }

    // User exists, check if password is correct
    const isValidPassword = await existingUser.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please enter the correct password.'
      });
    }

    // Check if user already has access to the requesting region
    const userRegions = existingUser.preferences?.regions || [];
    if (userRegions.includes(requestingRegion)) {
      return res.status(409).json({
        success: false,
        message: `You already have access to ${requestingRegion === 'gulf' ? 'Gulf' : 'India'} portal.`
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user preferences temporarily
    if (!existingUser.preferences) {
      existingUser.preferences = {};
    }
    existingUser.preferences.crossPortalOTP = {
      code: otp,
      expires: otpExpires.toISOString(),
      region: requestingRegion
    };
    await existingUser.save();

    // Send OTP email
    try {
      await emailService.sendOTPEmail(existingUser.email, otp);
      console.log('✅ OTP sent to:', existingUser.email);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Don't fail the request, just log the error
    }

    return res.status(200).json({
      success: true,
      userExists: true,
      message: 'Password verified. OTP sent to your email.',
      data: {
        userId: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.first_name
      }
    });

  } catch (error) {
    console.error('❌ Check existing user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and grant access to new region
router.post('/verify-otp-and-register', async (req, res) => {
  try {
    const { userId, otp, requestingRegion } = req.body;

    console.log('🔍 Verifying OTP for cross-portal registration:', { userId, requestingRegion });

    if (!userId || !otp || !requestingRegion) {
      return res.status(400).json({
        success: false,
        message: 'User ID, OTP, and requesting region are required'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check OTP
    const storedOTP = user.preferences?.crossPortalOTP;

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    if (storedOTP.code !== otp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Check if OTP has expired
    if (new Date(storedOTP.expires) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check if OTP is for the correct region
    if (storedOTP.region !== requestingRegion) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region for this OTP.'
      });
    }

    // Grant access to the new region
    const userRegions = user.preferences?.regions || [];
    if (!userRegions.includes(requestingRegion)) {
      userRegions.push(requestingRegion);
    }

    // Update user preferences using raw SQL for proper JSONB handling
    const updatedPreferences = {
      ...user.preferences,
      regions: userRegions
    };
    // Remove crossPortalOTP from the object
    delete updatedPreferences.crossPortalOTP;

    await sequelize.query(
      `UPDATE users SET preferences = :prefs::jsonb WHERE id = :userId`,
      {
        replacements: {
          prefs: JSON.stringify(updatedPreferences),
          userId: user.id
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    // Refresh user to get updated preferences
    user = await User.findByPk(userId);

    console.log('✅ User preferences updated:', user.preferences);

    console.log('✅ User registered for cross-portal access:', { userId, region: requestingRegion });

    // Generate JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Successfully registered for ${requestingRegion === 'gulf' ? 'Gulf' : 'India'} portal!`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          region: user.region,
          regions: userRegions,
          isEmailVerified: user.is_email_verified,
          accountStatus: user.account_status
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP and register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
