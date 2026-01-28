const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BulkJobImport = sequelize.define('BulkJobImport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    importName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'import_name',
      comment: 'Name for this bulk import job'
    },
    importType: {
      type: DataTypes.ENUM('csv', 'excel', 'json', 'api'),
      allowNull: false,
      defaultValue: 'csv',
      field: 'import_type',
      comment: 'Type of import file'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_url',
      comment: 'URL to the uploaded file'
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_path',
      comment: 'Path to the uploaded file (legacy)'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size',
      comment: 'Size of the uploaded file in bytes'
    },
    totalRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_records',
      comment: 'Total number of records in the file'
    },
    processedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'processed_records',
      comment: 'Number of records processed so far'
    },
    successfulImports: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'successful_imports',
      comment: 'Number of jobs successfully imported'
    },
    failedImports: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_imports',
      comment: 'Number of jobs that failed to import'
    },
    failedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_records',
      comment: 'Number of records that failed to import (legacy)'
    },
    skippedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'skipped_records',
      comment: 'Number of records skipped (duplicates, invalid data, etc.)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending',
      comment: 'Current status of the import process'
    },
    progress: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'Progress percentage (0-100)'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
      comment: 'When the import process started'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
      comment: 'When the import process completed'
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
      comment: 'When the import was cancelled'
    },
    errorLog: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'error_log',
      comment: 'Array of error messages and details'
    },
    successLog: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'success_log',
      comment: 'Array of successfully imported jobs'
    },
    mappingConfig: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'mapping_config',
      comment: 'Field mapping configuration for the import'
    },
    validationRules: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'validation_rules',
      comment: 'Validation rules applied during import'
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'template_id',
      comment: 'Job template to use for imported jobs'
    },
    defaultValues: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'default_values',
      comment: 'Default values to apply to all imported jobs'
    },
    isScheduled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_scheduled',
      comment: 'Whether this import is scheduled for later'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at',
      comment: 'When the import should be executed'
    },
    notificationEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'notification_email',
      comment: 'Email to notify when import completes'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      comment: 'User who initiated this import'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      comment: 'Company this import belongs to'
    }
  }, {
    tableName: 'bulk_job_imports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['created_by']
      },
      {
        fields: ['company_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['import_type']
      },
      {
        fields: ['started_at']
      },
      {
        fields: ['scheduled_at']
      }
    ]
  });

  BulkJobImport.associate = (models) => {
    BulkJobImport.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    BulkJobImport.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    BulkJobImport.belongsTo(models.JobTemplate, {
      foreignKey: 'templateId',
      as: 'template'
    });
  };

  return BulkJobImport;
};


