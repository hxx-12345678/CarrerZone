'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createHotVacancy,
  getHotVacanciesByEmployer,
  getHotVacancyById,
  updateHotVacancy,
  deleteHotVacancy,
  getPublicHotVacancies,
  getPricingTiers
} = require('../controller/HotVacancyController');

const { HotVacancyPhoto } = require('../config');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const User = require('../models/User');
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user is employer or admin
const requireEmployer = (req, res, next) => {
  if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employer or admin account required.'
    });
  }
  next();
};

// Configure multer for hot vacancy photo uploads
const hotVacancyPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/hot-vacancy-photos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `hot-vacancy-photo-${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log('📄 Generated hot vacancy photo filename:', filename);
    cb(null, filename);
  }
});

const hotVacancyPhotoUpload = multer({
  storage: hotVacancyPhotoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for hot vacancy photos
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    console.log('🔍 Hot vacancy photo file type check:', ext, 'Allowed:', allowedTypes);
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, GIF, and WebP files are allowed for hot vacancy photos'));
    }
  }
});

// Public routes (no authentication required)
router.get('/public', getPublicHotVacancies);
router.get('/pricing', getPricingTiers);

// Protected routes (authentication required)
router.use(authenticateToken);

// Employer-only routes
router.use(requireEmployer);

// Hot vacancy CRUD operations
router.post('/', createHotVacancy);
router.get('/', getHotVacanciesByEmployer);
router.get('/employer', getHotVacanciesByEmployer);
router.get('/:id', getHotVacancyById);
router.put('/:id', updateHotVacancy);
router.delete('/:id', deleteHotVacancy);

// Hot vacancy photo upload
router.post('/:id/photos/upload', hotVacancyPhotoUpload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { altText, caption, displayOrder, isPrimary } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
    }

    // Check if hot vacancy exists and belongs to user
    const HotVacancy = require('../models/HotVacancy');
    const hotVacancy = await HotVacancy.findByPk(id);
    
    if (!hotVacancy) {
      return res.status(404).json({
        success: false,
        message: 'Hot vacancy not found'
      });
    }

    if (hotVacancy.employerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const filename = req.file.filename;
    const filePath = `/uploads/hot-vacancy-photos/${filename}`;
    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}${filePath}`;
    
    console.log('🔍 Generated hot vacancy photo URL:', fileUrl);

    const hotVacancyPhoto = await HotVacancyPhoto.create({
      hotVacancyId: id,
      filename: filename,
      filePath: filePath,
      fileUrl: fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      altText: altText || '',
      caption: caption || '',
      display_order: parseInt(displayOrder) || 0,
      isPrimary: isPrimary === 'true' || false,
      uploadedBy: req.user.id
    });

    console.log('✅ Hot vacancy photo created successfully:', hotVacancyPhoto.id);

    return res.status(201).json({
      success: true,
      data: {
        id: hotVacancyPhoto.id,
        photoId: hotVacancyPhoto.id,
        filename: filename,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        originalName: req.file.originalname,
        altText: hotVacancyPhoto.altText,
        caption: hotVacancyPhoto.caption,
        isPrimary: hotVacancyPhoto.isPrimary,
        display_order: hotVacancyPhoto.displayOrder
      },
      message: 'Hot vacancy photo uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Hot vacancy photo upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload hot vacancy photo',
      error: error.message
    });
  }
});

// Get hot vacancy photos
router.get('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if hot vacancy exists and belongs to user
    const HotVacancy = require('../models/HotVacancy');
    const hotVacancy = await HotVacancy.findByPk(id);
    
    if (!hotVacancy) {
      return res.status(404).json({
        success: false,
        message: 'Hot vacancy not found'
      });
    }

    if (hotVacancy.employerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const photos = await HotVacancyPhoto.findAll({
      where: {
        hotVacancyId: id,
        isActive: true
      },
      order: [['display_order', 'ASC'], ['created_at', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: photos,
      message: 'Hot vacancy photos retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get hot vacancy photos error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hot vacancy photos',
      error: error.message
    });
  }
});

// Delete hot vacancy photo
router.delete('/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    // Validate photoId
    if (!photoId || photoId === 'undefined' || photoId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo ID provided'
      });
    }

    const photo = await HotVacancyPhoto.findByPk(photoId, {
      include: [{
        model: require('../models/HotVacancy'),
        as: 'hotVacancy'
      }]
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Check if user has permission to delete this photo
    if (photo.hotVacancy.employerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/hot-vacancy-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Deleted hot vacancy photo file:', filePath);
    }

    // Delete photo record from database
    await photo.destroy();

    return res.status(200).json({
      success: true,
      message: 'Hot vacancy photo deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete hot vacancy photo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete hot vacancy photo',
      error: error.message
    });
  }
});

module.exports = router;
