/**
 * Backfill Script: Update User Region from Company Region
 * 
 * This script updates users with NULL region by:
 * 1. Finding all users with region = NULL
 * 2. If user has a company_id, inherit region from company
 * 3. If no company or company has no region, default to 'india'
 * 
 * Usage: node server/backfill-user-region.js
 */

const { sequelize } = require('./config/sequelize');
const User = require('./models/User');
const Company = require('./models/Company');

async function backfillUserRegion() {
  try {
    console.log('🔄 Starting User Region Backfill...\n');
    console.log('='.repeat(80));

    // Find all users with NULL region
    const usersWithNullRegion = await User.findAll({
      where: {
        region: null
      }
    });

    console.log(`📊 Found ${usersWithNullRegion.length} users with NULL region\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of usersWithNullRegion) {
      try {
        let newRegion = 'india'; // Default region
        
        // If user has a company, try to get region from company
        if (user.company_id) {
          const company = await Company.findByPk(user.company_id);
          if (company && company.region) {
            newRegion = company.region;
            console.log(`✅ User ${user.email}: Setting region to '${newRegion}' from company '${company.name}'`);
          } else {
            console.log(`⚠️  User ${user.email}: Has company but company has no region, defaulting to 'india'`);
          }
        } else {
          console.log(`⚠️  User ${user.email}: No company, defaulting to 'india'`);
        }

        // Update user region
        await user.update({ region: newRegion });
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Backfill Summary:');
    console.log(`   - Total users with NULL region: ${usersWithNullRegion.length}`);
    console.log(`   - Successfully updated: ${updated}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Errors: ${errors}`);
    console.log('='.repeat(80));
    console.log('✅ Backfill Complete!\n');

    // Verify specific users
    console.log('🔍 Verifying specific users:');
    console.log('-'.repeat(80));
    
    const sheikh = await User.findOne({ where: { email: 'sheikh@gmail.com' } });
    if (sheikh) {
      console.log(`   sheikh@gmail.com: region = ${sheikh.region || 'NULL'}`);
      if (sheikh.company_id) {
        const company = await Company.findByPk(sheikh.company_id);
        if (company) {
          console.log(`   Company: ${company.name}, region = ${company.region || 'NULL'}`);
        }
      }
    } else {
      console.log('   sheikh@gmail.com: User not found');
    }

    const hxx = await User.findOne({ where: { email: 'hxx@gmail.com' } });
    if (hxx) {
      console.log(`   hxx@gmail.com: region = ${hxx.region || 'NULL'}`);
      if (hxx.company_id) {
        const company = await Company.findByPk(hxx.company_id);
        if (company) {
          console.log(`   Company: ${company.name}, region = ${company.region || 'NULL'}`);
        }
      }
    } else {
      console.log('   hxx@gmail.com: User not found');
    }

    console.log('-'.repeat(80));

  } catch (error) {
    console.error('❌ Backfill Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the backfill
backfillUserRegion()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

