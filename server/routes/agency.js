const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { Company, AgencyClientAuthorization, User } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'uploads/agency-documents';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// ============================================
// AGENCY KYC VERIFICATION ROUTES
// ============================================

/**
 * @route   POST /api/agency/kyc/upload
 * @desc    Upload agency KYC documents
 * @access  Private (Agency)
 */
router.post('/kyc/upload', authenticateToken, upload.fields([
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'authSignatoryId', maxCount: 1 },
  { name: 'incorporationCertificate', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not associated with a company' 
      });
    }
    
    const company = await Company.findByPk(user.companyId);
    
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    // Check if company is an agency
    if (!company.isAgency()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only recruiting agencies can upload KYC documents' 
      });
    }
    
    // Build agency documents object
    const agencyDocuments = company.agencyDocuments || {};
    
    // Map uploaded files to document types
    if (req.files.gstCertificate) {
      agencyDocuments.gst = {
        url: `/uploads/agency-documents/${req.files.gstCertificate[0].filename}`,
        uploadedAt: new Date(),
        verified: false
      };
    }
    
    if (req.files.panCard) {
      agencyDocuments.pan = {
        url: `/uploads/agency-documents/${req.files.panCard[0].filename}`,
        uploadedAt: new Date(),
        verified: false
      };
    }
    
    if (req.files.addressProof) {
      agencyDocuments.addressProof = {
        url: `/uploads/agency-documents/${req.files.addressProof[0].filename}`,
        uploadedAt: new Date(),
        verified: false
      };
    }
    
    if (req.files.authSignatoryId) {
      agencyDocuments.authSignatoryId = {
        url: `/uploads/agency-documents/${req.files.authSignatoryId[0].filename}`,
        uploadedAt: new Date(),
        verified: false
      };
    }
    
    if (req.files.incorporationCertificate) {
      agencyDocuments.incorporationCertificate = {
        url: `/uploads/agency-documents/${req.files.incorporationCertificate[0].filename}`,
        uploadedAt: new Date(),
        verified: false
      };
    }
    
    if (req.files.businessLicense) {
      agencyDocuments.businessLicense = {
        url: `/uploads/agency-documents/${req.files.businessLicense[0].filename}`,
        uploadedAt: new Date(),
        verified: false
      };
    }
    
    // Update company with documents
    company.agencyDocuments = agencyDocuments;
    company.verificationStatus = 'pending';
    await company.save();
    
    // TODO: Trigger automated verification (GST API, OCR, etc.)
    // For now, we'll mark as pending manual review
    
    res.json({
      success: true,
      message: 'KYC documents uploaded successfully. Your application is under review.',
      data: {
        agencyDocuments: company.agencyDocuments,
        verificationStatus: company.verificationStatus
      }
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload KYC documents', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/agency/kyc/status
 * @desc    Get agency KYC verification status
 * @access  Private (Agency)
 */
router.get('/kyc/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not associated with a company' 
      });
    }
    
    const company = await Company.findByPk(user.companyId);
    
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        companyAccountType: company.companyAccountType,
        verificationStatus: company.verificationStatus,
        verifiedAt: company.verifiedAt,
        verificationMethod: company.verificationMethod,
        agencyDocuments: company.agencyDocuments,
        isVerifiedAgency: company.isVerifiedAgency()
      }
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get KYC status', 
      error: error.message 
    });
  }
});

// ============================================
// CLIENT AUTHORIZATION ROUTES
// ============================================

/**
 * @route   GET /api/agency/companies/search
 * @desc    Search existing companies to add as client
 * @access  Private (Agency)
 */
