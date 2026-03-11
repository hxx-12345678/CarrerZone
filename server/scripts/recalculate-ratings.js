/**
 * Script to recalculate all company average ratings from CompanyReview records
 * Run with: node server/scripts/recalculate-ratings.js
 */

const { sequelize } = require('../config/sequelize');
const Company = require('../models/Company');
const CompanyReview = require('../models/CompanyReview');

async function recalculateAllRatings() {
  try {
    console.log('🔄 Starting to recalculate all company ratings...');

    // Get all companies
    const companies = await Company.findAll();
    console.log(`Found ${companies.length} companies to process`);

    let updatedCount = 0;
    let processedCount = 0;

    for (const company of companies) {
      processedCount++;
      try {
        // Get approved reviews for this company
        const reviewCount = await CompanyReview.count({
          where: {
            companyId: company.id,
            status: 'approved'
          }
        });

        if (reviewCount === 0) {
          // No reviews, rating should be 0
          if (company.rating !== 0 || company.totalReviews !== 0) {
            await company.update({
              rating: 0,
              totalReviews: 0
            });
            updatedCount++;
            console.log(`✅ [${processedCount}/${companies.length}] ${company.name}: Reset rating (no reviews)`);
          }
          continue;
        }

        // Calculate average rating
        const result = await CompanyReview.findOne({
          where: {
            companyId: company.id,
            status: 'approved'
          },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
          ],
          raw: true
        });

        const avgRating = parseFloat(result.avgRating) || 0;
        const totalReviews = parseInt(result.totalReviews) || 0;

        // Update company if rating changed
        if (company.rating !== avgRating || company.totalReviews !== totalReviews) {
          await company.update({
            rating: avgRating,
            totalReviews: totalReviews
          });
          updatedCount++;
          console.log(
            `✅ [${processedCount}/${companies.length}] ${company.name}: ⭐ ${avgRating.toFixed(2)} (${totalReviews} reviews)`
          );
        } else {
          console.log(
            `✓  [${processedCount}/${companies.length}] ${company.name}: Already correct (⭐ ${avgRating.toFixed(2)})`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing company ${company.id}:`, error.message);
      }
    }

    console.log(`\n✅ Completed! Processed: ${processedCount}/${companies.length}, Updated: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

recalculateAllRatings();
