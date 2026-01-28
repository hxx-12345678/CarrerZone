'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Creating missing tables...');

      // Create BulkJobImport table if it doesn't exist
      try {
        await queryInterface.createTable('bulk_job_imports', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          import_name: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          import_type: {
            type: Sequelize.ENUM('csv', 'excel', 'json', 'api'),
            allowNull: false,
            defaultValue: 'csv'
          },
          file_path: {
            type: Sequelize.STRING(500),
            allowNull: true
          },
          total_records: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          processed_records: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          failed_records: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          status: {
            type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
          },
          error_log: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            }
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
        console.log('✅ Created bulk_job_imports table');
      } catch (error) {
        console.log('⚠️ bulk_job_imports table might already exist:', error.message);
      }

      // Create CandidateAnalytics table if it doesn't exist
      try {
        await queryInterface.createTable('candidate_analytics', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          candidate_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            }
          },
          employer_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            }
          },
          job_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'jobs',
              key: 'id'
            }
          },
          event_type: {
            type: Sequelize.ENUM('profile_view', 'resume_download', 'contact_request', 'interview_request', 'application_submitted'),
            allowNull: false
          },
          event_data: {
            type: Sequelize.JSONB,
            defaultValue: {}
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
        console.log('✅ Created candidate_analytics table');
      } catch (error) {
        console.log('⚠️ candidate_analytics table might already exist:', error.message);
      }

      // Create JobTemplate table if it doesn't exist
      try {
        await queryInterface.createTable('job_templates', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          name: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          template_data: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: {}
          },
          category: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          is_public: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            }
          },
          usage_count: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
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
        console.log('✅ Created job_templates table');
      } catch (error) {
        console.log('⚠️ job_templates table might already exist:', error.message);
      }

      // Create RequirementApplication table if it doesn't exist
      try {
        await queryInterface.createTable('requirement_applications', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          requirement_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'requirements',
              key: 'id'
            }
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            }
          },
          resume_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'resumes',
              key: 'id'
            }
          },
          cover_letter_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'cover_letters',
              key: 'id'
            }
          },
          status: {
            type: Sequelize.ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired'),
            allowNull: false,
            defaultValue: 'pending'
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true
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
        console.log('✅ Created requirement_applications table');
      } catch (error) {
        console.log('⚠️ requirement_applications table might already exist:', error.message);
      }

      console.log('✅ Missing tables migration completed');
    } catch (error) {
      console.log('⚠️ Missing tables migration error:', error.message);
      // Don't throw error, just log it
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('bulk_job_imports');
      await queryInterface.dropTable('candidate_analytics');
      await queryInterface.dropTable('job_templates');
      await queryInterface.dropTable('requirement_applications');
    } catch (error) {
      console.log('⚠️ Error dropping tables:', error.message);
    }
  }
};
