const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const JobApplication = sequelize.define('JobApplication', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'applicant_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  employerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'resume_id',
    references: {
      model: 'resumes',
      key: 'id'
    }
  },
  coverLetterId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cover_letter_id',
    references: {
      model: 'cover_letters',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('applied', 'reviewing', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'),
    defaultValue: 'applied',
    allowNull: false
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cover_letter'
  },
  expectedSalary: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    field: 'expected_salary'
  },
  expectedSalaryCurrency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'INR',
    field: 'expected_salary_currency'
  },
  noticePeriod: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'notice_period',
    comment: 'Notice period in days'
  },
  availableFrom: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'available_from'
  },
  isWillingToRelocate: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'is_willing_to_relocate'
  },
  preferredLocations: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'preferred_locations',
    comment: 'Array of preferred locations'
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'website',
    comment: 'Application source: website, email, referral, etc.'
  },
  referralCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'referral_code'
  },
  appliedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'applied_at'
  },
  lastUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'last_updated_at'
  },
  interviewScheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'interview_scheduled_at'
  },
  interviewLocation: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'interview_location'
  },
  interviewType: {
    type: DataTypes.ENUM('phone', 'video', 'in-person', 'technical', 'hr', 'technical_test', 'in_person'),
    allowNull: true,
    field: 'interview_type'
  },
  employerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'employer_notes',
    comment: 'Private notes for employer'
  },
  candidateNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'candidate_notes',
    comment: 'Notes visible to candidate'
  },
  interviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'interview_notes'
  },
  offerDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'offer_details',
    comment: 'Offer letter details'
  },
  additionalDocuments: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'additional_documents',
    comment: 'Array of additional document URLs'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional application data'
  }
}, {
  sequelize,
  modelName: 'JobApplication',
  tableName: 'job_applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false
});

// Instance methods
JobApplication.prototype.canWithdraw = function() {
  // Applications can be withdrawn if they are in certain statuses
  const withdrawableStatuses = ['applied', 'reviewing', 'shortlisted'];
  return withdrawableStatuses.includes(this.status);
};

JobApplication.prototype.canUpdateStatus = function(newStatus) {
  // Define valid status transitions
  const validTransitions = {
    'applied': ['reviewing', 'rejected', 'withdrawn'],
    'reviewing': ['shortlisted', 'rejected', 'withdrawn'],
    'shortlisted': ['interview_scheduled', 'rejected', 'withdrawn'],
    'interview_scheduled': ['interviewed', 'rejected', 'withdrawn'],
    'interviewed': ['offered', 'rejected', 'withdrawn'],
    'offered': ['hired', 'rejected', 'withdrawn'],
    'hired': [], // Final state
    'rejected': [], // Final state
    'withdrawn': [] // Final state
  };
  
  return validTransitions[this.status]?.includes(newStatus) || false;
};

// Define associations so includes work across routes
JobApplication.associate = (models) => {
  try {
    // Only define if not already defined to prevent duplicate association errors
    if (!JobApplication.associations.job) {
      JobApplication.belongsTo(models.Job, { as: 'job', foreignKey: 'jobId' });
    }
    if (!JobApplication.associations.applicant) {
      JobApplication.belongsTo(models.User, { as: 'applicant', foreignKey: 'userId' });
    }
    if (!JobApplication.associations.employer) {
      JobApplication.belongsTo(models.User, { as: 'employer', foreignKey: 'employerId' });
    }
    if (!JobApplication.associations.jobResume) {
      JobApplication.belongsTo(models.Resume, { as: 'jobResume', foreignKey: 'resumeId' });
    }
    if (!JobApplication.associations.jobCoverLetter) {
      JobApplication.belongsTo(models.CoverLetter, { as: 'jobCoverLetter', foreignKey: 'coverLetterId' });
    }
  } catch (e) {
    console.warn('JobApplication association setup warning:', e?.message || e);
  }
};

module.exports = JobApplication;