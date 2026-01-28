const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const crypto = require('crypto');

const TeamInvitation = sequelize.define('TeamInvitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'invited_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_name'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'accepted_at'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      jobPosting: true,
      resumeDatabase: true,
      analytics: true,
      featuredJobs: false,
      hotVacancies: false,
      applications: true,
      requirements: true,
      settings: false
    }
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Recruiter'
  }
}, {
  tableName: 'team_invitations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Generate unique invitation token
TeamInvitation.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if invitation is expired
TeamInvitation.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Check if invitation is valid
TeamInvitation.prototype.isValid = function() {
  return this.status === 'pending' && !this.isExpired();
};

// Define associations
TeamInvitation.associate = function(models) {
  TeamInvitation.belongsTo(models.Company, {
    foreignKey: 'companyId',
    as: 'company'
  });
  
  TeamInvitation.belongsTo(models.User, {
    foreignKey: 'invitedBy',
    as: 'inviter'
  });
  
  TeamInvitation.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = TeamInvitation;

