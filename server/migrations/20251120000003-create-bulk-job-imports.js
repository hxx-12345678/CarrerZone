'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Skip creating table if it already exists (handles previous casing variants)
    const [existsRows] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'bulk_job_imports'
      ) AS exists;
    `);
    const tableExists = Array.isArray(existsRows) ? existsRows[0]?.exists : existsRows?.exists;
    if (!tableExists) {
      await queryInterface.createTable('bulk_job_imports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      import_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name for this bulk import job'
      },
      import_type: {
        type: Sequelize.ENUM('csv', 'excel', 'json', 'api'),
        allowNull: false,
        defaultValue: 'csv',
        comment: 'Type of import file'
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to the uploaded file'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Size of the uploaded file in bytes'
      },
      total_records: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total number of records in the file'
      },
      processed_records: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of records processed so far'
      },
      successful_imports: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of jobs successfully imported'
      },
      failed_imports: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of jobs that failed to import'
      },
      skipped_records: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of records skipped (duplicates, invalid data, etc.)'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
        comment: 'Current status of the import process'
      },
      progress: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Progress percentage (0-100)'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the import process started'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the import process completed'
      },
      error_log: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Array of error messages and details'
      },
      success_log: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Array of successfully imported jobs'
      },
      mapping_config: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Field mapping configuration for the import'
      },
      validation_rules: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Validation rules applied during import'
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Job template to use for imported jobs',
        references: {
          model: 'job_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      default_values: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Default values to apply to all imported jobs'
      },
      is_scheduled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this import is scheduled for later'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the import should be executed'
      },
      notification_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Email to notify when import completes'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User who initiated this import',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Company this import belongs to',
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
      });
    }

    // Add indexes (idempotent, casing-aware)
    const indexExists = async (name) => {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname = :idx`,
        { replacements: { idx: name } }
      );
      return Array.isArray(rows) && rows.length > 0;
    };
    const tryIndex = async (columnsVariants, name) => {
      if (await indexExists(name)) return;
      for (const cols of columnsVariants) {
        try {
          await queryInterface.addIndex('bulk_job_imports', cols, { name });
          return;
        } catch (e) {}
      }
    };

    await tryIndex([['created_by'], ['createdBy']], 'bulk_job_imports_created_by');
    await tryIndex([['company_id'], ['companyId']], 'bulk_job_imports_company_id');
    await tryIndex([['status']], 'bulk_job_imports_status');
    await tryIndex([['import_type'], ['importType']], 'bulk_job_imports_import_type');
    await tryIndex([['started_at'], ['startedAt']], 'bulk_job_imports_started_at');
    await tryIndex([['scheduled_at'], ['scheduledAt']], 'bulk_job_imports_scheduled_at');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bulk_job_imports');
  }
};
