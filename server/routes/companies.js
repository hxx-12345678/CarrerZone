const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const Job = require('../models/Job');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticateToken } = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

const router = express.Router();
// (moved list and join company routes below middleware definition)

// Import CompanyPhoto model from config
const { CompanyPhoto } = require('../config');

// Middleware to verify JWT token (must be defined before use)


// Use memory storage for Cloudinary uploads
const companyPhotoStorage = multer.memoryStorage();

// Define upload middlewares BEFORE routes that use them
const companyPhotoUpload = multer({
  storage: companyPhotoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only JPG, PNG, GIF, and WebP files are allowed'));
  }
});

// Cloudinary upload configuration
const { uploadBufferToCloudinary, isConfigured } = require('../config/cloudinary');

// Use memory storage (Cloudinary doesn't need disk storage)
const logoStorage = multer.memoryStorage();

const companyLogoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only JPG, PNG, GIF, and WebP files are allowed'));
  }
});

// Upload a company gallery photo
router.post('/:id/photos', authenticateToken, checkPermission('settings'), companyPhotoUpload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { altText, caption, displayOrder, isPrimary } = req.body || {};
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo file provided' });
    }

    // Only company owner/admin can add photos
    if (req.user.user_type !== 'admin' && String(req.user.company_id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Upload to Cloudinary (persistent cloud storage)
    let fileUrl, filename, publicId;

    if (isConfigured()) {
      console.log('☁️ Uploading company photo to Cloudinary...');
      const cloudinaryResult = await uploadBufferToCloudinary(
        req.file.buffer,
        'company-photos',
        {
          public_id: `company-${id}-photo-${Date.now()}`,
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        }
      );
      fileUrl = cloudinaryResult.url;
      publicId = cloudinaryResult.publicId;
      filename = req.file.originalname;
      console.log('✅ Photo uploaded to Cloudinary:', fileUrl);
    } else {
      console.warn('⚠️ Cloudinary not configured, using local storage');
      filename = `photo-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
      const localPath = path.join(__dirname, '../uploads/company-photos', filename);
      const fs = require('fs');
      if (!fs.existsSync(path.dirname(localPath))) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
      }
      fs.writeFileSync(localPath, req.file.buffer);
      fileUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/uploads/company-photos/${filename}`;
    }

    // If marking as primary, unset others for this company
    if (isPrimary === 'true' || isPrimary === true) {
      try {
        await CompanyPhoto.update({ isPrimary: false }, { where: { companyId: id } });
      } catch (_) { }
    }

    const photo = await CompanyPhoto.create({
      companyId: id,
      filename,
      filePath: publicId || `/uploads/company-photos/${filename}`,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      altText: altText || null,
      caption: caption || null,
      displayOrder: parseInt(displayOrder) || 0,
      isPrimary: isPrimary === 'true' || isPrimary === true || false,
      uploadedBy: req.user.id
    });

    return res.status(201).json({ success: true, message: 'Company photo uploaded', data: photo });
  } catch (error) {
    console.error('Company photo upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload photo' });
  }
});

// List company photos (public)
router.get('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    // CompanyPhoto model is now directly imported
    const photos = await CompanyPhoto.findAll({
      where: { companyId: id, isActive: true },
      order: [['display_order', 'ASC'], ['created_at', 'ASC']]
    });

    console.log('🔍 Company photos found:', photos.length);
    console.log('🔍 First photo data:', photos[0] ? {
      id: photos[0].id,
      fileUrl: photos[0].fileUrl,
      filePath: photos[0].filePath,
      filename: photos[0].filename
    } : 'No photos');

    return res.status(200).json({ success: true, data: photos });
  } catch (error) {
    console.error('List company photos error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list photos' });
  }
});

