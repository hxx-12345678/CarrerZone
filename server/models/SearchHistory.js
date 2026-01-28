const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SearchHistory = sequelize.define('SearchHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  searchQuery: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filters: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Stores search filters like location, salary, experience level, etc.'
  },
  resultsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  searchType: {
    type: DataTypes.ENUM('job_search', 'company_search', 'advanced_search'),
    allowNull: false,
    defaultValue: 'job_search'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  experienceLevel: {
    type: DataTypes.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive'),
    allowNull: true
  },
  salaryMin: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  salaryMax: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  remoteWork: {
    type: DataTypes.ENUM('on_site', 'hybrid', 'remote', 'any'),
    allowNull: true
  },
  jobCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isSaved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this search was saved as a favorite'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional search metadata like user agent, IP, etc.'
  }
}, {
  tableName: 'search_history',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['searchQuery']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['searchType']
    },
    {
      fields: ['location']
    }
  ],
  hooks: {
    beforeCreate: (searchHistory) => {
      // Ensure search query is not empty
      if (!searchHistory.searchQuery || searchHistory.searchQuery.trim() === '') {
        throw new Error('Search query cannot be empty');
      }
      
      // Normalize search query
      searchHistory.searchQuery = searchHistory.searchQuery.trim().toLowerCase();
    }
  }
});

// Instance methods
SearchHistory.prototype.getSearchSummary = function() {
  const filters = [];
  
  if (this.location) filters.push(`Location: ${this.location}`);
  if (this.experienceLevel) filters.push(`Experience: ${this.experienceLevel}`);
  if (this.remoteWork && this.remoteWork !== 'any') filters.push(`Remote: ${this.remoteWork}`);
  if (this.salaryMin || this.salaryMax) {
    const salary = [];
    if (this.salaryMin) salary.push(`Min: $${this.salaryMin.toLocaleString()}`);
    if (this.salaryMax) salary.push(`Max: $${this.salaryMax.toLocaleString()}`);
    filters.push(`Salary: ${salary.join(' - ')}`);
  }
  
  return {
    query: this.searchQuery,
    filters: filters.join(', '),
    results: this.resultsCount,
    type: this.searchType
  };
};

SearchHistory.prototype.markAsSaved = function() {
  this.isSaved = true;
  return this.save();
};

SearchHistory.prototype.markAsUnsaved = function() {
  this.isSaved = false;
  return this.save();
};

module.exports = SearchHistory;
