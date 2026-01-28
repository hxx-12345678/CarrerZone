const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  employerId: {
    type: DataTypes.UUID,
    allowNull: true, // Made nullable to support agency jobs (they use companyId instead)
    field: 'posted_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shortDescription: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'short_description'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
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
  latitude: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'inactive', 'closed', 'expired'),
    allowNull: false,
    defaultValue: 'draft'
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  benefits: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  },
  jobType: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
    allowNull: false,
    defaultValue: 'full-time',
    field: 'job_type'
  },
  experienceLevel: {
    type: DataTypes.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive'),
    allowNull: true,
    field: 'experience_level'
  },
  experienceMin: {
    type: DataTypes.INTEGER, // in years
    allowNull: true,
    field: 'experience_min'
  },
  experienceMax: {
    type: DataTypes.INTEGER, // in years
    allowNull: true,
    field: 'experience_max'
  },
  salaryMin: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    field: 'salary_min'
  },
  salaryMax: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    field: 'salary_max'
  },
  salaryCurrency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'INR',
    field: 'salary_currency'
  },
  salaryPeriod: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have salary_period'
  },
  isSalaryVisible: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have is_salary_visible'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  skills: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  remoteWork: {
    type: DataTypes.ENUM('on-site', 'remote', 'hybrid'),
    allowNull: true,
    defaultValue: 'on-site',
    field: 'remoteWork'
  },
  locationType: {
    type: DataTypes.ENUM('on-site', 'remote', 'hybrid'),
    allowNull: false,
    defaultValue: 'on-site',
    field: 'location_type'
  },
  travelRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  shiftTiming: {
    type: DataTypes.ENUM('day', 'night', 'rotational', 'flexible'),
    allowNull: true,
    defaultValue: 'day'
  },
  noticePeriod: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  education: {
    type: DataTypes.STRING,
    allowNull: true
  },
  certifications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  languages: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  applications: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  validTill: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'valid_till'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at' // Explicit mapping to database column
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  visibilityType: {
    type: DataTypes.ENUM('public', 'private', 'referral-only', 'invite-only'),
    allowNull: true,
    defaultValue: 'public'
  },
  allowedViewers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  referralCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scheduledPublishAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scheduledExpiryAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  renewalPeriod: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maxRenewals: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentRenewalCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  bulkImportId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  searchImpressions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  searchClicks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  applicationRate: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    defaultValue: 0
  },
  qualityScore: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    defaultValue: 0
  },
  seoScore: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    defaultValue: 0
  },
  isATSEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  atsKeywords: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  targetAudience: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  promotionSettings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  bookmarkCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  salary: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  workMode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  learningObjectives: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mentorship: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  region: {
    type: DataTypes.ENUM('india', 'gulf', 'other'),
    allowNull: true,
    defaultValue: 'india'
  },
  // New fields from step 2
  role: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industryType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'industrytype' // Map to lowercase database column
  },
  roleCategory: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'rolecategory' // Map to lowercase database column
  },
  employmentType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employmenttype' // Map to lowercase database column
  },
  // Hot Vacancy Premium Features
  isHotVacancy: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'ishotvacancy' // Map to lowercase database column
  },
  urgentHiring: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'urgenthiring' // Map to lowercase database column
  },
  multipleEmailIds: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'multipleemailids' // Map to lowercase database column
  },
  boostedSearch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'boostedsearch' // Map to lowercase database column
  },
  searchBoostLevel: {
    type: DataTypes.ENUM('standard', 'premium', 'super', 'city-specific'),
    allowNull: true,
    defaultValue: 'standard',
    field: 'searchboostlevel' // Map to lowercase database column
  },
  citySpecificBoost: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'cityspecificboost' // Map to lowercase database column
  },
  videoBanner: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'videobanner' // Map to lowercase database column
  },
  whyWorkWithUs: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'whyworkwithus' // Map to lowercase database column
  },
  companyReviews: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'companyreviews' // Map to lowercase database column
  },
  autoRefresh: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'autorefresh' // Map to lowercase database column
  },
  refreshDiscount: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    defaultValue: 0,
    field: 'refreshdiscount' // Map to lowercase database column
  },
  attachmentFiles: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'attachmentfiles' // Map to lowercase database column
  },
  officeImages: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'officeimages' // Map to lowercase database column
  },
  companyProfile: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'companyprofile' // Map to lowercase database column
  },
  proactiveAlerts: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'proactivealerts' // Map to lowercase database column
  },
  alertRadius: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 50,
    field: 'alertradius' // Map to lowercase database column
  },
  alertFrequency: {
    type: DataTypes.ENUM('immediate', 'daily', 'weekly'),
    allowNull: true,
    defaultValue: 'immediate',
    field: 'alertfrequency' // Map to lowercase database column
  },
  featuredKeywords: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'featuredkeywords' // Map to lowercase database column
  },
  customBranding: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'custombranding' // Map to lowercase database column
  },
  superFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'superfeatured' // Map to lowercase database column
  },
  tierLevel: {
    type: DataTypes.ENUM('basic', 'premium', 'enterprise', 'super-premium'),
    allowNull: true,
    defaultValue: 'basic',
    field: 'tierlevel' // Map to lowercase database column
  },
  externalApplyUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'externalapplyurl' // Map to lowercase database column
  },
  hotVacancyPrice: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    field: 'hotvacancyprice' // Map to lowercase database column
  },
  hotVacancyCurrency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'INR',
    field: 'hotvacancycurrency' // Map to lowercase database column
  },
  hotVacancyPaymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    allowNull: true,
    defaultValue: 'pending',
    field: 'hotvacancypaymentstatus' // Map to lowercase database column
  },
  // PREMIUM HOT VACANCY FEATURES (from hot_vacancies table)
  // All field names are mapped to snake_case database columns
  urgencyLevel: {
    type: DataTypes.STRING, // Changed from ENUM to STRING for compatibility
    allowNull: true,
    field: 'urgencylevel',
    validate: {
      isIn: [['high', 'critical', 'immediate']]
    }
  },
  hiringTimeline: {
    type: DataTypes.STRING, // Changed from ENUM to STRING for compatibility
    allowNull: true,
    field: 'hiringtimeline',
    validate: {
      isIn: [['immediate', '1-week', '2-weeks', '1-month']]
    }
  },
  maxApplications: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'maxapplications'
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'applicationdeadline'
  },
  pricingTier: {
    type: DataTypes.STRING, // Changed from ENUM to STRING for compatibility
    allowNull: true,
    field: 'pricingtier',
    validate: {
      isIn: [['basic', 'premium', 'enterprise', 'super-premium']]
    }
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'paymentid'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paymentdate'
  },
  priorityListing: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'prioritylisting'
  },
  featuredBadge: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'featuredbadge'
  },
  unlimitedApplications: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'unlimitedapplications'
  },
  advancedAnalytics: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'advancedanalytics'
  },
  candidateMatching: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'candidatematching'
  },
  directContact: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'directcontact'
  },
  seoTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'seotitle'
  },
  seoDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'seodescription'
  },
  keywords: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'keywords'
  },
  impressions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'impressions'
  },
  clicks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'clicks'
  },
  
  // ========== AGENCY POSTING FIELDS (VIRTUAL LOCALLY; real columns may exist in prod) ==========
  hiringCompanyId: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have hiring_company_id'
  },
  postedByAgencyId: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have posted_by_agency_id'
  },
  isAgencyPosted: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have is_agency_posted'
  },
  agencyDescription: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have agency_description'
  },
  authorizationId: {
    type: DataTypes.VIRTUAL,
    comment: 'Virtual locally; production may have authorization_id'
  }
}, {
  sequelize,
  modelName: 'Job',
  tableName: 'jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false
});

