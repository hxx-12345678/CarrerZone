const { sequelize } = require('./sequelize');

// Import all models
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const JobCategory = require('../models/JobCategory');
const JobApplication = require('../models/JobApplication');
const JobBookmark = require('../models/JobBookmark');
const JobAlert = require('../models/JobAlert');
const Requirement = require('../models/Requirement');
const RequirementApplication = require('../models/Application');
const Resume = require('../models/Resume');
const CoverLetter = require('../models/CoverLetter');
const WorkExperience = require('../models/WorkExperience');
const Education = require('../models/Education');
const Notification = require('../models/Notification');
const CompanyReview = require('../models/CompanyReview');
const CompanyFollow = require('../models/CompanyFollow');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSession = require('../models/UserSession');
const Interview = require('../models/Interview');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Payment = require('../models/Payment');
const Analytics = require('../models/Analytics');
const JobPhoto = require('../models/JobPhoto');
const CompanyPhoto = require('../models/CompanyPhoto');
const CandidateLike = require('../models/CandidateLike');
// const HotVacancy = require('../models/HotVacancy'); // Deprecated - Hot vacancies now integrated into Job model
const EmployerQuota = require('../models/EmployerQuota');
const UserActivityLog = require('../models/UserActivityLog');
// const HotVacancyPhoto = require('../models/HotVacancyPhoto'); // Deprecated - Photos now in Job model
const FeaturedJob = require('../models/FeaturedJob');
const ViewTracking = require('../models/ViewTracking');
const UserDashboard = require('../models/UserDashboard');
const SearchHistory = require('../models/SearchHistory');
const SecureJobTap = require('../models/SecureJobTap');
const BulkJobImport = require('../models/BulkJobImport')(sequelize);
const CandidateAnalytics = require('../models/CandidateAnalytics')(sequelize);
const JobTemplate = require('../models/JobTemplate');
const JobPreference = require('../models/JobPreference');
const SupportMessage = require('../models/SupportMessage')(sequelize);
const TeamInvitation = require('../models/TeamInvitation');

// Define associations

// User associations
User.hasMany(Job, { foreignKey: 'employerId', as: 'postedJobs' });
User.hasMany(JobApplication, { foreignKey: 'userId', as: 'jobApplications' });
User.hasMany(JobBookmark, { foreignKey: 'userId', as: 'jobBookmarks' });
User.hasMany(JobAlert, { foreignKey: 'userId', as: 'jobAlerts' });
User.hasMany(Requirement, { foreignKey: 'createdBy', as: 'requirements' });
User.hasMany(RequirementApplication, { foreignKey: 'userId', as: 'requirementApplications' });
User.hasMany(Resume, { foreignKey: 'userId', as: 'resumes' });
User.hasMany(CoverLetter, { foreignKey: 'userId', as: 'coverLetters' });
User.hasMany(WorkExperience, { foreignKey: 'user_id', as: 'workExperiences' });
User.hasMany(Education, { foreignKey: 'user_id', as: 'educations' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasOne(JobPreference, { foreignKey: 'userId', as: 'jobPreference' });
User.hasMany(CompanyReview, { foreignKey: 'userId', as: 'companyReviews' });
User.hasMany(CompanyFollow, { foreignKey: 'userId', as: 'companyFollows' });
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
// CandidateLike associations
User.hasMany(CandidateLike, { foreignKey: 'employer_id', as: 'givenCandidateLikes' });
User.hasMany(CandidateLike, { foreignKey: 'candidate_id', as: 'receivedCandidateLikes' });
CandidateLike.belongsTo(User, { foreignKey: 'employer_id', as: 'employer' });
CandidateLike.belongsTo(User, { foreignKey: 'candidate_id', as: 'candidate' });

// Company associations
Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs' });
Company.hasMany(CompanyReview, { foreignKey: 'companyId', as: 'reviews' });
Company.hasMany(CompanyFollow, { foreignKey: 'companyId', as: 'followers' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'employees' });
Company.hasMany(CompanyPhoto, { foreignKey: 'companyId', as: 'photos' });

// Job associations - defined in Job model associate function

// JobCategory associations
JobCategory.belongsTo(JobCategory, { foreignKey: 'parent_id', as: 'parent' });
JobCategory.hasMany(JobCategory, { foreignKey: 'parent_id', as: 'children' });

// JobApplication associations are now defined in the model file to prevent duplicates

// JobBookmark associations
JobBookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });
JobBookmark.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

// JobPhoto associations
JobPhoto.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobPhoto.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// CompanyPhoto associations
CompanyPhoto.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
CompanyPhoto.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// HotVacancy associations - DEPRECATED (Hot vacancies now integrated into Job model)
// HotVacancy.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
// HotVacancy.belongsTo(User, { foreignKey: 'employerId', as: 'employer' });
// HotVacancy.hasMany(HotVacancyPhoto, { foreignKey: 'hot_vacancy_id', as: 'photos' });

