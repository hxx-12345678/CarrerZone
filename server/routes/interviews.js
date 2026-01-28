const express = require('express');
const router = express.Router();
const EmployerActivityService = require('../services/employerActivityService');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = require('../config/index');
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Create interview
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      jobApplicationId, 
      candidateId, 
      jobId, 
      title, 
      description, 
      interviewType, 
      scheduledAt, 
      duration, 
      timezone, 
      location, 
      meetingLink, 
      meetingPassword, 
      interviewers, 
      agenda, 
      requirements, 
      notes 
    } = req.body;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only employers can schedule interviews.' 
      });
    }

    const { Interview, JobApplication, User, Job } = require('../config/index');

    // Verify the job application exists and belongs to the employer
    const jobApplication = await JobApplication.findOne({
      where: { 
        id: jobApplicationId,
        employerId: req.user.id 
      },
      include: [
        { model: Job, as: 'job' },
        { model: User, as: 'applicant' }
      ]
    });

    if (!jobApplication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job application not found or access denied' 
      });
    }

    // Verify candidate exists
    const candidate = await User.findOne({
      where: { 
        id: candidateId,
        user_type: 'jobseeker',
        is_active: true 
      }
    });

    if (!candidate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidate not found' 
      });
    }

    // Normalize enums to DB values
    const normalizeInterviewType = (val) => {
      if (!val) return undefined;
      const map = { in_person: 'in-person', 'in person': 'in-person', In_person: 'in-person' };
      return map[val] || val;
    };
    const normalizedInterviewType = (val => {
      const map = { 'in-person': 'in_person', in_person: 'in_person', 'in person': 'in_person', In_person: 'in_person' };
      return map[val] || val;
    })(interviewType);

    // Create the interview
    const interview = await Interview.create({
      jobApplicationId,
      employerId: req.user.id,
      candidateId: candidateId || jobApplication.userId, // Use provided candidateId or from application
      jobId: jobId || jobApplication.jobId,
      title: title || `${(normalizedInterviewType || 'phone').charAt(0).toUpperCase() + (normalizedInterviewType || 'phone').slice(1)} Interview`,
      description,
      interviewType: normalizedInterviewType,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      timezone: timezone || 'UTC',
      location: location || {},
      meetingLink,
      meetingPassword,
      interviewers: interviewers || [],
      agenda: agenda || [],
      requirements: requirements || {},
      notes,
      status: 'scheduled'
    });

    // Update job application status to interview_scheduled
    await jobApplication.update({
      status: 'interview_scheduled',
      interviewScheduledAt: new Date(scheduledAt),
      lastUpdatedAt: new Date()
    });

    // Create notification for candidate
    const { Notification } = require('../config/index');
    await Notification.create({
      userId: candidateId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `You have an interview scheduled for ${interview.title} on ${new Date(scheduledAt).toLocaleDateString()}`,
      metadata: {
        interviewId: interview.id,
        jobApplicationId,
        scheduledAt,
        interviewType,
        location,
        meetingLink
      },
      isRead: false
    });

    console.log(`✅ Interview scheduled for candidate ${candidateId} by employer ${req.user.id}`);

    // Log interview scheduling activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logInterviewScheduled(
        req.user.id,
        interview.id,
        candidateId,
        {
          applicationId: jobApplicationId,
          jobId: jobApplication.jobId,
          scheduledAt: scheduledAt,
          interviewType: normalizedInterviewType,
          location: location,
          meetingLink: meetingLink,
          candidateName: candidate.first_name + ' ' + candidate.last_name,
          jobTitle: jobApplication.job?.title || 'Unknown Job',
          companyName: req.user.company?.name || 'Unknown Company'
        }
      );
    } catch (e) {
      console.error('⚠️ Failed to log interview_scheduled activity:', e?.message || e);
    }

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        interview,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email
        },
        job: {
          id: jobApplication.job?.id,
          title: jobApplication.job?.title
        }
      }
    });

  } catch (error) {
    console.error('❌ Error scheduling interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message
    });
  }
});