// Define associations
Job.associate = function(models) {
  // Main company (employer who owns the job - could be agency or direct)
  Job.belongsTo(models.Company, {
    foreignKey: 'companyId',
    as: 'company'
  });
  
  // Employer user
  Job.belongsTo(models.User, {
    foreignKey: 'employerId',
    as: 'employer'
  });
  
  // NEW: Hiring company (the actual company hiring - for agency jobs)
  Job.belongsTo(models.Company, {
    foreignKey: 'hiringCompanyId',
    as: 'HiringCompany',
    constraints: false // Optional relationship
  });
  
  // NEW: Agency that posted the job (for agency jobs)
  Job.belongsTo(models.Company, {
    foreignKey: 'postedByAgencyId',
    as: 'PostedByAgency',
    constraints: false // Optional relationship
  });
  
  // Job applications
  Job.hasMany(models.JobApplication, {
    foreignKey: 'jobId',
    as: 'jobApplications'
  });
  
  // Job bookmarks
  Job.hasMany(models.JobBookmark, {
    foreignKey: 'jobId',
    as: 'bookmarks'
  });
  
  // Job photos
  Job.hasMany(models.JobPhoto, {
    foreignKey: 'jobId',
    as: 'photos'
  });
  
  // Interviews
  Job.hasMany(models.Interview, {
    foreignKey: 'jobId',
    as: 'interviews'
  });
  
  // Conversations
  Job.hasMany(models.Conversation, {
    foreignKey: 'jobId',
    as: 'conversations'
  });
  
  // Analytics
  Job.hasMany(models.Analytics, {
    foreignKey: 'jobId',
    as: 'analytics'
  });
  
  // Featured jobs
  Job.hasMany(models.FeaturedJob, {
    foreignKey: 'jobId',
    as: 'featuredPromotions'
  });
  
  // Secure job taps
  Job.hasMany(models.SecureJobTap, {
    foreignKey: 'jobId',
    as: 'secureJobTaps'
  });
};

module.exports = Job;