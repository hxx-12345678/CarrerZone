const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AgencyClientAuthorization = sequelize.define('AgencyClientAuthorization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Relationships
  agencyCompanyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'agency_company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  clientCompanyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  
  // Authorization Details
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'pending_client_confirm', 'pending_admin_review', 'active', 'expired', 'revoked', 'rejected']]
    }
  },
  
  // Contract Details
  contractStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'contract_start_date'
  },
  contractEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'contract_end_date'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'auto_renew'
  },
  
  // Permissions
  canPostJobs: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_post_jobs'
  },
  canEditJobs: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'can_edit_jobs'
  },
  canDeleteJobs: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_delete_jobs'
  },
  canViewApplications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'can_view_applications'
  },
  maxActiveJobs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_active_jobs'
  },
  jobCategories: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'job_categories'
  },
  allowedLocations: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'allowed_locations'
  },
  
  // Documents
  authorizationLetterUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'authorization_letter_url'
  },
  serviceAgreementUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'service_agreement_url'
  },
  clientGstUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'client_gst_url'
  },
  clientPanUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'client_pan_url'
  },
  additionalDocuments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'additional_documents'
  },
  
  // Verification
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'verified_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verificationMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'verification_method'
  },
  
  clientConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'client_confirmed_at'
  },
  
  clientVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'client_verification_token',
    comment: 'Token for client email verification'
  },
  
  clientVerificationTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'client_verification_token_expiry',
    comment: 'Expiry date for verification token'
  },
  
  clientVerificationAction: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'client_verification_action',
    comment: 'approved or rejected by client'
  },
  clientConfirmedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'client_confirmed_by'
  },
  adminApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'admin_approved_at'
  },
  adminApprovedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'admin_approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Client Contact
  clientContactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'client_contact_email'
  },
  clientContactPhone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'client_contact_phone'
  },
  clientContactName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'client_contact_name'
  },
  
  // Tracking
  jobsPosted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'jobs_posted'
  },
  totalApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_applications'
  },
  lastJobPostedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_job_posted_at'
  },
  
  // Notes
  internalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'internal_notes'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  }
}, {
  tableName: 'agency_client_authorizations',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
AgencyClientAuthorization.prototype.isActive = function() {
  return this.status === 'active' && this.canPostJobs;
};

AgencyClientAuthorization.prototype.isExpired = function() {
  if (!this.contractEndDate) return false;
  return new Date(this.contractEndDate) < new Date();
};

AgencyClientAuthorization.prototype.canPost = function() {
  return this.isActive() && !this.isExpired();
};

AgencyClientAuthorization.prototype.hasJobLimitReached = function() {
  if (!this.maxActiveJobs) return false;
  return this.jobsPosted >= this.maxActiveJobs;
};

// Associations
AgencyClientAuthorization.associate = function(models) {
  AgencyClientAuthorization.belongsTo(models.Company, {
    foreignKey: 'agencyCompanyId',
    as: 'AgencyCompany'
  });
  
  AgencyClientAuthorization.belongsTo(models.Company, {
    foreignKey: 'clientCompanyId',
    as: 'ClientCompany'
  });
  
  AgencyClientAuthorization.belongsTo(models.User, {
    foreignKey: 'verifiedBy',
    as: 'VerifiedByUser'
  });
  
  AgencyClientAuthorization.belongsTo(models.User, {
    foreignKey: 'adminApprovedBy',
    as: 'AdminApprovedByUser'
  });
};

module.exports = AgencyClientAuthorization;

