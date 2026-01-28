const express = require('express');
const router = express.Router();
const TaxEngine = require('../lib/taxEngine');
const { body, validationResult } = require('express-validator');

// Initialize tax engine
const taxEngine = new TaxEngine();

/**
 * POST /api/salary/calculate
 * Calculate salary breakdown for multiple tax regimes
 */
router.post('/calculate', [
  body('fy').optional().isString().withMessage('Financial year must be a string'),
  body('regimes').optional().isArray().withMessage('Regimes must be an array'),
  body('profile').isObject().withMessage('Profile is required'),
  body('profile.ctc').optional().isNumeric().withMessage('CTC must be a number'),
  body('profile.basic').isNumeric().withMessage('Basic salary is required and must be a number'),
  body('profile.hra').isNumeric().withMessage('HRA is required and must be a number'),
  body('profile.special_allowances').isNumeric().withMessage('Special allowances is required and must be a number'),
  body('profile.conveyance').optional().isNumeric().withMessage('Conveyance must be a number'),
  body('profile.lta').optional().isNumeric().withMessage('LTA must be a number'),
  body('profile.bonus').optional().isNumeric().withMessage('Bonus must be a number'),
  body('profile.other_taxable').optional().isNumeric().withMessage('Other taxable must be a number'),
  body('profile.employee_pf_percent').optional().isNumeric().withMessage('Employee PF percent must be a number'),
  body('profile.employer_pf_percent').optional().isNumeric().withMessage('Employer PF percent must be a number'),
  body('profile.nps_employee').optional().isNumeric().withMessage('NPS employee must be a number'),
  body('profile.nps_employer').optional().isNumeric().withMessage('NPS employer must be a number'),
  body('profile.other_deductions').optional().isNumeric().withMessage('Other deductions must be a number'),
  body('profile.investments').optional().isObject().withMessage('Investments must be an object'),
  body('profile.rent_paid').optional().isNumeric().withMessage('Rent paid must be a number'),
  body('profile.lives_in_metro').optional().isBoolean().withMessage('Lives in metro must be a boolean'),
  body('profile.age').optional().isNumeric().withMessage('Age must be a number'),
  body('profile.state').optional().isString().withMessage('State must be a string'),
  body('profile.income_from_other_sources').optional().isNumeric().withMessage('Income from other sources must be a number'),
  body('profile.stcg').optional().isNumeric().withMessage('STCG must be a number'),
  body('profile.ltcg').optional().isNumeric().withMessage('LTCG must be a number')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { fy = '2025-26', regimes = ['old', 'new'], profile } = req.body;

    // Calculate salary breakdown
    const result = await taxEngine.calculateSalaryBreakdown(profile, { fy, regimes });

    // Add disclaimer
    result.disclaimer = {
      message: "This calculation is for estimation purposes only. Please consult a Chartered Accountant or verify with the Income Tax Department for final tax calculations.",
      source: "Income Tax Department of India",
      lastUpdated: result.metadata.fetchedAt
    };

    res.json(result);
  } catch (error) {
    console.error('Salary calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Salary calculation failed',
      error: error.message
    });
  }
});

/**
 * GET /api/salary/regimes
 * Get available tax regimes for a financial year
 */
router.get('/regimes', async (req, res) => {
  try {
    const { fy = '2025-26' } = req.query;
    const regimes = await taxEngine.getAvailableRegimes(fy);
    
    res.json({
      success: true,
      fy,
      regimes: regimes.map(regime => ({
        key: regime,
        name: regime.charAt(0).toUpperCase() + regime.slice(1).replace(/_/g, ' ')
      }))
    });
  } catch (error) {
    console.error('Error getting regimes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available regimes',
      error: error.message
    });
  }
});

/**
 * GET /api/salary/states
 * Get available states for professional tax calculation
 */
router.get('/states', async (req, res) => {
  try {
    const rules = await taxEngine.rulesFetcher.fetchRulesForFY('2025-26');
    const states = Object.keys(rules.professionalTax).filter(state => state !== 'default');
    
    res.json({
      success: true,
      states: states.sort()
    });
  } catch (error) {
    console.error('Error getting states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available states',
      error: error.message
    });
  }
});

/**
 * GET /api/salary/deduction-limits
 * Get deduction limits for different sections
 */
