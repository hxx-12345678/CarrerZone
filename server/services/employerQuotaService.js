const { sequelize } = require('../config/sequelize');
const EmployerQuota = require('../models/EmployerQuota');
const EmployerActivityService = require('./employerActivityService');

const QUOTA_TYPES = {
  JOB_POSTINGS: 'job_postings',
  RESUME_VIEWS: 'resume_views',
  REQUIREMENTS_POSTED: 'requirements_posted',
  PROFILE_VISITS: 'profile_visits',
  RESUME_SEARCH: 'resume_search'
};

class EmployerQuotaService {
  static get QUOTA_TYPES() {
    return QUOTA_TYPES;
  }

  static async getOrCreateQuota(userId, quotaType, defaultLimit) {
    const [quota] = await EmployerQuota.findOrCreate({
      where: { userId, quotaType },
      defaults: { userId, quotaType, used: 0, limit: typeof defaultLimit === 'number' ? defaultLimit : 0 }
    });
    return quota;
  }

  static async checkAndConsume(userId, quotaType, options = {}) {
    const { activityType, details, jobId, applicationId, defaultLimit, timestamp } = options;

    const transaction = await sequelize.transaction();
    try {
      let quota = await EmployerQuota.findOne({
        where: { userId, quotaType },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!quota) {
        if (typeof defaultLimit === 'number') {
          quota = await EmployerQuota.create({ userId, quotaType, used: 0, limit: defaultLimit }, { transaction });
        } else {
          const err = new Error('Quota not found');
          err.code = 'QUOTA_NOT_FOUND';
          throw err;
        }
      }

      if (quota.limit <= quota.used) {
        const err = new Error('Quota limit exceeded');
        err.code = 'QUOTA_LIMIT_EXCEEDED';
        throw err;
      }

      await quota.increment('used', { by: 1, transaction });

      await EmployerActivityService.logActivity(
        userId,
        activityType || `quota_consume:${quotaType}`,
        { details: details || {}, jobId, applicationId, timestamp }
      );

      await transaction.commit();
      return { success: true, quota: { used: quota.used + 1, limit: quota.limit } };
    } catch (error) {
      try { await transaction.rollback(); } catch (_) {}
      throw error;
    }
  }

  static async ensureWithinQuota(userId, quotaType) {
    const quota = await EmployerQuota.findOne({ where: { userId, quotaType } });
    if (!quota) {
      const err = new Error('Quota not found');
      err.code = 'QUOTA_NOT_FOUND';
      throw err;
    }
    if (quota.limit <= quota.used) {
      const err = new Error('Quota limit exceeded');
      err.code = 'QUOTA_LIMIT_EXCEEDED';
      throw err;
    }
    return true;
  }

  static async consume(userId, quotaType, amount = 1, options = {}) {
    const { activityType, details, jobId, applicationId, timestamp } = options;
    const transaction = await sequelize.transaction();
    try {
      const quota = await EmployerQuota.findOne({ where: { userId, quotaType }, transaction, lock: transaction.LOCK.UPDATE });
      if (!quota) {
        const err = new Error('Quota not found');
        err.code = 'QUOTA_NOT_FOUND';
        throw err;
      }
      if (quota.used + amount > quota.limit) {
        const err = new Error('Quota limit exceeded');
        err.code = 'QUOTA_LIMIT_EXCEEDED';
        throw err;
      }
      await quota.increment('used', { by: amount, transaction });
      await EmployerActivityService.logActivity(userId, activityType || `quota_consume:${quotaType}`, { details: details || {}, jobId, applicationId, timestamp });
      await transaction.commit();
      return { success: true, quota: { used: quota.used + amount, limit: quota.limit } };
    } catch (error) {
      try { await transaction.rollback(); } catch (_) {}
      throw error;
    }
  }
}

module.exports = EmployerQuotaService;