router.get('/companies/search', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'User not associated with a company'
      });
    }
    
    const agency = await Company.findByPk(user.companyId);
    
    if (!agency || !agency.isAgency()) {
      return res.status(403).json({
        success: false,
        message: 'Only agencies can search for companies'
      });
    }
    
    // Search for companies (excluding the agency itself)
    const companies = await Company.findAll({
      where: {
        id: {
          [Op.ne]: agency.id // Exclude the agency itself
        },
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            city: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            industry: {
              [Op.iLike]: `%${search}%`
            }
          }
        ],
        companyStatus: {
          [Op.notIn]: ['suspended', 'deleted']
        }
      },
      attributes: [
        'id',
        'name',
        'slug',
        'logo',
        'industry',
        'city',
        'companySize',
        'website',
        'verificationStatus'
      ],
      limit: 20,
      order: [['name', 'ASC']]
    });
    
    // Check which companies already have authorization requests
    const existingAuths = await AgencyClientAuthorization.findAll({
      where: {
        agencyCompanyId: agency.id,
        clientCompanyId: {
          [Op.in]: companies.map(c => c.id)
        }
      },
      attributes: ['clientCompanyId', 'status']
    });
    
    const authMap = {};
    existingAuths.forEach(auth => {
      authMap[auth.clientCompanyId] = auth.status;
    });
    
    // Add authorization status to each company
    const companiesWithStatus = companies.map(company => ({
      ...company.toJSON(),
      authorizationStatus: authMap[company.id] || null
    }));
    
    res.json({
      success: true,
      data: companiesWithStatus
    });
  } catch (error) {
    console.error('Company search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search companies',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/agency/clients/add
 * @desc    Add a new client (create authorization request)
 * @access  Private (Agency)
 */
router.post('/clients/add', authenticateToken, upload.fields([
  { name: 'authorizationLetter', maxCount: 1 },
  { name: 'serviceAgreement', maxCount: 1 },
  { name: 'clientGst', maxCount: 1 },
  { name: 'clientPan', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not associated with a company' 
      });
    }
    
    const agency = await Company.findByPk(user.companyId);
    
    if (!agency || !agency.isVerifiedAgency()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only verified agencies can add clients' 
      });
    }
    
    const {
      clientCompanyId,
      clientCompanyName,
      clientIndustry,
      clientLocation,
      clientWebsite,
      contractStartDate,
      contractEndDate,
      autoRenew,
      maxActiveJobs,
      jobCategories,
      allowedLocations,
      clientContactEmail,
      clientContactPhone,
      clientContactName
    } = req.body;
    
    // If creating a new client company
    let clientCompany;
    if (!clientCompanyId) {
      // Create new company profile for client
      const slug = clientCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      clientCompany = await Company.create({
        name: clientCompanyName,
        slug: slug + '-' + Date.now(),
        industry: clientIndustry,
        city: clientLocation,
        website: clientWebsite,
        companyAccountType: 'direct',
        companyStatus: 'active',
        verificationStatus: 'unverified',
        // Mark as unclaimed (created by agency)
        createdByAgencyId: agency.id,
        isClaimed: false, // Client hasn't claimed it yet
        claimedAt: null,
        claimedByUserId: null
      });
    } else {
      clientCompany = await Company.findByPk(clientCompanyId);
      
      if (!clientCompany) {
        return res.status(404).json({ 
          success: false, 
          message: 'Client company not found' 
        });
      }
    }
    
    // Check if authorization already exists
    const existingAuth = await AgencyClientAuthorization.findOne({
      where: {
        agencyCompanyId: agency.id,
        clientCompanyId: clientCompany.id
      }
    });
    
    if (existingAuth) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authorization already exists for this client' 
      });
    }
    
    // Build document URLs
    const authLetterUrl = req.files.authorizationLetter 
      ? `/uploads/agency-documents/${req.files.authorizationLetter[0].filename}` 
      : null;
      
    const serviceAgreementUrl = req.files.serviceAgreement 
      ? `/uploads/agency-documents/${req.files.serviceAgreement[0].filename}` 
      : null;
      
    const clientGstUrl = req.files.clientGst 
      ? `/uploads/agency-documents/${req.files.clientGst[0].filename}` 
      : null;
      
    const clientPanUrl = req.files.clientPan 
      ? `/uploads/agency-documents/${req.files.clientPan[0].filename}` 
      : null;
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Token valid for 7 days
    
    // Create authorization record
    const authorization = await AgencyClientAuthorization.create({
      agencyCompanyId: agency.id,
      clientCompanyId: clientCompany.id,
      status: 'pending_client_confirm',
      contractStartDate,
      contractEndDate,
      autoRenew: autoRenew === 'true' || autoRenew === true,
      canPostJobs: false, // Will be enabled after verification
      maxActiveJobs: maxActiveJobs ? parseInt(maxActiveJobs) : null,
      jobCategories: jobCategories ? JSON.parse(jobCategories) : [],
      allowedLocations: allowedLocations ? JSON.parse(allowedLocations) : [],
      authorizationLetterUrl: authLetterUrl,
      serviceAgreementUrl: serviceAgreementUrl,
      clientGstUrl: clientGstUrl,
      clientPanUrl: clientPanUrl,
      clientContactEmail,
      clientContactPhone,
      clientContactName,
      clientVerificationToken: verificationToken,
      clientVerificationTokenExpiry: tokenExpiry
    });
    
    // Send verification email to client
    try {
      console.log('📧 Sending verification email to client:', clientContactEmail);
      
      await emailService.sendClientVerificationEmail({
        clientEmail: clientContactEmail,
        clientCompanyName: clientCompany.name,
        agencyName: agency.name,
        agencyEmail: req.user.email || agency.email,
        contractStartDate,
        contractEndDate,
        maxActiveJobs,
        authorizationId: authorization.id,
        verificationToken
      });
      
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail the authorization creation if email fails
      // Admin can still manually verify
    }
    
    // TODO: Trigger automated document verification (GST API, etc.)
    
    res.json({
      success: true,
      message: 'Client authorization request created successfully. Verification email sent to client.',
      data: authorization
    });
  } catch (error) {
    console.error('Add client error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add client', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/agency/clients
 * @desc    Get all clients for an agency
 * @access  Private (Agency)
 */
router.get('/clients', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not associated with a company' 
      });
    }
    
    const agency = await Company.findByPk(user.companyId);
    
    if (!agency || !agency.isAgency()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only agencies can view clients' 
      });
    }
    
    const authorizations = await AgencyClientAuthorization.findAll({
      where: {
        agencyCompanyId: agency.id
      },
      include: [
        {
          model: Company,
          as: 'ClientCompany',
          attributes: ['id', 'name', 'slug', 'logo', 'industries', 'city', 'companyStatus']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: authorizations
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ 
      success: false, 
        message: 'Failed to get clients', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/agency/clients/:id
 * @desc    Get specific client authorization details
 * @access  Private (Agency)
 */
router.get('/clients/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not associated with a company' 
      });
    }
    
    const authorization = await AgencyClientAuthorization.findOne({
      where: {
        id: req.params.id,
        agencyCompanyId: user.companyId
      },
      include: [
        {
          model: Company,
          as: 'ClientCompany'
        }
      ]
    });
    
    if (!authorization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client authorization not found' 
      });
    }
    
    res.json({
      success: true,
      data: authorization
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get client details', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/agency/clients/active
 * @desc    Get only active clients (can post jobs)
 * @access  Private (Agency)
 */
router.get('/clients/active/list', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not associated with a company' 
      });
    }
    
    const agency = await Company.findByPk(user.companyId);
    
    if (!agency || !agency.isAgency()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only agencies can view clients' 
      });
    }
    
    const activeAuthorizations = await AgencyClientAuthorization.findAll({
      where: {
        agencyCompanyId: agency.id,
        status: 'active',
        canPostJobs: true
      },
      include: [
        {
          model: Company,
          as: 'ClientCompany',
          attributes: ['id', 'name', 'slug', 'logo', 'industry', 'city']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: activeAuthorizations
    });
  } catch (error) {
    console.error('Get active clients error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get active clients', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/agency/authorization-template
 * @desc    Download authorization letter template
 * @access  Public (any agency can download)
 */
router.get('/authorization-template', async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../templates/authorization-letter-template.txt');
    
    // Check if template exists
    if (!fsSync.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        message: 'Authorization template not found'
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="Authorization_Letter_Template.txt"');
    
    // Read and send file
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    res.send(templateContent);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template',
      error: error.message
    });
  }
});

module.exports = router;