router.get('/deduction-limits', async (req, res) => {
  try {
    const { fy = '2025-26' } = req.query;
    const rules = await taxEngine.rulesFetcher.fetchRulesForFY(fy);
    
    res.json({
      success: true,
      fy,
      deductionLimits: rules.deductionLimits
    });
  } catch (error) {
    console.error('Error getting deduction limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deduction limits',
      error: error.message
    });
  }
});

/**
 * POST /api/salary/refresh-rules
 * Refresh tax rules cache for a specific financial year
 */
router.post('/refresh-rules', [
  body('fy').optional().isString().withMessage('Financial year must be a string')
], async (req, res) => {
  try {
    const { fy = '2025-26' } = req.body;
    
    const rules = await taxEngine.refreshTaxRules(fy);
    
    res.json({
      success: true,
      message: `Tax rules refreshed for FY ${fy}`,
      fy,
      rules: {
        source: rules.source,
        fetchedAt: rules.fetchedAt,
        regimes: Object.keys(rules.regimes)
      }
    });
  } catch (error) {
    console.error('Error refreshing tax rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh tax rules',
      error: error.message
    });
  }
});

/**
 * GET /api/salary/cache-status
 * Get cache status for tax rules
 */
router.get('/cache-status', (req, res) => {
  try {
    const cacheStatus = taxEngine.rulesFetcher.getCacheStatus();
    
    res.json({
      success: true,
      cache: cacheStatus,
      ttl: taxEngine.rulesFetcher.cacheTTL
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache status',
      error: error.message
    });
  }
});

/**
 * POST /api/salary/clear-cache
 * Clear tax rules cache
 */
router.post('/clear-cache', [
  body('fy').optional().isString().withMessage('Financial year must be a string')
], (req, res) => {
  try {
    const { fy } = req.body;
    taxEngine.rulesFetcher.clearCache(fy);
    
    res.json({
      success: true,
      message: fy ? `Cache cleared for FY ${fy}` : 'All cache cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

/**
 * GET /api/salary/sample-calculations
 * Get sample calculations for testing
 */
router.get('/sample-calculations', async (req, res) => {
  try {
    const samples = [
      {
        name: "Low Income with 80C",
        profile: {
          ctc: 480000,
          basic: 192000,
          hra: 96000,
          conveyance: 24000,
          special_allowances: 168000,
          lta: 0,
          bonus: 0,
          other_taxable: 0,
          employee_pf_percent: 12,
          nps_employee: 0,
          other_deductions: 0,
          investments: { "80C": 150000, "80D": 25000 },
          rent_paid: 96000,
          lives_in_metro: true,
          age: 30,
          state: "Maharashtra",
          income_from_other_sources: 0,
          stcg: 0,
          ltcg: 0
        }
      },
      {
        name: "Mid Income (12L)",
        profile: {
          ctc: 1200000,
          basic: 480000,
          hra: 240000,
          conveyance: 24000,
          special_allowances: 360000,
          lta: 20000,
          bonus: 60000,
          other_taxable: 16000,
          employee_pf_percent: 12,
          nps_employee: 0,
          other_deductions: 0,
          investments: { "80C": 150000, "80D": 25000 },
          rent_paid: 288000,
          lives_in_metro: true,
          age: 30,
          state: "Maharashtra",
          income_from_other_sources: 0,
          stcg: 0,
          ltcg: 0
        }
      },
      {
        name: "High Income with STCG/LTCG",
        profile: {
          ctc: 3500000,
          basic: 1200000,
          hra: 600000,
          conveyance: 60000,
          special_allowances: 1200000,
          lta: 40000,
          bonus: 300000,
          other_taxable: 100000,
          employee_pf_percent: 12,
          nps_employee: 50000,
          other_deductions: 0,
          investments: { "80C": 150000, "80D": 25000 },
          rent_paid: 720000,
          lives_in_metro: true,
          age: 40,
          state: "Karnataka",
          income_from_other_sources: 0,
          stcg: 300000,
          ltcg: 200000
        }
      }
    ];

    res.json({
      success: true,
      samples
    });
  } catch (error) {
    console.error('Error getting sample calculations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sample calculations',
      error: error.message
    });
  }
});

module.exports = router;
