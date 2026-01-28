const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for different types of uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    
    // Determine upload type from route path or req.body.type
    // Note: req.body.type might not be available yet as multer parses form data after destination
    // So we check req.uploadType (set by route middleware) or req.body.type or use route path
    const uploadType = req.uploadType || req.body?.type || (req.path && req.path.includes('verification-document') ? 'verification_document' : 
                                                           req.path && req.path.includes('profile-photo') ? 'profile_photo' :
                                                           req.path && req.path.includes('company-logo') ? 'company_logo' :
                                                           req.path && req.path.includes('resume') ? 'resume' : 'general');
    
    switch (uploadType) {
      case 'verification_document':
        uploadDir = path.join(__dirname, '../uploads/verification-documents');
        break;
      case 'profile_photo':
        uploadDir = path.join(__dirname, '../uploads/profile-photos');
        break;
      case 'company_logo':
        uploadDir = path.join(__dirname, '../uploads/company-logos');
        break;
      case 'resume':
        uploadDir = path.join(__dirname, '../uploads/resumes');
        break;
      default:
        uploadDir = path.join(__dirname, '../uploads/general');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${req.user.id}-${uniqueSuffix}-${originalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    verification_document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    profile_photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    company_logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    general: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  };
  
  const type = req.body.type || 'general';
  const allowed = allowedTypes[type] || allowedTypes.general;
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed for ${type}. Allowed types: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route   POST /api/upload/verification-document
 * @desc    Upload verification document
 * @access  Private
 */
router.post('/verification-document', authenticateToken, (req, res, next) => {
  // Set upload type on request object so multer's destination function can access it
  // req.body is not available yet when multer determines destination
  req.uploadType = 'verification_document';
  // Also set it in req.body for the route handler (after multer parses form data)
  if (!req.body) {
    req.body = {};
  }
  req.body.type = 'verification_document';
  next();
}, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 Verification document uploaded:', req.file.filename, 'to:', req.file.destination);

    // Generate URL for the uploaded file
    const fileUrl = `/api/verification/documents/${req.file.filename}`;
    
    console.log(`✅ Verification document uploaded: ${req.file.filename} for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/upload/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/profile-photo', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/profile-photos/${req.file.filename}`;
    
    console.log(`✅ Profile photo uploaded: ${req.file.filename} for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Profile photo upload error:', error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Profile photo upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/upload/company-logo
 * @desc    Upload company logo
 * @access  Private
 */
router.post('/company-logo', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/company-logos/${req.file.filename}`;
    
    console.log(`✅ Company logo uploaded: ${req.file.filename} for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Company logo uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Company logo upload error:', error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Company logo upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/upload/resume
 * @desc    Upload resume
 * @access  Private
 */
router.post('/resume', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    
    console.log(`✅ Resume uploaded: ${req.file.filename} for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Resume upload error:', error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Resume upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete uploaded file
 * @access  Private
 */
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check: ensure filename contains user ID
    if (!filename.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find and delete the file
    const uploadDirs = [
      path.join(__dirname, '../uploads/verification-documents'),
      path.join(__dirname, '../uploads/profile-photos'),
      path.join(__dirname, '../uploads/company-logos'),
      path.join(__dirname, '../uploads/resumes'),
      path.join(__dirname, '../uploads/general')
    ];

    let fileDeleted = false;
    for (const dir of uploadDirs) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
        break;
      }
    }

    if (!fileDeleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    console.log(`✅ File deleted: ${filename} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
