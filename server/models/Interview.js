const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobApplicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_application_id',
    references: {
      model: 'job_applications',
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
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'candidate_id',
    references: {
      model: 'users',
      key: 'id'
    }
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interviewType: {
    type: DataTypes.ENUM('phone', 'video', 'in_person', 'technical', 'hr', 'final'),
    allowNull: false,
    defaultValue: 'phone',
    field: 'interview_type'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled', 'in_progress', 'no_show'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_at'
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false,
    defaultValue: 60
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'UTC'
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'meeting_link'
  },
  meetingPassword: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'meeting_password'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  decision: {
    type: DataTypes.ENUM('selected', 'rejected', 'on-hold', 'next-round', 'next_round', 'on_hold'),
    allowNull: true
  },
  interviewers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  agenda: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  requirements: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  nextRoundDetails: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'next_round_details'
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'reminder_sent'
  },
  reminderSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_sent_at'
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cancelled_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'Interview',
  tableName: 'interviews',
  indexes: [
    {
      fields: ['job_application_id']
    },
    {
      fields: ['employer_id']
    },
    {
      fields: ['candidate_id']
    },
    {
      fields: ['job_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['scheduledAt']
    },
    {
      fields: ['interviewType']
    }
  ],
  hooks: {
    beforeCreate: (interview) => {
      if (!interview.title) {
        interview.title = `${interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)} Interview`;
      }
    }
  }
});

// Instance methods
Interview.prototype.isUpcoming = function() {
  return new Date() < this.scheduledAt && this.status === 'scheduled';
};

Interview.prototype.isOverdue = function() {
  return new Date() > new Date(this.scheduledAt.getTime() + this.duration * 60000) && this.status === 'scheduled';
};

Interview.prototype.getStatusColor = function() {
  const colors = {
    scheduled: 'blue',
    confirmed: 'green',
    'in-progress': 'yellow',
    completed: 'green',
    cancelled: 'red',
    rescheduled: 'orange'
  };
  return colors[this.status] || 'gray';
};

Interview.prototype.getStatusLabel = function() {
  const labels = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled'
  };
  return labels[this.status] || 'Unknown';
};

Interview.prototype.canBeCancelled = function() {
  const hoursUntilInterview = (this.scheduledAt - new Date()) / (1000 * 60 * 60);
  return this.status === 'scheduled' && hoursUntilInterview > 2;
};

Interview.prototype.canBeRescheduled = function() {
  const hoursUntilInterview = (this.scheduledAt - new Date()) / (1000 * 60 * 60);
  return this.status === 'scheduled' && hoursUntilInterview > 24;
};

// Define associations in a safe, late-binding manner if associate is used elsewhere
Interview.associate = (models) => {
  try {
    // Only define if not already defined to prevent duplicate association errors
    if (!Interview.associations.jobApplication) {
      Interview.belongsTo(models.JobApplication, { as: 'jobApplication', foreignKey: 'jobApplicationId' });
    }
    if (!Interview.associations.employer) {
      Interview.belongsTo(models.User, { as: 'employer', foreignKey: 'employerId' });
    }
    if (!Interview.associations.candidate) {
      Interview.belongsTo(models.User, { as: 'candidate', foreignKey: 'candidateId' });
    }
    if (!Interview.associations.job) {
      Interview.belongsTo(models.Job, { as: 'job', foreignKey: 'jobId' });
    }
  } catch (e) {
    // Avoid crash if models not fully initialized yet
    console.warn('Interview association setup warning:', e?.message || e);
  }
};

module.exports = Interview;