// HotVacancyPhoto associations - DEPRECATED
// HotVacancyPhoto.belongsTo(HotVacancy, { foreignKey: 'hot_vacancy_id', as: 'hotVacancy' });
// HotVacancyPhoto.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// JobAlert associations
JobAlert.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Requirement associations
Requirement.belongsTo(User, { foreignKey: 'createdBy', as: 'employer' });
Requirement.hasMany(RequirementApplication, { foreignKey: 'requirement_id', as: 'requirementApplications' });

// RequirementApplication associations
RequirementApplication.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });
RequirementApplication.belongsTo(Requirement, { foreignKey: 'requirement_id', as: 'requirement' });
RequirementApplication.belongsTo(Resume, { foreignKey: 'resumeId', as: 'requirementResume' });

// Resume associations
Resume.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// Note: Removed WorkExperience association - resumeId column doesn't exist in work_experiences table
// Note: Removed Education association - resumeId column doesn't exist in educations table

// CoverLetter associations
CoverLetter.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// WorkExperience associations
WorkExperience.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// Note: Removed Resume association - resumeId column doesn't exist in work_experiences table

// Education associations
Education.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// Note: Removed Resume association - resumeId column doesn't exist in educations table

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// CompanyReview associations
CompanyReview.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });
CompanyReview.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// CompanyFollow associations
CompanyFollow.belongsTo(User, { foreignKey: 'userId', as: 'follower' });
CompanyFollow.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Subscription associations
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

// SubscriptionPlan associations
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });

// UserSession associations
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });

// Interview associations are now defined in the model file to prevent duplicates
User.hasMany(Interview, { foreignKey: 'employerId', as: 'conductedInterviews' });
User.hasMany(Interview, { foreignKey: 'candidateId', as: 'attendedInterviews' });

// Conversation associations
Conversation.belongsTo(User, { foreignKey: 'participant1Id', as: 'participant1' });
Conversation.belongsTo(User, { foreignKey: 'participant2Id', as: 'participant2' });
User.hasMany(Conversation, { foreignKey: 'participant1Id', as: 'conversationsAsParticipant1' });
User.hasMany(Conversation, { foreignKey: 'participant2Id', as: 'conversationsAsParticipant2' });

// Message associations
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
Message.belongsTo(Message, { foreignKey: 'replyToMessageId', as: 'replyTo' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });

// Payment associations
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Subscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });

// Analytics associations
Analytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Analytics.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Analytics.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Analytics.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });
User.hasMany(Analytics, { foreignKey: 'userId', as: 'analytics' });
Company.hasMany(Analytics, { foreignKey: 'companyId', as: 'analytics' });
JobApplication.hasMany(Analytics, { foreignKey: 'applicationId', as: 'analytics' });

// FeaturedJob associations
FeaturedJob.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

// TeamInvitation associations
TeamInvitation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(TeamInvitation, { foreignKey: 'companyId', as: 'invitations' });
TeamInvitation.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });
TeamInvitation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TeamInvitation, { foreignKey: 'invitedBy', as: 'sentInvitations' });
User.hasMany(TeamInvitation, { foreignKey: 'userId', as: 'receivedInvitations' });

// SecureJobTap associations
SecureJobTap.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SecureJobTap.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
User.hasMany(SecureJobTap, { foreignKey: 'userId', as: 'secureJobTaps' });

// Sync database function
// In local development we prefer alter:true to create/update tables non-destructively
const syncDatabase = async (options = {}) => {
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  const syncOptions = isDev ? { alter: true, ...options } : { ...options };
  try {
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully', syncOptions);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
};

// Export all models and sync function
module.exports = {
  sequelize,
  User,
  Company,
  Job,
  JobCategory,
  JobApplication,
  JobBookmark,
  JobAlert,
  Requirement,
  RequirementApplication,
  Resume,
  CoverLetter,
  WorkExperience,
  Education,
  Notification,
  CompanyReview,
  CompanyFollow,
  Subscription,
  SubscriptionPlan,
  UserSession,
  Interview,
  Message,
  Conversation,
  Payment,
  Analytics,
  JobPhoto,
  CompanyPhoto,
  CandidateLike,
  // HotVacancy, // Deprecated - Hot vacancies now integrated into Job model
  EmployerQuota,
  UserActivityLog,
  // HotVacancyPhoto, // Deprecated - Photos now in Job model
  FeaturedJob,
  ViewTracking,
  UserDashboard,
  SearchHistory,
  SecureJobTap,
  BulkJobImport,
  CandidateAnalytics,
  JobTemplate,
  JobPreference,
  SupportMessage,
  TeamInvitation,
  syncDatabase
}; 