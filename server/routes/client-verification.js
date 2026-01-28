const express = require('express');
const router = express.Router();
const { AgencyClientAuthorization, Company, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   GET /api/client/verify-authorization
 * @desc    Client verifies or rejects agency authorization
 * @access  Public (token-based)
 */
router.get('/verify-authorization', async (req, res) => {
  try {
    const { token, action } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either approve or reject'
      });
    }
    
    // Find authorization by token
    const authorization = await AgencyClientAuthorization.findOne({
      where: {
        clientVerificationToken: token,
        clientVerificationTokenExpiry: {
          [Op.gt]: new Date() // Token must not be expired
        }
      },
      include: [
        {
          model: Company,
          as: 'AgencyCompany',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Company,
          as: 'ClientCompany',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!authorization) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Check if already confirmed/rejected
    if (authorization.clientConfirmedAt) {
      return res.status(400).json({
        success: false,
        message: 'Authorization has already been confirmed/rejected',
        data: {
          action: authorization.clientVerificationAction,
          confirmedAt: authorization.clientConfirmedAt
        }
      });
    }
    
    // Update authorization based on action
    if (action === 'approve') {
      authorization.clientConfirmedAt = new Date();
      authorization.clientVerificationAction = 'approved';
      authorization.status = 'pending_admin_review'; // Move to admin review after client approves
      
      await authorization.save();
      
      // TODO: Send notification to agency and admin
      
      return res.status(200).json({
        success: true,
        message: 'Authorization approved successfully. Thank you for confirming. Our admin team will complete the verification process.',
        data: {
          clientCompany: authorization.ClientCompany?.name,
          agency: authorization.AgencyCompany?.name,
          status: authorization.status
        }
      });
    } else if (action === 'reject') {
      authorization.clientConfirmedAt = new Date();
      authorization.clientVerificationAction = 'rejected';
      authorization.status = 'rejected';
      authorization.rejectionReason = 'Rejected by client company';
      authorization.canPostJobs = false;
      
      await authorization.save();
      
      // TODO: Send notification to agency and admin about rejection
      
      return res.status(200).json({
        success: true,
        message: 'Authorization rejected successfully. The agency has been notified.',
        data: {
          clientCompany: authorization.ClientCompany?.name,
          agency: authorization.AgencyCompany?.name,
          status: authorization.status
        }
      });
    }
  } catch (error) {
    console.error('Client verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process verification',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/client/authorization-details/:id
 * @desc    Get authorization details (for client to review)
 * @access  Public (for transparency)
 */
router.get('/authorization-details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const authorization = await AgencyClientAuthorization.findByPk(id, {
      attributes: [
        'id',
        'status',
        'contractStartDate',
        'contractEndDate',
        'maxActiveJobs',
        'jobCategories',
        'allowedLocations',
        'clientContactEmail',
        'clientContactName',
        'created_at'
      ],
      include: [
        {
          model: Company,
          as: 'AgencyCompany',
          attributes: ['id', 'name', 'industry', 'city', 'website']
        },
        {
          model: Company,
          as: 'ClientCompany',
          attributes: ['id', 'name', 'industry', 'city']
        }
      ]
    });
    
    if (!authorization) {
      return res.status(404).json({
        success: false,
        message: 'Authorization not found'
      });
    }
    
    res.json({
      success: true,
      data: authorization
    });
  } catch (error) {
    console.error('Get authorization details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get authorization details',
      error: error.message
    });
  }
});

module.exports = router;


