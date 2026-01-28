const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CompanyPhoto = sequelize.define('CompanyPhoto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id'
  },
  filename: { type: DataTypes.STRING, allowNull: false },
  filePath: { type: DataTypes.STRING, allowNull: false, field: 'file_path' },
  fileUrl: { type: DataTypes.STRING, allowNull: false, field: 'file_url' },
  fileSize: { type: DataTypes.INTEGER, allowNull: false, field: 'file_size' },
  mimeType: { type: DataTypes.STRING, allowNull: false, field: 'mime_type' },
  altText: { type: DataTypes.STRING, allowNull: true, field: 'alt_text' },
  caption: { type: DataTypes.TEXT, allowNull: true },
  displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'display_order' },
  isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_primary' },
  isPlaceholder: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_placeholder' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  uploadedBy: { type: DataTypes.UUID, allowNull: false, field: 'uploaded_by' },
  metadata: { type: DataTypes.JSONB, allowNull: true }
}, {
  tableName: 'company_photos',
  timestamps: true,
  underscored: true
});

module.exports = CompanyPhoto;


