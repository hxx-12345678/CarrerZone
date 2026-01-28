const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
 industries: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('industries', value);
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          this.setDataValue('industries', Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          this.setDataValue('industries', [value]);
        }
      } else {
        this.setDataValue('industries', []);
      }
    },
    get() {
      const value = this.getDataValue('industries');
      return Array.isArray(value) ? value : [];
    }
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'India'
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    defaultValue: 0
  },
  mission: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vision: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  values: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  perks: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  shortDescription: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'short_description'
  },
  companySize: {
    type: DataTypes.ENUM('1-50', '51-200', '201-500', '500-1000', '1000+'),
    allowNull: true,
    field: 'company_size'
  },
  foundedYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'founded_year'
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_reviews'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'is_verified'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'is_active'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'is_featured'
  },
  socialLinks: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'social_links'
  },
  benefits: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  technologies: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  companyType: {
    type: DataTypes.ENUM('startup', 'midsize', 'enterprise', 'multinational'),
    allowNull: true,
    field: 'company_type',
    set(value) {
      if (typeof value === 'string') {
        this.setDataValue('companyType', value.toLowerCase());
      } else {
        this.setDataValue('companyType', value);
      }
    }
  },
  // NEW: Nature of Business (multi-select)
  natureOfBusiness: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'nature_of_business',
    comment: 'Array of business nature types: SaaS, PaaS, B2B, B2C, D2C, etc.'
  },
  // NEW: Company Types (multi-select)
  companyTypes: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'company_types',
    comment: 'Array of company types: Corporate, Foreign MNC, Indian MNC, Startup, Govt/PSU, Unicorn, etc.'
  },
  fundingStage: {
    type: DataTypes.ENUM('bootstrapped', 'seed', 'series-a', 'series-b', 'series-c', 'public'),
    allowNull: true,
    field: 'funding_stage'
  },
  revenue: {
    type: DataTypes.ENUM('0-1cr', '1-10cr', '10-50cr', '50-100cr', '100cr+'),
    allowNull: true,
    field: 'revenue'
  },
  culture: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'culture'
  },
  whyJoinUs: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'why_join_us'
  },
  workEnvironment: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'work_environment'
  },
  hiringProcess: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'hiring_process'
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contact_person'
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contact_email'
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contact_phone'
  },
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'premium_verified'),
    allowNull: true,
    defaultValue: 'unverified',
    field: 'verification_status'
  },
  verificationDocuments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'verification_documents'
  },
  totalJobsPosted: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_jobs_posted'
  },
  activeJobsCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'active_jobs_count'
  },
  totalApplications: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_applications'
  },
  averageResponseTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'average_response_time'
  },
  metaTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'meta_title'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'meta_description'
  },
  keywords: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'keywords'
  },
  companyStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_approval'),
    allowNull: true,
    defaultValue: 'pending_approval',
    field: 'company_status'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity_at'
  },
  profileCompletion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'profile_completion'
  },
  region: {
    type: DataTypes.ENUM('india', 'gulf', 'other'),
    allowNull: true,
    defaultValue: 'india'
  },
  
  // ========== AGENCY SYSTEM FIELDS ==========
  companyAccountType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'direct',
    field: 'company_account_type',
    comment: 'direct | agency (agency includes recruiting agencies & consulting firms)'
  },
  agencyLicense: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'agency_license'
  },
  agencySpecialization: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'agency_specialization'
  },
  agencyDocuments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'agency_documents'
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  verificationMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'verification_method'
  },
  
  // ========== COMPANY CLAIMING FIELDS (for agency-created profiles) ==========
  createdByAgencyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by_agency_id',
    references: {
      model: 'companies',
      key: 'id'
    },
    comment: 'Agency that created this company profile (if created by agency)'
  },
  isClaimed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_claimed',
    comment: 'Whether company is claimed by its actual owner (false if created by agency and not yet claimed)'
  },
  claimedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'claimed_at',
    comment: 'When company was claimed by its owner'
  },
  claimedByUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'claimed_by_user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who claimed the company'
  },
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
  hooks: {
    // Removed auto slug generation - handled manually in auth routes
  }
});

// Instance methods
Company.prototype.getFullAddress = function() {
  const parts = [this.address, this.city, this.state, this.pincode, this.country];
  return parts.filter(part => part).join(', ');
};

Company.prototype.getAverageRating = function() {
  return this.totalReviews > 0 ? this.rating : 0;
};

Company.prototype.getCompanySizeRange = function() {
  const sizeMap = {
    '1-50': '1-50 employees',
    '51-200': '51-200 employees',
    '201-500': '201-500 employees',
    '500-1000': '500-1000 employees',
    '1000+': '1000+ employees'
  };
  return sizeMap[this.companySize] || 'Not specified';
};

// Agency-specific methods
Company.prototype.isAgency = function() {
  return this.companyAccountType === 'agency' || this.companyAccountType === 'recruiting_agency' || this.companyAccountType === 'consulting_firm';
};

Company.prototype.isVerifiedAgency = function() {
  return this.isAgency() && this.verificationStatus === 'verified' && this.verifiedAt;
};

// Company claiming methods
Company.prototype.isUnclaimed = function() {
  return !this.isClaimed && !!this.createdByAgencyId;
};

// Define associations
Company.associate = function(models) {
  // Self-reference for agency that created the company
  Company.belongsTo(models.Company, {
    foreignKey: 'createdByAgencyId',
    as: 'CreatedByAgency'
  });
  
  // User who claimed the company
  Company.belongsTo(models.User, {
    foreignKey: 'claimedByUserId',
    as: 'ClaimedByUser'
  });

  // Company has many users
  Company.hasMany(models.User, {
    foreignKey: 'companyId',
    as: 'users'
  });
};

module.exports = Company;