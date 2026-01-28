'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_photos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Original filename of the uploaded image'
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Path to the stored image file'
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Public URL to access the image'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'File size in bytes'
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'MIME type of the image (e.g., image/jpeg, image/png)'
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Image width in pixels'
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Image height in pixels'
      },
      alt_text: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Alternative text for accessibility'
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional caption for the image'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order in which images should be displayed'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is the primary showcase image'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the image is active and should be displayed'
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who uploaded the image'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata about the image'
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

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('job_photos', ['job_id'], { name: 'job_photos_job_id' });
    } catch (error) {
      console.log('Index job_photos_job_id might already exist, skipping...');
    }
    
    try {
      await queryInterface.addIndex('job_photos', ['job_id', 'display_order'], { name: 'job_photos_job_id_display_order' });
    } catch (error) {
      console.log('Index job_photos_job_id_display_order might already exist, skipping...');
    }
    
    try {
      await queryInterface.addIndex('job_photos', ['job_id', 'is_primary'], { name: 'job_photos_job_id_is_primary' });
    } catch (error) {
      console.log('Index job_photos_job_id_is_primary might already exist, skipping...');
    }
    
    try {
      await queryInterface.addIndex('job_photos', ['is_active'], { name: 'job_photos_is_active' });
    } catch (error) {
      console.log('Index job_photos_is_active might already exist, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('job_photos');
  }
};
