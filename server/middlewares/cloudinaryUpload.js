/**
 * Cloudinary Upload Middleware
 * Handles file uploads to Cloudinary (persistent cloud storage)
 * Replaces local disk storage to prevent file loss on Render.com
 */

const multer = require('multer');
const { uploadBufferToCloudinary, isConfigured } = require('../config/cloudinary');
const path = require('path');

/**
 * Create multer upload middleware that stores to Cloudinary
 * @param {string} folder - Cloudinary folder name
 * @param {Object} options - Upload options
 * @returns {multer.Multer} Configured multer instance
 */
const createCloudinaryUpload = (folder, options = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'],
    fieldName = 'file'
  } = options;

  // Use memory storage (files stored in RAM temporarily)
  const storage = multer.memoryStorage();

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: maxFileSize
    },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed`));
      }
    }
  });

  return upload;
};

/**
 * Middleware to upload file to Cloudinary after multer processing
 * Use this AFTER multer middleware in route
 */
const uploadToCloudinary = (folder) => {
  return async (req, res, next) => {
    try {
      // Check if Cloudinary is configured
      if (!isConfigured()) {
        console.warn('⚠️ Cloudinary not configured, skipping cloud upload');
        // Fallback: save to local (will be lost on restart)
        return next();
      }

      // Check if file exists in request
      if (!req.file && !req.files) {
        return next();
      }

      // Single file upload
      if (req.file) {
        const cloudinaryResult = await uploadBufferToCloudinary(
          req.file.buffer,
          folder,
          {
            original_filename: req.file.originalname,
            public_id: `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}`
          }
        );

        // Attach Cloudinary data to request
        req.cloudinaryFile = {
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          originalName: req.file.originalname,
          size: cloudinaryResult.size,
          format: cloudinaryResult.format
        };

        console.log('✅ File uploaded to Cloudinary:', cloudinaryResult.url);
      }

      // Multiple files upload
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        const uploadPromises = files.map(file =>
          uploadBufferToCloudinary(file.buffer, folder, {
            original_filename: file.originalname,
            public_id: `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}`
          })
        );

        const results = await Promise.all(uploadPromises);

        req.cloudinaryFiles = results.map((result, index) => ({
          url: result.url,
          publicId: result.publicId,
          originalName: files[index].originalname,
          size: result.size,
          format: result.format
        }));

        console.log(`✅ ${results.length} files uploaded to Cloudinary`);
      }

      next();
    } catch (error) {
      console.error('❌ Cloudinary upload middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: error.message
      });
    }
  };
};

/**
 * Pre-configured upload instances for common use cases
 */

// Company logo upload (max 5MB, images only)
const companyLogoUpload = createCloudinaryUpload('company-logos', {
  maxFileSize: 5 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
});

// Company photos (max 10MB, images only)
const companyPhotoUpload = createCloudinaryUpload('company-photos', {
  maxFileSize: 10 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
});

// Avatar/profile pictures (max 2MB, images only)
const avatarUpload = createCloudinaryUpload('avatars', {
  maxFileSize: 2 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
});

// Job photos (max 10MB, images only)
const jobPhotoUpload = createCloudinaryUpload('job-photos', {
  maxFileSize: 10 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
});

// Resumes (max 5MB, documents only)
const resumeUpload = createCloudinaryUpload('resumes', {
  maxFileSize: 5 * 1024 * 1024,
  allowedExtensions: ['.pdf', '.doc', '.docx']
});

// Agency documents (max 10MB, documents and images)
const agencyDocUpload = createCloudinaryUpload('agency-documents', {
  maxFileSize: 10 * 1024 * 1024,
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
});

// Hot vacancy photos (max 10MB, images only)
const hotVacancyPhotoUpload = createCloudinaryUpload('hot-vacancy-photos', {
  maxFileSize: 10 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
});

module.exports = {
  createCloudinaryUpload,
  uploadToCloudinary,
  companyLogoUpload,
  companyPhotoUpload,
  avatarUpload,
  jobPhotoUpload,
  resumeUpload,
  agencyDocUpload,
  hotVacancyPhotoUpload
};

