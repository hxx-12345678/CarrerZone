/**
 * Cloudinary Configuration
 * Cloud storage for images, photos, and documents
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Always use HTTPS
});

/**
 * Check if Cloudinary is properly configured
 */
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadToCloudinary = async (filePath, folder = 'job-portal', options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary not configured. Please set CLOUDINARY_* environment variables.');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto', // Automatically detect type (image, video, raw)
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload buffer to Cloudinary (for direct uploads without saving to disk)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder name
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadBufferToCloudinary = (buffer, folder = 'job-portal', options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(new Error('Cloudinary not configured'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary buffer upload error:', error);
          return reject(error);
        }
        resolve({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      message: result.result
    };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array<string>} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Object>} Deletion result
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return {
      success: true,
      deleted: result.deleted,
      deletedCount: Object.keys(result.deleted).length
    };
  } catch (error) {
    console.error('❌ Cloudinary bulk delete error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Image transformation options
 * @returns {string} Optimized image URL
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations
  };

  return cloudinary.url(publicId, defaultTransformations);
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getOptimizedUrl
};

