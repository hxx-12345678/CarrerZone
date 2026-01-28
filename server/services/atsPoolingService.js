/**
 * ATS Pooling Service - Intelligent batching and streaming for ATS score calculation
 * 
 * Features:
 * - Intelligent batching to optimize AI usage
 * - Context window management to prevent overflow
 * - Rate limiting to avoid API throttling
 * - Progress tracking and error handling
 * - Cost optimization through smart pooling
 */

const { sequelize } = require('../config/sequelize');
const atsService = require('./atsService');

// Configuration constants
const CONFIG = {
  // Maximum tokens per request (Gemini 2.0 Flash has ~1M context window, but we use conservative limits)
  MAX_TOKENS_PER_REQUEST: 800000, // 800K tokens (conservative limit)
  ESTIMATED_TOKENS_PER_CANDIDATE: 2000, // Estimated tokens per candidate evaluation
  MAX_CANDIDATES_PER_BATCH: 10, // Maximum candidates to process in parallel
  
  // Rate limiting
  REQUESTS_PER_SECOND: 2, // Maximum requests per second to AI API
  MIN_DELAY_BETWEEN_REQUESTS: 500, // Minimum delay in milliseconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Progress update frequency
  PROGRESS_UPDATE_INTERVAL: 5, // Update progress every N candidates
};

/**
 * Estimate token usage for a candidate evaluation
 */
function estimateTokenUsage(candidate, requirement) {
  // Base tokens for prompt template
  let tokens = 1000;
  
  // Add tokens for requirement details
  if (requirement.title) tokens += requirement.title.length / 4;
  if (requirement.description) tokens += requirement.description.length / 4;
  if (requirement.keySkills) tokens += requirement.keySkills.join(' ').length / 4;
  
  // Add tokens for candidate data
  if (candidate.summary) tokens += candidate.summary.length / 4;
  if (candidate.skills) tokens += candidate.skills.join(' ').length / 4;
  if (candidate.experience_years) tokens += 50;
  
  // Add tokens for resume content (estimated)
  tokens += 500; // Estimated resume content
  
  return Math.ceil(tokens);
}

/**
 * Create a request pool with rate limiting
 */
class RequestPool {
  constructor(maxConcurrent = CONFIG.MAX_CANDIDATES_PER_BATCH) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.active = 0;
    this.lastRequestTime = 0;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const { task, resolve, reject } = this.queue.shift();
    this.active++;

    try {
      // Rate limiting: ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < CONFIG.MIN_DELAY_BETWEEN_REQUESTS) {
        await new Promise(resolve => 
          setTimeout(resolve, CONFIG.MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest)
        );
      }
      this.lastRequestTime = Date.now();

      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      // Process next item in queue
      setImmediate(() => this.process());
    }
  }
}

/**
 * Calculate ATS score with retry logic
 */
