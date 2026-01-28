'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check and add missing columns to resumes table
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- Add is_primary column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'is_primary'
        ) THEN
          ALTER TABLE "resumes" ADD COLUMN "is_primary" BOOLEAN DEFAULT false;
        END IF;
        
        -- Add is_public column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'is_public'
        ) THEN
          ALTER TABLE "resumes" ADD COLUMN "is_public" BOOLEAN DEFAULT true;
        END IF;
        
        -- Add view_count column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'view_count'
        ) THEN
          ALTER TABLE "resumes" ADD COLUMN "view_count" INTEGER DEFAULT 0;
        END IF;
        
        -- Add download_count column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'download_count'
        ) THEN
          ALTER TABLE "resumes" ADD COLUMN "download_count" INTEGER DEFAULT 0;
        END IF;
      END$$;
    `);
    console.log('✅ Fixed resume table columns');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'is_primary'
        ) THEN
          ALTER TABLE "resumes" DROP COLUMN "is_primary";
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'is_public'
        ) THEN
          ALTER TABLE "resumes" DROP COLUMN "is_public";
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'view_count'
        ) THEN
          ALTER TABLE "resumes" DROP COLUMN "view_count";
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'download_count'
        ) THEN
          ALTER TABLE "resumes" DROP COLUMN "download_count";
        END IF;
      END$$;
    `);
    console.log('✅ Removed resume table columns');
  }
};

