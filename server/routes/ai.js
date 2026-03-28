const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const atsService = require('../services/atsService');
const { Job, User, Resume, WorkExperience, Education } = require('../models');

/**
 * POST /api/ai/parse-resume
 * Parses a resume file and extracts profile information
 */
router.post('/parse-resume', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'Resume ID is required' });
    }

    const resume = await Resume.findByPk(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    // Ensure the resume belongs to the user
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to resume' });
    }

    const filePath = resume.metadata?.filePath;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Resume file path not found' });
    }

    const result = await atsService.parseResumeToProfile(filePath);
    
    if (result.success) {
      res.json(result);
    } else {
      // Provide more specific error messages
      if (result.error && result.error.includes('GEMINI_API_KEY')) {
        return res.status(503).json({ 
          success: false, 
          error: 'AI service is not configured. Please contact the administrator.',
          details: 'Gemini API key is not set'
        });
      }
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error in /parse-resume:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /api/ai/job-match/:jobId
 * Calculates a match score between the user and a specific job
 */
router.get('/job-match/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Fetch job details
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const result = await atsService.calculateATSScore(userId, jobId);
    
    res.json({
      success: true,
      data: {
        score: result.atsScore,
        analysis: result.analysis,
        calculatedAt: result.calculatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error in /job-match:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /api/ai/recommendations
 * Gets personalized job recommendations for the user
 * Supports region parameter for Gulf-specific recommendations
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const region = req.query.region || null;

    const recommendations = await atsService.getRecommendedJobsForUser(userId, limit, region);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('❌ Error in /recommendations:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * POST /api/ai/generate-cover-letter
 * Generates an AI-powered cover letter for a job application
 */
router.post('/generate-cover-letter', authenticateToken, async (req, res) => {
  try {
    const { jobId, resumeId } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required' });
    }

    const result = await atsService.generateCoverLetter(userId, jobId, resumeId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error in /generate-cover-letter:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * POST /api/ai/generate-job-description
 * Generates job description, requirements, and responsibilities using AI
 */
router.post('/generate-job-description', authenticateToken, async (req, res) => {
  try {
    const { title, context = {} } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }

    const result = await atsService.generateJobDescription(title, context);
    
    if (result.success) {
      res.json(result);
    } else {
      console.error('❌ AI generate-job-description failed:', result.error || result.message);
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error in /generate-job-description:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