// Delete a company photo
router.delete('/photos/:photoId', authenticateToken, checkPermission('settings'), async (req, res) => {
  try {
    const { photoId } = req.params;
    // CompanyPhoto model is now directly imported
    const photo = await CompanyPhoto.findByPk(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    // Must be admin or owner of company
    if (req.user.user_type !== 'admin' && String(req.user.company_id) !== String(photo.companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete file from disk (best-effort)
    try {
      const absPath = path.join(__dirname, '..', photo.filePath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch (_) { }

    await photo.destroy();
    return res.status(200).json({ success: true, message: 'Company photo deleted' });
  } catch (error) {
    console.error('Delete company photo error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
});

// Upload/replace company logo
router.post('/:id/logo', authenticateToken, checkPermission('settings'), companyLogoUpload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file provided' });
    }

    // Only company owner/admin can update
    if (req.user.user_type !== 'admin' && String(req.user.company_id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Upload to Cloudinary (persistent cloud storage)
    let fileUrl;

    if (isConfigured()) {
      console.log('☁️ Uploading logo to Cloudinary...');
      const cloudinaryResult = await uploadBufferToCloudinary(
        req.file.buffer,
        'company-logos',
        {
          public_id: `company-logo-${id}-${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        }
      );
      fileUrl = cloudinaryResult.url;
      console.log('✅ Logo uploaded to Cloudinary:', fileUrl);
    } else {
      console.warn('⚠️ Cloudinary not configured, using local storage (files will be lost on restart!)');
      const filename = `logo-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
      const localPath = path.join(__dirname, '../uploads/company-logos', filename);
      const fs = require('fs');
      if (!fs.existsSync(path.dirname(localPath))) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
      }
      fs.writeFileSync(localPath, req.file.buffer);
      fileUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/uploads/company-logos/${filename}`;
    }

    await company.update({ logo: fileUrl });

    return res.status(200).json({ success: true, message: 'Company logo updated', data: { logo: fileUrl } });
  } catch (error) {
    console.error('Company logo upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
});

// Upload/replace company banner/placeholder image
router.post('/:id/banner', authenticateToken, checkPermission('settings'), companyLogoUpload.single('banner'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No banner file provided' });
    }

    // Only company owner/admin can update
    if (req.user.user_type !== 'admin' && String(req.user.company_id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Upload to Cloudinary (persistent cloud storage)
    let fileUrl;

    if (isConfigured()) {
      console.log('☁️ Uploading banner to Cloudinary...');
      const cloudinaryResult = await uploadBufferToCloudinary(
        req.file.buffer,
        'company-banners',
        {
          public_id: `company-banner-${id}-${Date.now()}`,
          transformation: [
            { width: 1200, height: 400, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        }
      );
      fileUrl = cloudinaryResult.url;
      console.log('✅ Banner uploaded to Cloudinary:', fileUrl);
    } else {
      console.warn('⚠️ Cloudinary not configured, using local storage (files will be lost on restart!)');
      const filename = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
      const localPath = path.join(__dirname, '../uploads/company-banners', filename);
      const fs = require('fs');
      if (!fs.existsSync(path.dirname(localPath))) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
      }
      fs.writeFileSync(localPath, req.file.buffer);
      fileUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/uploads/company-banners/${filename}`;
    }

    await company.update({ banner: fileUrl });

    return res.status(200).json({ success: true, message: 'Company banner updated', data: { banner: fileUrl } });
  } catch (error) {
    console.error('Company banner upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload banner' });
  }
});

// Middleware to verify JWT token


// List companies (public)
router.get('/', async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { slug: { [Op.iLike]: `%${q}%` } }
      ];
    }
    const companies = await Company.findAll({
      where,
      attributes: [
        'id', 'name', 'slug', 'logo', 'industries', 'companySize', 'website',
        'city', 'state', 'country', 'region', 'description', 'foundedYear',
        'revenue', 'companyType', 'natureOfBusiness', 'companyTypes', 'isFeatured', 'isVerified', 'isActive', 'verificationStatus', 'created_at', 'updated_at',
        // Add claiming fields for registration flow
        'isClaimed', 'createdByAgencyId', 'claimedAt'
      ],
      include: [
        {
          model: Company,
          as: 'CreatedByAgency',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['isFeatured', 'DESC'], ['name', 'ASC']],
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0
    });

    // Add active jobs count for each company
    const companiesWithStats = await Promise.all(companies.map(async (company) => {
      let activeJobsCount = 0;
      try {
        activeJobsCount = await Job.count({ where: { companyId: company.id, status: 'active' } });
      } catch (e) {
        console.warn('Could not compute activeJobsCount for company', company.id, e?.message);
        activeJobsCount = 0; // Default to 0 if there's an error
      }

      const profileViews = Math.floor(Math.random() * 50) + 1;
      console.log(`🔍 Company ${company.name}: activeJobs=${activeJobsCount}, profileViews=${profileViews}`);

      // Build comprehensive company data for list view
      const companyData = {
        ...company.toJSON(),
        activeJobsCount,
        profileViews, // Generate some realistic view counts for demo
        // Additional computed fields for frontend compatibility
        location: `${company.city || ''}, ${company.state || ''}, ${company.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
        sector: company.industries && company.industries.length > 0 ? company.industries[0] : 'Other', // Map first industry to sector for compatibility
        employees: company.companySize,
        headquarters: `${company.city || ''}, ${company.state || ''}, ${company.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
        founded: company.foundedYear, // Map foundedYear to founded for compatibility
        // Default values for missing fields
        rating: 0,
        reviews: 0,
        openings: activeJobsCount,
        benefits: company.benefits || [],
        workCulture: company.culture || '',
        salaryRange: '',
        featured: company.isFeatured || false,
        isVerified: company.isVerified || false
      };

      return companyData;
    }));

    return res.json({ success: true, data: companiesWithStats });
  } catch (error) {
    console.error('List companies error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Join existing company (job seekers become employers, existing employers without company)
router.post('/join', authenticateToken, async (req, res) => {
  try {
    // Allow job seekers to become employers by joining a company
    if (req.user.user_type !== 'jobseeker' && req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Invalid user type for joining company' });
    }
    if (req.user.company_id) {
      return res.status(400).json({ success: false, message: 'User already associated with a company' });
    }
    const { companyId, role } = req.body || {};
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'companyId is required' });
    }
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Persist role into user preferences (non-breaking)
    const prefs = req.user.preferences || {};
    prefs.employerRole = (role && typeof role === 'string') ? role : (prefs.employerRole || 'recruiter');

    // Update user: job seekers become employers, existing employers stay employers
    const newUserType = req.user.user_type === 'jobseeker' ? 'employer' : req.user.user_type;

    await req.user.update({
      user_type: newUserType, // ✅ Job seekers become employers when joining company
      company_id: company.id,
      preferences: prefs
    });

    console.log(`✅ User ${req.user.id} joined company ${company.id} as ${newUserType}`);

    return res.json({
      success: true,
      message: 'Joined company successfully',
      data: {
        companyId: company.id,
        role: prefs.employerRole,
        userType: newUserType
      }
    });
  } catch (error) {
    console.error('Join company error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Create a new company
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, industries, companySize, website, description, address, city, state, country, email, phone, region, whyJoinUs, natureOfBusiness, companyTypes } = req.body;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only employers and admins can create companies'
      });
    }

    // Check if user already has a company
    if (req.user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User already has a company registered'
      });
    }

    // Generate unique slug from company name
    const generateSlug = async (companyName) => {
      let baseSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);

      let slug = baseSlug;
      let counter = 1;

      // Check if slug exists and generate unique one
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

    const companySlug = await generateSlug(name);

    // Create company record
    const company = await Company.create({
      name,
      slug: companySlug,
      industries: industries || ['Other'],
      companySize: companySize || '1-50',
      website,
      email: email || req.user.email,
      phone: phone || req.user.phone,
      description,
      whyJoinUs: typeof whyJoinUs === 'string' ? whyJoinUs : null,
      address,
      city,
      state,
      country: country || (region === 'gulf' ? 'UAE' : 'India'),
      region: region || 'india',
      contactPerson: `${req.user.first_name} ${req.user.last_name}`,
      contactEmail: req.user.email,
      contactPhone: req.user.phone,
      companyStatus: 'pending_approval',
      isActive: true,
      natureOfBusiness: Array.isArray(natureOfBusiness) ? natureOfBusiness : [],
      companyTypes: Array.isArray(companyTypes) ? companyTypes : []
    });

    // Update user with company_id and set as admin with Hiring Manager designation
    await req.user.update({
      company_id: company.id,
      user_type: 'admin', // User becomes admin when they create a company
      designation: 'Hiring Manager' // Set proper designation for company creators
    });

    // Fetch the updated user data
    const updatedUser = await User.findByPk(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company: {
          id: company.id,
          name: company.name,
          industries: company.industries || [],
          companySize: company.companySize,
          website: company.website,
          email: company.email,
          phone: company.phone,
          description: company.description,
          whyJoinUs: company.whyJoinUs,
          address: company.address,
          city: company.city,
          state: company.state,
          country: company.country,
          region: company.region,
          natureOfBusiness: company.natureOfBusiness || [],
          companyTypes: company.companyTypes || []
        },
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          user_type: updatedUser.user_type,
          company_id: updatedUser.company_id,
          // Add other user fields as needed
        }
      }
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Set company photo as placeholder
router.post('/:companyId/photos/:photoId/set-placeholder', authenticateToken, checkPermission('settings'), async (req, res) => {
  try {
    const { companyId, photoId } = req.params;

    // Check if user has access to this company
    if (req.user.user_type !== 'admin' && String(req.user.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find the photo
    const photo = await CompanyPhoto.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Check if photo belongs to the company
    if (String(photo.companyId) !== String(companyId)) {
      return res.status(400).json({ success: false, message: 'Photo does not belong to this company' });
    }

    // Unset all other placeholder photos for this company
    await CompanyPhoto.update(
      { isPlaceholder: false },
      { where: { companyId: companyId } }
    );

    // Set this photo as placeholder
    await photo.update({ isPlaceholder: true });

    return res.status(200).json({
      success: true,
      message: 'Placeholder image set successfully',
      data: photo
    });
  } catch (error) {
    console.error('Set placeholder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to set placeholder image' });
  }
});

// Get user's followed companies (MUST be before /:id route)
router.get('/followed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a jobseeker
    if (req.user.user_type !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can view followed companies'
      });
    }

    const CompanyFollow = require('../models/CompanyFollow');
    const followedCompanies = await CompanyFollow.findAll({
      where: { userId },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'slug', 'industries', 'logo']
      }],
      order: [['followedAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: followedCompanies.map(follow => ({
        id: follow.id,
        companyId: follow.companyId,
        followedAt: follow.followedAt,
        company: follow.company
      }))
    });

  } catch (error) {
    console.error('Get followed companies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get company information by ID (public access for job seekers, protected for employers)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to authenticate if token is provided
    let user = null;
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findByPk(decoded.id);
      }
    } catch (authError) {
      // Continue without authentication for public access
      console.log('No valid token provided, allowing public access to company info');
    }

    // Allow public access to company details for job seekers
    // Only restrict access if user is an employer trying to edit/update (not view)
    // For viewing company details, allow all users (public access)
    // This check is moved to PUT/PATCH endpoints only

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Compute active jobs count
    let activeJobsCount = 0;
    try {
      const Job = require('../models/Job');
      activeJobsCount = await Job.count({ where: { companyId: id, status: 'active' } });
    } catch (e) {
      console.warn('Could not compute activeJobsCount for company', id, e?.message);
    }

    // Set cache control headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Get additional company data
    let companyPhotos = [];
    let companyStats = {
      profileViews: Math.floor(Math.random() * 50) + 1,
      totalApplications: 0,
      averageRating: 0,
      totalReviews: 0
    };

    try {
      // Get company photos
      const { CompanyPhoto } = require('../config');
      companyPhotos = await CompanyPhoto.findAll({
        where: { companyId: id, isActive: true },
        order: [['display_order', 'ASC'], ['created_at', 'ASC']],
        limit: 10
      });

      // Get company statistics
      const JobApplication = require('../models/JobApplication');
      const totalApplications = await JobApplication.count({
        include: [{
          model: Job,
          as: 'job', // CRITICAL: Must specify alias as defined in JobApplication.associate
          where: { companyId: id },
          attributes: []
        }]
      });

      companyStats.totalApplications = totalApplications;
    } catch (e) {
      console.warn('Could not fetch additional company data:', e?.message);
    }

    // Build comprehensive company data
    const companyData = {
      id: company.id,
      name: company.name,
      industries: company.industries || [],
      companySize: company.companySize,
      website: company.website,
      email: company.email,
      phone: company.phone,
      description: company.description,
      about: company.description, // Alias for compatibility
      whyJoinUs: company.whyJoinUs,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      logo: company.logo,
      banner: company.banner,
      founded: company.foundedYear, // Map foundedYear to founded for compatibility
      headquarters: `${company.city || ''}, ${company.state || ''}, ${company.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
      revenue: company.revenue,
      companyType: company.companyType,
      employees: company.companySize,
      profileViews: companyStats.profileViews,
      totalApplications: companyStats.totalApplications,
      averageRating: companyStats.averageRating,
      totalReviews: companyStats.totalReviews,
      activeJobsCount,
      photos: companyPhotos,
      // New fields
      natureOfBusiness: company.natureOfBusiness || [],
      companyTypes: company.companyTypes || [],
      // Additional computed fields
      location: `${company.city || ''}, ${company.state || ''}, ${company.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
      sector: company.industries && company.industries.length > 0 ? company.industries[0] : 'Other', // Map first industry to sector for compatibility
      benefits: company.benefits || [],
      workCulture: company.culture || '',
      featured: company.isFeatured || false,
      isVerified: company.isVerified || false,
      region: company.region || null, // Include region field
      createdAt: company.created_at,
      updatedAt: company.updatedAt
    };

    res.json({
      success: true,
      data: companyData
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get company jobs (public access)
router.get('/:id/jobs', async (req, res) => {
  try {
    const { id } = req.params;
    const { department, location, experience, salary, region } = req.query;
    const Job = require('../models/Job');
    const { Op } = require('sequelize');

    // CRITICAL: Only show active jobs that are NOT expired
    // Expired jobs (validTill < now) should NOT appear in public listings
    const now = new Date();
    const where = {
      companyId: id,
      status: 'active',
      [Op.and]: [
        { [Op.or]: [{ validTill: null }, { validTill: { [Op.gte]: now } }] }
      ]
    };

    // Add region filter if provided
    if (region) {
      where.region = region;
    }

    // Add department filter
    if (department && department !== 'all') {
      where[Op.or] = [
        { department: { [Op.iLike]: `%${department}%` } },
        { category: { [Op.iLike]: `%${department}%` } }
      ];
    }

    // Add location filter
    if (location && location !== 'all') {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { location: { [Op.iLike]: `%${location}%` } },
        { city: { [Op.iLike]: `%${location}%` } },
        { state: { [Op.iLike]: `%${location}%` } },
        { country: { [Op.iLike]: `%${location}%` } }
      ];
    }

    // Add experience filter
    if (experience && experience !== 'all') {
      const experienceMap = {
        'entry': { experienceMin: { [Op.lte]: 1 } },
        'mid': { experienceMin: { [Op.gte]: 2, [Op.lte]: 5 } },
        'senior': { experienceMin: { [Op.gte]: 6 } }
      };

      if (experienceMap[experience]) {
        Object.assign(where, experienceMap[experience]);
      }
    }

    // Add salary filter
    if (salary && salary !== 'all') {
      const salaryMap = {
        'low': { salaryMin: { [Op.lte]: 500000 } },
        'medium': { salaryMin: { [Op.gte]: 500001, [Op.lte]: 1500000 } },
        'high': { salaryMin: { [Op.gte]: 1500001 } }
      };

      if (salaryMap[salary]) {
        Object.assign(where, salaryMap[salary]);
      }
    }

    const jobs = await Job.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: [
        'id', 'title', 'location', 'jobType', 'experienceLevel',
        'salaryMin', 'salaryMax', 'description', 'requirements',
        'created_at', 'isUrgent', 'department', 'category', 'city',
        'state', 'country', 'salary', 'skills', 'applications',
        'updated_at', 'status', 'remoteWork', 'experienceMin', 'experienceMax', 'validTill', 'region'
      ]
    });

    // Set cache control headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update company information
router.put('/:id', authenticateToken, checkPermission('settings'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, industries, companySize, website, description, address, city, state, country,
      whyJoinUs, natureOfBusiness, companyTypes, phone, email, about, region
    } = req.body;

    // Check if the user has access to this company
    if (req.user.user_type !== 'admin') {
      if (req.user.user_type !== 'employer' || String(req.user.company_id) !== String(id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    console.log('🔄 Updating company with data:', { natureOfBusiness, companyTypes });

    // Update company information
    const updateData = {
      name: name || company.name,
      industries: industries || company.industries || ['Other'],
      companySize: companySize || company.companySize,
      website: website || company.website,
      description: description || about || company.description,
      whyJoinUs: typeof whyJoinUs === 'string' ? whyJoinUs : company.whyJoinUs,
      address: address || company.address,
      city: city || company.city,
      state: state || company.state,
      country: country || company.country,
      phone: phone || company.phone,
      email: email || company.email,
      region: region || company.region
    };

    // Add new fields if provided (arrays)
    if (Array.isArray(natureOfBusiness)) {
      updateData.natureOfBusiness = natureOfBusiness;
    }
    if (Array.isArray(companyTypes)) {
      updateData.companyTypes = companyTypes;
    }

    await company.update(updateData);

    console.log('✅ Company updated successfully with natureOfBusiness and companyTypes');

    res.json({
      success: true,
      message: 'Company information updated successfully',
      data: {
        id: company.id,
        name: company.name,
        industries: company.industries || [],
        companySize: company.companySize,
        website: company.website,
        email: company.email,
        phone: company.phone,
        description: company.description,
        about: company.description,
        whyJoinUs: company.whyJoinUs,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        natureOfBusiness: company.natureOfBusiness,
        companyTypes: company.companyTypes,
        logo: company.logo
      }
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Follow/Unfollow company endpoints
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user.id;

    // Check if user is a jobseeker
    if (req.user.user_type !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can follow companies'
      });
    }

    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if already following
    const CompanyFollow = require('../models/CompanyFollow');
    const existingFollow = await CompanyFollow.findOne({
      where: { userId, companyId }
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this company'
      });
    }

    // Create follow record
    const follow = await CompanyFollow.create({
      userId,
      companyId,
      notificationPreferences: {
        newJobs: true,
        companyUpdates: true,
        jobAlerts: true,
        email: true,
        push: true,
        sms: false
      }
    });

    console.log(`✅ User ${userId} started following company ${companyId}`);

    return res.json({
      success: true,
      message: 'Successfully followed company',
      data: { followId: follow.id }
    });

  } catch (error) {
    console.error('Follow company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user.id;

    // Check if user is a jobseeker
    if (req.user.user_type !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can unfollow companies'
      });
    }

    // Find and delete follow record
    const CompanyFollow = require('../models/CompanyFollow');
    const follow = await CompanyFollow.findOne({
      where: { userId, companyId }
    });

    if (!follow) {
      return res.status(404).json({
        success: false,
        message: 'Not following this company'
      });
    }

    await follow.destroy();

    console.log(`✅ User ${userId} stopped following company ${companyId}`);

    return res.json({
      success: true,
      message: 'Successfully unfollowed company'
    });

  } catch (error) {
    console.error('Unfollow company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Removed duplicate /followed route - moved to before /:id route

// Check if user is following a specific company
router.get('/:id/follow-status', authenticateToken, async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user.id;

    const CompanyFollow = require('../models/CompanyFollow');
    const follow = await CompanyFollow.findOne({
      where: { userId, companyId }
    });

    return res.json({
      success: true,
      data: {
        isFollowing: !!follow,
        followedAt: follow?.followedAt || null
      }
    });

  } catch (error) {
    console.error('Get follow status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Rate a company (POST /api/companies/:id/rate)
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user.id;
    const { rating } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const CompanyReview = require('../models/CompanyReview');

    // Check if user has already rated this company
    let existingReview = await CompanyReview.findOne({
      where: { userId, companyId }
    });

    if (existingReview) {
      // Update existing rating
      existingReview.rating = rating;
      existingReview.review = existingReview.review || 'User rating'; // Keep existing review or use default
      await existingReview.save();

      return res.json({
        success: true,
        message: 'Rating updated successfully',
        data: {
          rating: existingReview.rating,
          reviewId: existingReview.id
        }
      });
    } else {
      // Create new rating (with minimal review text since it's required)
      const newReview = await CompanyReview.create({
        companyId,
        userId,
        rating,
        review: 'User rating', // Default text for rating-only submissions
        employmentStatus: 'current', // Default status
        status: 'approved' // Auto-approve simple ratings
      });

      return res.json({
        success: true,
        message: 'Rating submitted successfully',
        data: {
          rating: newReview.rating,
          reviewId: newReview.id
        }
      });
    }

  } catch (error) {
    console.error('Rate company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's rating for a company (GET /api/companies/:id/user-rating)
router.get('/:id/user-rating', authenticateToken, async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user.id;

    const CompanyReview = require('../models/CompanyReview');
    const review = await CompanyReview.findOne({
      where: { userId, companyId }
    });

    return res.json({
      success: true,
      data: {
        rating: review ? review.rating : null,
        hasRated: !!review
      }
    });

  } catch (error) {
    console.error('Get user rating error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cleanup orphaned photos (admin only)
router.post('/cleanup-orphaned-photos', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { cleanupOrphanedPhotos } = require('../scripts/cleanup-orphaned-photos');
    await cleanupOrphanedPhotos();

    return res.status(200).json({ success: true, message: 'Orphaned photos cleaned up successfully' });
  } catch (error) {
    console.error('Cleanup orphaned photos error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cleanup orphaned photos' });
  }
});

module.exports = router;
