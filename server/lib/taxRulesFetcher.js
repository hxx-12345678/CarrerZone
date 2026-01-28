const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class TaxRulesFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.configDir = path.join(__dirname, '..', 'config');
  }

  /**
   * Fetch tax rules for a specific financial year
   * @param {string} fy - Financial year (e.g., "2025-26")
   * @returns {Promise<Object>} Tax rules configuration
   */
  async fetchRulesForFY(fy) {
    try {
      // Check cache first
      const cached = this.getFromCache(fy);
      if (cached) {
        console.log(`📋 Using cached tax rules for FY ${fy}`);
        return cached;
      }

      console.log(`🔄 Fetching tax rules for FY ${fy}...`);
      
      // Try to fetch from official sources
      let rules = null;
      try {
        rules = await this.fetchFromOfficialSources(fy);
        if (rules) {
          console.log(`✅ Successfully fetched tax rules for FY ${fy} from official sources`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch from official sources: ${error.message}`);
      }

      // Fall back to default config if fetch failed
      if (!rules) {
        console.log(`📄 Using default tax rules for FY ${fy}`);
        console.log(`ℹ️  Note: Government websites may not provide machine-readable tax data.`);
        console.log(`ℹ️  Using pre-configured rules based on official Income Tax Department guidelines.`);
        rules = await this.loadDefaultRules(fy);
      }

      // Validate and enhance rules
      const validatedRules = this.validateAndEnhanceRules(rules, fy);
      
      // Cache the rules
      this.setCache(fy, validatedRules);
      
      // Save to file for persistence
      await this.saveRulesToFile(fy, validatedRules);
      
      return validatedRules;
    } catch (error) {
      console.error(`❌ Error fetching tax rules for FY ${fy}:`, error);
      throw new Error(`Failed to fetch tax rules for FY ${fy}: ${error.message}`);
    }
  }

  /**
   * Fetch rules from official government sources
   */
  async fetchFromOfficialSources(fy) {
    // For now, skip fetching from government sources as they return HTML
    // and would require complex parsing. Use default rules instead.
    console.log(`📄 Skipping government source fetch for FY ${fy} - using default rules`);
    return null;
  }

  /**
   * Parse HTML response to extract tax rules
   */
  parseHTMLResponse(html, fy) {
    // This is a simplified parser - in production, you'd use a proper HTML parser
    // like cheerio or jsdom to extract specific tax information
    
    // For now, we'll return null to trigger fallback to default rules
    // In a real implementation, you'd parse the HTML to extract:
    // - Tax slabs
    // - Standard deduction amounts
    // - Rebate thresholds and amounts
    // - Allowed deductions
    
    return null;
  }

  /**
   * Load default rules from config file
   */
  async loadDefaultRules(fy = '2025-26') {
    // Try to load FY-specific rules first
    const fyConfigPath = path.join(this.configDir, `tax-rules-${fy}.json`);
    try {
      const data = await fs.readFile(fyConfigPath, 'utf8');
      console.log(`📄 Loaded FY-specific tax rules from tax-rules-${fy}.json`);
      return JSON.parse(data);
    } catch (error) {
      console.log(`📄 FY-specific rules not found, falling back to default rules`);
    }
    
    // Fall back to default rules
    const configPath = path.join(this.configDir, 'tax-rules-default.json');
    try {
      const data = await fs.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load default tax rules: ${error.message}`);
    }
  }

  /**
   * Validate and enhance rules
   */
  validateAndEnhanceRules(rules, fy) {
    const validated = {
      ...rules,
      fy: fy,
      fetchedAt: new Date().toISOString(),
      source: rules.source || 'default-config'
    };

    // Validate required fields
    if (!validated.regimes) {
      throw new Error('Tax rules must contain regimes');
    }

    // Validate each regime
    for (const [regimeName, regime] of Object.entries(validated.regimes)) {
      if (!regime.slabs || !Array.isArray(regime.slabs)) {
        throw new Error(`Regime ${regimeName} must have slabs array`);
      }
      
      if (!regime.standardDeduction || typeof regime.standardDeduction !== 'number') {
        throw new Error(`Regime ${regimeName} must have standardDeduction`);
      }
      
      if (!regime.rebate || !regime.rebate.threshold || !regime.rebate.amount) {
        throw new Error(`Regime ${regimeName} must have rebate configuration`);
      }
    }

    return validated;
  }

  /**
   * Save rules to file
   */
  async saveRulesToFile(fy, rules) {
    const filename = `tax-rules-${fy.replace('-', '-')}.json`;
    const filepath = path.join(this.configDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(rules, null, 2), 'utf8');
      console.log(`💾 Saved tax rules to ${filename}`);
    } catch (error) {
      console.warn(`⚠️ Failed to save rules to file: ${error.message}`);
    }
  }

  /**
   * Cache management
   */
  getFromCache(fy) {
    const cached = this.cache.get(fy);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  setCache(fy, data) {
    this.cache.set(fy, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for a specific FY or all
   */
  clearCache(fy = null) {
    if (fy) {
      this.cache.delete(fy);
      console.log(`🗑️ Cleared cache for FY ${fy}`);
    } else {
      this.cache.clear();
      console.log(`🗑️ Cleared all cache`);
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    const status = {};
    for (const [fy, cached] of this.cache.entries()) {
      status[fy] = {
        cached: true,
        age: Date.now() - cached.timestamp,
        ttl: this.cacheTTL,
        expired: (Date.now() - cached.timestamp) >= this.cacheTTL
      };
    }
    return status;
  }
}

module.exports = TaxRulesFetcher;
