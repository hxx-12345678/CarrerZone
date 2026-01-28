const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AdminNotification = sequelize.define('AdminNotification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM(
      'new_admin_registration',
      'new_employer_registration', 
      'new_company_registration',
      'company_verification_approved',
      'company_verification_rejected',
      'jobseeker_milestone_10',
      'jobseeker_milestone_50',
      'jobseeker_milestone_100',
      'jobseeker_milestone_500',
      'jobseeker_milestone_1000',
      'jobseeker_milestone_5000',
      'jobseeker_milestone_10000',
      'system_alert',
      'security_alert',
      'performance_alert'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shortMessage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'short_message'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.ENUM('registration', 'verification', 'milestone', 'system', 'security'),
    allowNull: false
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'action_url'
  },
  actionText: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'action_text'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  // Related entity IDs for quick access
  relatedUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'related_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relatedCompanyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'related_company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  // Admin who triggered the action (for verification approvals, etc.)
  triggeredByAdminId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'triggered_by_admin_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'admin_notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (notification) => {
      if (!notification.shortMessage) {
        notification.shortMessage = notification.message.substring(0, 200);
      }
      
      // Set category based on type
      if (notification.type.startsWith('new_')) {
        notification.category = 'registration';
      } else if (notification.type.includes('verification')) {
        notification.category = 'verification';
      } else if (notification.type.includes('milestone')) {
        notification.category = 'milestone';
      } else if (notification.type.includes('security')) {
        notification.category = 'security';
      } else {
        notification.category = 'system';
      }
      
      // Set priority based on type
      if (notification.type.includes('security') || notification.type.includes('urgent')) {
        notification.priority = 'urgent';
      } else if (notification.type.includes('verification') || notification.type.includes('admin')) {
        notification.priority = 'high';
      } else if (notification.type.includes('milestone')) {
        notification.priority = 'medium';
      } else {
        notification.priority = 'low';
      }
    },
    beforeUpdate: async (notification) => {
      if (notification.changed('isRead') && notification.isRead) {
        notification.readAt = new Date();
      }
    }
  }
});

// Instance methods
AdminNotification.prototype.getPriorityColor = function() {
  const priorityColors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  };
  return priorityColors[this.priority] || 'blue';
};

AdminNotification.prototype.getTypeIcon = function() {
  const typeIcons = {
    new_admin_registration: 'user-plus',
    new_employer_registration: 'briefcase',
    new_company_registration: 'building-2',
    company_verification_approved: 'check-circle',
    company_verification_rejected: 'x-circle',
    jobseeker_milestone_10: 'users',
    jobseeker_milestone_50: 'users',
    jobseeker_milestone_100: 'users',
    jobseeker_milestone_500: 'users',
    jobseeker_milestone_1000: 'users',
    jobseeker_milestone_5000: 'users',
    jobseeker_milestone_10000: 'users',
    system_alert: 'alert-triangle',
    security_alert: 'shield-alert',
    performance_alert: 'trending-up'
  };
  return typeIcons[this.type] || 'bell';
};

AdminNotification.prototype.getCategoryColor = function() {
  const categoryColors = {
    registration: 'green',
    verification: 'blue',
    milestone: 'purple',
    system: 'gray',
    security: 'red'
  };
  return categoryColors[this.category] || 'gray';
};

// Static methods
AdminNotification.createRegistrationNotification = async function(userType, userData, companyData = null) {
  const type = userType === 'admin' ? 'new_admin_registration' : 'new_employer_registration';
  const title = userType === 'admin' ? 'New Admin Registration' : 'New Employer Registration';
  const message = userType === 'admin' 
    ? `New admin user "${userData.first_name} ${userData.last_name}" (${userData.email}) has registered.`
    : `New employer "${userData.first_name} ${userData.last_name}" (${userData.email}) has registered.`;
  
  const notification = await this.create({
    type,
    title,
    message,
    priority: 'high',
    category: 'registration',
    actionUrl: '/super-admin/dashboard/users',
    actionText: 'View Users',
    icon: 'user-plus',
    relatedUserId: userData.id,
    relatedCompanyId: companyData?.id,
    metadata: {
      userType,
      userEmail: userData.email,
      userName: `${userData.first_name} ${userData.last_name}`,
      companyName: companyData?.name,
      registrationDate: new Date()
    }
  });
  
  return notification;
};

AdminNotification.createCompanyRegistrationNotification = async function(companyData, userData) {
  const notification = await this.create({
    type: 'new_company_registration',
    title: 'New Company Registration',
    message: `New company "${companyData.name}" has registered and requires verification. Contact: ${userData.email}`,
    priority: 'high',
    category: 'registration',
    actionUrl: '/super-admin/dashboard/verifications',
    actionText: 'Review Company',
    icon: 'building-2',
    relatedUserId: userData.id,
    relatedCompanyId: companyData.id,
    metadata: {
      companyName: companyData.name,
      companyIndustry: companyData.industries && companyData.industries.length > 0 ? companyData.industries[0] : 'Other',
      companySize: companyData.companySize,
      contactEmail: userData.email,
      contactName: `${userData.first_name} ${userData.last_name}`,
      registrationDate: new Date()
    }
  });
  
  return notification;
};

AdminNotification.createVerificationNotification = async function(action, companyData, adminData) {
  const type = action === 'approved' ? 'company_verification_approved' : 'company_verification_rejected';
  const title = action === 'approved' ? 'Company Verification Approved' : 'Company Verification Rejected';
  const message = action === 'approved' 
    ? `Company "${companyData.name}" has been verified and approved by ${adminData.email}.`
    : `Company "${companyData.name}" verification has been rejected by ${adminData.email}.`;
  
  const notification = await this.create({
    type,
    title,
    message,
    priority: 'high',
    category: 'verification',
    actionUrl: '/super-admin/dashboard/companies',
    actionText: 'View Company',
    icon: action === 'approved' ? 'check-circle' : 'x-circle',
    relatedCompanyId: companyData.id,
    triggeredByAdminId: adminData.id,
    metadata: {
      companyName: companyData.name,
      action,
      adminEmail: adminData.email,
      adminName: `${adminData.first_name} ${adminData.last_name}`,
      verificationDate: new Date()
    }
  });
  
  return notification;
};

AdminNotification.createMilestoneNotification = async function(milestone, count) {
  const type = `jobseeker_milestone_${milestone}`;
  const title = `Jobseeker Milestone: ${milestone} Users`;
  const message = `Congratulations! The platform has reached ${count} registered jobseekers. This is a significant milestone for our community.`;
  
  const notification = await this.create({
    type,
    title,
    message,
    priority: 'medium',
    category: 'milestone',
    actionUrl: '/super-admin/dashboard/users',
    actionText: 'View Users',
    icon: 'users',
    metadata: {
      milestone,
      count,
      milestoneDate: new Date()
    }
  });
  
  return notification;
};

// Define associations
AdminNotification.associate = function(models) {
  // AdminNotification belongs to User (related user)
  AdminNotification.belongsTo(models.User, {
    foreignKey: 'relatedUserId',
    as: 'RelatedUser'
  });

  // AdminNotification belongs to Company (related company)
  AdminNotification.belongsTo(models.Company, {
    foreignKey: 'relatedCompanyId',
    as: 'RelatedCompany'
  });

  // AdminNotification belongs to User (triggered by admin)
  AdminNotification.belongsTo(models.User, {
    foreignKey: 'triggeredByAdminId',
    as: 'TriggeredByAdmin'
  });
};

module.exports = AdminNotification;
