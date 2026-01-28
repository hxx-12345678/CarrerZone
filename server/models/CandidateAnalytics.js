const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CandidateAnalytics = sequelize.define('CandidateAnalytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employerId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Employer who performed the search'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Company this analytics belongs to'
    },
    searchQuery: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Search parameters used (keywords, filters, etc.)'
    },
    searchType: {
      type: DataTypes.ENUM('basic', 'advanced', 'ats', 'saved', 'recommended'),
      allowNull: false,
      defaultValue: 'basic',
      comment: 'Type of search performed'
    },
    totalResults: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of candidates found'
    },
    viewedCandidates: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of candidate profiles viewed'
    },
    contactedCandidates: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of candidates contacted'
    },
    shortlistedCandidates: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of candidates shortlisted'
    },
    downloadedResumes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of resumes downloaded'
    },
    bulkActions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Bulk actions performed (export, contact, etc.)'
    },
    searchDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time taken for search in milliseconds'
    },
    filtersUsed: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of filters applied during search'
    },
    sortCriteria: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Sorting criteria used'
    },
    resultQuality: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Quality score of search results (0-1)'
    },
    conversionRate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0,
      comment: 'Conversion rate from search to contact'
    },
    engagementScore: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      comment: 'Overall engagement score for this search'
    },
    searchSessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Unique session ID for tracking search flow'
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Device and browser information'
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Geographic location of the search'
    },
    timeOfDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Hour of day when search was performed (0-23)'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Day of week when search was performed (0-6)'
    },
    isSuccessful: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the search was considered successful'
    },
    feedback: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'User feedback on search results'
    },
    relatedSearches: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Related searches performed in the same session'
    },
    candidateInteractions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Detailed interactions with individual candidates'
    },
    searchRefinements: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Search refinements made during the session'
    },
    exportData: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Data exported from this search'
    },
    costIncurred: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Cost incurred for this search (credits, premium features, etc.)'
    }
  }, {
  tableName: 'candidate_analytics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
    timestamps: true,
    indexes: [
      {
                  fields: ['employer_id']
      },
          {
      fields: ['company_id']
    },
      {
                  fields: ['search_type']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['searchSessionId']
      },
      {
        fields: ['isSuccessful']
      }
    ]
  });

  CandidateAnalytics.associate = (models) => {
    CandidateAnalytics.belongsTo(models.User, {
      foreignKey: 'employerId',
      as: 'employer'
    });
    
    CandidateAnalytics.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  return CandidateAnalytics;
};


