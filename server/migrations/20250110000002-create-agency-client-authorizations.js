'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: ensure dependent tables exist to avoid FK errors on fresh DBs
    const allTables = await queryInterface.showAllTables();
    const normalized = Array.isArray(allTables)
      ? allTables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];

    if (!normalized.includes('users') || !normalized.includes('companies')) {
      console.log('ℹ️  Skipping agency_client_authorizations creation (users/companies not ready yet)');
      return;
    }

    // Skip if table already exists
    if (normalized.includes('agency_client_authorizations')) {
      console.log('ℹ️  Table agency_client_authorizations already exists, skipping...');
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Creating agency_client_authorizations table...');
      
      await queryInterface.createTable('agency_client_authorizations', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        
        // Relationships
        agency_company_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'companies',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          comment: 'The recruiting agency'
        },
        client_company_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'companies',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          comment: 'The client/hiring company'
        },
        
        // Authorization Details
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'pending',
          comment: 'pending | pending_client_confirm | pending_admin_review | active | expired | revoked | rejected'
        },
        
        // Contract Details
        contract_start_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        contract_end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        auto_renew: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        
        // Permissions
        can_post_jobs: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        can_edit_jobs: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        can_delete_jobs: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        can_view_applications: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        max_active_jobs: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'null = unlimited'
        },
        job_categories: {
          type: Sequelize.JSONB,
          defaultValue: [],
          comment: 'Allowed job categories (empty = all)'
        },
        allowed_locations: {
          type: Sequelize.JSONB,
          defaultValue: [],
          comment: 'Allowed locations (empty = all)'
        },
        
        // Documents
        authorization_letter_url: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        service_agreement_url: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        client_gst_url: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        client_pan_url: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        additional_documents: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        
        // Verification
        verified_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        verified_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        verification_method: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'automated_gst | manual_review | hybrid'
        },
        
        client_confirmed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        client_confirmed_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Email of person who confirmed'
        },
        admin_approved_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        admin_approved_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // Client Contact
        client_contact_email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        client_contact_phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        client_contact_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        
        // Tracking
        jobs_posted: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        total_applications: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        last_job_posted_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        
        // Notes
        internal_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        rejection_reason: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        
        // Timestamps
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        }
      }, { transaction });
      
      console.log('✅ Created agency_client_authorizations table');
      
      // Add unique constraint
      await queryInterface.addConstraint('agency_client_authorizations', {
        fields: ['agency_company_id', 'client_company_id'],
        type: 'unique',
        name: 'unique_agency_client',
        transaction
      });
      
      console.log('✅ Added unique constraint');
      
      // Add check constraint for status
      await queryInterface.sequelize.query(
        `ALTER TABLE agency_client_authorizations 
         ADD CONSTRAINT check_status 
         CHECK (status IN ('pending', 'pending_client_confirm', 'pending_admin_review', 'active', 'expired', 'revoked', 'rejected'))`,
        { transaction }
      );
      
      console.log('✅ Added status check constraint');
      
      // Create indexes
      await queryInterface.addIndex('agency_client_authorizations', ['agency_company_id'], {
        name: 'idx_agency_auth_agency',
        transaction
      });
      
      await queryInterface.addIndex('agency_client_authorizations', ['client_company_id'], {
        name: 'idx_agency_auth_client',
        transaction
      });
      
      await queryInterface.addIndex('agency_client_authorizations', ['status'], {
        name: 'idx_agency_auth_status',
        transaction
      });
      
      console.log('✅ Created indexes');
      
      await transaction.commit();
      console.log('🎉 Migration completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Dropping agency_client_authorizations table...');
      
      await queryInterface.dropTable('agency_client_authorizations', { transaction });
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};


