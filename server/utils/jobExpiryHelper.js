/**
 * Helper functions for calculating job expiry (validTill) dates
 * Based on super-admin configured settings
 */

const SystemSetting = require('../models/SystemSetting');

// Cache for settings to avoid repeated database queries
let settingsCache = {};
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get system setting with caching
 */
async function getSystemSetting(key, defaultValue = null) {
  try {
    // Check cache
    const now = Date.now();
    if (cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL && settingsCache[key] !== undefined) {
      return settingsCache[key];
    }

    // Fetch from database
    const setting = await SystemSetting.findOne({ where: { key } });
    
    if (!setting) {
      // Store default in cache
      settingsCache[key] = defaultValue;
      cacheTimestamp = now;
      return defaultValue;
    }

    // Parse value based on type
    let value;
    switch (setting.type) {
      case 'number':
        value = parseFloat(setting.value);
        break;
      case 'boolean':
        value = setting.value === 'true' || setting.value === '1';
        break;
      case 'json':
        try {
          value = JSON.parse(setting.value);
        } catch (e) {
          value = defaultValue;
        }
        break;
      default:
        value = setting.value;
    }

    // Update cache
    settingsCache[key] = value;
    cacheTimestamp = now;
    return value;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Clear settings cache (call after updating settings)
 */
function clearSettingsCache() {
  settingsCache = {};
  cacheTimestamp = null;
}

/**
 * Calculate validTill (expiry date) for a job
 * Logic:
 * 1. If applicationDeadline is set: validTill = applicationDeadline + configured days
 * 2. If no applicationDeadline but publishedAt is set: validTill = publishedAt + default days (30)
 * 3. If neither: validTill = now + default days (30)
 * 
 * @param {Date|null} applicationDeadline - Application deadline date
 * @param {Date|null} publishedAt - Job published date
 * @param {Date|null} currentDate - Current date (for testing)
 * @returns {Promise<Date>} - Calculated expiry date
 */
async function calculateJobExpiry(applicationDeadline = null, publishedAt = null, currentDate = null) {
  const now = currentDate || new Date();
  
  // Get super-admin configured days (default: 30 days)
  const expiryDaysAfterDeadline = await getSystemSetting('job_expiry_days_after_deadline', 30);
  const defaultExpiryDays = await getSystemSetting('job_default_expiry_days', 30);
  
  // Priority 1: If applicationDeadline is set, calculate from that
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline);
    // Set to end of day for deadline
    deadline.setHours(23, 59, 59, 999);
    
    // Add configured days after deadline
    const expiryDate = new Date(deadline);
    expiryDate.setDate(expiryDate.getDate() + expiryDaysAfterDeadline);
    return expiryDate;
  }
  
  // Priority 2: If publishedAt is set, use that as base
  if (publishedAt) {
    const published = new Date(publishedAt);
    const expiryDate = new Date(published);
    expiryDate.setDate(expiryDate.getDate() + defaultExpiryDays);
    return expiryDate;
  }
  
  // Priority 3: Default to now + default days
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + defaultExpiryDays);
  return expiryDate;
}

/**
 * Check if a job is expired (validTill has passed)
 * @param {Date|null} validTill - Job expiry date
 * @returns {boolean}
 */
function isJobExpired(validTill) {
  if (!validTill) return false; // No expiry set means not expired
  return new Date(validTill) < new Date();
}

module.exports = {
  getSystemSetting,
  clearSettingsCache,
  calculateJobExpiry,
  isJobExpired
};