async function calculateATSScoreWithRetry(candidateId, requirementId, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await atsService.calculateATSScore(candidateId, requirementId);
      return { success: true, result, candidateId };
    } catch (error) {
      console.error(`❌ ATS calculation attempt ${attempt}/${retries} failed for candidate ${candidateId}:`, error.message);
      
      if (attempt === retries) {
        return { success: false, error: error.message, candidateId };
      }
      
      // Exponential backoff
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Stream ATS scores for candidates with intelligent pooling
 * 
 * @param {string[]} candidateIds - Array of candidate IDs to process
 * @param {string} requirementId - Requirement ID
 * @param {Object} options - Options for streaming
 * @param {Function} onProgress - Progress callback (current, total, candidateId, status, score)
 * @param {Function} onComplete - Completion callback (results, errors)
 * @param {boolean} processAll - Whether to process all candidates or just current page
 */
async function streamATSScores(
  candidateIds,
  requirementId,
  options = {},
  onProgress = null,
  onComplete = null
) {
  const {
    processAll = false,
    page = 1,
    limit = 20,
    maxConcurrent = CONFIG.MAX_CANDIDATES_PER_BATCH
  } = options;

  console.log(`🚀 Starting ATS streaming for ${candidateIds.length} candidates`);
  console.log(`📊 Configuration: processAll=${processAll}, page=${page}, limit=${limit}, maxConcurrent=${maxConcurrent}`);

  // Fetch requirement details once
  const { Requirement } = require('../config/index');
  const requirement = await Requirement.findByPk(requirementId);
  if (!requirement) {
    throw new Error('Requirement not found');
  }

  // Fetch candidate details for token estimation
  const { User } = require('../config/index');
  const candidates = await User.findAll({
    where: { id: candidateIds },
    attributes: ['id', 'summary', 'skills', 'experience_years']
  });

  // Create request pool
  const pool = new RequestPool(maxConcurrent);
  
  // Results tracking
  const results = [];
  const errors = [];
  let completedCount = 0;
  let failedCount = 0;

  // Process candidates with intelligent batching
  const processBatch = async (batch) => {
    const batchPromises = batch.map(async (candidateId) => {
      try {
        // Add to pool for rate-limited processing
        const result = await pool.add(async () => {
          return await calculateATSScoreWithRetry(candidateId, requirementId);
        });

        if (result.success) {
          completedCount++;
          results.push(result.result);
          
          // Call progress callback
          if (onProgress) {
            onProgress({
              current: completedCount + failedCount,
              total: candidateIds.length,
              candidateId: result.candidateId,
              status: 'completed',
              score: result.result.atsScore,
              completed: completedCount,
              failed: failedCount
            });
          }
        } else {
          failedCount++;
          errors.push({
            candidateId: result.candidateId,
            error: result.error
          });
          
          // Call progress callback for errors
          if (onProgress) {
            onProgress({
              current: completedCount + failedCount,
              total: candidateIds.length,
              candidateId: result.candidateId,
              status: 'error',
              error: result.error,
              completed: completedCount,
              failed: failedCount
            });
          }
        }
      } catch (error) {
        failedCount++;
        errors.push({
          candidateId,
          error: error.message
        });
        
        if (onProgress) {
          onProgress({
            current: completedCount + failedCount,
            total: candidateIds.length,
            candidateId,
            status: 'error',
            error: error.message,
            completed: completedCount,
            failed: failedCount
          });
        }
      }
    });

    await Promise.all(batchPromises);
  };

  // Process candidates in batches
  const batchSize = maxConcurrent;
  for (let i = 0; i < candidateIds.length; i += batchSize) {
    const batch = candidateIds.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(candidateIds.length / batchSize)} (${batch.length} candidates)`);
    
    await processBatch(batch);
    
    // Small delay between batches to avoid overwhelming the system
    if (i + batchSize < candidateIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`✅ ATS streaming completed: ${completedCount} successful, ${failedCount} failed`);

  // Call completion callback
  if (onComplete) {
    onComplete({
      successful: results,
      errors,
      total: candidateIds.length,
      completed: completedCount,
      failed: failedCount
    });
  }

  return {
    successful: results,
    errors,
    total: candidateIds.length,
    completed: completedCount,
    failed: failedCount
  };
}

/**
 * Get all candidate IDs for a requirement (for "Stream ATS (All)")
 * Uses the same matching logic as the main candidates endpoint
 */
async function getAllCandidateIdsForRequirement(requirementId, page = 1, limit = 100) {
  const { Requirement, User } = require('../config/index');
  const { Op } = require('sequelize');
  const sequelizeDB = require('../config/sequelize').sequelize;

  const requirement = await Requirement.findByPk(requirementId, {
    attributes: [
      'id',
      'title',
      'description',
      'experience_min',
      'experience_max',
      'salary_min',
      'salary_max',
      'required_skills',
      'preferred_skills',
      'location_type',
      'metadata'
    ]
  });
  
  if (!requirement) {
    throw new Error('Requirement not found');
  }

  // Parse metadata if it's a string
  let metadata = {};
  if (requirement.metadata) {
    try {
      metadata = typeof requirement.metadata === 'string' 
        ? JSON.parse(requirement.metadata) 
        : requirement.metadata;
    } catch (e) {
      console.warn('⚠️ Could not parse requirement metadata:', e);
    }
  }

  // Get experience range - use the actual column names from DB
  let workExperienceMin = requirement.experience_min;
  let workExperienceMax = requirement.experience_max;

  // Build base where clause
  const whereClause = {
    user_type: 'jobseeker',
    account_status: 'active',
    is_active: true
  };

  // Experience range matching
  if (workExperienceMin !== null && workExperienceMin !== undefined) {
    const minExp = Number(workExperienceMin);
    const maxExp = workExperienceMax !== null && workExperienceMax !== undefined 
      ? Number(workExperienceMax) : 50;
    
    whereClause.experience_years = {
      [Op.and]: [
        { [Op.gte]: minExp },
        { [Op.lte]: maxExp }
      ]
    };
  }

  // Build matching conditions (same logic as main endpoint)
  const matchingConditions = [];

  // Skills matching - use required_skills and preferred_skills
  const allSkills = [];
  if (requirement.required_skills && Array.isArray(requirement.required_skills)) {
    allSkills.push(...requirement.required_skills);
  }
  if (requirement.preferred_skills && Array.isArray(requirement.preferred_skills)) {
    allSkills.push(...requirement.preferred_skills);
  }
  
  if (allSkills.length > 0) {
    const skillsArray = allSkills;
    matchingConditions.push({
      [Op.or]: [
        sequelizeDB.where(
          sequelizeDB.cast(sequelizeDB.col('skills'), 'text'),
          { [Op.iLike]: { [Op.any]: skillsArray.map(skill => `%${skill}%`) } }
        ),
        sequelizeDB.where(
          sequelizeDB.cast(sequelizeDB.col('key_skills'), 'text'),
          { [Op.iLike]: { [Op.any]: skillsArray.map(skill => `%${skill}%`) } }
        )
      ]
    });
  }

  // Location matching
  const requirementLocations = (requirement.metadata?.candidateLocations) || (requirement.metadata?.candidate_locations) || [];
  if (requirementLocations && Array.isArray(requirementLocations) && requirementLocations.length > 0) {
    const locationsArray = requirementLocations;
    matchingConditions.push({
      [Op.or]: [
        { current_location: { [Op.iLike]: { [Op.any]: locationsArray.map(loc => `%${loc}%`) } } },
        { willing_to_relocate: true },
        sequelizeDB.where(
          sequelizeDB.cast(sequelizeDB.col('preferred_locations'), 'text'),
          { [Op.iLike]: { [Op.any]: locationsArray.map(loc => `%${loc}%`) } }
        )
      ]
    });
  }

  // Combine matching conditions with AND logic
  if (matchingConditions.length > 0) {
    whereClause[Op.and] = whereClause[Op.and] || [];
    whereClause[Op.and].push(...matchingConditions);
  }

  // Get total count
  const totalCandidates = await User.count({ where: whereClause });

  // Get candidate IDs with pagination
  const candidates = await User.findAll({
    where: whereClause,
    attributes: ['id'],
    limit: parseInt(limit),
    offset: (page - 1) * parseInt(limit),
    order: [['created_at', 'DESC']]
  });

  return {
    candidateIds: candidates.map(c => c.id),
    totalCandidates,
    hasMorePages: (page * parseInt(limit)) < totalCandidates,
    currentPage: page,
    limit: parseInt(limit)
  };
}

module.exports = {
  streamATSScores,
  getAllCandidateIdsForRequirement,
  CONFIG
};