// Get interviews for employer
router.get('/employer', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only employers can view interviews.' 
      });
    }

    const { Interview, JobApplication, User, Job } = require('../config/index');
    const { status, page = 1, limit = 10 } = req.query;

    console.log('🔍 Employer interviews request:', { status, page, limit, employerId: req.user.id });

    const whereClause = { employerId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    console.log('🔍 Where clause:', whereClause);

    const interviews = await Interview.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: JobApplication,
          as: 'jobApplication',
          attributes: ['id','status','appliedAt'],
          include: [
            { model: Job, as: 'job', attributes: ['id','title'] },
            { model: User, as: 'applicant', attributes: ['id','first_name','last_name','email'] }
          ]
        }
      ],
      order: [['scheduledAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    console.log('🔍 Found interviews:', interviews.count, 'rows:', interviews.rows.length);
    if (interviews.rows.length > 0) {
      console.log('🔍 First interview:', JSON.stringify(interviews.rows[0], null, 2));
    }

    res.json({
      success: true,
      data: {
        interviews: interviews.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: interviews.count,
          pages: Math.ceil(interviews.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
});

// Get interviews for candidate
router.get('/candidate', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'jobseeker') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only jobseekers can view their interviews.' 
      });
    }

    const { Interview, JobApplication, User, Job } = require('../config/index');
    const { status, page = 1, limit = 10 } = req.query;

    const whereClause = { candidateId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const interviews = await Interview.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'description', 'location', 'companyId']
        },
        {
          model: User,
          as: 'employer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['scheduledAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        interviews: interviews.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: interviews.count,
          pages: Math.ceil(interviews.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching candidate interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
});

// Update interview
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.interviewType) {
      const map = { in_person: 'in-person', 'in person': 'in-person', In_person: 'in-person' };
      updateData.interviewType = map[updateData.interviewType] || updateData.interviewType;
    }

    const { Interview, JobApplication } = require('../config/index');

    // Find the interview
    const interview = await Interview.findOne({
      where: { id },
      include: [{ model: JobApplication, as: 'jobApplication' }]
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        message: 'Interview not found' 
      });
    }

    // Check permissions
    if (req.user.user_type === 'employer' && interview.employerId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    if (req.user.user_type === 'jobseeker' && interview.candidateId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Store old data for logging
    const oldData = {
      status: interview.status,
      scheduledAt: interview.scheduledAt,
      interviewType: interview.interviewType,
      location: interview.location,
      meetingLink: interview.meetingLink
    };

    // Update the interview
    await interview.update(updateData);

    // If status changed to confirmed, update job application
    if (updateData.status === 'confirmed' && interview.jobApplication) {
      await interview.jobApplication.update({
        status: 'interview_scheduled',
        lastUpdatedAt: new Date()
      });
    }

    // Log interview update activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logInterviewUpdated(
        req.user.id,
        interview.id,
        interview.candidateId,
        {
          applicationId: interview.jobApplicationId,
          jobId: interview.jobId,
          oldStatus: oldData.status,
          newStatus: updateData.status || oldData.status,
          changes: updateData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    } catch (activityError) {
      console.error('Failed to log interview update activity:', activityError);
      // Don't fail the update if activity logging fails
    }

    res.json({
      success: true,
      message: 'Interview updated successfully',
      data: interview
    });

  } catch (error) {
    console.error('❌ Error updating interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview',
      error: error.message
    });
  }
});

// Cancel interview
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { Interview, JobApplication, Notification } = require('../config/index');

    // Find the interview
    const interview = await Interview.findOne({
      where: { id },
      include: [{ model: JobApplication, as: 'jobApplication' }]
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        message: 'Interview not found' 
      });
    }

    // Check permissions (only employer or admin can cancel)
    if ((req.user.user_type !== 'employer' && req.user.user_type !== 'admin') || interview.employerId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only employers and admins can cancel interviews.' 
      });
    }

    // Update interview status
    await interview.update({
      status: 'cancelled',
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    // Update job application status back to shortlisted
    if (interview.jobApplication) {
      await interview.jobApplication.update({
        status: 'shortlisted',
        lastUpdatedAt: new Date()
      });
    }

    // Create notification for candidate
    await Notification.create({
      userId: interview.candidateId,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: `Your interview for ${interview.title} has been cancelled.${reason ? ' Reason: ' + reason : ''}`,
      metadata: {
        interviewId: interview.id,
        reason
      },
      isRead: false
    });

    res.json({
      success: true,
      message: 'Interview cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Error cancelling interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel interview',
      error: error.message
    });
  }
});

// Get interview details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { Interview, JobApplication, User, Job } = require('../config/index');

    const interview = await Interview.findOne({
      where: { id },
      include: [
        {
          model: JobApplication,
          as: 'jobApplication',
          include: [
            { model: Job, as: 'job' },
            { model: User, as: 'applicant' },
            { model: User, as: 'employer' }
          ]
        }
      ]
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        message: 'Interview not found' 
      });
    }

    // Check permissions
    if (req.user.user_type === 'employer' && interview.employerId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    if (req.user.user_type === 'jobseeker' && interview.candidateId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: interview
    });

  } catch (error) {
    console.error('❌ Error fetching interview details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview details',
      error: error.message
    });
  }
});

module.exports = router;
