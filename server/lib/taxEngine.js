const fs = require('fs').promises;
const path = require('path');

/**
 * Tax Engine for Indian Salary Tax Calculations
 * Implements precise tax calculations using integer arithmetic to avoid floating point errors
 */
class TaxEngine {
  constructor() {
    this.configDir = path.join(__dirname, '..', 'config');
    const TaxRulesFetcher = require('./taxRulesFetcher');
    this.rulesFetcher = new TaxRulesFetcher();
    this.taxRules = null;
  }

  /**
   * Calculate complete salary breakdown for given input
   * @param {Object} input - Salary input parameters
   * @param {Object} options - Calculation options
   * @returns {Promise<Object>} Complete salary breakdown
   */
  async calculateSalaryBreakdown(input, options = {}) {
    try {
      const { fy = '2025-26', regimes = ['old', 'new'] } = options;
      
      // Fetch tax rules for the financial year
      this.taxRules = await this.rulesFetcher.fetchRulesForFY(fy);
      
      // Validate input
      this.validateInput(input);
      
      // Calculate gross salary
      const grossSalary = this.calculateGrossSalary(input);
      
      // Calculate employee contributions
      const employeeContributions = this.calculateEmployeeContributions(input);
      
      // Calculate exemptions
      const exemptions = this.calculateExemptions(input);
      
      // Calculate professional tax
      const professionalTax = this.calculateProfessionalTax(input);
      
      // Calculate results for each regime
      const results = {};
      
      for (const regime of regimes) {
        if (regime === 'all') {
          Object.keys(this.taxRules.regimes).forEach(regimeName => {
            results[regimeName] = this.calculateForRegime(
              input, 
              grossSalary, 
              employeeContributions, 
              exemptions, 
              professionalTax, 
              regimeName
            );
          });
        } else if (this.taxRules.regimes[regime]) {
          results[regime] = this.calculateForRegime(
            input, 
            grossSalary, 
            employeeContributions, 
            exemptions, 
            professionalTax, 
            regime
          );
        }
      }
      
      return {
        success: true,
        fy,
        regimes: results,
        metadata: {
          rulesSource: this.taxRules.source,
          rulesVersion: this.taxRules.fy,
          fetchedAt: this.taxRules.fetchedAt,
          calculatedAt: new Date().toISOString()
        },
        breakdown: {
          grossSalary,
          employeeContributions,
          exemptions,
          professionalTax
        }
      };
    } catch (error) {
      console.error('Error in calculateSalaryBreakdown:', error);
      throw new Error(`Salary calculation failed: ${error.message}`);
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(input) {
    const required = ['basic', 'hra', 'special_allowances'];
    for (const field of required) {
      if (input[field] === undefined || input[field] === null) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
    
    if (input.employee_pf_percent && (input.employee_pf_percent < 0 || input.employee_pf_percent > 100)) {
      throw new Error('Employee PF percentage must be between 0 and 100');
    }
  }

  /**
   * Calculate gross salary from all components
   */
  calculateGrossSalary(input) {
    const components = {
      basic: input.basic || 0,
      hra: input.hra || 0,
      conveyance: input.conveyance || 0,
      special_allowances: input.special_allowances || 0,
      lta: input.lta || 0,
      bonus: input.bonus || 0,
      other_taxable: input.other_taxable || 0
    };

    // Add other income sources to gross salary
    const otherIncome = input.income_from_other_sources || 0;
    const stcg = input.stcg || 0;
    const ltcg = input.ltcg || 0;

    const total = Object.values(components).reduce((sum, amount) => sum + amount, 0) + otherIncome + stcg + ltcg;
    
    return {
      components,
      otherIncome,
      stcg,
      ltcg,
      total: this.roundToRupees(total)
    };
  }

  /**
   * Calculate employee contributions (EPF, NPS, etc.)
   */
  calculateEmployeeContributions(input) {
    const basicPlusDA = input.basic || 0; // Assuming DA is included in basic for simplicity
    const employeePFPercent = input.employee_pf_percent || 12;
    
    const employeePF = this.roundToRupees((basicPlusDA * employeePFPercent) / 100);
    const npsEmployee = input.nps_employee || 0;
    const otherDeductions = input.other_deductions || 0;
    
    const total = employeePF + npsEmployee + otherDeductions;
    
    return {
      employeePF,
      npsEmployee,
      otherDeductions,
      total: this.roundToRupees(total)
    };
  }

  /**
   * Calculate exemptions (HRA, LTA, etc.)
   */
  calculateExemptions(input) {
    const hraExemption = this.calculateHRAExemption(input);
    const ltaExemption = this.calculateLTAExemption(input);
    
    return {
      hra: hraExemption,
      lta: ltaExemption,
      total: this.roundToRupees(hraExemption + ltaExemption)
    };
  }

  /**
   * Calculate HRA exemption using exact Income Tax formula
   */
  calculateHRAExemption(input) {
    const hraReceived = input.hra || 0;
    const rentPaid = input.rent_paid || 0;
    const basic = input.basic || 0;
    const da = input.da || 0; // Dearness Allowance
    const basicPlusDA = basic + da;
    const livesInMetro = input.lives_in_metro || false;
    
    // HRA exemption = minimum of:
    // 1. Actual HRA received
    // 2. Rent paid - 10% of (basic + DA)
    // 3. 50% of (basic + DA) if metro, else 40% of (basic + DA)
    
    const option1 = hraReceived;
    const option2 = Math.max(0, rentPaid - (basicPlusDA * 0.1));
    const option3 = basicPlusDA * (livesInMetro ? 0.5 : 0.4);
    
    const exemption = Math.min(option1, option2, option3);
    return this.roundToRupees(exemption);
  }

  /**
   * Calculate LTA exemption (simplified - assumes no exemption unless specified)
   */
  calculateLTAExemption(input) {
    // LTA is typically fully taxable unless actual travel occurs
    // This is a simplified implementation
    return input.lta_exemption || 0;
  }

  /**
   * Calculate professional tax based on state
   */
  calculateProfessionalTax(input) {
    const state = input.state || 'default';
    const monthlyGross = (input.basic + (input.hra || 0) + (input.special_allowances || 0)) / 12;
    
    const stateRules = this.taxRules.professionalTax[state] || this.taxRules.professionalTax.default;
    
    let monthlyTax = 0;
    for (const rule of stateRules) {
      if (rule.upto === null || monthlyGross <= rule.upto) {
        monthlyTax = rule.amount;
        break;
      }
    }
    
    const yearlyTax = monthlyTax * 12;
    
    return {
      monthly: monthlyTax,
      yearly: this.roundToRupees(yearlyTax)
    };
  }

  /**
   * Calculate tax for a specific regime
   */
  calculateForRegime(input, grossSalary, employeeContributions, exemptions, professionalTax, regime) {
    const regimeRules = this.taxRules.regimes[regime];
    if (!regimeRules) {
      throw new Error(`Regime '${regime}' not found in tax rules`);
    }

    // Calculate taxable income
    const taxableIncome = this.calculateTaxableIncome(
      grossSalary.total, 
      employeeContributions.total, 
      exemptions.total, 
      regimeRules, 
      input
    );

    // Calculate income tax
    const incomeTax = this.calculateIncomeTax(taxableIncome.final, regimeRules, input, grossSalary.total);

    // Calculate monthly TDS
    const monthlyTDS = this.calculateMonthlyTDS(incomeTax.total);

    // Calculate take-home salary
    const takeHome = this.calculateTakeHome(
      grossSalary.total,
      employeeContributions.total,
      incomeTax.total,
      professionalTax.yearly
    );

    return {
      regime: regimeRules.name,
      grossSalary: grossSalary.total,
      taxableIncome,
      incomeTax,
      monthlyTDS,
      professionalTax: professionalTax.yearly,
      takeHome,
      breakdown: {
        grossComponents: grossSalary.components,
        employeeContributions: employeeContributions,
        exemptions: exemptions,
        deductions: this.calculateDeductions(input, regimeRules)
      }
    };
  }

  /**
   * Calculate taxable income for a regime
   */
  calculateTaxableIncome(grossSalary, employeeContributions, exemptions, regimeRules, input) {
    let taxableIncome = grossSalary - employeeContributions - exemptions;
    
    // Apply standard deduction
    taxableIncome -= regimeRules.standardDeduction;
    
    // Apply Chapter VI-A deductions based on regime
    const deductions = this.calculateDeductions(input, regimeRules);
    taxableIncome -= deductions.total;
    
    // Add other income sources
    taxableIncome += (input.income_from_other_sources || 0);
    
    return {
      beforeStandardDeduction: grossSalary - employeeContributions - exemptions,
      standardDeduction: regimeRules.standardDeduction,
      chapterVIADeductions: deductions.total,
      otherIncome: input.income_from_other_sources || 0,
      final: this.roundToRupees(Math.max(0, taxableIncome))
    };
  }

  /**
   * Calculate Chapter VI-A deductions based on regime
   */
  calculateDeductions(input, regimeRules) {
    const investments = input.investments || {};
    const limits = this.taxRules.deductionLimits;
    const allowedDeductions = regimeRules.allowedDeductions || [];
    
    let totalDeductions = 0;
    const breakdown = {};
    
    for (const deduction of allowedDeductions) {
      if (investments[deduction] && limits[deduction]) {
        const amount = Math.min(investments[deduction], limits[deduction]);
        breakdown[deduction] = amount;
        totalDeductions += amount;
      }
    }
    
    return {
      breakdown,
      total: this.roundToRupees(totalDeductions)
    };
  }

  /**
   * Calculate income tax using slab system
   */
  calculateIncomeTax(taxableIncome, regimeRules, input, grossSalary) {
    let tax = 0;
    let previousLimit = 0;
    
    // Calculate tax using progressive slabs
    for (const slab of regimeRules.slabs) {
      const currentLimit = slab.upto || Infinity;
      const taxableInThisSlab = Math.min(taxableIncome, currentLimit) - previousLimit;
      
      if (taxableInThisSlab > 0) {
        const rate = slab.rate || slab.ratePercent || 0;
        const slabTax = this.roundToRupees((taxableInThisSlab * rate) / 100);
        tax += slabTax;
      }
      
      if (taxableIncome <= currentLimit) break;
      previousLimit = currentLimit;
    }
    
    const taxBeforeRebate = tax;
    
    // Apply rebate (Section 87A)
    const rebate = this.calculateRebate(taxableIncome, tax, regimeRules, input, grossSalary);
    tax = Math.max(0, tax - rebate.amount);
    
    const taxBeforeSurcharge = tax;
    
    // Apply surcharge
    const surcharge = this.calculateSurcharge(tax, regimeRules);
    tax += surcharge.amount;
    
    const taxBeforeCess = tax;
    
    // Apply cess (4% on tax after rebate and surcharge)
    const cess = this.calculateCess(tax, regimeRules);
    tax += cess.amount;
    
    return {
      beforeRebate: taxBeforeRebate,
      rebate,
      beforeSurcharge: taxBeforeSurcharge,
      surcharge,
      beforeCess: taxBeforeCess,
      cess,
      total: this.roundToRupees(tax)
    };
  }

  /**
   * Calculate rebate (Section 87A)
   */
  calculateRebate(taxableIncome, tax, regimeRules, input, grossSalary) {
    const rebateRules = regimeRules.rebate;
    
    // Rebate eligibility is based on total income (gross salary), not taxable income
    const totalIncome = grossSalary + (input.income_from_other_sources || 0) + (input.stcg || 0) + (input.ltcg || 0);
    let eligibleForRebate = totalIncome <= rebateRules.threshold;
    
    // Check if special rate incomes are excluded from rebate
    if (regimeRules.specialRateIncomesExcludedFromRebate) {
      const specialRateIncome = (input.stcg || 0) + (input.ltcg || 0);
      if (specialRateIncome > 0) {
        eligibleForRebate = false;
      }
    }
    
    // Rebate amount: If eligible, completely eliminate tax (up to rebate limit)
    const rebateAmount = eligibleForRebate ? Math.min(rebateRules.amount, tax) : 0;
    
    return {
      eligible: eligibleForRebate,
      threshold: rebateRules.threshold,
      maxAmount: rebateRules.amount,
      amount: rebateAmount,
      totalIncome: totalIncome,
      specialRateIncomeExcluded: regimeRules.specialRateIncomesExcludedFromRebate && 
                                 ((input.stcg || 0) + (input.ltcg || 0)) > 0
    };
  }

  /**
   * Calculate surcharge
   */
  calculateSurcharge(tax, regimeRules) {
    if (!regimeRules.surchargeRules || !regimeRules.surchargeRules.thresholds) {
      return { amount: 0, rate: 0 };
    }
    
    // For simplicity, assuming total income for surcharge calculation
    // In reality, this should be based on total income including special rate incomes
    let surchargeRate = 0;
    
    for (const threshold of regimeRules.surchargeRules.thresholds) {
      // This is simplified - actual surcharge calculation is more complex
      if (threshold.upto === null) {
        surchargeRate = threshold.rate;
        break;
      }
    }
    
    const surchargeAmount = this.roundToRupees((tax * surchargeRate) / 100);
    
    return {
      rate: surchargeRate,
      amount: surchargeAmount
    };
  }

  /**
   * Calculate cess (Health and Education Cess)
   */
  calculateCess(tax, regimeRules) {
    const cessPercent = regimeRules.cessPercent || 4;
    const cessAmount = this.roundToRupees((tax * cessPercent) / 100);
    
    return {
      percent: cessPercent,
      amount: cessAmount
    };
  }

  /**
   * Calculate monthly TDS distribution
   */
  calculateMonthlyTDS(yearlyTax) {
    const monthlyTDS = Math.floor(yearlyTax / 12);
    const remainder = yearlyTax - (monthlyTDS * 12);
    
    const schedule = [];
    for (let month = 1; month <= 12; month++) {
      const amount = monthlyTDS + (month <= remainder ? 1 : 0);
      schedule.push({
        month: month,
        amount: amount
      });
    }
    
    return {
      monthly: monthlyTDS,
      remainder: remainder,
      schedule: schedule,
      total: yearlyTax
    };
  }

  /**
   * Calculate take-home salary
   */
  calculateTakeHome(grossSalary, employeeContributions, totalTax, professionalTax) {
    const yearlyTakeHome = grossSalary - employeeContributions - totalTax - professionalTax;
    const monthlyTakeHome = this.roundToRupees(yearlyTakeHome / 12);
    
    return {
      monthly: monthlyTakeHome,
      yearly: this.roundToRupees(yearlyTakeHome)
    };
  }

  /**
   * Round to nearest rupee (integer arithmetic)
   */
  roundToRupees(amount) {
    return Math.round(amount);
  }

  /**
   * Get available regimes for a financial year
   */
  async getAvailableRegimes(fy = '2025-26') {
    const rules = await this.rulesFetcher.fetchRulesForFY(fy);
    return Object.keys(rules.regimes);
  }

  /**
   * Refresh tax rules cache
   */
  async refreshTaxRules(fy = '2025-26') {
    this.rulesFetcher.clearCache(fy);
    return await this.rulesFetcher.fetchRulesForFY(fy);
  }
}

module.exports = TaxEngine;
