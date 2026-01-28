const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const JobPhoto = sequelize.define('JobPhoto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Original filename of the uploaded image'
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path',
    comment: 'Path to the stored image file'
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_url',
    comment: 'Public URL to access the image'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size',
    comment: 'File size in bytes'
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type',
    comment: 'MIME type of the image (e.g., image/jpeg, image/png)'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Image width in pixels'
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Image height in pixels'
  },
  altText: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'alt_text',
    comment: 'Alternative text for accessibility'
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional caption for the image'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'display_order',
    comment: 'Order in which images should be displayed'
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_primary',
    comment: 'Whether this is the primary showcase image'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether the image is active and should be displayed'
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who uploaded the image'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata about the image'
  }
}, {
  tableName: 'job_photos',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['job_id']
    },
    {
      fields: ['job_id', 'display_order']
    },
    {
      fields: ['job_id', 'is_primary']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeCreate: (jobPhoto) => {
      // Ensure only one primary image per job
      if (jobPhoto.isPrimary) {
        return JobPhoto.update(
          { isPrimary: false },
          { where: { jobId: jobPhoto.jobId } }
        ).then(() => jobPhoto);
      }
      return jobPhoto;
    },
    beforeUpdate: (jobPhoto) => {
      // Ensure only one primary image per job
      if (jobPhoto.isPrimary && jobPhoto.changed('isPrimary')) {
        return JobPhoto.update(
          { isPrimary: false },
          { where: { jobId: jobPhoto.jobId, id: { [sequelize.Sequelize.Op.ne]: jobPhoto.id } } }
        ).then(() => jobPhoto);
      }
      return jobPhoto;
    }
  }
});

module.exports = JobPhoto;
