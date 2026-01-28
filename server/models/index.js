const User = require('./User');
const Company = require('./Company');
const Job = require('./Job');
const JobApplication = require('./JobApplication');
const JobBookmark = require('./JobBookmark');
const JobAlert = require('./JobAlert');
const JobCategory = require('./JobCategory');
const JobPhoto = require('./JobPhoto');
const JobTemplateFactory = require('./JobTemplate');
const Resume = require('./Resume');
const CoverLetter = require('./CoverLetter');
const Education = require('./Education');
const WorkExperience = require('./WorkExperience');
const CompanyReview = require('./CompanyReview');
const CompanyFollow = require('./CompanyFollow');
const Notification = require('./Notification');
const SearchHistory = require('./SearchHistory');
const UserSession = require('./UserSession');
const UserActivityLog = require('./UserActivityLog');
const UserDashboard = require('./UserDashboard');
const Interview = require('./Interview');
const Message = require('./Message');
const Conversation = require('./Conversation');
const Payment = require('./Payment');
const Subscription = require('./Subscription');
const SubscriptionPlan = require('./SubscriptionPlan');
const EmployerQuota = require('./EmployerQuota');
const FeaturedJob = require('./FeaturedJob');
const SecureJobTap = require('./SecureJobTap');
const BulkJobImport = require('./BulkJobImport');
const Analytics = require('./Analytics');
const CandidateAnalytics = require('./CandidateAnalytics');
const CandidateLike = require('./CandidateLike');
const ViewTracking = require('./ViewTracking');
const Requirement = require('./Requirement');
const Application = require('./Application');
const JobPreference = require('./JobPreference');
const AgencyClientAuthorization = require('./AgencyClientAuthorization');
const AdminNotification = require('./AdminNotification');
const SystemSetting = require('./SystemSetting');

// Import Sequelize
const { Sequelize } = require('sequelize');

// Import database configuration
const config = require('../config/database');

// Get environment-specific config
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  pool: dbConfig.pool,
  define: dbConfig.define,
  dialectOptions: dbConfig.dialectOptions
});

// Initialize models - they are already defined in their respective files
const JobTemplate = JobTemplateFactory(sequelize);

const models = {
  User,
  Company,
  Job,
  JobApplication,
  JobBookmark,
  JobAlert,
  JobCategory,
  JobPhoto,
  JobTemplate,
  Resume,
  CoverLetter,
  Education,
  WorkExperience,
  CompanyReview,
  CompanyFollow,
  Notification,
  SearchHistory,
  UserSession,
  UserActivityLog,
  UserDashboard,
  Interview,
  Message,
  Conversation,
  Payment,
  Subscription,
  SubscriptionPlan,
  EmployerQuota,
  FeaturedJob,
  SecureJobTap,
  BulkJobImport,
  Analytics,
  CandidateAnalytics,
  CandidateLike,
  ViewTracking,
  Requirement,
  Application,
  JobPreference,
  AgencyClientAuthorization,
  AdminNotification,
  SystemSetting
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize
module.exports = {
  ...models,
  sequelize,
  Sequelize
};
