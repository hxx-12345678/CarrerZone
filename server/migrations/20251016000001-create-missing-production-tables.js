'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Creating missing production tables...');

    // Create job_filters table
    await queryInterface.createTable('job_filters', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      filter_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      filter_criteria: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    console.log('✅ Created job_filters table');

    // Create verification_documents table
    await queryInterface.createTable('verification_documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        }
      },
      document_type: {
        type: Sequelize.ENUM(
          'business_license',
          'gst_certificate',
          'pan_card',
          'company_registration',
          'authorization_letter',
          'other'
        ),
        allowNull: false
      },
      document_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      document_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      verified_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
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

    console.log('✅ Created verification_documents table');

    // Create indexes
    await queryInterface.addIndex('job_filters', ['user_id']);
    await queryInterface.addIndex('job_filters', ['is_active']);
    await queryInterface.addIndex('verification_documents', ['company_id']);
    await queryInterface.addIndex('verification_documents', ['status']);
    await queryInterface.addIndex('verification_documents', ['document_type']);

    console.log('✅ Created indexes for new tables');
    console.log('🎉 Successfully created missing production tables!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Dropping missing production tables...');
    
    await queryInterface.dropTable('verification_documents');
    await queryInterface.dropTable('job_filters');
    
    console.log('✅ Dropped missing production tables');
  }
};
